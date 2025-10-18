import AsyncStorage from '@react-native-async-storage/async-storage';
import FallbackMLService, { FallbackMLForecast } from './fallbackMLService';
import { MLPrediction } from './firebaseMLService';

export interface OfflineMLForecast {
  commodityName: string;
  category: string;
  type: string;
  specification: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  factors: string[];
  trend: 'up' | 'down' | 'stable';
  nextWeekForecast: number;
  nextMonthForecast: number;
  lastUpdated: string;
  recordId: string; // ID of the ML prediction record
}

class OfflineMLForecastsService {
  private static readonly ML_FORECASTS_KEY = 'ml_forecasts_cache';
  private static readonly LAST_ML_SYNC_KEY = 'ml_forecasts_last_sync';

  /**
   * Get ML forecasts from offline cache
   */
  static async getMLForecasts(): Promise<OfflineMLForecast[]> {
    try {
      // First try to get Firebase ML forecasts
      const cachedData = await AsyncStorage.getItem(this.ML_FORECASTS_KEY);
      if (cachedData) {
        const forecasts = JSON.parse(cachedData);
        console.log(`📱 Loaded ${forecasts.length} Firebase ML forecasts from offline cache`);
        return forecasts;
      }
      
      // Fallback to fallback ML forecasts
      const fallbackForecasts = await FallbackMLService.getForecastsFromCache();
      if (fallbackForecasts.length > 0) {
        const convertedForecasts = fallbackForecasts.map(this.convertFallbackToOffline);
        console.log(`📱 Loaded ${convertedForecasts.length} fallback ML forecasts from cache`);
        return convertedForecasts;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error getting ML forecasts from cache:', error);
      return [];
    }
  }

  /**
   * Save ML forecasts to offline cache
   */
  static async saveMLForecasts(forecasts: OfflineMLForecast[]): Promise<void> {
    try {
      if (!forecasts || !Array.isArray(forecasts)) {
        console.error('❌ Invalid forecasts data to save');
        return;
      }
      
      const forecastsKey = this.ML_FORECASTS_KEY;
      const syncKey = this.LAST_ML_SYNC_KEY;
      
      if (!forecastsKey || !syncKey) {
        console.error('❌ Cache keys are undefined');
        return;
      }
      
      const dataToSave = JSON.stringify(forecasts);
      if (!dataToSave) {
        console.error('❌ Failed to stringify forecasts data');
        return;
      }
      
      await AsyncStorage.setItem(forecastsKey, dataToSave);
      await AsyncStorage.setItem(syncKey, new Date().toISOString());
      console.log(`💾 Saved ${forecasts.length} ML forecasts to offline cache`);
    } catch (error) {
      console.error('❌ Error saving ML forecasts to cache:', error);
      throw error;
    }
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSyncTime(): Promise<string | null> {
    try {
      const syncKey = this.LAST_ML_SYNC_KEY;
      if (!syncKey) {
        console.error('❌ Sync key is undefined');
        return null;
      }
      
      return await AsyncStorage.getItem(syncKey);
    } catch (error) {
      console.error('❌ Error getting last ML sync time:', error);
      return null;
    }
  }

  /**
   * Convert Firebase ML prediction to offline format
   */
  static convertToOfflineFormat(mlPrediction: MLPrediction): OfflineMLForecast {
    return {
      commodityName: mlPrediction.commodityName,
      category: mlPrediction.category,
      type: mlPrediction.type,
      specification: mlPrediction.specification,
      currentPrice: mlPrediction.currentPrice,
      predictedPrice: mlPrediction.predictedPrice,
      confidence: mlPrediction.confidence,
      factors: mlPrediction.factors,
      trend: mlPrediction.trend,
      nextWeekForecast: mlPrediction.nextWeekForecast,
      nextMonthForecast: mlPrediction.nextMonthForecast,
      lastUpdated: mlPrediction.createdAt.toDate().toISOString(),
      recordId: `ml_${Date.now()}_${mlPrediction.commodityName.replace(/\s+/g, '_')}`
    };
  }

  /**
   * Update offline cache with new ML predictions
   */
  static async updateOfflineCacheWithMLPredictions(mlPredictions: MLPrediction[]): Promise<OfflineMLForecast[]> {
    try {
      console.log('🔄 Updating offline ML forecasts cache...');
      
      // Convert Firebase predictions to offline format
      const offlineForecasts = mlPredictions.map(prediction => 
        this.convertToOfflineFormat(prediction)
      );
      
      // Save to offline cache
      await this.saveMLForecasts(offlineForecasts);
      
      console.log(`✅ Updated offline cache with ${offlineForecasts.length} ML forecasts`);
      return offlineForecasts;
    } catch (error) {
      console.error('❌ Error updating offline ML cache:', error);
      return [];
    }
  }

  /**
   * Get ML forecast for a specific commodity
   */
  static async getMLForecastForCommodity(commodityName: string): Promise<OfflineMLForecast | null> {
    try {
      // First try Firebase ML forecasts
      const forecasts = await this.getMLForecasts();
      const firebaseForecast = forecasts.find(forecast => forecast.commodityName === commodityName);
      if (firebaseForecast) {
        return firebaseForecast;
      }
      
      // Fallback to fallback ML forecast
      const fallbackForecast = await FallbackMLService.getForecastForCommodity(commodityName);
      if (fallbackForecast) {
        return this.convertFallbackToOffline(fallbackForecast);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting ML forecast for commodity:', error);
      return null;
    }
  }

  /**
   * Convert fallback ML forecast to offline format
   */
  static convertFallbackToOffline(fallbackForecast: FallbackMLForecast): OfflineMLForecast {
    return {
      commodityName: fallbackForecast.commodityName,
      category: fallbackForecast.category,
      type: fallbackForecast.type,
      specification: fallbackForecast.specification,
      currentPrice: fallbackForecast.currentPrice,
      predictedPrice: fallbackForecast.predictedPrice,
      confidence: fallbackForecast.confidence,
      factors: fallbackForecast.factors,
      trend: fallbackForecast.trend,
      nextWeekForecast: fallbackForecast.nextWeekForecast,
      nextMonthForecast: fallbackForecast.nextMonthForecast,
      lastUpdated: fallbackForecast.lastUpdated,
      recordId: fallbackForecast.recordId
    };
  }

  /**
   * Check if ML forecasts are stale (older than 7 days)
   */
  static async areMLForecastsStale(): Promise<boolean> {
    try {
      const lastSync = await this.getLastSyncTime();
      if (!lastSync) return true;
      
      const lastSyncDate = new Date(lastSync);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      return lastSyncDate < sevenDaysAgo;
    } catch (error) {
      console.error('❌ Error checking ML forecasts staleness:', error);
      return true;
    }
  }

  /**
   * Clear ML forecasts cache
   */
  static async clearMLForecastsCache(): Promise<void> {
    try {
      const forecastsKey = this.ML_FORECASTS_KEY;
      const syncKey = this.LAST_ML_SYNC_KEY;
      
      if (!forecastsKey || !syncKey) {
        console.error('❌ Cache keys are undefined');
        return;
      }
      
      await AsyncStorage.removeItem(forecastsKey);
      await AsyncStorage.removeItem(syncKey);
      console.log('🗑️ Cleared ML forecasts cache');
    } catch (error) {
      console.error('❌ Error clearing ML forecasts cache:', error);
    }
  }
}

export default OfflineMLForecastsService;
