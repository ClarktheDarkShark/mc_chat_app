import requests
from bs4 import BeautifulSoup
from io import BytesIO
from PyPDF2 import PdfReader  # Use PyPDF2 or PyMuPDF (fitz)

def fetch_page_content(url):
    """Fetch and extract text content from a webpage or PDF."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch {url}: Status {response.status_code}")
            return None

        # Check if the response is a PDF by content type
        content_type = response.headers.get('Content-Type', '')
        if 'application/pdf' in content_type or url.lower().endswith('.pdf'):
            # Handle PDF content
            pdf_text = extract_pdf_text(response.content)
            print("\nfetch_page_content (PDF)\n", pdf_text[:500])  # Print first 500 characters
            return pdf_text
        else:
            # Handle HTML content
            soup = BeautifulSoup(response.text, 'html.parser')
            paragraphs = soup.find_all('p')
            content = '\n'.join([para.get_text() for para in paragraphs])
            print("\nfetch_page_content (HTML)\n", content[:500])  # Print first 500 characters
            return content
    except Exception as e:
        print(f"Exception while fetching page content from {url}: {e}")
        return None


def extract_pdf_text(pdf_bytes):
    """Extract text from PDF bytes."""
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""  # Extract text or empty string
        return text
    except Exception as e:
        print(f"Failed to extract text from PDF: {e}")
        return None
