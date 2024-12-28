# cogs/web_search.py
import os
import json
import aiohttp
import validators
from utils.fetch_page_content import fetch_page_content

class WebSearchCog:
    def __init__(self):
        self.search_api_key = os.getenv('GOOGLE_API_KEY')
        self.search_engine_id = os.getenv('SEARCH_ENGINE_ID')
        self.search_url = "https://www.googleapis.com/customsearch/v1"

    def web_search(self, query):
        """Perform a web search using the Google Custom Search API."""
        if validators.url(query):
            content = fetch_page_content(query)
            if content:
                return content[:3000]  # Limit content length
            else:
                return "Couldn't fetch information from the provided URL."
        else:
            params = {
                "key": self.search_api_key,
                "cx": self.search_engine_id,
                "q": query,
            }

            with aiohttp.ClientSession() as session:
                with session.get(self.search_url, params=params) as search_response:
                    if search_response.status == 200:
                        search_results = search_response.json()
                        return self.fetch_search_content(search_results)
                    else:
                        error_content = search_response.text()
                        print(f"Error fetching search results: {search_response.status}")
                        print(f"Error details: {error_content}")
                        return "An error occurred while performing the web search."

    def fetch_search_content(self, search_results):
        """Fetch content from search results."""
        if not search_results:
            return "Couldn't fetch information from the internet."
        
        items = search_results.get('items', [])
        if not items:
            return "No search results found."

        urls = [item.get('link') for item in items[:2] if item.get('link')]
        if not urls:
            return "No valid URLs found in search results."

        contents = []
        for url in urls:
            print(f"Fetching content from {url}")
            content = fetch_page_content(url)
            if content:
                contents.append(content[:3000])  # Limit content length

        return '\n'.join(contents) if contents else "No detailed information found."
