import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime, timedelta
import os
import sys

# Fix Unicode encoding for Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

def check_for_new_pdf():
    """Check DA website for new PDF files"""
    try:
        # Only print to stderr to avoid interfering with JSON output
        print("🔍 Checking DA website for new PDF files...", file=sys.stderr)
        
        # Get the DA website content with proper headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        # Try different possible URLs for DA daily price index
        possible_urls = [
            'https://www.da.gov.ph/daily-price-index/',
            'https://www.da.gov.ph/publications/',
            'https://www.da.gov.ph/statistics/',
            'https://www.da.gov.ph/price-monitoring/',
            'https://www.da.gov.ph/'
        ]
        
        response = None
        for url in possible_urls:
            try:
                print(f"🔍 Trying URL: {url}", file=sys.stderr)
                response = requests.get(url, headers=headers, timeout=30)
                if response.status_code == 200:
                    print(f"✅ Successfully accessed: {url}", file=sys.stderr)
                    break
                else:
                    print(f"❌ Failed to access {url}: {response.status_code}", file=sys.stderr)
            except Exception as e:
                print(f"❌ Error accessing {url}: {e}", file=sys.stderr)
                continue
        
        if not response or response.status_code != 200:
            raise Exception(f"Could not access any DA website URL. Last status: {response.status_code if response else 'No response'}")
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all PDF links with improved detection
        pdf_links = []
        print(f"🔍 Searching for PDF links on the page...", file=sys.stderr)
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            link_text = link.get_text().strip().lower()
            
            # Look for PDF files with various patterns
            is_pdf = (href.endswith('.pdf') or 
                     'pdf' in href.lower() or 
                     'pdf' in link_text or
                     'dpi' in href.lower() or
                     'daily' in link_text or
                     'price' in link_text)
            
            if is_pdf:
                print(f"📄 Found potential PDF: {href} - {link_text}", file=sys.stderr)
                
                # Extract filename
                filename = href.split('/')[-1]
                if not filename.endswith('.pdf'):
                    filename += '.pdf'
                
                # Try to extract date from filename or link text
                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
                if not date_match:
                    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', link_text)
                if not date_match:
                    # Try other date formats
                    date_match = re.search(r'(\d{2}-\d{2}-\d{4})', filename)
                if not date_match:
                    date_match = re.search(r'(\d{2}-\d{2}-\d{4})', link_text)
                
                # Use current date if no date found
                pdf_date = date_match.group(1) if date_match else datetime.now().strftime('%Y-%m-%d')
                
                pdf_links.append({
                    'filename': filename,
                    'url': href if href.startswith('http') else f'https://www.da.gov.ph{href}',
                    'date': pdf_date,
                    'link_text': link.get_text().strip()
                })
        
        print(f"📊 Found {len(pdf_links)} PDF links", file=sys.stderr)
        
        if not pdf_links:
            return {'success': True, 'newPDF': None, 'message': 'No PDF files found on website'}
        
        # Sort by date (newest first)
        pdf_links.sort(key=lambda x: x['date'], reverse=True)
        latest_pdf = pdf_links[0]
        
        # Check if this is a new PDF
        last_check_file = os.path.join(os.path.dirname(__file__), '../data/last_pdf_check.json')
        last_pdf = None
        
        if os.path.exists(last_check_file):
            try:
                with open(last_check_file, 'r') as f:
                    last_check_data = json.load(f)
                    last_pdf = last_check_data.get('lastPDF')
            except:
                pass
        
        # Check if this is a new PDF
        is_new = True
        if last_pdf:
            if (last_pdf.get('filename') == latest_pdf['filename'] or 
                last_pdf.get('date') == latest_pdf['date']):
                is_new = False
        
        # Force check for new PDFs (comment out this line if you want to respect the last check)
        # is_new = True
        
        if is_new:
            print(f"✅ New PDF found: {latest_pdf['filename']}", file=sys.stderr)
            print(f"📅 Date: {latest_pdf['date']}", file=sys.stderr)
            return {
                'success': True, 
                'newPDF': latest_pdf,
                'message': f'New PDF found: {latest_pdf["filename"]}'
            }
        else:
            print("ℹ️ No new PDF files found", file=sys.stderr)
            return {
                'success': True, 
                'newPDF': None,
                'message': 'No new PDF files found'
            }
            
    except Exception as e:
        print(f"❌ Error checking for new PDF: {e}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e),
            'message': f'Error checking website: {e}'
        }

if __name__ == "__main__":
    result = check_for_new_pdf()
    print(json.dumps(result))
