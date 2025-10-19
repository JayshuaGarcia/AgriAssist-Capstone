const fs = require('fs');
const path = require('path');

console.log('🔄 BACKGROUND PDF MONITOR STARTED');
console.log('=================================');

// Function to check for trigger file and process it
async function checkForTrigger() {
  try {
    const triggerFile = 'pdf_check_trigger.json';
    
    if (fs.existsSync(triggerFile)) {
      console.log('📄 Found trigger file, processing...');
      
      // Read trigger file
      const triggerData = JSON.parse(fs.readFileSync(triggerFile, 'utf8'));
      
      if (triggerData.status === 'requested') {
        console.log('🔄 Processing PDF check request...');
        
        // Update status to processing
        triggerData.status = 'processing';
        triggerData.processingAt = new Date().toISOString();
        fs.writeFileSync(triggerFile, JSON.stringify(triggerData, null, 2));
        
        try {
          // Run the PDF monitoring script
          const { exec } = require('child_process');
          const util = require('util');
          const execAsync = util.promisify(exec);
          
          console.log('🌐 Running PDF monitoring script...');
          const { stdout, stderr } = await execAsync('node scripts/autoPDFMonitor.js');
          
          if (stderr) {
            console.log('⚠️ Script warnings:', stderr);
          }
          
          console.log('📄 PDF monitoring result:', stdout);
          
          // Update trigger file with success
          triggerData.status = 'completed';
          triggerData.completedAt = new Date().toISOString();
          triggerData.result = stdout;
          
          // Check if new data was extracted
          try {
            const extractedData = JSON.parse(fs.readFileSync('data/extracted_pdf_data.json', 'utf8'));
            triggerData.commodityCount = extractedData.length;
            console.log(`✅ Found ${extractedData.length} commodities after check`);
          } catch (error) {
            console.log('⚠️ Could not read updated data:', error);
          }
          
          fs.writeFileSync(triggerFile, JSON.stringify(triggerData, null, 2));
          console.log('✅ Trigger file updated with success result');
          
        } catch (error) {
          console.error('❌ Error running PDF monitoring script:', error);
          
          // Update trigger file with error
          triggerData.status = 'error';
          triggerData.completedAt = new Date().toISOString();
          triggerData.error = error.message;
          fs.writeFileSync(triggerFile, JSON.stringify(triggerData, null, 2));
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking trigger file:', error);
  }
}

// Check for trigger file every 2 seconds
setInterval(checkForTrigger, 2000);

console.log('🔄 Background monitor is running...');
console.log('📄 Checking for trigger files every 2 seconds');
console.log('🌐 Will automatically run PDF monitoring when triggered');
console.log('⏹️  Press Ctrl+C to stop');

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n🛑 Background PDF monitor stopped');
  process.exit(0);
});
