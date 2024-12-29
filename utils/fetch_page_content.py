# utils/fetch_page_content.py
import requests
from bs4 import BeautifulSoup

def fetch_page_content(url):
    """Fetch and extract text content from a webpage."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch {url}: Status {response.status_code}")
            return None
        soup = BeautifulSoup(response.text, 'html.parser')
        # Extract text from paragraphs
        paragraphs = soup.find_all('p')
        content = '\n'.join([para.get_text() for para in paragraphs])
        
        return content
    except Exception as e:
        print(f"Exception while fetching page content from {url}: {e}")
        return None
