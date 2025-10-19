@echo off
echo 🚀 STARTING PDF WEBHOOK SERVER...
echo ==================================
echo.

echo 📡 Starting webhook server for automatic PDF fetching...
echo 🌐 Server will run on: http://localhost:3001
echo 📱 React Native app will connect automatically
echo 🔄 This will automatically fetch PDFs from DA website when you refresh
echo.

node scripts/webhookServer.js

echo.
echo 🛑 PDF Webhook Server stopped
pause
