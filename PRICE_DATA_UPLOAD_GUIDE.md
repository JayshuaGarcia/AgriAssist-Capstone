# 📊 Price Data Upload Guide for ML

## 🎯 **What You Need to Know**

Your AgriAssist app already has commodity data, but for machine learning to predict prices, we need **price history data**. Here are 3 ways to upload your price data:

## 🚀 **Method 1: Automatic Migration (Easiest)**

### **What it does:**
- Converts your existing commodity data
- Generates sample price history for ML training
- Sets up Firebase collections automatically
- Creates initial ML predictions

### **Steps:**

#### **1. Set up Firebase Configuration**

Create a `.env` file in your project root with:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**How to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon → Project Settings
4. Scroll down to "Your apps" section
5. Copy the config values

#### **2. Run the Migration Script**

```bash
node scripts/runMLMigration.mjs
```

#### **3. Test the ML System**

1. Start your app: `npm start`
2. Go to Price Monitoring
3. Tap the analytics button (📊)
4. View your ML predictions!

---

## ✍️ **Method 2: Manual Price Entry**

### **What it does:**
- You manually enter current prices
- ML uses these for predictions
- Good for small datasets

### **Steps:**

#### **1. Open Admin Panel**
- Login as admin
- Go to Admin section

#### **2. Use Manual Price Entry**
- Find "Manual Price Entry" section
- Select commodity from dropdown
- Enter current price
- Select date
- Click "Add Price"

#### **3. Repeat for All Commodities**
- Enter prices for all 218+ commodities
- ML will use these for predictions

### **Example:**
```
Commodity: Beef Brisket, Imported
Price: ₱450.00
Date: Today
Unit: kg
```

---

## 📊 **Method 3: Import from Excel/CSV**

### **What it does:**
- Import bulk price data from files
- Good for large datasets
- Supports historical data

### **Steps:**

#### **1. Prepare Your Data**

Create an Excel/CSV file with columns:
```
commodity_name,price,date,unit,source
Beef Brisket Imported,450.00,2024-01-15,kg,manual
Pork Belly Local,320.00,2024-01-15,kg,manual
Rice Premium,65.00,2024-01-15,kg,manual
```

#### **2. Use Data Import Feature**
- Go to Admin panel
- Find "Data Import" section
- Upload your file
- Map columns correctly
- Import data

#### **3. Verify Import**
- Check that prices are imported
- ML will process the data automatically

---

## 🎯 **Which Method Should You Use?**

### **For Beginners: Method 1 (Automatic)**
- ✅ Easiest to set up
- ✅ Works immediately
- ✅ Generates sample data
- ✅ Good for testing

### **For Real Data: Method 2 (Manual)**
- ✅ Use your actual prices
- ✅ More accurate predictions
- ✅ Full control over data
- ⚠️ Takes more time

### **For Bulk Data: Method 3 (Import)**
- ✅ Import many prices at once
- ✅ Include historical data
- ✅ Most comprehensive
- ⚠️ Requires file preparation

---

## 📈 **What Happens After Upload?**

### **Automatic Processing:**
1. **Data Validation** - Checks for errors
2. **ML Training** - Analyzes price patterns
3. **Prediction Generation** - Creates forecasts
4. **Confidence Scoring** - Shows prediction accuracy

### **ML Features:**
- 📊 **Price Trends** - Up/Down/Stable
- 🎯 **Confidence Scores** - 60-95%
- 📅 **Next Week Forecast** - Short-term prediction
- 📆 **Next Month Forecast** - Medium-term prediction
- 🔍 **Key Factors** - What influences prices

---

## 🛠️ **Troubleshooting**

### **"No price data found"**
- ✅ Run migration script first
- ✅ Check Firebase configuration
- ✅ Verify data import

### **"Low confidence predictions"**
- ✅ Add more price history
- ✅ Update prices regularly
- ✅ Include seasonal data

### **"ML predictions not working"**
- ✅ Check Firebase connection
- ✅ Verify Firestore rules
- ✅ Restart the app

---

## 🎉 **Expected Results**

### **After Successful Upload:**
- ✅ 218+ commodities with ML predictions
- ✅ Confidence scores for each prediction
- ✅ Trend analysis (up/down/stable)
- ✅ Next week and month forecasts
- ✅ Key factors influencing predictions

### **Sample Output:**
```
🥩 Beef Brisket, Imported
Current: ₱450.00 → Predicted: ₱465.00
Confidence: 85% | Trend: UP
Factors: Rising trend, Seasonal demand
Next Week: ₱465.00 | Next Month: ₱480.00
```

---

## 🚀 **Quick Start (Recommended)**

1. **Set up Firebase config** (5 minutes)
2. **Run migration script** (2 minutes)
3. **Test ML predictions** (1 minute)
4. **Start using the system!**

**Total time: 8 minutes** ⏱️

---

## 📞 **Need Help?**

### **Common Issues:**
- Firebase configuration errors
- Permission denied errors
- No predictions generated
- App crashes on ML screen

### **Solutions:**
- Check the setup guide step by step
- Verify Firebase project settings
- Test with simple data first
- Check console logs for errors

---

**🎯 Ready to get started? Choose Method 1 for the easiest setup!**






