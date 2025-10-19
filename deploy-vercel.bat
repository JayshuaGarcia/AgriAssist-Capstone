@echo off
echo 🚀 DEPLOYING TO VERCEL...
echo =========================
echo.

echo 📦 Installing Vercel CLI...
npm install -g vercel

echo.
echo 🌐 Deploying to Vercel...
vercel --prod

echo.
echo ✅ Deployment complete!
echo 📱 Update your app to use the new URL
echo 🔄 Your app will now fetch PDFs from the cloud
echo.
pause
