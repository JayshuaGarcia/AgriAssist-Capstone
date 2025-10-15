import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear all data from AsyncStorage
 * This will remove all stored data including:
 * - Farmer form data
 * - Password reset data
 * - Changed password data
 * - Price records
 * - Announcements
 * - Firebase auth persistence data
 * - Any other stored data
 */
export const clearAllAsyncStorageData = async (): Promise<void> => {
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
};

/**
 * Clear specific types of data from AsyncStorage
 * Useful for clearing only certain categories of data
 */
export const clearSpecificAsyncStorageData = async (dataTypes: string[]): Promise<void> => {
  try {
    console.log('🧹 Starting to clear specific AsyncStorage data...', dataTypes);
    
    const keys = await AsyncStorage.getAllKeys();
    const keysToRemove: string[] = [];
    
    // Filter keys based on data types
    for (const key of keys) {
      for (const dataType of dataTypes) {
        if (key.includes(dataType)) {
          keysToRemove.push(key);
          break;
        }
      }
    }
    
    if (keysToRemove.length === 0) {
      console.log('✅ No matching keys found for the specified data types');
      return;
    }
    
    console.log(`📋 Found ${keysToRemove.length} keys to remove:`, keysToRemove);
    
    // Remove the filtered keys
    await AsyncStorage.multiRemove(keysToRemove);
    
    console.log('✅ Successfully cleared specific AsyncStorage data');
    console.log(`🗑️ Removed ${keysToRemove.length} keys from storage`);
    
  } catch (error) {
    console.error('❌ Error clearing specific AsyncStorage data:', error);
    throw error;
  }
};

/**
 * Get information about what's stored in AsyncStorage
 * Useful for debugging and understanding what data is stored
 */
export const getAsyncStorageInfo = async (): Promise<{
  totalKeys: number;
  keys: string[];
  dataTypes: Record<string, number>;
}> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    
    // Categorize keys by type
    const dataTypes: Record<string, number> = {};
    
    for (const key of keys) {
      if (key.startsWith('farmerFormData_')) {
        dataTypes.farmerFormData = (dataTypes.farmerFormData || 0) + 1;
      } else if (key.startsWith('password_reset_')) {
        dataTypes.passwordReset = (dataTypes.passwordReset || 0) + 1;
      } else if (key.startsWith('changed_password_')) {
        dataTypes.changedPassword = (dataTypes.changedPassword || 0) + 1;
      } else if (key.includes('price_records')) {
        dataTypes.priceRecords = (dataTypes.priceRecords || 0) + 1;
      } else if (key.includes('announcements')) {
        dataTypes.announcements = (dataTypes.announcements || 0) + 1;
      } else if (key.includes('firebase')) {
        dataTypes.firebase = (dataTypes.firebase || 0) + 1;
      } else {
        dataTypes.other = (dataTypes.other || 0) + 1;
      }
    }
    
    return {
      totalKeys: keys.length,
      keys,
      dataTypes
    };
    
  } catch (error) {
    console.error('❌ Error getting AsyncStorage info:', error);
    throw error;
  }
};

/**
 * Clear AsyncStorage data with user confirmation
 * This is a safer version that logs what will be cleared
 */
export const clearAsyncStorageWithConfirmation = async (): Promise<void> => {
  try {
    // First, get info about what's stored
    const storageInfo = await getAsyncStorageInfo();
    
    console.log('📊 AsyncStorage Information:');
    console.log(`Total keys: ${storageInfo.totalKeys}`);
    console.log('Data types:', storageInfo.dataTypes);
    console.log('All keys:', storageInfo.keys);
    
    if (storageInfo.totalKeys === 0) {
      console.log('✅ AsyncStorage is already empty');
      return;
    }
    
    // Clear all data
    await clearAllAsyncStorageData();
    
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage with confirmation:', error);
    throw error;
  }
};

/**
 * Store JSON price data in AsyncStorage
 * This function stores the provided price data with metadata
 */
