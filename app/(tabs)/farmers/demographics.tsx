import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, TextInput, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';
const LIGHT_BLUE = '#e3f2fd';
const LIGHT_PINK = '#fce4ec';

export default function DemographicsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Sample demographic data
  const ageGroups = [
    { range: '18-25', male: 45, female: 38, total: 83 },
    { range: '26-35', male: 67, female: 72, total: 139 },
    { range: '36-45', male: 89, female: 94, total: 183 },
    { range: '46-55', male: 76, female: 68, total: 144 },
    { range: '56-65', male: 52, female: 45, total: 97 },
    { range: '65+', male: 28, female: 23, total: 51 },
  ];

  const totalFarmers = ageGroups.reduce((sum, group) => sum + group.total, 0);
  const totalMale = ageGroups.reduce((sum, group) => sum + group.male, 0);
  const totalFemale = ageGroups.reduce((sum, group) => sum + group.female, 0);

  const renderAgeGroupBar = (group: typeof ageGroups[0]) => {
    const maxValue = Math.max(...ageGroups.map(g => g.total));
    const malePercentage = (group.male / maxValue) * 100;
    const femalePercentage = (group.female / maxValue) * 100;

    return (
      <View key={group.range} style={styles.ageGroupContainer}>
        <View style={styles.ageGroupHeader}>
          <Text style={styles.ageRange}>{group.range}</Text>
          <Text style={styles.ageTotal}>{group.total} farmers</Text>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.bar, styles.maleBar, { width: `${malePercentage}%` }]}>
            <Text style={styles.barText}>{group.male}</Text>
          </View>
          <View style={[styles.bar, styles.femaleBar, { width: `${femalePercentage}%` }]}>
            <Text style={styles.barText}>{group.female}</Text>
          </View>
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.maleDot]} />
            <Text style={styles.legendText}>Male: {group.male}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.femaleDot]} />
            <Text style={styles.legendText}>Female: {group.female}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Demographics</Text>
          <Text style={styles.headerSubtitle}>Farmer demographics and analytics.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="account-group" size={32} color={GREEN} />
              <Text style={styles.summaryNumber}>{totalFarmers}</Text>
              <Text style={styles.summaryLabel}>Total Farmers</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="account" size={32} color="#2196F3" />
              <Text style={styles.summaryNumber}>{totalMale}</Text>
              <Text style={styles.summaryLabel}>Male</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="account-heart" size={32} color="#E91E63" />
              <Text style={styles.summaryNumber}>{totalFemale}</Text>
              <Text style={styles.summaryLabel}>Female</Text>
            </View>
          </View>

          {/* Gender Distribution */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-pie" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Gender Distribution</Text>
            </View>
            <View style={styles.genderContainer}>
              <View style={styles.genderItem}>
                <View style={styles.genderCircle}>
                  <Text style={styles.genderPercentage}>
                    {Math.round((totalMale / totalFarmers) * 100)}%
                  </Text>
                  <Text style={styles.genderLabel}>Male</Text>
                </View>
                <View style={[styles.genderBar, styles.maleBar, { width: `${(totalMale / totalFarmers) * 100}%` }]} />
              </View>
              <View style={styles.genderItem}>
                <View style={styles.genderCircle}>
                  <Text style={styles.genderPercentage}>
                    {Math.round((totalFemale / totalFarmers) * 100)}%
                  </Text>
                  <Text style={styles.genderLabel}>Female</Text>
                </View>
                <View style={[styles.genderBar, styles.femaleBar, { width: `${(totalFemale / totalFarmers) * 100}%` }]} />
              </View>
            </View>
          </View>

          {/* Age Group Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-bar" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Age Group Breakdown</Text>
            </View>
            {ageGroups.map(renderAgeGroupBar)}
          </View>

          {/* Key Insights */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Key Insights</Text>
            </View>
            <View style={styles.insightsContainer}>
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={20} color={GREEN} />
                <Text style={styles.insightText}>
                  Most farmers are aged 36-45 years (183 farmers)
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="people" size={20} color={GREEN} />
                <Text style={styles.insightText}>
                  Gender distribution is relatively balanced
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="analytics" size={20} color={GREEN} />
                <Text style={styles.insightText}>
                  Younger age groups show strong participation
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16543a',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 20,
    paddingHorizontal: 18,
    marginBottom: 0,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
  genderContainer: {
    gap: 16,
  },
  genderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genderCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  genderPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
  },
  genderLabel: {
    fontSize: 10,
    color: '#666',
  },
  genderBar: {
    flex: 1,
    height: 20,
    borderRadius: 10,
  },
  maleBar: {
    backgroundColor: '#2196F3',
  },
  femaleBar: {
    backgroundColor: '#E91E63',
  },
  ageGroupContainer: {
    marginBottom: 20,
  },
  ageGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ageRange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ageTotal: {
    fontSize: 14,
    color: '#666',
  },
  barContainer: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 8,
  },
  bar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  maleDot: {
    backgroundColor: '#2196F3',
  },
  femaleDot: {
    backgroundColor: '#E91E63',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  insightsContainer: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
}); 