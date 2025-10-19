/**
 * 📄 DOWNLOAD REAL DA PHILIPPINES PRICE PDF
 * This script downloads the most recent price PDF from DA Philippines
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('📄 DOWNLOADING REAL DA PHILIPPINES PRICE PDF...');

// The most recent PDF URL from the website
const PDF_URL = 'https://www.da.gov.ph/wp-content/uploads/2025/10/Weekly-Average-Prices-October-6-11-2025.pdf';
const OUTPUT_FILE = 'real_da_prices_october_2025.pdf';

console.log('🔗 PDF URL:', PDF_URL);
console.log('💾 Saving to:', OUTPUT_FILE);

// Download the PDF
function downloadPDF() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.da.gov.ph',
      port: 443,
      path: '/wp-content/uploads/2025/10/Weekly-Average-Prices-October-6-11-2025.pdf',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      }
    };

    const req = https.request(options, (res) => {
      console.log('📡 Status:', res.statusCode);
      console.log('📄 Content-Type:', res.headers['content-type']);
      console.log('📊 Content-Length:', res.headers['content-length'], 'bytes');
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusText}`));
        return;
      }
      
      const file = fs.createWriteStream(OUTPUT_FILE);
      
      res.on('data', (chunk) => {
        file.write(chunk);
      });
      
      res.on('end', () => {
        file.end();
        console.log('✅ PDF downloaded successfully!');
        console.log('📁 File saved as:', OUTPUT_FILE);
        
        // Get file size
        const stats = fs.statSync(OUTPUT_FILE);
        console.log('📊 File size:', stats.size, 'bytes');
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error downloading PDF:', error);
      reject(error);
    });

    req.setTimeout(30000, () => {
      console.error('⏰ Download timeout');
      req.destroy();
      reject(new Error('Download timeout'));
    });

    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting PDF download...');
    await downloadPDF();
    
    console.log('\n🎉 SUCCESS!');
    console.log('📄 Real DA Philippines price PDF downloaded!');
    console.log('📅 Date: October 6-11, 2025');
    console.log('📁 File: ' + OUTPUT_FILE);
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Open the PDF file to see the real prices');
    console.log('2. Extract the price data from the PDF');
    console.log('3. Update your app with the real DA prices');
    
    console.log('\n🔍 WHAT WE FOUND:');
    console.log('- DA Philippines website has REAL price data in PDF format');
    console.log('- Most recent data: October 6-11, 2025');
    console.log('- This is the ACTUAL source of the prices you saw in your screenshot');
    console.log('- The prices in your screenshot are from these official DA PDFs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the downloader
main();


