const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

console.log('🔄 DIRECT PDF CHECK');
console.log('==================');

async function checkForNewPDFs() {
  try {
    console.log('🌐 Checking DA website for new Daily Price Index PDFs...');
    
    // Run the PDF monitoring script directly
    const { stdout, stderr } = await execAsync('node scripts/autoPDFMonitor.js');
    
    if (stderr) {
      console.log('⚠️ Script warnings:', stderr);
    }
    
    console.log('📄 PDF monitoring result:', stdout);
    
    // Check if new data was extracted
    let commodityCount = 0;
    let hasNewData = false;
    
    try {
      const extractedData = JSON.parse(fs.readFileSync('data/extracted_pdf_data.json', 'utf8'));
      commodityCount = extractedData.length;
      hasNewData = true; // If we got here, we have data
      console.log(`✅ Found ${commodityCount} commodities after check`);
    } catch (error) {
      console.log('⚠️ Could not read updated data:', error);
    }
    
    // Create a result file for the app to read
    const result = {
      success: true,
      hasNewData: hasNewData,
      commodityCount: commodityCount,
      message: hasNewData 
        ? `Successfully found and downloaded new Daily Price Index PDF from DA website! Found ${commodityCount} commodities.`
        : 'Checked DA website - no new PDFs found.',
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('pdf_check_result.json', JSON.stringify(result, null, 2));
    console.log('✅ Result saved to pdf_check_result.json');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error checking for new PDFs:', error);
    
    const errorResult = {
      success: false,
      error: error.message,
      message: 'Failed to check for new PDFs from DA website.',
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('pdf_check_result.json', JSON.stringify(errorResult, null, 2));
    return errorResult;
  }
}

// Run the check
checkForNewPDFs().then(result => {
  console.log('🎉 PDF check completed:', result);
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
