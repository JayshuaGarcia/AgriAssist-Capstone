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

  const generateCalendarWeeks = () => {
    const weeks = [];
    const today = new Date();
    const startDate = new Date(today);
    
    // Start from the beginning of the current week
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // Generate 12 weeks (84 days)
    for (let week = 0; week < 12; week++) {
      const weekDates = [];
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        // Only show dates that are today or in the future
        if (currentDate >= today) {
          weekDates.push(currentDate.toISOString().split('T')[0]);
        } else {
          weekDates.push(null); // Empty cell for past dates
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
                      key={date}
                      style={[
                        styles.calendarDay,
                        selectedDate === date && styles.selectedCalendarDay,
                        !date && styles.emptyDay
                      ]}
                      onPress={() => date && handleDateSelect(date)}
                      disabled={!date}
                    >
                      {date && (
                        <>
                          <Text style={[
                            styles.calendarDayNumber,
                            selectedDate === date && styles.selectedDayNumber
                          ]}>
                            {new Date(date).getDate()}
                          </Text>
                          <Text style={[
                            styles.calendarDayMonth,
                            selectedDate === date && styles.selectedDayMonth
                          ]}>
                            {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
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

              <View style={styles.factorsContainer}>
                <Text style={styles.factorsTitle}>Key Factors:</Text>
                {forecastData.factors.map((factor, index) => (
                  <Text key={index} style={styles.factorItem}>
                    • {factor}
                  </Text>
                ))}
              </View>

              <View style={styles.adjustmentContainer}>
                <Text style={styles.adjustmentLabel}>Seasonal Adjustment:</Text>
                <Text style={[
                  styles.adjustmentValue,
                  { color: forecastData.seasonalAdjustment >= 0 ? '#e74c3c' : '#27ae60' }
                ]}>
                  {forecastData.seasonalAdjustment >= 0 ? '+' : ''}{forecastData.seasonalAdjustment}%
                </Text>
              </View>

              {forecastData.historicalDataPoints > 0 && (
                <View style={styles.dataPointsContainer}>
                  <Text style={styles.dataPointsLabel}>Data Quality:</Text>
                  <Text style={styles.dataPointsValue}>
                    {forecastData.historicalDataPoints} historical data points
                  </Text>
                </View>
              )}
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
  calendarDayMonth: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  selectedDayMonth: {
    color: '#fff',
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
