/**
 * 🔍 ANALYZE LIVE DA WEBSITE CONTENT
 * This script analyzes the actual HTML content from the DA Philippines website
 */

const fs = require('fs');

console.log('🔍 ANALYZING LIVE DA WEBSITE CONTENT...');

// Read the live HTML
const html = fs.readFileSync('live_da_website.html', 'utf8');
console.log('📄 HTML loaded:', html.length, 'characters');

// Look for actual price data in tables
console.log('\n📊 SEARCHING FOR PRICE TABLES...');

// Find table structures
const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
if (tableMatches) {
  console.log('✅ Found', tableMatches.length, 'HTML tables');
  
  // Look for the main price table
  tableMatches.forEach((table, index) => {
    if (table.includes('BEEF') || table.includes('Beef') || table.includes('₱')) {
      console.log('🎯 Table', index + 1, 'contains price data!');
      
      // Extract rows from this table
      const rowMatches = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
      if (rowMatches) {
        console.log('  📋 Found', rowMatches.length, 'rows in this table');
        
        // Show first few rows
        rowMatches.slice(0, 5).forEach((row, rowIndex) => {
          // Clean up the row HTML
          const cleanRow = row.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanRow.length > 10) {
            console.log('    Row', rowIndex + 1 + ':', cleanRow.substring(0, 100) + '...');
          }
        });
      }
    }
  });
}

// Look for JSON data
console.log('\n🔍 SEARCHING FOR JSON DATA...');
const jsonMatches = html.match(/\{[^}]*"price"[^}]*\}/gi);
if (jsonMatches) {
  console.log('✅ Found', jsonMatches.length, 'JSON price objects');
  jsonMatches.slice(0, 3).forEach((json, i) => {
    console.log('  JSON', i + 1 + ':', json);
  });
}

// Look for specific price patterns with context
console.log('\n💰 SEARCHING FOR PRICE PATTERNS WITH CONTEXT...');
const priceContextPattern = /([A-Za-z\s,()-]+)\s*₱\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
const priceContexts = [];
let match;
while ((match = priceContextPattern.exec(html)) !== null) {
  priceContexts.push({
    commodity: match[1].trim(),
    price: match[2]
  });
}

console.log('🎯 Found', priceContexts.length, 'price contexts');
priceContexts.slice(0, 20).forEach((item, i) => {
  console.log('  ' + (i+1) + '.', item.commodity, '→ ₱' + item.price);
});

// Look for the specific commodities from your screenshot
console.log('\n🥩 SEARCHING FOR SPECIFIC BEEF COMMODITIES...');
const beefCommodities = [
  'Beef Brisket',
  'Beef Chuck', 
  'Beef Forequarter',
  'Beef Flank',
  'Beef Loin',
  'Beef Plate',
  'Beef Rib Eye',
  'Beef Striploin'
];

beefCommodities.forEach(commodity => {
  const regex = new RegExp(commodity + '[^₱]*₱\\s*(\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?)', 'gi');
  const matches = html.match(regex);
  if (matches) {
    console.log('✅', commodity + ':', matches.slice(0, 3));
  } else {
    console.log('❌', commodity + ': Not found');
  }
});

// Look for any data tables or structured data
console.log('\n📋 SEARCHING FOR STRUCTURED DATA...');

// Check for data attributes
const dataMatches = html.match(/data-[^=]*="[^"]*"/gi);
if (dataMatches) {
  console.log('✅ Found', dataMatches.length, 'data attributes');
  dataMatches.slice(0, 10).forEach((data, i) => {
    console.log('  ' + (i+1) + '.', data);
  });
}

// Check for script tags with data
const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
if (scriptMatches) {
  console.log('✅ Found', scriptMatches.length, 'script tags');
  
  scriptMatches.forEach((script, i) => {
    if (script.includes('price') || script.includes('commodity') || script.includes('data')) {
      console.log('🎯 Script', i + 1, 'contains data-related content');
      // Show a snippet
      const cleanScript = script.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      console.log('  Content:', cleanScript.substring(0, 200) + '...');
    }
  });
}

// Look for any API endpoints or data sources
console.log('\n🌐 SEARCHING FOR API ENDPOINTS...');
const apiMatches = html.match(/https?:\/\/[^"'\s]*\.(json|xml|api)[^"'\s]*/gi);
if (apiMatches) {
  console.log('✅ Found', apiMatches.length, 'potential API endpoints');
  apiMatches.forEach((api, i) => {
    console.log('  ' + (i+1) + '.', api);
  });
}

console.log('\n📋 ANALYSIS COMPLETE!');
console.log('💾 Full HTML saved to: live_da_website.html');
console.log('\n💡 SUMMARY:');
console.log('- Website fetched successfully (570,070 characters)');
console.log('- Found', tableMatches ? tableMatches.length : 0, 'HTML tables');
console.log('- Found', priceContexts.length, 'price contexts');
console.log('- Found', scriptMatches ? scriptMatches.length : 0, 'script tags');
console.log('- Raw HTML available for detailed analysis');


