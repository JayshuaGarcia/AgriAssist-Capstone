/**
 * 🔍 EXTRACT REAL PRICES FROM DA WEBSITE TABLES
 * This script extracts the actual price data from the TablePress tables
 */

const fs = require('fs');

console.log('🔍 EXTRACTING REAL PRICES FROM DA WEBSITE TABLES...');

// Read the live HTML
const html = fs.readFileSync('live_da_website.html', 'utf8');

// Extract TablePress table 105 (likely the main price table)
const table105Match = html.match(/<table id="tablepress-105"[^>]*>[\s\S]*?<\/table>/i);
if (table105Match) {
  console.log('✅ Found TablePress table 105');
  
  const table105 = table105Match[0];
  
  // Extract all rows from the table
  const rowMatches = table105.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
  if (rowMatches) {
    console.log('📋 Found', rowMatches.length, 'rows in table 105');
    
    console.log('\n🥩 BEEF MEAT PRODUCTS FROM DA WEBSITE:');
    
    rowMatches.forEach((row, index) => {
      // Clean up the row HTML to get text content
      const cleanRow = row.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Look for beef products
      if (cleanRow.toLowerCase().includes('beef') && cleanRow.includes('₱')) {
        console.log(`  ${index + 1}. ${cleanRow}`);
      }
    });
  }
}

// Extract TablePress table 112 (likely another price table)
const table112Match = html.match(/<table id="tablepress-112"[^>]*>[\s\S]*?<\/table>/i);
if (table112Match) {
  console.log('\n✅ Found TablePress table 112');
  
  const table112 = table112Match[0];
  
  // Extract all rows from the table
  const rowMatches = table112.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
  if (rowMatches) {
    console.log('📋 Found', rowMatches.length, 'rows in table 112');
    
    console.log('\n🐟 FISH & OTHER PRODUCTS FROM DA WEBSITE:');
    
    rowMatches.forEach((row, index) => {
      // Clean up the row HTML to get text content
      const cleanRow = row.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Look for fish and other products
      if ((cleanRow.toLowerCase().includes('fish') || 
           cleanRow.toLowerCase().includes('squid') || 
           cleanRow.toLowerCase().includes('tilapia') ||
           cleanRow.toLowerCase().includes('tambakol')) && 
          cleanRow.includes('₱')) {
        console.log(`  ${index + 1}. ${cleanRow}`);
      }
    });
  }
}

// Let's also look for any other price data in the HTML
console.log('\n💰 SEARCHING FOR ALL PRICE DATA IN HTML...');

// Look for peso signs with numbers
const pesoPattern = /₱\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
const allPrices = [];
let match;
while ((match = pesoPattern.exec(html)) !== null) {
  allPrices.push(match[0]);
}

console.log('📊 Found', allPrices.length, 'price references in HTML');
console.log('🎯 Sample prices:', allPrices.slice(0, 10));

// Look for specific commodity patterns
console.log('\n🔍 SEARCHING FOR SPECIFIC COMMODITIES...');

const commodities = [
  'Beef Brisket',
  'Beef Chuck', 
  'Beef Forequarter',
  'Beef Flank',
  'Beef Loin',
  'Beef Plate',
  'Beef Rib Eye',
  'Beef Striploin',
  'Squid',
  'Tilapia',
  'Tambakol'
];

commodities.forEach(commodity => {
  const regex = new RegExp(commodity + '[^₱]*₱\\s*(\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?)', 'gi');
  const matches = html.match(regex);
  if (matches) {
    console.log('✅', commodity + ':', matches.slice(0, 3));
  } else {
    console.log('❌', commodity + ': Not found');
  }
});

console.log('\n📋 EXTRACTION COMPLETE!');
console.log('💾 Full HTML available in: live_da_website.html');


