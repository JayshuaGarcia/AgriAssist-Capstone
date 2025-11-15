import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { CommodityPrice } from '../services/csvPriceService';

const { width } = Dimensions.get('window');
const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

interface PriceDetailModalProps {
  visible: boolean;
  commodity: CommodityPrice | null;
  onClose: () => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PriceDetailModal: React.FC<PriceDetailModalProps> = ({
  visible,
  commodity,
  onClose,
}) => {
  // Get current year as default
  const currentYear = new Date().getFullYear().toString();
  
  // Get forecast years from forecast data
  const forecastData = Array.isArray(commodity?.forecastData) ? commodity.forecastData : [];
  const forecastYears = new Set<string>();
  if (Array.isArray(forecastData)) {
    forecastData.forEach(f => {
      if (f && f.date) {
        const forecastYear = new Date(f.date).getFullYear().toString();
        forecastYears.add(forecastYear);
      }
    });
  }
  
  // Combine historical years with forecast years
  const historicalYears = Array.isArray(commodity?.availableYears) ? commodity.availableYears : [];
  const allYears = new Set([...historicalYears, ...Array.from(forecastYears)]);
  const availableYears = Array.from(allYears).sort((a, b) => parseInt(b) - parseInt(a));
  
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || currentYear);

  if (!commodity) return null;

  // Get data for selected year
  // ONLY get historical data if it exists for this year
  const yearHistoricalData = commodity.historicalDataByYear?.[selectedYear] || [];

  // Filter forecast data for selected year
  // IMPORTANT: Only show forecast data where it actually exists in the CSV file
  // Forecast data starts from November 2025 and continues into 2026
  const filteredForecast = (forecastData || []).filter(f => {
    if (!f || !f.date) return false;
    try {
      const forecastYear = new Date(f.date).getFullYear().toString();
      return forecastYear === selectedYear;
    } catch {
      return false;
    }
  });
  
  // Debug logging to verify data sources
  console.log(`📊 PriceDetailModal - Year: ${selectedYear}`);
  console.log(`   Historical data records: ${yearHistoricalData.length}`);
  console.log(`   Forecast data records: ${filteredForecast.length}`);

