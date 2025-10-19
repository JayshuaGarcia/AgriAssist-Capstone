@echo off
echo 🤖 SETTING UP AUTOMATED PDF MONITOR...
echo.

echo 📦 Installing Node.js dependencies...
npm install

echo.
echo 🐍 Installing Python dependencies...
python -m pip install requests beautifulsoup4 pdfplumber

echo.
echo 📁 Creating directories...
if not exist "data\pdfs" mkdir "data\pdfs"
if not exist "data\extracted" mkdir "data\extracted"

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start monitoring:
echo    node scripts/startAutoPDFMonitor.js
echo.
echo 🔄 To check once:
echo    node scripts/startAutoPDFMonitor.js --once
echo.
echo ⏰ To set custom interval (e.g., 30 minutes):
echo    node scripts/startAutoPDFMonitor.js 30
echo.
pause


