import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { forecastingService, ForecastResult } from '../services/forecastingService';

const { width } = Dimensions.get('window');
const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

interface PriceData {
  commodity: string;
  specification: string;
  price: number;
  unit: string;
  region: string;
  date: string;
}

// Use ForecastResult from the service

interface ForecastingCalendarProps {
  visible: boolean;
  onClose: () => void;
  commodity: string;
  specification: string;
  currentPrice: number;
  unit: string;
}

export const ForecastingCalendar: React.FC<ForecastingCalendarProps> = ({
  visible,
  onClose,
  commodity,
  specification,
  currentPrice,
  unit,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load historical data for analysis
  useEffect(() => {
    if (visible) {
      loadHistoricalData();
    }
  }, [visible, commodity, specification]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      await forecastingService.loadHistoricalData();
      console.log('✅ Historical data loaded for forecasting');
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = (targetDate: string): ForecastResult => {
    return forecastingService.generateForecast(
      commodity,
      specification,
      targetDate,
      currentPrice
    );
  };


  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const forecast = generateForecast(date);
    setForecastData(forecast);
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const getMonthYearString = () => {
    return currentMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const generateWeeklyForecasts = () => {
    const today = new Date();
    const weeklyForecasts = [];
    
    // Generate next 3 weeks
    for (let week = 0; week < 3; week++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (week * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Generate forecasts for start and end dates only
      const startForecast = generateForecast(weekStart.toISOString().split('T')[0]);
      const endForecast = generateForecast(weekEnd.toISOString().split('T')[0]);
      
      weeklyForecasts.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        startPrice: startForecast.predictedPrice,
        endPrice: endForecast.predictedPrice,
        startTrend: startForecast.trend,
        endTrend: endForecast.trend,
        startConfidence: startForecast.confidence,
        endConfidence: endForecast.confidence
      });
    }
    
    return weeklyForecasts;
  };

  const generateCalendarWeeks = () => {
    const weeks = [];
    const today = new Date();
    
    // Get the first day of the current month
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Start from the beginning of the week containing the first day
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // Generate 6 weeks to cover the entire month
    for (let week = 0; week < 6; week++) {
      const weekDates = [];
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        // Show all dates in the current month
        if (currentDate.getMonth() === currentMonth.getMonth() && 
            currentDate.getFullYear() === currentMonth.getFullYear()) {
          weekDates.push(currentDate.toISOString().split('T')[0]);
        } else {
          weekDates.push(null); // Empty cell for other months
        }
      }
      
      weeks.push(weekDates);
    }
    
    return weeks;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
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
      case 'up': return '#e74c3c';
      case 'down': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Price Forecast</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.commodityInfo}>
          <Text style={styles.commodityName}>{commodity}</Text>
          <Text style={styles.specification}>{specification}</Text>
          <Text style={styles.currentPrice}>Current: ₱{currentPrice.toFixed(2)}/{unit}</Text>
        </View>

          <ScrollView style={styles.calendarContainer}>
            <Text style={styles.calendarTitle}>Select Date for Forecast</Text>
            
            <View style={styles.calendarWrapper}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarHeaderText}>📅 Price Forecast Calendar</Text>
            </View>
            
            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity 
                style={styles.monthNavButton}
                onPress={goToPreviousMonth}
              >
                <Ionicons name="chevron-back" size={24} color={GREEN} />
              </TouchableOpacity>
              
              <Text style={styles.monthYearText}>{getMonthYearString()}</Text>
              
              <TouchableOpacity 
                style={styles.monthNavButton}
                onPress={goToNextMonth}
              >
                <Ionicons name="chevron-forward" size={24} color={GREEN} />
              </TouchableOpacity>
            </View>
            
            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.dayHeaderText}>{day}</Text>
                ))}
              </View>
              
              {/* Calendar Days */}
              {generateCalendarWeeks().map((week, weekIndex) => (
                <View key={weekIndex} style={styles.calendarWeek}>
                  {week.map((date, dayIndex) => (
                    <TouchableOpacity
                      key={date || `empty-${weekIndex}-${dayIndex}`}
                      style={[
                        styles.calendarDay,
                        selectedDate === date && styles.selectedCalendarDay,
                        !date && styles.emptyDay,
                        date && new Date(date) < new Date() && styles.pastDay
                      ]}
                      onPress={() => date && new Date(date) >= new Date() && handleDateSelect(date)}
                      disabled={!date || new Date(date) < new Date()}
                    >
                      {date && (
                        <Text style={[
                          styles.calendarDayNumber,
                          selectedDate === date && styles.selectedDayNumber,
                          new Date(date) < new Date() && styles.pastDayNumber
                        ]}>
                          {new Date(date).getDate()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Weekly Forecast Summary */}
          <View style={styles.weeklyForecastContainer}>
            <Text style={styles.weeklyForecastTitle}>📊 Next 3 Weeks Forecast</Text>
            {generateWeeklyForecasts().map((week, index) => (
              <View key={index} style={styles.weeklyForecastCard}>
                <View style={styles.weeklyForecastHeader}>
                  <Text style={styles.weeklyForecastWeek}>
                    Week {index + 1}: {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                  </Text>
                </View>
                <View style={styles.weeklyForecastPrices}>
                  <View style={styles.weeklyForecastPriceItem}>
                    <Text style={styles.weeklyForecastDate}>{formatDate(week.weekStart)}</Text>
                    <View style={styles.weeklyForecastPriceRow}>
                      <Text style={styles.weeklyForecastPriceText}>₱{week.startPrice.toFixed(2)}</Text>
                      <Ionicons 
                        name={week.startTrend === 'up' ? 'arrow-up' : week.startTrend === 'down' ? 'arrow-down' : 'remove'} 
                        size={16} 
                        color={week.startTrend === 'up' ? '#28a745' : week.startTrend === 'down' ? '#dc3545' : '#6c757d'} 
                      />
                    </View>
                  </View>
                  <Text style={styles.weeklyForecastSeparator}>-</Text>
                  <View style={styles.weeklyForecastPriceItem}>
                    <Text style={styles.weeklyForecastDate}>{formatDate(week.weekEnd)}</Text>
                    <View style={styles.weeklyForecastPriceRow}>
                      <Text style={styles.weeklyForecastPriceText}>₱{week.endPrice.toFixed(2)}</Text>
                      <Ionicons 
                        name={week.endTrend === 'up' ? 'arrow-up' : week.endTrend === 'down' ? 'arrow-down' : 'remove'} 
                        size={16} 
                        color={week.endTrend === 'up' ? '#28a745' : week.endTrend === 'down' ? '#dc3545' : '#6c757d'} 
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {forecastData && (
            <View style={styles.forecastCard}>
              <Text style={styles.forecastTitle}>Forecast for {formatDate(forecastData.date)}</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.forecastPrice}>
                  ₱{forecastData.predictedPrice.toFixed(2)}/{unit}
                </Text>
                <View style={styles.trendContainer}>
                  <Ionicons 
                    name={getTrendIcon(forecastData.trend)} 
                    size={20} 
                    color={getTrendColor(forecastData.trend)} 
                  />
                  <Text style={[styles.trendText, { color: getTrendColor(forecastData.trend) }]}>
                    {forecastData.trend.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Confidence:</Text>
                <Text style={styles.confidenceValue}>{forecastData.confidence}%</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  commodityInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  commodityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 4,
  },
  specification: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  calendarContainer: {
    flex: 1,
    padding: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 15,
  },
  calendarWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  calendarHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  calendarGrid: {
    backgroundColor: '#fff',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    paddingVertical: 8,
  },
  calendarWeek: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: 6,
  },
  selectedCalendarDay: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  emptyDay: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  calendarDayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDayNumber: {
    color: '#fff',
  },
  pastDay: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  pastDayNumber: {
    color: '#ccc',
  },
  weeklyForecastContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyForecastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 12,
    textAlign: 'center',
  },
  weeklyForecastCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  weeklyForecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyForecastWeek: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  weeklyForecastConfidence: {
    fontSize: 12,
    color: GREEN,
    fontWeight: 'bold',
  },
  weeklyForecastPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  weeklyForecastPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  weeklyForecastUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  weeklyForecastAvg: {
    fontSize: 12,
    color: '#666',
  },
  weeklyForecastPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  weeklyForecastPriceItem: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyForecastDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weeklyForecastPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weeklyForecastSeparator: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  forecastCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  forecastPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
  },
  factorsContainer: {
    marginBottom: 15,
  },
  factorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
  },
  factorItem: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  adjustmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adjustmentLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  adjustmentValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataPointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  dataPointsLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  dataPointsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
  },
});
