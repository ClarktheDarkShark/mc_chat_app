# utils/fetch_page_content.py
import aiohttp
from bs4 import BeautifulSoup

async def fetch_page_content(url):
    """Fetch and extract text content from a webpage."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    print(f"Failed to fetch {url}: Status {response.status}")
                    return None
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                # Extract text from paragraphs
                paragraphs = soup.find_all('p')
                content = '\n'.join([para.get_text() for para in paragraphs])
                return content
    except Exception as e:
        print(f"Exception while fetching page content from {url}: {e}")
        return None
