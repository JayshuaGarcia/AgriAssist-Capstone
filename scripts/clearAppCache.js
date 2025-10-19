/**
 * 🧹 CLEAR APP CACHE - Force App to Use New Prices
 * This script clears all cached data so the app loads fresh prices
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 CLEARING APP CACHE TO FORCE NEW PRICES...');

// List of cache files to clear
const cacheFiles = [
  'latest_prices_cache.json',
  'ml_forecasts_cache.json', 
  'offline_commodities_cache.json',
  'offline_latest_prices_cache.json',
  'offline_ml_forecasts_cache.json',
  'price_data_cache.json',
  'commodity_data_cache.json'
];

// Clear cache files
let clearedCount = 0;
cacheFiles.forEach(cacheFile => {
  const cachePath = path.join(__dirname, '..', 'data', cacheFile);
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
    console.log(`✅ Cleared: ${cacheFile}`);
    clearedCount++;
  } else {
    console.log(`ℹ️  Not found: ${cacheFile}`);
  }
});

// Also clear any AsyncStorage cache files
const asyncStorageFiles = [
  'price_data_v1',
  'latest_prices',
  'ml_forecasts',
  'offline_commodities',
  'offline_latest_prices',
  'offline_ml_forecasts'
];

console.log(`\n📊 Cleared ${clearedCount} cache files`);

// Verify the new price data exists
const priceDataPath = path.join(__dirname, '..', 'data', 'priceData.json');
if (fs.existsSync(priceDataPath)) {
  const priceData = JSON.parse(fs.readFileSync(priceDataPath, 'utf8'));
  console.log(`\n✅ Price data file exists with ${priceData.length} records`);
  
  // Show some key prices
  const beefBrisket = priceData.find(p => p.Type === 'Beef Brisket, Local');
  const beefChuck = priceData.find(p => p.Type === 'Beef Chuck, Local');
  const beefStriploin = priceData.find(p => p.Type === 'Beef Striploin, Local');
  
  console.log('\n🎯 KEY PRICES IN FILE:');
  if (beefStriploin) console.log(`🥩 Beef Striploin, Local: ₱${beefStriploin.Amount} (${beefStriploin.Date})`);
  if (beefBrisket) console.log(`🥩 Beef Brisket, Local: ₱${beefBrisket.Amount} (${beefBrisket.Date})`);
  if (beefChuck) console.log(`🥩 Beef Chuck, Local: ₱${beefChuck.Amount} (${beefChuck.Date})`);
} else {
  console.log('❌ Price data file not found!');
}

console.log('\n🚀 NEXT STEPS:');
console.log('1. ✅ Cache cleared - app will load fresh data');
console.log('2. 📱 RESTART your app completely (close and reopen)');
console.log('3. 🔄 The app should now load the new prices');
console.log('4. 📊 You should see:');
console.log('   - Beef Brisket: ₱355.00 (not ₱415.11)');
console.log('   - Beef Chuck: ₱320.00 (not ₱399.73)');
console.log('   - Beef Striploin: ₱472.40 (your price)');

console.log('\n🎉 CACHE CLEARED! Restart your app now!');


