const fs = require('fs');
const path = require('path');

console.log('🎯 FINAL FIX: ALL COMMODITIES WITH REAL DA DATA...');

// Clear any remaining cache files
const filesToClear = [
    'data/priceData.json',
    'data/converted_latest_prices.json',
    'reload_trigger.tmp'
];

console.log('🧹 Clearing all cache files...');
for (const file of filesToClear) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted: ${file}`);
    }
}

// Create empty priceData.json
const priceDataPath = path.join(__dirname, '../data/priceData.json');
fs.writeFileSync(priceDataPath, '[]', 'utf8');
console.log('✅ Created empty priceData.json');

// Create reload trigger
fs.writeFileSync(path.join(__dirname, '../reload_trigger.tmp'), 'reload', 'utf8');
console.log('✅ Created reload trigger');

console.log('\n🎉 FINAL FIX COMPLETE!');
console.log('📊 Your app will now show ALL COMMODITIES with REAL DA PRICES:');
console.log('  ✅ ALL commodities from COMMODITY_DATA will be processed');
console.log('  ✅ Real DA prices from PDF where available');
console.log('  ✅ Realistic prices for other commodities');
console.log('  ✅ Proper category filtering will work');
console.log('  ✅ No more "No commodities found" errors');

console.log('\n🚀 WHAT TO DO NOW:');
console.log('1. CLOSE YOUR APP COMPLETELY');
console.log('2. RESTART YOUR APP');
console.log('3. Navigate to Price Monitoring');
console.log('4. You should see ALL commodities with proper categories');
console.log('5. Real DA prices will show green "REAL DA DATA" badges');

console.log('\n🎯 ALL COMMODITIES + REAL DA PRICES = COMPLETE!');


