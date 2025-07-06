import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const DRY_COLOR = '#ffe082';
const WET_COLOR = '#b3e5fc';
const COOL_COLOR = '#c8e6c9';
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Sample season data per month
const SEASONS: Array<'Cool Dry' | 'Hot Dry' | 'Wet'> = [
  'Cool Dry', 'Cool Dry', 'Hot Dry', 'Hot Dry', 'Hot Dry', 'Wet',
  'Wet', 'Wet', 'Wet', 'Cool Dry', 'Cool Dry', 'Cool Dry',
];
const SEASON_COLORS: Record<'Cool Dry' | 'Hot Dry' | 'Wet', string> = {
  'Cool Dry': COOL_COLOR,
  'Hot Dry': DRY_COLOR,
  'Wet': WET_COLOR,
};

// Sample crop recommendations per month
interface CropDatum {
  month: string;
  plant: Array<'Rice' | 'Corn' | 'Vegetables'>;
  harvest: Array<'Rice' | 'Corn' | 'Vegetables'>;
  best: Array<'Rice' | 'Corn' | 'Vegetables'>;
}
const CROP_DATA: CropDatum[] = [
  { month: 'Jan', plant: ['Rice', 'Corn'], harvest: ['Vegetables'], best: ['Rice'] },
  { month: 'Feb', plant: ['Rice', 'Corn'], harvest: ['Vegetables'], best: ['Rice'] },
  { month: 'Mar', plant: ['Corn', 'Vegetables'], harvest: ['Rice'], best: ['Corn'] },
  { month: 'Apr', plant: ['Corn', 'Vegetables'], harvest: ['Rice'], best: ['Corn'] },
  { month: 'May', plant: ['Vegetables'], harvest: ['Corn'], best: ['Vegetables'] },
  { month: 'Jun', plant: ['Rice', 'Vegetables'], harvest: ['Corn'], best: ['Rice'] },
  { month: 'Jul', plant: ['Rice', 'Vegetables'], harvest: ['Corn'], best: ['Rice'] },
  { month: 'Aug', plant: ['Rice', 'Vegetables'], harvest: ['Corn'], best: ['Rice'] },
  { month: 'Sep', plant: ['Rice', 'Vegetables'], harvest: ['Corn'], best: ['Rice'] },
  { month: 'Oct', plant: ['Corn', 'Vegetables'], harvest: ['Rice'], best: ['Corn'] },
  { month: 'Nov', plant: ['Corn', 'Vegetables'], harvest: ['Rice'], best: ['Corn'] },
  { month: 'Dec', plant: ['Rice', 'Corn'], harvest: ['Vegetables'], best: ['Rice'] },
];

const CROP_ICONS: Record<'Rice' | 'Corn' | 'Vegetables', string> = {
  Rice: 'rice',
  Corn: 'corn',
  Vegetables: 'carrot',
};
const CROP_COLORS: Record<'Rice' | 'Corn' | 'Vegetables', string> = {
  Rice: '#4caf50',
  Corn: '#ffb300',
  Vegetables: '#8bc34a',
};

const CROP_LABELS: Record<'Rice' | 'Corn' | 'Vegetables', string> = {
  Rice: 'Rice',
  Corn: 'Corn',
  Vegetables: 'Vegetables',
};

// Sample timelines
const PLANTING_TIMELINE = [
  { month: 'Jan', activity: 'Rice Planting' },
  { month: 'Mar', activity: 'Corn Planting' },
  { month: 'Jun', activity: 'Vegetable Planting' },
];
const TRAINING_TIMELINE = [
  { month: 'Feb', activity: 'Irrigation Training' },
  { month: 'May', activity: 'Pest Management Workshop' },
  { month: 'Sep', activity: 'Harvest Techniques Seminar' },
];
const REPORTING_TIMELINE = [
  { month: 'Apr', activity: 'Quarterly Crop Report' },
  { month: 'Jul', activity: 'Mid-Year Review' },
  { month: 'Dec', activity: 'Annual Summary' },
];

