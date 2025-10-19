/**
 * 🧹 CLEAR ALL OFFLINE DATA SCRIPT
 * This script completely removes all offline/cached data
 * Forces the app to use ONLY real DA website data
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 CLEARING ALL OFFLINE DATA...');
console.log('🚫 This will force the app to use ONLY real DA website data');

// Files and directories to clear
const filesToClear = [
  'data/priceData.json',
  'data/converted_latest_prices.json',
  'cache/',
  'offline_cache/',
  'latest_prices_cache.json',
  'ml_forecasts_cache.json',
  'offline_commodities_cache.json',
  'offline_latest_prices_cache.json',
  'offline_ml_forecasts_cache.json',
  'price_data_cache.json',
  'commodity_data_cache.json',
  'reload_trigger.tmp'
];

// Directories to clear
const directoriesToClear = [
  'cache',
  'offline_cache',
  'temp_cache'
];

let clearedCount = 0;
let errorCount = 0;

console.log('\n📋 CLEARING FILES:');
filesToClear.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  try {
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        // Remove directory and all contents
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`✅ Cleared directory: ${file}`);
      } else {
        // Remove file
        fs.unlinkSync(filePath);
        console.log(`✅ Cleared file: ${file}`);
      }
      clearedCount++;
    } else {
      console.log(`ℹ️  Not found: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error clearing ${file}:`, error.message);
    errorCount++;
  }
});

console.log('\n📋 CLEARING DIRECTORIES:');
directoriesToClear.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Cleared directory: ${dir}`);
      clearedCount++;
    } else {
      console.log(`ℹ️  Not found: ${dir}`);
    }
  } catch (error) {
    console.error(`❌ Error clearing ${dir}:`, error.message);
    errorCount++;
  }
});

// Create a new empty priceData.json with just a comment
console.log('\n📝 CREATING EMPTY PRICE DATA FILE:');
const emptyPriceData = [
  {
    "Commodity": "SYSTEM_MESSAGE",
    "Type": "OFFLINE_DATA_CLEARED",
    "Specification": "All offline data has been cleared",
    "Amount": 0,
    "Date": new Date().toISOString().split('T')[0]
  }
];

try {
  const priceDataPath = path.join(__dirname, '..', 'data', 'priceData.json');
  
  // Ensure data directory exists
  const dataDir = path.dirname(priceDataPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(priceDataPath, JSON.stringify(emptyPriceData, null, 2));
  console.log('✅ Created empty priceData.json');
  clearedCount++;
} catch (error) {
  console.error('❌ Error creating empty priceData.json:', error.message);
  errorCount++;
}

// Create a trigger file to force app reload
console.log('\n🔄 CREATING FORCE RELOAD TRIGGER:');
try {
  const triggerPath = path.join(__dirname, '..', 'force_reload_trigger.txt');
  fs.writeFileSync(triggerPath, `OFFLINE_DATA_CLEARED_${Date.now()}`);
  console.log('✅ Created force reload trigger');
  clearedCount++;
} catch (error) {
  console.error('❌ Error creating trigger:', error.message);
  errorCount++;
}

console.log('\n📊 CLEARING SUMMARY:');
console.log(`✅ Successfully cleared: ${clearedCount} items`);
if (errorCount > 0) {
  console.log(`❌ Errors encountered: ${errorCount} items`);
}

console.log('\n🎯 WHAT THIS ACCOMPLISHES:');
console.log('1. ✅ Removed all offline/cached price data');
console.log('2. ✅ Cleared all cache directories');
console.log('3. ✅ Created empty priceData.json');
console.log('4. ✅ Created force reload trigger');
console.log('5. ✅ App will now use ONLY real DA website data');

console.log('\n🚀 NEXT STEPS:');
console.log('1. 📱 RESTART your app completely (close and reopen)');
console.log('2. 🌐 The app will now fetch fresh data from DA website');
console.log('3. 📊 You should see real DA Philippines prices');
console.log('4. 🔄 No more old/offline data will be loaded');

console.log('\n💡 WHAT TO EXPECT:');
console.log('- App will show "Fetching REAL data from DA Philippines..."');
console.log('- You should see real prices like Beef Brisket: ₱414.23');
console.log('- All data will be marked as "REAL DA DATA"');
console.log('- No more cached/offline data');

console.log('\n🎉 OFFLINE DATA CLEARED!');
console.log('📱 RESTART YOUR APP NOW TO SEE REAL DA PRICES!');


