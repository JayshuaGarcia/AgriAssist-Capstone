const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, remove } = require('firebase/database');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADEKzk_kDQ1vpfqh1m2AySD8W5PMNYnMA",
  authDomain: "database-agriassist.firebaseapp.com",
  projectId: "database-agriassist",
  storageBucket: "database-agriassist.firebasestorage.app",
  messagingSenderId: "674451705550",
  appId: "1:674451705550:web:5c552038c82aceca580a9f",
  measurementId: "G-MYX7KTKYKV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function migrateToBarangayStructure() {
  console.log('Starting migration to barangay-based structure...');
  
  try {
    // Get all existing data from root level
    const rootSnapshot = await get(ref(database, '/'));
    if (!rootSnapshot.exists()) {
      console.log('No existing data found. Migration complete.');
      return;
    }
    
    const rootData = rootSnapshot.val();
    const barangayName = 'Poblacion';
    
    console.log('Found existing data. Migrating to barangay structure...');
    
    // Create barangay structure
    const barangayData = {};
    
    // Migrate each collection
    const collections = [
      'farmerProfiles',
      'livestockRecords', 
      'fertilizerLogs',
      'cropMonitoringReports',
      'accomplishmentReports',
      'plantingRecords',
      'harvestRecords'
    ];
    
    for (const collection of collections) {
      if (rootData[collection]) {
        console.log(`Migrating ${collection}...`);
        
        // Add barangay field to each record
        const migratedRecords = {};
        for (const [id, record] of Object.entries(rootData[collection])) {
          if (record && typeof record === 'object') {
            migratedRecords[id] = {
              ...record,
              barangay: barangayName
            };
          }
        }
        
        barangayData[collection] = migratedRecords;
        
        // Remove from root level
        await remove(ref(database, `/${collection}`));
        console.log(`✓ Migrated ${Object.keys(migratedRecords).length} ${collection} records`);
      }
    }
    
    // Save to new barangay structure
    if (Object.keys(barangayData).length > 0) {
      await set(ref(database, `/barangays/${barangayName}`), barangayData);
      console.log(`✓ All data migrated to barangays/${barangayName}/`);
    }
    
    console.log('Migration completed successfully!');
    console.log(`All existing data has been moved to: barangays/${barangayName}/`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToBarangayStructure()
  .then(() => {
    console.log('Migration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 