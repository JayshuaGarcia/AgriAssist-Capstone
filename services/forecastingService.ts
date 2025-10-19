import { PriceData } from '../types/PriceData';

export interface HistoricalPriceData {
  commodity: string;
  specification: string;
  prices: Array<{
    price: number;
    date: string;
    region: string;
  }>;
  averagePrice: number;
  priceVariance: number;
  trend: 'up' | 'down' | 'stable';
  seasonalPattern: number[];
}

export interface ForecastResult {
  date: string;
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  seasonalAdjustment: number;
  historicalDataPoints: number;
}

class ForecastingService {
  private historicalData: Map<string, HistoricalPriceData> = new Map();
  private dataFiles = [
    'extracted_pdf_data.json',
    'sept_30_extracted_data.json',
    'april_30_extracted_data.json',
    'oct_16_extracted_data.json',
    'oct_19_extracted_data.json'
  ];

  async loadHistoricalData(): Promise<void> {
    try {
      console.log('🔄 Loading historical data for forecasting...');
      
      let allData: PriceData[] = [];

      // Load all available data files
      for (const file of this.dataFiles) {
        try {
          const response = await fetch(`/data/${file}`);
          if (response.ok) {
            const data = await response.json();
            allData = [...allData, ...data];
            console.log(`✅ Loaded ${data.length} records from ${file}`);
          }
        } catch (error) {
          console.log(`⚠️ Could not load ${file}:`, error);
        }
      }

      // Process and aggregate data by commodity
      this.processHistoricalData(allData);
      console.log(`📊 Processed ${this.historicalData.size} unique commodities for forecasting`);
    } catch (error) {
      console.error('❌ Error loading historical data:', error);
    }
  }

  private processHistoricalData(data: PriceData[]): void {
    const commodityMap = new Map<string, PriceData[]>();

    // Group data by commodity and specification
    data.forEach(item => {
      const key = `${item.commodity.toLowerCase()}_${item.specification.toLowerCase()}`;
      if (!commodityMap.has(key)) {
        commodityMap.set(key, []);
      }
      commodityMap.get(key)!.push(item);
    });

    // Process each commodity group
    commodityMap.forEach((items, key) => {
      const [commodity, specification] = key.split('_');
      
      const prices = items.map(item => ({
        price: item.price,
        date: item.date,
        region: item.region
      }));

      const priceValues = prices.map(p => p.price);
      const averagePrice = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
      const priceVariance = this.calculateVariance(priceValues);
      const trend = this.calculateTrend(priceValues);
      const seasonalPattern = this.calculateSeasonalPattern(prices);

      this.historicalData.set(key, {
        commodity,
        specification,
        prices,
        averagePrice,
        priceVariance,
        trend,
        seasonalPattern
      });
    });
  }

