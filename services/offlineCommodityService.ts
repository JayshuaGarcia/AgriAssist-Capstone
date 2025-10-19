import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    FirebaseCategory,
    FirebaseCategoryService,
    FirebaseCommodity,
    FirebaseCommodityService,
    FirebasePrice,
    FirebasePriceService
} from './firebaseCommodityService';

// Storage keys
const COMMODITIES_CACHE_KEY = 'cached_commodities';
const PRICES_CACHE_KEY = 'cached_prices';
const CATEGORIES_CACHE_KEY = 'cached_categories';
const LAST_UPDATED_KEY = 'last_data_update';

// Cache duration (24 hours in milliseconds)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export interface CachedData<T> {
  data: T[];
  timestamp: number;
  version: string;
}

export class OfflineCommodityService {
  
  // Check if cache is valid (not expired)
  static async isCacheValid(): Promise<boolean> {
    try {
      const lastUpdated = await AsyncStorage.getItem(LAST_UPDATED_KEY);
      if (!lastUpdated) return false;
      
      const lastUpdateTime = parseInt(lastUpdated);
      const now = Date.now();
      
      return (now - lastUpdateTime) < CACHE_DURATION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  // Get cached commodities
  static async getCachedCommodities(): Promise<FirebaseCommodity[]> {
    try {
      const cached = await AsyncStorage.getItem(COMMODITIES_CACHE_KEY);
      if (!cached) return [];
      
      const parsed: CachedData<FirebaseCommodity> = JSON.parse(cached);
      return parsed.data;
    } catch (error) {
      console.error('Error getting cached commodities:', error);
      return [];
    }
  }

  // Get cached prices
  static async getCachedPrices(): Promise<FirebasePrice[]> {
    try {
      const cached = await AsyncStorage.getItem(PRICES_CACHE_KEY);
      if (!cached) return [];
      
      const parsed: CachedData<FirebasePrice> = JSON.parse(cached);
      return parsed.data;
    } catch (error) {
      console.error('Error getting cached prices:', error);
      return [];
    }
  }

  // Get cached categories
  static async getCachedCategories(): Promise<FirebaseCategory[]> {
    try {
      const cached = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);
      if (!cached) return [];
      
      const parsed: CachedData<FirebaseCategory> = JSON.parse(cached);
      return parsed.data;
    } catch (error) {
      console.error('Error getting cached categories:', error);
      return [];
    }
  }

  // Cache commodities
  static async cacheCommodities(commodities: FirebaseCommodity[]): Promise<void> {
    try {
      const cacheData: CachedData<FirebaseCommodity> = {
        data: commodities,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      await AsyncStorage.setItem(COMMODITIES_CACHE_KEY, JSON.stringify(cacheData));
      console.log('✅ Cached commodities:', commodities.length);
    } catch (error) {
      console.error('Error caching commodities:', error);
    }
  }

  // Cache prices
  static async cachePrices(prices: FirebasePrice[]): Promise<void> {
    try {
      const cacheData: CachedData<FirebasePrice> = {
        data: prices,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      await AsyncStorage.setItem(PRICES_CACHE_KEY, JSON.stringify(cacheData));
      console.log('✅ Cached prices:', prices.length);
    } catch (error) {
      console.error('Error caching prices:', error);
    }
  }

  // Cache categories
  static async cacheCategories(categories: FirebaseCategory[]): Promise<void> {
    try {
      const cacheData: CachedData<FirebaseCategory> = {
        data: categories,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(cacheData));
      console.log('✅ Cached categories:', categories.length);
    } catch (error) {
      console.error('Error caching categories:', error);
    }
  }

  // Update last updated timestamp
  static async updateLastUpdated(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_UPDATED_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error updating last updated timestamp:', error);
    }
  }

  // Get commodities with offline-first strategy
  static async getCommodities(): Promise<FirebaseCommodity[]> {
    try {
      // First try to get from cache
      const cached = await this.getCachedCommodities();
      if (cached.length > 0) {
        console.log('📱 Using cached commodities:', cached.length);
        return cached;
      }

      // If no cache, try Firebase
      console.log('🌐 Fetching commodities from Firebase...');
      const firebaseData = await FirebaseCommodityService.getAllCommodities();
      
      // Cache the data for next time
      await this.cacheCommodities(firebaseData);
      await this.updateLastUpdated();
      
      return firebaseData;
    } catch (error) {
      console.error('Error getting commodities:', error);
      // Return cached data even if expired
      return await this.getCachedCommodities();
    }
  }

  // Get prices with offline-first strategy
  static async getLatestPrices(): Promise<FirebasePrice[]> {
    try {
      // First try to get from cache
      const cached = await this.getCachedPrices();
      if (cached.length > 0) {
        console.log('📱 Using cached prices:', cached.length);
        return cached;
      }

      // If no cache, try Firebase
      console.log('🌐 Fetching prices from Firebase...');
      const firebaseData = await FirebasePriceService.getLatestPrices();
      
      // Cache the data for next time
      await this.cachePrices(firebaseData);
      await this.updateLastUpdated();
      
      return firebaseData;
    } catch (error) {
      console.error('Error getting prices:', error);
      // Return cached data even if expired
      return await this.getCachedPrices();
    }
  }

  // Get categories with offline-first strategy
  static async getCategories(): Promise<FirebaseCategory[]> {
    try {
      // First try to get from cache
      const cached = await this.getCachedCategories();
      if (cached.length > 0) {
        console.log('📱 Using cached categories:', cached.length);
        return cached;
      }

      // If no cache, try Firebase
      console.log('🌐 Fetching categories from Firebase...');
      const firebaseData = await FirebaseCategoryService.getAllCategories();
      
      // Cache the data for next time
      await this.cacheCategories(firebaseData);
      await this.updateLastUpdated();
      
      return firebaseData;
    } catch (error) {
      console.error('Error getting categories:', error);
      // Return cached data even if expired
      return await this.getCachedCategories();
    }
  }

  // Manual refresh from Firebase
  static async refreshFromFirebase(): Promise<{
    commodities: FirebaseCommodity[];
    prices: FirebasePrice[];
    categories: FirebaseCategory[];
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🔄 Refreshing data from Firebase...');
      
      // Fetch fresh data from Firebase
      const [commodities, prices, categories] = await Promise.all([
        FirebaseCommodityService.getAllCommodities(),
        FirebasePriceService.getLatestPrices(),
        FirebaseCategoryService.getAllCategories()
      ]);

      // Cache the fresh data
      await Promise.all([
        this.cacheCommodities(commodities),
        this.cachePrices(prices),
        this.cacheCategories(categories),
        this.updateLastUpdated()
      ]);

      console.log('✅ Data refreshed successfully:', {
        commodities: commodities.length,
        prices: prices.length,
        categories: categories.length
      });

      return {
        commodities,
        prices,
        categories,
        success: true
      };
    } catch (error) {
      console.error('❌ Error refreshing from Firebase:', error);
      return {
        commodities: [],
        prices: [],
        categories: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get commodities with prices (offline-first)
  static async getCommoditiesWithPrices(): Promise<Array<FirebaseCommodity & { latestPrice?: FirebasePrice }>> {
    try {
      const [commodities, prices] = await Promise.all([
        this.getCommodities(),
        this.getLatestPrices()
      ]);

      // Create a map of commodityId to latest price
      const priceMap = new Map<string, FirebasePrice>();
      prices.forEach(price => {
        priceMap.set(price.commodityId, price);
      });

      // Combine commodities with their latest prices
      return commodities.map(commodity => ({
        ...commodity,
        latestPrice: priceMap.get(commodity.id || '')
      }));
    } catch (error) {
      console.error('Error getting commodities with prices:', error);
      return [];
    }
  }

  // Clear all cached data
  static async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(COMMODITIES_CACHE_KEY),
        AsyncStorage.removeItem(PRICES_CACHE_KEY),
        AsyncStorage.removeItem(CATEGORIES_CACHE_KEY),
        AsyncStorage.removeItem(LAST_UPDATED_KEY)
      ]);
      console.log('✅ Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get cache info
  static async getCacheInfo(): Promise<{
    hasCommodities: boolean;
    hasPrices: boolean;
    hasCategories: boolean;
    lastUpdated: string | null;
    isValid: boolean;
  }> {
    try {
      const [commodities, prices, categories, lastUpdated] = await Promise.all([
        this.getCachedCommodities(),
        this.getCachedPrices(),
        this.getCachedCategories(),
        AsyncStorage.getItem(LAST_UPDATED_KEY)
      ]);

      const isValid = await this.isCacheValid();

      return {
        hasCommodities: commodities.length > 0,
        hasPrices: prices.length > 0,
        hasCategories: categories.length > 0,
        lastUpdated: lastUpdated ? new Date(parseInt(lastUpdated)).toLocaleString() : null,
        isValid
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return {
        hasCommodities: false,
        hasPrices: false,
        hasCategories: false,
        lastUpdated: null,
        isValid: false
      };
    }
  }
}

export default OfflineCommodityService;





