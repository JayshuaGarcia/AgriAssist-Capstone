import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';

const GREEN = '#16543a';

// Function to get crop icon
const getCropIcon = (cropName: string) => {
  const cropIcons: { [key: string]: string } = {
    'Rice': '🌾',
    'Corn': '🌽',
    'Wheat': '🌾',
    'Soybean': '🫘',
    'Tomato': '🍅',
    'Potato': '🥔',
    'Onion': '🧅',
    'Carrot': '🥕',
    'Cabbage': '🥬',
    'Lettuce': '🥬',
    'Spinach': '🥬',
    'Pepper': '🌶️',
    'Eggplant': '🍆',
    'Cucumber': '🥒',
    'Squash': '🎃',
    'Beans': '🫘',
    'Peas': '🫘',
    'Okra': '🥬',
    'Sweet Potato': '🍠',
    'Cassava': '🥔',
    'Banana': '🍌',
    'Mango': '🥭',
    'Papaya': '🍈',
    'Coconut': '🥥',
    'Coffee': '☕',
    'Cacao': '🍫',
    'Sugarcane': '🎋',
    'Cotton': '🌾',
    'Tobacco': '🌿',
    'Sunflower': '🌻',
    'Peanut': '🥜',
    'Sesame': '🌾',
    'Herbs': '🌿',
    'Chili': '🌶️',
    'Ampalaya': '🥒',
    'Upo': '🥒',
    'Patola': '🥒',
    'Sayote': '🥒',
    'Kangkong': '🥬',
    'Pechay': '🥬',
    'Mustasa': '🥬',
    'Radish': '🥕',
    'Ginger': '🫚',
    'Garlic': '🧄',
    'Turmeric': '🫚',
    'Lemongrass': '🌿',
    'Basil': '🌿',
    'Mint': '🌿',
    'Singkamas': '🥕',
    'Sigarilyas': '🫘',
    'Bataw': '🫘',
    'Garbanzos': '🫘',
    'Sitaw': '🫘',
    'Flowers': '🌸',
    'Ornamental Plants': '🌺'
  };
  
  return cropIcons[cropName] || '🌱'; // Default plant icon
};

// Function to get crop Tagalog name
const getCropTagalogName = (cropName: string) => {
  const cropTagalogNames: { [key: string]: string } = {
    'Rice': 'Palay',
    'Corn': 'Mais',
    'Wheat': 'Trigo',
    'Soybean': 'Soybean',
    'Tomato': 'Kamatis',
    'Potato': 'Patatas',
    'Onion': 'Sibuyas',
    'Carrot': 'Karot',
    'Cabbage': 'Repolyo',
    'Lettuce': 'Litsugas',
    'Spinach': 'Spinach',
    'Pepper': 'Paminta',
    'Eggplant': 'Talong',
    'Cucumber': 'Pipino',
    'Squash': 'Kalabasa',
    'Beans': 'Patani',
    'Peas': 'Gisantes',
    'Okra': 'Okra',
    'Sweet Potato': 'Kamote',
    'Cassava': 'Kamoteng Kahoy',
    'Banana': 'Saging',
    'Mango': 'Mangga',
    'Papaya': 'Papaya',
    'Coconut': 'Niyog',
    'Coffee': 'Kape',
    'Cacao': 'Kakaw',
    'Sugarcane': 'Tubo',
    'Cotton': 'Bulak',
    'Tobacco': 'Tabako',
    'Sunflower': 'Mirasol',
    'Peanut': 'Mani',
    'Sesame': 'Linga',
    'Herbs': 'Mga Halamang Gamot',
    'Chili': 'Sili',
    'Ampalaya': 'Ampalaya',
    'Upo': 'Upo',
    'Patola': 'Patola',
    'Sayote': 'Sayote',
    'Kangkong': 'Kangkong',
    'Pechay': 'Pechay',
    'Mustasa': 'Mustasa',
    'Radish': 'Labanos',
    'Ginger': 'Luya',
    'Garlic': 'Bawang',
    'Turmeric': 'Luyang Dilaw',
    'Lemongrass': 'Tanglad',
    'Basil': 'Balanoy',
    'Mint': 'Mentha',
    'Singkamas': 'Singkamas',
    'Sigarilyas': 'Sigarilyas',
    'Bataw': 'Bataw',
    'Garbanzos': 'Garbanzos',
    'Sitaw': 'Sitaw',
    'Flowers': 'Mga Bulaklak',
    'Ornamental Plants': 'Mga Halamang Palamuti'
  };
  
  return cropTagalogNames[cropName] || cropName; // Return original name if no Tagalog translation
};

