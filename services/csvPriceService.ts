/**
 * Service to load and manage price data from CSV files
 */
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
export interface PriceRecord {
  date: string;
  price: number;
}

export interface ForecastRecord {
  date: string;
  forecast: number;
  lower?: number;
  upper?: number;
}

export interface CommodityPrice {
  name: string;
  displayName: string;
  currentPrice: number;
  currentDate: string;
  category: string;
  specification?: string;
  historicalData?: PriceRecord[];
  historicalDataByYear?: { [year: string]: PriceRecord[] }; // All years data
  forecastData?: ForecastRecord[]; // Forecast data from seasonal historical + trend method
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  availableYears?: string[]; // Available years (historical + forecast years)
}

// Map commodity folder names to categories
const CATEGORY_MAP: Record<string, string> = {
  'Imported Premium': 'Rice',
  'Imported Regular milled': 'Rice',
  'Imported Special': 'Rice',
  'Imported Well milled': 'Rice',
  'Local Premium': 'Rice',
  'Local Regular milled': 'Rice',
  'Local Special': 'Rice',
  'Local Well milled': 'Rice',
  'Banana _Lakatan_': 'Fruits',
  'Banana _Latundan_': 'Fruits',
  'Banana _Saba_': 'Fruits',
  'Papaya': 'Fruits',
  'Tomato': 'Vegetables',
  'Eggplant _Talong_': 'Vegetables',
  'Squash': 'Vegetables',
  'Bittergourd _Ampalaya_': 'Vegetables',
  'String Beans _Sitao_': 'Vegetables',
  'Pechay _Native_': 'Vegetables',
  'Bell Pepper _Green_': 'Vegetables',
  'Bell Pepper _Red_': 'Vegetables',
  'Lettuce _Green Ice_': 'Vegetables',
  'Lettuce _Iceberg_': 'Vegetables',
  'Lettuce _Romaine_': 'Vegetables',
  'Calamansi': 'Fruits',
  'Ginger': 'Vegetables',
  'Chilli _Labuyo_': 'Vegetables',
  'Local Garlic': 'Vegetables',
  'Imported Garlic': 'Vegetables',
  'Local Red Onion': 'Vegetables',
  'Chicken Egg_White_M_': 'Poultry',
  'Chicken Egg_White_ M_': 'Poultry', // With space
  'Chicken Egg_White_L_': 'Poultry',
  'Chicken Egg_White_XL_': 'Poultry',
  'Chicken Egg_White_ XL_': 'Poultry', // With space
  'Chicken Egg_White_J_': 'Poultry',
  'Chicken Egg_White_P_': 'Poultry',
  'Chicken Egg_White_S_': 'Poultry',
  'Chicken Egg_White_XS_': 'Poultry',
  'Chicken Egg_Brown_M_': 'Poultry',
  'Chicken Egg_Brown_ M_': 'Poultry', // With space
  'Chicken Egg_Brown_L_': 'Poultry',
  'Chicken Egg_Brown_XL_': 'Poultry',
  'Chicken Egg_Brown_ XL_': 'Poultry', // With space
  'Whole Chicken': 'Poultry',
  'Pork Ham_Kasim_': 'Meat',
  'Pork Ham Belly_Liempo_': 'Meat',
  'Frozen Kasim': 'Meat',
  'Frozen Liempo': 'Meat',
};

function getCategory(commodityName: string): string {
  // First try exact match
  if (CATEGORY_MAP[commodityName]) {
    return CATEGORY_MAP[commodityName];
  }
  
  // Try normalized version (remove extra spaces)
  const normalized = commodityName.replace(/\s+/g, ' ').trim();
  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized];
  }
  
  // Check if it's a chicken egg or poultry item
  const lowerName = commodityName.toLowerCase();
  if (lowerName.includes('chicken') || lowerName.includes('egg') || lowerName.includes('duck') || lowerName.includes('poultry') || lowerName.includes('turkey') || lowerName.includes('quail')) {
    return 'Poultry';
  }
  
  return 'Other';
}

