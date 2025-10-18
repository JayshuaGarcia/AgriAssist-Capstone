import { COMMODITY_DATA, Commodity } from '../constants/CommodityData';
import { getLatestPriceData, getPriceTrends } from './storageUtils';

export interface PriceMonitoringData {
  commodityId: string;
  currentPrice: number;
  priceDate: string;
  source: string;
  trend?: {
    previousPrice?: number;
    change?: number;
    changePercentage?: number;
  };
}

/**
 * Price Monitoring Service
 * Integrates stored price data with the existing price monitoring system
 */
class PriceMonitoringService {
  
  /**
   * Get current prices for all commodities using the latest stored data
   */
  async getCurrentPrices(): Promise<PriceMonitoringData[]> {
    try {
      console.log('📊 Getting current prices from stored data...');
      
      const latestPriceData = await getLatestPriceData();
      console.log('🔍 DEBUG: latestPriceData:', latestPriceData ? latestPriceData.length : 'null');
      
      if (!latestPriceData) {
        console.log('⚠️ No price data found in storage, returning empty array');
        return [];
      }

      console.log(`📊 Found ${latestPriceData.length} price records in storage`);
      console.log('📊 Sample data:', latestPriceData.slice(0, 3));
      console.log(`📊 Processing ${COMMODITY_DATA.length} commodities...`);
      console.log('🔍 DEBUG: First commodity to match:', COMMODITY_DATA[0]);
      console.log('🔍 DEBUG: First price data to match against:', latestPriceData[0]);

      const priceMonitoringData: PriceMonitoringData[] = [];
      
      // Map stored price data to commodity data
      for (const commodity of COMMODITY_DATA) {
        const matchingPriceData = this.findMatchingPriceData(latestPriceData, commodity);
        
        if (matchingPriceData) {
          // Check if price is valid (not null, undefined, or NaN)
          const isValidPrice = matchingPriceData.Amount !== null && 
                              matchingPriceData.Amount !== undefined && 
                              !isNaN(matchingPriceData.Amount);
          
          if (isValidPrice) {
            console.log(`✅ Found match for ${commodity.name}: ${matchingPriceData.Commodity} - ${matchingPriceData.Type} = ₱${matchingPriceData.Amount}`);
            // Get trend data for this commodity
            const trendData = await getPriceTrends(
              matchingPriceData.Commodity, 
              matchingPriceData.Type
            );
            
            let trend;
            if (trendData && trendData.length > 1) {
              const currentPrice = matchingPriceData.Amount;
              const previousPrice = trendData[trendData.length - 2].Amount;
              const change = currentPrice - previousPrice;
              const changePercentage = (change / previousPrice) * 100;
              
              trend = {
                previousPrice,
                change,
                changePercentage: Math.round(changePercentage * 100) / 100
              };
            }

            priceMonitoringData.push({
              commodityId: commodity.id,
              currentPrice: matchingPriceData.Amount,
              priceDate: matchingPriceData.Date,
              specification: matchingPriceData.Specification,
              source: 'stored_data',
              trend
            });
            
            console.log(`✅ Matched ${commodity.name} with ${matchingPriceData.Commodity} - ${matchingPriceData.Type} (₱${matchingPriceData.Amount})`);
          } else {
            console.log(`⚠️ Found match for ${commodity.name} but price is invalid: ${matchingPriceData.Amount}`);
          }
        } else {
          console.log(`❌ No match for ${commodity.name}`);
        }
      }

      console.log(`✅ Processed ${priceMonitoringData.length} commodities with current prices`);
      console.log(`📊 Matches found: ${priceMonitoringData.length} out of ${COMMODITY_DATA.length} commodities`);
      return priceMonitoringData;
      
    } catch (error) {
      console.error('❌ Error getting current prices:', error);
      return [];
    }
  }

  /**
   * Find matching price data for a commodity
   */
  private findMatchingPriceData(latestPriceData: any[], commodity: Commodity): any | null {
    console.log(`🔍 Looking for match for commodity: ${commodity.name} (${commodity.category})`);
    console.log(`🔍 DEBUG: Checking against ${latestPriceData.length} price records`);
    
    // Try to find exact matches first by commodity name
    let match = latestPriceData.find(item => 
      item.Commodity.toLowerCase().includes(commodity.name.toLowerCase()) ||
      commodity.name.toLowerCase().includes(item.Commodity.toLowerCase())
    );
    
    console.log(`🔍 DEBUG: Name match result:`, match ? `${match.Commodity} - ${match.Type}` : 'No match');

    if (match) {
      console.log(`✅ Found exact match: ${match.Commodity} - ${match.Type}`);
      return match;
    }

    // Try to match by Type field (for commodities like "Premium (RFA5)")
    match = latestPriceData.find(item => {
      const itemType = item.Type.toLowerCase();
      const commodityName = commodity.name.toLowerCase();
      
      // Direct type match
      if (itemType.includes(commodityName) || commodityName.includes(itemType)) {
        return true;
      }
      
      // Match by commodity type if available
      if (commodity.type && itemType.includes(commodity.type.toLowerCase())) {
        return true;
      }
      
      // Match by specification if available
      if (commodity.specification && item.Specification && 
          item.Specification.toLowerCase().includes(commodity.specification.toLowerCase())) {
        return true;
      }
      
      // Special cases for cooking oil
      if (commodityName.includes('cooking oil') && commodityName.includes('palm') && itemType.includes('palm oil')) {
        return true;
      }
      if (commodityName.includes('cooking oil') && commodityName.includes('coconut') && itemType.includes('coconut oil')) {
        return true;
      }
      
      return false;
    });

    if (match) {
      console.log(`✅ Found type match: ${match.Commodity} - ${match.Type}`);
      return match;
    }

    // Try category-based matching
    const categoryKeywords = this.getCategoryKeywords(commodity.category);
    console.log(`🔍 Trying category keywords: ${categoryKeywords.join(', ')}`);
    
    for (const keyword of categoryKeywords) {
      match = latestPriceData.find(item => 
        item.Commodity.toLowerCase().includes(keyword.toLowerCase()) ||
        item.Type.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(item.Commodity.toLowerCase())
      );
      if (match) {
        console.log(`✅ Found category match: ${match.Commodity} - ${match.Type} (keyword: ${keyword})`);
        return match;
      }
    }

    console.log(`❌ No match found for ${commodity.name}`);
    return null;
  }

