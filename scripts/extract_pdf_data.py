#!/usr/bin/env python3
"""
Extract commodity price data from DA Philippines PDF using pdfplumber
"""

import json
import sys
from pathlib import Path

# Fix Unicode encoding for Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

try:
    import pdfplumber
except ImportError:
    print("❌ pdfplumber not installed")
    print("📦 Installing pdfplumber...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
    import pdfplumber

# Default files (can be overridden by command line arguments)
DEFAULT_PDF_FILE = Path(__file__).parent.parent / "october_18_2025_dpi_afc.pdf"
DEFAULT_OUTPUT_FILE = Path(__file__).parent.parent / "data" / "extracted_pdf_data.json"

# Get file paths from command line arguments or use defaults
if len(sys.argv) >= 2:
    PDF_FILE = Path(sys.argv[1])
else:
    PDF_FILE = DEFAULT_PDF_FILE

if len(sys.argv) >= 3:
    OUTPUT_FILE = Path(sys.argv[2])
else:
    OUTPUT_FILE = DEFAULT_OUTPUT_FILE

def extract_pdf_data(pdf_path=None, output_path=None):
    """Extract commodity data from PDF file"""
    pdf_file = pdf_path or PDF_FILE
    output_file = output_path or OUTPUT_FILE
    
    print("📄 EXTRACTING REAL DATA FROM PDF USING PDFPLUMBER...")
    print(f"🔗 PDF File: {pdf_file}")
    print(f"💾 Output File: {output_file}")
    
    if not pdf_file.exists():
        print(f"❌ PDF file not found: {pdf_file}")
        return []
    
    extracted_data = []
    
    try:
        with pdfplumber.open(pdf_file) as pdf:
            print(f"📊 PDF has {len(pdf.pages)} pages")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"\n📄 Processing page {page_num}...")
                
                # Extract tables from page
                tables = page.extract_tables()
                print(f"📋 Found {len(tables)} tables on page {page_num}")
                
                for table_num, table in enumerate(tables, 1):
                    if not table:
                        continue
                    
                    print(f"\n📊 Table {table_num} on page {page_num}:")
                    print(f"   Rows: {len(table)}")
                    
                    # Show first few rows to understand structure
                    print("   First 3 rows:")
                    for i, row in enumerate(table[:3], 1):
                        print(f"   Row {i}: {row}")
                    
                    # Extract commodity data from table
                    commodity_data = extract_from_table(table)
                    extracted_data.extend(commodity_data)
                    print(f"   ✅ Extracted {len(commodity_data)} items from this table")
        
        # Remove duplicates
        unique_data = remove_duplicates(extracted_data)
        print(f"\n✅ Total extracted: {len(unique_data)} unique commodities")
        
        # Save to JSON
        OUTPUT_FILE.parent.mkdir(exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(unique_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Data saved to: {OUTPUT_FILE}")
        
        # Display extracted data
        print("\n📊 EXTRACTED COMMODITY DATA:")
        for i, item in enumerate(unique_data, 1):
            print(f"{i}. {item['commodity']}: ₱{item['price']} ({item['specification']})")
        
        return unique_data
        
    except Exception as e:
        print(f"❌ Error extracting PDF: {e}")
        import traceback
        traceback.print_exc()
        return None

def extract_from_table(table):
    """Extract commodity data from a table"""
    data = []
    
    if not table or len(table) < 2:
        return data
    
    # Find header row and column indices
    header_row = 0
    commodity_col = -1
    price_col = -1
    spec_col = -1
    
    # Check first few rows for headers
    for i in range(min(3, len(table))):
        row = table[i]
        if not row:
            continue
        
        for j, cell in enumerate(row):
            if not cell:
                continue
            
            cell_lower = str(cell).lower()
            
            if 'commodity' in cell_lower or 'item' in cell_lower or 'product' in cell_lower:
                commodity_col = j
                header_row = i
            elif 'price' in cell_lower or '₱' in cell_lower or 'peso' in cell_lower or 'retail' in cell_lower:
                price_col = j
            elif 'specification' in cell_lower or 'type' in cell_lower or 'grade' in cell_lower or 'description' in cell_lower:
                spec_col = j
    
    print(f"      Header at row {header_row}: Commodity col={commodity_col}, Price col={price_col}, Spec col={spec_col}")
    
    # If we couldn't find columns, try to infer from data
    if commodity_col == -1 or price_col == -1:
        # Assume first column is commodity, last column with numbers is price
        commodity_col = 0
        for i in range(len(table[0]) if table[0] else 0):
            if any(str(row[i] if i < len(row) else '').replace(',', '').replace('.', '').isdigit() 
                   for row in table[1:] if row and i < len(row)):
                price_col = i
    
    # Extract data rows
    for i in range(header_row + 1, len(table)):
        row = table[i]
        if not row or len(row) <= max(commodity_col, price_col):
            continue
        
        try:
            commodity = str(row[commodity_col] if commodity_col < len(row) else '').strip()
            price_text = str(row[price_col] if price_col < len(row) else '').strip()
            specification = str(row[spec_col] if spec_col >= 0 and spec_col < len(row) else '').strip()
            
            if not commodity or not price_text:
                continue
            
            # Extract price number
            price_text = price_text.replace('₱', '').replace(',', '').strip()
            try:
                price = float(price_text)
                if price > 0:
                    data.append({
                        'commodity': commodity,
                        'specification': specification or 'Not specified',
                        'price': price,
                        'unit': 'kg',
                        'region': 'NCR',
                        'date': '2025-10-19'
                    })
            except ValueError:
                continue
                
        except Exception as e:
            continue
    
    return data

def remove_duplicates(data):
    """Remove duplicate entries"""
    unique = []
    seen = set()
    
    for item in data:
        key = f"{item['commodity']}-{item['price']}"
        if key not in seen:
            seen.add(key)
            unique.append(item)
    
    return unique

if __name__ == "__main__":
    result = extract_pdf_data()
    
    # Save results to output file
    if result:
        output_path = Path(OUTPUT_FILE)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"💾 Data saved to: {OUTPUT_FILE}")
        print(f"📊 Extracted {len(result)} unique commodities")
    else:
        print("❌ No data extracted from PDF")

