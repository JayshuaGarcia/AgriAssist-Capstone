import { useCallback, useEffect, useState } from 'react';
import { COMMODITY_DATA } from '../constants/CommodityData';
import { realDAPriceService } from '../lib/realDAPriceService';

interface RealDAPrice {
  commodityId: string;
  currentPrice: number;
  priceDate: string;
  source: string;
  specification?: string;
  isRealData: boolean;
}

interface UseLatestPricesReturn {
  latestPrices: RealDAPrice[];
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
  getLatestPriceForCommodity: (commodityName: string) => RealDAPrice | null;
}

export const useLatestPrices = (): UseLatestPricesReturn => {
  const [latestPrices, setLatestPrices] = useState<RealDAPrice[]>([]);
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
      
      console.log('🌐 REAL DA DATA: Loading fresh prices from DA Philippines...');
      const prices = await realDAPriceService.getCurrentPrices(COMMODITY_DATA);
      setLatestPrices(prices);
      
      console.log(`✅ Loaded ${prices.length} REAL DA prices from website`);
    } catch (err) {
      console.error('❌ Error loading real DA prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load real DA prices');
    } finally {
      setLoading(false);
    }
  };

  const refreshLatestPrices = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      console.log('🌐 REAL DA DATA: Refreshing fresh prices from DA Philippines...');
      const prices = await realDAPriceService.getCurrentPrices(COMMODITY_DATA);
      setLatestPrices(prices);
      
      console.log(`✅ Refreshed ${prices.length} REAL DA prices from website`);
    } catch (err) {
      console.error('❌ Error refreshing real DA prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh real DA prices');
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
      
      // For now, just refresh the real DA data instead of adding manual prices
      // This ensures we always have the latest real data
      console.log('🔄 Refreshing real DA data instead of adding manual price...');
      await refreshLatestPrices();
      
      return {
        success: true,
        message: 'Real DA data refreshed successfully'
      };
    } catch (err) {
      console.error('❌ Error refreshing real DA data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh real DA data';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [refreshLatestPrices]);

  const getLatestPriceForCommodity = useCallback((commodityName: string): RealDAPrice | null => {
    // Find by commodity name in the COMMODITY_DATA
    const commodity = COMMODITY_DATA.find(c => c.name === commodityName);
    if (!commodity) return null;
    
    return latestPrices.find(price => price.commodityId === commodity.id) || null;
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
