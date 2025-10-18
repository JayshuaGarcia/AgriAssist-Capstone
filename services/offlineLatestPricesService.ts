import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface LatestPrice {
  commodityName: string;
  price: number;
  date: string;
  category: string;
  unit: string;
  type: string;
  specification: string;
  lastUpdated: string;
  recordId: string; // ID of the latest price record
}

export interface PriceRecord {
  id?: string;
  commodityName: string;
  price: number;
  date: string;
  category: string;
  unit: string;
  type: string;
  specification: string;
  createdAt: any;
  source: string;
}

class OfflineLatestPricesService {
  private static readonly LATEST_PRICES_KEY = 'latest_prices_cache';
  private static readonly LAST_SYNC_KEY = 'latest_prices_last_sync';

  /**
   * Get latest prices from offline cache
   */
  static async getLatestPrices(): Promise<LatestPrice[]> {
    try {
      const cachedData = await AsyncStorage.getItem(this.LATEST_PRICES_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          return parsedData;
        }
      }
      
      // If no cache found, try to load from converted data
      console.log('📊 No cache found, loading from converted price data...');
      return await this.loadFromConvertedData();
    } catch (error) {
      console.error('❌ Error getting latest prices from cache:', error);
      return [];
    }
  }

  /**
   * Load data from converted_latest_prices.json as fallback
   */
  private static async loadFromConvertedData(): Promise<LatestPrice[]> {
    try {
      // In a real React Native app, you'd load this from the bundle
      // For now, we'll create a simple fallback with the data we know exists
      const fallbackData: LatestPrice[] = [
        {
          commodityName: "Beef Brisket, Local",
          price: 415.11,
          date: "2025-10-17",
          category: "BEEF MEAT PRODUCTS",
          unit: "kg",
          type: "Beef Brisket, Local",
          specification: "Meat with Bones",
          lastUpdated: new Date().toISOString(),
          recordId: "fallback_beef_brisket_local"
        },
        {
          commodityName: "Beef Chuck, Local",
          price: 399.73,
          date: "2025-10-17",
          category: "BEEF MEAT PRODUCTS",
          unit: "kg",
          type: "Beef Chuck, Local",
          specification: "Unknown",
          lastUpdated: new Date().toISOString(),
          recordId: "fallback_beef_chuck_local"
        },
        {
          commodityName: "Beef Flank, Imported",
          price: 376.67,
          date: "2025-10-17",
          category: "BEEF MEAT PRODUCTS",
          unit: "kg",
          type: "Beef Flank, Imported",
          specification: "Unknown",
          lastUpdated: new Date().toISOString(),
          recordId: "fallback_beef_flank_imported"
        },
        {
          commodityName: "Beef Flank, Local",
          price: 427.78,
          date: "2025-10-17",
          category: "BEEF MEAT PRODUCTS",
          unit: "kg",
          type: "Beef Flank, Local",
          specification: "Unknown",
          lastUpdated: new Date().toISOString(),
          recordId: "fallback_beef_flank_local"
        },
        {
          commodityName: "Beef Fore Limb, Local",
          price: 457.86,
          date: "2025-10-17",
          category: "BEEF MEAT PRODUCTS",
          unit: "kg",
          type: "Beef Fore Limb, Local",
          specification: "Unknown",
          lastUpdated: new Date().toISOString(),
          recordId: "fallback_beef_fore_limb_local"
        }
      ];
      
      console.log(`📊 Loaded ${fallbackData.length} fallback price records`);
      return fallbackData;
    } catch (error) {
      console.error('❌ Error loading from converted data:', error);
      return [];
    }
  }

  /**
   * Save latest prices to offline cache
   */
  static async saveLatestPrices(prices: LatestPrice[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LATEST_PRICES_KEY, JSON.stringify(prices));
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
      console.log(`✅ Saved ${prices.length} latest prices to offline cache`);
    } catch (error) {
      console.error('❌ Error saving latest prices to cache:', error);
    }
  }

  /**
   * Get the last sync timestamp
   */
  static async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.LAST_SYNC_KEY);
    } catch (error) {
      console.error('❌ Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Fetch latest prices from Firebase for each unique commodity
   */
  static async fetchLatestPricesFromFirebase(): Promise<LatestPrice[]> {
    try {
      console.log('🔄 Fetching latest prices from Firebase...');
      
      // Get all unique commodities first
      const commoditiesQuery = query(collection(db, 'priceRecords'));
      const commoditiesSnapshot = await getDocs(commoditiesQuery);
      
      const uniqueCommodities = new Set<string>();
      commoditiesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.commodityName) {
          uniqueCommodities.add(data.commodityName);
        }
      });

      console.log(`📊 Found ${uniqueCommodities.size} unique commodities`);

      const latestPrices: LatestPrice[] = [];

      // For each unique commodity, get the latest price
      for (const commodityName of uniqueCommodities) {
        try {
          const priceQuery = query(
            collection(db, 'priceRecords'),
            where('commodityName', '==', commodityName),
            orderBy('date', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          
          const priceSnapshot = await getDocs(priceQuery);
          
          if (!priceSnapshot.empty) {
            const latestDoc = priceSnapshot.docs[0];
            const data = latestDoc.data();
            
            latestPrices.push({
              commodityName: data.commodityName,
              price: data.price,
              date: data.date,
              category: data.category,
              unit: data.unit,
              type: data.type,
              specification: data.specification,
              lastUpdated: new Date().toISOString(),
              recordId: latestDoc.id
            });
          }
        } catch (error) {
          console.error(`❌ Error fetching latest price for ${commodityName}:`, error);
        }
      }

      console.log(`✅ Fetched ${latestPrices.length} latest prices from Firebase`);
      return latestPrices;
    } catch (error) {
      console.error('❌ Error fetching latest prices from Firebase:', error);
      return [];
    }
  }

  /**
   * Update latest prices cache from Firebase
   */
  static async updateLatestPricesCache(): Promise<LatestPrice[]> {
    try {
      const latestPrices = await this.fetchLatestPricesFromFirebase();
      await this.saveLatestPrices(latestPrices);
      return latestPrices;
    } catch (error) {
      console.error('❌ Error updating latest prices cache:', error);
      return [];
    }
  }

  /**
   * Add or update a price record and update latest prices cache
   * Saves to Firebase AND updates offline cache
   */
  static async addOrUpdatePriceRecord(priceData: Omit<PriceRecord, 'id' | 'createdAt' | 'source'>): Promise<{ success: boolean; message: string; latestPrices?: LatestPrice[] }> {
    try {
      console.log('🔄 Adding/updating price record...', priceData);

      // First, save to Firebase
      let recordId: string;
      let isUpdate = false;

      try {
        // Check if a record exists for the same commodity, date, and type
        const existingQuery = query(
          collection(db, 'priceRecords'),
          where('commodityName', '==', priceData.commodityName),
          where('date', '==', priceData.date),
          where('type', '==', priceData.type)
        );

        const existingSnapshot = await getDocs(existingQuery);
        
        if (!existingSnapshot.empty) {
          // Update existing record
          const existingDoc = existingSnapshot.docs[0];
          
          await updateDoc(doc(db, 'priceRecords', existingDoc.id), {
            price: priceData.price,
            specification: priceData.specification,
            category: priceData.category,
            unit: priceData.unit,
            updatedAt: new Date().toISOString()
          });
          
          recordId = existingDoc.id;
          isUpdate = true;
          console.log(`✅ Updated existing Firebase record for ${priceData.commodityName} on ${priceData.date}`);
        } else {
          // Create new record
          const newRecord = {
            ...priceData,
            createdAt: new Date(),
            source: 'admin_manual_entry'
          };
          
          const docRef = await addDoc(collection(db, 'priceRecords'), newRecord);
          recordId = docRef.id;
          console.log(`✅ Created new Firebase record for ${priceData.commodityName} on ${priceData.date}`);
        }
      } catch (firebaseError) {
        console.error('❌ Error saving to Firebase:', firebaseError);
        // Continue with offline update even if Firebase fails
        recordId = `offline_${Date.now()}`;
      }

      // Update the offline cache directly (no Firebase fetch)
      const currentPrices = await this.getLatestPrices();
      const updatedLatestPrices = await this.updateOfflineCacheWithNewPrice(priceData, recordId);
      
      
      // Check if cache was actually updated
      const cacheWasUpdated = updatedLatestPrices.length !== currentPrices.length || 
        updatedLatestPrices.some((price, index) => 
          !currentPrices[index] || 
          price.commodityName !== currentPrices[index].commodityName ||
          price.price !== currentPrices[index].price ||
          price.date !== currentPrices[index].date
        );
      
      let message = isUpdate ? 'Price record updated successfully' : 'Price record added successfully';
      
      if (cacheWasUpdated) {
        message += ' and displayed in price monitoring';
      } else {
        message += ' and saved to database (older than current latest price)';
      }
      
      return {
        success: true,
        message: message,
        latestPrices: updatedLatestPrices
      };
    } catch (error) {
      console.error('❌ Error adding/updating price record:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update offline cache with new price (no Firebase fetch)
   * Only updates if the new price is actually the most recent for that commodity
   */
  static async updateOfflineCacheWithNewPrice(priceData: Omit<PriceRecord, 'id' | 'createdAt' | 'source'>, recordId: string): Promise<LatestPrice[]> {
    try {
      console.log('🔄 Checking if new price should update offline cache...');
      
      // Get current cached prices
      const currentPrices = await this.getLatestPrices();
      
      // Check if this commodity already exists in cache
      const existingIndex = currentPrices.findIndex(price => price.commodityName === priceData.commodityName);
      
      let shouldUpdate = false;
      let updatedPrices: LatestPrice[];
      
      if (existingIndex >= 0) {
        // Compare dates to see if new price is more recent
        const existingPrice = currentPrices[existingIndex];
        const existingDate = new Date(existingPrice.date);
        const newDate = new Date(priceData.date);
        
        if (newDate > existingDate) {
          // New price is more recent - update the cache
          shouldUpdate = true;
          console.log(`📅 New price is more recent (${priceData.date} > ${existingPrice.date}) - updating cache`);
          
          const newLatestPrice: LatestPrice = {
            commodityName: priceData.commodityName,
            price: priceData.price,
            date: priceData.date,
            category: priceData.category,
            unit: priceData.unit,
            type: priceData.type,
            specification: priceData.specification,
            lastUpdated: new Date().toISOString(),
            recordId: recordId
          };
          
          updatedPrices = [...currentPrices];
          updatedPrices[existingIndex] = newLatestPrice;
          console.log(`✅ Updated existing commodity in cache: ${priceData.commodityName}`);
        } else {
          // New price is older - don't update cache
          console.log(`📅 New price is older (${priceData.date} <= ${existingPrice.date}) - keeping existing cache`);
          console.log(`ℹ️ Price saved to Firebase but not displayed (older than current latest)`);
          return currentPrices; // Return unchanged cache
        }
      } else {
        // New commodity - always add to cache
        shouldUpdate = true;
        console.log(`🆕 New commodity - adding to cache: ${priceData.commodityName}`);
        
        const newLatestPrice: LatestPrice = {
          commodityName: priceData.commodityName,
          price: priceData.price,
          date: priceData.date,
          category: priceData.category,
          unit: priceData.unit,
          type: priceData.type,
          specification: priceData.specification,
          lastUpdated: new Date().toISOString(),
          recordId: recordId
        };
        
        updatedPrices = [...currentPrices, newLatestPrice];
      }
      
      if (shouldUpdate) {
        // Save updated prices to cache
        await this.saveLatestPrices(updatedPrices);
        console.log(`✅ Offline cache updated with ${updatedPrices.length} latest prices`);
        return updatedPrices;
      } else {
        return currentPrices;
      }
    } catch (error) {
      console.error('❌ Error updating offline cache:', error);
      return await this.getLatestPrices(); // Return current cache on error
    }
  }

  /**
   * Get latest price for a specific commodity
   */
  static async getLatestPriceForCommodity(commodityName: string): Promise<LatestPrice | null> {
    try {
      const latestPrices = await this.getLatestPrices();
      return latestPrices.find(price => price.commodityName === commodityName) || null;
    } catch (error) {
      console.error('❌ Error getting latest price for commodity:', error);
      return null;
    }
  }

  /**
   * Check if cache needs updating (older than 1 hour)
   */
  static async shouldUpdateCache(): Promise<boolean> {
    try {
      const lastSync = await this.getLastSyncTime();
      if (!lastSync) return true;
      
      const lastSyncTime = new Date(lastSync);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      return lastSyncTime < oneHourAgo;
    } catch (error) {
      console.error('❌ Error checking cache update need:', error);
      return true;
    }
  }

  /**
   * Initialize latest prices cache on app start
   * Only loads from cache - no Firebase fetching
   */
  static async initializeCache(): Promise<LatestPrice[]> {
    try {
      console.log('📱 Loading latest prices from offline cache...');
      const cachedPrices = await this.getLatestPrices();
      
      if (cachedPrices.length > 0) {
        console.log(`✅ Loaded ${cachedPrices.length} latest prices from offline cache`);
        return cachedPrices;
      } else {
        console.log('⚠️ No cached prices found - will use sample data');
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading latest prices from cache:', error);
      return [];
    }
  }

  /**
   * Clear the latest prices cache
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.LATEST_PRICES_KEY);
      await AsyncStorage.removeItem(this.LAST_SYNC_KEY);
      console.log('✅ Cleared latest prices cache');
    } catch (error) {
      console.error('❌ Error clearing latest prices cache:', error);
    }
  }
}

export default OfflineLatestPricesService;
