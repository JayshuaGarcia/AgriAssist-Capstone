import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COMMODITY_DATA } from '../constants/CommodityData';

// Storage keys
const COMMODITIES_CACHE_KEY = 'cached_commodities';
const PRICES_CACHE_KEY = 'cached_prices';
const CATEGORIES_CACHE_KEY = 'cached_categories';
const LAST_UPDATED_KEY = 'last_data_update';
const CACHE_INITIALIZED_KEY = 'cache_initialized';

interface OfflineCacheInitializerProps {
  children: React.ReactNode;
}

export const OfflineCacheInitializer: React.FC<OfflineCacheInitializerProps> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeCacheIfNeeded();
  }, []);

  const initializeCacheIfNeeded = async () => {
    try {
      // Check if cache is already initialized
      const cacheInitialized = await AsyncStorage.getItem(CACHE_INITIALIZED_KEY);
      if (cacheInitialized === 'true') {
        setIsInitialized(true);
        return;
      }

      setIsInitializing(true);
      console.log('🔄 Initializing offline cache with static data...');

      // Create categories from commodity data
      const categories = [
        { id: '1', name: 'BEEF MEAT PRODUCTS', emoji: '🥩', description: 'Beef and beef-related meat products', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'PORK MEAT PRODUCTS', emoji: '🥓', description: 'Pork and pork-related meat products', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'POULTRY PRODUCTS', emoji: '🐔', description: 'Chicken, duck, and other poultry products', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '4', name: 'OTHER LIVESTOCK MEAT PRODUCTS', emoji: '🥩', description: 'Lamb, goat, and other livestock meat', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '5', name: 'FISH PRODUCTS', emoji: '🐟', description: 'Fresh and processed fish products', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '6', name: 'FRUITS', emoji: '🍎', description: 'Fresh fruits and fruit products', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '7', name: 'HIGHLAND VEGETABLES', emoji: '🥬', description: 'Vegetables grown in highland areas', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '8', name: 'LOWLAND VEGETABLES', emoji: '🥬', description: 'Vegetables grown in lowland areas', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '9', name: 'SPICES', emoji: '🌶️', description: 'Spices, herbs, and seasonings', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '10', name: 'CORN PRODUCTS', emoji: '🌽', description: 'Corn and corn-based products', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '11', name: 'KADIWA RICE-FOR-ALL', emoji: '🌾', description: 'Government-subsidized rice program', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '12', name: 'IMPORTED COMMERCIAL RICE', emoji: '🌾', description: 'Imported commercial rice varieties', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '13', name: 'LOCAL COMMERCIAL RICE', emoji: '🌾', description: 'Local commercial rice varieties', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '14', name: 'OTHER BASIC COMMODITIES', emoji: '📦', description: 'Other basic food commodities', isActive: true, createdAt: new Date(), updatedAt: new Date() }
      ];

      // Convert commodity data to Firebase format
      const commodities = COMMODITY_DATA.map((commodity, index) => ({
        id: `commodity_${index + 1}`,
        name: commodity.name,
        category: commodity.category,
        unit: commodity.unit,
        type: commodity.type || undefined,
        specification: commodity.specification || undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system-initialization'
      }));

      // Create sample prices for commodities that have currentPrice
      const prices = COMMODITY_DATA
        .filter(commodity => commodity.currentPrice)
        .map((commodity, index) => {
          const commodityId = `commodity_${COMMODITY_DATA.indexOf(commodity) + 1}`;
          return {
            id: `price_${index + 1}`,
            commodityId: commodityId,
            commodityName: commodity.name,
            category: commodity.category,
            price: commodity.currentPrice,
            unit: commodity.unit,
            type: commodity.type || undefined,
            specification: commodity.specification || undefined,
            source: 'static-data',
            date: commodity.priceDate ? new Date(commodity.priceDate) : new Date(),
            location: 'Philippines',
            notes: 'Initial data from static commodity data',
            createdBy: 'system-initialization',
            createdAt: new Date()
          };
        });

      // Cache the data
      const now = Date.now();
      
      await AsyncStorage.setItem(COMMODITIES_CACHE_KEY, JSON.stringify({
        data: commodities,
        timestamp: now,
        version: '1.0'
      }));

      await AsyncStorage.setItem(PRICES_CACHE_KEY, JSON.stringify({
        data: prices,
        timestamp: now,
        version: '1.0'
      }));

      await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({
        data: categories,
        timestamp: now,
        version: '1.0'
      }));

      await AsyncStorage.setItem(LAST_UPDATED_KEY, now.toString());
      await AsyncStorage.setItem(CACHE_INITIALIZED_KEY, 'true');

      console.log('✅ Offline cache initialized successfully!');
      console.log(`📊 Cached data:`);
      console.log(`   • ${commodities.length} commodities`);
      console.log(`   • ${prices.length} prices`);
      console.log(`   • ${categories.length} categories`);

      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Error initializing offline cache:', error);
      // Still set as initialized to prevent infinite loading
      setIsInitialized(true);
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#16543a" />
        <Text style={styles.text}>🔄 Initializing offline data...</Text>
        <Text style={styles.subText}>This will only happen once</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16543a',
    marginTop: 16,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default OfflineCacheInitializer;

