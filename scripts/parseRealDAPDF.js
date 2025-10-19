const fs = require('fs');
const path = require('path');

// PDF parsing library
const pdfParse = require('pdf-parse').default || require('pdf-parse');

const PDF_FILE = path.join(__dirname, '../october_18_2025_dpi_afc.pdf');
const OUTPUT_FILE = path.join(__dirname, '../data/real_da_prices.json');

async function parseRealDAPDF() {
    console.log('📄 PARSING REAL DA PDF DATA...');
    console.log('🔗 PDF File:', PDF_FILE);
    
    try {
        // Check if PDF exists
        if (!fs.existsSync(PDF_FILE)) {
            console.error('❌ PDF file not found:', PDF_FILE);
            console.log('📥 Please download the PDF first using: node scripts/downloadOct18DailyPriceIndex.js');
            return;
        }

        // Read PDF file
        const dataBuffer = fs.readFileSync(PDF_FILE);
        console.log('📖 Reading PDF file...');
        
        // Parse PDF
        const pdfData = await pdfParse(dataBuffer);
        console.log('✅ PDF parsed successfully');
        console.log('📊 PDF text length:', pdfData.text.length);
        
        // Extract price data from PDF text
        const priceData = extractPriceDataFromText(pdfData.text);
        console.log(`🎯 Extracted ${priceData.length} real prices from PDF`);
        
        // Save to JSON file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(priceData, null, 2));
        console.log('💾 Saved real DA prices to:', OUTPUT_FILE);
        
        // Show sample data
        console.log('\n📋 SAMPLE REAL DA PRICES:');
        priceData.slice(0, 10).forEach(item => {
            console.log(`  ${item.commodityName}: ₱${item.currentPrice}`);
        });
        
        console.log('\n🎉 REAL DA PDF PARSING COMPLETE!');
        console.log('📱 Now update the app to use this real data instead of fake data!');
        
    } catch (error) {
        console.error('❌ Error parsing PDF:', error);
    }
}

function extractPriceDataFromText(text) {
    console.log('🔍 Extracting price data from PDF text...');
    
    const prices = [];
    const lines = text.split('\n');
    
    // Look for price patterns in the PDF text
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Look for lines that contain commodity names and prices
        // Pattern: "Commodity Name" followed by price
        const priceMatch = line.match(/(.+?)\s+(\d+\.\d{2})$/);
        if (priceMatch) {
            const commodityName = priceMatch[1].trim();
            const price = parseFloat(priceMatch[2]);
            
            // Skip if price is 0 or very low (likely not a real price)
            if (price > 10) {
                prices.push({
                    commodityId: generateCommodityId(commodityName),
                    commodityName: commodityName,
                    currentPrice: price,
                    priceDate: '2025-10-18',
                    source: 'DA Philippines Daily Price Index PDF',
                    specification: extractSpecification(commodityName),
                    region: 'NCR',
                    isRealData: true
                });
            }
        }
        
        // Also look for table-like data with multiple columns
        const tableMatch = line.match(/(.+?)\s+([A-Za-z\s,]+?)\s+(\d+\.\d{2})$/);
        if (tableMatch) {
            const commodityName = tableMatch[1].trim();
            const specification = tableMatch[2].trim();
            const price = parseFloat(tableMatch[3]);
            
            if (price > 10) {
                prices.push({
                    commodityId: generateCommodityId(commodityName),
                    commodityName: commodityName,
                    currentPrice: price,
                    priceDate: '2025-10-18',
                    source: 'DA Philippines Daily Price Index PDF',
                    specification: specification,
                    region: 'NCR',
                    isRealData: true
                });
            }
        }
    }
    
    // Remove duplicates
    const uniquePrices = prices.filter((price, index, self) => 
        index === self.findIndex(p => p.commodityName === price.commodityName)
    );
    
    console.log(`✅ Found ${uniquePrices.length} unique prices`);
    return uniquePrices;
}

function generateCommodityId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function extractSpecification(name) {
    // Extract specification from commodity name
    const specs = ['Local', 'Imported', 'Medium', 'Large', 'Small', 'Fresh', 'Frozen'];
    for (const spec of specs) {
        if (name.includes(spec)) {
            return spec;
        }
    }
    return undefined;
}

// Run the parser
parseRealDAPDF();