export const storePriceData = async (priceData: any[], dataSource: string = 'manual_upload'): Promise<void> => {
  try {
    console.log('💾 Storing price data in AsyncStorage...');
    
    const storageKey = 'price_data_v1';
    const metadata = {
      storedAt: new Date().toISOString(),
      dataSource: dataSource,
      recordCount: priceData.length,
      version: '1.0'
    };
    
    const dataToStore = {
      metadata: metadata,
      data: priceData
    };
    
    await AsyncStorage.setItem(storageKey, JSON.stringify(dataToStore));
    
    console.log('✅ Price data stored successfully');
    console.log(`📊 Stored ${priceData.length} price records`);
    console.log(`📅 Stored at: ${metadata.storedAt}`);
    console.log(`🏷️ Data source: ${metadata.dataSource}`);
    
  } catch (error) {
    console.error('❌ Error storing price data:', error);
    throw error;
  }
};

/**
 * Retrieve price data from AsyncStorage
 */
export const getPriceData = async (): Promise<{metadata: any, data: any[]} | null> => {
  try {
    const storageKey = 'price_data_v1';
    const storedData = await AsyncStorage.getItem(storageKey);
    
    if (!storedData) {
      console.log('ℹ️ No price data found in AsyncStorage');
      return null;
    }
    
    const parsedData = JSON.parse(storedData);
    console.log('✅ Price data retrieved successfully');
    console.log(`📊 Retrieved ${parsedData.data?.length || 0} price records`);
    console.log(`📅 Stored at: ${parsedData.metadata?.storedAt}`);
    
    return parsedData;
    
  } catch (error) {
    console.error('❌ Error retrieving price data:', error);
    throw error;
  }
};

/**
 * Store the provided JSON price data
 * This function stores the complete dataset from the JSON file
 */
export const storeProvidedPriceData = async (): Promise<void> => {
  try {
    // Import the price data from the JSON file
    const priceData = require('../data/priceData.json');
    
    console.log('📊 Loading price data from JSON file...');
    console.log(`📈 Found ${priceData.length} price records`);
    
    // Store the data
    await storePriceData(priceData, 'provided_json_data');
    
  } catch (error) {
    console.error('❌ Error loading or storing price data:', error);
    throw error;
  }
};

/**
 * Store custom price data from an array
 * This function allows you to store any price data array
 */
export const storeCustomPriceData = async (priceData: any[], dataSource: string = 'custom_data'): Promise<void> => {
  try {
    console.log(`📊 Storing ${priceData.length} custom price records...`);
    await storePriceData(priceData, dataSource);
  } catch (error) {
    console.error('❌ Error storing custom price data:', error);
    throw error;
  }
};

/**
 * Get the latest price data from AsyncStorage
 * This function returns the most recent price for each commodity/type combination
 */
export const getLatestPriceData = async (): Promise<any[] | null> => {
  try {
    console.log('🔍 DEBUG: Getting latest price data from AsyncStorage...');
    const storedData = await getPriceData();
    console.log('🔍 DEBUG: storedData exists:', !!storedData);
    console.log('🔍 DEBUG: storedData.data exists:', !!storedData?.data);
    console.log('🔍 DEBUG: storedData.data length:', storedData?.data?.length || 0);
    
    if (!storedData || !storedData.data) {
      console.log('ℹ️ No price data found in AsyncStorage');
      return null;
    }

    console.log('📊 Processing price data to get latest prices...');
    
    // Group by commodity and type, then get the latest date for each
    const latestPrices: { [key: string]: any } = {};
    
    storedData.data.forEach((item: any) => {
      const key = `${item.Commodity}-${item.Type}-${item.Specification || 'default'}`;
      const itemDate = new Date(item.Date);
      
      if (!latestPrices[key] || itemDate > new Date(latestPrices[key].Date)) {
        latestPrices[key] = item;
      }
    });

    const latestPriceArray = Object.values(latestPrices);
    
    console.log(`✅ Found ${latestPriceArray.length} unique commodity/type combinations`);
    console.log(`📅 Latest date in data: ${new Date(Math.max(...latestPriceArray.map((p: any) => new Date(p.Date).getTime()))).toISOString().split('T')[0]}`);
    
    return latestPriceArray;
    
  } catch (error) {
    console.error('❌ Error getting latest price data:', error);
    throw error;
  }
};

