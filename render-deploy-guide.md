# 🚀 Render.com Deployment Guide

## 📋 Prerequisites
1. GitHub account
2. Render.com account (free)
3. Your AgriAssist project pushed to GitHub

## 🔧 Step-by-Step Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Add PDF API for Render deployment"
git push origin main
```

### 2. Connect to Render
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository

### 3. Configure Service
- **Name**: `agriassist-pdf-api`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node scripts/webhookServer.js`
- **Health Check Path**: `/health`

### 4. Environment Variables
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render's default)

### 5. Deploy
- Click "Create Web Service"
- Wait for deployment (2-3 minutes)
- Get your URL: `https://your-app.onrender.com`

## 📱 Update Your App
Replace localhost URLs with your Render URL:
- `https://your-app.onrender.com/check-pdfs`

## ✅ Benefits
- ✅ Always online (24/7)
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Built-in monitoring
- ✅ No local server needed
