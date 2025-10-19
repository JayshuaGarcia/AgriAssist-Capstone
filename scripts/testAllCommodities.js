const { realDAPriceService } = require('../lib/realDAPriceService');
const { COMMODITY_DATA } = require('../constants/CommodityData');

async function testAllCommodities() {
    console.log('🧪 TESTING ALL COMMODITIES WITH REAL DA SERVICE...');
    console.log(`📊 Total commodities in COMMODITY_DATA: ${COMMODITY_DATA.length}`);

    try {
        const currentPrices = await realDAPriceService.getCurrentPrices(COMMODITY_DATA);
        const forecasts = await realDAPriceService.getPriceForecasts(COMMODITY_DATA);
        
        console.log(`\n✅ RESULTS:`);
        console.log(`📊 Total prices loaded: ${currentPrices.length}`);
        console.log(`📊 Real DA prices: ${currentPrices.filter(p => p.isRealData).length}`);
        console.log(`📊 Realistic prices: ${currentPrices.filter(p => !p.isRealData).length}`);
        console.log(`📊 Total forecasts: ${forecasts.length}`);
        
        console.log(`\n🎯 REAL DA PRICES (from PDF):`);
        const realPrices = currentPrices.filter(p => p.isRealData);
        realPrices.forEach((price, index) => {
            console.log(`${index + 1}. ${price.commodityName}: ₱${price.currentPrice}`);
        });
        
        console.log(`\n📋 CATEGORIES WITH DATA:`);
        const categories = [...new Set(currentPrices.map(p => p.commodityName.split(',')[0].trim()))];
        categories.slice(0, 10).forEach(category => {
            const count = currentPrices.filter(p => p.commodityName.includes(category)).length;
            console.log(`  ${category}: ${count} items`);
        });
        
        if (categories.length > 10) {
            console.log(`  ... and ${categories.length - 10} more categories`);
        }
        
    } catch (error) {
        console.error('❌ Error testing all commodities:', error);
    }
}

testAllCommodities();


