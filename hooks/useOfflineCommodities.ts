import { useEffect, useState } from 'react';
import { FirebaseCategory, FirebaseCommodity, FirebasePrice } from '../services/firebaseCommodityService';
import { OfflineCommodityService } from '../services/offlineCommodityService';

// Hook for getting commodities with offline-first strategy
export const useCommodities = () => {
  const [commodities, setCommodities] = useState<FirebaseCommodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await OfflineCommodityService.getCommodities();
        setCommodities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch commodities');
        console.error('Error fetching commodities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommodities();
  }, []);

  return { commodities, loading, error };
};

// Hook for getting categories with offline-first strategy
export const useCategories = () => {
  const [categories, setCategories] = useState<FirebaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await OfflineCommodityService.getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Hook for getting commodities with prices (offline-first)
export const useCommoditiesWithPrices = () => {
  const [data, setData] = useState<Array<FirebaseCommodity & { latestPrice?: FirebasePrice }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await OfflineCommodityService.getCommoditiesWithPrices();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch commodities with prices');
        console.error('Error fetching commodities with prices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

// Hook for manual refresh functionality
export const useDataRefresh = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshData = async (): Promise<{
    success: boolean;
    message: string;
    data?: {
      commodities: number;
      prices: number;
      categories: number;
    };
  }> => {
    try {
      setRefreshing(true);
      setError(null);

      console.log('🔄 Starting manual refresh...');
      const result = await OfflineCommodityService.refreshFromFirebase();

      if (result.success) {
        setLastRefresh(new Date());
        const message = `✅ Data refreshed successfully!\n\n📊 Updated:\n• ${result.commodities.length} commodities\n• ${result.prices.length} prices\n• ${result.categories.length} categories`;
        
        return {
          success: true,
          message,
          data: {
            commodities: result.commodities.length,
            prices: result.prices.length,
            categories: result.categories.length
          }
        };
      } else {
        const message = `❌ Failed to refresh data: ${result.error}`;
        setError(result.error);
        return {
          success: false,
          message
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error refreshing data:', err);
      
      return {
        success: false,
        message: `❌ Failed to refresh data: ${errorMessage}`
      };
    } finally {
      setRefreshing(false);
    }
  };

  return {
    refreshData,
    refreshing,
    error,
    lastRefresh
  };
};

// Hook for cache information
export const useCacheInfo = () => {
  const [cacheInfo, setCacheInfo] = useState<{
    hasCommodities: boolean;
    hasPrices: boolean;
    hasCategories: boolean;
    lastUpdated: string | null;
    isValid: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCacheInfo = async () => {
      try {
        setLoading(true);
        const info = await OfflineCommodityService.getCacheInfo();
        setCacheInfo(info);
      } catch (err) {
        console.error('Error fetching cache info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCacheInfo();
  }, []);

  const refreshCacheInfo = async () => {
    try {
      const info = await OfflineCommodityService.getCacheInfo();
      setCacheInfo(info);
    } catch (err) {
      console.error('Error refreshing cache info:', err);
    }
  };

  return {
    cacheInfo,
    loading,
    refreshCacheInfo
  };
};

// Hook for commodities with prices and refresh capability
export const useCommoditiesWithRefresh = () => {
  const [data, setData] = useState<Array<FirebaseCommodity & { latestPrice?: FirebasePrice }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await OfflineCommodityService.getCommoditiesWithPrices();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commodities with prices');
      console.error('Error fetching commodities with prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async (): Promise<boolean> => {
    try {
      setRefreshing(true);
      setError(null);

      const result = await OfflineCommodityService.refreshFromFirebase();
      
      if (result.success) {
        // Update the data with fresh data
        const priceMap = new Map<string, FirebasePrice>();
        result.prices.forEach(price => {
          priceMap.set(price.commodityId, price);
        });

        const updatedData = result.commodities.map(commodity => ({
          ...commodity,
          latestPrice: priceMap.get(commodity.id || '')
        }));

        setData(updatedData);
        return true;
      } else {
        setError(result.error || 'Failed to refresh data');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error refreshing data:', err);
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refreshing,
    refreshData,
    refetch: fetchData
  };
};

// Re-export Firebase management hooks for admin functions
export { useCommodityManagement, usePriceManagement } from './useFirebaseCommodities';

export default {
  useCommodities,
  useCategories,
  useCommoditiesWithPrices,
  useDataRefresh,
  useCacheInfo,
  useCommoditiesWithRefresh
};