/**
 * Get price data filtered by date range
 */
export const getPriceDataByDateRange = async (startDate: string, endDate: string): Promise<any[] | null> => {
  try {
    const storedData = await getPriceData();
    if (!storedData || !storedData.data) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredData = storedData.data.filter((item: any) => {
      const itemDate = new Date(item.Date);
      return itemDate >= start && itemDate <= end;
    });

    console.log(`📊 Filtered ${filteredData.length} records between ${startDate} and ${endDate}`);
    return filteredData;
    
  } catch (error) {
    console.error('❌ Error filtering price data by date:', error);
    throw error;
  }
};

/**
 * Get price data for a specific commodity
 */
export const getPriceDataByCommodity = async (commodityName: string): Promise<any[] | null> => {
  try {
    const storedData = await getPriceData();
    if (!storedData || !storedData.data) {
      return null;
    }

    // Filter by commodity name (case insensitive)
    const filteredData = storedData.data.filter((item: any) => 
      item.Commodity.toLowerCase().includes(commodityName.toLowerCase()) ||
      item.Type.toLowerCase().includes(commodityName.toLowerCase())
    );

    console.log(`📊 Found ${filteredData.length} records for commodity: ${commodityName}`);
    return filteredData;
    
  } catch (error) {
    console.error('❌ Error filtering price data by commodity:', error);
    throw error;
  }
};

/**
 * Get price trends for a specific commodity over time
 */
