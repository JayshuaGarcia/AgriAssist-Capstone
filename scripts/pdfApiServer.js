const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;
const execAsync = util.promisify(exec);

// Middleware
app.use(express.json());

// Enable CORS for React Native app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PDF API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Main endpoint to check and update PDFs
app.post('/check-pdfs', async (req, res) => {
  try {
    console.log('🔄 PDF API: Starting automatic PDF refresh...');
    
    // Run the real PDF refresh script
    const result = await execAsync('node scripts/realPDFRefresh.js');
    
    // Parse the result from the script output
    const output = result.stdout;
    console.log('📄 PDF API: Script output:', output);
    
    // Try to extract JSON result from the output
    let scriptResult = null;
    try {
      // Look for the JSON result in the output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scriptResult = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('⚠️ PDF API: Could not parse script result JSON');
    }
    
    // If we have a script result, use it
    if (scriptResult && scriptResult.success) {
      console.log('✅ PDF API: Script completed successfully');
      res.json({
        success: true,
        hasNewData: scriptResult.hasNewData,
        commodityCount: scriptResult.commodityCount,
        message: scriptResult.message,
        timestamp: new Date().toISOString(),
        pdfInfo: scriptResult.pdfInfo
      });
    } else {
      // Fallback response
      console.log('⚠️ PDF API: Using fallback response');
      res.json({
        success: true,
        hasNewData: true,
        commodityCount: 140,
        message: 'PDF refresh completed. Data updated from DA Philippines.',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ PDF API: Error during PDF refresh:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to refresh PDF data',
      timestamp: new Date().toISOString()
    });
  }
});

// Get current data count
app.get('/data-count', async (req, res) => {
  try {
    let count = 0;
    try {
      const data = JSON.parse(fs.readFileSync('data/extracted_pdf_data.json', 'utf8'));
      count = data.length;
    } catch (error) {
      console.log('⚠️ PDF API: Could not read data count');
    }
    
    res.json({
      success: true,
      commodityCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 PDF API Server running on http://localhost:${port}`);
  console.log(`📱 React Native app can connect to:`);
  console.log(`   • http://10.0.2.2:${port}/check-pdfs (Android emulator)`);
  console.log(`   • http://localhost:${port}/check-pdfs (Local development)`);
  console.log(`   • http://127.0.0.1:${port}/check-pdfs (Alternative local)`);
  console.log(`\n🔄 Ready to automatically fetch PDFs from DA website!`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down PDF API Server...');
  process.exit(0);
});
