@echo off
echo 🚀 DEPLOYING TO RAILWAY...
echo ==========================
echo.

echo 📦 Installing Railway CLI...
npm install -g @railway/cli

echo.
echo 🔐 Login to Railway...
railway login

echo.
echo 🌐 Deploying to Railway...
railway deploy

echo.
echo ✅ Deployment complete!
echo 📱 Update your app to use the new URL
echo 🔄 Your app will now fetch PDFs from the cloud
echo.
pause
