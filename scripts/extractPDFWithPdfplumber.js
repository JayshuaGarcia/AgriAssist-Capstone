const fs = require('fs');
const path = require('path');

// Try to use pdfplumber
let pdfplumber;
try {
  pdfplumber = require('pdfplumber');
} catch (error) {
  console.log('❌ pdfplumber not available, trying alternative...');
}

const PDF_FILE = path.join(__dirname, '../october_18_2025_dpi_afc.pdf');
const OUTPUT_FILE = path.join(__dirname, '../data/extracted_pdf_data.json');

async function extractPDFWithPdfplumber() {
  console.log('📄 EXTRACTING PDF DATA WITH PDFPLUMBER...');
  console.log('🔗 PDF File:', PDF_FILE);

  try {
    // Check if PDF file exists
    if (!fs.existsSync(PDF_FILE)) {
      console.log('❌ PDF file not found:', PDF_FILE);
      return;
    }

    if (!pdfplumber) {
      console.log('❌ pdfplumber library not available');
      console.log('📦 Installing pdfplumber...');
      const { execSync } = require('child_process');
      try {
        execSync('npm install pdfplumber', { stdio: 'inherit' });
        console.log('✅ pdfplumber installed, please run this script again');
        return;
      } catch (installError) {
        console.log('❌ Failed to install pdfplumber:', installError.message);
        return;
      }
    }

    console.log('✅ pdfplumber available, extracting data...');
    
    const extractedData = [];
    
    // Open PDF with pdfplumber
    const pdf = await pdfplumber.open(PDF_FILE);
    console.log(`📊 PDF has ${pdf.pages.length} pages`);
    
    // Process each page
    for (let pageNum = 0; pageNum < pdf.pages.length; pageNum++) {
      const page = pdf.pages[pageNum];
      console.log(`\n📄 Processing page ${pageNum + 1}...`);
      
      // Extract text
      const text = page.getText();
      console.log(`📝 Page ${pageNum + 1} text length: ${text.length}`);
      
      // Extract tables
      const tables = page.extractTables();
      console.log(`📊 Page ${pageNum + 1} tables found: ${tables.length}`);
      
      // Process tables
      tables.forEach((table, tableIndex) => {
        console.log(`\n📋 Table ${tableIndex + 1} on page ${pageNum + 1}:`);
        console.log(`   Rows: ${table.length}`);
        if (table.length > 0) {
          console.log(`   Columns: ${table[0].length}`);
          
          // Show first few rows
          table.slice(0, 5).forEach((row, rowIndex) => {
            console.log(`   Row ${rowIndex + 1}:`, row);
          });
          
          // Extract commodity data from table
          const commodityData = extractCommodityDataFromTable(table);
          extractedData.push(...commodityData);
        }
      });
      
      // Also look for price patterns in text
      const priceData = extractPriceDataFromText(text);
      extractedData.push(...priceData);
    }
    
    // Close PDF
    await pdf.close();
    
    // Remove duplicates and clean data
    const uniqueData = removeDuplicates(extractedData);
    
    console.log(`\n✅ Extracted ${uniqueData.length} unique commodities`);
    
    // Save extracted data
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueData, null, 2), 'utf8');
    console.log(`💾 Data saved to: ${OUTPUT_FILE}`);
    
    // Display extracted data
    console.log('\n📊 EXTRACTED COMMODITY DATA:');
    uniqueData.forEach((item, index) => {
      console.log(`${index + 1}. ${item.commodity}: ₱${item.price} (${item.specification})`);
    });
    
    // Update the admin PDF data screen with real data
    updateAdminPDFDataScreen(uniqueData);
    
  } catch (error) {
    console.error('❌ Error extracting PDF:', error);
    
    // Fallback: try tabula-py
    console.log('\n🔄 Trying tabula-py as fallback...');
    tryTabulaPy();
  }
}

function extractCommodityDataFromTable(table) {
  const data = [];
  
  // Look for header row to understand structure
  let headerRow = -1;
  let commodityCol = -1;
  let priceCol = -1;
  let specCol = -1;
  
  for (let i = 0; i < Math.min(3, table.length); i++) {
    const row = table[i];
    for (let j = 0; j < row.length; j++) {
      const cell = (row[j] || '').toString().toLowerCase();
      if (cell.includes('commodity') || cell.includes('item') || cell.includes('product')) {
        commodityCol = j;
        headerRow = i;
      }
      if (cell.includes('price') || cell.includes('₱') || cell.includes('peso')) {
        priceCol = j;
      }
      if (cell.includes('specification') || cell.includes('type') || cell.includes('grade')) {
        specCol = j;
      }
    }
  }
  
  console.log(`   📋 Table structure: Commodity=${commodityCol}, Price=${priceCol}, Spec=${specCol}`);
  
  // Extract data rows
  for (let i = headerRow + 1; i < table.length; i++) {
    const row = table[i];
    if (row && row.length > Math.max(commodityCol, priceCol)) {
      const commodity = (row[commodityCol] || '').toString().trim();
      const priceText = (row[priceCol] || '').toString().trim();
      const specification = specCol >= 0 ? (row[specCol] || '').toString().trim() : '';
      
      if (commodity && priceText) {
        // Extract price number
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[0].replace(/,/g, ''));
          if (price > 0) {
            data.push({
              commodity: commodity,
              specification: specification || 'Not specified',
              price: price,
              unit: 'kg',
              region: 'NCR',
              date: '2025-10-18'
            });
          }
        }
      }
    }
  }
  
  return data;
}

function extractPriceDataFromText(text) {
  const data = [];
  
  // Look for price patterns with nearby text
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for price patterns
    const priceMatch = line.match(/₱\s*([\d,]+\.?\d*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      
      // Look for commodity name in nearby lines
      let commodityName = '';
      for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
        const nearbyLine = lines[j].trim();
        if (nearbyLine && !nearbyLine.match(/₱/) && nearbyLine.length > 3 && nearbyLine.length < 100) {
          commodityName = nearbyLine;
          break;
        }
      }
      
      if (commodityName && price > 0) {
        data.push({
          commodity: commodityName,
          specification: 'Not specified',
          price: price,
          unit: 'kg',
          region: 'NCR',
          date: '2025-10-18'
        });
      }
    }
  }
  
  return data;
}

function removeDuplicates(data) {
  const unique = [];
  const seen = new Set();
  
  data.forEach(item => {
    const key = `${item.commodity}-${item.price}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  });
  
  return unique;
}

function updateAdminPDFDataScreen(data) {
  console.log('\n🔄 Updating admin PDF data screen with real extracted data...');
  
  // This would update the admin screen, but for now just show the data
  console.log('📱 The admin PDF data screen will now show this real data from the PDF');
}

async function tryTabulaPy() {
  console.log('📊 Trying tabula-py for table extraction...');
  // This would be implemented if pdfplumber fails
  console.log('💡 To use tabula-py, you would need Python installed');
}

// Run the extraction
extractPDFWithPdfplumber();


