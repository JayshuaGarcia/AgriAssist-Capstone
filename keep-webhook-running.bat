@echo off
echo 🔄 KEEPING PDF WEBHOOK SERVER RUNNING...
echo ========================================
echo.

echo 📡 Starting auto-restart system...
echo 🔄 Server will automatically restart if it crashes
echo 📱 Your app will always have access to automatic PDF fetching
echo 🛑 Press Ctrl+C to stop
echo.

node scripts/keepRunning.js

echo.
echo 🛑 Auto-restart system stopped
pause