export default function SeasonalCalendarScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Seasonal Calendar</Text>
          <Text style={styles.headerSubtitle}>Plan activities throughout the year.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Green Rounded Header */}
        <View style={styles.topGreenRow}>
          <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitleGreen}>Seasonal Calendar</Text>
            <Text style={styles.headerSubtitleGreen}>See the best crops to plant and harvest each month, and the season.</Text>
          </View>
        </View>
        <View style={{ height: 24 }} />
        {/* Season Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: COOL_COLOR }]} /><Text style={styles.legendText}>Cool Dry</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: DRY_COLOR }]} /><Text style={styles.legendText}>Hot Dry</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: WET_COLOR }]} /><Text style={styles.legendText}>Wet</Text></View>
          <View style={styles.legendItem}><MaterialCommunityIcons name="star" color="#ffb300" size={18} /><Text style={styles.legendText}>Best to Plant</Text></View>
        </View>
        {/* Crop Icon Legend */}
        <View style={styles.cropLegendRow}>
          {(['Rice', 'Corn', 'Vegetables'] as const).map(crop => (
            <View key={crop} style={styles.cropLegendItem}>
              <MaterialCommunityIcons name={CROP_ICONS[crop] as any} size={22} color={CROP_COLORS[crop]} />
              <Text style={styles.cropLegendText}>{CROP_LABELS[crop]}</Text>
            </View>
          ))}
        </View>
        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {CROP_DATA.map((data, idx) => (
            <View key={data.month} style={[styles.monthCard, { backgroundColor: SEASON_COLORS[SEASONS[idx]] }]}> 
              <Text style={styles.monthLabel}>{data.month}</Text>
              <Text style={styles.seasonLabel}>{SEASONS[idx]}</Text>
              <View style={styles.row}><Text style={styles.sectionLabel}>Plant:</Text>
                {data.plant.map(crop => (
                  <MaterialCommunityIcons key={crop} name={CROP_ICONS[crop] as any} size={20} color={CROP_COLORS[crop]} style={styles.cropIcon} />
                ))}
              </View>
              <View style={styles.row}><Text style={styles.sectionLabel}>Harvest:</Text>
                {data.harvest.map(crop => (
                  <MaterialCommunityIcons key={crop} name={CROP_ICONS[crop] as any} size={20} color={CROP_COLORS[crop]} style={styles.cropIcon} />
                ))}
              </View>
              <View style={styles.row}>
                <Text style={styles.sectionLabel}>Best:</Text>
                {data.best.map(crop => (
                  <View key={crop} style={styles.bestCropWrap}>
                    <MaterialCommunityIcons name={CROP_ICONS[crop] as any} size={20} color={CROP_COLORS[crop]} style={styles.cropIcon} />
                    <MaterialCommunityIcons name="star" size={16} color="#ffb300" style={{ marginLeft: -8, marginTop: -8 }} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        {/* Timelines */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Planting Timeline</Text>
          {PLANTING_TIMELINE.map((item, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <MaterialCommunityIcons name="seed" size={18} color={GREEN} />
              <Text style={styles.timelineMonth}>{item.month}:</Text>
              <Text style={styles.timelineText}>{item.activity}</Text>
            </View>
          ))}
          <Text style={styles.timelineTitle}>Training Timeline</Text>
          {TRAINING_TIMELINE.map((item, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <MaterialCommunityIcons name={"account-school" as any} size={18} color={GREEN} />
              <Text style={styles.timelineMonth}>{item.month}:</Text>
              <Text style={styles.timelineText}>{item.activity}</Text>
            </View>
          ))}
          <Text style={styles.timelineTitle}>Reporting Timeline</Text>
          {REPORTING_TIMELINE.map((item, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <MaterialCommunityIcons name="file-chart" size={18} color={GREEN} />
              <Text style={styles.timelineMonth}>{item.month}:</Text>
              <Text style={styles.timelineText}>{item.activity}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;
const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;
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
  topGreenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: RECT_HEIGHT + 60,
    backgroundColor: GREEN,
    borderBottomLeftRadius: RECT_RADIUS,
    borderBottomRightRadius: RECT_RADIUS,
    paddingTop: Platform.OS === 'ios' ? 54 : 34,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  headerTitleGreen: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 8, textAlign: 'left' },
  headerSubtitleGreen: { fontSize: 15, color: '#e0f2f1', marginTop: 4, textAlign: 'left', marginBottom: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, marginVertical: 2 },
  legendColor: { width: 18, height: 18, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#ccc' },
  legendText: { fontSize: 13, color: '#333', marginRight: 2 },
  cropLegendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 18 },
  cropLegendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  cropLegendText: { fontSize: 14, color: '#333', marginLeft: 6 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  monthCard: { width: CARD_WIDTH, borderRadius: 16, padding: 14, margin: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  monthLabel: { fontSize: 18, fontWeight: 'bold', color: GREEN, marginBottom: 2 },
  seasonLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' },
  sectionLabel: { fontSize: 13, color: '#333', fontWeight: 'bold', marginRight: 4 },
  cropIcon: { marginRight: 4 },
  bestCropWrap: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  timelineSection: { marginTop: 24, paddingHorizontal: 18 },
  timelineTitle: { fontSize: 17, fontWeight: 'bold', color: GREEN, marginTop: 18, marginBottom: 6 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  timelineMonth: { fontWeight: 'bold', color: GREEN, marginLeft: 8, marginRight: 4 },
  timelineText: { fontSize: 14, color: '#333' },
}); 