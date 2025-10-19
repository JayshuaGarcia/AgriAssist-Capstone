const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🤖 AUTOMATED DA PDF MONITOR STARTING...');

// Configuration
const DA_WEBSITE_URL = 'https://www.da.gov.ph/daily-price-index/';
const DOWNLOAD_DIR = path.join(__dirname, '../data/pdfs');
const EXTRACTED_DIR = path.join(__dirname, '../data/extracted');
const LAST_CHECK_FILE = path.join(__dirname, '../data/last_pdf_check.json');

// Ensure directories exist
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(EXTRACTED_DIR)) {
    fs.mkdirSync(EXTRACTED_DIR, { recursive: true });
}

class AutoPDFMonitor {
    constructor() {
        this.lastCheckData = this.loadLastCheck();
    }

    loadLastCheck() {
        try {
            if (fs.existsSync(LAST_CHECK_FILE)) {
                return JSON.parse(fs.readFileSync(LAST_CHECK_FILE, 'utf8'));
            }
        } catch (error) {
            console.log('⚠️ No previous check data found, starting fresh');
        }
        return { lastCheck: null, lastPDF: null };
    }

    saveLastCheck() {
        fs.writeFileSync(LAST_CHECK_FILE, JSON.stringify(this.lastCheckData, null, 2));
    }

    async checkForNewPDF() {
        console.log('🔍 Checking DA website for new PDF files...');
        
        try {
            // Use Python script to check for new PDFs
            const pythonScript = path.join(__dirname, 'checkNewPDF.py');
            const result = await this.runPythonScript(pythonScript);
            
            if (result.success && result.newPDF) {
                console.log(`✅ New PDF found: ${result.newPDF.filename}`);
                console.log(`📅 Date: ${result.newPDF.date}`);
                console.log(`🔗 URL: ${result.newPDF.url}`);
                
                // Download the new PDF
                await this.downloadPDF(result.newPDF);
                
                // Extract data using pdfplumber
                await this.extractPDFData(result.newPDF.filename);
                
                // Update the app data
                await this.updateAppData();
                
                // Update last check
                this.lastCheckData.lastCheck = new Date().toISOString();
                this.lastCheckData.lastPDF = result.newPDF;
                this.saveLastCheck();
                
                console.log('🎉 Automated PDF processing completed successfully!');
                return true;
            } else {
                console.log('ℹ️ No new PDF files found');
                this.lastCheckData.lastCheck = new Date().toISOString();
                this.saveLastCheck();
                return false;
            }
        } catch (error) {
            console.error('❌ Error checking for new PDF:', error);
            return false;
        }
    }

    async runPythonScript(scriptPath) {
        return new Promise((resolve) => {
            exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Python script error:', error);
                    resolve({ success: false, error: error.message });
                    return;
                }
                
                try {
                    const result = JSON.parse(stdout.trim());
                    resolve({ success: true, ...result });
                } catch (parseError) {
                    console.error('❌ Failed to parse Python script output:', parseError);
                    resolve({ success: false, error: 'Invalid JSON output' });
                }
            });
        });
    }

    async downloadPDF(pdfInfo) {
        console.log(`📥 Downloading PDF: ${pdfInfo.filename}`);
        
        const downloadScript = path.join(__dirname, 'downloadPDF.py');
        const result = await this.runPythonScript(downloadScript, [pdfInfo.url, pdfInfo.filename]);
        
        if (result.success) {
            console.log(`✅ PDF downloaded successfully: ${pdfInfo.filename}`);
        } else {
            throw new Error(`Failed to download PDF: ${result.error}`);
        }
    }

    async extractPDFData(filename) {
        console.log(`📊 Extracting data from PDF: ${filename}`);
        
        const extractScript = path.join(__dirname, 'extract_pdf_data.py');
        const pdfPath = path.join(DOWNLOAD_DIR, filename);
        const outputPath = path.join(EXTRACTED_DIR, filename.replace('.pdf', '_extracted.json'));
        
        const result = await this.runPythonScript(extractScript, [pdfPath, outputPath]);
        
        if (result.success) {
            console.log(`✅ Data extracted successfully: ${result.commodityCount} commodities`);
        } else {
            throw new Error(`Failed to extract PDF data: ${result.error}`);
        }
    }

    async updateAppData() {
        console.log('🔄 Updating app data...');
        
        // Find the latest extracted data
        const extractedFiles = fs.readdirSync(EXTRACTED_DIR)
            .filter(file => file.endsWith('_extracted.json'))
            .sort()
            .reverse();
        
        if (extractedFiles.length > 0) {
            const latestFile = extractedFiles[0];
            const latestDataPath = path.join(EXTRACTED_DIR, latestFile);
            
            // Copy to main data directory
            const mainDataPath = path.join(__dirname, '../data/extracted_pdf_data.json');
            fs.copyFileSync(latestDataPath, mainDataPath);
            
            console.log(`✅ App data updated with: ${latestFile}`);
            console.log(`📊 ${JSON.parse(fs.readFileSync(mainDataPath, 'utf8')).length} commodities loaded`);
        }
    }

    async startMonitoring(intervalMinutes = 60) {
        console.log(`🚀 Starting automated PDF monitoring (checking every ${intervalMinutes} minutes)`);
        
        // Initial check
        await this.checkForNewPDF();
        
        // Set up interval
        setInterval(async () => {
            console.log(`\n⏰ Scheduled check at ${new Date().toLocaleString()}`);
            await this.checkForNewPDF();
        }, intervalMinutes * 60 * 1000);
    }
}

// Main execution
async function main() {
    const monitor = new AutoPDFMonitor();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const interval = args[0] ? parseInt(args[0]) : 60; // Default 60 minutes
    
    if (args.includes('--once')) {
        // Run once and exit
        console.log('🔄 Running single check...');
        await monitor.checkForNewPDF();
        process.exit(0);
    } else {
        // Start continuous monitoring
        await monitor.startMonitoring(interval);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AutoPDFMonitor;


