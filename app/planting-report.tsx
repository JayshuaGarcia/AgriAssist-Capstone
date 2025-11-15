import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { formatDateToISO, getTodayDate } from '../lib/dateUtils';
import { db } from '../lib/firebase';
import { createUnifiedPlantingData } from '../types/UnifiedReportFormat';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

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

// Sample crop/product data
const CROP_TYPES = [
  'Rice', 'Corn', 'Wheat', 'Soybean', 'Tomato', 'Potato', 'Onion', 'Carrot',
  'Cabbage', 'Lettuce', 'Spinach', 'Pepper', 'Eggplant', 'Cucumber', 'Squash',
  'Beans', 'Peas', 'Okra', 'Sweet Potato', 'Cassava', 'Banana', 'Mango',
  'Papaya', 'Coconut', 'Coffee', 'Cacao', 'Sugarcane', 'Cotton', 'Tobacco',
  'Sunflower', 'Peanut', 'Sesame', 'Herbs', 'Chili', 'Ampalaya', 'Upo', 'Patola',
  'Sayote', 'Kangkong', 'Pechay', 'Mustasa', 'Radish', 'Ginger', 'Garlic',
  'Turmeric', 'Lemongrass', 'Basil', 'Mint', 'Singkamas', 'Sigarilyas', 'Bataw',
  'Garbanzos', 'Sitaw', 'Flowers', 'Ornamental Plants'
];

