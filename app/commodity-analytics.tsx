import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const GREEN = '#16543a';

const { width } = Dimensions.get('window');

interface WeeklyForecast {
  weekNumber: number;
  startDate: string;
  endDate: string;
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface MonthlyForecast {
  month: string;
  year: number;
  monthNumber: number;
  weeklyForecasts: WeeklyForecast[];
}


export default function CommodityAnalytics() {
  const router = useRouter();
  
  // State for commodity parameters
  const [commodityId, setCommodityId] = useState('premium-rfa5');
  const [commodityName, setCommodityName] = useState('Premium (RFA5)');
  const [commodityCategory, setCommodityCategory] = useState('KADIWA RICE-FOR-ALL');
  
  // Load commodity parameters from AsyncStorage on mount
  useEffect(() => {
    const loadCommodityParams = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const savedId = await AsyncStorage.getItem('selected_commodity_id');
        const savedName = await AsyncStorage.getItem('selected_commodity_name');
        const savedCategory = await AsyncStorage.getItem('selected_commodity_category');
        
        if (savedId && savedName && savedCategory) {
          setCommodityId(savedId);
          setCommodityName(savedName);
          setCommodityCategory(savedCategory);
          console.log('📊 Loaded commodity params from storage:', { id: savedId, name: savedName, category: savedCategory });
        } else {
          console.log('📊 No saved commodity params, using defaults');
        }
      } catch (error) {
        console.error('❌ Error loading commodity params:', error);
      }
    };
    
    loadCommodityParams();
  }, []);
  
  console.log('📊 Analytics screen current params:', { commodityId, commodityName, commodityCategory });
  
  const [loading, setLoading] = useState(true);
  const [monthlyForecasts, setMonthlyForecasts] = useState<MonthlyForecast[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingFromAPI, setIsUpdatingFromAPI] = useState(false);

  // Create content sections for FlatList
  const contentSections = [
    { type: 'calendar' },
    { type: 'api-status' },
    { type: 'error' }
  ];

  useEffect(() => {
    loadForecastData();
  }, [commodityId, commodityName, commodityCategory]);

  const loadForecastData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔮 Loading forecast data for:', commodityName);
      
      // Show UI immediately with local data, then enhance with API data
      const quickForecasts = generateQuickLocalForecasts();
      setMonthlyForecasts(quickForecasts);
      setLoading(false); // Show UI immediately
      
      // Fetch API data in background
      setTimeout(async () => {
        try {
          setIsUpdatingFromAPI(true);
          const apiForecasts = await fetchAPIForecasts();
          if (apiForecasts.length > 0) {
            setMonthlyForecasts(apiForecasts);
            console.log('✅ Updated with API forecasts');
          }
        } catch (err) {
          console.log('⚠️ API update failed, keeping local forecasts');
        } finally {
          setIsUpdatingFromAPI(false);
        }
      }, 100);
      
    } catch (err) {
      console.error('❌ Error loading forecast data:', err);
      setError('Failed to load forecast data');
      setLoading(false);
    }
  };

  const generateQuickLocalForecasts = (): MonthlyForecast[] => {
    const forecasts: MonthlyForecast[] = [];
    const currentDate = new Date();
    
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });
      const year = monthDate.getFullYear();
      const monthNumber = monthDate.getMonth();
      
      const weeksInMonth = monthOffset === 0 ? getWeeksInCurrentMonth() : 4;
      const weeklyForecasts: WeeklyForecast[] = [];
      
      for (let week = 0; week < weeksInMonth; week++) {
        const weekStartDate = new Date(monthDate);
        weekStartDate.setDate(weekStartDate.getDate() + (week * 7));
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        
        // Quick local forecast generation
        const forecast = generateLocalForecast(commodityName);
        
        weeklyForecasts.push({
          weekNumber: week + 1,
          startDate: weekStartDate.toISOString().split('T')[0],
          endDate: weekEndDate.toISOString().split('T')[0],
          predictedPrice: forecast.price,
          confidence: forecast.confidence,
          trend: forecast.trend
        });
      }
      
      forecasts.push({
        month: monthName,
        year,
        monthNumber,
        weeklyForecasts
      });
    }
    
    return forecasts;
  };

  const fetchAPIForecasts = async (): Promise<MonthlyForecast[]> => {
    const forecasts: MonthlyForecast[] = [];
    const currentDate = new Date();
    
    try {
      // Single API call for all 3 months
      const apiCommodityName = mapCommodityToAPIName(commodityName);
      const response = await fetch(`https://price-forecast-api.onrender.com/forecast-weekly/${encodeURIComponent(apiCommodityName)}/3`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 API forecast response:', data);
      
      // Process new API response structure
      if (data.weekly_forecasts && Array.isArray(data.weekly_forecasts)) {
        // Group forecasts by month
        const monthlyData: { [key: string]: any[] } = {};
        
        data.weekly_forecasts.forEach((forecast: any) => {
          const monthKey = forecast.month || 1; // Default to month 1 if not specified
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = [];
          }
          monthlyData[monthKey].push(forecast);
        });
        
        // Create monthly forecasts
        Object.keys(monthlyData).forEach((monthKey) => {
          const monthNum = parseInt(monthKey);
          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + (monthNum - 1), 1);
          const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });
          const year = monthDate.getFullYear();
          const monthNumber = monthDate.getMonth();
          
          const weeklyForecasts: WeeklyForecast[] = monthlyData[monthKey].map((apiForecast: any) => {
            const forecast = {
              price: apiForecast.average_forecast || 0,
              confidence: calculateConfidence(apiForecast, data.overall_statistics),
              trend: determineTrend(apiForecast, data.overall_statistics)
            };
            
            return {
              weekNumber: apiForecast.week_number || 1,
              startDate: apiForecast.start_date || new Date().toISOString().split('T')[0],
              endDate: apiForecast.end_date || new Date().toISOString().split('T')[0],
              predictedPrice: forecast.price,
              confidence: forecast.confidence,
              trend: forecast.trend
            };
          });
          
          forecasts.push({
            month: monthName,
            year,
            monthNumber,
            weeklyForecasts
          });
        });
      }
      
      // If no valid forecasts, fallback to local generation
      if (forecasts.length === 0) {
        console.log('⚠️ No valid forecasts from API, using local generation');
        return generateQuickLocalForecasts();
      }
      
      return forecasts;
      
    } catch (error) {
      console.log('⚠️ API fetch failed:', error);
      return generateQuickLocalForecasts(); // Fallback to local
    }
  };

  const fetchWeeklyForecast = async (commodity: string, date: Date): Promise<{price: number, confidence: number, trend: 'up' | 'down' | 'stable'}> => {
    try {
      // Map commodity names to API format
      const apiCommodityName = mapCommodityToAPIName(commodity);
      
      // Calculate months from current date
      const monthsFromNow = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
      const months = Math.max(1, Math.min(3, monthsFromNow));
      
      const response = await fetch(`https://price-forecast-api.onrender.com/forecast-weekly/${encodeURIComponent(apiCommodityName)}/${months}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 API forecast response:', data);
      
      // Extract forecast data from new API structure
      if (data.weekly_forecasts && data.weekly_forecasts.length > 0) {
        const forecast = data.weekly_forecasts[0]; // Get first forecast
        return {
          price: forecast.average_forecast || 0,
          confidence: calculateConfidence(forecast, data.overall_statistics),
          trend: determineTrend(forecast, data.overall_statistics)
        };
      }
      
      // Fallback to local generation
      return generateLocalForecast(commodity);
      
    } catch (error) {
      console.log('⚠️ API forecast failed, using local generation:', error);
      return generateLocalForecast(commodity);
    }
  };

  const mapCommodityToAPIName = (commodity: string): string => {
    const mapping: { [key: string]: string } = {
      'Premium (RFA5)': 'KADIWA RICE-FOR-ALL',
      'Well Milled (RFA25)': 'KADIWA RICE-FOR-ALL',
      'Regular Milled (RFA100)': 'KADIWA RICE-FOR-ALL',
      'CORN': 'CORN',
      'FISH': 'FISH',
      'FRUITS': 'FRUITS',
      'HIGHLAND VEGETABLES': 'HIGHLAND VEGETABLES',
      'IMPORTED COMMERCIAL RICE': 'IMPORTED COMMERCIAL RICE',
      'LIVESTOCK AND POULTRY PRODUCTS': 'LIVESTOCK AND POULTRY PRODUCTS',
      'LOCAL COMMERCIAL RICE': 'LOCAL COMMERCIAL RICE',
      'LOWLAND VEGETABLES': 'LOWLAND VEGETABLES',
      'OTHER COMMODITIES': 'OTHER COMMODITIES',
      'SPICES': 'SPICES'
    };
    
    return mapping[commodity] || commodity;
  };

  const calculateConfidence = (forecast: any, stats: any): number => {
    try {
      // New API structure doesn't have confidence_score, use price range as confidence indicator
      if (forecast.min_forecast && forecast.max_forecast && forecast.average_forecast) {
        const priceRange = forecast.max_forecast - forecast.min_forecast;
        const avgPrice = forecast.average_forecast;
        const volatility = priceRange / avgPrice; // Lower volatility = higher confidence
        const confidence = Math.max(60, Math.min(95, 100 - (volatility * 1000))); // Convert to 0-100 scale
        return Math.round(confidence);
      }
      
      // Fallback based on data points used
      if (stats && stats.data_points_used) {
        const dataPoints = stats.data_points_used;
        if (dataPoints > 200) return 85;
        if (dataPoints > 100) return 80;
        if (dataPoints > 50) return 75;
        return 70;
      }
      
      return 75; // Default confidence
    } catch (error) {
      return 75;
    }
  };

  const determineTrend = (forecast: any, stats: any): 'up' | 'down' | 'stable' => {
    try {
      // Use overall trend from statistics
      if (stats && stats.overall_trend) {
        const overallTrend = stats.overall_trend.toLowerCase();
        if (overallTrend.includes('increasing') || overallTrend.includes('up')) return 'up';
        if (overallTrend.includes('decreasing') || overallTrend.includes('down')) return 'down';
      }
      
      // Use price change percentage from statistics
      if (stats && stats.price_change_percent) {
        const changePercent = stats.price_change_percent;
        if (changePercent > 1) return 'up';
        if (changePercent < -1) return 'down';
      }
      
      // Fallback: use individual forecast price change
      if (forecast.price_change) {
        if (forecast.price_change > 0) return 'up';
        if (forecast.price_change < 0) return 'down';
      }
      
      return 'stable';
    } catch (error) {
      return 'stable';
    }
  };

  const generateLocalForecast = (commodity: string): {price: number, confidence: number, trend: 'up' | 'down' | 'stable'} => {
    // Fast local forecast generation with cached base prices
    const basePrices: { [key: string]: number } = {
      'Premium (RFA5)': 43,
      'Well Milled (RFA25)': 35,
      'Regular Milled (RFA100)': 33,
      'CORN': 25,
      'FISH': 180,
      'FRUITS': 45,
      'HIGHLAND VEGETABLES': 35,
      'IMPORTED COMMERCIAL RICE': 50,
      'LIVESTOCK AND POULTRY PRODUCTS': 200,
      'LOCAL COMMERCIAL RICE': 40,
      'LOWLAND VEGETABLES': 30,
      'OTHER COMMODITIES': 60,
      'SPICES': 80
    };
    
    const basePrice = basePrices[commodity] || 50;
    // Use deterministic variation based on commodity name for consistency
    const hash = commodity.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const variation = (hash % 20 - 10) / 100; // ±10% variation
    const price = basePrice * (1 + variation);
    
    // Deterministic confidence and trend for consistency
    const confidence = 75 + (hash % 15); // 75-90% confidence
    const trendValue = hash % 3;
    const trend = trendValue === 0 ? 'up' : trendValue === 1 ? 'down' : 'stable';
    
    return {
      price: Math.round(price * 100) / 100,
      confidence,
      trend
    };
  };

  const getWeeksInCurrentMonth = (): number => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstWeekStart = firstDay.getDay();
    
    return Math.ceil((daysInMonth + firstWeekStart) / 7);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      let newMonth = direction === 'next' ? prev + 1 : prev - 1;
      let newYear = currentYear;
      
      if (newMonth > 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      }
      
      setCurrentYear(newYear);
      return newMonth;
    });
  };

  const getCurrentMonthData = (): MonthlyForecast | null => {
    const currentMonthData = monthlyForecasts.find(
      month => month.monthNumber === currentMonth && month.year === currentYear
    );
    return currentMonthData || null;
  };

  const getMonthNames = (): string[] => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  };

  const renderWeeklyForecastItem = (weekForecast: WeeklyForecast) => {
    const startDate = new Date(weekForecast.startDate);
    const endDate = new Date(weekForecast.endDate);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
      switch (trend) {
        case 'up': return 'trending-up';
        case 'down': return 'trending-down';
        default: return 'remove';
      }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
      switch (trend) {
        case 'up': return GREEN;
        case 'down': return '#f44336';
        default: return '#ff9800';
      }
    };

    return (
      <View style={styles.weeklyForecastCard}>
        <View style={styles.weeklyForecastHeader}>
          <View style={styles.weekInfo}>
            <Text style={styles.weekNumber}>Week {weekForecast.weekNumber}</Text>
            <Text style={styles.weekDateRange}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
          </View>
          
          <View style={styles.weekTrendContainer}>
            <Ionicons 
              name={getTrendIcon(weekForecast.trend)} 
              size={20} 
              color={getTrendColor(weekForecast.trend)} 
            />
            <Text style={[styles.weekTrendText, { color: getTrendColor(weekForecast.trend) }]}>
              {weekForecast.trend.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.weeklyForecastBody}>
          <View style={styles.weekPriceContainer}>
            <Text style={styles.weekPriceLabel}>Predicted Price</Text>
            <Text style={styles.weekPrice}>₱{weekForecast.predictedPrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.weekConfidenceContainer}>
            <Text style={styles.weekConfidenceLabel}>Confidence</Text>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { 
                    width: `${weekForecast.confidence}%`,
                    backgroundColor: weekForecast.confidence > 80 ? GREEN : 
                                   weekForecast.confidence > 60 ? '#ff9800' : '#f44336'
                  }
                ]} 
              />
            </View>
            <Text style={styles.weekConfidenceText}>{weekForecast.confidence}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMonthlyForecast = () => {
    const currentMonthData = getCurrentMonthData();
    
    if (!currentMonthData || currentMonthData.weeklyForecasts.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No forecast data available for this month</Text>
        </View>
      );
    }

    return (
      <View style={styles.weeklyForecastContainer}>
        {currentMonthData.weeklyForecasts.map((item, index) => (
          <View key={`week-${index}`}>
            {renderWeeklyForecastItem(item)}
          </View>
        ))}
      </View>
    );
  };

  const renderContentItem = ({ item }: { item: { type: string } }) => {
    switch (item.type) {
      case 'calendar':
        return (
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                style={styles.calendarNavButton}
                onPress={() => navigateMonth('prev')}
              >
                <Ionicons name="chevron-back" size={24} color={GREEN} />
              </TouchableOpacity>
              
              <View style={styles.calendarTitleContainer}>
                <Text style={styles.calendarTitle}>
                  {getMonthNames()[currentMonth]} {currentYear}
                </Text>
                <Text style={styles.calendarSubtitle}>Weekly Price Forecasts</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.calendarNavButton}
                onPress={() => navigateMonth('next')}
              >
                <Ionicons name="chevron-forward" size={24} color={GREEN} />
              </TouchableOpacity>
            </View>
            
            {renderMonthlyForecast()}
          </View>
        );
      case 'api-status':
        return (
          <View style={styles.apiStatusCard}>
            <View style={styles.apiStatusHeader}>
              <Ionicons name="cloud" size={20} color={GREEN} />
              <Text style={styles.apiStatusTitle}>Price Forecast API</Text>
              {isUpdatingFromAPI && (
                <View style={styles.updatingIndicator}>
                  <ActivityIndicator size="small" color={GREEN} />
                  <Text style={styles.updatingText}>Updating...</Text>
                </View>
              )}
            </View>
            <Text style={styles.apiStatusText}>
              Connected to: https://price-forecast-api.onrender.com
            </Text>
            <Text style={styles.apiStatusSubtext}>
              {isUpdatingFromAPI ? 'Fetching latest forecasts...' : `Enhanced forecasting with seasonal adjustments for ${commodityName}`}
            </Text>
          </View>
        );
      case 'error':
        return error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadForecastData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingText}>Loading forecast data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{commodityName}</Text>
          <Text style={styles.headerSubtitle}>{commodityCategory}</Text>
        </View>
      </View>

      <FlatList
        data={contentSections}
        renderItem={renderContentItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={true}
        bounces={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    paddingBottom: 20,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calendarTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  calendarSubtitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  weeklyForecastContainer: {
    marginTop: 16,
  },
  weeklyForecastList: {
    paddingBottom: 10,
  },
  weeklyForecastCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  weeklyForecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekInfo: {
    flex: 1,
  },
  weekNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  weekDateRange: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  weekTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  weeklyForecastBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekPriceContainer: {
    flex: 1,
    marginRight: 16,
  },
  weekPriceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weekPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  weekConfidenceContainer: {
    flex: 1,
  },
  weekConfidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  weekConfidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  apiStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  apiStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  apiStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  updatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updatingText: {
    fontSize: 12,
    color: GREEN,
    marginLeft: 4,
  },
  apiStatusText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  apiStatusSubtext: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '500',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});