import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Interface for price history data
export interface PriceHistoryRecord {
  id?: string;
  commodityName: string;
  category: string;
  type: string;
  specification: string;
  price: number;
  unit: string;
  date: string; // ISO date string
  source: string; // 'manual', 'api', 'ml_forecast'
  confidence?: number; // 0-100 for ML predictions
  factors?: string[]; // factors that influenced the prediction
  createdAt: any; // Firebase Timestamp or Date
}

// Interface for ML training data
export interface MLTrainingData {
  commodityName: string;
  category: string;
  type: string;
  specification: string;
  historicalPrices: {
    price: number;
    date: string;
    weekOfYear: number;
    month: number;
    season: string;
  }[];
  features: {
    averagePrice: number;
    priceVolatility: number;
    seasonalFactor: number;
    trendDirection: 'up' | 'down' | 'stable';
    marketDemand: number; // 0-1 scale
  };
}

// Interface for ML prediction result
export interface MLPrediction {
  commodityName: string;
  category: string;
  type: string;
  specification: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number; // 0-100
  factors: string[];
  trend: 'up' | 'down' | 'stable';
  nextWeekForecast: number;
  nextMonthForecast: number;
  createdAt: Timestamp;
}

export class FirebaseMLService {
  
  // Collection names
  private static readonly PRICE_HISTORY_COLLECTION = 'priceRecords';
  private static readonly ML_PREDICTIONS_COLLECTION = 'ml_predictions';
  private static readonly ML_TRAINING_COLLECTION = 'ml_training_data';

