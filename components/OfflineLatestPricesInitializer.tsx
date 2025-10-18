import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getLatestPriceData } from '../lib/storageUtils';
import OfflineLatestPricesService, { LatestPrice } from '../services/offlineLatestPricesService';

interface OfflineLatestPricesInitializerProps {
  children: React.ReactNode;
}

const GREEN = '#16543a';

export const OfflineLatestPricesInitializer: React.FC<OfflineLatestPricesInitializerProps> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationStatus, setInitializationStatus] = useState('');

  useEffect(() => {
    initializeOfflineLatestPrices();
  }, []);

  const loadSampleData = async (): Promise<LatestPrice[]> => {
    // Sample data based on the Excel file structure
    return [
      // Beef Products
      {
        commodityName: "Beef Brisket, Local - Meat with Bones",
        price: 277.75,
        date: "2024-10-15",
        category: "BEEF MEAT PRODUCTS",
        unit: "kg",
        type: "Beef Brisket, Local",
        specification: "Meat with Bones",
        lastUpdated: new Date().toISOString(),
        recordId: "beef_brisket_local_meat_with_bones"
      },
      {
        commodityName: "Beef Chuck, Local - Lean Meat/Tapaera",
        price: 285.50,
        date: "2024-10-15",
        category: "BEEF MEAT PRODUCTS",
        unit: "kg",
        type: "Beef Chuck, Local",
        specification: "Lean Meat/Tapaera",
        lastUpdated: new Date().toISOString(),
        recordId: "beef_chuck_local_lean_meat"
      },
      
      // Pork Products
      {
        commodityName: "Pork Belly, Local",
        price: 195.25,
        date: "2024-10-15",
        category: "PORK MEAT PRODUCTS",
        unit: "kg",
        type: "Pork Belly, Local",
        specification: "",
        lastUpdated: new Date().toISOString(),
        recordId: "pork_belly_local"
      },
      {
        commodityName: "Pork Chop, Local",
        price: 220.75,
        date: "2024-10-15",
        category: "PORK MEAT PRODUCTS",
        unit: "kg",
        type: "Pork Chop, Local",
        specification: "",
        lastUpdated: new Date().toISOString(),
        recordId: "pork_chop_local"
      },
      
      // Poultry Products
      {
        commodityName: "Chicken Breast, Local - Fresh",
        price: 185.50,
        date: "2024-10-15",
        category: "POULTRY PRODUCTS",
        unit: "kg",
        type: "Chicken Breast, Local",
        specification: "Fresh",
        lastUpdated: new Date().toISOString(),
        recordId: "chicken_breast_local_fresh"
      },
      {
        commodityName: "Chicken Leg Quarter, Local",
        price: 165.25,
        date: "2024-10-15",
        category: "POULTRY PRODUCTS",
        unit: "kg",
        type: "Chicken Leg Quarter, Local",
        specification: "",
        lastUpdated: new Date().toISOString(),
        recordId: "chicken_leg_quarter_local"
      },
      
      // Fish Products
      {
        commodityName: "Bangus, Local - Large",
        price: 145.75,
        date: "2024-10-15",
        category: "FISH PRODUCTS",
        unit: "kg",
        type: "Bangus, Local",
        specification: "Large",
        lastUpdated: new Date().toISOString(),
        recordId: "bangus_local_large"
      },
      {
        commodityName: "Tilapia, Local - Medium",
        price: 125.50,
        date: "2024-10-15",
        category: "FISH PRODUCTS",
        unit: "kg",
        type: "Tilapia, Local",
        specification: "Medium",
        lastUpdated: new Date().toISOString(),
        recordId: "tilapia_local_medium"
      },
      
      // Rice Products
      {
        commodityName: "Premium Rice, Local - 5% broken",
        price: 45.25,
        date: "2024-10-15",
        category: "LOCAL COMMERCIAL RICE",
        unit: "kg",
        type: "Premium Rice, Local",
        specification: "5% broken",
        lastUpdated: new Date().toISOString(),
        recordId: "premium_rice_local_5_percent_broken"
      },
      {
        commodityName: "Regular Milled Rice, Local - 20-40% bran streak",
        price: 38.75,
        date: "2024-10-15",
        category: "LOCAL COMMERCIAL RICE",
        unit: "kg",
        type: "Regular Milled Rice, Local",
        specification: "20-40% bran streak",
        lastUpdated: new Date().toISOString(),
        recordId: "regular_milled_rice_local_20_40_bran"
      },
      
      // Vegetables
      {
        commodityName: "Tomato, Local",
        price: 65.50,
        date: "2024-10-15",
        category: "LOWLAND VEGETABLES",
        unit: "kg",
        type: "Tomato, Local",
        specification: "",
        lastUpdated: new Date().toISOString(),
        recordId: "tomato_local"
      },
      {
        commodityName: "Bell Pepper, Local - Green, Medium",
        price: 85.25,
        date: "2024-10-15",
        category: "HIGHLAND VEGETABLES",
        unit: "kg",
        type: "Bell Pepper, Local",
        specification: "Green, Medium",
        lastUpdated: new Date().toISOString(),
        recordId: "bell_pepper_local_green_medium"
      },
      
      // Fruits
      {
        commodityName: "Banana, Local - Lakatan",
        price: 35.75,
        date: "2024-10-15",
        category: "FRUITS",
        unit: "kg",
        type: "Banana, Local",
        specification: "Lakatan",
        lastUpdated: new Date().toISOString(),
        recordId: "banana_local_lakatan"
      },
      {
        commodityName: "Mango, Local - Carabao, Ripe",
        price: 95.50,
        date: "2024-10-15",
        category: "FRUITS",
        unit: "kg",
        type: "Mango, Local",
        specification: "Carabao, Ripe",
        lastUpdated: new Date().toISOString(),
        recordId: "mango_local_carabao_ripe"
      },
      
      // Spices
      {
        commodityName: "Garlic, Local",
        price: 125.25,
        date: "2024-10-15",
        category: "SPICES",
        unit: "kg",
        type: "Garlic, Local",
        specification: "",
        lastUpdated: new Date().toISOString(),
        recordId: "garlic_local"
      },
      {
        commodityName: "Red Onion, Local",
        price: 85.75,
        date: "2024-10-15",
        category: "SPICES",
        unit: "kg",
        type: "Red Onion, Local",
        specification: "",
        lastUpdated: new Date().toISOString(),
        recordId: "red_onion_local"
      },
      
      // Basic Commodities
      {
        commodityName: "Cooking Oil, Coconut - 1L",
        price: 125.50,
        date: "2024-10-15",
        category: "OTHER BASIC COMMODITIES",
        unit: "L",
        type: "Cooking Oil, Coconut",
        specification: "1L",
        lastUpdated: new Date().toISOString(),
        recordId: "cooking_oil_coconut_1l"
      },
      {
        commodityName: "Sugar, Brown",
        price: 45.25,
        date: "2024-10-15",
        category: "OTHER BASIC COMMODITIES",
        unit: "kg",
        type: "Sugar, Brown",
        specification: "",
        lastUpdated: new Date().toISOString(),
        recordId: "sugar_brown"
      }
    ];
  };

  const initializeOfflineLatestPrices = async () => {
    try {
      console.log('🚀 Initializing offline latest prices system...');
      setInitializationStatus('Checking existing data...');

      // Check if we already have cached latest prices
      const existingLatestPrices = await OfflineLatestPricesService.getLatestPrices();
      
      if (existingLatestPrices.length > 0) {
        console.log(`✅ Found ${existingLatestPrices.length} existing latest prices in cache`);
        setInitializationStatus('Using cached latest prices');
        setIsInitializing(false);
        return;
      }

      console.log('📊 No cached latest prices found, initializing from stored data...');
      setInitializationStatus('Loading from stored data...');

      // Try to get existing price data from AsyncStorage
      const storedPriceData = await getLatestPriceData();
      
      if (storedPriceData && storedPriceData.length > 0) {
        console.log(`📊 Found ${storedPriceData.length} price records in stored data`);
        setInitializationStatus('Converting to latest prices format...');

        // Convert stored data to LatestPrice format
        const latestPrices: LatestPrice[] = storedPriceData.map((item: any) => {
          const commodityName = item.Type ? `${item.Type}${item.Specification ? ` - ${item.Specification}` : ''}` : item.Commodity;
          
          return {
            commodityName: commodityName,
            price: parseFloat(item.Amount) || 0,
            date: item.Date,
            category: item.Commodity,
            unit: 'kg', // Default unit
            type: item.Type || '',
            specification: item.Specification || '',
            lastUpdated: new Date().toISOString(),
            recordId: `stored_${item.Commodity}_${item.Type}_${item.Specification}_${item.Date}` // Generate unique ID
          };
        });

        console.log(`✅ Converted ${latestPrices.length} records to latest prices format`);
        setInitializationStatus('Saving to offline cache...');

        // Save to offline cache
        await OfflineLatestPricesService.saveLatestPrices(latestPrices);
        
        console.log(`🎉 Successfully initialized offline latest prices with ${latestPrices.length} records`);
        setInitializationStatus('Initialization complete!');
        } else {
          console.log('⚠️ No stored price data found, loading sample data...');
          setInitializationStatus('Loading sample data...');
          
          // Load sample data as fallback
          const sampleData = await loadSampleData();
          if (sampleData.length > 0) {
            await OfflineLatestPricesService.saveLatestPrices(sampleData);
            console.log(`🎉 Successfully loaded ${sampleData.length} sample prices`);
            setInitializationStatus('Sample data loaded!');
          } else {
            setInitializationStatus('No data available - will show empty state');
          }
        }

    } catch (error) {
      console.error('❌ Error initializing offline latest prices:', error);
      setInitializationStatus('Initialization failed - will use sample data');
    } finally {
      // Always finish initialization after a short delay
      setTimeout(() => {
        setIsInitializing(false);
      }, 1000);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.initializingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.initializingText}>🚀 Initializing Price Data</Text>
        <Text style={styles.statusText}>{initializationStatus}</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  initializingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f5',
    padding: 20,
  },
  initializingText: {
    fontSize: 18,
    fontWeight: '600',
    color: GREEN,
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
