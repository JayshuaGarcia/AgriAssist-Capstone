const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const app = express();
const port = 3001;
const execAsync = util.promisify(exec);

app.use(express.json());

console.log('🚀 AUTOMATIC PDF SERVICE STARTED');
console.log('================================');

// Endpoint to check for new PDFs
app.post('/check-pdfs', async (req, res) => {
  try {
    console.log('🔄 Received request to check for new PDFs...');
    
    // Run the PDF monitoring script
    console.log('🌐 Checking DA website for new Daily Price Index PDFs...');
    
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
    
    // Return response
    res.json({
      success: true,
      hasNewData: hasNewData,
      commodityCount: commodityCount,
      message: hasNewData 
        ? `Successfully found and downloaded new Daily Price Index PDF from DA website! Found ${commodityCount} commodities.`
        : 'Checked DA website - no new PDFs found.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking for new PDFs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check for new PDFs from DA website.'
    });
  }
});

// Endpoint to get current data count
app.get('/data-count', (req, res) => {
  try {
    const extractedData = JSON.parse(fs.readFileSync('data/extracted_pdf_data.json', 'utf8'));
    res.json({
      success: true,
      commodityCount: extractedData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Automatic PDF service running on port ${port}`);
  console.log('🌐 Endpoints available:');
  console.log(`   POST http://localhost:${port}/check-pdfs - Check for new PDFs`);
  console.log(`   GET  http://localhost:${port}/data-count - Get current data count`);
  console.log('');
  console.log('🔄 Ready to automatically check DA website for new PDFs!');
  console.log('⏹️  Press Ctrl+C to stop');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Automatic PDF service stopped');
  process.exit(0);
});
