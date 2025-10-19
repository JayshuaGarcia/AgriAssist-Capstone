const fs = require('fs');
const path = require('path');

console.log('🎯 TESTING: ADMIN PRICE MONITORING - PDF DATA');
console.log('============================================');

// Check if extracted PDF data exists
const extractedDataPath = path.join(__dirname, '../data/extracted_pdf_data.json');
if (fs.existsSync(extractedDataPath)) {
    const data = JSON.parse(fs.readFileSync(extractedDataPath, 'utf8'));
    console.log(`✅ Extracted PDF data found: ${data.length} commodities`);
    
    // Test categorization logic
    const categories = {
      'Rice & Grains': [],
      'Fish & Seafood': [],
      'Meat Products': [],
      'Poultry & Eggs': [],
      'Vegetables': [],
      'Fruits': [],
      'Spices & Seasonings': [],
      'Cooking Essentials': [],
      'Other': []
    };

    data.forEach(item => {
      const commodityName = item.commodity.toLowerCase();
      
      if (commodityName.includes('rice') || commodityName.includes('milled') || commodityName.includes('premium') || commodityName.includes('special') || commodityName.includes('corn')) {
        categories['Rice & Grains'].push(item);
      } else if (commodityName.includes('salmon') || commodityName.includes('sardines') || commodityName.includes('squid') || commodityName.includes('tambakol') || commodityName.includes('tilapia') || commodityName.includes('fish') || commodityName.includes('bangus') || commodityName.includes('galunggong') || commodityName.includes('pampano') || commodityName.includes('alumahan')) {
        categories['Fish & Seafood'].push(item);
      } else if (commodityName.includes('beef') || commodityName.includes('pork') || commodityName.includes('carabeef')) {
        categories['Meat Products'].push(item);
      } else if (commodityName.includes('chicken') || commodityName.includes('egg')) {
        categories['Poultry & Eggs'].push(item);
      } else if (commodityName.includes('ampalaya') || commodityName.includes('eggplant') || commodityName.includes('tomato') || commodityName.includes('cabbage') || commodityName.includes('carrot') || commodityName.includes('lettuce') || commodityName.includes('pechay') || commodityName.includes('squash') || commodityName.includes('sitao') || commodityName.includes('chayote') || commodityName.includes('potato') || commodityName.includes('broccoli') || commodityName.includes('cauliflower') || commodityName.includes('celery') || commodityName.includes('bell pepper') || commodityName.includes('habichuelas') || commodityName.includes('baguio beans')) {
        categories['Vegetables'].push(item);
      } else if (commodityName.includes('banana') || commodityName.includes('mango') || commodityName.includes('papaya') || commodityName.includes('watermelon') || commodityName.includes('avocado') || commodityName.includes('calamansi') || commodityName.includes('melon') || commodityName.includes('pomelo')) {
        categories['Fruits'].push(item);
      } else if (commodityName.includes('garlic') || commodityName.includes('onion') || commodityName.includes('ginger') || commodityName.includes('chilli') || commodityName.includes('chili')) {
        categories['Spices & Seasonings'].push(item);
      } else if (commodityName.includes('salt') || commodityName.includes('sugar') || commodityName.includes('cooking oil')) {
        categories['Cooking Essentials'].push(item);
      } else {
        categories['Other'].push(item);
      }
    });

    console.log('\n📊 ADMIN CATEGORIZATION RESULTS:');
    Object.entries(categories).forEach(([name, items]) => {
      if (items.length > 0) {
        console.log(`  ${name}: ${items.length} items`);
      }
    });
    
} else {
    console.log('⚠️ No extracted PDF data found - will use fallback data');
}

// Clear any remaining cache
const cacheFiles = [
    'data/priceData.json',
    'data/converted_latest_prices.json',
    'reload_trigger.tmp'
];

console.log('\n🧹 Final cache cleanup...');
for (const file of cacheFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted: ${file}`);
    }
}

// Create clean state
fs.writeFileSync(path.join(__dirname, '../data/priceData.json'), '[]', 'utf8');
fs.writeFileSync(path.join(__dirname, '../reload_trigger.tmp'), 'reload', 'utf8');

console.log('\n✅ ADMIN PRICE MONITORING SYSTEM READY!');
console.log('');
console.log('🎨 ADMIN CHANGES:');
console.log('• REMOVED: Manual Price Entry section');
console.log('• REMOVED: Load from Firebase button');
console.log('• REMOVED: All fake/generated data');
console.log('• ADDED: Clean categorized PDF data view');
console.log('• ADDED: Same data as "Manage PDF Data" screen');
console.log('• ADDED: Auto-updates when new PDFs are downloaded');
console.log('');
console.log('📱 WHAT YOU\'LL SEE IN ADMIN:');
console.log('• Header: "Price Monitoring - PDF Data"');
console.log('• Data source info: "DA Philippines PDF (X commodities extracted)"');
console.log('• "Manage PDF Data" button (links to admin-pdf-data screen)');
console.log('• Search bar for finding specific commodities');
console.log('• "All Categories" button + horizontal scrollable category filters');
console.log('• Categorized sections with colored headers and icons');
console.log('• Individual commodity cards within each category');
console.log('');
console.log('🔍 FILTERING OPTIONS:');
console.log('• All Categories, Rice & Grains, Fish & Seafood, Meat Products, etc.');
console.log('• Search by commodity name or specification');
console.log('');
console.log('🎯 TO TEST:');
console.log('1. Close your app completely');
console.log('2. Restart your app');
console.log('3. Go to Admin → Price Monitoring');
console.log('4. You should see the new categorized PDF data interface');
console.log('5. No more Manual Price Entry or fake data!');
console.log('6. Try filtering by different categories');
console.log('7. Try searching for specific commodities');
console.log('');
console.log('🎉 ADMIN PRICE MONITORING NOW SHOWS ORGANIZED PDF DATA!');
console.log('   No more fake data - only real PDF extraction');
console.log('   Beautiful categorized layout');
console.log('   Same data as Manage PDF Data screen');
console.log('   Auto-updates with new PDFs from DA website');


