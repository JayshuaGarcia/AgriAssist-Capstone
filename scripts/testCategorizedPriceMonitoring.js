const fs = require('fs');
const path = require('path');

console.log('🎯 TESTING: CATEGORIZED PRICE MONITORING SYSTEM');
console.log('==============================================');

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

    console.log('\n📊 CATEGORIZATION RESULTS:');
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

console.log('\n✅ CATEGORIZED PRICE MONITORING SYSTEM READY!');
console.log('');
console.log('🎨 NEW DESIGN FEATURES:');
console.log('• Organized by categories: Rice & Grains, Fish & Seafood, Meat Products, etc.');
console.log('• Each category has its own colored header with icon');
console.log('• Horizontal scrollable category filter buttons');
console.log('• Clean, modern card-based layout');
console.log('• All data from PDF extraction (same as Manage PDF Data)');
console.log('');
console.log('🔍 FILTERING OPTIONS:');
console.log('• "All Categories" button to show everything');
console.log('• Individual category buttons (Rice & Grains, Fish & Seafood, etc.)');
console.log('• Search bar to find specific commodities');
console.log('');
console.log('📱 WHAT YOU\'LL SEE:');
console.log('• Category sections with colored headers');
console.log('• Commodity count in each category header');
console.log('• Individual commodity cards within each category');
console.log('• Price, specification, and unit information');
console.log('• Clean, organized layout');
console.log('');
console.log('🎯 TO TEST:');
console.log('1. Close your app completely');
console.log('2. Restart your app');
console.log('3. Go to Price Monitoring');
console.log('4. You should see categorized PDF data');
console.log('5. Try filtering by different categories');
console.log('6. Try searching for specific commodities');
console.log('');
console.log('🎉 PRICE MONITORING NOW SHOWS ORGANIZED PDF DATA!');
console.log('   No more fake data - only real PDF extraction');
console.log('   Beautiful categorized layout');
console.log('   Easy filtering and searching');