export default function HarvestReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalHarvested: 0,
    totalReports: 0,
    mostHarvestedCrop: '',
    harvestDistribution: [] as { crop: string; count: number; totalHarvest: number; percentage: number }[]
  });

  // Global analytics data
  const [globalAnalytics, setGlobalAnalytics] = useState({
    totalHarvested: 0,
    totalUsers: 0,
    mostPopularCrop: '',
    harvestDistribution: [] as { crop: string; count: number; userCount: number; totalHarvest: number; percentage: number; color: string }[]
  });

  // Date picker for global trends
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [globalLoading, setGlobalLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Reset to current month on refresh
    const currentDate = new Date();
    setSelectedMonth(currentDate);
    Promise.all([
      loadHarvestAnalytics(),
      loadGlobalHarvestAnalytics(currentDate)
    ]).finally(() => {
    setTimeout(() => setRefreshing(false), 1000);
    });
  }, []);

  useEffect(() => {
    loadHarvestAnalytics();
    loadGlobalHarvestAnalytics(selectedMonth);
  }, []);

  // Add focus listener to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHarvestAnalytics();
      loadGlobalHarvestAnalytics(selectedMonth);
    }, [selectedMonth])
  );

  const loadHarvestAnalytics = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Get user's harvest reports
      const harvestQuery = query(
        collection(db, 'harvestReports'),
        where('userEmail', '==', user.email)
      );
      const harvestSnapshot = await getDocs(harvestQuery);
      const harvestReports = harvestSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate analytics
      calculateHarvestAnalytics(harvestReports);
      
      // Animate the analytics
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      console.log('✅ Loaded harvest analytics:', harvestReports.length);
    } catch (error) {
      console.error('Error loading harvest analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHarvestAnalytics = (reports: any[]) => {
    if (reports.length === 0) {
      setAnalyticsData({
        totalHarvested: 0,
        totalReports: 0,
        mostHarvestedCrop: '',
        harvestDistribution: []
      });
      return;
    }

    // Calculate total harvested
    const totalHarvested = reports.reduce((sum, report) => {
      const harvest = typeof report.actualHarvest === 'number' ? report.actualHarvest : parseFloat(report.actualHarvest) || 0;
      return sum + harvest;
    }, 0);

    // Calculate harvest distribution by crop
    const cropHarvestMap = new Map();
    reports.forEach(report => {
      const crop = report.crop;
      const harvest = typeof report.actualHarvest === 'number' ? report.actualHarvest : parseFloat(report.actualHarvest) || 0;
      
      if (cropHarvestMap.has(crop)) {
        const existing = cropHarvestMap.get(crop);
        cropHarvestMap.set(crop, {
          count: existing.count + 1,
          totalHarvest: existing.totalHarvest + harvest
        });
      } else {
        cropHarvestMap.set(crop, {
          count: 1,
          totalHarvest: harvest
        });
      }
    });

    // Convert to array and calculate percentages
    const harvestDistribution = Array.from(cropHarvestMap.entries()).map(([crop, data]) => ({
      crop,
      count: data.count,
      totalHarvest: data.totalHarvest,
      percentage: totalHarvested > 0 ? (data.totalHarvest / totalHarvested) * 100 : 0
    })).sort((a, b) => b.totalHarvest - a.totalHarvest);

    // Find most harvested crop
    const mostHarvestedCrop = harvestDistribution.length > 0 ? harvestDistribution[0].crop : '';

    setAnalyticsData({
      totalHarvested,
      totalReports: reports.length,
      mostHarvestedCrop,
      harvestDistribution
    });
  };

  const loadGlobalHarvestAnalytics = async (month: Date) => {
    setGlobalLoading(true);
    try {
      // Get all harvest reports
      const harvestQuery = query(collection(db, 'harvestReports'));
      const harvestSnapshot = await getDocs(harvestQuery);
      const allHarvestReports = harvestSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter by month - only show records from the selected month
      const targetMonth = month.getMonth();
      const targetYear = month.getFullYear();
      
      const filteredReports = allHarvestReports.filter(report => {
        if (!report.harvestDate) return false;
        
        const reportDate = new Date(report.harvestDate);
        const reportMonth = reportDate.getMonth();
        const reportYear = reportDate.getFullYear();
        
        return reportMonth === targetMonth && reportYear === targetYear;
      });

      // Calculate global analytics
      calculateGlobalHarvestAnalytics(filteredReports);
      
      console.log('✅ Loaded global harvest analytics for', month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), ':', filteredReports.length, 'records');
    } catch (error) {
      console.error('Error loading global harvest analytics:', error);
    } finally {
      setGlobalLoading(false);
    }
  };

  const calculateGlobalHarvestAnalytics = (reports: any[]) => {
    if (reports.length === 0) {
      setGlobalAnalytics({
        totalHarvested: 0,
        totalUsers: 0,
        mostPopularCrop: '',
        harvestDistribution: []
      });
      return;
    }

    // Calculate total harvested globally
    const totalHarvested = reports.reduce((sum, report) => {
      const harvest = typeof report.actualHarvest === 'number' ? report.actualHarvest : parseFloat(report.actualHarvest) || 0;
      return sum + harvest;
    }, 0);

    // Get unique users
    const uniqueUsers = new Set(reports.map(report => report.userEmail));
    const totalUsers = uniqueUsers.size;

    // Calculate harvest distribution by crop
    const cropHarvestMap = new Map();
    const cropUserMap = new Map();

    reports.forEach(report => {
      const crop = report.crop;
      const harvest = typeof report.actualHarvest === 'number' ? report.actualHarvest : parseFloat(report.actualHarvest) || 0;
      const userEmail = report.userEmail;
      
      // Track harvest amounts
      if (cropHarvestMap.has(crop)) {
        const existing = cropHarvestMap.get(crop);
        cropHarvestMap.set(crop, {
          count: existing.count + 1,
          totalHarvest: existing.totalHarvest + harvest
        });
      } else {
        cropHarvestMap.set(crop, {
          count: 1,
          totalHarvest: harvest
        });
      }

      // Track unique users per crop
      if (!cropUserMap.has(crop)) {
        cropUserMap.set(crop, new Set());
      }
      cropUserMap.get(crop).add(userEmail);
    });

    // Convert to array and calculate percentages
    const harvestDistribution = Array.from(cropHarvestMap.entries()).map(([crop, data]) => ({
      crop,
      count: data.count,
      userCount: cropUserMap.get(crop)?.size || 0,
      totalHarvest: data.totalHarvest,
      percentage: totalHarvested > 0 ? (data.totalHarvest / totalHarvested) * 100 : 0,
      color: getCropColor(crop)
    })).sort((a, b) => b.totalHarvest - a.totalHarvest);

    // Find most popular crop
    const mostPopularCrop = harvestDistribution.length > 0 ? harvestDistribution[0].crop : '';

    setGlobalAnalytics({
      totalHarvested,
      totalUsers,
      mostPopularCrop,
      harvestDistribution
    });
  };

  const getCropColor = (crop: string) => {
    // Use consistent green colors like planting report
    const colors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E8'];
    const index = crop.length % colors.length;
    return colors[index];
  };

  const hasDataForMonth = (month: Date) => {
    return globalAnalytics.harvestDistribution.length > 0;
  };

  return (
    <>
      <View style={styles.container}>
        {/* Top Green Border */}
        <View style={styles.topBorder} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleCard}>
          <Text style={styles.headerTitle}>Harvest Report</Text>
              <Text style={styles.headerSubtitle}>Manage your harvest reports</Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[GREEN]}
            tintColor={GREEN}
          />
        }
      >
          {/* View Reports Button */}
          <View style={styles.viewReportsContainer}>
                <TouchableOpacity 
              style={styles.viewReportsButton}
              onPress={() => router.push('/harvest-view-reports')}
            >
              <View style={styles.viewReportsIconContainer}>
                <Ionicons name="list" size={32} color={GREEN} />
                  </View>
              <Text style={styles.viewReportsTitle}>View Reports</Text>
              <Text style={styles.viewReportsDescription}>View your submitted planting reports</Text>
                </TouchableOpacity>
            </View>

          {/* Harvest Analytics Dashboard */}
          <Animated.View 
            style={[
              styles.analyticsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.dashboardHeader}>
              <Text style={styles.dashboardTitle}>🌾 Harvest Analytics Overview</Text>
              <Text style={styles.dashboardSubtitle}>See your harvest progress and global crop trends</Text>
            </View>

            {/* Personal Summary Card */}
            <View style={styles.personalSummaryCard}>
              <View style={styles.personalSummaryHeader}>
                <Ionicons name="person" size={24} color={GREEN} />
                <Text style={styles.personalSummaryTitle}>Your Harvest Summary</Text>
                </View>

              <View style={styles.personalSummaryStats}>
                <View style={styles.personalStatItem}>
                  <Text style={styles.personalStatValue}>{analyticsData.totalHarvested.toFixed(1)}</Text>
                  <Text style={styles.personalStatLabel}>Total Harvested (kg)</Text>
                </View>
                <View style={styles.personalStatItem}>
                  <Text style={styles.personalStatValue}>{analyticsData.totalReports}</Text>
                  <Text style={styles.personalStatLabel}>Harvest Reports</Text>
                </View>
                <View style={styles.personalStatItem}>
                  <Text style={styles.personalStatValue}>{analyticsData.mostHarvestedCrop || 'None'}</Text>
                  <Text style={styles.personalStatLabel}>Most Harvested</Text>
                </View>
              </View>
            </View>

            {/* Global Trends Section */}
            <View style={styles.globalTrendsCard}>
              <View style={styles.globalTrendsHeader}>
                <Text style={styles.globalTrendsTitle}>🌍 Global Harvest Trends</Text>
              </View>

              {/* Loading State */}
              {globalLoading ? (
                <View style={styles.analyticsLoadingContainer}>
                  <ActivityIndicator size="large" color={GREEN} />
                  <Text style={styles.analyticsLoadingText}>Loading global trends...</Text>
                </View>
              ) : (
                <>
                  {/* Horizontal Bar Chart with Rankings */}
                  <View style={styles.barChartContainer}>
                    <Text style={styles.barChartTitle}>Global Harvest Distribution</Text>
                    
                    {/* Month Navigation */}
                    <View style={styles.monthNavigationContainer}>
                  <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={async () => {
                          const newDate = new Date(selectedMonth);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setSelectedMonth(newDate);
                          await loadGlobalHarvestAnalytics(newDate);
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={GREEN} />
                  </TouchableOpacity>
                      
                      <Text style={styles.monthDisplay}>
                        {selectedMonth.toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </Text>
                  
                  <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={async () => {
                          const newDate = new Date(selectedMonth);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setSelectedMonth(newDate);
                          await loadGlobalHarvestAnalytics(newDate);
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={GREEN} />
                      </TouchableOpacity>
                    </View>
                    
                    {hasDataForMonth(selectedMonth) ? (
                      <>
                        <View style={styles.horizontalBarChartWrapper}>
                          {globalAnalytics.harvestDistribution.map((item, index) => {
                            const rank = index + 1;
                            const maxValue = Math.max(...globalAnalytics.harvestDistribution.map(crop => crop.totalHarvest));
                            const barWidth = (item.totalHarvest / maxValue) * 100; // Percentage width
                            
                            return (
                              <View key={item.crop} style={[
                                styles.horizontalBarItem,
                                rank === 1 && styles.horizontalBarItemFirst,
                                rank === 2 && styles.horizontalBarItemSecond,
                                rank === 3 && styles.horizontalBarItemThird
                              ]}>
                                <View style={styles.horizontalBarSideNumber}>
                                  <Text style={[
                                    styles.horizontalBarSideNumberText,
                                    rank === 1 && styles.horizontalBarSideNumberFirst,
                                    rank === 2 && styles.horizontalBarSideNumberSecond,
                                    rank === 3 && styles.horizontalBarSideNumberThird
                                  ]}>
                                    {rank}
                                  </Text>
                                </View>
                                <View style={styles.horizontalBarLabelContainer}>
                                  <View style={styles.rankContainer}>
                                    <Text style={[
                                      styles.horizontalBarRank,
                                      rank === 1 && styles.horizontalBarRankFirst,
                                      rank === 2 && styles.horizontalBarRankSecond,
                                      rank === 3 && styles.horizontalBarRankThird
                                    ]}>
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                    </Text>
                                  </View>
                                  <View style={styles.cropInfoContainer}>
                                    <View style={styles.cropNameRow}>
                                      <Text style={styles.cropIcon}>{getCropIcon(item.crop)}</Text>
                                      <Text style={styles.horizontalBarCropName}>{item.crop}</Text>
                                      <Text style={styles.cropTagalogName}> / {getCropTagalogName(item.crop)}</Text>
                                    </View>
                                  </View>
                                  <View style={styles.percentageContainer}>
                                    <Text style={styles.horizontalBarPercentageText}>
                                      {item.percentage.toFixed(1)}%
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.horizontalBarContainer}>
                                  <View style={styles.horizontalBar}>
                                    <View 
                                      style={[
                                        styles.horizontalBarFill,
                                        { 
                                          width: `${barWidth}%`,
                                          backgroundColor: '#81C784'
                                        }
                                      ]}
                                    />
                                    <View style={styles.horizontalBarValue}>
                                      <Text style={styles.horizontalBarValueText}>
                                        {item.totalHarvest.toFixed(1)} kg
                    </Text>
                </View>
              </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                        
                        {/* Notes */}
                        <View style={styles.notesContainer}>
                          <Text style={styles.notesText}>Total: {globalAnalytics.totalHarvested.toFixed(1)} kg harvested across all farmers</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Ionicons name="leaf-outline" size={48} color="#ccc" />
                        <Text style={styles.noDataText}>No harvest data for {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                        <Text style={styles.noDataSubtext}>Try selecting a different month</Text>
                      </View>
                    )}
                  </View>

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerButton}>
                      <Text style={styles.dividerText}>Analytics Breakdown</Text>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Farmers Growing Each Crop */}
                  <View style={styles.farmersGrowingCard}>
                    <Text style={styles.farmersGrowingTitle}>Farmers Harvesting Each Crop</Text>
                    
                    {globalAnalytics.harvestDistribution.length > 0 ? (
                      <View style={styles.horizontalBarChartWrapper}>
                        {globalAnalytics.harvestDistribution
                          .sort((a, b) => b.userCount - a.userCount)
                          .map((item, index) => {
                            const rank = index + 1;
                            const maxValue = Math.max(...globalAnalytics.harvestDistribution.map(crop => crop.userCount));
                            const barWidth = (item.userCount / maxValue) * 100;
                            
                            return (
                              <View key={item.crop} style={[
                                styles.horizontalBarItem,
                                rank === 1 && styles.horizontalBarItemFirst,
                                rank === 2 && styles.horizontalBarItemSecond,
                                rank === 3 && styles.horizontalBarItemThird
                              ]}>
                                <View style={styles.horizontalBarSideNumber}>
                                  <Text style={[
                                    styles.horizontalBarSideNumberText,
                                    rank === 1 && styles.horizontalBarSideNumberFirst,
                                    rank === 2 && styles.horizontalBarSideNumberSecond,
                                    rank === 3 && styles.horizontalBarSideNumberThird
                                  ]}>
                                    {rank}
                                  </Text>
                                </View>
                                <View style={styles.horizontalBarLabelContainer}>
                                  <View style={styles.rankContainer}>
                                    <Text style={[
                                      styles.horizontalBarRank,
                                      rank === 1 && styles.horizontalBarRankFirst,
                                      rank === 2 && styles.horizontalBarRankSecond,
                                      rank === 3 && styles.horizontalBarRankThird
                                    ]}>
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                    </Text>
                                  </View>
                                  <View style={styles.cropInfoContainer}>
                                    <View style={styles.cropNameRow}>
                                      <Text style={styles.cropIcon}>{getCropIcon(item.crop)}</Text>
                                      <Text style={styles.horizontalBarCropName}>{item.crop}</Text>
                                      <Text style={styles.cropTagalogName}> / {getCropTagalogName(item.crop)}</Text>
                                    </View>
                                  </View>
                                  <View style={styles.farmerCountContainer}>
                                    <Text style={styles.farmerCountText}>
                                      {item.userCount} farmers
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.horizontalBarContainer}>
                                  <View style={styles.horizontalBar}>
                                    <View 
                                      style={[
                                        styles.horizontalBarFill,
                                        { 
                                          width: `${barWidth}%`,
                                          backgroundColor: '#81C784'
                                        }
                                      ]}
                                    />
                                    <View style={styles.horizontalBarValue}>
                                      <Text style={styles.horizontalBarValueText}>
                                        {item.userCount}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                      </View>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Ionicons name="people-outline" size={48} color="#ccc" />
                        <Text style={styles.noDataText}>No farmer data available</Text>
                        <Text style={styles.noDataSubtext}>Start harvesting to see farmer trends</Text>
                      </View>
                    )}
                    
                    {/* Notes */}
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>Number of different farmers harvesting each crop type</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Highlights */}
            <View style={styles.highlightsContainer}>
              <View style={styles.highlightCard}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.highlightTitle}>Most Harvested</Text>
                <Text style={styles.highlightValue}>{analyticsData.mostHarvestedCrop || 'None'}</Text>
              </View>
              <View style={styles.highlightCard}>
                <Ionicons name="basket" size={24} color="#4CAF50" />
                <Text style={styles.highlightTitle}>Total Harvest</Text>
                <Text style={styles.highlightValue}>{analyticsData.totalHarvested.toFixed(1)} kg</Text>
              </View>
              <View style={styles.highlightCard}>
                <Ionicons name="document-text" size={24} color="#2196F3" />
                <Text style={styles.highlightTitle}>Reports</Text>
                <Text style={styles.highlightValue}>{analyticsData.totalReports}</Text>
              </View>
            </View>
          </Animated.View>
      </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBorder: {
    height: 36,
    width: '100%',
    backgroundColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.03)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  viewReportsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  viewReportsButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderLeftColor: '#2E7D32',
    borderRightColor: '#2E7D32',
  },
  viewReportsIconContainer: {
    marginBottom: 12,
  },
  viewReportsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 4,
  },
  viewReportsDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dashboardHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  personalSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E8F5E8',
  },
  personalSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  personalSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 12,
  },
  personalSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  personalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  personalStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 4,
  },
  personalStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  globalTrendsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E8F5E8',
  },
  globalTrendsHeader: {
    marginBottom: 20,
  },
  globalTrendsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
  },
  analyticsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  analyticsLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  barChartContainer: {
    marginBottom: 20,
  },
  barChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 16,
    textAlign: 'center',
  },
  monthNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  monthDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginHorizontal: 20,
    minWidth: 120,
    textAlign: 'center',
  },
  horizontalBarChartWrapper: {
    gap: 12,
  },
  horizontalBarItem: {
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  horizontalBarItemFirst: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  horizontalBarItemSecond: {
    backgroundColor: '#F5F5F5',
    borderColor: '#C0C0C0',
    borderWidth: 2,
  },
  horizontalBarItemThird: {
    backgroundColor: '#FDF5E6',
    borderColor: '#CD7F32',
    borderWidth: 2,
  },
  horizontalBarSideNumber: {
    position: 'absolute',
    left: -15,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  horizontalBarSideNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  horizontalBarSideNumberFirst: {
    color: '#FFD700',
    borderColor: '#FFD700',
  },
  horizontalBarSideNumberSecond: {
    color: '#C0C0C0',
    borderColor: '#C0C0C0',
  },
  horizontalBarSideNumberThird: {
    color: '#CD7F32',
    borderColor: '#CD7F32',
  },
  horizontalBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 12,
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: 0,
  },
  horizontalBarRankWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  horizontalBarRank: {
    fontSize: 16,
    marginRight: 8,
  },
  rankContainer: {
    width: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  horizontalBarRankFirst: {
    fontSize: 18,
  },
  horizontalBarRankSecond: {
    fontSize: 18,
  },
  horizontalBarRankThird: {
    fontSize: 18,
  },
  horizontalBarCropName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  cropInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cropNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cropIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cropTagalogName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  percentageContainer: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  farmerCountContainer: {
    width: 80,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  farmerCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  horizontalBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 8,
  },
  horizontalBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  horizontalBarValue: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalBarValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  horizontalBarPercentage: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  horizontalBarPercentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  farmersGrowingCard: {
    marginBottom: 20,
  },
  farmersGrowingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 16,
    textAlign: 'center',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  highlightsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  highlightTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
    marginTop: 4,
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d0d0d0',
  },
  dividerButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  dividerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});