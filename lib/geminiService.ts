import { Commodity } from '../constants/CommodityData';
import { API_CONFIG } from './config';

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface PriceData {
  commodityId: string;
  commodityName: string;
  currentPrice: number;
  unit: string;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: string;
  source: string;
}

export interface ForecastData {
  commodityId: string;
  commodityName: string;
  nextWeek: number;
  nextMonth: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  factors: string[];
}

class GeminiService {
  private apiKey: string;

  constructor(apiKey: string = API_CONFIG.GEMINI_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Get current prices for commodities in the Philippines
   */
  async getCurrentPrices(commodities: Commodity[]): Promise<PriceData[]> {
    // Using mock data for price data since DA doesn't provide API
    // The real DA integration is handled by daPriceService
    console.log('🔄 Using DA-based mock price data');
    return this.getMockPriceData(commodities);
  }

  /**
   * Get mock price data for demonstration
   */
  private getMockPriceData(commodities: Commodity[]): PriceData[] {
        // Consistent prices based on DA Philippines price monitoring data
        const mockPrices: { [key: string]: { basePrice: number, unit: string } } = {
          // KADIWA RICE-FOR-ALL
          'Premium (RFA5)': { basePrice: 45, unit: 'kg' },
          'Well Milled (RFA25)': { basePrice: 42, unit: 'kg' },
          'Regular Milled (RFA100)': { basePrice: 40, unit: 'kg' },
          'P20 Benteng Bigas Meron Na': { basePrice: 20, unit: 'kg' },
          
          // IMPORTED COMMERCIAL RICE
          'Special (Imported)': { basePrice: 65, unit: 'kg' },
          'Premium (Imported)': { basePrice: 58, unit: 'kg' },
          'Well Milled (Imported)': { basePrice: 52, unit: 'kg' },
          'Regular Milled (Imported)': { basePrice: 48, unit: 'kg' },
          
          // LOCAL COMMERCIAL RICE
          'Special (Local)': { basePrice: 62, unit: 'kg' },
          'Premium (Local)': { basePrice: 55, unit: 'kg' },
          'Well Milled (Local)': { basePrice: 50, unit: 'kg' },
          'Regular Milled (Local)': { basePrice: 45, unit: 'kg' },
          
          // CORN
          'Corn (White)': { basePrice: 25, unit: 'kg' },
          'Corn (Yellow)': { basePrice: 23, unit: 'kg' },
          'Corn Grits (White, Food Grade)': { basePrice: 28, unit: 'kg' },
          'Corn Grits (Yellow, Food Grade)': { basePrice: 26, unit: 'kg' },
          'Corn Cracked (Yellow, Feed Grade)': { basePrice: 22, unit: 'kg' },
          'Corn Grits (Feed Grade)': { basePrice: 20, unit: 'kg' },
          
          // FISH
          'Bangus': { basePrice: 180, unit: 'kg' },
          'Tilapia': { basePrice: 120, unit: 'kg' },
          'Galunggong (Local)': { basePrice: 140, unit: 'kg' },
          'Galunggong (Imported)': { basePrice: 130, unit: 'kg' },
          'Alumahan': { basePrice: 160, unit: 'kg' },
          'Bonito': { basePrice: 170, unit: 'kg' },
          'Salmon Head': { basePrice: 150, unit: 'kg' },
          'Sardines (Tamban)': { basePrice: 110, unit: 'kg' },
          'Squid (Pusit Bisaya)': { basePrice: 200, unit: 'kg' },
          'Yellow-Fin Tuna (Tambakol)': { basePrice: 250, unit: 'kg' },
          
          // LIVESTOCK & POULTRY PRODUCTS
          'Beef Rump': { basePrice: 380, unit: 'kg' },
          'Beef Brisket': { basePrice: 350, unit: 'kg' },
          'Pork Ham': { basePrice: 280, unit: 'kg' },
          'Pork Belly': { basePrice: 320, unit: 'kg' },
          'Frozen Kasim': { basePrice: 260, unit: 'kg' },
          'Frozen Liempo': { basePrice: 300, unit: 'kg' },
          'Whole Chicken': { basePrice: 150, unit: 'kg' },
          'Chicken Egg (White, Pewee)': { basePrice: 6, unit: 'piece' },
          'Chicken Egg (White, Extra Small)': { basePrice: 6.5, unit: 'piece' },
          'Chicken Egg (White, Small)': { basePrice: 7, unit: 'piece' },
          'Chicken Egg (White, Medium)': { basePrice: 8, unit: 'piece' },
          'Chicken Egg (White, Large)': { basePrice: 9, unit: 'piece' },
          'Chicken Egg (White, Extra Large)': { basePrice: 10, unit: 'piece' },
          'Chicken Egg (White, Jumbo)': { basePrice: 11, unit: 'piece' },
          'Chicken Egg (Brown, Medium)': { basePrice: 8.5, unit: 'piece' },
          'Chicken Egg (Brown, Large)': { basePrice: 9.5, unit: 'piece' },
          'Chicken Egg (Brown, Extra Large)': { basePrice: 10.5, unit: 'piece' },
          
          // LOWLAND VEGETABLES
          'Ampalaya': { basePrice: 45, unit: 'kg' },
          'Sitao': { basePrice: 60, unit: 'kg' },
          'Pechay (Native)': { basePrice: 30, unit: 'kg' },
          'Squash': { basePrice: 35, unit: 'kg' },
          'Eggplant': { basePrice: 50, unit: 'kg' },
          'Tomato': { basePrice: 65, unit: 'kg' },
          
          // HIGHLAND VEGETABLES
          'Bell Pepper (Green)': { basePrice: 80, unit: 'kg' },
          'Bell Pepper (Red)': { basePrice: 100, unit: 'kg' },
          'Broccoli': { basePrice: 120, unit: 'kg' },
          'Cabbage (Rare Ball)': { basePrice: 45, unit: 'kg' },
          'Cabbage (Scorpio)': { basePrice: 40, unit: 'kg' },
          'Cabbage (Wonder Ball)': { basePrice: 42, unit: 'kg' },
          'Carrots': { basePrice: 55, unit: 'kg' },
          'Habichuelas (Baguio Beans)': { basePrice: 80, unit: 'kg' },
          'White Potato': { basePrice: 35, unit: 'kg' },
          'Pechay (Baguio)': { basePrice: 35, unit: 'kg' },
          'Chayote': { basePrice: 25, unit: 'kg' },
          'Cauliflower': { basePrice: 110, unit: 'kg' },
          'Celery': { basePrice: 90, unit: 'kg' },
          'Lettuce (Green Ice)': { basePrice: 60, unit: 'kg' },
          'Lettuce (Iceberg)': { basePrice: 70, unit: 'kg' },
          'Lettuce (Romaine)': { basePrice: 65, unit: 'kg' },
          
          // SPICES
          'Red Onion': { basePrice: 90, unit: 'kg' },
          'Red Onion (Imported)': { basePrice: 85, unit: 'kg' },
          'White Onion': { basePrice: 95, unit: 'kg' },
          'White Onion (Imported)': { basePrice: 90, unit: 'kg' },
          'Garlic (Imported)': { basePrice: 180, unit: 'kg' },
          'Garlic (Native)': { basePrice: 200, unit: 'kg' },
          'Ginger': { basePrice: 120, unit: 'kg' },
          'Chilli (Red)': { basePrice: 150, unit: 'kg' },
          
          // FRUITS
          'Calamansi': { basePrice: 60, unit: 'kg' },
          'Banana (Lakatan)': { basePrice: 80, unit: 'kg' },
          'Banana (Latundan)': { basePrice: 70, unit: 'kg' },
          'Banana (Saba)': { basePrice: 45, unit: 'kg' },
          'Papaya': { basePrice: 40, unit: 'kg' },
          'Mango (Carabao)': { basePrice: 120, unit: 'kg' },
          'Avocado': { basePrice: 100, unit: 'kg' },
          'Melon': { basePrice: 50, unit: 'kg' },
          'Pomelo': { basePrice: 80, unit: 'kg' },
          'Watermelon': { basePrice: 35, unit: 'kg' },
          
          // OTHER BASIC COMMODITIES
          'Sugar (Refined)': { basePrice: 55, unit: 'kg' },
          'Sugar (Washed)': { basePrice: 50, unit: 'kg' },
          'Sugar (Brown)': { basePrice: 45, unit: 'kg' },
          'Cooking Oil (Palm)': { basePrice: 85, unit: 'L' },
          'Cooking Oil (Coconut)': { basePrice: 90, unit: 'L' }
        };

    return commodities.map(commodity => {
      const mockData = mockPrices[commodity.name] || { basePrice: 50, unit: 'kg' };
      
      // Consistent prices - no random changes, based on DA monitoring data
      const currentPrice = mockData.basePrice;
      const priceChange = 0; // No change for consistency
      const priceChangePercent = 0; // No percentage change for consistency
      
      return {
        commodityId: commodity.id,
        commodityName: commodity.name,
        currentPrice: currentPrice,
        unit: mockData.unit,
        priceChange: priceChange,
        priceChangePercent: priceChangePercent,
        lastUpdated: new Date().toISOString().split('T')[0],
        source: 'DA Price Monitoring (Demo)'
      };
    });
  }

  /**
   * Get price forecasts for commodities
   */
  async getPriceForecasts(commodities: Commodity[]): Promise<ForecastData[]> {
    // Using mock data for forecasting since DA integration handles this
    console.log('🔄 Using DA-based mock forecast data');
    return this.getMockForecastData(commodities);
  }

  /**
   * Get mock forecast data for demonstration
   */
  private getMockForecastData(commodities: Commodity[]): ForecastData[] {
    const trends = ['up', 'down', 'stable'] as const;
    const factors = [
      ['Seasonal demand', 'Weather conditions', 'Supply chain'],
      ['Government policies', 'Import restrictions', 'Fuel prices'],
      ['Harvest cycles', 'Consumer demand', 'Market speculation'],
      ['Transportation costs', 'Storage capacity', 'Export demand']
    ];

    return commodities.map(commodity => {
      // Consistent forecast data based on DA monitoring trends
      const trend = 'stable'; // Consistent stable trend
      const confidence = 85; // High confidence for DA-based data
      
      // Get the current price for this commodity to base forecasts on
      const mockPrices: { [key: string]: number } = {
        // KADIWA RICE
        'Premium (RFA5)': 45, 'Well Milled (RFA25)': 42, 'Regular Milled (RFA100)': 40, 'P20 Benteng Bigas Meron Na': 20,
        // IMPORTED RICE
        'Special (Imported)': 65, 'Premium (Imported)': 58, 'Well Milled (Imported)': 52, 'Regular Milled (Imported)': 48,
        // LOCAL RICE
        'Special (Local)': 62, 'Premium (Local)': 55, 'Well Milled (Local)': 50, 'Regular Milled (Local)': 45,
        // CORN
        'Corn (White)': 25, 'Corn (Yellow)': 23, 'Corn Grits (White, Food Grade)': 28, 'Corn Grits (Yellow, Food Grade)': 26,
        'Corn Cracked (Yellow, Feed Grade)': 22, 'Corn Grits (Feed Grade)': 20,
        // FISH
        'Bangus': 180, 'Tilapia': 120, 'Galunggong (Local)': 140, 'Galunggong (Imported)': 130,
        'Alumahan': 160, 'Bonito': 170, 'Salmon Head': 150, 'Sardines (Tamban)': 110,
        'Squid (Pusit Bisaya)': 200, 'Yellow-Fin Tuna (Tambakol)': 250,
        // LIVESTOCK & POULTRY
        'Beef Rump': 380, 'Beef Brisket': 350, 'Pork Ham': 280, 'Pork Belly': 320,
        'Frozen Kasim': 260, 'Frozen Liempo': 300, 'Whole Chicken': 150,
        'Chicken Egg (White, Pewee)': 6, 'Chicken Egg (White, Extra Small)': 6.5, 'Chicken Egg (White, Small)': 7,
        'Chicken Egg (White, Medium)': 8, 'Chicken Egg (White, Large)': 9, 'Chicken Egg (White, Extra Large)': 10,
        'Chicken Egg (White, Jumbo)': 11, 'Chicken Egg (Brown, Medium)': 8.5, 'Chicken Egg (Brown, Large)': 9.5,
        'Chicken Egg (Brown, Extra Large)': 10.5,
        // LOWLAND VEGETABLES
        'Ampalaya': 45, 'Sitao': 60, 'Pechay (Native)': 30, 'Squash': 35, 'Eggplant': 50, 'Tomato': 65,
        // HIGHLAND VEGETABLES
        'Bell Pepper (Green)': 80, 'Bell Pepper (Red)': 100, 'Broccoli': 120, 'Cabbage (Rare Ball)': 45,
        'Cabbage (Scorpio)': 40, 'Cabbage (Wonder Ball)': 42, 'Carrots': 55, 'Habichuelas (Baguio Beans)': 80,
        'White Potato': 35, 'Pechay (Baguio)': 35, 'Chayote': 25, 'Cauliflower': 110, 'Celery': 90,
        'Lettuce (Green Ice)': 60, 'Lettuce (Iceberg)': 70, 'Lettuce (Romaine)': 65,
        // SPICES
        'Red Onion': 90, 'Red Onion (Imported)': 85, 'White Onion': 95, 'White Onion (Imported)': 90,
        'Garlic (Imported)': 180, 'Garlic (Native)': 200, 'Ginger': 120, 'Chilli (Red)': 150,
        // FRUITS
        'Calamansi': 60, 'Banana (Lakatan)': 80, 'Banana (Latundan)': 70, 'Banana (Saba)': 45,
        'Papaya': 40, 'Mango (Carabao)': 120, 'Avocado': 100, 'Melon': 50, 'Pomelo': 80, 'Watermelon': 35,
        // OTHER
        'Sugar (Refined)': 55, 'Sugar (Washed)': 50, 'Sugar (Brown)': 45,
        'Cooking Oil (Palm)': 85, 'Cooking Oil (Coconut)': 90
      };
      
      const currentPrice = mockPrices[commodity.name] || 50;
      
      return {
        commodityId: commodity.id,
        commodityName: commodity.name,
        nextWeek: currentPrice, // Same price next week (stable)
        nextMonth: currentPrice, // Same price next month (stable)
        trend: trend,
        confidence: confidence,
        factors: ['DA price monitoring', 'Government price controls', 'Stable supply']
      };
    });
  }

  /**
   * Get market analysis and insights
   * Currently using fallback analysis due to API connectivity issues
   */
  async getMarketAnalysis(commodityName: string): Promise<string> {
    console.log('🔄 Using fallback analysis (Gemini API temporarily disabled)');
    // Skip API calls entirely and use fallback analysis
    return this.getFallbackAnalysis(commodityName);
  }

  /**
   * Get fallback market analysis when API is not available
   */
  private getFallbackAnalysis(commodityName: string): string {
    return `Based on DA Philippines monitoring data, ${commodityName} shows stable market conditions with seasonal variations typical for Philippine agriculture. Key factors affecting prices include harvest cycles, weather conditions, and government policies. The commodity maintains consistent pricing within DA monitoring ranges, with slight fluctuations based on supply and demand patterns.`;
  }

  /**
   * Call Gemini API with the given prompt
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      console.log('🚀 Calling Gemini API...');
      console.log('🔑 API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
      console.log('📝 Prompt length:', prompt.length);
      
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response received');
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        console.log('📄 Response text length:', responseText.length);
        return responseText;
      } else {
        console.error('❌ Invalid API response structure:', data);
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }
}

// Create and export the service instance
export const geminiService = new GeminiService();

// Helper function to update commodity data with price information
export const updateCommodityWithPrices = (
  commodity: Commodity, 
  priceData: PriceData, 
  forecastData?: ForecastData
): Commodity => {
  return {
    ...commodity,
    currentPrice: priceData.currentPrice,
    priceChange: priceData.priceChange,
    priceChangePercent: priceData.priceChangePercent,
    lastUpdated: priceData.lastUpdated,
    forecast: forecastData ? {
      nextWeek: forecastData.nextWeek,
      nextMonth: forecastData.nextMonth,
      trend: forecastData.trend,
      confidence: forecastData.confidence,
      factors: forecastData.factors
    } : undefined
  };
};
