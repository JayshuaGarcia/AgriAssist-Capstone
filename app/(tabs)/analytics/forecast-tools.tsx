import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';
const WARNING_COLOR = '#ff9800';
const SUCCESS_COLOR = '#4caf50';
const INFO_COLOR = '#2196f3';

const { width } = Dimensions.get('window');

export default function ForecastToolsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [selectedSeason, setSelectedSeason] = useState('current');

  // Crop data with planting and harvesting windows
  const cropData = {
    rice: {
      name: 'Rice',
      icon: 'rice',
      color: '#4caf50',
      plantingWindows: [
        { period: 'Early Season', months: 'Jan-Feb', conditions: 'Optimal rainfall, moderate temperature', risk: 'Low' },
        { period: 'Main Season', months: 'Mar-Apr', conditions: 'Peak planting season, high success rate', risk: 'Very Low' },
        { period: 'Late Season', months: 'May-Jun', conditions: 'Late planting, requires irrigation', risk: 'Medium' },
      ],
      harvestingWindows: [
        { period: 'Early Harvest', months: 'Apr-May', conditions: 'Early maturing varieties', risk: 'Low' },
        { period: 'Main Harvest', months: 'Jun-Jul', conditions: 'Optimal grain quality', risk: 'Very Low' },
        { period: 'Late Harvest', months: 'Aug-Sep', conditions: 'Extended growing period', risk: 'Medium' },
      ],
      growthDuration: '90-120 days',
      waterRequirement: 'High',
      temperatureRange: '20-35°C',
    },
    corn: {
      name: 'Corn',
      icon: 'corn',
      color: '#ff9800',
      plantingWindows: [
        { period: 'Spring Planting', months: 'Mar-Apr', conditions: 'Optimal soil temperature', risk: 'Low' },
        { period: 'Summer Planting', months: 'May-Jun', conditions: 'Warm weather, good growth', risk: 'Medium' },
        { period: 'Late Summer', months: 'Jul-Aug', conditions: 'Late season, shorter days', risk: 'High' },
      ],
      harvestingWindows: [
        { period: 'Early Harvest', months: 'Jun-Jul', conditions: 'Sweet corn varieties', risk: 'Low' },
        { period: 'Main Harvest', months: 'Aug-Sep', conditions: 'Grain corn, optimal yield', risk: 'Very Low' },
        { period: 'Late Harvest', months: 'Oct-Nov', conditions: 'Extended season', risk: 'Medium' },
      ],
      growthDuration: '80-110 days',
      waterRequirement: 'Medium',
      temperatureRange: '18-32°C',
    },
    vegetables: {
      name: 'Vegetables',
      icon: 'carrot',
      color: '#2196f3',
      plantingWindows: [
        { period: 'Early Spring', months: 'Feb-Mar', conditions: 'Cool season vegetables', risk: 'Low' },
        { period: 'Late Spring', months: 'Apr-May', conditions: 'Warm season vegetables', risk: 'Low' },
        { period: 'Fall Planting', months: 'Aug-Sep', conditions: 'Autumn vegetables', risk: 'Medium' },
      ],
      harvestingWindows: [
        { period: 'Spring Harvest', months: 'Apr-Jun', conditions: 'Early season crops', risk: 'Low' },
        { period: 'Summer Harvest', months: 'Jun-Aug', conditions: 'Peak vegetable season', risk: 'Very Low' },
        { period: 'Fall Harvest', months: 'Sep-Nov', conditions: 'Late season vegetables', risk: 'Medium' },
      ],
      growthDuration: '30-90 days',
      waterRequirement: 'Medium-High',
      temperatureRange: '15-30°C',
    },
    fruits: {
      name: 'Fruits',
      icon: 'fruit-cherries',
      color: '#e91e63',
      plantingWindows: [
        { period: 'Dormant Season', months: 'Dec-Feb', conditions: 'Bare root planting', risk: 'Low' },
        { period: 'Early Spring', months: 'Mar-Apr', conditions: 'Container planting', risk: 'Low' },
        { period: 'Late Spring', months: 'May-Jun', conditions: 'Late season planting', risk: 'Medium' },
      ],
      harvestingWindows: [
        { period: 'Early Season', months: 'May-Jul', conditions: 'Early ripening varieties', risk: 'Low' },
        { period: 'Mid Season', months: 'Jul-Sep', conditions: 'Peak fruit season', risk: 'Very Low' },
        { period: 'Late Season', months: 'Sep-Nov', conditions: 'Late ripening fruits', risk: 'Medium' },
      ],
      growthDuration: '2-5 years',
      waterRequirement: 'Medium',
      temperatureRange: '10-35°C',
    },
  };

  // Weather forecast data
  const weatherForecast = {
    current: {
      temperature: '28°C',
      humidity: '75%',
      rainfall: '15mm',
      windSpeed: '12 km/h',
      condition: 'Partly Cloudy',
      icon: 'weather-partly-cloudy',
    },
    nextWeek: [
      { day: 'Mon', temp: '27°C', condition: 'Sunny', icon: 'weather-sunny' },
      { day: 'Tue', temp: '29°C', condition: 'Partly Cloudy', icon: 'weather-partly-cloudy' },
      { day: 'Wed', temp: '26°C', condition: 'Rainy', icon: 'weather-rainy' },
      { day: 'Thu', temp: '25°C', condition: 'Rainy', icon: 'weather-rainy' },
      { day: 'Fri', temp: '28°C', condition: 'Cloudy', icon: 'weather-cloudy' },
      { day: 'Sat', temp: '30°C', condition: 'Sunny', icon: 'weather-sunny' },
      { day: 'Sun', temp: '29°C', condition: 'Partly Cloudy', icon: 'weather-partly-cloudy' },
    ],
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Very Low': return SUCCESS_COLOR;
      case 'Low': return INFO_COLOR;
      case 'Medium': return WARNING_COLOR;
      case 'High': return '#f44336';
      default: return '#666';
    }
  };

  const getCurrentRecommendations = () => {
    const currentMonth = new Date().getMonth(); // 0-11
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthName = monthNames[currentMonth];
    
    const recommendations: Array<{
      crop: string;
      action: string;
      windows: Array<{ period: string; months: string; conditions: string; risk: string }>;
      icon: string;
      color: string;
    }> = [];
    
    Object.entries(cropData).forEach(([key, crop]) => {
      const plantingWindows = crop.plantingWindows.filter(window => 
        window.months.includes(currentMonthName) || 
        window.months.includes(monthNames[(currentMonth + 1) % 12])
      );
      
      if (plantingWindows.length > 0) {
        recommendations.push({
          crop: crop.name,
          action: 'Planting',
          windows: plantingWindows,
          icon: crop.icon,
          color: crop.color,
        });
      }
      
      const harvestingWindows = crop.harvestingWindows.filter(window => 
        window.months.includes(currentMonthName) || 
        window.months.includes(monthNames[(currentMonth + 1) % 12])
      );
      
      if (harvestingWindows.length > 0) {
        recommendations.push({
          crop: crop.name,
          action: 'Harvesting',
          windows: harvestingWindows,
          icon: crop.icon,
          color: crop.color,
        });
      }
    });
    
    return recommendations;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Forecast Tools</Text>
          <Text style={styles.headerSubtitle}>Weather and planting forecasts.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Weather Forecast */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="weather-cloudy" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Weather Forecast</Text>
            </View>
            
            <View style={styles.weatherContainer}>
              <View style={styles.currentWeather}>
                <MaterialCommunityIcons name={weatherForecast.current.icon as any} size={48} color={INFO_COLOR} />
                <View style={styles.weatherInfo}>
                  <Text style={styles.temperature}>{weatherForecast.current.temperature}</Text>
                  <Text style={styles.condition}>{weatherForecast.current.condition}</Text>
                  <Text style={styles.weatherDetails}>
                    Humidity: {weatherForecast.current.humidity} | 
                    Rainfall: {weatherForecast.current.rainfall} | 
                    Wind: {weatherForecast.current.windSpeed}
                  </Text>
                </View>
              </View>
              
              <View style={styles.weeklyForecast}>
                <Text style={styles.forecastTitle}>7-Day Forecast</Text>
                <View style={styles.forecastDays}>
                  {weatherForecast.nextWeek.map((day, index) => (
                    <View key={index} style={styles.forecastDay}>
                      <Text style={styles.dayLabel}>{day.day}</Text>
                      <MaterialCommunityIcons name={day.icon as any} size={24} color={INFO_COLOR} />
                      <Text style={styles.dayTemp}>{day.temp}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Current Recommendations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Current Month Recommendations</Text>
            </View>
            
            <View style={styles.recommendationsContainer}>
              {getCurrentRecommendations().map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <MaterialCommunityIcons name={rec.icon as any} size={24} color={rec.color} />
                    <View style={styles.recommendationInfo}>
                      <Text style={styles.recommendationCrop}>{rec.crop}</Text>
                      <Text style={styles.recommendationAction}>{rec.action} Windows</Text>
                    </View>
                  </View>
                  {rec.windows.map((window: { period: string; months: string; conditions: string; risk: string }, windowIndex: number) => (
                    <View key={windowIndex} style={styles.windowItem}>
                      <View style={styles.windowHeader}>
                        <Text style={styles.windowPeriod}>{window.period}</Text>
                        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(window.risk) }]}>
                          <Text style={styles.riskText}>{window.risk}</Text>
                        </View>
                      </View>
                      <Text style={styles.windowMonths}>{window.months}</Text>
                      <Text style={styles.windowConditions}>{window.conditions}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Crop Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="filter" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Crop-Specific Forecasts</Text>
            </View>
            
            <View style={styles.cropSelector}>
              {Object.entries(cropData).map(([key, crop]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.cropOption, selectedCrop === key && styles.selectedCrop]}
                  onPress={() => setSelectedCrop(key)}
                >
                  <MaterialCommunityIcons name={crop.icon as any} size={20} color={selectedCrop === key ? WHITE : crop.color} />
                  <Text style={[styles.cropText, selectedCrop === key && styles.selectedCropText]}>
                    {crop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selected Crop Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>
                {cropData[selectedCrop as keyof typeof cropData]?.name} - Planting & Harvesting Windows
              </Text>
            </View>
            
            <View style={styles.cropDetails}>
              <View style={styles.cropInfo}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={GREEN} />
                  <Text style={styles.infoText}>Growth Duration: {cropData[selectedCrop as keyof typeof cropData]?.growthDuration}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="water" size={20} color={INFO_COLOR} />
                  <Text style={styles.infoText}>Water Requirement: {cropData[selectedCrop as keyof typeof cropData]?.waterRequirement}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="thermometer" size={20} color={WARNING_COLOR} />
                  <Text style={styles.infoText}>Temperature Range: {cropData[selectedCrop as keyof typeof cropData]?.temperatureRange}</Text>
                </View>
              </View>
              
              <View style={styles.windowsContainer}>
                <Text style={styles.windowsTitle}>Planting Windows</Text>
                {cropData[selectedCrop as keyof typeof cropData]?.plantingWindows.map((window, index) => (
                  <View key={index} style={styles.windowCard}>
                    <View style={styles.windowCardHeader}>
                      <Text style={styles.windowCardPeriod}>{window.period}</Text>
                      <View style={[styles.riskBadge, { backgroundColor: getRiskColor(window.risk) }]}>
                        <Text style={styles.riskText}>{window.risk}</Text>
                      </View>
                    </View>
                    <Text style={styles.windowCardMonths}>{window.months}</Text>
                    <Text style={styles.windowCardConditions}>{window.conditions}</Text>
                  </View>
                ))}
                
                <Text style={styles.windowsTitle}>Harvesting Windows</Text>
                {cropData[selectedCrop as keyof typeof cropData]?.harvestingWindows.map((window, index) => (
                  <View key={index} style={styles.windowCard}>
                    <View style={styles.windowCardHeader}>
                      <Text style={styles.windowCardPeriod}>{window.period}</Text>
                      <View style={[styles.riskBadge, { backgroundColor: getRiskColor(window.risk) }]}>
                        <Text style={styles.riskText}>{window.risk}</Text>
                      </View>
                    </View>
                    <Text style={styles.windowCardMonths}>{window.months}</Text>
                    <Text style={styles.windowCardConditions}>{window.conditions}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Seasonal Planning Tips */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-month" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Seasonal Planning Tips</Text>
            </View>
            
            <View style={styles.tipsContainer}>
              <View style={styles.tipCard}>
                <MaterialCommunityIcons name="sprout" size={24} color={SUCCESS_COLOR} />
                <Text style={styles.tipTitle}>Spring Planning</Text>
                <Text style={styles.tipText}>Focus on early season crops like rice and vegetables. Monitor soil temperature and moisture levels.</Text>
              </View>
              
              <View style={styles.tipCard}>
                <MaterialCommunityIcons name="weather-sunny" size={24} color={WARNING_COLOR} />
                <Text style={styles.tipTitle}>Summer Management</Text>
                <Text style={styles.tipText}>Ensure adequate irrigation for corn and fruits. Watch for pest outbreaks during warm weather.</Text>
              </View>
              
              <View style={styles.tipCard}>
                <MaterialCommunityIcons name="leaf" size={24} color={INFO_COLOR} />
                <Text style={styles.tipTitle}>Fall Preparation</Text>
                <Text style={styles.tipText}>Plan for autumn vegetables and prepare for winter crops. Consider crop rotation strategies.</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: 'space-between',
  },
  logo: {
    width: 54,
    height: 54,
    marginRight: 8,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2f1',
    marginTop: 2,
    textAlign: 'center',
  },
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eee',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginLeft: 12,
  },
  weatherContainer: {
    gap: 20,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  weatherInfo: {
    marginLeft: 16,
    flex: 1,
  },
  temperature: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  condition: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  weatherDetails: {
    fontSize: 12,
    color: '#999',
  },
  weeklyForecast: {
    gap: 12,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  forecastDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastDay: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayTemp: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  recommendationsContainer: {
    gap: 16,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationCrop: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendationAction: {
    fontSize: 14,
    color: '#666',
  },
  windowItem: {
    backgroundColor: WHITE,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  windowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  windowPeriod: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  riskText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: WHITE,
  },
  windowMonths: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '600',
    marginBottom: 4,
  },
  windowConditions: {
    fontSize: 12,
    color: '#666',
  },
  cropSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    gap: 6,
  },
  selectedCrop: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  cropText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedCropText: {
    color: WHITE,
  },
  cropDetails: {
    gap: 20,
  },
  cropInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  windowsContainer: {
    gap: 16,
  },
  windowsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 12,
  },
  windowCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  windowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  windowCardPeriod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  windowCardMonths: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
    marginBottom: 4,
  },
  windowCardConditions: {
    fontSize: 14,
    color: '#666',
  },
  tipsContainer: {
    gap: 16,
  },
  tipCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 8,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 