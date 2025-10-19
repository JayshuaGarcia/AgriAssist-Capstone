const fs = require('fs');
const path = require('path');

console.log('🔄 TRIGGERING PDF CHECK FROM APP');
console.log('===============================');

// Create a trigger file that the monitoring script can check
const triggerData = {
  action: 'check_new_pdfs',
  timestamp: new Date().toISOString(),
  source: 'admin_pdf_data_refresh',
  status: 'requested'
};

try {
  // Write trigger file
  fs.writeFileSync('pdf_check_trigger.json', JSON.stringify(triggerData, null, 2));
  console.log('✅ Created PDF check trigger file');
  
  // Run the PDF monitoring script
  console.log('🌐 Running PDF monitoring script...');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  execAsync('node scripts/autoPDFMonitor.js')
    .then(({ stdout, stderr }) => {
      if (stderr) {
        console.log('⚠️ Script warnings:', stderr);
      }
      
      console.log('📄 PDF monitoring result:', stdout);
      
      // Update trigger file with result
      const resultData = {
        ...triggerData,
        status: 'completed',
        completedAt: new Date().toISOString(),
        result: stdout
      };
      
      fs.writeFileSync('pdf_check_trigger.json', JSON.stringify(resultData, null, 2));
      console.log('✅ Updated trigger file with result');
      
      // Check if new data was extracted
      try {
        const extractedData = JSON.parse(fs.readFileSync('data/extracted_pdf_data.json', 'utf8'));
        console.log(`✅ Found ${extractedData.length} commodities after check`);
      } catch (error) {
        console.log('⚠️ Could not read updated data:', error);
      }
      
    })
    .catch((error) => {
      console.error('❌ Error running PDF monitoring script:', error);
      
      // Update trigger file with error
      const errorData = {
        ...triggerData,
        status: 'error',
        completedAt: new Date().toISOString(),
        error: error.message
      };
      
      fs.writeFileSync('pdf_check_trigger.json', JSON.stringify(errorData, null, 2));
    });
    
} catch (error) {
  console.error('❌ Error creating trigger file:', error);
}
