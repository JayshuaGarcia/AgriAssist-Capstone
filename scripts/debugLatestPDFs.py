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

def debug_latest_pdfs():
    """Debug why we're not finding the most recent PDFs"""
    try:
        print("🔍 DEBUGGING: Why are we not finding the most recent PDFs?", file=sys.stderr)
        print(f"📅 Current date: {datetime.now().strftime('%Y-%m-%d')}", file=sys.stderr)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # Check the main price monitoring page
        url = 'https://www.da.gov.ph/price-monitoring/'
        print(f"🔍 Checking main page: {url}", file=sys.stderr)
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for all links that might contain PDFs
        all_links = soup.find_all('a', href=True)
        print(f"📊 Found {len(all_links)} total links on the page", file=sys.stderr)
        
        # Check for any links that might be newer than October 16, 2025
        recent_links = []
        for link in all_links:
            href = link['href']
            link_text = link.get_text().strip().lower()
            
            # Look for any date patterns that might be newer
            if any(month in link_text for month in ['october', 'november', 'december']):
                if '2025' in link_text or '2026' in link_text:
                    recent_links.append({
                        'href': href,
                        'text': link_text,
                        'full_text': link.get_text().strip()
                    })
        
        print(f"📅 Found {len(recent_links)} potentially recent links:", file=sys.stderr)
        for link in recent_links[:10]:  # Show first 10
            print(f"   🔗 {link['full_text']} -> {link['href']}", file=sys.stderr)
        
        # Look specifically for PDF links
        pdf_links = []
        for link in all_links:
            href = link['href']
            if href.endswith('.pdf') or 'pdf' in href.lower():
                link_text = link.get_text().strip()
                pdf_links.append({
                    'href': href,
                    'text': link_text
                })
        
        print(f"📄 Found {len(pdf_links)} PDF links:", file=sys.stderr)
        for pdf in pdf_links[:20]:  # Show first 20
            print(f"   📄 {pdf['text']} -> {pdf['href']}", file=sys.stderr)
        
        # Check if there are any October 17, 18, 19, 2025 PDFs
        october_recent = []
        for link in all_links:
            href = link['href']
            link_text = link.get_text().strip().lower()
            
            if ('october' in link_text and '2025' in link_text):
                if any(day in link_text for day in ['17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31']):
                    october_recent.append({
                        'href': href,
                        'text': link.get_text().strip()
                    })
        
        print(f"📅 Found {len(october_recent)} October 17+ 2025 links:", file=sys.stderr)
        for link in october_recent:
            print(f"   📅 {link['text']} -> {link['href']}", file=sys.stderr)
        
        # Check the page content for any clues about newer PDFs
        page_text = soup.get_text().lower()
        if 'october 17' in page_text or 'october 18' in page_text or 'october 19' in page_text:
            print("✅ Found references to October 17, 18, or 19 in page content", file=sys.stderr)
        else:
            print("❌ No references to October 17, 18, or 19 found in page content", file=sys.stderr)
        
        # Check if there are any "Next" or "More" links
        next_links = []
        for link in all_links:
            link_text = link.get_text().strip().lower()
            if any(word in link_text for word in ['next', 'more', 'view all', 'see all', 'load more']):
                next_links.append({
                    'href': link['href'],
                    'text': link.get_text().strip()
                })
        
        print(f"🔄 Found {len(next_links)} potential 'next/more' links:", file=sys.stderr)
        for link in next_links:
            print(f"   🔄 {link['text']} -> {link['href']}", file=sys.stderr)
        
        return {
            'success': True,
            'total_links': len(all_links),
            'recent_links': len(recent_links),
            'pdf_links': len(pdf_links),
            'october_recent': len(october_recent),
            'next_links': len(next_links),
            'message': f'Found {len(october_recent)} October 17+ 2025 links'
        }
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return {
            'success': False,
            'message': f'Error: {e}'
        }

if __name__ == "__main__":
    result = debug_latest_pdfs()
    print(json.dumps(result, indent=2))