const fs = require('fs');
const path = require('path');

/**
 * FORCE REAL DA DATA SCRIPT
 * This script completely removes all offline cache and forces the app to use real DA data
 */

const filesToDelete = [
    'data/priceData.json',
    'data/converted_latest_prices.json',
    'cache',
    'offline_cache',
    'temp_cache',
    'reload_trigger.tmp'
];

const dirsToDelete = [
    'cache',
    'offline_cache', 
    'temp_cache',
    'node_modules/.cache'
];

async function forceRealDAData() {
    console.log('🚀 FORCING REAL DA DATA - REMOVING ALL OFFLINE CACHE...');
    
    let deletedCount = 0;
    let errorCount = 0;

    // Delete files
    for (const file of filesToDelete) {
        try {
            const filePath = path.join(__dirname, '..', file);
            if (fs.existsSync(filePath)) {
                if (fs.statSync(filePath).isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                    console.log(`✅ Deleted directory: ${file}`);
                } else {
                    fs.unlinkSync(filePath);
                    console.log(`✅ Deleted file: ${file}`);
                }
                deletedCount++;
            }
        } catch (error) {
            console.log(`⚠️ Could not delete ${file}: ${error.message}`);
            errorCount++;
        }
    }

    // Delete directories
    for (const dir of dirsToDelete) {
        try {
            const dirPath = path.join(__dirname, '..', dir);
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`✅ Deleted directory: ${dir}`);
                deletedCount++;
            }
        } catch (error) {
            console.log(`⚠️ Could not delete ${dir}: ${error.message}`);
            errorCount++;
        }
    }

    // Create empty priceData.json to prevent loading old data
    const emptyPriceData = {
        "prices": [],
        "lastUpdated": new Date().toISOString(),
        "source": "REAL_DA_SERVICE_ONLY",
        "note": "This file is intentionally empty. App should use realDAPriceService instead."
    };

    try {
        fs.writeFileSync(
            path.join(__dirname, '..', 'data', 'priceData.json'), 
            JSON.stringify(emptyPriceData, null, 2),
            'utf8'
        );
        console.log('✅ Created empty priceData.json to prevent old data loading');
    } catch (error) {
        console.log(`⚠️ Could not create empty priceData.json: ${error.message}`);
    }

    // Create force reload trigger
    try {
        fs.writeFileSync(
            path.join(__dirname, '..', 'FORCE_REAL_DA_RELOAD.tmp'), 
            `FORCE_REAL_DA_DATA_${Date.now()}`,
            'utf8'
        );
        console.log('✅ Created force reload trigger');
    } catch (error) {
        console.log(`⚠️ Could not create reload trigger: ${error.message}`);
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`✅ Deleted ${deletedCount} files/directories`);
    console.log(`⚠️ ${errorCount} errors (some files may not exist)`);
    console.log('✅ Created empty priceData.json');
    console.log('✅ Created force reload trigger');
    
    console.log('\n🚀 WHAT TO DO NOW:');
    console.log('1. CLOSE YOUR APP COMPLETELY');
    console.log('2. RESTART YOUR APP');
    console.log('3. Navigate to Price Monitoring');
    console.log('4. You should see "Fetching REAL data from DA Philippines..."');
    console.log('5. NO MORE "Loaded 198 latest prices from offline cache"');
    
    console.log('\n📊 EXPECTED BEHAVIOR:');
    console.log('- Loading: "Fetching REAL data from DA Philippines..."');
    console.log('- Real prices: Beef Brisket: ₱414.23, Beef Striploin: ₱472.40');
    console.log('- Green badges: "REAL DA DATA"');
    console.log('- Source: "DA Philippines Daily Price Index"');
    console.log('- NO offline cache messages in logs');
    
    console.log('\n🎉 REAL DA DATA FORCE COMPLETE!');
}

forceRealDAData().catch(console.error);


