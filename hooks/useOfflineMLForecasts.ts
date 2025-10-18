import { useCallback, useEffect, useState } from 'react';
import FallbackMLService from '../services/fallbackMLService';
import { FirebaseMLService } from '../services/firebaseMLService';
import OfflineMLForecastsService, { OfflineMLForecast } from '../services/offlineMLForecastsService';

export const useOfflineMLForecasts = () => {
  const [forecasts, setForecasts] = useState<OfflineMLForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load forecasts from offline cache
  const loadForecasts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cachedForecasts = await OfflineMLForecastsService.getMLForecasts();
      setForecasts(cachedForecasts);
      
      console.log(`📱 Loaded ${cachedForecasts.length} ML forecasts from offline cache`);
    } catch (err) {
      console.error('❌ Error loading ML forecasts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ML forecasts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh ML forecasts from Firebase or fallback
  const refreshMLForecasts = useCallback(async (): Promise<{
    success: boolean;
    message: string;
    forecasts?: OfflineMLForecast[];
  }> => {
    try {
      setRefreshing(true);
      setError(null);
      
      console.log('🤖 Refreshing ML forecasts...');
      
      // Skip Firebase ML (offline-first mode)
      console.log('📱 Using offline-first mode - skipping Firebase ML');
      
      // Fallback to local ML system
      console.log('🔄 Using fallback ML system with existing data...');
      const fallbackForecasts = await FallbackMLService.generateForecastsFromExistingData();
      
      if (fallbackForecasts.length === 0) {
        return {
          success: false,
          message: '⚠️ No price data available for ML forecasting. Please add some price data first.'
        };
      }
      
      // Convert fallback forecasts to offline format
      const offlineForecasts = fallbackForecasts.map(fallback => 
        OfflineMLForecastsService.convertFallbackToOffline(fallback)
      );
      
      // Update local state
      setForecasts(offlineForecasts);
      
      const message = `✅ Generated ${fallbackForecasts.length} ML predictions using existing data!\n\n📊 Predictions include:\n• Next week forecasts\n• Confidence scores\n• Trend analysis\n• Market factors\n\n💡 Using fallback ML system with your price data`;
      
      return {
        success: true,
        message,
        forecasts: offlineForecasts
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error refreshing ML forecasts:', err);
      
      return {
        success: false,
        message: `❌ Failed to refresh ML forecasts: ${errorMessage}`
      };
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Get forecast for specific commodity
  const getForecastForCommodity = useCallback(async (commodityName: string): Promise<OfflineMLForecast | null> => {
    try {
      return await OfflineMLForecastsService.getMLForecastForCommodity(commodityName);
    } catch (err) {
      console.error('❌ Error getting forecast for commodity:', err);
      return null;
    }
  }, []);

  // Check if forecasts are stale
  const checkIfStale = useCallback(async (): Promise<boolean> => {
    try {
      return await OfflineMLForecastsService.areMLForecastsStale();
    } catch (err) {
      console.error('❌ Error checking if forecasts are stale:', err);
      return true;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await OfflineMLForecastsService.clearMLForecastsCache();
      setForecasts([]);
      console.log('🗑️ Cleared ML forecasts cache');
    } catch (err) {
      console.error('❌ Error clearing ML forecasts cache:', err);
    }
  }, []);

  // Load forecasts on mount
  useEffect(() => {
    loadForecasts();
  }, [loadForecasts]);

  // Admin-triggered Firebase ML refresh
  const refreshFirebaseMLForecasts = useCallback(async (): Promise<{
    success: boolean;
    message: string;
    forecasts?: OfflineMLForecast[];
  }> => {
    try {
      setRefreshing(true);
      setError(null);
      
      console.log('🤖 Admin triggered Firebase ML refresh...');
      
      // Use Firebase ML (admin-triggered)
      const mlPredictions = await FirebaseMLService.runFirebaseMLPredictionForAllCommodities();
      
      if (mlPredictions.length > 0) {
        // Update offline cache with Firebase predictions
        const offlineForecasts = await OfflineMLForecastsService.updateOfflineCacheWithMLPredictions(mlPredictions);
        
        // Update local state
        setForecasts(offlineForecasts);
        
        const message = `✅ Generated ${mlPredictions.length} Firebase ML predictions!\n\n📊 Predictions include:\n• Next week forecasts\n• Confidence scores\n• Trend analysis\n• Market factors`;
        
        return {
          success: true,
          message,
          forecasts: offlineForecasts
        };
      } else {
        return {
          success: false,
          message: '❌ No Firebase ML predictions generated. Please add more price data first.',
          forecasts: []
        };
      }
    } catch (error) {
      console.error('❌ Error refreshing Firebase ML forecasts:', error);
      setError('Failed to refresh Firebase ML forecasts');
      return {
        success: false,
        message: '❌ Failed to refresh Firebase ML forecasts. Please try again.',
        forecasts: []
      };
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    forecasts,
    loading,
    error,
    refreshing,
    loadForecasts,
    refreshMLForecasts,
    refreshFirebaseMLForecasts,
    getForecastForCommodity,
    checkIfStale,
    clearCache
  };
};

export default useOfflineMLForecasts;
