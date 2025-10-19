import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import sys

# Fix Unicode encoding for Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

def find_daily_price_index_pdfs():
    """Find actual Daily Price Index PDFs from DA website"""
    try:
        print("🔍 Searching for Daily Price Index PDFs on DA website...", file=sys.stderr)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Try multiple possible URLs for Daily Price Index
        urls_to_try = [
            'https://www.da.gov.ph/statistics/',
            'https://www.da.gov.ph/price-monitoring/',
            'https://www.da.gov.ph/market-information/',
            'https://www.da.gov.ph/',
            'https://www.da.gov.ph/publications/'
        ]
        
        all_pdfs = []
        
        for url in urls_to_try:
            try:
                print(f"🔍 Checking: {url}", file=sys.stderr)
                response = requests.get(url, headers=headers, timeout=30)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Look for PDF links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        link_text = link.get_text().strip().lower()
                        
                        # Look for Daily Price Index specific patterns (exclude weekly)
                        is_dpi = (
                            ('daily' in link_text and 'price' in link_text and 'index' in link_text) or
                            ('daily-price-index' in href.lower()) or
                            ('dpi' in href.lower() and 'daily' in link_text) or
                            ('dpi-afc' in href.lower()) or  # New format: October-XX-2025-DPI-AFC.pdf
                            (link_text.startswith('october') and '2025' in href and ('daily' in link_text or 'dpi' in href.lower())) or
                            (link_text.startswith('september') and '2025' in href and ('daily' in link_text or 'dpi' in href.lower())) or
                            (link_text.startswith('august') and '2025' in href and ('daily' in link_text or 'dpi' in href.lower())) or
                            (link_text.startswith('november') and '2025' in href and ('daily' in link_text or 'dpi' in href.lower())) or
                            (link_text.startswith('december') and '2025' in href and ('daily' in link_text or 'dpi' in href.lower())) or
                            (link_text.startswith('january') and '2026' in href and ('daily' in link_text or 'dpi' in href.lower())) or
                            (link_text.startswith('february') and '2026' in href and ('daily' in link_text or 'dpi' in href.lower())) or
                            (link_text.startswith('march') and '2026' in href and ('daily' in link_text or 'dpi' in href.lower()))
                        ) and 'weekly' not in link_text and 'weekly' not in href.lower()
                        
                        if is_dpi and (href.endswith('.pdf') or 'pdf' in href.lower()):
                            filename = href.split('/')[-1]
                            if not filename.endswith('.pdf'):
                                filename += '.pdf'
                            
                            # Extract date if possible
                            date_match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
                            if not date_match:
                                date_match = re.search(r'(\d{2}-\d{2}-\d{4})', filename)
                            if not date_match:
                                date_match = re.search(r'(october|november|december|january|february|march|april|may|june|july|august|september)', link_text)
                            
                            pdf_date = date_match.group(1) if date_match else datetime.now().strftime('%Y-%m-%d')
                            
                            all_pdfs.append({
                                'filename': filename,
                                'url': href if href.startswith('http') else f'https://www.da.gov.ph{href}',
                                'date': pdf_date,
                                'link_text': link.get_text().strip(),
                                'source_url': url
                            })
                            
                            print(f"📄 Found DPI PDF: {filename} - {link_text}", file=sys.stderr)
                            
            except Exception as e:
                print(f"❌ Error checking {url}: {e}", file=sys.stderr)
                continue
        
        # Remove duplicates and sort by date
        unique_pdfs = []
        seen_urls = set()
        for pdf in all_pdfs:
            if pdf['url'] not in seen_urls:
                unique_pdfs.append(pdf)
                seen_urls.add(pdf['url'])
        
        # Sort by actual date (newest first) - parse dates for proper sorting
        def parse_date(pdf_info):
            try:
                filename = pdf_info['filename'].lower()
                
                # Try to extract date from filename
                if 'october' in filename and '2025' in filename:
                    # Handle both formats: Daily-Price-Index-October-XX-2025.pdf and October-XX-2025-DPI-AFC.pdf
                    day_match = re.search(r'october-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 10, day)  # October 2025
                elif 'september' in filename and '2025' in filename:
                    day_match = re.search(r'september-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 9, day)   # September 2025
                elif 'august' in filename and '2025' in filename:
                    day_match = re.search(r'august-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 8, day)   # August 2025
                elif 'july' in filename and '2025' in filename:
                    day_match = re.search(r'july-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 7, day)   # July 2025
                elif 'june' in filename and '2025' in filename:
                    day_match = re.search(r'june-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 6, day)   # June 2025
                elif 'may' in filename and '2025' in filename:
                    day_match = re.search(r'may-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 5, day)   # May 2025
                elif 'april' in filename and '2025' in filename:
                    day_match = re.search(r'april-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 4, day)   # April 2025
                elif 'march' in filename and '2025' in filename:
                    day_match = re.search(r'march-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 3, day)   # March 2025
                
                # Fallback to current date if can't parse
                return (2025, 1, 1)
            except:
                return (2025, 1, 1)
        
        unique_pdfs.sort(key=parse_date, reverse=True)
        
        print(f"📊 Found {len(unique_pdfs)} unique Daily Price Index PDFs", file=sys.stderr)
        
        if unique_pdfs:
            latest_pdf = unique_pdfs[0]
            print(f"✅ Latest DPI PDF: {latest_pdf['filename']}", file=sys.stderr)
            print(f"📅 Date: {latest_pdf['date']}", file=sys.stderr)
            print(f"🔗 URL: {latest_pdf['url']}", file=sys.stderr)
            
            return {
                'success': True,
                'newPDF': latest_pdf,
                'allPDFs': unique_pdfs,
                'message': f'Found Daily Price Index PDF: {latest_pdf["filename"]}'
            }
        else:
            return {
                'success': True,
                'newPDF': None,
                'message': 'No Daily Price Index PDFs found on DA website'
            }
            
    except Exception as e:
        print(f"❌ Error searching for DPI PDFs: {e}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e),
            'message': f'Error searching website: {e}'
        }

if __name__ == "__main__":
    result = find_daily_price_index_pdfs()
    print(json.dumps(result))
