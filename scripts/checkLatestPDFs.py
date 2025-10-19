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

def check_latest_pdfs():
    """Check for the absolute latest Daily Price Index PDFs"""
    try:
        print("🔍 Checking for the LATEST Daily Price Index PDFs...", file=sys.stderr)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # Check multiple possible URLs for latest PDFs
        urls_to_check = [
            'https://www.da.gov.ph/price-monitoring/',
            'https://www.da.gov.ph/daily-price-index/',
            'https://www.da.gov.ph/publications/',
            'https://www.da.gov.ph/statistics/',
            'https://www.da.gov.ph/',
            'https://www.da.gov.ph/market-information/'
        ]
        
        all_pdfs = []
        current_date = datetime.now()
        
        for url in urls_to_check:
            try:
                print(f"🔍 Checking: {url}", file=sys.stderr)
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for PDF links
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    link_text = link.get_text().strip().lower()
                    
                    # Look for Daily Price Index specific patterns
                    is_dpi = (
                        ('daily' in link_text and 'price' in link_text and 'index' in link_text) or
                        ('daily-price-index' in href.lower()) or
                        ('dpi' in href.lower() and 'daily' in link_text) or
                        (link_text.startswith('october') and '2025' in href and 'daily' in link_text) or
                        (link_text.startswith('november') and '2025' in href and 'daily' in link_text) or
                        (link_text.startswith('december') and '2025' in href and 'daily' in link_text) or
                        (link_text.startswith('january') and '2026' in href and 'daily' in link_text) or
                        (link_text.startswith('february') and '2026' in href and 'daily' in link_text) or
                        (link_text.startswith('march') and '2026' in href and 'daily' in link_text)
                    ) and 'weekly' not in link_text and 'weekly' not in href.lower()
                    
                    if is_dpi and href.endswith('.pdf'):
                        # Extract filename
                        filename = href.split('/')[-1]
                        
                        # Extract date from filename or link text
                        date_match = re.search(r'(\w+)-(\d+)-(\d+)', filename.lower())
                        if date_match:
                            month = date_match.group(1)
                            day = date_match.group(2)
                            year = date_match.group(3)
                            date_str = f"{month} {day}, {year}"
                        else:
                            date_str = link_text
                        
                        all_pdfs.append({
                            'filename': filename,
                            'url': href if href.startswith('http') else f"https://www.da.gov.ph{href}",
                            'date': date_str,
                            'link_text': link_text,
                            'source_url': url
                        })
                        
                        print(f"📄 Found DPI PDF: {filename} - {date_str}", file=sys.stderr)
                        
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
                if 'november' in filename and '2025' in filename:
                    day_match = re.search(r'november-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 11, day)  # November 2025
                elif 'december' in filename and '2025' in filename:
                    day_match = re.search(r'december-(\d+)-2025', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2025, 12, day)  # December 2025
                elif 'january' in filename and '2026' in filename:
                    day_match = re.search(r'january-(\d+)-2026', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2026, 1, day)   # January 2026
                elif 'february' in filename and '2026' in filename:
                    day_match = re.search(r'february-(\d+)-2026', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2026, 2, day)   # February 2026
                elif 'march' in filename and '2026' in filename:
                    day_match = re.search(r'march-(\d+)-2026', filename)
                    if day_match:
                        day = int(day_match.group(1))
                        return (2026, 3, day)   # March 2026
                elif 'october' in filename and '2025' in filename:
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
            print(f"✅ LATEST DPI PDF: {latest_pdf['filename']}", file=sys.stderr)
            print(f"📅 Date: {latest_pdf['date']}", file=sys.stderr)
            print(f"🔗 URL: {latest_pdf['url']}", file=sys.stderr)
            
            # Check if there are any PDFs newer than October 16, 2025
            october_16_date = (2025, 10, 16)
            latest_date = parse_date(latest_pdf)
            
            if latest_date > october_16_date:
                print(f"🎉 FOUND NEWER PDF! Latest is newer than October 16, 2025", file=sys.stderr)
            else:
                print(f"📋 October 16, 2025 is still the latest available PDF", file=sys.stderr)
            
            return {
                'success': True,
                'newPDF': latest_pdf,
                'allPDFs': unique_pdfs,
                'message': f"Found Daily Price Index PDF: {latest_pdf['filename']}"
            }
        else:
            return {
                'success': False,
                'message': 'No Daily Price Index PDFs found'
            }
            
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return {
            'success': False,
            'message': f'Error: {e}'
        }

if __name__ == "__main__":
    result = check_latest_pdfs()
    print(json.dumps(result, indent=2))