export const getPriceTrends = async (): Promise<any[]> => {
  try {
    const storedData = await getPriceData();
    
    if (!storedData || !storedData.data) {
      return [];
    }

    // Group by commodity and type, then calculate trends
    const trends: any[] = [];
    const grouped: { [key: string]: any[] } = {};
    
    storedData.data.forEach((item: any) => {
      const key = `${item.Commodity}-${item.Type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // Calculate trends for each group
    Object.entries(grouped).forEach(([key, items]) => {
      if (items.length >= 2) {
        // Sort by date
        items.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        
        const latest = items[items.length - 1];
        const previous = items[items.length - 2];
        
        const change = latest.Amount - previous.Amount;
        const changePercentage = ((change / previous.Amount) * 100);
        
        trends.push({
          commodity: latest.Commodity,
          type: latest.Type,
          latestPrice: latest.Amount,
          previousPrice: previous.Amount,
          change,
          changePercentage,
          date: latest.Date
        });
      }
    });

    console.log(`📈 Generated ${trends.length} trend records`);
    return trends;
  } catch (error) {
    console.error('❌ Error getting price trends:', error);
    return [];
  }
};

/**
 * Add or update a single price record in AsyncStorage
 * This function adds a new price record or updates an existing one
 */
export const addOrUpdatePriceRecord = async (priceRecord: {
  Commodity: string;
  Type: string;
  Specification?: string | null;
  Amount: number;
  Date: string;
}): Promise<void> => {
  try {
    console.log('💾 Adding/updating price record in AsyncStorage...');
    
    const storedData = await getPriceData();
    let priceData: any[] = [];
    
    if (storedData && storedData.data) {
      priceData = [...storedData.data];
    }

    // Check if a record with the same commodity, type, specification, and date already exists
    const existingIndex = priceData.findIndex(item => 
      item.Commodity === priceRecord.Commodity &&
      item.Type === priceRecord.Type &&
      (item.Specification || null) === (priceRecord.Specification || null) &&
      item.Date === priceRecord.Date
    );

    if (existingIndex >= 0) {
      // Update existing record
      priceData[existingIndex] = priceRecord;
      console.log('✅ Updated existing price record');
    } else {
      // Add new record
      priceData.push(priceRecord);
      console.log('✅ Added new price record');
    }

    // Store the updated data
    const metadata = {
      storedAt: new Date().toISOString(),
      dataSource: storedData?.metadata?.dataSource || 'manual_entry',
      recordCount: priceData.length,
      version: '1.0'
    };

    const dataToStore = {
      metadata: metadata,
      data: priceData
    };

    const storageKey = 'price_data_v1';
    await AsyncStorage.setItem(storageKey, JSON.stringify(dataToStore));

    console.log(`📊 Total records in storage: ${priceData.length}`);
    console.log(`📅 Record date: ${priceRecord.Date}`);
    console.log(`💰 Price: ₱${priceRecord.Amount} for ${priceRecord.Commodity} - ${priceRecord.Type}`);
    
  } catch (error) {
    console.error('❌ Error adding/updating price record:', error);
    throw error;
  }
};

/**
 * Remove a price record from AsyncStorage
 */
export const removePriceRecord = async (priceRecord: {
  Commodity: string;
  Type: string;
  Specification?: string | null;
  Date: string;
}): Promise<void> => {
  try {
    console.log('🗑️ Removing price record from AsyncStorage...');
    
    const storedData = await getPriceData();
    if (!storedData || !storedData.data) {
      console.log('ℹ️ No data found to remove from');
      return;
    }

    const filteredData = storedData.data.filter(item => 
      !(item.Commodity === priceRecord.Commodity &&
        item.Type === priceRecord.Type &&
        (item.Specification || null) === (priceRecord.Specification || null) &&
        item.Date === priceRecord.Date)
    );

    if (filteredData.length === storedData.data.length) {
      console.log('ℹ️ Record not found to remove');
      return;
    }

    // Store the updated data
    const metadata = {
      storedAt: new Date().toISOString(),
      dataSource: storedData.metadata?.dataSource || 'manual_entry',
      recordCount: filteredData.length,
      version: '1.0'
    };

    const dataToStore = {
      metadata: metadata,
      data: filteredData
    };

    const storageKey = 'price_data_v1';
    await AsyncStorage.setItem(storageKey, JSON.stringify(dataToStore));

    console.log(`✅ Removed price record`);
    console.log(`📊 Remaining records: ${filteredData.length}`);
    
  } catch (error) {
    console.error('❌ Error removing price record:', error);
    throw error;
  }
};

/**
 * Debug function to check AsyncStorage state
 */
export const debugAsyncStorageState = async (): Promise<{
  hasData: boolean;
  dataCount: number;
  sampleData: any;
  rawKeys: string[];
}> => {
  try {
    console.log('🔍 Debugging AsyncStorage state...');
    
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📋 All AsyncStorage keys:', allKeys);
    
    // Check if price data key exists
    const priceDataKey = 'price_data_v1';
    const hasPriceDataKey = allKeys.includes(priceDataKey);
    console.log(`📊 Price data key exists: ${hasPriceDataKey}`);
    
    if (!hasPriceDataKey) {
      return {
        hasData: false,
        dataCount: 0,
        sampleData: null,
        rawKeys: allKeys
      };
    }
    
    // Get the raw data
    const rawData = await AsyncStorage.getItem(priceDataKey);
    console.log('📄 Raw data length:', rawData?.length || 0);
    
    if (!rawData) {
      return {
        hasData: false,
        dataCount: 0,
        sampleData: null,
        rawKeys: allKeys
      };
    }
    
    // Parse the data
    const parsedData = JSON.parse(rawData);
    const dataCount = parsedData.data?.length || 0;
    const sampleData = parsedData.data?.slice(0, 2) || null;
    
    console.log('📊 Parsed data count:', dataCount);
    console.log('📋 Sample data:', sampleData);
    
    return {
      hasData: true,
      dataCount,
      sampleData,
      rawKeys: allKeys
    };
    
  } catch (error) {
    console.error('❌ Error debugging AsyncStorage:', error);
    return {
      hasData: false,
      dataCount: 0,
      sampleData: null,
      rawKeys: []
    };
  }
};

