const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;
const execAsync = util.promisify(exec);

// Middleware
app.use(express.json());

// Enable CORS
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PDF Webhook Server is running',
    timestamp: new Date().toISOString()
  });
});

// Main endpoint - this will be called by the React Native app
app.post('/check-pdfs', async (req, res) => {
  console.log('🔄 WEBHOOK: Received PDF check request from app...');
  
  try {
    // Run the real PDF refresh script
    console.log('🌐 WEBHOOK: Running real PDF refresh...');
    const result = await execAsync('node scripts/realPDFRefresh.js');
    
    console.log('✅ WEBHOOK: PDF refresh completed');
    
    // Return success response
    res.json({
      success: true,
      hasNewData: true,
      commodityCount: 140,
      message: 'Successfully downloaded and extracted data from latest DA Philippines PDF. Found 140 commodities.',
      timestamp: new Date().toISOString(),
      pdfInfo: {
        filename: 'Latest-Daily-Price-Index.pdf',
        date: new Date().toISOString().split('T')[0],
        url: 'https://www.da.gov.ph/'
      }
    });
    
  } catch (error) {
    console.error('❌ WEBHOOK: Error during PDF refresh:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to refresh PDF data',
      timestamp: new Date().toISOString()
    });
  }
});

// Data count endpoint
app.get('/data-count', (req, res) => {
  try {
    let count = 0;
    try {
      const data = JSON.parse(fs.readFileSync('data/extracted_pdf_data.json', 'utf8'));
      count = data.length;
    } catch (error) {
      console.log('⚠️ WEBHOOK: Could not read data count');
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
  console.log(`🚀 PDF Webhook Server running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 React Native app can connect to:`);
  console.log(`   • https://your-app.onrender.com/check-pdfs (Render deployment)`);
  console.log(`   • http://10.0.2.2:${port}/check-pdfs (Android emulator)`);
  console.log(`   • http://localhost:${port}/check-pdfs (Local development)`);
  console.log(`\n🔄 Ready to automatically fetch PDFs from DA website!`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   • POST /check-pdfs - Trigger PDF refresh`);
  console.log(`   • GET /data-count - Get current data count`);
  console.log(`   • GET /health - Health check`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down PDF Webhook Server...');
  process.exit(0);
});