  private calculateVariance(prices: number[]): number {
    if (prices.length < 2) return 0;
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  private calculateTrend(prices: number[]): 'up' | 'down' | 'stable' {
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

  private calculateSeasonalPattern(prices: Array<{ price: number; date: string }>): number[] {
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    prices.forEach(item => {
      const month = new Date(item.date).getMonth();
      monthlyAverages[month] += item.price;
      monthlyCounts[month]++;
    });

    return monthlyAverages.map((sum, index) => 
      monthlyCounts[index] > 0 ? sum / monthlyCounts[index] : 0
    );
  }

  generateForecast(
    commodity: string,
    specification: string,
    targetDate: string,
    currentPrice?: number
  ): ForecastResult {
    const key = `${commodity.toLowerCase()}_${specification.toLowerCase()}`;
    const historicalData = this.historicalData.get(key);

    if (!historicalData) {
      // Fallback forecast for commodities without historical data
      return this.generateFallbackForecast(commodity, specification, targetDate, currentPrice || 0);
    }

    // Calculate forecast based on historical data
    const daysFromNow = this.getDaysDifference(new Date().toISOString().split('T')[0], targetDate);
    const seasonalAdjustment = this.getSeasonalAdjustment(commodity, targetDate, historicalData.seasonalPattern);
    const timeAdjustment = this.getTimeAdjustment(daysFromNow, historicalData.trend);
    
    // Base price from historical average or current price
    const basePrice = currentPrice || historicalData.averagePrice;
    const predictedPrice = basePrice * (1 + seasonalAdjustment + timeAdjustment);
    
    // Calculate confidence based on data quality
    const confidence = Math.min(95, Math.max(60, 100 - (historicalData.priceVariance / historicalData.averagePrice) * 100));
    
    // Generate factors
    const factors = this.generateFactors(commodity, seasonalAdjustment, historicalData.trend, daysFromNow, historicalData.prices.length);

    return {
      date: targetDate,
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      confidence: Math.round(confidence),
      trend: historicalData.trend,
      factors,
      seasonalAdjustment: Math.round(seasonalAdjustment * 100),
      historicalDataPoints: historicalData.prices.length
    };
  }

  private generateFallbackForecast(
    commodity: string,
    specification: string,
    targetDate: string,
    currentPrice: number
  ): ForecastResult {
    const daysFromNow = this.getDaysDifference(new Date().toISOString().split('T')[0], targetDate);
    const seasonalAdjustment = this.getSeasonalAdjustment(commodity, targetDate);
    
    // Base price adjustments
    let priceChange = 0;
    if (daysFromNow <= 7) priceChange = 0.02; // 2% weekly
    else if (daysFromNow <= 30) priceChange = 0.08; // 8% monthly
    else if (daysFromNow <= 90) priceChange = 0.15; // 15% quarterly
    
    const predictedPrice = currentPrice * (1 + priceChange + seasonalAdjustment);
    
    return {
      date: targetDate,
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      confidence: 70, // Lower confidence for fallback
      trend: priceChange > 0 ? 'up' : 'down',
      factors: this.generateFactors(commodity, seasonalAdjustment, 'up', daysFromNow, 0),
      seasonalAdjustment: Math.round(seasonalAdjustment * 100),
      historicalDataPoints: 0
    };
  }

  private getSeasonalAdjustment(commodity: string, targetDate: string, seasonalPattern?: number[]): number {
    const month = new Date(targetDate).getMonth() + 1;
    const commodityLower = commodity.toLowerCase();
    
    // Use historical seasonal pattern if available
    if (seasonalPattern && seasonalPattern[month - 1] > 0) {
      const avgPrice = seasonalPattern.reduce((sum, price) => sum + price, 0) / seasonalPattern.filter(p => p > 0).length;
      return (seasonalPattern[month - 1] - avgPrice) / avgPrice;
    }
    
    // Fallback to commodity-specific patterns
    if (commodityLower.includes('rice')) {
      if (month >= 6 && month <= 8) return 0.05; // 5% increase
      if (month >= 11 || month <= 1) return 0.03; // 3% increase
      return -0.02; // 2% decrease
    }
    
    if (commodityLower.includes('corn')) {
      if (month >= 4 && month <= 6) return 0.06; // 6% increase
      if (month >= 9 && month <= 11) return 0.04; // 4% increase
      return -0.01; // 1% decrease
    }
    
    if (commodityLower.includes('fish') || commodityLower.includes('seafood')) {
      if (month >= 6 && month <= 11) return 0.08; // 8% increase
      return -0.03; // 3% decrease
    }
    
    if (commodityLower.includes('vegetable') || commodityLower.includes('fruit')) {
      if (month >= 6 && month <= 10) return 0.07; // 7% increase
      return -0.02; // 2% decrease
    }
    
    if (commodityLower.includes('meat') || commodityLower.includes('pork') || commodityLower.includes('beef')) {
      if (month === 12 || month === 4) return 0.06; // 6% increase
      if (month >= 6 && month <= 11) return 0.04; // 4% increase
      return 0.01; // 1% increase
    }
    
    // Default: slight seasonal variation
    return Math.sin((month - 1) * Math.PI / 6) * 0.02;
  }

  private getTimeAdjustment(daysFromNow: number, trend: 'up' | 'down' | 'stable'): number {
    const weeklyRate = 0.01; // 1% per week
    const weeks = daysFromNow / 7;
    
    switch (trend) {
      case 'up':
        return weeks * weeklyRate;
      case 'down':
        return -weeks * weeklyRate * 0.5;
      default:
        return weeks * weeklyRate * 0.3;
    }
  }

  private generateFactors(
    commodity: string,
    seasonalAdjustment: number,
    trend: 'up' | 'down' | 'stable',
    daysFromNow: number,
    dataPoints: number
  ): string[] {
    const factors: string[] = [];
    
    if (dataPoints > 0) {
      factors.push(`Based on ${dataPoints} historical data points`);
    } else {
      factors.push('Limited historical data available');
    }
    
    if (seasonalAdjustment > 0.03) {
      factors.push('Seasonal demand increase');
    } else if (seasonalAdjustment < -0.02) {
      factors.push('Seasonal supply increase');
    }
    
    if (trend === 'up') {
      factors.push('Upward price trend');
    } else if (trend === 'down') {
      factors.push('Downward price trend');
    }
    
    if (daysFromNow > 30) {
      factors.push('Long-term market volatility');
    }
    
    // Commodity-specific factors
    const commodityLower = commodity.toLowerCase();
    if (commodityLower.includes('rice')) {
      factors.push('Government rice program impact');
      factors.push('Import/export policies');
    }
    if (commodityLower.includes('fish')) {
      factors.push('Weather and fishing conditions');
    }
    if (commodityLower.includes('vegetable')) {
      factors.push('Weather and harvest conditions');
    }
    
    return factors.slice(0, 4); // Limit to 4 factors
  }

  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  getHistoricalDataForCommodity(commodity: string, specification: string): HistoricalPriceData | null {
    const key = `${commodity.toLowerCase()}_${specification.toLowerCase()}`;
    return this.historicalData.get(key) || null;
  }

  getAllCommodities(): string[] {
    return Array.from(this.historicalData.keys()).map(key => key.split('_')[0]);
  }
}

export const forecastingService = new ForecastingService();