function sanitizeDisplayName(folderName: string): string {
  return folderName
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Load latest price from JSON (converted from CSV)
async function loadLatestPrice(commodityFolder: string): Promise<CommodityPrice | null> {
  try {
    // Load JSON data (pre-converted from CSV)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Dynamic require
    let cleanedData = require('../data/prices/json/cleaned.json');
    
    // Track a direct override for this specific commodity (for "current price" and "as of" date)
    let latestOverride: { date: string; price: number } | null = null;

    // Check for uploaded price updates in AsyncStorage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const lastUpdateDate = await AsyncStorage.getItem('last_price_update_date');
      if (lastUpdateDate) {
        const priceUpdatesKey = 'price_updates_' + lastUpdateDate;
        const priceUpdatesJson = await AsyncStorage.getItem(priceUpdatesKey);
        if (priceUpdatesJson) {
          const priceUpdates = JSON.parse(priceUpdatesJson);
          
          // Helper to normalize commodity names so different formats still match
          const normalizeName = (value: string) =>
            value
              ?.replace(/_/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .toLowerCase();

          // Apply updates to cleanedData
          Object.keys(priceUpdates).forEach(commodityName => {
            const searchNormalized = normalizeName(commodityName);
            if (!searchNormalized) {
              return;
            }

            const matchingKey = Object.keys(cleanedData).find(key => {
              const normalized = normalizeName(key);
              if (!normalized) return false;
              // Prefer exact normalized match
              if (normalized === searchNormalized) return true;
              // Fallback: allow partial matches in either direction
              return normalized.includes(searchNormalized) || searchNormalized.includes(normalized);
            });

            if (matchingKey && cleanedData[matchingKey]) {
              const update = priceUpdates[commodityName];
              if (!cleanedData[matchingKey]['2025']) {
                cleanedData[matchingKey]['2025'] = [];
              }
              
              // Add or update the price entry
              const existingIndex = cleanedData[matchingKey]['2025'].findIndex(
                (item: any) => item.date === update.date
              );
              
              const priceEntry = { date: update.date, price: update.price };
              
              if (existingIndex >= 0) {
                cleanedData[matchingKey]['2025'][existingIndex] = priceEntry;
              } else {
                cleanedData[matchingKey]['2025'].push(priceEntry);
                cleanedData[matchingKey]['2025'].sort((a: any, b: any) => 
                  a.date.localeCompare(b.date)
                );
              }

              // If this update is for the commodity we're currently loading, remember it as a direct override
              if (matchingKey === commodityFolder) {
                latestOverride = {
                  date: update.date,
                  price: update.price,
                };
              }
            }
          });
        }
      }
    } catch (storageError) {
      // Ignore storage errors, use original data
      console.log('No price updates in storage, using original data');
    }

    // Also check Firestore for shared price overrides so all users/devices
    // see the same latest price and "as of" date for this commodity.
    try {
      const overrideRef = doc(db, 'price_overrides', commodityFolder);
      const overrideSnap = await getDoc(overrideRef);
      if (overrideSnap.exists()) {
        const data: any = overrideSnap.data();
        if (data && typeof data.price === 'number' && typeof data.date === 'string') {
          latestOverride = {
            date: data.date,
            price: data.price,
          };
        }
      }
    } catch (firestoreError) {
      console.log('No Firestore price override for', commodityFolder, firestoreError);
    }
    
    if (!cleanedData || !cleanedData[commodityFolder]) {
      return null;
    }

    const commodityData = cleanedData[commodityFolder];
    
    // Get all years data
    const years = Object.keys(commodityData).filter(year => 
      Array.isArray(commodityData[year]) && commodityData[year].length > 0
    );
    
    if (years.length === 0) return null;

    // Prioritize 2025 data (latest year), fallback to most recent year
    // Sort years numerically (descending) to get the latest year
    const sortedYears = years.sort((a, b) => parseInt(b) - parseInt(a));
    let latestYear = sortedYears.find(year => year === '2025') || sortedYears[0];
    let yearData = commodityData[latestYear];
    
    // console.log(`📊 Loading ${commodityFolder}: Using year ${latestYear} (available: ${sortedYears.join(', ')})`);
    
    if (!yearData || !Array.isArray(yearData) || yearData.length === 0) {
      return null;
    }

    // Process latest year for current price and trend
    const records: PriceRecord[] = yearData
      .filter((item: any) => item.date && typeof item.price === 'number')
      .map((item: any) => ({
        date: item.date,
        price: item.price,
      }));

    if (records.length === 0) return null;

    // Get the latest price
    let latestRecord = records[records.length - 1];

    // If we have a manual override for this commodity, use that as the "current" record
    // even if its date is earlier than the last historical entry – this ensures
    // the "As of" date in the UI matches the admin-selected date.
    if (latestOverride) {
      latestRecord = {
        date: latestOverride.date,
        price: latestOverride.price,
      };
    }
    
    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let changePercent = 0;
    if (records.length >= 7) {
      const weekAgo = records[records.length - 7];
      const change = latestRecord.price - weekAgo.price;
      changePercent = (change / weekAgo.price) * 100;
      if (changePercent > 2) trend = 'up';
      else if (changePercent < -2) trend = 'down';
    }

    // Process all years data
    const historicalDataByYear: { [year: string]: PriceRecord[] } = {};
    years.forEach(year => {
      const yearRecords = (commodityData[year] as any[])
        .filter((item: any) => item.date && typeof item.price === 'number')
        .map((item: any) => ({
          date: item.date,
          price: item.price,
        }));
      if (yearRecords.length > 0) {
        historicalDataByYear[year] = yearRecords;
      }
    });

    // Load forecast data (generated using seasonal historical + trend method)
    const forecastData = await loadForecast(commodityFolder);
    
    // Get forecast years from forecast data (extends to Dec 2026)
    const forecastYears = new Set<string>();
    forecastData.forEach(f => {
      const forecastYear = new Date(f.date).getFullYear().toString();
      forecastYears.add(forecastYear);
    });
    
    // Combine historical and forecast years
    const allAvailableYears = new Set([...years, ...Array.from(forecastYears)]);
    const allSortedYears = Array.from(allAvailableYears).sort((a, b) => parseInt(b) - parseInt(a));

    return {
      name: commodityFolder,
      displayName: sanitizeDisplayName(commodityFolder),
      currentPrice: latestRecord.price,
      currentDate: latestRecord.date,
      category: getCategory(commodityFolder),
      historicalData: records, // Latest year data
      historicalDataByYear, // All years data
      forecastData, // Forecast data (seasonal historical + trend method)
      availableYears: allSortedYears, // Most recent first, includes forecast years (2026, etc.)
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  } catch (error) {
    console.error(`Error loading price for ${commodityFolder}:`, error);
    return null;
  }
}

// Load forecast data from JSON (generated using seasonal historical + trend method)
async function loadForecast(commodityFolder: string): Promise<ForecastRecord[]> {
  try {
    // Load JSON forecast data (pre-converted from CSV)
    // Forecast generated using: Historical Seasonal Median × Current Trend Ratio
    // Extends to December 31, 2026
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Dynamic require
    const forecastData = require('../data/prices/json/forecast.json');
    
    if (!forecastData || !forecastData[commodityFolder]) {
      return [];
    }

    const forecasts: ForecastRecord[] = forecastData[commodityFolder]
      .filter((item: any) => item.date && typeof item.forecast === 'number')
      .map((item: any) => ({
        date: item.date,
        forecast: item.forecast,
        lower: typeof item.lower === 'number' ? item.lower : undefined,
        upper: typeof item.upper === 'number' ? item.upper : undefined,
      }));

    return forecasts;
  } catch (error) {
    console.error(`Error loading forecast for ${commodityFolder}:`, error);
    return [];
  }
}

// Load CSV data using require (for React Native bundled assets)
async function loadCSV(requirePath: any): Promise<string | null> {
  try {
    // In React Native, we'll need to convert CSVs to JSON first
    // For now, return null and we'll use JSON
    return null;
  } catch (error) {
    console.error('Error loading CSV:', error);
    return null;
  }
}

// Load price data from JSON (converted from CSV)
async function loadPriceFromJSON(item: string): Promise<PriceRecord[]> {
  try {
    // Try to load from JSON file (needs to be pre-converted)
    // For now, return empty array - we'll create a conversion script
    return [];
  } catch (error) {
    return [];
  }
}

// Get list of all commodities from cleaned data (historical data)
export async function getAllCommodities(): Promise<CommodityPrice[]> {
  try {
    // Load JSON cleaned data (pre-converted from CSV)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Dynamic require
    const cleanedData = require('../data/prices/json/cleaned.json');
    
    if (!cleanedData || typeof cleanedData !== 'object') {
      console.warn('Invalid cleaned data format');
      return [];
    }

    const commodities: CommodityPrice[] = [];
    
    // Load commodities from cleaned data (all folders in cleaned.json)
    for (const itemName of Object.keys(cleanedData)) {
      if (!itemName) continue;
      const displayName = sanitizeDisplayName(itemName);
      
      // Load latest price data from cleaned data
      const priceData = await loadLatestPrice(itemName);
      
      if (priceData) {
        // Forecast data is already loaded in loadLatestPrice
        commodities.push({
          ...priceData,
          displayName,
        });
      }
    }

    // Sort by category, then by name
    return commodities.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.displayName.localeCompare(b.displayName);
    });
  } catch (error) {
    console.error('Error loading commodities:', error);
    // Return empty array instead of crashing
    return [];
  }
}

// Get commodity detail with full history and forecast
export async function getCommodityDetail(commodityName: string): Promise<CommodityPrice | null> {
  const priceData = await loadLatestPrice(commodityName);
  if (!priceData) return null;

  // Forecast data is already loaded in loadLatestPrice
  return priceData;
}

// Group commodities by category
export function groupByCategory(commodities: CommodityPrice[]): Record<string, CommodityPrice[]> {
  return commodities.reduce((acc, commodity) => {
    if (!acc[commodity.category]) {
      acc[commodity.category] = [];
    }
    acc[commodity.category].push(commodity);
    return acc;
  }, {} as Record<string, CommodityPrice[]>);
}

