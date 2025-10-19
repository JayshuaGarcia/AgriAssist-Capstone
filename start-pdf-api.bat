@echo off
echo 🚀 STARTING PDF API SERVER...
echo =============================
echo.

echo 📡 Starting Express API server for automatic PDF fetching...
echo 🌐 Server will run on: http://localhost:3001
echo 📱 React Native app will connect automatically
echo.

node scripts/pdfApiServer.js

echo.
echo 🛑 PDF API Server stopped
pause
