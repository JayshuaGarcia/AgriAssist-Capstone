import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';
const RICE_COLOR = '#4caf50';
const CORN_COLOR = '#ff9800';
const VEGETABLES_COLOR = '#2196f3';
const FRUITS_COLOR = '#e91e63';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const BAR_WIDTH = (CHART_WIDTH - 60) / 12; // 12 months

export default function CropTrendScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('yield');

  // Sample data for different crops
  const cropData = {
    rice: {
      name: 'Rice',
      color: RICE_COLOR,
      yield: [85, 92, 78, 95, 88, 91, 87, 94, 89, 96, 82, 90],
      disease: [12, 8, 15, 6, 11, 7, 13, 5, 10, 4, 16, 9],
      pest: [8, 5, 12, 3, 9, 4, 11, 2, 7, 3, 14, 6],
    },
    corn: {
      name: 'Corn',
      color: CORN_COLOR,
      yield: [72, 78, 65, 82, 75, 80, 73, 85, 77, 88, 70, 83],
      disease: [15, 11, 18, 8, 14, 9, 16, 7, 12, 6, 19, 10],
      pest: [10, 7, 13, 4, 11, 5, 12, 3, 9, 4, 15, 7],
    },
    vegetables: {
      name: 'Vegetables',
      color: VEGETABLES_COLOR,
      yield: [68, 75, 62, 78, 70, 76, 69, 80, 72, 82, 65, 77],
      disease: [18, 14, 21, 10, 17, 11, 19, 8, 15, 7, 22, 12],
      pest: [12, 8, 15, 5, 13, 6, 14, 4, 10, 3, 17, 8],
    },
    fruits: {
      name: 'Fruits',
      color: FRUITS_COLOR,
      yield: [60, 68, 55, 72, 63, 70, 61, 75, 65, 78, 58, 71],
      disease: [20, 16, 24, 12, 19, 13, 21, 10, 17, 8, 25, 14],
      pest: [14, 10, 17, 6, 15, 7, 16, 5, 12, 4, 19, 9],
    },
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const renderBarChart = (data: number[], color: string, maxValue: number) => {
    return (
      <View style={styles.chartContainer}>
        {data.map((value, index) => {
          const height = (value / maxValue) * 120; // Max height 120
          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { height, backgroundColor: color }]}>
                <Text style={styles.barValue}>{value}</Text>
              </View>
              <Text style={styles.barLabel}>{months[index]}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLineChart = (data: number[], color: string, maxValue: number) => {
    return (
      <View style={styles.lineChartContainer}>
        <View style={styles.lineChart}>
          {data.map((value, index) => {
            const y = 120 - (value / maxValue) * 120;
            const x = (index / (data.length - 1)) * CHART_WIDTH;
            
            return (
              <View key={index} style={[styles.linePoint, { left: x, top: y, backgroundColor: color }]}>
                <Text style={styles.pointValue}>{value}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.monthLabels}>
          {months.map((month, index) => (
            <Text key={index} style={styles.monthLabel}>{month}</Text>
          ))}
        </View>
      </View>
    );
  };

  const getHarvestRecommendations = () => {
    const recommendations = [
      { month: 'January', crops: ['Rice', 'Corn'], reason: 'Optimal weather conditions' },
      { month: 'February', crops: ['Vegetables', 'Fruits'], reason: 'Pre-spring preparation' },
      { month: 'March', crops: ['Rice', 'Vegetables'], reason: 'Spring planting season' },
      { month: 'April', crops: ['Corn', 'Fruits'], reason: 'Favorable rainfall' },
      { month: 'May', crops: ['Rice', 'Vegetables'], reason: 'Peak growing season' },
      { month: 'June', crops: ['Corn', 'Fruits'], reason: 'Summer harvest period' },
      { month: 'July', crops: ['Rice', 'Vegetables'], reason: 'Monsoon season benefits' },
      { month: 'August', crops: ['Corn', 'Fruits'], reason: 'Post-monsoon harvest' },
      { month: 'September', crops: ['Rice', 'Vegetables'], reason: 'Autumn planting' },
      { month: 'October', crops: ['Corn', 'Fruits'], reason: 'Fall harvest season' },
      { month: 'November', crops: ['Rice', 'Vegetables'], reason: 'Pre-winter harvest' },
      { month: 'December', crops: ['Corn', 'Fruits'], reason: 'Year-end harvest' },
    ];
    return recommendations;
  };

  const getCurrentData = () => {
    if (selectedCrop === 'all') {
      return Object.values(cropData);
    }
    return [cropData[selectedCrop as keyof typeof cropData]];
  };

  const currentData = getCurrentData();
  const maxYield = Math.max(...currentData.flatMap(crop => crop.yield));
  const maxDisease = Math.max(...currentData.flatMap(crop => crop.disease));
  const maxPest = Math.max(...currentData.flatMap(crop => crop.pest));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Crop Trend Analytics</Text>
          <Text style={styles.headerSubtitle}>Analyze crop trends and patterns.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Crop Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="filter" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Crop Selection</Text>
            </View>
            <View style={styles.cropSelector}>
              <TouchableOpacity
                style={[styles.cropOption, selectedCrop === 'all' && styles.selectedCrop]}
                onPress={() => setSelectedCrop('all')}
              >
                <Text style={[styles.cropText, selectedCrop === 'all' && styles.selectedCropText]}>
                  All Crops
                </Text>
              </TouchableOpacity>
              {Object.entries(cropData).map(([key, crop]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.cropOption, selectedCrop === key && styles.selectedCrop]}
                  onPress={() => setSelectedCrop(key)}
                >
                  <View style={[styles.cropColor, { backgroundColor: crop.color }]} />
                  <Text style={[styles.cropText, selectedCrop === key && styles.selectedCropText]}>
                    {crop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Metric Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Analytics Metrics</Text>
            </View>
            <View style={styles.metricSelector}>
              <TouchableOpacity
                style={[styles.metricOption, selectedMetric === 'yield' && styles.selectedMetric]}
                onPress={() => setSelectedMetric('yield')}
              >
                <MaterialCommunityIcons name="sprout" size={20} color={selectedMetric === 'yield' ? WHITE : GREEN} />
                <Text style={[styles.metricText, selectedMetric === 'yield' && styles.selectedMetricText]}>
                  Yield Trends
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metricOption, selectedMetric === 'disease' && styles.selectedMetric]}
                onPress={() => setSelectedMetric('disease')}
              >
                <MaterialCommunityIcons name="alert-circle" size={20} color={selectedMetric === 'disease' ? WHITE : GREEN} />
                <Text style={[styles.metricText, selectedMetric === 'disease' && styles.selectedMetricText]}>
                  Disease Frequency
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metricOption, selectedMetric === 'pest' && styles.selectedMetric]}
                onPress={() => setSelectedMetric('pest')}
              >
                <MaterialCommunityIcons name="bug" size={20} color={selectedMetric === 'pest' ? WHITE : GREEN} />
                <Text style={[styles.metricText, selectedMetric === 'pest' && styles.selectedMetricText]}>
                  Pest Incidence
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chart Display */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-bar" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>
                {selectedMetric === 'yield' ? 'Yield Trends' : 
                 selectedMetric === 'disease' ? 'Disease Frequency' : 'Pest Incidence'} 
                ({selectedCrop === 'all' ? 'All Crops' : cropData[selectedCrop as keyof typeof cropData]?.name})
              </Text>
            </View>
            
            {selectedMetric === 'yield' && (
              <View style={styles.chartWrapper}>
                {currentData.map((crop, index) => (
                  <View key={index} style={styles.chartSection}>
                    <View style={styles.chartHeader}>
                      <View style={[styles.cropIndicator, { backgroundColor: crop.color }]} />
                      <Text style={styles.chartTitle}>{crop.name} Yield (tons/ha)</Text>
                    </View>
                    {renderBarChart(crop.yield, crop.color, maxYield)}
                  </View>
                ))}
              </View>
            )}

            {selectedMetric === 'disease' && (
              <View style={styles.chartWrapper}>
                {currentData.map((crop, index) => (
                  <View key={index} style={styles.chartSection}>
                    <View style={styles.chartHeader}>
                      <View style={[styles.cropIndicator, { backgroundColor: crop.color }]} />
                      <Text style={styles.chartTitle}>{crop.name} Disease Cases</Text>
                    </View>
                    {renderLineChart(crop.disease, crop.color, maxDisease)}
                  </View>
                ))}
              </View>
            )}

            {selectedMetric === 'pest' && (
              <View style={styles.chartWrapper}>
                {currentData.map((crop, index) => (
                  <View key={index} style={styles.chartSection}>
                    <View style={styles.chartHeader}>
                      <View style={[styles.cropIndicator, { backgroundColor: crop.color }]} />
                      <Text style={styles.chartTitle}>{crop.name} Pest Reports</Text>
                    </View>
                    {renderBarChart(crop.pest, crop.color, maxPest)}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Seasonality Analysis */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Seasonality Analysis</Text>
            </View>
            <View style={styles.seasonalityContainer}>
              <View style={styles.seasonCard}>
                <Text style={styles.seasonTitle}>Peak Harvest Months</Text>
                <Text style={styles.seasonText}>March, June, September, December</Text>
              </View>
              <View style={styles.seasonCard}>
                <Text style={styles.seasonTitle}>High Disease Risk</Text>
                <Text style={styles.seasonText}>July-August (Monsoon)</Text>
              </View>
              <View style={styles.seasonCard}>
                <Text style={styles.seasonTitle}>Optimal Planting</Text>
                <Text style={styles.seasonText}>January, April, October</Text>
              </View>
            </View>
          </View>

          {/* Harvest Recommendations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Monthly Harvest Recommendations</Text>
            </View>
            <View style={styles.recommendationsContainer}>
              {getHarvestRecommendations().map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationMonth}>{rec.month}</Text>
                    <View style={styles.cropTags}>
                      {rec.crops.map((crop, cropIndex) => (
                        <View key={cropIndex} style={styles.cropTag}>
                          <Text style={styles.cropTagText}>{crop}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.recommendationReason}>{rec.reason}</Text>
                </View>
              ))}
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
  cropColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cropText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedCropText: {
    color: WHITE,
  },
  metricSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  metricOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GREEN,
    gap: 6,
  },
  selectedMetric: {
    backgroundColor: GREEN,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  selectedMetricText: {
    color: WHITE,
  },
  chartWrapper: {
    gap: 20,
  },
  chartSection: {
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cropIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 10,
    gap: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 20,
  },
  barValue: {
    color: WHITE,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  lineChartContainer: {
    height: 140,
    position: 'relative',
  },
  lineChart: {
    height: 120,
    position: 'relative',
  },
  linePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointValue: {
    position: 'absolute',
    top: -20,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  monthLabel: {
    fontSize: 10,
    color: '#666',
  },
  seasonalityContainer: {
    gap: 12,
  },
  seasonCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  seasonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 4,
  },
  seasonText: {
    fontSize: 14,
    color: '#666',
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
  },
  cropTags: {
    flexDirection: 'row',
    gap: 6,
  },
  cropTag: {
    backgroundColor: GREEN,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cropTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: WHITE,
  },
  recommendationReason: {
    fontSize: 14,
    color: '#666',
  },
}); 