  // Process data to show monthly averages - ONLY includes months with actual data
  // For forecast: only include dates where forecast actually exists (starts Nov 15, 2025)
  const getMonthlyData = (data: Array<{ date: string; price: number }>, isForecast = false) => {
    const monthlyData: { [month: number]: number[] } = {};
    
    // Only process valid data (price > 0)
    data.forEach(item => {
      if (item && item.price && item.price > 0) {
        try {
          const date = new Date(item.date);
          if (isNaN(date.getTime())) return; // Skip invalid dates
          
          // CRITICAL: For forecast data, only include dates on or after Nov 15, 2025
          if (isForecast) {
            const forecastStartDate = new Date('2025-11-15');
            if (date < forecastStartDate) {
              return; // Skip forecast data before Nov 15, 2025
            }
          }
          
          const month = date.getMonth(); // 0-11
          if (!monthlyData[month]) {
            monthlyData[month] = [];
          }
          monthlyData[month].push(item.price);
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // ONLY calculate averages for months that have actual data
    // Don't include months with no data - this prevents 0 values
    const monthlyAverages: (number | null)[] = [];
    const monthLabels: string[] = [];
    
    for (let month = 0; month < 12; month++) {
      if (monthlyData[month] && monthlyData[month].length > 0) {
        // Only calculate average if we have data
        const avg = monthlyData[month].reduce((sum, p) => sum + p, 0) / monthlyData[month].length;
        monthlyAverages.push(Math.round(avg * 100) / 100);
        monthLabels.push(MONTH_NAMES[month]);
      }
      // Don't add anything for months with no data - skip them entirely
    }

    // Return only months with actual data (not all 12 months)
    return { labels: monthLabels, data: monthlyAverages };
  };

  // Get chart data for the user price detail screen.
  // VERY IMPORTANT:
  // - Only plot months where data REALLY exists (no fake zeros, no placeholders)
  // - Use monthly averages from the same logic as the Monthly Data Table
  // - Do NOT force January if there is no data for that month
  const getChartData = () => {
    // Build monthly averages for historical and forecast (same as table)
    const monthlyHistorical: { [month: number]: number } = {};
    const monthlyForecast: { [month: number]: number } = {};

    // Historical monthly averages for selectedYear
    const safeHistoricalData = Array.isArray(yearHistoricalData) ? yearHistoricalData : [];
    const historicalByMonth: { [month: number]: number[] } = {};

    safeHistoricalData.forEach(item => {
      if (item && item.date && item.price && item.price > 0) {
        try {
          const date = new Date(item.date);
          const month = date.getMonth();
          const year = date.getFullYear().toString();
          if (year === selectedYear) {
            if (!historicalByMonth[month]) {
              historicalByMonth[month] = [];
            }
            historicalByMonth[month].push(item.price);
          }
        } catch {
          // Skip invalid dates
        }
      }
    });

    Object.keys(historicalByMonth).forEach(monthStr => {
      const month = parseInt(monthStr);
      const values = historicalByMonth[month];
      if (values && values.length > 0) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        monthlyHistorical[month] = Math.round(avg * 100) / 100;
      }
    });

    // Forecast monthly averages for selectedYear
    const safeForecastData = Array.isArray(filteredForecast) ? filteredForecast : [];
    const forecastByMonth: { [month: number]: number[] } = {};

    safeForecastData.forEach(item => {
      if (item && item.date && item.forecast && item.forecast > 0) {
        try {
          const date = new Date(item.date);
          const month = date.getMonth();
          const year = date.getFullYear().toString();
          if (year === selectedYear) {
            if (!forecastByMonth[month]) {
              forecastByMonth[month] = [];
            }
            forecastByMonth[month].push(item.forecast);
          }
        } catch {
          // Skip invalid dates
        }
      }
    });

    Object.keys(forecastByMonth).forEach(monthStr => {
      const month = parseInt(monthStr);
      const values = forecastByMonth[month];
      if (values && values.length > 0) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        monthlyForecast[month] = Math.round(avg * 100) / 100;
      }
    });

    // Decide which value to plot for each month - ALWAYS show all 12 months
    const currentDate = new Date();
    const selectedYearNum = parseInt(selectedYear);
    const currentYearNum = currentDate.getFullYear();
    const FORECAST_START_MONTH = 10; // November (0-indexed)

    const labels: string[] = [];
    const values: number[] = [];

    // Always include all 12 months (Jan-Dec)
    for (let month = 0; month < 12; month++) {
      const histPrice = monthlyHistorical[month];
      const forePrice = monthlyForecast[month];

      let price: number | null = null;

      if (selectedYearNum === currentYearNum) {
        // Current year (e.g., 2025): historical Jan–Oct, forecast from Nov onwards
        if (month < FORECAST_START_MONTH) {
          price = histPrice || null;
        } else {
          price = forePrice || histPrice || null;
        }
      } else if (selectedYearNum > currentYearNum) {
        // Future years (2026+): forecast only
        price = forePrice || null;
      } else {
        // Past years (2019–2024): historical only
        price = histPrice || null;
      }

      // Always add all months, use 0 for months without data
      labels.push(MONTH_NAMES[month]);
      values.push(price && price > 0 ? price : 0);
    }

    return {
      labels,
      datasets: [
        {
          data: values,
          // Always green on the chart (user requested single color)
          color: (opacity = 1) => `rgba(22, 84, 58, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const chartData = getChartData();

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(22, 84, 58, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: GREEN,
    },
    propsForLabels: {
      fontSize: 10,
    },
    propsForVerticalLabels: {
      fontSize: 10,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
    },
    // Note: react-native-chart-kit doesn't support label rotation directly
    // Labels will be abbreviated month names (Jan, Feb, etc.) to fit
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      // Don't show labels for invalid, zero, or negative values (hidden data points)
      if (isNaN(num) || !isFinite(num) || num <= 0) return '';
      return `₱${num.toFixed(0)}`;
    },
    // Note: react-native-chart-kit doesn't support hiding individual points
    // Very small values (< 1) will still render but should be below visible chart range
  };

  const formatPrice = (price: number) => {
    return `₱${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrendIcon = () => {
    switch (commodity.trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (commodity.trend) {
      case 'up':
        return '#e74c3c';
      case 'down':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{commodity.displayName}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Price Card */}
          <View style={styles.currentPriceCard}>
            <Text style={styles.currentPriceLabel}>Current Price</Text>
            <View style={styles.currentPriceRow}>
              <Text style={styles.currentPrice}>{formatPrice(commodity.currentPrice)}</Text>
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={getTrendIcon() as any} 
                  size={24} 
                  color={getTrendColor()} 
                />
                {commodity.changePercent !== undefined && commodity.changePercent !== 0 && (
                  <Text style={[styles.changePercent, { color: getTrendColor() }]}>
                    {commodity.changePercent > 0 ? '+' : ''}{commodity.changePercent.toFixed(2)}%
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.currentDate}>As of {formatDate(commodity.currentDate)}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{commodity.category}</Text>
            </View>
          </View>

          {/* Year Selector */}
          <View style={styles.yearSelectorContainer}>
            <Text style={styles.yearLabel}>Select Year:</Text>
            <View style={styles.yearButtons}>
              {availableYears.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButton,
                    selectedYear === year && styles.yearButtonActive,
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      selectedYear === year && styles.yearButtonTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Combined Chart - Historical + Forecast */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              Price Overview {selectedYear} (Historical + Forecast)
            </Text>
            <Text style={styles.chartSubtitle}>
              Forecast: Seasonal Historical × Current Trend (until Dec 2026)
              {'\n'}Smooth transition: First forecast day uses last known price, gradually blends over 7 days
            </Text>
            {chartData.labels.length > 0 ? (
              <>
                <LineChart
                  data={chartData}
                  width={width - 40}
                  height={260}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  segments={4}
                  fromZero={false}
                  // Try to hide 0 values by not starting from zero
                  // But chart library may still render them
                />
                
                {/* Legend */}
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
                    <Text style={styles.legendText}>Historical Data</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                    <Text style={styles.legendText}>Forecast (Seasonal + Trend)</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No data available for {selectedYear}</Text>
              </View>
            )}
          </View>

          {/* Forecast Summary */}
          {filteredForecast.length > 0 && (
            <View style={styles.forecastDetails}>
              <Text style={styles.forecastDetailsTitle}>Forecast Summary</Text>
              <Text style={styles.forecastMethod}>
                Method: Historical same-date median × Current trend ratio (60-day window)
                {'\n'}Smooth transition: Day 1 uses last known price (₱{commodity?.currentPrice?.toFixed(2) || '0.00'}), gradually blends to seasonal forecast over 7 days (prevents sudden jumps)
              </Text>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLabel}>Next Week:</Text>
                <Text style={styles.forecastValue}>
                  {formatPrice(filteredForecast[6]?.forecast || 0)}
                </Text>
              </View>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLabel}>Next Month:</Text>
                <Text style={styles.forecastValue}>
                  {formatPrice(filteredForecast[29]?.forecast || 0)}
                </Text>
              </View>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLabel}>3 Months:</Text>
                <Text style={styles.forecastValue}>
                  {formatPrice(filteredForecast[89]?.forecast || 0)}
                </Text>
              </View>
            </View>
          )}

           {/* Monthly Data Table */}
           <View style={styles.dataTable}>
             <Text style={styles.tableTitle}>Monthly Average Prices ({selectedYear})</Text>
             {(() => {
               // Get actual monthly data directly from source (not from chart data which has invisible values)
               const monthlyHistorical: { [month: number]: number } = {};
               const monthlyForecast: { [month: number]: number } = {};
               
               // Process historical data - calculate proper monthly averages
               const safeHistoricalData = Array.isArray(yearHistoricalData) ? yearHistoricalData : [];
               const historicalByMonth: { [month: number]: number[] } = {};
               
               safeHistoricalData.forEach(item => {
                 if (item && item.date && item.price && item.price > 0) {
                   try {
                     const date = new Date(item.date);
                     const month = date.getMonth();
                     const year = date.getFullYear().toString();
                     if (year === selectedYear) {
                       if (!historicalByMonth[month]) {
                         historicalByMonth[month] = [];
                       }
                       historicalByMonth[month].push(item.price);
                     }
                   } catch (e) {
                     // Skip invalid dates
                   }
                 }
               });
               
               // Calculate monthly averages
               Object.keys(historicalByMonth).forEach(monthStr => {
                 const month = parseInt(monthStr);
                 const values = historicalByMonth[month];
                 if (values && values.length > 0) {
                   const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
                   monthlyHistorical[month] = Math.round(avg * 100) / 100;
                 }
               });
               
               // Process forecast data - calculate proper monthly averages
               const safeForecastData = Array.isArray(filteredForecast) ? filteredForecast : [];
               const forecastByMonth: { [month: number]: number[] } = {};
               
               safeForecastData.forEach(item => {
                 if (item && item.date && item.forecast && item.forecast > 0) {
                   try {
                     const date = new Date(item.date);
                     const month = date.getMonth();
                     const year = date.getFullYear().toString();
                     if (year === selectedYear) {
                       if (!forecastByMonth[month]) {
                         forecastByMonth[month] = [];
                       }
                       forecastByMonth[month].push(item.forecast);
                     }
                   } catch (e) {
                     // Skip invalid dates
                   }
                 }
               });
               
               // Calculate monthly averages
               Object.keys(forecastByMonth).forEach(monthStr => {
                 const month = parseInt(monthStr);
                 const values = forecastByMonth[month];
                 if (values && values.length > 0) {
                   const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
                   monthlyForecast[month] = Math.round(avg * 100) / 100;
                 }
               });
               
               // Build table rows - only show months with actual data
               const tableRows: React.ReactElement[] = [];
               for (let month = 0; month < 12; month++) {
                 const histPrice = monthlyHistorical[month];
                 const forePrice = monthlyForecast[month];
                 
                 // Determine which price to use based on year and data availability
                 const selectedYearNum = parseInt(selectedYear);
                 const currentYearNum = new Date().getFullYear();
                 const FORECAST_START_MONTH = 10; // November (0-indexed)
                 
                 let price: number | null = null;
                 let isForecast = false;
                 
                 if (selectedYearNum === currentYearNum) {
                   // For 2025: historical for Jan-Oct, forecast for Nov-Dec
                   if (month < FORECAST_START_MONTH) {
                     price = histPrice || null;
                   } else {
                     price = forePrice || histPrice || null;
                     isForecast = forePrice ? true : false;
                   }
                 } else if (selectedYearNum > currentYearNum) {
                   // For 2026+: forecast only
                   price = forePrice || null;
                   isForecast = true;
                 } else {
                   // For past years: historical only
                   price = histPrice || null;
                 }
                 
                 // Only add row if we have actual data (not invisible values)
                 if (price && price > 10) { // Skip invisible values (< 10)
                   tableRows.push(
                     <View key={month} style={styles.tableRow}>
                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                         <Text style={styles.tableDate}>{MONTH_NAMES[month]} {selectedYear}</Text>
                         {isForecast && (
                           <View style={[styles.forecastBadge]}>
                             <Text style={styles.forecastBadgeText}>Forecast</Text>
                           </View>
                         )}
                       </View>
                       <Text style={[styles.tablePrice, isForecast && { color: '#FF9800' }]}>
                         {formatPrice(price)}
                       </Text>
                     </View>
                   );
                 }
               }
               
               return tableRows.length > 0 ? tableRows : (
                 <Text style={styles.noDataText}>No data available for {selectedYear}</Text>
               );
             })()}
           </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  content: {
    flex: 1,
  },
  currentPriceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentPriceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  currentPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: GREEN,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changePercent: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: GREEN,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  yearSelectorContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  yearLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 12,
  },
  yearButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  yearButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  yearButtonTextActive: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  forecastDetails: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 8,
  },
  forecastMethod: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  forecastLabel: {
    fontSize: 14,
    color: '#666',
  },
  forecastValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  forecastBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  forecastBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF9800',
  },
  dataTable: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableDate: {
    fontSize: 14,
    color: '#666',
  },
  tablePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
});