  // Add price history record
  static async addPriceHistory(record: Omit<PriceHistoryRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.PRICE_HISTORY_COLLECTION), {
        ...record,
        createdAt: Timestamp.now()
      });
      console.log('✅ Price history added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding price history:', error);
      throw error;
    }
  }

  // Get price history for a specific commodity
  static async getPriceHistory(
    commodityName: string, 
    limitCount: number = 30
  ): Promise<PriceHistoryRecord[]> {
    try {
      console.log('📊 Firebase ML Service: getPriceHistory called - returning empty array (offline-first mode)');
      // Return empty array to force offline-first behavior
      // Firebase will only be used when admin explicitly triggers it
      return [];
    } catch (error) {
      console.error('❌ Error getting price history:', error);
      return [];
    }
  }

  // Get all price history for ML training
  static async getAllPriceHistory(): Promise<PriceHistoryRecord[]> {
    try {
      console.log('📊 Firebase ML Service: getAllPriceHistory called - returning empty array (offline-first mode)');
      // Return empty array to force offline-first behavior
      // Firebase will only be used when admin explicitly triggers it
      return [];
    } catch (error) {
      console.error('❌ Error getting all price history:', error);
      return [];
    }
  }

  // Prepare training data for ML
  static prepareTrainingData(priceHistory: PriceHistoryRecord[]): MLTrainingData[] {
    const commodityGroups = new Map<string, PriceHistoryRecord[]>();
    
    // Group by commodity
    priceHistory.forEach(record => {
      const key = `${record.commodityName}-${record.type}-${record.specification}`;
      if (!commodityGroups.has(key)) {
        commodityGroups.set(key, []);
      }
      commodityGroups.get(key)!.push(record);
    });

    const trainingData: MLTrainingData[] = [];

    commodityGroups.forEach((records, key) => {
      if (records.length < 5) return; // Need at least 5 records for meaningful training

      const sortedRecords = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const prices = sortedRecords.map(r => r.price);
      
      // Calculate features
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const priceVolatility = this.calculateVolatility(prices);
      const trendDirection = this.calculateTrend(prices);
      const seasonalFactor = this.calculateSeasonalFactor(sortedRecords);
      const marketDemand = this.estimateMarketDemand(records[0].category);

      // Prepare historical prices with features
      const historicalPrices = sortedRecords.map(record => {
        const date = new Date(record.date);
        return {
          price: record.price,
          date: record.date,
          weekOfYear: this.getWeekOfYear(date),
          month: date.getMonth() + 1,
          season: this.getSeason(date)
        };
      });

      trainingData.push({
        commodityName: records[0].commodityName,
        category: records[0].category,
        type: records[0].type,
        specification: records[0].specification,
        historicalPrices,
        features: {
          averagePrice,
          priceVolatility,
          seasonalFactor,
          trendDirection,
          marketDemand
        }
      });
    });

    console.log(`🤖 Prepared training data for ${trainingData.length} commodities`);
    return trainingData;
  }

  // Enhanced ML prediction algorithm with better accuracy
  static predictPrice(trainingData: MLTrainingData): MLPrediction {
    const { historicalPrices, features } = trainingData;
    
    if (historicalPrices.length < 3) {
      throw new Error('Insufficient data for prediction');
    }

    // Get recent prices (use more data points for better accuracy)
    const recentPrices = historicalPrices.slice(-Math.min(10, historicalPrices.length)).map(h => h.price);
    const currentPrice = recentPrices[recentPrices.length - 1];
    
    // Calculate weighted moving average (more weight to recent prices)
    let weightedSum = 0;
    let weightSum = 0;
    recentPrices.forEach((price, index) => {
      const weight = index + 1; // More weight to recent prices
      weightedSum += price * weight;
      weightSum += weight;
    });
    const weightedMovingAverage = weightedSum / weightSum;
    
    // Enhanced trend calculation
    const priceChanges = [];
    for (let i = 1; i < recentPrices.length; i++) {
      priceChanges.push((recentPrices[i] - recentPrices[i-1]) / recentPrices[i-1]);
    }
    const avgPriceChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    
    // Calculate trend factor based on actual price changes
    let trendFactor = 1.0;
    if (avgPriceChange > 0.02) trendFactor = 1.03; // Strong upward trend
    else if (avgPriceChange > 0.01) trendFactor = 1.015; // Moderate upward trend
    else if (avgPriceChange < -0.02) trendFactor = 0.97; // Strong downward trend
    else if (avgPriceChange < -0.01) trendFactor = 0.985; // Moderate downward trend
    
    // Enhanced seasonal adjustment
    const seasonalAdjustment = 1 + (features.seasonalFactor * 0.15);
    
    // Market demand adjustment
    const demandAdjustment = 1 + (features.marketDemand * 0.08);
    
    // Volatility adjustment (higher volatility = more uncertainty)
    const volatilityAdjustment = 1 + (features.priceVolatility * 0.05);
    
    // Calculate predictions with enhanced algorithm
    const basePrediction = weightedMovingAverage * trendFactor * seasonalAdjustment * demandAdjustment * volatilityAdjustment;
    const nextWeekForecast = basePrediction;
    const nextMonthForecast = basePrediction * (1 + (avgPriceChange * 2)); // Extrapolate trend
    
    // Enhanced confidence calculation
    let confidence = 85; // Base confidence
    
    // Adjust confidence based on data quality
    if (historicalPrices.length >= 20) confidence += 10; // More data = higher confidence
    else if (historicalPrices.length >= 10) confidence += 5;
    else confidence -= 10; // Less data = lower confidence
    
    // Adjust confidence based on volatility
    if (features.priceVolatility < 0.1) confidence += 5; // Low volatility = higher confidence
    else if (features.priceVolatility > 0.3) confidence -= 10; // High volatility = lower confidence
    
    // Adjust confidence based on trend consistency
    const trendConsistency = Math.abs(avgPriceChange);
    if (trendConsistency < 0.01) confidence += 5; // Stable trend = higher confidence
    else if (trendConsistency > 0.05) confidence -= 5; // Volatile trend = lower confidence
    
    confidence = Math.min(95, Math.max(60, confidence));
    
    // Enhanced factors determination
    const factors: string[] = [];
    if (avgPriceChange > 0.02) factors.push('Strong upward trend');
    else if (avgPriceChange > 0.01) factors.push('Moderate upward trend');
    else if (avgPriceChange < -0.02) factors.push('Strong downward trend');
    else if (avgPriceChange < -0.01) factors.push('Moderate downward trend');
    else factors.push('Stable price trend');
    
    if (features.seasonalFactor > 0.3) factors.push('Seasonal demand patterns');
    if (features.marketDemand > 0.7) factors.push('High market demand');
    if (features.priceVolatility > 0.2) factors.push('Price volatility detected');
    if (historicalPrices.length >= 20) factors.push('Extensive historical data');
    
    // Determine trend direction
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (avgPriceChange > 0.01) trend = 'up';
    else if (avgPriceChange < -0.01) trend = 'down';
    
    return {
      commodityName: trainingData.commodityName,
      category: trainingData.category,
      type: trainingData.type,
      specification: trainingData.specification,
      currentPrice,
      predictedPrice: nextWeekForecast,
      confidence: Math.round(confidence),
      factors,
      trend,
      nextWeekForecast: Math.round(nextWeekForecast * 100) / 100,
      nextMonthForecast: Math.round(nextMonthForecast * 100) / 100,
      createdAt: Timestamp.now()
    };
  }

  // Save ML prediction
  static async saveMLPrediction(prediction: Omit<MLPrediction, 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.ML_PREDICTIONS_COLLECTION), {
        ...prediction,
        createdAt: Timestamp.now()
      });
      console.log('✅ ML prediction saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving ML prediction:', error);
      throw error;
    }
  }

  // Get latest ML predictions
  static async getLatestMLPredictions(): Promise<MLPrediction[]> {
    try {
      const q = query(
        collection(db, this.ML_PREDICTIONS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const predictions: MLPrediction[] = [];
      
      querySnapshot.forEach((doc) => {
        predictions.push({
          ...doc.data()
        } as MLPrediction);
      });
      
      console.log(`🤖 Retrieved ${predictions.length} ML predictions`);
      return predictions;
    } catch (error) {
      console.error('❌ Error getting ML predictions:', error);
      return [];
    }
  }

  // Run ML prediction for all commodities (offline-first mode - returns empty)
  static async runMLPredictionForAllCommodities(): Promise<MLPrediction[]> {
    try {
      console.log('🤖 Firebase ML Service: runMLPredictionForAllCommodities called - returning empty array (offline-first mode)');
      // Return empty array to force offline-first behavior
      // Firebase ML will only be used when admin explicitly triggers it
      return [];
    } catch (error) {
      console.error('❌ Error running ML prediction:', error);
      return [];
    }
  }

  // Admin-triggered Firebase ML prediction (only called when admin presses button)
  static async runFirebaseMLPredictionForAllCommodities(): Promise<MLPrediction[]> {
    try {
      console.log('🤖 Admin triggered Firebase ML prediction for all commodities...');
      
      // Get all price history from Firebase
      const q = query(collection(db, this.PRICE_HISTORY_COLLECTION));
      const querySnapshot = await getDocs(q);
      const records: PriceHistoryRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        } as PriceHistoryRecord);
      });
      
      // Sort in memory by date (descending)
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (records.length === 0) {
        console.log('⚠️ No price history found in Firebase. Please add some price data first.');
        return [];
      }
      
      // Prepare training data
      const trainingData = this.prepareTrainingData(records);
      
      if (trainingData.length === 0) {
        console.log('⚠️ No training data prepared. Need more price history.');
        return [];
      }
      
      // Generate predictions
      const predictions: MLPrediction[] = [];
      
      for (const data of trainingData) {
        try {
          const prediction = this.predictPrice(data);
          predictions.push(prediction);
          
          // Save prediction to Firebase
          await this.saveMLPrediction(prediction);
        } catch (error) {
          console.error(`❌ Error predicting for ${data.commodityName}:`, error);
        }
      }
      
      console.log(`✅ Generated ${predictions.length} Firebase ML predictions`);
      return predictions;
    } catch (error) {
      console.error('❌ Error running Firebase ML prediction:', error);
      return [];
    }
  }

  // Helper methods
  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private static calculateTrend(prices: number[]): 'up' | 'down' | 'stable' {
    if (prices.length < 2) return 'stable';
    
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, price) => sum + price, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, price) => sum + price, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
  }

  private static calculateSeasonalFactor(records: PriceHistoryRecord[]): number {
    // Simple seasonal factor based on month
    const currentMonth = new Date().getMonth() + 1;
    
    // Define seasonal patterns (0-1 scale)
    const seasonalPatterns: { [key: string]: number[] } = {
      'BEEF MEAT PRODUCTS': [0.8, 0.9, 1.0, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.0],
      'FRUITS': [0.7, 0.8, 1.0, 1.2, 1.3, 1.1, 0.9, 0.8, 0.9, 1.0, 0.8, 0.7],
      'VEGETABLES': [1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.9, 1.0, 1.1],
      'RICE': [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    };
    
    const category = records[0]?.category || 'RICE';
    const pattern = seasonalPatterns[category] || seasonalPatterns['RICE'];
    
    return (pattern[currentMonth - 1] - 1) * 0.5; // Convert to -0.5 to 0.5 range
  }

  private static estimateMarketDemand(category: string): number {
    // Simple demand estimation based on category
    const demandFactors: { [key: string]: number } = {
      'BEEF MEAT PRODUCTS': 0.8,
      'PORK MEAT PRODUCTS': 0.9,
      'POULTRY PRODUCTS': 0.9,
      'FISH PRODUCTS': 0.7,
      'FRUITS': 0.6,
      'VEGETABLES': 0.8,
      'RICE': 1.0,
      'SPICES': 0.5
    };
    
    return demandFactors[category] || 0.7;
  }

  private static getWeekOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.ceil((diff / (1000 * 60 * 60 * 24) + 1) / 7);
  }

  private static getSeason(date: Date): string {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }
}

export default FirebaseMLService;
