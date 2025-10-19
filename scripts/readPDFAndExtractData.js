const fs = require('fs');
const path = require('path');

// Try to use pdf-parse library
let pdfParse;
try {
  pdfParse = require('pdf-parse').default || require('pdf-parse');
} catch (error) {
  console.log('❌ pdf-parse not available, trying alternative approach...');
}

const PDF_FILE = path.join(__dirname, '../october_18_2025_dpi_afc.pdf');
const OUTPUT_FILE = path.join(__dirname, '../data/extracted_pdf_data.json');

async function readPDFAndExtractData() {
  console.log('📄 READING PDF FILE AND EXTRACTING DATA...');
  console.log('🔗 PDF File:', PDF_FILE);

  try {
    // Check if PDF file exists
    if (!fs.existsSync(PDF_FILE)) {
      console.log('❌ PDF file not found:', PDF_FILE);
      console.log('📥 Please download the PDF first using: node scripts/downloadOct18DailyPriceIndex.js');
      return;
    }

    console.log('✅ PDF file found, reading...');
    
    if (pdfParse) {
      // Use pdf-parse library
      const dataBuffer = fs.readFileSync(PDF_FILE);
      const pdfData = await pdfParse(dataBuffer);
      
      console.log('✅ PDF parsed successfully');
      console.log('📊 PDF text length:', pdfData.text.length);
      console.log('📄 First 500 characters of PDF:');
      console.log(pdfData.text.substring(0, 500));
      
      // Extract price data from PDF text
      const extractedData = extractPriceDataFromText(pdfData.text);
      
      // Save extracted data
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(extractedData, null, 2), 'utf8');
      console.log(`✅ Extracted data saved to: ${OUTPUT_FILE}`);
      
      console.log('\n📊 EXTRACTED DATA:');
      extractedData.forEach((item, index) => {
        console.log(`${index + 1}. ${item.commodity}: ₱${item.price} (${item.specification})`);
      });
      
    } else {
      console.log('⚠️ pdf-parse library not available');
      console.log('📦 Installing pdf-parse...');
      
      // Try to install pdf-parse
      const { execSync } = require('child_process');
      try {
        execSync('npm install pdf-parse', { stdio: 'inherit' });
        console.log('✅ pdf-parse installed successfully');
        console.log('🔄 Please run this script again');
      } catch (installError) {
        console.log('❌ Failed to install pdf-parse:', installError.message);
        console.log('📝 Manual installation: npm install pdf-parse');
      }
    }
    
  } catch (error) {
    console.error('❌ Error reading PDF:', error);
    
    // Fallback: Create a manual data extraction guide
    console.log('\n📋 MANUAL EXTRACTION GUIDE:');
    console.log('Since PDF parsing failed, please manually extract data from your PDF:');
    console.log('1. Open the PDF file: october_18_2025_dpi_afc.pdf');
    console.log('2. Look for tables with commodity names and prices');
    console.log('3. Extract the following information for each commodity:');
    console.log('   - Commodity name');
    console.log('   - Specification');
    console.log('   - Price (in pesos)');
    console.log('   - Unit (kg, piece, etc.)');
    console.log('4. Use the admin interface to add this data manually');
  }
}

function extractPriceDataFromText(text) {
  console.log('🔍 Extracting price data from PDF text...');
  
  const extractedData = [];
  
  // Look for common patterns in the PDF text
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for price patterns (₱ followed by numbers)
    const priceMatch = line.match(/₱\s*([\d,]+\.?\d*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      
      // Look for commodity name in nearby lines
      let commodityName = '';
      let specification = '';
      
      // Check previous lines for commodity name
      for (let j = Math.max(0, i - 3); j < i; j++) {
        const prevLine = lines[j].trim();
        if (prevLine && !prevLine.match(/₱/) && !prevLine.match(/^\d+$/) && prevLine.length > 3) {
          commodityName = prevLine;
          break;
        }
      }
      
      // Check next lines for specification
      for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.match(/₱/) && !nextLine.match(/^\d+$/) && nextLine.length > 3) {
          specification = nextLine;
          break;
        }
      }
      
      if (commodityName && price > 0) {
        extractedData.push({
          commodity: commodityName,
          specification: specification || 'Not specified',
          price: price,
          unit: 'kg', // Default unit
          region: 'NCR',
          date: '2025-10-18'
        });
      }
    }
  }
  
  console.log(`✅ Extracted ${extractedData.length} items from PDF text`);
  return extractedData;
}

// Run the extraction
readPDFAndExtractData();
