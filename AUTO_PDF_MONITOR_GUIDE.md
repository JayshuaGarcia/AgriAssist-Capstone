# 🤖 Automated PDF Monitor Setup Guide

## Overview
This system automatically monitors the DA Philippines website for new PDF files, downloads them, extracts commodity data using pdfplumber, and updates the "Manage PDF Data" screen in your app.

## 🚀 Quick Setup

### Windows:
```bash
# Run the setup script
scripts/setupAutoPDF.bat

# Start monitoring (checks every 60 minutes)
node scripts/startAutoPDFMonitor.js

# Check once and exit
node scripts/startAutoPDFMonitor.js --once

# Custom interval (e.g., 30 minutes)
node scripts/startAutoPDFMonitor.js 30
```

### Linux/Mac:
```bash
# Run the setup script
chmod +x scripts/setupAutoPDF.sh
./scripts/setupAutoPDF.sh

# Start monitoring
node scripts/startAutoPDFMonitor.js
```

## 📋 What It Does

1. **🔍 Monitors DA Website**: Checks `https://www.da.gov.ph/daily-price-index/` for new PDF files
2. **📥 Downloads New PDFs**: Automatically downloads new Daily Price Index PDFs
3. **📊 Extracts Data**: Uses pdfplumber to extract commodity, specification, and price data
4. **🔄 Updates App**: Updates the "Manage PDF Data" screen with new data
5. **⏰ Runs Automatically**: Checks every hour (configurable)

## 📁 File Structure

```
scripts/
├── autoPDFMonitor.js          # Main monitoring script
├── checkNewPDF.py            # Checks DA website for new PDFs
├── downloadPDF.py            # Downloads PDF files
├── extract_pdf_data.py       # Extracts data using pdfplumber
├── startAutoPDFMonitor.js    # Setup and start script
├── setupAutoPDF.bat          # Windows setup
└── setupAutoPDF.sh           # Linux/Mac setup

data/
├── pdfs/                     # Downloaded PDF files
├── extracted/                # Extracted JSON data
├── last_pdf_check.json       # Last check timestamp
└── extracted_pdf_data.json   # Current data for app
```

## 🔧 How It Works

### 1. Website Monitoring
- Checks DA website every hour (configurable)
- Looks for new PDF files with "dpi" in the filename
- Compares with last downloaded file to detect new ones

### 2. PDF Download
- Downloads new PDFs to `data/pdfs/` directory
- Verifies file integrity and size
- Handles network errors gracefully

### 3. Data Extraction
- Uses pdfplumber to extract tables from PDF
- Identifies commodity, specification, and price columns
- Removes duplicates and cleans data
- Saves to JSON format

### 4. App Integration
- Updates `data/extracted_pdf_data.json`
- Admin "Manage PDF Data" screen loads from this file
- Shows all extracted commodities with real prices

## 🎯 Features

- ✅ **Automatic Detection**: Finds new PDFs without manual intervention
- ✅ **Smart Extraction**: Uses pdfplumber for accurate table extraction
- ✅ **Error Handling**: Graceful handling of network and parsing errors
- ✅ **Configurable**: Adjustable monitoring intervals
- ✅ **Logging**: Detailed console output for debugging
- ✅ **Fallback**: Uses existing data if extraction fails

## 📊 Data Format

Each extracted commodity includes:
```json
{
  "commodity": "Beef Striploin, Local",
  "specification": "Not specified",
  "price": 472.4,
  "unit": "kg",
  "region": "NCR",
  "date": "2025-10-18"
}
```

## 🛠️ Troubleshooting

### Python Dependencies Missing
```bash
python -m pip install requests beautifulsoup4 pdfplumber
```

### Network Issues
- Check internet connection
- Verify DA website is accessible
- Check firewall settings

### PDF Extraction Issues
- Ensure PDF file is not corrupted
- Check if PDF has readable tables
- Verify pdfplumber installation

### App Not Updating
- Check if `data/extracted_pdf_data.json` exists
- Verify file permissions
- Restart the app

## 🔄 Manual Operations

### Check for New PDFs Once
```bash
node scripts/startAutoPDFMonitor.js --once
```

### Extract Data from Specific PDF
```bash
python scripts/extract_pdf_data.py path/to/file.pdf path/to/output.json
```

### Download Specific PDF
```bash
python scripts/downloadPDF.py "https://url/to/file.pdf" "filename.pdf"
```

## 📈 Monitoring

The system logs all activities:
- ✅ New PDF detection
- 📥 Download progress
- 📊 Extraction results
- 🔄 App updates
- ❌ Error messages

## 🎉 Benefits

1. **Always Current**: Automatically gets latest DA price data
2. **No Manual Work**: Runs in background without intervention
3. **Accurate Data**: Uses pdfplumber for precise extraction
4. **Complete Coverage**: Shows all commodities from PDF
5. **Real-time Updates**: App reflects latest data immediately

## 🚀 Getting Started

1. Run the setup script for your platform
2. Start the monitoring system
3. Check the "Manage PDF Data" screen in your app
4. Monitor the console for activity logs

The system will automatically keep your app updated with the latest DA Philippines commodity prices!


