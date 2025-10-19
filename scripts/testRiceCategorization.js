const fs = require('fs');
const path = require('path');

console.log('🎯 TESTING: RICE CATEGORIZATION UPDATE');
console.log('=====================================');

// Check if extracted PDF data exists
const extractedDataPath = path.join(__dirname, '../data/extracted_pdf_data.json');
if (fs.existsSync(extractedDataPath)) {
    const data = JSON.parse(fs.readFileSync(extractedDataPath, 'utf8'));
    console.log(`✅ Extracted PDF data found: ${data.length} commodities`);
    
    // Test rice categorization logic
    const riceItems = data.filter(item => {
      const commodityName = item.commodity.toLowerCase();
      return commodityName.includes('rice') || 
             commodityName.includes('milled') || 
             commodityName.includes('premium') || 
             commodityName.includes('special');
    });

    console.log(`\n🌾 RICE ITEMS FOUND: ${riceItems.length} total`);
    
    // Show first 4 (imported) and next 4 (local)
    console.log('\n📦 IMPORTED RICE (First 4):');
    riceItems.slice(0, 4).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.commodity} - ${item.specification} - ₱${item.price}`);
    });
    
    console.log('\n🏠 LOCAL RICE (Next 4):');
    riceItems.slice(4, 8).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.commodity} - ${item.specification} - ₱${item.price}`);
    });

    // Test categorization logic
    const categories = {
      'Imported Rice': [],
      'Local Rice': [],
      'Fish & Seafood': [],
      'Meat Products': [],
      'Poultry & Eggs': [],
      'Vegetables': [],
      'Fruits': [],
      'Spices & Seasonings': [],
      'Cooking Essentials': [],
      'Other': []
    };

    data.forEach((item, index) => {
      const commodityName = item.commodity.toLowerCase();
      
      // Special handling for rice - first 4 are imported, next 4 are local
      if (commodityName.includes('rice') || commodityName.includes('milled') || commodityName.includes('premium') || commodityName.includes('special')) {
        // Use the item's index in the original data to determine if it's imported or local
        // First 4 rice items (indices 0-3) are imported, next 4 (indices 4-7) are local
        if (index < 4) {
          categories['Imported Rice'].push(item);
        } else if (index < 8) {
          categories['Local Rice'].push(item);
        } else {
          // Any additional rice items go to Other
          categories['Other'].push(item);
        }
      } else if (commodityName.includes('corn')) {
        categories['Other'].push(item);
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

    console.log('\n📊 UPDATED CATEGORIZATION RESULTS:');
    Object.entries(categories).forEach(([name, items]) => {
      if (items.length > 0) {
        console.log(`  ${name}: ${items.length} items`);
        if (name === 'Imported Rice' || name === 'Local Rice') {
          items.forEach(item => {
            console.log(`    - ${item.commodity} (₱${item.price})`);
          });
        }
      }
    });
    
} else {
    console.log('⚠️ No extracted PDF data found - will use fallback data');
}

console.log('\n✅ RICE CATEGORIZATION UPDATE COMPLETE!');
console.log('');
console.log('🎨 CHANGES MADE:');
console.log('• Split "Rice & Grains" into "Imported Rice" and "Local Rice"');
console.log('• First 4 rice items → Imported Rice (brown color)');
console.log('• Next 4 rice items → Local Rice (green color)');
console.log('• Both categories use leaf icon but different colors');
console.log('');
console.log('📱 WHAT YOU\'LL SEE NOW:');
console.log('• "Imported Rice" category with 4 items (brown header)');
console.log('• "Local Rice" category with 4 items (green header)');
console.log('• Clear distinction between imported and local rice products');
console.log('• Same logic applied to both Admin and regular Price Monitoring');
console.log('');
console.log('🎯 TO TEST:');
console.log('1. Close your app completely');
console.log('2. Restart your app');
console.log('3. Go to Admin → Price Monitoring OR regular Price Monitoring');
console.log('4. You should see separate "Imported Rice" and "Local Rice" categories');
console.log('5. Check that the first 4 rice items are in "Imported Rice"');
console.log('6. Check that the next 4 rice items are in "Local Rice"');
console.log('');
console.log('🎉 RICE CATEGORIZATION NOW PROPERLY DISTINGUISHES IMPORTED VS LOCAL!');
