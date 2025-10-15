/**
 * Standalone script to clear all AsyncStorage data
 * This can be run independently to clear all local storage data
 * 
 * Usage:
 * node scripts/clearAsyncStorage.js
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearAllAsyncStorageData() {
  try {
    console.log('🧹 Starting to clear all AsyncStorage data...');
    
    // Get all keys from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    console.log(`📋 Found ${keys.length} keys in AsyncStorage:`, keys);
    
    if (keys.length === 0) {
      console.log('✅ AsyncStorage is already empty');
      return;
    }
    
    // Clear all keys at once
    await AsyncStorage.multiRemove(keys);
    
    console.log('✅ Successfully cleared all AsyncStorage data');
    console.log(`🗑️ Removed ${keys.length} keys from storage`);
    
    // Verify that storage is now empty
    const remainingKeys = await AsyncStorage.getAllKeys();
    if (remainingKeys.length === 0) {
      console.log('✅ Verification: AsyncStorage is now completely empty');
    } else {
      console.warn('⚠️ Warning: Some keys may not have been cleared:', remainingKeys);
    }
    
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage data:', error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  clearAllAsyncStorageData()
    .then(() => {
      console.log('🎉 AsyncStorage clearing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to clear AsyncStorage:', error);
      process.exit(1);
    });
}

module.exports = { clearAllAsyncStorageData };
