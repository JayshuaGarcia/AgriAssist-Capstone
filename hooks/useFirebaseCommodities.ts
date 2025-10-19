import { useEffect, useState } from 'react';
import {
    FirebaseCategory,
    FirebaseCategoryService,
    FirebaseCommodity,
    FirebaseCommodityService,
    FirebasePrice,
    FirebasePriceMonitoringService,
    FirebasePriceService
} from '../services/firebaseCommodityService';

// Hook for getting all commodities
export const useCommodities = () => {
  const [commodities, setCommodities] = useState<FirebaseCommodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await FirebaseCommodityService.getAllCommodities();
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

// Hook for getting commodities by category
export const useCommoditiesByCategory = (category: string) => {
  const [commodities, setCommodities] = useState<FirebaseCommodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setCommodities([]);
      setLoading(false);
      return;
    }

    const fetchCommodities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await FirebaseCommodityService.getCommoditiesByCategory(category);
        setCommodities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch commodities');
        console.error('Error fetching commodities by category:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommodities();
  }, [category]);

  return { commodities, loading, error };
};

// Hook for getting commodities with latest prices
export const useCommoditiesWithPrices = () => {
  const [data, setData] = useState<Array<FirebaseCommodity & { latestPrice?: FirebasePrice }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await FirebasePriceMonitoringService.getCommoditiesWithPrices();
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

// Hook for real-time commodities with prices
export const useRealtimeCommoditiesWithPrices = () => {
  const [data, setData] = useState<Array<FirebaseCommodity & { latestPrice?: FirebasePrice }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      try {
        setLoading(true);
        setError(null);
        
        unsubscribe = FirebasePriceMonitoringService.subscribeToCommoditiesWithPrices((result) => {
          setData(result);
          setLoading(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup real-time subscription');
        console.error('Error setting up real-time subscription:', err);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { data, loading, error };
};

// Hook for getting categories
export const useCategories = () => {
  const [categories, setCategories] = useState<FirebaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await FirebaseCategoryService.getAllCategories();
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

// Hook for getting latest prices
export const useLatestPrices = () => {
  const [prices, setPrices] = useState<FirebasePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await FirebasePriceService.getLatestPrices();
        setPrices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch latest prices');
        console.error('Error fetching latest prices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  return { prices, loading, error };
};

// Hook for real-time latest prices
export const useRealtimeLatestPrices = () => {
  const [prices, setPrices] = useState<FirebasePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      try {
        setLoading(true);
        setError(null);
        
        unsubscribe = FirebasePriceService.subscribeToLatestPrices((result) => {
          setPrices(result);
          setLoading(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup real-time price subscription');
        console.error('Error setting up real-time price subscription:', err);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { prices, loading, error };
};

// Hook for getting price history
export const usePriceHistory = (commodityId: string, limitCount: number = 30) => {
  const [prices, setPrices] = useState<FirebasePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!commodityId) {
      setPrices([]);
      setLoading(false);
      return;
    }

    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await FirebasePriceService.getPriceHistory(commodityId, limitCount);
        setPrices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch price history');
        console.error('Error fetching price history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [commodityId, limitCount]);

  return { prices, loading, error };
};

// Hook for commodity management (admin functions)
export const useCommodityManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCommodity = async (commodity: Omit<FirebaseCommodity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const id = await FirebaseCommodityService.addCommodity(commodity);
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add commodity';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCommodity = async (id: string, updates: Partial<FirebaseCommodity>) => {
    try {
      setLoading(true);
      setError(null);
      await FirebaseCommodityService.updateCommodity(id, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update commodity';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCommodity = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await FirebaseCommodityService.deleteCommodity(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete commodity';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addCommodity,
    updateCommodity,
    deleteCommodity,
    loading,
    error
  };
};

// Hook for price management (admin functions)
export const usePriceManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPrice = async (price: Omit<FirebasePrice, 'id' | 'createdAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const id = await FirebasePriceService.addPrice(price);
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add price';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkImportPrices = async (prices: Omit<FirebasePrice, 'id' | 'createdAt'>[]) => {
    try {
      setLoading(true);
      setError(null);
      await FirebasePriceService.bulkImportPrices(prices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk import prices';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addPrice,
    bulkImportPrices,
    loading,
    error
  };
};

export default {
  useCommodities,
  useCommoditiesByCategory,
  useCommoditiesWithPrices,
  useRealtimeCommoditiesWithPrices,
  useCategories,
  useLatestPrices,
  useRealtimeLatestPrices,
  usePriceHistory,
  useCommodityManagement,
  usePriceManagement
};





