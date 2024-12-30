# cogs/web_search.py
import os
import json
import requests
import validators
import pytz
from datetime import datetime, timedelta
from datetime import time as dt_time

# Remove direct import of openai
# from utils.fetch_page_content import fetch_page_content  # Ensure this is synchronous

from utils.fetch_page_content import fetch_page_content  # Ensure this is synchronous

est = pytz.timezone('America/New_York')
current_date = datetime.now(est).strftime("%Y-%m-%d")
current_time = datetime.now(est)

class WebSearchCog:
    def __init__(self, openai_client):
        """
        Initialize WebSearchCog with an existing OpenAI client.

        :param openai_client: An instance of the OpenAI client to use for generating search terms.
        """
        self.openai_client = openai_client
        self.search_api_key = os.getenv('GOOGLE_API_KEY')
        self.search_engine_id = os.getenv('SEARCH_ENGINE_ID')
        self.search_url = "https://www.googleapis.com/customsearch/v1"

    def generate_search_terms(self, user_input, history):
        """
        Use the provided OpenAI client to generate optimized search terms from user input.
        """
        prompt = (
            f"Prepare key search terms for a Google internet search based on the user input and conversation history. This should be extremely short and useful in an internet search. The current date, if relevent, is {current_date}. Rarely include the date, only when absolutely essetial. Do not include the date if 'recent' is included. Prefer .mil domains."
        )

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Specify the desired model
                messages=[
                    {"role": "system", "content": prompt},
                    *history,
                    {"role": "user", "content": f"User Input: {user_input}\n"}
                ],
                max_tokens=60,
                n=1,
                stop=None,
                temperature=0.4,
            )
            # Extract the generated search terms
            search_terms = response.choices[0].message.content
            # Optionally, parse the search terms if they're in a list format
            # For simplicity, assume the LLM returns a comma-separated string
            optimized_query = search_terms.split('\n')[0]  # Take the first line
            return optimized_query
        except Exception as e:
            print(f"Error generating search terms with LLM: {e}")
            # Fallback to original query if LLM fails
            return user_input

    def web_search(self, query, history):
        """Perform a web search using the Google Custom Search API."""
        # First, generate optimized search terms using the LLM
        optimized_query = self.generate_search_terms(query, history)
        print(f"Query: {query}\n")
        print(f"Optimized Query: {optimized_query}")

        if validators.url(optimized_query):
            content = fetch_page_content(optimized_query)
            if content:
                return content[:3000]  # Limit content length
            else:
                return "Couldn't fetch information from the provided URL."
        else:
            params = {
                "key": self.search_api_key,
                "cx": self.search_engine_id,
                "q": optimized_query,
            }

            try:
                response = requests.get(self.search_url, params=params, timeout=10)
                if response.status_code == 200:
                    search_results = response.json()
                    return self.fetch_search_content(search_results)
                else:
                    error_content = response.text
                    print(f"Error fetching search results: {response.status_code}")
                    print(f"Error details: {error_content}")
                    return "An error occurred while performing the web search."
            except Exception as e:
                print(f"Exception during web search: {e}")
                return "An error occurred while performing the web search."

    def fetch_search_content(self, search_results):
        """Fetch content from search results."""
        if not search_results:
            return "Couldn't fetch information from the internet."
        
        items = search_results.get('items', [])
        if not items:
            return "No search results found."

        urls = [item.get('link') for item in items[:5] if item.get('link')]
        if not urls:
            return "No valid URLs found in search results."

        contents = []
        for url in urls:
            print(f"Fetching content from {url}")
            content = fetch_page_content(url)
            # print('og content', content)
            if content:
                content = f"From {url}:" + content
            # print('new content', content)
            if content:
                contents.append(content[:3000])  # Limit content length

        return '\n'.join(contents) if contents else "No detailed information found."
