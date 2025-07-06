import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Modal, Pressable, Image } from 'react-native';
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

export default function ComparativeAnalysisScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [selectedYear1, setSelectedYear1] = useState('2020');
  const [selectedYear2, setSelectedYear2] = useState('2023');
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [showYearPicker, setShowYearPicker] = useState<'year1' | 'year2' | null>(null);

  // Generate years from 2020 to current year + 10
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 11 }, (_, i) => String(2020 + i));

  // Sample historical data (add more years as needed)
  const historicalData: Record<string, Record<string, { yield: number; area: number; productivity: number }>> = {
    '2020': { rice: { yield: 420, area: 150, productivity: 85 }, corn: { yield: 380, area: 120, productivity: 78 }, vegetables: { yield: 290, area: 80, productivity: 82 }, fruits: { yield: 180, area: 60, productivity: 75 } },
    '2021': { rice: { yield: 450, area: 155, productivity: 87 }, corn: { yield: 395, area: 125, productivity: 80 }, vegetables: { yield: 310, area: 85, productivity: 84 }, fruits: { yield: 195, area: 65, productivity: 77 } },
    '2022': { rice: { yield: 480, area: 160, productivity: 90 }, corn: { yield: 410, area: 130, productivity: 82 }, vegetables: { yield: 330, area: 90, productivity: 86 }, fruits: { yield: 210, area: 70, productivity: 80 } },
    '2023': { rice: { yield: 520, area: 165, productivity: 92 }, corn: { yield: 435, area: 135, productivity: 85 }, vegetables: { yield: 360, area: 95, productivity: 88 }, fruits: { yield: 230, area: 75, productivity: 83 } },
  };

  // Prediction logic for future years
  function getCropData(year: string, cropKey: string) {
    if (historicalData[year] && historicalData[year][cropKey]) {
      return historicalData[year][cropKey];
    }
    // Predict based on last available year
    const lastYear = Object.keys(historicalData).sort().reverse()[0];
    const base = historicalData[lastYear][cropKey];
    const yearDiff = parseInt(year) - parseInt(lastYear);
    // 5% yield growth, 2% area growth, 1% productivity growth per year
    return {
      yield: Math.round(base.yield * Math.pow(1.05, yearDiff)),
      area: Math.round(base.area * Math.pow(1.02, yearDiff)),
      productivity: Math.min(100, Math.round(base.productivity + yearDiff)),
    };
  }

  const crops = [
    { key: 'rice', label: 'Rice', icon: 'rice', color: SUCCESS_COLOR },
    { key: 'corn', label: 'Corn', icon: 'corn', color: WARNING_COLOR },
    { key: 'vegetables', label: 'Vegetables', icon: 'carrot', color: INFO_COLOR },
    { key: 'fruits', label: 'Fruits', icon: 'fruit-cherries', color: EXCELLENT_COLOR },
  ];

  // Calculate growth trends
  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Comparison card
  const renderComparisonCard = (cropKey: string, year1: string, year2: string) => {
    const data1 = getCropData(year1, cropKey);
    const data2 = getCropData(year2, cropKey);
    const crop = crops.find(c => c.key === cropKey);
    const yieldGrowth = calculateGrowth(data2.yield, data1.yield);
    const productivityGrowth = calculateGrowth(data2.productivity, data1.productivity);
    return (
      <View key={cropKey} style={styles.cropCard}>
        <View style={styles.cropHeader}>
          <MaterialCommunityIcons name={crop?.icon as any} size={24} color={crop?.color} />
          <Text style={styles.cropTitle}>{crop?.label}</Text>
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{year1} vs {year2}</Text>
          </View>
        </View>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{year1} Yield</Text>
            <Text style={styles.metricValue}>{data1.yield}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{year2} Yield</Text>
            <Text style={styles.metricValue}>{data2.yield}</Text>
            <Text style={[styles.growthText, { color: parseFloat(yieldGrowth) >= 0 ? SUCCESS_COLOR : '#f44336' }]}>{yieldGrowth}% change</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Productivity</Text>
            <Text style={styles.metricValue}>{data2.productivity}%</Text>
            <Text style={[styles.growthText, { color: parseFloat(productivityGrowth) >= 0 ? SUCCESS_COLOR : '#f44336' }]}>{productivityGrowth}% change</Text>
          </View>
        </View>
      </View>
    );
  };

  // Modal year picker
  const renderYearPickerModal = (picker: 'year1' | 'year2') => (
    <Modal
      visible={showYearPicker === picker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowYearPicker(null)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowYearPicker(null)} />
      <View style={styles.modalContent}>
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.modalYearOption, ((picker === 'year1' ? selectedYear1 : selectedYear2) === year) && styles.selectedYear]}
              onPress={() => {
                if (picker === 'year1') setSelectedYear1(year);
                else setSelectedYear2(year);
                setShowYearPicker(null);
              }}
            >
              <Text style={[styles.modalYearText, ((picker === 'year1' ? selectedYear1 : selectedYear2) === year) && styles.selectedYearText]}>{year}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Comparative Analysis</Text>
          <Text style={styles.headerSubtitle}>Compare data across different periods.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>
      {renderYearPickerModal('year1')}
      {renderYearPickerModal('year2')}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Year Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Select Years to Compare</Text>
            </View>
            <View style={styles.yearComparisonContainer}>
              <View style={styles.yearSelector}>
                <Text style={styles.yearLabel}>Year 1:</Text>
                <TouchableOpacity
                  style={styles.yearButton}
                  onPress={() => setShowYearPicker('year1')}
                >
                  <Text style={styles.yearButtonText}>{selectedYear1}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={GREEN} />
                </TouchableOpacity>
              </View>
              <View style={styles.yearSelector}>
                <Text style={styles.yearLabel}>Year 2:</Text>
                <TouchableOpacity
                  style={styles.yearButton}
                  onPress={() => setShowYearPicker('year2')}
                >
                  <Text style={styles.yearButtonText}>{selectedYear2}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={GREEN} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {/* Crop Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="filter" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Crop Filter</Text>
            </View>
            <View style={styles.cropSelector}>
              {crops.map((crop) => (
                <TouchableOpacity
                  key={crop.key}
                  style={[styles.cropOption, selectedCrop === crop.key && styles.selectedCrop]}
                  onPress={() => setSelectedCrop(crop.key)}
                >
                  <MaterialCommunityIcons name={crop.icon as any} size={20} color={selectedCrop === crop.key ? WHITE : crop.color} />
                  <Text style={[styles.cropText, selectedCrop === crop.key && styles.selectedCropText]}>{crop.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Selected Crop Analysis */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>{crops.find(c => c.key === selectedCrop)?.label} - {selectedYear1} vs {selectedYear2} Analysis</Text>
            </View>
            {renderComparisonCard(selectedCrop, selectedYear1, selectedYear2)}
          </View>
          {/* All Crops Comparison */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="compare" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>All Crops Comparison - {selectedYear1} vs {selectedYear2}</Text>
            </View>
            <View style={styles.allCropsContainer}>
              {crops.map(crop => renderComparisonCard(crop.key, selectedYear1, selectedYear2))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
  scrollView: { flex: 1 },
  content: { padding: 20 },
  section: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: GREEN, marginLeft: 12 },
  yearComparisonContainer: { gap: 16 },
  yearSelector: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  yearLabel: { fontSize: 14, fontWeight: 'bold', color: GREEN, marginRight: 8 },
  yearButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: GREEN, backgroundColor: WHITE, minWidth: 100 },
  yearButtonText: { fontSize: 16, fontWeight: '600', color: GREEN, marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  modalContent: { position: 'absolute', top: '30%', left: 30, right: 30, backgroundColor: WHITE, borderRadius: 16, padding: 12, maxHeight: 350, zIndex: 10000, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 15 },
  modalScroll: { maxHeight: 300 },
  modalYearOption: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalYearText: { fontSize: 16, color: GREEN, textAlign: 'center' },
  selectedYear: { backgroundColor: GREEN },
  selectedYearText: { color: WHITE, fontWeight: 'bold' },
  cropSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cropOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: '#e9ecef', gap: 6 },
  selectedCrop: { backgroundColor: GREEN, borderColor: GREEN },
  cropText: { fontSize: 14, fontWeight: '600', color: '#333' },
  selectedCropText: { color: WHITE },
  cropCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 16 },
  cropHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cropTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 12, flex: 1 },
  yearBadge: { backgroundColor: GREEN, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  yearText: { fontSize: 12, fontWeight: 'bold', color: WHITE },
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metricItem: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  growthText: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  allCropsContainer: { gap: 16 },
}); 