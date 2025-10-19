import requests
import os
import sys
import json

# Fix Unicode encoding for Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

def download_pdf(url, filename):
    """Download PDF from URL"""
    try:
        print(f"📥 Downloading PDF: {filename}", file=sys.stderr)
        
        # Create downloads directory
        download_dir = os.path.join(os.path.dirname(__file__), '../data/pdfs')
        os.makedirs(download_dir, exist_ok=True)
        
        # Download the PDF with proper headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/pdf,application/octet-stream,*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        response = requests.get(url, headers=headers, timeout=60, stream=True)
        response.raise_for_status()
        
        # Save to file
        file_path = os.path.join(download_dir, filename)
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Verify file was downloaded
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            print(f"✅ PDF downloaded successfully: {filename}", file=sys.stderr)
            print(f"📊 File size: {os.path.getsize(file_path) / 1024:.2f} KB", file=sys.stderr)
            return {
                'success': True,
                'filename': filename,
                'file_path': file_path,
                'file_size': os.path.getsize(file_path)
            }
        else:
            return {
                'success': False,
                'error': 'Downloaded file is empty or corrupted'
            }
            
    except Exception as e:
        print(f"❌ Error downloading PDF: {e}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python downloadPDF.py <url> <filename>'
        }))
        sys.exit(1)
    
    url = sys.argv[1]
    filename = sys.argv[2]
    
    result = download_pdf(url, filename)
    print(json.dumps(result))
