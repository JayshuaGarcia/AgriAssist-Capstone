const AutoPDFMonitor = require('./autoPDFMonitor');
const fs = require('fs');
const path = require('path');

console.log('🚀 STARTING AUTOMATED PDF MONITOR...');

// Create necessary directories
const dataDir = path.join(__dirname, '../data');
const pdfsDir = path.join(dataDir, 'pdfs');
const extractedDir = path.join(dataDir, 'extracted');

[dataDir, pdfsDir, extractedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Check if Python dependencies are available
const { exec } = require('child_process');

function checkPythonDependencies() {
    return new Promise((resolve) => {
        exec('python -c "import requests, bs4, pdfplumber"', (error) => {
            if (error) {
                console.log('⚠️ Installing Python dependencies...');
                exec('python -m pip install requests beautifulsoup4 pdfplumber', (installError) => {
                    if (installError) {
                        console.error('❌ Failed to install Python dependencies:', installError.message);
                        resolve(false);
                    } else {
                        console.log('✅ Python dependencies installed successfully');
                        resolve(true);
                    }
                });
            } else {
                console.log('✅ Python dependencies are available');
                resolve(true);
            }
        });
    });
}

async function startMonitoring() {
    console.log('🔍 Checking system requirements...');
    
    const depsOk = await checkPythonDependencies();
    if (!depsOk) {
        console.error('❌ Cannot start monitoring - missing dependencies');
        process.exit(1);
    }
    
    console.log('✅ All requirements met');
    console.log('🤖 Starting automated PDF monitoring...');
    
    const monitor = new AutoPDFMonitor();
    
    // Get monitoring interval from command line or use default
    const interval = process.argv[2] ? parseInt(process.argv[2]) : 60; // Default 60 minutes
    
    console.log(`⏰ Monitoring interval: ${interval} minutes`);
    console.log('📋 Commands:');
    console.log('  - Press Ctrl+C to stop monitoring');
    console.log('  - Run with --once to check once and exit');
    console.log('  - Run with <minutes> to set custom interval');
    console.log('');
    
    if (process.argv.includes('--once')) {
        console.log('🔄 Running single check...');
        await monitor.checkForNewPDF();
        process.exit(0);
    } else {
        await monitor.startMonitoring(interval);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping automated PDF monitor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping automated PDF monitor...');
    process.exit(0);
});

// Start the monitoring
startMonitoring().catch(console.error);


