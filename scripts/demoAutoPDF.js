const AutoPDFMonitor = require('./autoPDFMonitor');

console.log('🎯 AUTOMATED PDF MONITOR DEMO');
console.log('============================');
console.log('');

async function runDemo() {
    console.log('📋 This system will:');
    console.log('1. 🔍 Monitor DA Philippines website for new PDF files');
    console.log('2. 📥 Automatically download new Daily Price Index PDFs');
    console.log('3. 📊 Extract commodity data using pdfplumber');
    console.log('4. 🔄 Update your app\'s "Manage PDF Data" screen');
    console.log('5. ⏰ Run continuously (configurable intervals)');
    console.log('');
    
    console.log('🚀 Starting demo check...');
    console.log('');
    
    const monitor = new AutoPDFMonitor();
    const result = await monitor.checkForNewPDF();
    
    console.log('');
    console.log('📊 Demo Results:');
    if (result) {
        console.log('✅ System is working correctly!');
        console.log('📁 Check data/pdfs/ for downloaded files');
        console.log('📁 Check data/extracted/ for extracted data');
        console.log('📱 Check "Manage PDF Data" in your app');
    } else {
        console.log('ℹ️ No new PDFs found (this is normal)');
        console.log('✅ System is ready to monitor for new files');
    }
    
    console.log('');
    console.log('🎯 To start continuous monitoring:');
    console.log('   node scripts/startAutoPDFMonitor.js');
    console.log('');
    console.log('⏰ To set custom interval (e.g., 30 minutes):');
    console.log('   node scripts/startAutoPDFMonitor.js 30');
    console.log('');
    console.log('🔄 To check once:');
    console.log('   node scripts/startAutoPDFMonitor.js --once');
    console.log('');
    console.log('📖 For full documentation:');
    console.log('   See AUTO_PDF_MONITOR_GUIDE.md');
}

runDemo().catch(console.error);


