import requests
from bs4 import BeautifulSoup
from io import BytesIO
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
import pytesseract


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
    """Extract text from PDF bytes, handle encrypted or image-based PDFs."""
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        text = ""

        # Handle encrypted PDFs
        if reader.is_encrypted:
            try:
                reader.decrypt("")  # Attempt empty password decryption
                print("PDF was encrypted but successfully decrypted.")
            except Exception as e:
                print(f"Failed to decrypt PDF: {e}")
                return "[Encrypted PDF - Unable to extract text]"

        # Extract text from each page
        for page in reader.pages:
            if page.extract_text():
                text += page.extract_text()
            else:
                print("Page contains no extractable text, attempting OCR...")
                ocr_text = extract_text_with_ocr(pdf_bytes)
                return ocr_text

        return text if text else "[No text extracted from PDF]"
    except Exception as e:
        print(f"Failed to extract text from PDF: {e}")
        return extract_text_with_ocr(pdf_bytes)  # Fallback to OCR if extraction fails


def extract_text_with_ocr(pdf_bytes):
    """Extract text from PDF using OCR (for image-based PDFs)."""
    try:
        images = convert_from_bytes(pdf_bytes)
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img)
        return text if text else "[OCR could not extract text]"
    except Exception as e:
        print(f"OCR extraction failed: {e}")
        return "[Failed to extract text with OCR]"


# Example usage
if __name__ == "__main__":
    url = "https://www.marines.mil/Portals/1/Publications/USMC%20AI%20STRATEGY%20(SECURED).pdf"
    print(fetch_page_content(url))