export default function PlantingReportScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'create' | 'view'>('main');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState('sqm');
  const [submitting, setSubmitting] = useState(false);
  const [plantingDate, setPlantingDate] = useState(getTodayDate());
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [plantCount, setPlantCount] = useState('');
  const [expectedHarvest, setExpectedHarvest] = useState('');
  const [plantingReports, setPlantingReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPlantingDate, setSelectedPlantingDate] = useState(new Date());

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalPlants: 0,
    cropTypes: 0,
    mostPlantedCrop: '',
    cropDistribution: [] as { crop: string; count: number; percentage: number }[]
  });

  // Global analytics data
  const [globalAnalytics, setGlobalAnalytics] = useState({
    totalPlants: 0,
    totalUsers: 0,
    mostPopularCrop: '',
    cropDistribution: [] as { crop: string; count: number; userCount: number; percentage: number; color: string }[]
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Loading states
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Date picker for global trends
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Function to check if there's data for the selected month
  const hasDataForMonth = (month: Date) => {
    // Check if there's any data in the global analytics for the selected month
    // This will be updated when loadGlobalAnalytics is called with the selected month
    return globalAnalytics.cropDistribution.length > 0;
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (currentView === 'view') {
      loadPlantingReports();
    } else if (currentView === 'main') {
      // Reset to current month on refresh
      const currentDate = new Date();
      setSelectedMonth(currentDate);
      loadPlantingReports();
      loadGlobalAnalytics(currentDate);
    }
    setTimeout(() => setRefreshing(false), 1000);
  }, [currentView]);

  // Refresh analytics data
  const refreshAnalytics = async () => {
    setAnalyticsLoading(true);
    // Reset to current month on refresh
    const currentDate = new Date();
    setSelectedMonth(currentDate);
    await Promise.all([
      loadPlantingReports(),
      loadGlobalAnalytics(currentDate)
    ]);
    setAnalyticsLoading(false);
  };

  // Calculate analytics from planting reports
  const calculateAnalytics = (reports: any[]) => {
    if (reports.length === 0) {
      setAnalyticsData({
        totalPlants: 0,
        cropTypes: 0,
        mostPlantedCrop: '',
        cropDistribution: []
      });
      return;
    }

    // Calculate total plants
    const totalPlants = reports.reduce((sum, report) => {
      const plantCount = typeof report.plantCount === 'number' ? report.plantCount : parseInt(report.plantCount) || 0;
      return sum + plantCount;
    }, 0);

    // Get unique crop types
    const uniqueCrops = [...new Set(reports.map(report => report.crop))];
    const cropTypes = uniqueCrops.length;

    // Calculate crop distribution
    const cropCounts: { [key: string]: number } = {};
    reports.forEach(report => {
      const plantCount = typeof report.plantCount === 'number' ? report.plantCount : parseInt(report.plantCount) || 0;
      cropCounts[report.crop] = (cropCounts[report.crop] || 0) + plantCount;
    });

    // Find most planted crop
    const mostPlantedCrop = Object.keys(cropCounts).reduce((a, b) => 
      cropCounts[a] > cropCounts[b] ? a : b, ''
    );

    // Create distribution array with percentages
    const cropDistribution = Object.entries(cropCounts)
      .map(([crop, count]) => ({
        crop,
        count,
        percentage: totalPlants > 0 ? Math.round((count / totalPlants) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    setAnalyticsData({
      totalPlants,
      cropTypes,
      mostPlantedCrop,
      cropDistribution
    });
  };

  // Load global analytics (all users data)
  const loadGlobalAnalytics = async (selectedMonth?: Date) => {
    setGlobalLoading(true);
    try {
      // Get all planting reports from all users for global trends
      const allReportsQuery = query(collection(db, 'plantingReports'));
      const allReportsSnapshot = await getDocs(allReportsQuery);
      const allReports = allReportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Helper function to filter reports by month/year
      const filterReportsByMonth = (reports: any[], month: number, year: number) => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        return reports.filter(report => {
          // If report has month/year data, filter by it
          if (report.plantingMonth && report.plantingYear) {
            return report.plantingMonth === month && report.plantingYear === year;
          }
          // If report doesn't have month/year data (old reports), only show for current month
          else if (month === currentMonth && year === currentYear) {
            return true; // Show old reports only for current month
          }
          return false; // Don't show old reports for other months
        });
      };

      // Helper function to calculate crop distribution
      const calculateCropDistribution = (reports: any[]) => {
        const cropCounts: { [key: string]: number } = {};
        const cropUserCounts: { [key: string]: Set<string> } = {};
        
        reports.forEach(report => {
          const plantCount = typeof report.plantCount === 'number' ? report.plantCount : parseInt(report.plantCount) || 0;
          cropCounts[report.crop] = (cropCounts[report.crop] || 0) + plantCount;
          
          // Track unique users for each crop
          if (!cropUserCounts[report.crop]) {
            cropUserCounts[report.crop] = new Set();
          }
          cropUserCounts[report.crop].add(report.userId);
        });

        return { cropCounts, cropUserCounts };
      };

      if (selectedMonth) {
        const targetMonth = selectedMonth.getMonth() + 1; // 1-12
        const targetYear = selectedMonth.getFullYear();

        // Current month data
        const currentReports = filterReportsByMonth(allReports, targetMonth, targetYear);

        // Previous year same month data
        const previousYearMonth = targetMonth;
        const previousYear = targetYear - 1;
        const previousYearReports = filterReportsByMonth(allReports, previousYearMonth, previousYear);

        // Previous month data
        const previousMonthDate = new Date(targetYear, targetMonth - 2, 1); // targetMonth is 1-12, Date uses 0-11, so targetMonth - 2
        const previousMonth = previousMonthDate.getMonth() + 1; // Convert back to 1-12
        const previousMonthYear = previousMonthDate.getFullYear();
        const previousMonthReports = filterReportsByMonth(allReports, previousMonth, previousMonthYear);

        // Calculate distributions for each period
        const current = calculateCropDistribution(currentReports);
        const prevYear = calculateCropDistribution(previousYearReports);
        const prevMonth = calculateCropDistribution(previousMonthReports);

        // Get all unique crops from all three periods
        const allCrops = new Set<string>();
        Object.keys(current.cropCounts).forEach(crop => allCrops.add(crop));
        Object.keys(prevYear.cropCounts).forEach(crop => allCrops.add(crop));
        Object.keys(prevMonth.cropCounts).forEach(crop => allCrops.add(crop));

        const totalGlobalPlants = Object.values(current.cropCounts).reduce((sum, count) => sum + count, 0);
        const uniqueUsers = [...new Set(currentReports.map(report => report.userId))];
        
        // Find most popular crop
        const mostPopularCrop = Object.keys(current.cropCounts).reduce((a, b) => 
          current.cropCounts[a] > current.cropCounts[b] ? a : b, ''
        );

        // Create color palette for crops
        const colors = [
          '#16543a', '#74bfa3', '#a8d5ba', '#c8e6c9', '#e8f5e8',
          '#2E8B57', '#3CB371', '#20B2AA', '#48CAE4', '#90E0EF',
          '#FF6B6B', '#FF8E53', '#FF6B35', '#F7931E', '#FFD23F'
        ];

        // Create distribution with comparisons
        const cropDistribution = Array.from(allCrops)
          .map((crop, index) => {
            const currentCount = current.cropCounts[crop] || 0;
            const prevYearCount = prevYear.cropCounts[crop] || 0;
            const prevMonthCount = prevMonth.cropCounts[crop] || 0;

            const previousYearChange = prevYearCount > 0
              ? ((currentCount - prevYearCount) / prevYearCount) * 100
              : currentCount > 0 ? 100 : 0;

            const previousMonthChange = prevMonthCount > 0
              ? ((currentCount - prevMonthCount) / prevMonthCount) * 100
              : currentCount > 0 ? 100 : 0;

            return {
              crop,
              count: currentCount,
              userCount: current.cropUserCounts[crop] ? current.cropUserCounts[crop].size : 0,
              percentage: totalGlobalPlants > 0 ? Math.round((currentCount / totalGlobalPlants) * 100) : 0,
              color: colors[index % colors.length],
              previousYearTotal: prevYearCount,
              previousYearUserCount: prevYear.cropUserCounts[crop] ? prevYear.cropUserCounts[crop].size : 0,
              previousYearChange,
              previousMonthTotal: prevMonthCount,
              previousMonthUserCount: prevMonth.cropUserCounts[crop] ? prevMonth.cropUserCounts[crop].size : 0,
              previousMonthChange,
            };
          })
          .sort((a, b) => b.count - a.count);

        setGlobalAnalytics({
          totalPlants: totalGlobalPlants,
          totalUsers: uniqueUsers.length,
          mostPopularCrop,
          cropDistribution
        });
      } else {
        // If no month selected, use all reports (original behavior)
        const uniqueUsers = [...new Set(allReports.map(report => report.userId))];
        const { cropCounts, cropUserCounts } = calculateCropDistribution(allReports);
        const totalGlobalPlants = Object.values(cropCounts).reduce((sum, count) => sum + count, 0);
        
        // Find most popular crop
        const mostPopularCrop = Object.keys(cropCounts).reduce((a, b) => 
          cropCounts[a] > cropCounts[b] ? a : b, ''
        );

        // Create color palette for crops
        const colors = [
          '#16543a', '#74bfa3', '#a8d5ba', '#c8e6c9', '#e8f5e8',
          '#2E8B57', '#3CB371', '#20B2AA', '#48CAE4', '#90E0EF',
          '#FF6B6B', '#FF8E53', '#FF6B35', '#F7931E', '#FFD23F'
        ];

        // Create distribution with colors
        const cropDistribution = Object.entries(cropCounts)
          .map(([crop, count], index) => ({
            crop,
            count,
            userCount: cropUserCounts[crop] ? cropUserCounts[crop].size : 0,
            percentage: totalGlobalPlants > 0 ? Math.round((count / totalGlobalPlants) * 100) : 0,
            color: colors[index % colors.length],
            previousYearTotal: 0,
            previousYearUserCount: 0,
            previousYearChange: 0,
            previousMonthTotal: 0,
            previousMonthUserCount: 0,
            previousMonthChange: 0,
          }))
          .sort((a, b) => b.count - a.count);

        setGlobalAnalytics({
          totalPlants: totalGlobalPlants,
          totalUsers: uniqueUsers.length,
          mostPopularCrop,
          cropDistribution
        });
      }

      // Animate the dashboard
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Error loading global analytics:', error);
    } finally {
      setGlobalLoading(false);
    }
  };

  // Load user's planting reports
  const loadPlantingReports = async () => {
    if (!user?.email) {
      console.log('⚠️ No user email available for loading planting reports');
      return;
    }
    
    setLoadingReports(true);
    try {
      console.log('🔄 Loading planting reports for user email:', user.email);
      console.log('🔄 Current user object:', { uid: user.uid, email: user.email, displayName: user.displayName });
      
      // Try querying by email first (more reliable for mock auth)
      const plantingQuery = query(
        collection(db, 'plantingReports'),
        where('farmerEmail', '==', user.email)
      );
      const plantingSnapshot = await getDocs(plantingQuery);
      const reports = plantingSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
        };
      });
      
      console.log('📋 Raw planting reports found:', reports.length);
      
      // Set reports (no fallback to userId to prevent cross-user data access)
      setPlantingReports(reports);
      calculateAnalytics(reports);
      
      // Debug: Log the actual reports data
      if (reports.length > 0) {
        console.log('📋 Sample planting report data:', reports[0]);
        console.log('📋 All planting report IDs:', reports.map(r => r.id));
      } else {
        console.log('⚠️ No planting reports found for user:', user.email);
      }
      
      // Auto-create missing harvest reports for existing planting reports
      // Disabled to prevent duplicate harvest report creation
      // await createMissingHarvestReports(allPlantingReports);
      
      console.log('✅ Loaded planting reports:', reports.length);
      
      // Debug: Log the actual reports data
      if (reports.length > 0) {
        console.log('📋 Sample planting report data:', reports[0]);
        console.log('📋 All planting report IDs:', reports.map(r => r.id));
      } else {
        console.log('⚠️ No planting reports found for user:', user.email);
      }
    } catch (error) {
      console.error('Error loading planting reports:', error);
      Alert.alert('Error', 'Failed to load planting reports. Please try again.');
    } finally {
      setLoadingReports(false);
    }
  };

  // Load reports when switching to view mode or main mode
  useEffect(() => {
    if (currentView === 'view' || currentView === 'main') {
      loadPlantingReports();
      if (currentView === 'main') {
        // Always use current month when switching to main view
        const currentDate = new Date();
        setSelectedMonth(currentDate);
        loadGlobalAnalytics(currentDate);
      }
    }
  }, [currentView]);

  // Filter crops based on search query (both English and Tagalog names)
  const filteredCrops = CROP_TYPES.filter(crop => {
    const englishName = crop.toLowerCase();
    const tagalogName = getCropTagalogName(crop).toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return englishName.includes(query) || tagalogName.includes(query);
  });

  const handleCropSelect = (crop: string) => {
    setSelectedCrop(crop);
    setSearchQuery(crop);
    setShowSuggestions(false);
  };

  const handleEditReport = (report: any) => {
    setEditingReport(report);
    setIsEditMode(true);
    setSelectedCrop(report.crop);
    setSearchQuery(report.crop);
    setAmount(report.areaPlanted.toString());
    setAmountType(report.areaType);
    setPlantingDate(report.plantingDate);
    setExpectedHarvestDate(report.expectedHarvestDate || '');
    setPlantCount(report.plantCount.toString());
    setExpectedHarvest(report.expectedHarvest?.toString() || '');
    setCurrentView('create');
  };

  const handleDeleteReport = async (reportId: string) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this planting report?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'plantingReports', reportId));
              Alert.alert('Success', 'Report deleted successfully');
              loadPlantingReports();
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const createMissingHarvestReports = async (allPlantingReports: any[]) => {
    try {
      console.log('🔧 Checking for missing harvest reports...');
      
      for (const plantingReport of allPlantingReports) {
        // Check if harvest report already exists for this planting report
        const existingHarvestQuery = query(
          collection(db, 'harvestReports'),
          where('plantingReportId', '==', plantingReport.id)
        );
        const existingHarvestSnapshot = await getDocs(existingHarvestQuery);
        
        if (existingHarvestSnapshot.empty) {
          console.log('🔧 Creating missing harvest report for planting report:', plantingReport.id);
          
          // Create harvest report from planting report data using unified format
          const harvestReportData = {
            ...plantingReport,
            plantingReportId: plantingReport.id,
            status: 'pending',
            actualHarvest: 0,
            harvestWeight: 0,
            isHarvested: false,
            amount: 0,
            amountType: 'kg',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const docRef = await addDoc(collection(db, 'harvestReports'), harvestReportData);
          console.log('✅ Auto-created harvest report with ID:', docRef.id);
        } else {
          console.log('✅ Harvest report already exists for planting report:', plantingReport.id);
        }
      }
      
      console.log('🔧 Finished checking for missing harvest reports');
    } catch (error) {
      console.error('Error creating missing harvest reports:', error);
    }
  };

  const handleCreateHarvestReport = async (plantingReport: any) => {
    try {
      console.log('🌱 Creating harvest report for planting report:', plantingReport.id);
      
      // Check if harvest report already exists for this planting report
      const existingHarvestQuery = query(
        collection(db, 'harvestReports'),
        where('plantingReportId', '==', plantingReport.id)
      );
      const existingHarvestSnapshot = await getDocs(existingHarvestQuery);
      
      if (!existingHarvestSnapshot.empty) {
        Alert.alert('Harvest Report Exists', 'A harvest report already exists for this planting report.');
        return;
      }
      
      // Create harvest report from planting report data using unified format
      const harvestReportData = {
        ...plantingReport,
        plantingReportId: plantingReport.id,
        status: 'pending',
        actualHarvest: 0,
        harvestWeight: 0,
        isHarvested: false,
        amount: 0,
        amountType: 'kg',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'harvestReports'), harvestReportData);
      console.log('✅ Harvest report created with ID:', docRef.id);
      
      Alert.alert(
        'Success', 
        `Harvest report created for ${plantingReport.crop}. You can now record your harvest when ready.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to harvest reports view
              router.push('/harvest-view-reports');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error creating harvest report:', error);
      Alert.alert('Error', 'Failed to create harvest report. Please try again.');
    }
  };

  const clearForm = () => {
              setSelectedCrop('');
              setSearchQuery('');
    setShowSuggestions(false);
              setAmount('');
              setAmountType('sqm');
    setPlantingDate(getTodayDate());
              setExpectedHarvestDate('');
              setPlantCount('');
              setExpectedHarvest('');
              setIsEditMode(false);
    setEditingReport(null);
  };

  const handleSubmit = async () => {
    if (!selectedCrop || !amount || !expectedHarvestDate || !plantCount || !expectedHarvest) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!user || !profile) {
      Alert.alert('Error', 'Please log in to submit reports.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const plantingDateObj = new Date(plantingDate);
      const plantingData = createUnifiedPlantingData({
        userId: user.email || '', // Use email as unique identifier instead of mock UID
        farmerName: profile.name || '',
        farmerEmail: user.email || '',
        userBarangay: profile.barangay || '',
        crop: selectedCrop,
        variety: '', // Not available in current form
        plantingDate: plantingDate,
        plantCount: parseInt(plantCount) || 0,
        areaPlanted: parseFloat(amount) || 0,
        areaType: amountType,
        soilType: '', // Not available in current form
        irrigation: '', // Not available in current form
        fertilizer: '', // Not available in current form
        notes: '', // Not available in current form
        expectedHarvestDate: expectedHarvestDate,
        expectedYield: parseFloat(expectedHarvest) || 0,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      if (isEditMode && editingReport) {
        // Update existing planting report
        await updateDoc(doc(db, 'plantingReports', editingReport.id), plantingData);

        // Also sync the linked harvest report (old-format)
        try {
          const linkedHarvestQuery = query(
            collection(db, 'harvestReports'),
            where('plantingReportId', '==', editingReport.id)
          );
          const linkedSnap = await getDocs(linkedHarvestQuery);
          if (!linkedSnap.empty) {
            const hr = linkedSnap.docs[0];
            // Update harvest report with unified format
            const updatedHarvestData = {
              ...plantingData,
              plantingReportId: editingReport.id,
              updatedAt: new Date().toISOString()
            };
            await updateDoc(doc(db, 'harvestReports', hr.id), updatedHarvestData);
          }
        } catch (e) {
          console.warn('Failed to sync linked harvest report on edit:', e);
        }
        Alert.alert(
          'Success!',
          'Planting report updated successfully.',
          [
            {
              text: 'OK',
              onPress: async () => {
                clearForm();
                setCurrentView('main');
                await loadPlantingReports();
                // Also reload global analytics to reflect changes
                await loadGlobalAnalytics();
              }
            }
          ]
        );
      } else {
        // Create new planting report
        const plantingDocRef = await addDoc(collection(db, 'plantingReports'), plantingData);
        console.log('✅ Planting report created with ID:', plantingDocRef.id);
        
        // Create corresponding harvest report using unified format
        const harvestData = {
          ...plantingData,
          plantingReportId: plantingDocRef.id,
          status: 'pending',
          actualHarvest: 0,
          harvestWeight: 0,
          isHarvested: false,
          amount: 0,
          amountType: 'kg',
        };

        const harvestDocRef = await addDoc(collection(db, 'harvestReports'), harvestData);
        console.log('✅ Linked unified harvest report created with ID:', harvestDocRef.id);
        
        Alert.alert(
          'Success!',
          'Planting report submitted successfully and harvest report created automatically. You can record your harvest when ready.',
          [
            {
              text: 'OK',
              onPress: async () => {
                clearForm();
                setCurrentView('main');
                await loadPlantingReports();
                // Also reload global analytics to reflect changes
                await loadGlobalAnalytics();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting planting report:', error);
      Alert.alert('Error', 'Failed to submit planting report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Top Green Border */}
        <View style={styles.topBorder} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (currentView === 'main') {
                router.back();
              } else {
                clearForm();
                setCurrentView('main');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {currentView === 'main' ? 'Planting Report' : 
             currentView === 'create' ? (isEditMode ? 'Edit Report' : 'Create New Report') : 'View Reports'}
          </Text>
            {currentView === 'main' && (
              <Text style={styles.headerSubtitle}>Manage your planting reports</Text>
            )}
            {currentView === 'view' && (
              <Text style={styles.headerSubtitle}>Your submitted planting reports</Text>
            )}
            {currentView === 'create' && (
              <Text style={styles.headerSubtitle}>
                {isEditMode ? 'Update your planting information' : 'Record your planting activities and area details'}
              </Text>
            )}
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
        <View style={styles.contentContainer}>
          {currentView === 'main' && (
            <>
              <View style={styles.menuContainer}>
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => {
                    clearForm();
                    setCurrentView('create');
                  }}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="add-circle" size={32} color={GREEN} />
                  </View>
                  <Text style={styles.menuTitle}>Create New Report</Text>
                  <Text style={styles.menuDescription}>Submit a new planting report</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => setCurrentView('view')}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="list" size={32} color={GREEN} />
                  </View>
                  <Text style={styles.menuTitle}>View Reports</Text>
                  <Text style={styles.menuDescription}>View your submitted planting reports</Text>
                </TouchableOpacity>
              </View>

                {/* Spacing between menu and analytics */}
                <View style={styles.analyticsSpacing} />

                {/* Simple Analytics Dashboard */}
                <Animated.View 
                  style={[
                    styles.dashboardContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }]
                    }
                  ]}
                >
                  {/* Dashboard Header */}
                  <View style={styles.dashboardHeader}>
                    <Text style={styles.dashboardTitle}>🌱 Planting Analytics Overview</Text>
                    <Text style={styles.dashboardSubtitle}>See your planting progress and global crop trends</Text>
                  </View>

                  {/* Personal Summary Card */}
                  <View style={styles.personalSummaryCard}>
                    <View style={styles.personalSummaryHeader}>
                      <Ionicons name="person" size={24} color={GREEN} />
                      <Text style={styles.personalSummaryTitle}>Your Planting Summary</Text>
                    </View>
                    
                    <View style={styles.personalSummaryStats}>
                      <View style={styles.personalStatItem}>
                        <Text style={styles.personalStatValue}>{analyticsData.totalPlants.toLocaleString()}</Text>
                        <Text style={styles.personalStatLabel}>Total Plants</Text>
                      </View>
                      <View style={styles.personalStatItem}>
                        <Text style={styles.personalStatValue}>{analyticsData.cropTypes}</Text>
                        <Text style={styles.personalStatLabel}>Crop Types</Text>
                      </View>
                      <View style={styles.personalStatItem}>
                        <Text style={styles.personalStatValue}>{analyticsData.mostPlantedCrop || 'None'}</Text>
                        <Text style={styles.personalStatLabel}>Most Planted</Text>
                      </View>
                    </View>
                  </View>

                  {/* Global Trends Section */}
                  <View style={styles.globalTrendsCard}>
                    <View style={styles.globalTrendsHeader}>
                      <Text style={styles.globalTrendsTitle}>🌍 Lopez Planting Trends</Text>
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
                          <Text style={styles.barChartTitle}>Lopez Crop Distribution</Text>
                          
                          {/* Month Navigation */}
                          <View style={styles.monthNavigationContainer}>
                            <TouchableOpacity 
                              style={styles.monthNavButton}
                              onPress={async () => {
                                const newDate = new Date(selectedMonth);
                                newDate.setMonth(newDate.getMonth() - 1);
                                setSelectedMonth(newDate);
                                await loadGlobalAnalytics(newDate);
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
                                await loadGlobalAnalytics(newDate);
                              }}
                            >
                              <Ionicons name="chevron-forward" size={20} color={GREEN} />
                            </TouchableOpacity>
                          </View>
                          
                          {hasDataForMonth(selectedMonth) ? (
                            <>
                              <View style={styles.horizontalBarChartWrapper}>
                                {globalAnalytics.cropDistribution.map((item, index) => {
                                  const rank = index + 1;
                                  const maxValue = Math.max(...globalAnalytics.cropDistribution.map(crop => crop.count));
                                  const barWidth = (item.count / maxValue) * 100; // Percentage width
                                  
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
                                        <View style={styles.horizontalBarRankWrapper}>
                                          <Text style={[
                                            styles.horizontalBarRank,
                                            rank === 1 && styles.horizontalBarRankFirst,
                                            rank === 2 && styles.horizontalBarRankSecond,
                                            rank === 3 && styles.horizontalBarRankThird
                                          ]}>
                                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                          </Text>
                                        </View>
                                        <View style={styles.horizontalBarPercentageWrapper}>
                                          <Text style={styles.horizontalBarPercentage}>
                                            {item.percentage}%
                                          </Text>
                                        </View>
                                      </View>
                                      <View style={styles.horizontalBarContainer}>
                                        <View style={styles.horizontalBarCropNameContainer}>
                                          <View style={styles.horizontalBarCropContainer}>
                                            <Text style={styles.horizontalBarCropIcon}>
                                              {getCropIcon(item.crop)}
                                            </Text>
                                            <Text style={styles.horizontalBarLabel} numberOfLines={1}>
                                              {item.crop} / {getCropTagalogName(item.crop)}
                                            </Text>
                                          </View>
                                        </View>
                                        <View 
                                          style={[
                                            styles.horizontalBar, 
                                            { 
                                              width: `${barWidth}%`,
                                              backgroundColor: '#81C784'
                                            }
                                          ]} 
                                        >
                                          <View style={styles.horizontalBarValueOverlay}>
                                            <Text style={styles.horizontalBarValueOnBar}>
                                              {item.count.toLocaleString()}
                                            </Text>
                                          </View>
                                        </View>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                              <Text style={styles.barChartDescription}>
                                Total: {globalAnalytics.totalPlants.toLocaleString()} plants across all farmers
                              </Text>
                            </>
                          ) : null}
                          
                          {/* Divider between charts */}
                          {hasDataForMonth(selectedMonth) && (
                            <View style={styles.chartDivider}>
                              <View style={styles.dividerLine} />
                              <View style={styles.dividerTextContainer}>
                                <Text style={styles.dividerText}>Analytics Breakdown</Text>
                              </View>
                              <View style={styles.dividerLine} />
                            </View>
                          )}
                          
                          {/* User Count Chart */}
                          {hasDataForMonth(selectedMonth) && (
                            <View style={styles.barChartContainer}>
                              <Text style={styles.barChartTitle}>Farmers Growing Each Crop</Text>
                              
                              <View style={styles.horizontalBarChartWrapper}>
                                {globalAnalytics.cropDistribution
                                  .sort((a, b) => b.userCount - a.userCount) // Sort by user count, not plant count
                                  .map((item, index) => {
                                  const rank = index + 1;
                                  const maxUsers = Math.max(...globalAnalytics.cropDistribution.map(crop => crop.userCount));
                                  const barWidth = maxUsers > 0 ? (item.userCount / maxUsers) * 100 : 0;
                                  
                                  return (
                                    <View key={`user-${item.crop}`} style={[
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
                                        <View style={styles.horizontalBarRankWrapper}>
                                          <Text style={[
                                            styles.horizontalBarRank,
                                            rank === 1 && styles.horizontalBarRankFirst,
                                            rank === 2 && styles.horizontalBarRankSecond,
                                            rank === 3 && styles.horizontalBarRankThird
                                          ]}>
                                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                          </Text>
                                        </View>
                                        <View style={styles.horizontalBarPercentageWrapper}>
                                          <Text style={styles.horizontalBarPercentage}>
                                            {item.userCount} farmer{item.userCount !== 1 ? 's' : ''}
                                          </Text>
                                        </View>
                                      </View>
                                      <View style={styles.horizontalBarContainer}>
                                        <View style={styles.horizontalBarCropNameContainer}>
                                          <View style={styles.horizontalBarCropContainer}>
                                            <Text style={styles.horizontalBarCropIcon}>
                                              {getCropIcon(item.crop)}
                                            </Text>
                                            <Text style={styles.horizontalBarLabel} numberOfLines={1}>
                                              {item.crop} / {getCropTagalogName(item.crop)}
                                            </Text>
                                          </View>
                                        </View>
                                        <View 
                                          style={[
                                            styles.horizontalBar, 
                                            { 
                                              width: `${barWidth}%`,
                                              backgroundColor: '#81C784'
                                            }
                                          ]} 
                                        >
                                          <View style={styles.horizontalBarValueOverlay}>
                                            <Text style={styles.horizontalBarValueOnBar}>
                                              {item.userCount}
                                            </Text>
                                          </View>
                                        </View>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                              <Text style={styles.barChartDescription}>
                                Number of different farmers growing each crop type
                              </Text>
                            </View>
                          )}

                          {/* Comparison Section - Always show if there's any data (current, previous month, or previous year) */}
                          {globalAnalytics.cropDistribution.some(item => 
                            item.count > 0 || 
                            item.previousYearTotal > 0 || 
                            item.previousMonthTotal > 0
                          ) && (
                            <View style={styles.comparisonSection}>
                              <Text style={styles.comparisonSectionTitle}>📊 Planting Comparison Analysis</Text>
                              {globalAnalytics.cropDistribution
                                .filter(item => 
                                  item.count > 0 || 
                                  item.previousYearTotal > 0 || 
                                  item.previousMonthTotal > 0
                                )
                                .sort((a, b) => {
                                  // Sort by: current count first, then previous month, then previous year
                                  const aMax = Math.max(a.count, a.previousMonthTotal, a.previousYearTotal);
                                  const bMax = Math.max(b.count, b.previousMonthTotal, b.previousYearTotal);
                                  return bMax - aMax;
                                })
                                .map((item) => (
                                <View key={item.crop} style={styles.comparisonItemCard}>
                                  <View style={styles.comparisonItemHeader}>
                                    <Text style={styles.comparisonCropIcon}>{getCropIcon(item.crop)}</Text>
                                    <Text style={styles.comparisonCropName}>{item.crop}</Text>
                                  </View>
                                  <View style={styles.comparisonItemContent}>
                                    {/* Current Month */}
                                    <View style={styles.comparisonDataRow}>
                                      <Text style={styles.comparisonPeriodLabel}>Current Month:</Text>
                                      {item.count > 0 ? (
                                        <View style={styles.comparisonDataValueContainer}>
                                          <Text style={styles.comparisonDataValue}>{item.count.toLocaleString()} plants</Text>
                                          <Text style={styles.comparisonDataSubtext}> ({item.userCount} farmers)</Text>
                                        </View>
                                      ) : (
                                        <Text style={styles.comparisonNoData}>No data</Text>
                                      )}
                                    </View>

                                    {/* Previous Year */}
                                    <View style={styles.comparisonDataRow}>
                                      <Text style={styles.comparisonPeriodLabel}>Last Year:</Text>
                                      {item.previousYearTotal > 0 ? (
                                        <View style={styles.comparisonDataValueContainer}>
                                          {item.count > 0 && (
                                            <Text style={[
                                              styles.comparisonChangeIndicator,
                                              item.previousYearChange >= 0 ? styles.comparisonPositive : styles.comparisonNegative
                                            ]}>
                                              {item.previousYearChange >= 0 ? '↑' : '↓'} {Math.abs(item.previousYearChange).toFixed(1)}%
                                            </Text>
                                          )}
                                          <Text style={styles.comparisonDataValue}>{item.previousYearTotal.toLocaleString()} plants</Text>
                                          <Text style={styles.comparisonDataSubtext}> ({item.previousYearUserCount} farmers)</Text>
                                        </View>
                                      ) : (
                                        <Text style={styles.comparisonNoData}>No data</Text>
                                      )}
                                    </View>

                                    {/* Previous Month */}
                                    <View style={styles.comparisonDataRow}>
                                      <Text style={styles.comparisonPeriodLabel}>Last Month:</Text>
                                      {item.previousMonthTotal > 0 ? (
                                        <View style={styles.comparisonDataValueContainer}>
                                          {item.count > 0 && (
                                            <Text style={[
                                              styles.comparisonChangeIndicator,
                                              item.previousMonthChange >= 0 ? styles.comparisonPositive : styles.comparisonNegative
                                            ]}>
                                              {item.previousMonthChange >= 0 ? '↑' : '↓'} {Math.abs(item.previousMonthChange).toFixed(1)}%
                                            </Text>
                                          )}
                                          <Text style={styles.comparisonDataValue}>{item.previousMonthTotal.toLocaleString()} plants</Text>
                                          <Text style={styles.comparisonDataSubtext}> ({item.previousMonthUserCount} farmers)</Text>
                                        </View>
                                      ) : (
                                        <Text style={styles.comparisonNoData}>No data</Text>
                                      )}
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                          
                          {!hasDataForMonth(selectedMonth) && (
                            <View style={styles.noDataContainer}>
                              <Ionicons name="bar-chart-outline" size={48} color="#CCC" />
                              <Text style={styles.noDataTitle}>No Trends Data</Text>
                              <Text style={styles.noDataSubtitle}>
                                No planting data available for {selectedMonth.toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </Text>
                              <Text style={styles.noDataHint}>
                                Try selecting a different month or check back later for new data
                              </Text>
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                </Animated.View>

                {/* Highlights Cards */}
                <View style={styles.highlightsContainer}>
                  <View style={[styles.highlightCard, styles.highlightCard1]}>
                    <Ionicons name="trophy" size={20} color="#FFD700" />
                    <Text style={styles.highlightTitle}>Most Popular Crop</Text>
                    <Text style={styles.highlightValue}>{globalAnalytics.mostPopularCrop || 'N/A'}</Text>
                  </View>
                  
                  <View style={[styles.highlightCard, styles.highlightCard2]}>
                    <Ionicons name="leaf" size={20} color="#2E8B57" />
                    <Text style={styles.highlightTitle}>Total Crops Planted</Text>
                    <Text style={styles.highlightValue}>{globalAnalytics.totalPlants.toLocaleString()}+</Text>
                  </View>
                  
                  <View style={[styles.highlightCard, styles.highlightCard3]}>
                    <Ionicons name="people" size={20} color="#4A90E2" />
                    <Text style={styles.highlightTitle}>Active Farmers</Text>
                    <Text style={styles.highlightValue}>{globalAnalytics.totalUsers} Users</Text>
                  </View>
                </View>
            </>
          )}

          {currentView === 'create' && (
            <>

          {/* Crop/Product Selection */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.sectionIconCrop]}>
                <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
              </View>
            <Text style={styles.sectionLabel}>Product/Crop</Text>
            </View>
            <View style={styles.searchContainer}>
                    {selectedCrop ? (
                      <View style={styles.selectedCropContainer}>
                        <Text style={styles.selectedCropIcon}>{getCropIcon(selectedCrop)}</Text>
                        <View style={styles.selectedCropTextContainer}>
                          <Text style={styles.selectedCropText}>{selectedCrop}</Text>
                          <Text style={styles.selectedCropTagalogText}>{getCropTagalogName(selectedCrop)}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.clearCropButton}
                          onPress={() => {
                            setSelectedCrop('');
                            setSearchQuery('');
                            setShowSuggestions(false);
                          }}
                        >
                          <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
              <TextInput
                style={styles.searchInput}
                          placeholder="Enter crops (English/Tagalog)..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSuggestions(text.length > 0);
                  if (text.length === 0) {
                    setSelectedCrop('');
                  }
                }}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
              />
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                      </>
                    )}
            </View>
            
            {showSuggestions && filteredCrops.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredCrops.slice(0, 5).map((item, index) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.suggestionItem}
                    onPress={() => handleCropSelect(item)}
                  >
                          <Text style={styles.suggestionIcon}>{getCropIcon(item)}</Text>
                          <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionText}>{item}</Text>
                            <Text style={styles.suggestionTagalogText}>{getCropTagalogName(item)}</Text>
                          </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Planting Date Section */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.sectionIconDate]}>
                <Ionicons name="calendar-outline" size={20} color="#388E3C" />
              </View>
            <Text style={styles.sectionLabel}>Planting Date</Text>
            </View>
            <TouchableOpacity 
              style={styles.dateContainer}
              onPress={() => setShowPlantingDatePicker(true)}
            >
              <TextInput
                style={styles.dateInput}
                value={plantingDate}
                editable={false}
                placeholder=""
              />
              <Ionicons name="calendar" size={20} color={GREEN} style={styles.dateIcon} />
            </TouchableOpacity>
          </View>

          {/* Expected Harvest Date Section */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.sectionIconTime]}>
                <Ionicons name="time-outline" size={20} color="#2E7D32" />
              </View>
            <Text style={styles.sectionLabel}>Expected Harvest Date</Text>
            </View>
            <TouchableOpacity 
              style={styles.dateContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <TextInput
                style={styles.dateInput}
                value={expectedHarvestDate}
                editable={false}
                placeholder=""
              />
              <Ionicons name="calendar" size={20} color={GREEN} style={styles.dateIcon} />
            </TouchableOpacity>
          </View>

          {/* Number of Plants/Seeds Section */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.sectionIconPlants]}>
                <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
              </View>
            <Text style={styles.sectionLabel}>Number of Plants/Seeds</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter number of plants or seeds"
              value={plantCount}
              onChangeText={setPlantCount}
              keyboardType="numeric"
            />
            <Text style={styles.dateNote}>Enter the total number of plants or seeds planted</Text>
          </View>

          {/* Expected Harvest Section */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.sectionIconHarvest]}>
                <Ionicons name="basket-outline" size={20} color="#2E7D32" />
              </View>
            <Text style={styles.sectionLabel}>Expected Harvest (kg)</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter expected harvest in kilograms"
              value={expectedHarvest}
              onChangeText={setExpectedHarvest}
              keyboardType="numeric"
            />
            <Text style={styles.dateNote}>Enter the expected harvest amount in kilograms</Text>
          </View>

          {/* Area Section */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.sectionIconArea]}>
                <Ionicons name="resize-outline" size={20} color="#388E3C" />
              </View>
            <Text style={styles.sectionLabel}>Area Planted</Text>
            </View>
            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter area size"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <View style={styles.amountTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.amountTypeButton,
                    amountType === 'sqm' && styles.amountTypeButtonActive
                  ]}
                  onPress={() => setAmountType('sqm')}
                >
                  <Text style={[
                    styles.amountTypeText,
                    amountType === 'sqm' && styles.amountTypeTextActive
                  ]}>sqm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.amountTypeButton,
                    amountType === 'hectares' && styles.amountTypeButtonActive
                  ]}
                  onPress={() => setAmountType('hectares')}
                >
                  <Text style={[
                    styles.amountTypeText,
                    amountType === 'hectares' && styles.amountTypeTextActive
                  ]}>hectares</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

              {/* Submit Button */}
              <View style={styles.submitButtonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                disabled={submitting}
              >
                  <View style={styles.submitButtonContent}>
                <Ionicons 
                      name={submitting ? "hourglass" : (isEditMode ? "checkmark-circle" : "add-circle")} 
                      size={22} 
                  color="#fff" 
                />
                <Text style={styles.submitButtonText}>
                      {submitting ? 'Submitting...' : (isEditMode ? 'Update Report' : 'Submit Report')}
                </Text>
                  </View>
              </TouchableOpacity>
              </View>
            </>
          )}

          {currentView === 'view' && (
            <>
              {loadingReports ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading reports...</Text>
                </View>
              ) : plantingReports.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="leaf-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No planting reports found</Text>
                  <Text style={styles.emptySubtext}>Create your first planting report</Text>
                </View>
              ) : (
                <View style={styles.reportsList}>
                  {plantingReports.map((report, index) => (
                    <View key={report.id} style={styles.reportCard}>
                      <View style={styles.reportHeader}>
                        <View style={styles.reportIconContainer}>
                          <Text style={styles.cropEmoji}>{getCropIcon(report.crop)}</Text>
                        </View>
                        <View style={styles.reportMainInfo}>
                          <View style={styles.cropNameRow}>
                          <Text style={styles.reportCrop} numberOfLines={1}>{report.crop}</Text>
                            <View style={[styles.statusBadge, 
                              report.status === 'approved' ? styles.approvedBadge : 
                              report.status === 'rejected' ? styles.rejectedBadge : 
                              styles.pendingBadge]}>
                              <Text style={[styles.statusText,
                                report.status === 'approved' ? styles.approvedText : 
                                report.status === 'rejected' ? styles.rejectedText : 
                                styles.pendingText]}>
                                {report.status?.charAt(0).toUpperCase() + report.status?.slice(1) || 'Pending'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.reportTagalog}>{getCropTagalogName(report.crop)}</Text>
                        </View>
                      </View>
                      
                      {/* Key dates */}
                      <View style={styles.datesSection}>
                        <View style={styles.dateItem}>
                          <Ionicons name="calendar-outline" size={16} color="#4CAF50" />
                          <Text style={styles.dateLabel}>Planted:</Text>
                          <Text style={styles.dateValue}>{report.plantingDate}</Text>
                        </View>
                        {report.expectedHarvestDate && (
                          <View style={styles.dateItem}>
                            <Ionicons name="time-outline" size={16} color="#FF9800" />
                            <Text style={styles.dateLabel}>Expected:</Text>
                            <Text style={styles.dateValue}>{report.expectedHarvestDate}</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Details grid */}
                      <View style={styles.detailsGrid}>
                        <View style={styles.detailCard}>
                          <Ionicons name="resize-outline" size={20} color="#2196F3" />
                          <Text style={styles.detailNumber}>{report.areaPlanted}</Text>
                          <Text style={styles.detailUnit}>{report.areaType}</Text>
                        </View>
                        <View style={styles.detailCard}>
                          <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
                          <Text style={styles.detailNumber}>{report.plantCount}</Text>
                          <Text style={styles.detailUnit}>Plants</Text>
                        </View>
                        {report.expectedHarvest && (
                          <View style={styles.detailCard}>
                            <Ionicons name="basket-outline" size={20} color="#FF9800" />
                            <Text style={styles.detailNumber}>{report.expectedHarvest}</Text>
                            <Text style={styles.detailUnit}>kg</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Action buttons */}
                      <View style={styles.reportActions}>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => handleEditReport(report)}
                        >
                          <Ionicons name="create-outline" size={18} color="#fff" />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteReport(report.id)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#fff" />
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Expected Harvest Date Picker - No Modal */}
      {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setSelectedDate(selectedDate);
              setExpectedHarvestDate(formatDateToISO(selectedDate));
            }
          }}
          minimumDate={new Date()}
                style={styles.datePicker}
              />
      )}

      {/* Planting Date Picker - No Modal */}
      {showPlantingDatePicker && (
        <DateTimePicker
          value={selectedPlantingDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPlantingDatePicker(false);
            if (selectedDate) {
              setSelectedPlantingDate(selectedDate);
              setPlantingDate(formatDateToISO(selectedDate));
            }
          }}
          maximumDate={new Date()}
          style={styles.datePicker}
        />
      )}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
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
    backgroundColor: 'rgba(76, 175, 80, 0.03)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 30,
  },
  formSection: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 8,
  },
  searchContainer: {
    position: 'relative',
  },
  selectedCropContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectedCropIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  selectedCropTextContainer: {
    flex: 1,
  },
  selectedCropText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedCropTagalogText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  clearCropButton: {
    padding: 4,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  suggestionTagalogText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  amountTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  amountTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  amountTypeButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  amountTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  amountTypeTextActive: {
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#66BB6A',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Enhanced Form Styles
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  formHeaderText: {
    flex: 1,
  },
  formHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  formHeaderSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIconCrop: {
    backgroundColor: '#E8F5E8', // Light green for crop
  },
  sectionIconDate: {
    backgroundColor: '#E8F5E8', // Light green for date
  },
  sectionIconTime: {
    backgroundColor: '#E8F5E8', // Light green for time
  },
  sectionIconArea: {
    backgroundColor: '#E8F5E8', // Light green for area
  },
  sectionIconPlants: {
    backgroundColor: '#E8F5E8', // Light green for plants
  },
  sectionIconHarvest: {
    backgroundColor: '#E8F5E8', // Light green for harvest
  },
  submitButtonContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContainer: {
    position: 'relative',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  dateIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  dateNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  menuContainer: {
    gap: 16,
  },
  menuButton: {
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
  menuIconContainer: {
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  analyticsSpacing: {
    height: 32,
  },
  reportsList: {
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  cropEmoji: {
    fontSize: 28,
  },
  reportMainInfo: {
    flex: 1,
  },
  cropNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'nowrap',
  },
  reportCrop: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  reportTagalog: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  approvedBadge: {
    backgroundColor: '#d4edda',
  },
  rejectedBadge: {
    backgroundColor: '#f8d7da',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approvedText: {
    color: '#155724',
  },
  rejectedText: {
    color: '#721c24',
  },
  pendingText: {
    color: '#856404',
  },
  datesSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 70,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  detailNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 4,
  },
  detailUnit: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  reportDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GREEN,
  },
  datePickerCloseButton: {
    padding: 4,
  },
  datePicker: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  // Dashboard Styles
  dashboardContainer: {
    marginBottom: 24,
    gap: 16,
  },
  dashboardHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  personalSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  personalSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  personalSummaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 8,
  },
  personalSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personalStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 2,
  },
  personalStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 4,
    textAlign: 'center',
  },
  personalStatLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  globalTrendsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  globalTrendsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  globalTrendsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
  },
  barChartContainer: {
    marginBottom: 20,
  },
  barChartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 16,
  },
  monthNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 10,
  },
  monthDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 120,
    textAlign: 'center',
  },
  horizontalBarChartWrapper: {
    marginBottom: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  horizontalBarRankWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
  },
  horizontalBarRank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  horizontalBarRankFirst: {
    color: '#FFD700',
    fontSize: 16,
  },
  horizontalBarRankSecond: {
    color: '#C0C0C0',
    fontSize: 16,
  },
  horizontalBarRankThird: {
    color: '#CD7F32',
    fontSize: 16,
  },
  horizontalBarLabelWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  horizontalBarCropContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalBarCropIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  horizontalBarLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  horizontalBarPercentageWrapper: {
    flex: 1,
    alignItems: 'flex-end',
  },
  horizontalBarPercentage: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 35,
  },
  horizontalBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    position: 'relative',
  },
  horizontalBarCropNameContainer: {
    position: 'absolute',
    top: -25,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  horizontalBar: {
    height: 16,
    borderRadius: 8,
    minWidth: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalBarValueOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalBarValueOnBar: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  barChartDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Chart Divider Styles
  chartDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerTextContainer: {
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataHint: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  comparisonSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  comparisonItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  comparisonItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e8e8e8',
  },
  comparisonCropIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  comparisonCropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  comparisonItemContent: {
    paddingLeft: 0,
  },
  comparisonDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    minHeight: 40,
  },
  comparisonPeriodLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    flex: 1,
    letterSpacing: 0.2,
  },
  comparisonDataValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 2,
    justifyContent: 'flex-end',
  },
  comparisonDataValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  comparisonDataSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  comparisonChangeIndicator: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
    letterSpacing: 0.5,
  },
  comparisonNoData: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    fontStyle: 'italic',
    flex: 2,
    textAlign: 'right',
  },
  comparisonPositive: {
    color: '#2E7D32',
  },
  comparisonNegative: {
    color: '#C62828',
  },
  analyticsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  highlightsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  highlightCard1: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  highlightCard2: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  highlightCard3: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  highlightTitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
});
