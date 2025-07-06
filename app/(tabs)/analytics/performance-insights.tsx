import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';
const SUCCESS_COLOR = '#4caf50';
const WARNING_COLOR = '#ff9800';
const INFO_COLOR = '#2196f3';
const EXCELLENT_COLOR = '#9c27b0';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const BAR_WIDTH = (CHART_WIDTH - 60) / 7; // 7 days

export default function PerformanceInsightsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState('productivity');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Sample farmer performance data
  const farmerData = [
    {
      id: 1,
      name: 'Juan Dela Cruz',
      avatar: '👨‍🌾',
      productivity: 95,
      activityFrequency: 88,
      harvestYield: 92,
      efficiency: 89,
      weeklyActivity: [85, 92, 78, 95, 88, 91, 87],
      monthlyHarvest: [420, 450, 380, 480, 440, 460, 430, 470, 445, 475, 410, 465],
      crops: ['Rice', 'Corn'],
      status: 'Excellent',
      color: EXCELLENT_COLOR,
    },
    {
      id: 2,
      name: 'Maria Santos',
      avatar: '👩‍🌾',
      productivity: 87,
      activityFrequency: 92,
      harvestYield: 85,
      efficiency: 90,
      weeklyActivity: [82, 88, 85, 90, 87, 89, 84],
      monthlyHarvest: [380, 410, 395, 420, 405, 430, 415, 440, 425, 450, 400, 435],
      crops: ['Vegetables', 'Fruits'],
      status: 'Good',
      color: SUCCESS_COLOR,
    },
    {
      id: 3,
      name: 'Pedro Garcia',
      avatar: '👨‍🌾',
      productivity: 78,
      activityFrequency: 75,
      harvestYield: 82,
      efficiency: 76,
      weeklyActivity: [72, 78, 75, 80, 77, 82, 74],
      monthlyHarvest: [320, 350, 335, 370, 355, 380, 365, 390, 375, 400, 340, 385],
      crops: ['Corn'],
      status: 'Average',
      color: WARNING_COLOR,
    },
    {
      id: 4,
      name: 'Ana Reyes',
      avatar: '👩‍🌾',
      productivity: 92,
      activityFrequency: 85,
      harvestYield: 88,
      efficiency: 87,
      weeklyActivity: [88, 90, 85, 92, 89, 91, 86],
      monthlyHarvest: [400, 430, 415, 450, 435, 460, 445, 470, 455, 480, 420, 465],
      crops: ['Rice', 'Vegetables'],
      status: 'Excellent',
      color: EXCELLENT_COLOR,
    },
  ];

  const metrics = [
    { key: 'productivity', label: 'Productivity', icon: 'chart-line', color: SUCCESS_COLOR },
    { key: 'activityFrequency', label: 'Activity Frequency', icon: 'calendar-check', color: INFO_COLOR },
    { key: 'harvestYield', label: 'Harvest Yield', icon: 'sprout', color: GREEN },
    { key: 'efficiency', label: 'Efficiency', icon: 'speedometer', color: WARNING_COLOR },
  ];

  const periods = [
    { key: 'weekly', label: 'Weekly', icon: 'calendar-week' },
    { key: 'monthly', label: 'Monthly', icon: 'calendar-month' },
    { key: 'quarterly', label: 'Quarterly', icon: 'calendar-quarter' },
  ];

  const renderBarChart = (data: number[], color: string, maxValue: number, labels: string[]) => {
    const availableWidth = width - 160; // More conservative width
    const barHeight = 14;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Bars */}
          <View style={styles.barsContainer}>
            {data.map((value, index) => {
              const barWidth = Math.min((value / maxValue) * availableWidth, availableWidth);
              const barColor = value >= 90 ? EXCELLENT_COLOR : 
                              value >= 80 ? SUCCESS_COLOR : 
                              value >= 70 ? WARNING_COLOR : '#f44336';
              
              return (
                <View key={index} style={styles.barRow}>
                  <Text style={styles.barLabel}>{labels[index]}</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { 
                      width: barWidth, 
                      backgroundColor: barColor,
                      height: barHeight,
                    }]} />
                    <Text style={styles.barValue}>{value}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderPerformanceCard = (farmer: typeof farmerData[0]) => {
    const getMetricValue = (metric: string) => {
      switch (metric) {
        case 'productivity': return farmer.productivity;
        case 'activityFrequency': return farmer.activityFrequency;
        case 'harvestYield': return farmer.harvestYield;
        case 'efficiency': return farmer.efficiency;
        default: return 0;
      }
    };

    const getMetricColor = (value: number) => {
      if (value >= 90) return EXCELLENT_COLOR;
      if (value >= 80) return SUCCESS_COLOR;
      if (value >= 70) return WARNING_COLOR;
      return '#f44336';
    };

    const currentValue = getMetricValue(selectedMetric);
    const currentColor = getMetricColor(currentValue);

    return (
      <View key={farmer.id} style={styles.farmerCard}>
        <View style={styles.farmerHeader}>
          <View style={styles.farmerInfo}>
            <Text style={styles.farmerAvatar}>{farmer.avatar}</Text>
            <View style={styles.farmerDetails}>
              <Text style={styles.farmerName}>{farmer.name}</Text>
              <Text style={styles.farmerCrops}>{farmer.crops.join(', ')}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: farmer.color }]}>
            <Text style={styles.statusText}>{farmer.status}</Text>
          </View>
        </View>
        
        <View style={styles.metricDisplay}>
          <View style={styles.metricCircle}>
            <Text style={[styles.metricValue, { color: currentColor }]}>{currentValue}%</Text>
            <Text style={styles.metricLabel}>{metrics.find(m => m.key === selectedMetric)?.label}</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>
            {selectedPeriod === 'weekly' ? 'Weekly Activity' : 'Monthly Harvest'} Trend
          </Text>
          {renderBarChart(
            selectedPeriod === 'weekly' ? farmer.weeklyActivity : farmer.monthlyHarvest,
            currentColor,
            Math.max(...(selectedPeriod === 'weekly' ? farmer.weeklyActivity : farmer.monthlyHarvest)),
            selectedPeriod === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : 
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          )}
        </View>
      </View>
    );
  };

  const getTopPerformers = () => {
    return farmerData
      .sort((a, b) => getMetricValue(b) - getMetricValue(a))
      .slice(0, 3);
  };

  const getMetricValue = (farmer: typeof farmerData[0]) => {
    switch (selectedMetric) {
      case 'productivity': return farmer.productivity;
      case 'activityFrequency': return farmer.activityFrequency;
      case 'harvestYield': return farmer.harvestYield;
      case 'efficiency': return farmer.efficiency;
      default: return 0;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Farmer Performance Insight</Text>
          <Text style={styles.headerSubtitle}>Analyze farmer performance metrics.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Metric Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
            </View>
            
            <View style={styles.metricSelector}>
              {metrics.map((metric) => (
                <TouchableOpacity
                  key={metric.key}
                  style={[styles.metricOption, selectedMetric === metric.key && styles.selectedMetric]}
                  onPress={() => setSelectedMetric(metric.key)}
                >
                  <MaterialCommunityIcons 
                    name={metric.icon as any} 
                    size={20} 
                    color={selectedMetric === metric.key ? WHITE : metric.color} 
                  />
                  <Text style={[styles.metricText, selectedMetric === metric.key && styles.selectedMetricText]}>
                    {metric.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Period Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Time Period</Text>
            </View>
            
            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[styles.periodOption, selectedPeriod === period.key && styles.selectedPeriod]}
                  onPress={() => setSelectedPeriod(period.key)}
                >
                  <MaterialCommunityIcons 
                    name={period.icon as any} 
                    size={20} 
                    color={selectedPeriod === period.key ? WHITE : GREEN} 
                  />
                  <Text style={[styles.periodText, selectedPeriod === period.key && styles.selectedPeriodText]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Top Performers */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="trophy" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Top Performers</Text>
            </View>
            
            <View style={styles.topPerformersContainer}>
              {getTopPerformers().map((farmer, index) => (
                <View key={farmer.id} style={styles.topPerformerCard}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.topPerformerAvatar}>{farmer.avatar}</Text>
                  <Text style={styles.topPerformerName}>{farmer.name}</Text>
                  <Text style={styles.topPerformerScore}>{getMetricValue(farmer)}%</Text>
                  <Text style={styles.topPerformerMetric}>
                    {metrics.find(m => m.key === selectedMetric)?.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Individual Farmer Performance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-group" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Individual Performance Analysis</Text>
            </View>
            
            <View style={styles.farmersContainer}>
              {farmerData.map(renderPerformanceCard)}
            </View>
          </View>

          {/* Performance Insights */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Performance Insights</Text>
            </View>
            
            <View style={styles.insightsContainer}>
              <View style={styles.insightCard}>
                <MaterialCommunityIcons name="trending-up" size={24} color={SUCCESS_COLOR} />
                <Text style={styles.insightTitle}>High Activity = High Yield</Text>
                <Text style={styles.insightText}>
                  Farmers with 85%+ activity frequency show 20% higher harvest yields on average.
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <MaterialCommunityIcons name="clock-outline" size={24} color={INFO_COLOR} />
                <Text style={styles.insightTitle}>Consistency Matters</Text>
                <Text style={styles.insightText}>
                  Regular daily activities lead to better crop management and disease prevention.
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <MaterialCommunityIcons name="target" size={24} color={WARNING_COLOR} />
                <Text style={styles.insightTitle}>Efficiency Optimization</Text>
                <Text style={styles.insightText}>
                  Top performers focus on resource optimization and timely interventions.
                </Text>
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
  metricSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    gap: 6,
  },
  selectedMetric: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedMetricText: {
    color: WHITE,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodOption: {
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
  selectedPeriod: {
    backgroundColor: GREEN,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  selectedPeriodText: {
    color: WHITE,
  },
  topPerformersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  topPerformerCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: EXCELLENT_COLOR,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: WHITE,
  },
  topPerformerAvatar: {
    fontSize: 32,
    marginBottom: 4,
  },
  topPerformerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  topPerformerScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  topPerformerMetric: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  farmersContainer: {
    gap: 20,
  },
  farmerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
  },
  farmerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  farmerAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  farmerDetails: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  farmerCrops: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: WHITE,
  },
  metricDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  metricCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#e9ecef',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  chartSection: {
    gap: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    paddingHorizontal: 12,
  },
  chartArea: {
    position: 'relative',
  },
  barsContainer: {
    paddingVertical: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    maxWidth: width - 100,
  },
  bar: {
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  barValue: {
    color: '#333',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    minWidth: 18,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    minWidth: 30,
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 8,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 