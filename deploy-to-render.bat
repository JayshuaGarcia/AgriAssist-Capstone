@echo off
echo 🚀 DEPLOYING TO RENDER.COM...
echo =============================
echo.

echo 📋 Step 1: Preparing files for deployment...
echo ✅ render.yaml - Render configuration
echo ✅ scripts/renderPDFService.js - Optimized service
echo ✅ package.json - Dependencies
echo.

echo 📋 Step 2: Git operations...
echo 🔄 Adding all files to git...
git add .

echo.
echo 💾 Committing changes...
git commit -m "Deploy PDF API to Render.com"

echo.
echo 📤 Pushing to GitHub...
git push origin main

echo.
echo ✅ Files pushed to GitHub!
echo.
echo 🌐 Next steps:
echo    1. Go to https://render.com
echo    2. Sign up/Login with GitHub
echo    3. Click "New +" → "Web Service"
echo    4. Connect your GitHub repository
echo    5. Configure:
echo       - Name: agriassist-pdf-api
echo       - Environment: Node
echo       - Build Command: npm install
echo       - Start Command: node scripts/renderPDFService.js
echo       - Health Check Path: /health
echo    6. Click "Create Web Service"
echo    7. Wait for deployment (2-3 minutes)
echo    8. Get your URL: https://your-app.onrender.com
echo.
echo 📱 After deployment, update your app with the new URL!
echo.
pause
