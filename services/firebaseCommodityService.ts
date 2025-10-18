import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Firebase Collections
const COMMODITIES_COLLECTION = 'commodities';
const PRICES_COLLECTION = 'prices';
const CATEGORIES_COLLECTION = 'categories';

// Types
export interface FirebaseCommodity {
  id?: string;
  name: string;
  category: string;
  unit: string;
  type?: string;
  specification?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // admin user ID
}

export interface FirebasePrice {
  id?: string;
  commodityId: string;
  commodityName: string;
  category: string;
  price: number;
  unit: string;
  type?: string;
  specification?: string;
  source: string; // 'admin', 'api', 'manual'
  date: Timestamp;
  location?: string;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface FirebaseCategory {
  id?: string;
  name: string;
  emoji: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Commodity Service
export class FirebaseCommodityService {
  
  // Get all commodities
  static async getAllCommodities(): Promise<FirebaseCommodity[]> {
    try {
      const commoditiesRef = collection(db, COMMODITIES_COLLECTION);
      const q = query(commoditiesRef, where('isActive', '==', true), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseCommodity[];
    } catch (error) {
      console.error('Error getting commodities:', error);
      throw error;
    }
  }

  // Get commodities by category
  static async getCommoditiesByCategory(category: string): Promise<FirebaseCommodity[]> {
    try {
      const commoditiesRef = collection(db, COMMODITIES_COLLECTION);
      const q = query(
        commoditiesRef, 
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseCommodity[];
    } catch (error) {
      console.error('Error getting commodities by category:', error);
      throw error;
    }
  }

  // Get single commodity
  static async getCommodity(id: string): Promise<FirebaseCommodity | null> {
    try {
      const commodityRef = doc(db, COMMODITIES_COLLECTION, id);
      const commoditySnap = await getDoc(commodityRef);
      
      if (commoditySnap.exists()) {
        return {
          id: commoditySnap.id,
          ...commoditySnap.data()
        } as FirebaseCommodity;
      }
      return null;
    } catch (error) {
      console.error('Error getting commodity:', error);
      throw error;
    }
  }

  // Add new commodity
  static async addCommodity(commodity: Omit<FirebaseCommodity, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const commodityData = {
        ...commodity,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, COMMODITIES_COLLECTION), commodityData);
      console.log('✅ Commodity added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding commodity:', error);
      throw error;
    }
  }

  // Update commodity
  static async updateCommodity(id: string, updates: Partial<FirebaseCommodity>): Promise<void> {
    try {
      const commodityRef = doc(db, COMMODITIES_COLLECTION, id);
      await updateDoc(commodityRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      console.log('✅ Commodity updated:', id);
    } catch (error) {
      console.error('Error updating commodity:', error);
      throw error;
    }
  }

  // Delete commodity (soft delete)
  static async deleteCommodity(id: string): Promise<void> {
    try {
      await this.updateCommodity(id, { isActive: false });
      console.log('✅ Commodity deleted:', id);
    } catch (error) {
      console.error('Error deleting commodity:', error);
      throw error;
    }
  }

  // Bulk import commodities
  static async bulkImportCommodities(commodities: Omit<FirebaseCommodity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      commodities.forEach(commodity => {
        const docRef = doc(collection(db, COMMODITIES_COLLECTION));
        batch.set(docRef, {
          ...commodity,
          createdAt: now,
          updatedAt: now
        });
      });
      
      await batch.commit();
      console.log(`✅ Bulk imported ${commodities.length} commodities`);
    } catch (error) {
      console.error('Error bulk importing commodities:', error);
      throw error;
    }
  }
}

// Price Service
export class FirebasePriceService {
  
  // Get latest prices for all commodities
  static async getLatestPrices(): Promise<FirebasePrice[]> {
    try {
      const pricesRef = collection(db, PRICES_COLLECTION);
      const q = query(
        pricesRef,
        orderBy('date', 'desc'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      // Group by commodityId and get the latest price for each
      const priceMap = new Map<string, FirebasePrice>();
      
      querySnapshot.docs.forEach(doc => {
        const price = { id: doc.id, ...doc.data() } as FirebasePrice;
        if (!priceMap.has(price.commodityId)) {
          priceMap.set(price.commodityId, price);
        }
      });
      
      return Array.from(priceMap.values());
    } catch (error) {
      console.error('Error getting latest prices:', error);
      throw error;
    }
  }

  // Get latest price for specific commodity
  static async getLatestPriceForCommodity(commodityId: string): Promise<FirebasePrice | null> {
    try {
      const pricesRef = collection(db, PRICES_COLLECTION);
      const q = query(
        pricesRef,
        where('commodityId', '==', commodityId),
        orderBy('date', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as FirebasePrice;
      }
      return null;
    } catch (error) {
      console.error('Error getting latest price for commodity:', error);
      throw error;
    }
  }

  // Get price history for commodity
  static async getPriceHistory(commodityId: string, limitCount: number = 30): Promise<FirebasePrice[]> {
    try {
      const pricesRef = collection(db, PRICES_COLLECTION);
      const q = query(
        pricesRef,
        where('commodityId', '==', commodityId),
        orderBy('date', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebasePrice[];
    } catch (error) {
      console.error('Error getting price history:', error);
      throw error;
    }
  }

  // Add new price
  static async addPrice(price: Omit<FirebasePrice, 'id' | 'createdAt'>): Promise<string> {
    try {
      const priceData = {
        ...price,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, PRICES_COLLECTION), priceData);
      console.log('✅ Price added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding price:', error);
      throw error;
    }
  }

  // Bulk import prices
  static async bulkImportPrices(prices: Omit<FirebasePrice, 'id' | 'createdAt'>[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      prices.forEach(price => {
        const docRef = doc(collection(db, PRICES_COLLECTION));
        batch.set(docRef, {
          ...price,
          createdAt: now
        });
      });
      
      await batch.commit();
      console.log(`✅ Bulk imported ${prices.length} prices`);
    } catch (error) {
      console.error('Error bulk importing prices:', error);
      throw error;
    }
  }

  // Get prices with real-time updates
  static subscribeToLatestPrices(callback: (prices: FirebasePrice[]) => void): () => void {
    const pricesRef = collection(db, PRICES_COLLECTION);
    const q = query(
      pricesRef,
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const priceMap = new Map<string, FirebasePrice>();
      
      querySnapshot.docs.forEach(doc => {
        const price = { id: doc.id, ...doc.data() } as FirebasePrice;
        if (!priceMap.has(price.commodityId)) {
          priceMap.set(price.commodityId, price);
        }
      });
      
      callback(Array.from(priceMap.values()));
    });
  }
}

// Category Service
export class FirebaseCategoryService {
  
  // Get all categories
  static async getAllCategories(): Promise<FirebaseCategory[]> {
    try {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const q = query(categoriesRef, where('isActive', '==', true), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseCategory[];
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Add new category
  static async addCategory(category: Omit<FirebaseCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const categoryData = {
        ...category,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), categoryData);
      console.log('✅ Category added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  // Update category
  static async updateCategory(id: string, updates: Partial<FirebaseCategory>): Promise<void> {
    try {
      const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      console.log('✅ Category updated:', id);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }
}

// Combined Service for Price Monitoring
export class FirebasePriceMonitoringService {
  
  // Get commodities with latest prices
  static async getCommoditiesWithPrices(): Promise<Array<FirebaseCommodity & { latestPrice?: FirebasePrice }>> {
    try {
      const [commodities, prices] = await Promise.all([
        FirebaseCommodityService.getAllCommodities(),
        FirebasePriceService.getLatestPrices()
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
      throw error;
    }
  }

  // Get commodities with prices by category
  static async getCommoditiesWithPricesByCategory(category: string): Promise<Array<FirebaseCommodity & { latestPrice?: FirebasePrice }>> {
    try {
      const [commodities, prices] = await Promise.all([
        FirebaseCommodityService.getCommoditiesByCategory(category),
        FirebasePriceService.getLatestPrices()
      ]);
      
      const priceMap = new Map<string, FirebasePrice>();
      prices.forEach(price => {
        priceMap.set(price.commodityId, price);
      });
      
      return commodities.map(commodity => ({
        ...commodity,
        latestPrice: priceMap.get(commodity.id || '')
      }));
    } catch (error) {
      console.error('Error getting commodities with prices by category:', error);
      throw error;
    }
  }

  // Subscribe to real-time updates
  static subscribeToCommoditiesWithPrices(callback: (data: Array<FirebaseCommodity & { latestPrice?: FirebasePrice }>) => void): () => void {
    let unsubscribeCommodities: (() => void) | null = null;
    let unsubscribePrices: (() => void) | null = null;
    
    const updateData = () => {
      if (unsubscribeCommodities && unsubscribePrices) {
        // Both subscriptions are ready, we can combine the data
        // This will be handled by the individual subscriptions
      }
    };
    
    // Subscribe to commodities
    const commoditiesRef = collection(db, COMMODITIES_COLLECTION);
    const commoditiesQuery = query(commoditiesRef, where('isActive', '==', true), orderBy('name'));
    unsubscribeCommodities = onSnapshot(commoditiesQuery, (commoditiesSnapshot) => {
      const commodities = commoditiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseCommodity[];
      
      // Get latest prices for these commodities
      FirebasePriceService.getLatestPrices().then(prices => {
        const priceMap = new Map<string, FirebasePrice>();
        prices.forEach(price => {
          priceMap.set(price.commodityId, price);
        });
        
        const result = commodities.map(commodity => ({
          ...commodity,
          latestPrice: priceMap.get(commodity.id || '')
        }));
        
        callback(result);
      });
    });
    
    return () => {
      if (unsubscribeCommodities) unsubscribeCommodities();
      if (unsubscribePrices) unsubscribePrices();
    };
  }
}

export default {
  FirebaseCommodityService,
  FirebasePriceService,
  FirebaseCategoryService,
  FirebasePriceMonitoringService
};

