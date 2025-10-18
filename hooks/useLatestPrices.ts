import { useCallback, useEffect, useState } from 'react';
import OfflineLatestPricesService, { LatestPrice } from '../services/offlineLatestPricesService';

interface UseLatestPricesReturn {
  latestPrices: LatestPrice[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshLatestPrices: () => Promise<void>;
  addOrUpdatePrice: (priceData: {
    commodityName: string;
    price: number;
    date: string;
    category: string;
    unit: string;
    type: string;
    specification: string;
  }) => Promise<{ success: boolean; message: string }>;
  getLatestPriceForCommodity: (commodityName: string) => LatestPrice | null;
}

export const useLatestPrices = (): UseLatestPricesReturn => {
  const [latestPrices, setLatestPrices] = useState<LatestPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load latest prices on mount
  useEffect(() => {
    loadLatestPrices();
  }, []);

  const loadLatestPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const prices = await OfflineLatestPricesService.initializeCache();
      setLatestPrices(prices);
      
      console.log(`📱 Loaded ${prices.length} latest prices from cache`);
    } catch (err) {
      console.error('❌ Error loading latest prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load latest prices');
    } finally {
      setLoading(false);
    }
  };

  const refreshLatestPrices = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Just reload from offline cache - no Firebase fetching
      const prices = await OfflineLatestPricesService.getLatestPrices();
      setLatestPrices(prices);
      
      console.log(`🔄 Reloaded ${prices.length} latest prices from offline cache`);
    } catch (err) {
      console.error('❌ Error reloading latest prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to reload latest prices');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addOrUpdatePrice = useCallback(async (priceData: {
    commodityName: string;
    price: number;
    date: string;
    category: string;
    unit: string;
    type: string;
    specification: string;
  }) => {
    try {
      setError(null);
      
      const result = await OfflineLatestPricesService.addOrUpdatePriceRecord(priceData);
      
      if (result.success && result.latestPrices) {
        setLatestPrices(result.latestPrices);
        console.log('✅ Price added/updated and cache refreshed');
      }
      
      return {
        success: result.success,
        message: result.message
      };
    } catch (err) {
      console.error('❌ Error adding/updating price:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add/update price';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  const getLatestPriceForCommodity = useCallback((commodityName: string): LatestPrice | null => {
    return latestPrices.find(price => price.commodityName === commodityName) || null;
  }, [latestPrices]);

  return {
    latestPrices,
    loading,
    refreshing,
    error,
    refreshLatestPrices,
    addOrUpdatePrice,
    getLatestPriceForCommodity
  };
};
