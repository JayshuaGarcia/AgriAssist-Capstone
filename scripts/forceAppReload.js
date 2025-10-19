/**
 * 🔄 FORCE APP RELOAD - Clear All Caches and Force New Data
 * This script creates a trigger file to force the app to reload all data
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 FORCING APP TO RELOAD WITH NEW PRICES...');

// Create a trigger file that the app can check
const triggerFile = path.join(__dirname, '..', 'FORCE_RELOAD.txt');
const triggerContent = `FORCE RELOAD TRIGGER
Created: ${new Date().toISOString()}
Action: Clear all caches and reload price data
Reason: User requested price update

This file should be deleted after the app reloads.
`;

fs.writeFileSync(triggerFile, triggerContent);
console.log('✅ Created force reload trigger file');

// Also create a backup of the current price data with a timestamp
const priceDataPath = path.join(__dirname, '..', 'data', 'priceData.json');
const backupPath = path.join(__dirname, '..', 'data', `priceData_backup_${Date.now()}.json`);

if (fs.existsSync(priceDataPath)) {
  fs.copyFileSync(priceDataPath, backupPath);
  console.log('✅ Created backup of price data');
}

// Verify the current price data
const priceData = JSON.parse(fs.readFileSync(priceDataPath, 'utf8'));
console.log(`\n📊 Current price data: ${priceData.length} records`);

// Show the key prices that should be updated
const keyPrices = [
  { type: 'Beef Striploin, Local', expected: 472.4 },
  { type: 'Beef Brisket, Local', expected: 355 },
  { type: 'Beef Chuck, Local', expected: 320 }
];

console.log('\n🎯 PRICES THAT SHOULD BE UPDATED:');
keyPrices.forEach(({ type, expected }) => {
  const found = priceData.find(p => p.Type === type);
  if (found) {
    const status = found.Amount === expected ? '✅' : '❌';
    console.log(`${status} ${type}: ₱${found.Amount} (expected: ₱${expected})`);
  } else {
    console.log(`❌ ${type}: NOT FOUND`);
  }
});

console.log('\n🚀 WHAT TO DO NOW:');
console.log('1. 📱 CLOSE your app completely (swipe up and close it)');
console.log('2. ⏳ Wait 5 seconds');
console.log('3. 📱 OPEN your app again');
console.log('4. 🔄 The app should now load the new prices');
console.log('5. 📊 Check if you see:');
console.log('   - Beef Brisket: ₱355.00 (not ₱415.11)');
console.log('   - Beef Chuck: ₱320.00 (not ₱399.73)');

console.log('\n💡 IF IT STILL SHOWS OLD PRICES:');
console.log('1. Try the "Load from Firebase" button');
console.log('2. Or go to Settings and clear app data');
console.log('3. Or uninstall and reinstall the app');

console.log('\n🎉 READY! Restart your app now!');


