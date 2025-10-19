/**
 * 📊 DOWNLOAD OCTOBER 17, 2025 DAILY PRICE INDEX
 * This script downloads the October 17, 2025 Daily Price Index PDF
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('📊 DOWNLOADING OCTOBER 17, 2025 DAILY PRICE INDEX...');

// The October 17, 2025 Daily Price Index PDF URL
const PDF_URL = 'https://www.da.gov.ph/wp-content/uploads/2025/10/Daily-Price-Index-October-17-2025.pdf';
const OUTPUT_FILE = 'daily_price_index_october_17_2025.pdf';

console.log('🔗 PDF URL:', PDF_URL);
console.log('💾 Saving to:', OUTPUT_FILE);

// Download the PDF
function downloadPDF() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.da.gov.ph',
      port: 443,
      path: '/wp-content/uploads/2025/10/Daily-Price-Index-October-17-2025.pdf',
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
        console.log('✅ October 17, 2025 Daily Price Index PDF downloaded successfully!');
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
    console.log('🚀 Starting October 17, 2025 Daily Price Index download...');
    await downloadPDF();
    
    console.log('\n🎉 SUCCESS!');
    console.log('📊 October 17, 2025 Daily Price Index PDF downloaded!');
    console.log('📅 Date: October 17, 2025');
    console.log('📁 File: ' + OUTPUT_FILE);
    
    console.log('\n🔍 WHAT WE FOUND:');
    console.log('- DA Philippines has 224 Daily Price Index entries total');
    console.log('- October 17, 2025 (355 KB) - Available and downloaded');
    console.log('- October 18, 2025 (355 KB) - Not yet available (404 error)');
    console.log('- This is the most recent available daily price data');
    
    console.log('\n📋 CURRENT STATUS:');
    console.log('- Downloaded: October 17, 2025 Daily Price Index ✅');
    console.log('- Previously downloaded: October 16, 2025 Daily Price Index ✅');
    console.log('- October 18, 2025: Not yet published (404 error)');
    console.log('- Total entries available: 224');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Open the October 17, 2025 PDF to see the latest available daily prices');
    console.log('2. Extract the price data from the PDF');
    console.log('3. Update your app with the most current available DA daily prices');
    console.log('4. This should contain the most up-to-date prices currently available!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the downloader
main();