  /**
   * Get keywords for commodity categories to help with matching
   */
  private getCategoryKeywords(category: string): string[] {
    const categoryMap: { [key: string]: string[] } = {
      'KADIWA RICE-FOR-ALL': ['kadiwa', 'rice-for-all', 'rfa', 'rice'],
      'IMPORTED COMMERCIAL RICE': ['imported', 'commercial', 'rice'],
      'LOCAL COMMERCIAL RICE': ['local', 'commercial', 'rice'],
      'CORN': ['corn', 'mais'],
      'FISH': ['fish', 'isda', 'bangus', 'tilapia'],
      'LIVESTOCK & POULTRY PRODUCTS': ['livestock', 'poultry', 'beef', 'pork', 'chicken'],
      'LOWLAND VEGETABLES': ['lowland', 'vegetables', 'gulay'],
      'HIGHLAND VEGETABLES': ['highland', 'vegetables', 'gulay'],
      'SPICES': ['spices', 'sibuyas', 'garlic', 'bawang'],
      'FRUITS': ['fruits', 'prutas'],
      'OTHER COMMODITIES': ['other commodities', 'other', 'sugar', 'oil', 'palm', 'coconut']
    };

    return categoryMap[category] || [category.toLowerCase()];
  }

  /**
   * Get price forecast data (placeholder for future implementation)
   */
  async getPriceForecasts(): Promise<any[]> {
    try {
      console.log('🔮 Getting price forecasts from stored data...');
      
      // For now, return empty array as we don't have forecast data
      // This can be extended to include forecast algorithms based on historical data
      return [];
      
    } catch (error) {
      console.error('❌ Error getting price forecasts:', error);
      return [];
    }
  }

  /**
   * Update commodity data with current prices
   */
  updateCommodityWithPrices(commodity: Commodity, priceData: PriceMonitoringData): Commodity {
    return {
      ...commodity,
      currentPrice: priceData.currentPrice,
      priceDate: priceData.priceDate,
      priceSpecification: priceData.specification,
      priceSource: priceData.source,
      trend: priceData.trend ? {
        previousPrice: priceData.trend.previousPrice,
        change: priceData.trend.change,
        changePercentage: priceData.trend.changePercentage
      } : undefined
    };
  }

  /**
   * Get price statistics for monitoring dashboard
   */
  async getPriceStatistics(): Promise<{
    totalCommodities: number;
    commoditiesWithPrices: number;
    averagePriceChange: number;
    lastUpdated: string;
  }> {
    try {
      const latestPriceData = await getLatestPriceData();
      if (!latestPriceData) {
        return {
          totalCommodities: COMMODITY_DATA.length,
          commoditiesWithPrices: 0,
          averagePriceChange: 0,
          lastUpdated: new Date().toISOString()
        };
      }

      let totalChange = 0;
      let changeCount = 0;

      for (const priceData of latestPriceData) {
        const trendData = await getPriceTrends(priceData.Commodity, priceData.Type);
        if (trendData && trendData.length > 1) {
          const currentPrice = priceData.Amount;
          const previousPrice = trendData[trendData.length - 2].Amount;
          const changePercentage = ((currentPrice - previousPrice) / previousPrice) * 100;
          totalChange += changePercentage;
          changeCount++;
        }
      }

      const averagePriceChange = changeCount > 0 ? totalChange / changeCount : 0;
      const latestDate = new Date(Math.max(...latestPriceData.map((p: any) => new Date(p.Date).getTime())));

      return {
        totalCommodities: COMMODITY_DATA.length,
        commoditiesWithPrices: latestPriceData.length,
        averagePriceChange: Math.round(averagePriceChange * 100) / 100,
        lastUpdated: latestDate.toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error getting price statistics:', error);
      return {
        totalCommodities: COMMODITY_DATA.length,
        commoditiesWithPrices: 0,
        averagePriceChange: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

export const priceMonitoringService = new PriceMonitoringService();
