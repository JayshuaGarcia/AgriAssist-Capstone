@echo off
echo 🔄 CHECKING DA WEBSITE FOR NEW PDFS...
echo =====================================
echo.

echo 🌐 Running REAL PDF refresh from DA website...
node scripts/realPDFRefresh.js

echo.
echo ✅ REAL PDF REFRESH COMPLETE!
echo 📱 Now pull down to refresh in your app
echo 📊 Should show "New Data Found" message with latest data
echo 🌐 Data fetched directly from DA Philippines website
echo.
pause
