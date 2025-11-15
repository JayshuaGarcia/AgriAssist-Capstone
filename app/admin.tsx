import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAnnouncements } from '../components/AnnouncementContext';
import { useAuth } from '../components/AuthContext';
import { ForecastingCalendar } from '../components/ForecastingCalendar';
import { useNotification } from '../components/NotificationContext';
import { PriceMonitoringList } from '../components/PriceMonitoringList';
import { SlidingAnnouncement } from '../components/SlidingAnnouncement';
import { Commodity, COMMODITY_DATA } from '../constants/CommodityData';
import { useNavigationBar } from '../hooks/useNavigationBar';
import { useCategories, useCommodityManagement } from '../hooks/useOfflineCommodities';
import { db } from '../lib/firebase';
import { CommodityPrice, getAllCommodities } from '../services/csvPriceService';
import { convertToUnifiedFormat } from '../types/UnifiedReportFormat';

const { width } = Dimensions.get('window');
const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  
  // Configure navigation bar to be hidden
  useNavigationBar('hidden');

  // Check admin authentication
  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'You must be logged in to access the admin panel.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
      return;
    }
    
    if (profile.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can access this page.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
      return;
    }
  }, [user, profile.role]);

  const { announcements, addAnnouncement, loadAnnouncements, deleteAnnouncement, loading: announcementLoading, error: announcementError } = useAnnouncements();
  
  // Debug announcements
  useEffect(() => {
    console.log('🔔 Admin announcements state:', {
      count: announcements.length,
      loading: announcementLoading,
      error: announcementError,
      announcements: announcements.map(a => ({ id: a.id, title: a.title, createdBy: a.createdBy }))
    });
  }, [announcements, announcementLoading, announcementError]);
  const { showNotification } = useNotification();

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeNav, setActiveNav] = useState('home');
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usersDirectory, setUsersDirectory] = useState<Record<string, { name?: string; email?: string; userCropEmoji?: string }>>({});

  useEffect(() => {
    if (activeNav !== 'harvest-records') {
      setShowUserReports(false);
      setShowAllHarvestEntries(false);
      setSelectedUserAccount(null);
    }
  }, [activeNav]);

  // Search data for navigation
  const searchData = [
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Manage system announcements',
      category: 'Management',
      icon: 'megaphone',
      action: () => setActiveNav('announcements')
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'View and manage messages',
      category: 'Communication',
      icon: 'chatbubbles',
      action: () => setActiveNav('messages')
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage users, block, and delete accounts',
      category: 'Management',
      icon: 'people',
      action: () => setActiveNav('user-management')
    },
    {
      id: 'planting-records',
      title: 'Planting Records',
      description: 'View planting reports and records',
      category: 'Reports',
      icon: 'leaf',
      action: () => setActiveNav('planting-records')
    },
    {
      id: 'harvest-records',
      title: 'Harvest Records',
      description: 'View harvest reports and records',
      category: 'Reports',
      icon: 'basket',
      action: () => setActiveNav('harvest-records')
    },
    {
      id: 'farmers-records',
      title: 'Farmers Records',
      description: 'View and manage farmer profiles',
      category: 'Management',
      icon: 'people',
      action: () => setActiveNav('farmers-records')
    },
    {
      id: 'price-monitoring',
      title: 'Price Monitoring',
      description: 'Monitor agricultural commodity prices',
      category: 'Analytics',
      icon: 'trending-up',
      action: () => setActiveNav('price-monitoring')
    },
    {
      id: 'settings',
      title: 'Settings & Preferences',
      description: 'Configure system settings',
      category: 'Configuration',
      icon: 'settings',
      action: () => setActiveNav('settings')
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Account security and privacy settings',
      category: 'Security',
      icon: 'shield-checkmark',
      action: () => router.push('/privacy')
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and support',
      category: 'Support',
      icon: 'help-circle',
      action: () => router.push('/help')
    },
    {
      id: 'about',
      title: 'About',
      description: 'About AgriAssist application',
      category: 'Information',
      icon: 'information-circle',
      action: () => router.push('/about')
    }
  ];

  // Search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const filtered = searchData.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setIsSearching(false);
  };

  // Navigate to search result
  const handleSearchResultPress = (item: any) => {
    item.action();
    setSearchQuery('');
    setSearchResults([]);
  };


  // Load price data when price monitoring tab is active
  // Firebase data is real-time, no need to manually fetch
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [products, setProducts] = useState<Commodity[]>(COMMODITY_DATA);
  const [hasUploadedPDF, setHasUploadedPDF] = useState(false);
  const [adminRefreshing, setAdminRefreshing] = useState(false);
  
  // Price monitoring state
  const [priceCommodities, setPriceCommodities] = useState<CommodityPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedCommodities, setSelectedCommodities] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  
  // Forecasting calendar states
  const [forecastModalVisible, setForecastModalVisible] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<{
    name: string;
    specification: string;
    price: number;
    unit: string;
  } | null>(null);
  const { categories } = useCategories();
  const { addCommodity, updateCommodity, deleteCommodity, loading: commodityLoading } = useCommodityManagement();
  
  // Real DA ML forecasts - no more cached data
  const [mlForecasts, setMLForecasts] = useState<any[]>([]);
  const [mlLoading, setMLLoading] = useState(false);
  const [mlError, setMLError] = useState<string | null>(null);
  const [mlRefreshing, setMLRefreshing] = useState(false);

  // Load ML forecasts from real DA service
  const loadMLForecasts = useCallback(async () => {
    try {
      setMLLoading(true);
      setMLError(null);
      
      console.log('🤖 Loading ML forecasts...');
      // Price forecasting removed
      setMLForecasts([]);
      
      console.log(`✅ ML forecasts disabled`);
    } catch (err) {
      console.error('❌ Error loading ML forecasts:', err);
      setMLError(err instanceof Error ? err.message : 'Failed to load ML forecasts');
    } finally {
      setMLLoading(false);
    }
  }, []);

  // Refresh ML forecasts
  const refreshMLForecasts = useCallback(async () => {
    try {
      setMLRefreshing(true);
      setMLError(null);
      
      console.log('🔄 Refreshing ML forecasts...');
      // Price forecasting removed
      setMLForecasts([]);
      
      console.log(`✅ ML forecasts disabled`);
    } catch (err) {
      console.error('❌ Error refreshing ML forecasts:', err);
      setMLError(err instanceof Error ? err.message : 'Failed to refresh ML forecasts');
    } finally {
      setMLRefreshing(false);
    }
  }, []);

  // Load ML forecasts on component mount
  useEffect(() => {
    loadMLForecasts();
  }, [loadMLForecasts]);

  // Load admin PDF data
  const loadAdminPDFData = useCallback(async () => {
    try {
      console.log('🚀 ADMIN: Loading PDF data and categorizing...');
      
      // Load data from extracted PDF data (same as admin PDF data screen)
      let allPDFData: any[] = [];
      
      try {
        // Load from latest available data file (today's or yesterday's)
        // Price data loading removed
        const extractedData: any[] = [];
        allPDFData = extractedData.map((item: any, index: number) => ({
          id: (index + 1).toString(),
          commodity: item.commodity || 'Unknown',
          specification: item.specification || 'Not specified',
          price: item.price || 0,
          unit: item.unit || 'kg',
          region: item.region || 'NCR',
          date: item.date || '2025-10-18'
        }));
        console.log(`✅ ADMIN: Loaded ${allPDFData.length} commodities from automated PDF extraction`);
      } catch (error) {
        console.log('⚠️ ADMIN: No automated data found, using fallback data');
        // Fallback to hardcoded data if automated extraction not available
        allPDFData = [
          // Rice products
          { id: '1', commodity: 'Special Rice', specification: 'White Rice', price: 56.89, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '2', commodity: 'Premium', specification: '5% broken', price: 47.35, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '3', commodity: 'Well Milled', specification: '1-19% bran streak', price: 42.75, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '4', commodity: 'Regular Milled', specification: '20-40% bran streak', price: 39.12, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          // Fish products
          { id: '5', commodity: 'Salmon Belly, Imported', specification: 'Not specified', price: 418.52, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '6', commodity: 'Salmon Head, Imported', specification: 'Not specified', price: 227.27, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '7', commodity: 'Sardines (Tamban)', specification: 'Not specified', price: 119.47, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '8', commodity: 'Squid (Pusit Bisaya), Local', specification: 'Medium', price: 447.07, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '9', commodity: 'Squid, Imported', specification: 'Not specified', price: 210.67, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '10', commodity: 'Tambakol (Yellow-Fin Tuna), Local', specification: 'Medium, Fresh or Chilled', price: 271.54, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '11', commodity: 'Tambakol (Yellow-Fin Tuna), Imported', specification: 'Medium, Frozen', price: 300.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '12', commodity: 'Tilapia', specification: 'Medium (5-6 pcs/kg)', price: 153.03, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          // Beef products
          { id: '13', commodity: 'Beef Brisket, Local', specification: 'Meat with Bones', price: 414.23, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '14', commodity: 'Beef Brisket, Imported', specification: 'Not specified', price: 370.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '15', commodity: 'Beef Chuck, Local', specification: 'Not specified', price: 399.7, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '16', commodity: 'Beef Forequarter, Local', specification: 'Not specified', price: 480.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '17', commodity: 'Beef Fore Limb, Local', specification: 'Not specified', price: 457.86, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '18', commodity: 'Beef Flank, Local', specification: 'Not specified', price: 425.88, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '19', commodity: 'Beef Flank, Imported', specification: 'Not specified', price: 376.67, unit: 'kg', region: 'NCR', date: '2025-10-18' },
          { id: '20', commodity: 'Beef Striploin, Local', specification: 'Not specified', price: 472.4, unit: 'kg', region: 'NCR', date: '2025-10-18' }
        ];
      }
      
      // Price data loading removed - using CSV/JSON data instead
      // Old PDF data loading is disabled
      console.log(`✅ ADMIN: Price data loading disabled (using CSV/JSON system)`);
    } catch (error) {
      console.error('❌ ADMIN: Error loading PDF data:', error);
    }
  }, []);

  // Categorize admin data
  const categorizeAdminData = (data: any[]): any[] => {
    const categories: { [key: string]: any[] } = {
      'Imported Rice': [],
      'Local Rice': [],
      'Fish & Seafood': [],
      'Meat Products': [],
      'Poultry & Eggs': [],
      'Vegetables': [],
      'Fruits': [],
      'Spices & Seasonings': [],
      'Cooking Essentials': [],
      'Corn': []
    };

    data.forEach((item, index) => {
      const commodityName = item.commodity.toLowerCase();
      
      // Special handling for rice - first 4 are imported, next 4 are local
      if (commodityName.includes('rice') || commodityName.includes('milled') || commodityName.includes('premium') || commodityName.includes('special')) {
        // Use the item's index in the original data to determine if it's imported or local
        // First 4 rice items (indices 0-3) are imported, next 4 (indices 4-7) are local
        if (index < 4) {
          categories['Imported Rice'].push(item);
        } else if (index < 8) {
          categories['Local Rice'].push(item);
        } else {
          // Any additional rice items go to Corn
          categories['Corn'].push(item);
        }
      } else if (commodityName.includes('corn')) {
        categories['Corn'].push(item); // Corn goes to Corn category
      } else if (commodityName.includes('salmon') || commodityName.includes('sardines') || commodityName.includes('squid') || commodityName.includes('tambakol') || commodityName.includes('tilapia') || commodityName.includes('fish') || commodityName.includes('bangus') || commodityName.includes('galunggong') || commodityName.includes('pampano') || commodityName.includes('alumahan')) {
        categories['Fish & Seafood'].push(item);
      } else if (commodityName.includes('beef') || commodityName.includes('pork') || commodityName.includes('carabeef')) {
        categories['Meat Products'].push(item);
      } else if (commodityName.includes('chicken') || commodityName.includes('egg') || commodityName.includes('duck') || commodityName.includes('poultry') || commodityName.includes('turkey') || commodityName.includes('quail')) {
        categories['Poultry & Eggs'].push(item);
      } else if (commodityName.includes('ampalaya') || commodityName.includes('eggplant') || commodityName.includes('tomato') || commodityName.includes('cabbage') || commodityName.includes('carrot') || commodityName.includes('lettuce') || commodityName.includes('pechay') || commodityName.includes('squash') || commodityName.includes('sitao') || commodityName.includes('chayote') || commodityName.includes('potato') || commodityName.includes('broccoli') || commodityName.includes('cauliflower') || commodityName.includes('celery') || commodityName.includes('bell pepper') || commodityName.includes('habichuelas') || commodityName.includes('baguio beans')) {
        categories['Vegetables'].push(item);
      } else if (commodityName.includes('banana') || commodityName.includes('mango') || commodityName.includes('papaya') || commodityName.includes('watermelon') || commodityName.includes('avocado') || commodityName.includes('calamansi') || commodityName.includes('melon') || commodityName.includes('pomelo')) {
        categories['Fruits'].push(item);
      } else if (commodityName.includes('garlic') || commodityName.includes('onion') || commodityName.includes('ginger') || commodityName.includes('chilli') || commodityName.includes('chili')) {
        categories['Spices & Seasonings'].push(item);
      } else if (commodityName.includes('salt') || commodityName.includes('sugar') || commodityName.includes('cooking oil')) {
        categories['Cooking Essentials'].push(item);
      } else {
        categories['Corn'].push(item);
      }
    });

    // Convert to CategoryData array with colors and icons
    const categoryConfigs = {
      'Imported Rice': { icon: '🌾', color: GREEN },
      'Local Rice': { icon: '🌾', color: GREEN },
      'Fish & Seafood': { icon: '🐟', color: GREEN },
      'Meat Products': { icon: '🥩', color: GREEN },
      'Poultry & Eggs': { icon: '🐔', color: GREEN },
      'Vegetables': { icon: '🥬', color: GREEN },
      'Fruits': { icon: '🍎', color: GREEN },
      'Spices & Seasonings': { icon: '🌶️', color: GREEN },
      'Cooking Essentials': { icon: '🛒', color: GREEN },
      'Corn': { icon: '🌽', color: GREEN }
    };

    return Object.entries(categories)
      .filter(([_, items]) => items.length > 0)
      .map(([name, items]) => ({
        name,
        icon: categoryConfigs[name as keyof typeof categoryConfigs]?.icon || '🌽',
        color: categoryConfigs[name as keyof typeof categoryConfigs]?.color || '#696969',
        items: items.sort((a, b) => a.commodity.localeCompare(b.commodity))
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Load admin PDF data on component mount
  useEffect(() => {
    loadAdminPDFData();
  }, [loadAdminPDFData]);

  // Load price data when price monitoring tab is active
  useEffect(() => {
    async function loadPrices() {
      if (activeNav === 'price-monitoring' && priceCommodities.length === 0) {
        setLoadingPrices(true);
        try {
          const data = await getAllCommodities();
          setPriceCommodities(data);
          console.log(`✅ Admin: Loaded ${data.length} commodities for price monitoring`);
        } catch (error) {
          console.error('Error loading prices:', error);
        } finally {
          setLoadingPrices(false);
        }
      }
    }
    loadPrices();
  }, [activeNav, priceCommodities.length]);
  
  // Get last updated time - price data removed
  const lastUpdated = React.useMemo(() => {
    return null;
  }, []);
  
  // Manual entry states
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSelectedProduct, setManualSelectedProduct] = useState<Commodity | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState(new Date());
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [productSearchText, setProductSearchText] = useState('');
  const [productPickerSelectedCategory, setProductPickerSelectedCategory] = useState<string | null>(null);
  const [showProductCommodityModal, setShowProductCommodityModal] = useState(false);
  
  // Records state
  const [plantingRecords, setPlantingRecords] = useState<any[]>([]);
  const [harvestRecords, setHarvestRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
  // Global analytics state (for planting)
  const [globalAnalytics, setGlobalAnalytics] = useState<any>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Global harvest analytics state
  const [globalHarvestAnalytics, setGlobalHarvestAnalytics] = useState<any>(null);
  const [globalHarvestLoading, setGlobalHarvestLoading] = useState(false);
  const [selectedHarvestMonth, setSelectedHarvestMonth] = useState(new Date());
  
  // Grouped records state (messaging style)
  const [groupedPlantingRecords, setGroupedPlantingRecords] = useState<any[]>([]);
  const [groupedHarvestRecords, setGroupedHarvestRecords] = useState<any[]>([]);
  const [selectedUserAccount, setSelectedUserAccount] = useState<any>(null);
  const [showUserReports, setShowUserReports] = useState(false);
  const [showAllHarvestEntries, setShowAllHarvestEntries] = useState(false);
  const [harvestSortOption, setHarvestSortOption] = useState<'expectedDesc' | 'expectedAsc' | 'actualDesc' | 'actualAsc'>('expectedDesc');
  const [reportType, setReportType] = useState<'planting' | 'harvest'>('planting');
  
  // Individual report detail view
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [readReports, setReadReports] = useState<Set<string>>(new Set());
  
  // Announcement state
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showViewAnnouncements, setShowViewAnnouncements] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // App update management state (admin only)
  const [showAppUpdateModal, setShowAppUpdateModal] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateIsActive, setUpdateIsActive] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);

  const loadAppUpdates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'appUpdates'));
      const updates = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setRecentUpdates(updates);

      const active = updates.find((u) => u.isActive);
      if (active) {
        // Keep fields in sync with the currently active update,
        // but do NOT auto-select any card – user should tap one.
        setUpdateVersion(active.version || '');
        setUpdateUrl(active.url || '');
        setUpdateMessage(active.message || '');
        setUpdateIsActive(true);
      } else {
        setUpdateVersion('');
        setUpdateUrl('');
        setUpdateMessage('');
        setUpdateIsActive(false);
      }
    } catch (error) {
      console.error('Error loading app updates:', error);
    }
  };

  const handleSaveAppUpdate = async () => {
    if (!updateVersion.trim() || !updateUrl.trim()) {
      Alert.alert('Missing Information', 'Please enter both version and update link.');
      return;
    }

    try {
      setSavingUpdate(true);
      const updatesRef = collection(db, 'appUpdates');
      const docRef = await addDoc(updatesRef, {
        version: updateVersion.trim(),
        url: updateUrl.trim(),
        message: updateMessage.trim(),
        isActive: updateIsActive,
        createdAt: Date.now(),
        createdBy: user?.email || 'admin',
      });

      console.log('✅ App update saved with id:', docRef.id);

      // Refresh list
      await loadAppUpdates();
      Alert.alert('Success', 'App update information saved.');
    } catch (error) {
      console.error('Error saving app update:', error);
      Alert.alert('Error', 'Failed to save app update. Please try again.');
    } finally {
      setSavingUpdate(false);
    }
  };

  const deployLatestAppUpdate = async () => {
    try {
      console.log('🚀 Deploying latest app update...');
      const snapshot = await getDocs(collection(db, 'appUpdates'));
      if (snapshot.empty) {
        Alert.alert('No Updates', 'There are no saved updates to deploy yet.');
        return;
      }

      const updates = snapshot.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (!selectedUpdateId && updates.length === 0) {
        Alert.alert('No Updates', 'There is no update to deploy.');
        return;
      }

      const selected =
        updates.find((u) => u.id === selectedUpdateId) || updates[0];

      // Use the values currently shown in the form when deploying,
      // so the deployed link always matches what the admin sees.
      const finalVersion = (updateVersion || selected.version || '').trim();
      const finalUrl = (updateUrl || selected.url || '').trim();
      const finalMessage = (updateMessage || selected.message || '').trim();

      console.log('📦 Deploying update:', {
        id: selected.id,
        version: finalVersion,
        url: finalUrl,
        message: finalMessage,
      });

      // Set selected as active, others inactive
      await Promise.all(
        updates.map((u) =>
          updateDoc(doc(db, 'appUpdates', u.id), {
            isActive: u.id === selected.id,
            ...(u.id === selected.id && {
              version: finalVersion,
              url: finalUrl,
              message: finalMessage,
            }),
          })
        )
      );

      console.log(`✅ Set update ${selected.id} as active, others as inactive`);

      setSelectedUpdateId(selected.id);
      setUpdateVersion(finalVersion);
      setUpdateUrl(finalUrl);
      setUpdateMessage(finalMessage);
      setUpdateIsActive(true);
      await loadAppUpdates();
      console.log('✅ Update deployed successfully');
      Alert.alert(
        'Deployed',
        `Update v${finalVersion || ''} is now active. Users will see the update screen on next app open.`
      );
    } catch (error: any) {
      console.error('❌ Error deploying latest app update:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to deploy update. Please try again.'
      );
    }
  };

  const undeployAllAppUpdates = async () => {
    try {
      console.log('⏸️ Undeploying all app updates...');
      const snapshot = await getDocs(collection(db, 'appUpdates'));
      if (snapshot.empty) {
        Alert.alert('No Updates', 'There are no updates to undeploy.');
        return;
      }

      const updates = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      console.log(`📦 Found ${updates.length} update(s) to undeploy`);

      await Promise.all(
        updates.map((u) =>
          updateDoc(doc(db, 'appUpdates', u.id), {
            isActive: false,
          })
        )
      );

      console.log('✅ All updates set to inactive');
      setUpdateIsActive(false);
      await loadAppUpdates();
      console.log('✅ Updates undeployed successfully');
      Alert.alert('Undeployed', 'Forced update has been turned off for all users. Users can now continue using the current version.');
    } catch (error: any) {
      console.error('❌ Error undeploying app updates:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to undeploy updates. Please try again.'
      );
    }
  };

  const deleteSelectedAppUpdate = async () => {
    if (!selectedUpdateId) {
      Alert.alert('No selection', 'Please tap a version in Recent Updates first.');
      return;
    }

    try {
      console.log('🗑️ Deleting app update:', selectedUpdateId);
      await deleteDoc(doc(db, 'appUpdates', selectedUpdateId));
      setSelectedUpdateId(null);
      await loadAppUpdates();
      Alert.alert('Deleted', 'The selected app update has been removed.');
    } catch (error: any) {
      console.error('❌ Error deleting app update:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to delete update. Please try again.'
      );
    }
  };
  const [announcementIcon, setAnnouncementIcon] = useState('megaphone');

  // User list state
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showComposeMessage, setShowComposeMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // User Management state
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [userManagementUsers, setUserManagementUsers] = useState<any[]>([]);
  const [loadingUserManagement, setLoadingUserManagement] = useState(false);
  const [userManagementSearchQuery, setUserManagementSearchQuery] = useState('');
  const [filteredUserManagementUsers, setFilteredUserManagementUsers] = useState<any[]>([]);
  const [userActivityStatus, setUserActivityStatus] = useState<{[key: string]: 'active' | 'inactive' | 'no-reports'}>({});

  // Daily price index data structure
  const [dailyPriceData, setDailyPriceData] = useState<any>(null);

  // Farmers records state
  const [farmersData, setFarmersData] = useState<any[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [showFarmerDetail, setShowFarmerDetail] = useState(false);
  const [showSummaryInventory, setShowSummaryInventory] = useState(false);
  
  // Maintenance: clear all planting and harvest reports
  const clearAllReports = async () => {
    Alert.alert(
      'Clear All Reports',
      'This will permanently delete ALL plantingReports and harvestReports. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete plantingReports
              const plantingSnap = await getDocs(collection(db, 'plantingReports'));
              for (const d of plantingSnap.docs) {
                await deleteDoc(doc(db, 'plantingReports', d.id));
              }
              // Delete harvestReports
              const harvestSnap = await getDocs(collection(db, 'harvestReports'));
              for (const d of harvestSnap.docs) {
                await deleteDoc(doc(db, 'harvestReports', d.id));
              }
              Alert.alert('Success', 'All planting and harvest reports have been cleared.');
            } catch (e) {
              console.error('Error clearing reports:', e);
              Alert.alert('Error', 'Failed to clear reports. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  
  
  
  // Filter daily price items
  const filteredDailyPriceItems = dailyPriceData?.items?.filter((item: any) =>
    item.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.specification?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];


  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  const handleDebugMatching = async () => {
    Alert.alert('Debug Info', '🔍 Firebase Debug Info:\n\n✅ Real-time data from Firebase\n📊 No local storage debugging needed\n🔄 Data updates automatically');
  };


  const handleLoadLatestData = async () => {
    Alert.alert('Info', '📊 Latest Data:\n\n✅ Data is automatically synced from Firebase\n🔄 Real-time updates across all devices\n📱 No manual loading needed');
  };

  // AsyncStorage management functions
  const handleClearAsyncStorage = async () => {
    Alert.alert('Info', '📊 Data Management:\n\n✅ Price data is now stored in Firebase\n🔄 Real-time sync across all devices\n📱 Local storage clearing not needed for price data');
  };

  const handleGetAsyncStorageInfo = async () => {
    Alert.alert('Info', '📊 Data Storage:\n\n✅ Price data is now stored in Firebase\n🔄 Real-time sync across all devices\n📱 Local storage info not relevant for price data');
  };

  const handleViewPriceData = async () => {
    Alert.alert('Info', '📊 Price Data:\n\n✅ View real-time price data in Price Monitoring tab\n🔄 Data is automatically synced from Firebase\n📱 No local storage viewing needed');
  };

  const handleUpdatePriceMonitoring = async () => {
    Alert.alert('Info', '📊 Price Monitoring:\n\n✅ Real-time updates from Firebase\n🔄 No manual updates needed\n📱 Data syncs automatically across all devices');
  };

  const handleDebugPriceMatching = async () => {
    Alert.alert('Debug Info', '📊 Firebase Debug:\n\n✅ Real-time data from Firebase\n🔄 No local storage debugging needed\n📱 Check Price Monitoring tab for live data');
  };

  // CSV Export function
  const generateCSV = (commodities: CommodityPrice[]): string => {
    const headers = [
      'Commodity Name',
      'Category',
      'Specification',
      'Current Price',
      'Current Date',
      'Forecast Date',
      'Forecast Price',
      'Lower Bound',
      'Upper Bound',
      'Trend',
      'Change Percent'
    ];

    const rows: string[][] = [headers];

    commodities.forEach(commodity => {
      if (commodity.forecastData && commodity.forecastData.length > 0) {
        // Add row for each forecast
        commodity.forecastData.forEach(forecast => {
          rows.push([
            commodity.displayName || commodity.name,
            commodity.category || '',
            commodity.specification || '',
            commodity.currentPrice?.toString() || '',
            commodity.currentDate || '',
            forecast.date,
            forecast.forecast?.toString() || '',
            forecast.lower?.toString() || '',
            forecast.upper?.toString() || '',
            commodity.trend || '',
            commodity.changePercent?.toString() || ''
          ]);
        });
      } else {
        // Add row with current price only (no forecast)
        rows.push([
          commodity.displayName || commodity.name,
          commodity.category || '',
          commodity.specification || '',
          commodity.currentPrice?.toString() || '',
          commodity.currentDate || '',
          '',
          '',
          '',
          '',
          commodity.trend || '',
          commodity.changePercent?.toString() || ''
        ]);
      }
    });

    // Convert to CSV format
    return rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  };

  // Upload CSV function - Update prices from DA CSV
  const handleUploadCSV = async () => {
    try {
      // Pick CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;
      setUploadedFile(fileName);
      setUploading(true);

      // Read CSV file
      const csvContent = await FileSystem.readAsStringAsync(fileUri);
      
      // Parse CSV - Expected format: commodity,price,date or similar
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        Alert.alert('Error', 'CSV file is empty or invalid format.');
        setUploading(false);
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const commodityIndex = headers.findIndex(h => h.includes('commodity') || h.includes('product') || h.includes('item'));
      const priceIndex = headers.findIndex(h => h.includes('price'));
      const dateIndex = headers.findIndex(h => h.includes('date'));

      if (commodityIndex === -1 || priceIndex === -1) {
        Alert.alert('Error', 'CSV must contain "commodity" and "price" columns.');
        setUploading(false);
        return;
      }

      // Parse data rows
      const priceUpdates: { [commodity: string]: { price: number; date: string } } = {};
      const today = new Date().toISOString().split('T')[0];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const commodity = values[commodityIndex];
        const price = parseFloat(values[priceIndex]);
        const date = dateIndex !== -1 ? values[dateIndex] : today;

        if (commodity && !isNaN(price) && price > 0) {
          // Normalize commodity name to match folder names
          const normalizedName = commodity
            .replace(/\s+/g, ' ')
            .trim();
          
          priceUpdates[normalizedName] = { price, date };
        }
      }

      if (Object.keys(priceUpdates).length === 0) {
        Alert.alert('Error', 'No valid price data found in CSV.');
        setUploading(false);
        return;
      }

      // Show preview and confirm
      const commodityList = Object.keys(priceUpdates).slice(0, 10).join(', ');
      const moreCount = Object.keys(priceUpdates).length - 10;
      const previewText = moreCount > 0 
        ? `${commodityList}... and ${moreCount} more`
        : commodityList;

      Alert.alert(
        'Confirm Update',
        `Found ${Object.keys(priceUpdates).length} price updates:\n\n${previewText}\n\n` +
        `This will update the current prices in price monitoring. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {
            setUploading(false);
            setUploadedFile(null);
          }},
          { 
            text: 'Update', 
            onPress: async () => {
              try {
                // Save CSV to external data location for processing
                const today = new Date().toISOString().split('T')[0];
                const externalDataPath = 'C:\\Users\\Mischelle\\excel-price-manager\\data\\cleaned';
                
                // Create updated CSV content for each commodity
                let processedCount = 0;
                const processedCommodities: string[] = [];
                
                // For each commodity in the upload, update its 2025.csv file
                for (const [commodityName, update] of Object.entries(priceUpdates)) {
                  // Find matching commodity folder
                  const matchingFolders = Object.keys(require('../data/prices/json/cleaned.json')).filter(key => {
                    const normalized = key.replace(/_/g, ' ').toLowerCase();
                    const searchNormalized = commodityName.toLowerCase();
                    return normalized.includes(searchNormalized) || searchNormalized.includes(normalized);
                  });

                  if (matchingFolders.length > 0) {
                    processedCommodities.push(matchingFolders[0]);
                    processedCount++;
                  }
                }

                // Store updates in AsyncStorage for immediate use
                const priceUpdatesKey = 'price_updates_' + today;
                await AsyncStorage.setItem(priceUpdatesKey, JSON.stringify(priceUpdates));
                
                // Also store a mapping of commodity names
                await AsyncStorage.setItem('last_price_update_date', today);
                await AsyncStorage.setItem('last_price_updates_count', processedCount.toString());

                Alert.alert(
                  'Update Complete',
                  `Processed ${processedCount} price updates from CSV.\n\n` +
                  `The prices have been saved and will be applied to price monitoring.\n\n` +
                  `To permanently update the data files, please:\n` +
                  `1. Copy the CSV to: C:\\Users\\Mischelle\\excel-price-manager\\data\\cleaned\\\n` +
                  `2. Run: node scripts/convert-csv-to-json.js\n\n` +
                  `The prices are now updated in the app.`
                );

                // Reload price data to show updates
                const data = await getAllCommodities();
                setPriceCommodities(data);
                
                setShowUploadModal(false);
                setUploadedFile(null);
              } catch (updateError: any) {
                console.error('Error updating data:', updateError);
                Alert.alert('Error', `Failed to update data: ${updateError.message}`);
              } finally {
                setUploading(false);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      Alert.alert('Error', `Failed to upload CSV: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Download CSV function
  const handleDownloadCSV = async () => {
    if (selectedCommodities.size === 0) {
      Alert.alert('No Selection', 'Please select at least one commodity to download.');
      return;
    }

    try {
      setDownloading(true);
      
      const selectedCommodityData = priceCommodities.filter(c => selectedCommodities.has(c.name));
      
      if (selectedCommodityData.length === 0) {
        Alert.alert('Error', 'No commodities found for selected items.');
        setDownloading(false);
        return;
      }

      const csvContent = generateCSV(selectedCommodityData);
      const fileName = `price_data_${new Date().toISOString().split('T')[0]}.csv`;

      // Save file to cache directory (more accessible)
      let fileUri = '';
      try {
        // Use cache directory which is more accessible for sharing
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        if (!cacheDir) {
          throw new Error('No accessible directory available');
        }
        fileUri = cacheDir + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        console.log('✅ File saved to:', fileUri);
      } catch (fileError: any) {
        console.error('Error writing file:', fileError);
        Alert.alert('Error', `Failed to save file: ${fileError.message}`);
        setDownloading(false);
        return;
      }

      // Share the file using expo-sharing for proper file download
      try {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable && fileUri) {
          // Use expo-sharing for proper file download
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: `Download ${fileName}`,
          });
          
          Alert.alert(
            'Success', 
            `CSV file downloaded successfully!\n\n${selectedCommodityData.length} commodities exported.\n\nFile: ${fileName}`
          );
        } else {
          // Fallback to React Native Share if expo-sharing not available
          const shareOptions: any = {
            title: `Download ${fileName}`,
            url: fileUri,
          };

          const result = await Share.share(shareOptions);

          if (result.action === Share.sharedAction) {
            Alert.alert(
              'Success', 
              `CSV file shared successfully!\n\n${selectedCommodityData.length} commodities exported.\n\nFile: ${fileName}`
            );
          } else {
            Alert.alert(
              'File Saved', 
              `CSV file has been saved.\n\nFile: ${fileName}\nLocation: ${fileUri}\n\nYou can access it from your device's file manager.`
            );
          }
        }
      } catch (shareError: any) {
        // If sharing fails, file is still saved
        console.log('Share error:', shareError);
        Alert.alert(
          'File Saved', 
          `CSV file has been saved successfully!\n\nFile: ${fileName}\nCommodities: ${selectedCommodityData.length}\n\nLocation: ${fileUri}\n\nYou can access it from your device's file manager.`
        );
      }

      setShowDownloadModal(false);
      setSelectedCommodities(new Set());
    } catch (error: any) {
      console.error('Error downloading CSV:', error);
      Alert.alert('Error', `Failed to generate CSV: ${error.message || 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  // Category emoji function
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'KADIWA RICE-FOR-ALL':
      case 'IMPORTED COMMERCIAL RICE':
      case 'LOCAL COMMERCIAL RICE':
        return '🌾';
      case 'CORN PRODUCTS':
        return '🌽';
      case 'FISH PRODUCTS':
        return '🐟';
      case 'BEEF MEAT PRODUCTS':
        return '🥩';
      case 'PORK MEAT PRODUCTS':
        return '🥓';
      case 'POULTRY PRODUCTS':
        return '🐔';
      case 'LIVESTOCK AND POULTRY PRODUCTS':
        return '🐄';
      case 'OTHER LIVESTOCK MEAT PRODUCTS':
        return '🐄';
      case 'LOWLAND VEGETABLES':
      case 'HIGHLAND VEGETABLES':
        return '🥬';
      case 'SPICES':
        return '🌶️';
      case 'FRUITS':
        return '🍎';
      case 'OTHER BASIC COMMODITIES':
        return '📋';
      default:
        return '📋';
    }
  };

  const getProductEmoji = (name: string, category: string) => {
    const lowerName = name.toLowerCase();
    
    // Specific product emojis
    // Beef products
    if (lowerName.includes('beef')) {
      if (lowerName.includes('brisket')) return '🥩';
      if (lowerName.includes('chuck')) return '🥩';
      if (lowerName.includes('flank')) return '🥩';
      if (lowerName.includes('loin')) return '🥩';
      if (lowerName.includes('rib')) return '🥩';
      if (lowerName.includes('rump')) return '🥩';
      if (lowerName.includes('sirloin')) return '🥩';
      if (lowerName.includes('tenderloin')) return '🥩';
      if (lowerName.includes('tongue')) return '👅';
      return '🥩';
    }
    
    // Pork products
    if (lowerName.includes('pork')) {
      if (lowerName.includes('belly') || lowerName.includes('liempo')) return '🥓';
      if (lowerName.includes('chop')) return '🥓';
      if (lowerName.includes('loin')) return '🥓';
      if (lowerName.includes('head')) return '🐷';
      if (lowerName.includes('offal')) return '🐷';
      return '🥓';
    }
    
    // Poultry products
    if (lowerName.includes('chicken')) {
      if (lowerName.includes('breast')) return '🍗';
      if (lowerName.includes('thigh')) return '🍗';
      if (lowerName.includes('wing')) return '🍗';
      if (lowerName.includes('leg')) return '🍗';
      if (lowerName.includes('egg')) return '🥚';
      if (lowerName.includes('liver')) return '🍗';
      if (lowerName.includes('neck')) return '🍗';
      if (lowerName.includes('feet')) return '🍗';
      return '🐔';
    }
    
    if (lowerName.includes('duck')) return '🦆';
    
    // Fish products
    if (lowerName.includes('bangus')) return '🐟';
    if (lowerName.includes('tilapia')) return '🐟';
    if (lowerName.includes('galunggong')) return '🐟';
    if (lowerName.includes('alumahan')) return '🐟';
    if (lowerName.includes('mackerel')) return '🐟';
    if (lowerName.includes('salmon')) return '🐟';
    if (lowerName.includes('squid') || lowerName.includes('pusit')) return '🦑';
    if (lowerName.includes('tuna') || lowerName.includes('tambakol')) return '🐟';
    if (lowerName.includes('bonito')) return '🐟';
    if (lowerName.includes('pampano')) return '🐟';
    if (lowerName.includes('scad') || lowerName.includes('tamban')) return '🐟';
    
    // Rice products
    if (lowerName.includes('rice')) {
      if (lowerName.includes('premium')) return '🍚';
      if (lowerName.includes('well milled')) return '🍚';
      if (lowerName.includes('regular')) return '🍚';
      if (lowerName.includes('special')) return '🍚';
      return '🌾';
    }
    
    // Corn products
    if (lowerName.includes('corn')) {
      if (lowerName.includes('white')) return '🌽';
      if (lowerName.includes('yellow')) return '🌽';
      if (lowerName.includes('grits')) return '🌽';
      if (lowerName.includes('cracked')) return '🌽';
      return '🌽';
    }
    
    // Vegetables
    if (lowerName.includes('cabbage')) return '🥬';
    if (lowerName.includes('carrot')) return '🥕';
    if (lowerName.includes('tomato')) return '🍅';
    if (lowerName.includes('onion')) return '🧅';
    if (lowerName.includes('garlic')) return '🧄';
    if (lowerName.includes('ginger')) return '🫚';
    if (lowerName.includes('bell pepper')) return '🫑';
    if (lowerName.includes('broccoli')) return '🥦';
    if (lowerName.includes('cauliflower')) return '🥦';
    if (lowerName.includes('lettuce')) return '🥬';
    if (lowerName.includes('celery')) return '🥬';
    if (lowerName.includes('chayote')) return '🥒';
    if (lowerName.includes('potato')) return '🥔';
    if (lowerName.includes('ampalaya')) return '🥒';
    if (lowerName.includes('eggplant')) return '🍆';
    if (lowerName.includes('squash')) return '🎃';
    if (lowerName.includes('pechay')) return '🥬';
    if (lowerName.includes('sitao')) return '🫛';
    
    // Fruits
    if (lowerName.includes('banana')) return '🍌';
    if (lowerName.includes('mango')) return '🥭';
    if (lowerName.includes('papaya')) return '🥭';
    if (lowerName.includes('watermelon')) return '🍉';
    if (lowerName.includes('melon')) return '🍈';
    if (lowerName.includes('pomelo')) return '🍊';
    if (lowerName.includes('avocado')) return '🥑';
    if (lowerName.includes('calamansi')) return '🍋';
    
    // Spices
    if (lowerName.includes('chili') || lowerName.includes('chilli')) return '🌶️';
    if (lowerName.includes('siling')) return '🌶️';
    
    // Basic commodities
    if (lowerName.includes('sugar')) return '🍯';
    if (lowerName.includes('salt')) return '🧂';
    if (lowerName.includes('cooking oil')) return '🫒';
    
    // Carabeef/Livestock
    if (lowerName.includes('carabeef')) return '🐄';
    if (lowerName.includes('lamb')) return '🐑';
    
    // Fallback to category emoji
    return getCategoryEmoji(category);
  };

  // Admin PDF data render functions
  const renderAdminCommodityItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.adminCommodityItem}
      onPress={() => {
        console.log('🎯 Admin PDF Data item pressed:', item.commodity);
        
        // Set selected commodity for forecasting
        setSelectedCommodity({
          name: item.commodity,
          specification: item.specification,
          price: item.price,
          unit: item.unit
        });
        
        // Show forecasting calendar
        setForecastModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.adminCommodityItemContent}>
        <View style={styles.adminCommodityItemInfo}>
          <Text style={styles.adminCommodityItemName}>{item.commodity}</Text>
          <Text style={styles.adminCommodityItemSpec}>{item.specification}</Text>
          <Text style={styles.adminCommodityItemDate}>📅 {item.date} | 🌍 {item.region}</Text>
        </View>
        <View style={styles.adminCommodityItemPrice}>
          <Text style={styles.adminCommodityItemPriceText}>₱{item.price.toFixed(2)}</Text>
          <Text style={styles.adminCommodityItemUnit}>/{item.unit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAdminCategorySection = ({ item }: { item: any }) => (
    <View style={styles.adminCategorySection}>
      <View style={[styles.adminCategoryHeader, { backgroundColor: item.color }]}>
        <Text style={styles.adminCategoryEmoji}>{item.icon}</Text>
        <Text style={styles.adminCategoryTitle}>{item.name}</Text>
        <Text style={styles.adminCategoryCount}>({item.items.length})</Text>
      </View>
      <View style={styles.adminCategoryItems}>
        {item.items.map((commodity: any) => (
          <View key={commodity.id}>
            {renderAdminCommodityItem({ item: commodity })}
          </View>
        ))}
      </View>
    </View>
  );

  // Price monitoring modal removed
  const renderCommodityModal = () => null;




  const getProductIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('rice')) return 'nutrition';
    if (categoryLower.includes('corn')) return 'leaf';
    if (categoryLower.includes('fish')) return 'fish';
    if (categoryLower.includes('livestock') || categoryLower.includes('poultry') || categoryLower.includes('meat')) return 'paw';
    if (categoryLower.includes('vegetable')) return 'leaf-outline';
    if (categoryLower.includes('fruit')) return 'flower';
    if (categoryLower.includes('sugar') || categoryLower.includes('salt') || categoryLower.includes('oil')) return 'water';
    return 'cube';
  };

  const renderProductPickerModal = () => {
    // Get all unique categories from COMMODITY_DATA
    const allCategories = [...new Set(COMMODITY_DATA.map(product => product.category))];
    
    // Filter products based on selected category and search text
    let filteredProducts = COMMODITY_DATA;
    
    // Filter by category first
    if (productPickerSelectedCategory) {
      filteredProducts = filteredProducts.filter(product => 
        product.category === productPickerSelectedCategory
      );
    }
    
    // Then filter by search text
    if (productSearchText.trim()) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(productSearchText.toLowerCase()) ||
        product.category.toLowerCase().includes(productSearchText.toLowerCase()) ||
        (product.specification && product.specification.toLowerCase().includes(productSearchText.toLowerCase()))
      );
    }

    return (
    <Modal
      visible={showProductPicker}
      transparent
      animationType="slide"
        onRequestClose={() => {
          setShowProductPicker(false);
          setProductSearchText(''); // Clear search when closing
          setProductPickerSelectedCategory(null); // Clear category filter when closing
        }}
    >
      <View style={styles.adminPriceModalOverlay}>
        <View style={[styles.adminPriceModalContent, { maxHeight: '80%', marginHorizontal: 20 }]}>
          <View style={styles.adminPriceModalHeader}>
            <Text style={styles.adminPriceModalTitle}>Select Product</Text>
              <TouchableOpacity style={styles.adminPriceModalCloseButton} onPress={() => {
                setShowProductPicker(false);
                setProductSearchText(''); // Clear search when closing
                setProductPickerSelectedCategory(null); // Clear category filter when closing
              }}>
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
          </View>
            
            {/* Search Bar */}
            <View style={styles.productSearchContainer}>
              <View style={styles.productSearchInputContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.productSearchIcon} />
                <TextInput
                  style={styles.productSearchInput}
                  placeholder="Search products..."
                  value={productSearchText}
                  onChangeText={setProductSearchText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {productSearchText.length > 0 && (
                  <TouchableOpacity 
                    style={styles.productSearchClearButton}
                    onPress={() => setProductSearchText('')}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Commodity Filter Buttons */}
            <View style={styles.productPickerFilterContainer}>
              <TouchableOpacity
                style={[
                  styles.productPickerFilterButton,
                  productPickerSelectedCategory === null && styles.productPickerFilterButtonActive
                ]}
                onPress={() => setProductPickerSelectedCategory(null)}
              >
                <Ionicons 
                  name="apps" 
                  size={16} 
                  color={productPickerSelectedCategory === null ? "#fff" : GREEN} 
                />
                <Text style={[
                  styles.productPickerFilterButtonText,
                  productPickerSelectedCategory === null && styles.productPickerFilterButtonTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.productPickerFilterButton,
                  productPickerSelectedCategory !== null && styles.productPickerFilterButtonActive
                ]}
                onPress={() => setShowProductCommodityModal(true)}
              >
                <Ionicons 
                  name="basket" 
                  size={16} 
                  color={productPickerSelectedCategory !== null ? "#fff" : GREEN} 
                />
                <Text style={[
                  styles.productPickerFilterButtonText,
                  productPickerSelectedCategory !== null && styles.productPickerFilterButtonTextActive
                ]}>
                  {productPickerSelectedCategory || 'Commodities'}
                </Text>
              </TouchableOpacity>
            </View>

            {filteredProducts.length > 0 ? (
          <FlatList
                data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.productPickerItem,
                  manualSelectedProduct && manualSelectedProduct.id === item.id && styles.productPickerItemSelected
                ]}
                onPress={() => {
                  setManualSelectedProduct(item);
                  setShowProductPicker(false);
                      setProductSearchText(''); // Clear search when selecting
                }}
              >
                <View style={styles.productPickerTextContainer}>
                  <Text style={styles.productPickerItemName}>{getProductEmoji(item.name, item.category)} {item.name}</Text>
                  <Text style={styles.productPickerItemCategory}>{item.category}</Text>
                  {item.specification && <Text style={styles.productPickerItemSpec}>{item.specification}</Text>}
                </View>
                {manualSelectedProduct && manualSelectedProduct.id === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color={GREEN} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
            ) : (
              <View style={styles.productSearchNoResults}>
                <Ionicons name="search" size={48} color="#ccc" />
                <Text style={styles.productSearchNoResultsText}>No products found</Text>
                <Text style={styles.productSearchNoResultsSubtext}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
        </View>
      </View>
    </Modal>
  );
  };

  const renderProductCommodityModal = () => {
    // Get all unique categories from COMMODITY_DATA
    const allCategories = [...new Set(COMMODITY_DATA.map(product => product.category))];

    return (
      <Modal
        visible={showProductCommodityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductCommodityModal(false)}
      >
        <View style={styles.adminPriceModalOverlay}>
          <View style={[styles.adminPriceModalContent, { maxHeight: '70%', marginHorizontal: 20 }]}>
            <View style={styles.adminPriceModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="basket" size={24} color={GREEN} style={{ marginRight: 10 }} />
                <Text style={styles.adminPriceModalTitle}>Select Commodity</Text>
              </View>
              <TouchableOpacity style={styles.adminPriceModalCloseButton} onPress={() => setShowProductCommodityModal(false)}>
                <Ionicons name="close" size={24} color={GREEN} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.adminPriceModalScrollView}>
              <TouchableOpacity
                style={[
                  styles.adminPriceModalItem,
                  productPickerSelectedCategory === null && styles.adminPriceModalItemActive
                ]}
                onPress={() => {
                  setProductPickerSelectedCategory(null);
                  setShowProductCommodityModal(false);
                }}
              >
                <Text style={styles.adminPriceModalCategoryEmoji}>📋</Text>
                <Text style={[
                  styles.adminPriceModalItemText,
                  productPickerSelectedCategory === null && styles.adminPriceModalItemTextActive
                ]}>
                  All Categories
                </Text>
              </TouchableOpacity>
              
              {allCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.adminPriceModalItem,
                    productPickerSelectedCategory === category && styles.adminPriceModalItemActive
                  ]}
                  onPress={() => {
                    setProductPickerSelectedCategory(category);
                    setShowProductCommodityModal(false);
                  }}
                >
                  <Text style={styles.adminPriceModalCategoryEmoji}>{getCategoryEmoji(category)}</Text>
                  <Text style={[
                    styles.adminPriceModalItemText,
                    productPickerSelectedCategory === category && styles.adminPriceModalItemTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderManualEntryModal = () => (
    <Modal
      visible={showManualModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowManualModal(false)}
    >
      <View style={styles.adminPriceModalOverlay}>
        <View style={[styles.adminPriceModalContent, { maxHeight: '70%', marginHorizontal: 20 }] }>
          <View style={styles.adminPriceModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="pricetag" size={24} color={GREEN} style={{ marginRight: 10 }} />
              <Text style={styles.adminPriceModalTitle}>Add Price Manually</Text>
            </View>
            <TouchableOpacity style={styles.adminPriceModalCloseButton} onPress={() => setShowManualModal(false)}>
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.adminPriceModalScrollView} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}>
            <View style={styles.manualInputGroup}>
              <View style={styles.manualInputLabelRow}>
                <Ionicons name="cube-outline" size={20} color={GREEN} />
                <Text style={styles.manualInputLabel}>Select Product</Text>
              </View>
              <TouchableOpacity
                style={styles.manualProductSelector}
                onPress={() => setShowProductPicker(true)}
              >
                {manualSelectedProduct ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.manualProductName}>{getProductEmoji(manualSelectedProduct.name, manualSelectedProduct.category)} {manualSelectedProduct.name}</Text>
                      <Text style={styles.manualProductCategory}>{manualSelectedProduct.category}</Text>
                      {manualSelectedProduct.specification && (
                        <Text style={styles.manualProductSpec}>{manualSelectedProduct.specification}</Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.manualProductPlaceholder}>Tap to select product</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.manualInputGroup}>
              <View style={styles.manualInputLabelRow}>
                <Ionicons name="cash-outline" size={20} color={GREEN} />
                <Text style={styles.manualInputLabel}>Price Amount</Text>
              </View>
              <View style={styles.manualAmountInputContainer}>
                <Text style={styles.manualCurrencySymbol}>₱</Text>
                <TextInput 
                  placeholder="0.00" 
                  keyboardType="numeric" 
                  style={styles.manualAmountInput} 
                  value={manualAmount} 
                  onChangeText={setManualAmount} 
                />
              </View>
            </View>
            
            <View style={styles.manualInputGroup}>
              <View style={styles.manualInputLabelRow}>
                <Ionicons name="calendar-outline" size={20} color={GREEN} />
                <Text style={styles.manualInputLabel}>Date</Text>
              </View>
              <TouchableOpacity
                style={styles.manualDateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="calendar" size={20} color={GREEN} style={{ marginRight: 12 }} />
                  <Text style={styles.manualDateText}>
                    {manualDate.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={styles.pasteModalButtons}>
            <TouchableOpacity style={styles.pasteCancelButton} onPress={() => setShowManualModal(false)}>
              <Text style={styles.pasteCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pasteProcessButton}
              onPress={async () => {
                try {
                  const amt = Number(manualAmount);
                  if (!manualSelectedProduct || !isFinite(amt)) {
                    Alert.alert('Missing data', 'Please select a product and enter a valid amount.');
                    return;
                  }
                  
                  // Create price record for Firebase
                  const priceRecord = {
                    commodityName: manualSelectedProduct.name,
                    price: amt,
                    date: manualDate.toISOString().split('T')[0], // YYYY-MM-DD format
                    category: manualSelectedProduct.category,
                    unit: manualSelectedProduct.unit || 'kg',
                    type: manualSelectedProduct.type || '',
                    specification: manualSelectedProduct.specification || ''
                  };
                  
                  // TODO: Implement price saving functionality
                  // Save to Firebase using the new offline service
                  // const result = await addOrUpdatePrice(priceRecord);
                  
                  // For now, show success message
                  Alert.alert(
                    'Success', 
                    `Price record prepared:\n\n✅ ${priceRecord.commodityName}\n📅 ${manualDate.toLocaleDateString()}\n💵 ₱${priceRecord.price}\n\nNote: Price saving functionality needs to be implemented.`
                  );
                  
                  setShowManualModal(false);
                  setManualSelectedProduct(null);
                  setManualAmount('');
                  setManualDate(new Date());
                  
                  // TODO: Refresh the latest prices to show updated data
                  // await refreshLatestPrices();
                  
                } catch (e: any) {
                  console.error('Error saving manual price:', e);
                  Alert.alert('Error', `Failed to save record: ${e.message || e}`);
                }
              }}
            >
              <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.pasteProcessButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Group messages by contact
  const groupMessagesByContact = (messages: any[], usersDirectory: Record<string, { name?: string; email?: string; userCropEmoji?: string }> = {}) => {
    console.log('Grouping messages:', messages.length, 'messages');
    const contactMap = new Map();
    
    messages.forEach(message => {
      let contactId, contactName, contactEmail, userCropEmoji;
      
      if (message.type === 'sent') {
        contactId = message.receiverId;
        contactName = message.receiverName || message.receiverEmail || `User ${contactId?.substring(0, 8)}...`;
        contactEmail = message.receiverEmail || 'No email';
      } else {
        contactId = message.senderId;
        contactName = message.senderName || message.senderEmail || `User ${contactId?.substring(0, 8)}...`;
        contactEmail = message.senderEmail || 'No email';
      }
      
      // Get crop emoji from users directory
      userCropEmoji = usersDirectory[contactId]?.userCropEmoji;
      
      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          id: contactId,
          name: contactName,
          email: contactEmail,
          userCropEmoji: userCropEmoji,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        });
      }
      
      const contact = contactMap.get(contactId);
      contact.messages.push(message);
      
      // Update last message and unread count
      if (!contact.lastMessage || message.timestamp > contact.lastMessage.timestamp) {
        contact.lastMessage = message;
      }
      
      // Count unread messages that are received by admin (sent by users)
      if (message.type === 'received' && !message.isRead && message.receiverId === 'admin') {
        contact.unreadCount++;
        console.log(`📊 Unread count for ${contactName}: ${contact.unreadCount} (message: ${message.content.substring(0, 20)}...)`);
      }
    });
    
    // Sort contacts by last message timestamp
    const contacts = Array.from(contactMap.values()).sort((a, b) => 
      (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
    );
    
    console.log('Grouped contacts:', contacts.length);
    console.log('Sample contacts:', contacts.slice(0, 2));
    
    // Log unread counts for debugging
    contacts.forEach(contact => {
      if (contact.unreadCount > 0) {
        console.log(`🔔 ${contact.name} has ${contact.unreadCount} unread messages`);
      }
    });
    
    return contacts;
  };

  // Navigate to full-screen chat
  const openChat = (contact: any) => {
    console.log('Opening chat with contact:', contact);
    router.push(`/admin-chat?contactId=${contact.id}&contactName=${encodeURIComponent(contact.name)}&contactEmail=${encodeURIComponent(contact.email)}`);
  };

  // Load admin messages (sent and received)
  const loadAdminMessages = async () => {
    setLoadingMessages(true);
    try {
      // Wait a bit to ensure Firebase is fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      // Debug: Check if db is properly initialized
      console.log('Admin messages - db object:', {
        db: !!db,
        dbType: typeof db,
        dbConstructor: db?.constructor?.name,
        hasCollection: typeof db?.collection === 'function'
      });
      
      // Check if Firebase is properly initialized
      if (!db) {
        console.error('Firebase db is not properly initialized:', db);
        setLoadingMessages(false);
        return;
      }
      
      // Build users directory for name/email enrichment
      const newUsersDirectory: Record<string, { name?: string; email?: string; userCropEmoji?: string }> = {};
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        usersSnapshot.forEach((docSnap) => {
          const data: any = docSnap.data();
          const uid = data?.uid || docSnap.id;
          const docId = docSnap.id;
          const userInfo = { 
            name: data?.name || data?.displayName, 
            email: data?.email,
            userCropEmoji: data?.selectedCropEmoji
          };
          // Store by both uid and document ID for lookup flexibility
          newUsersDirectory[uid] = userInfo;
          newUsersDirectory[docId] = userInfo;
        });
        
        // Add admin profile data with 'admin' key for messages
        const adminUserId = 'UIcMju8YbdX3VfYAjEbCem39bNe2';
        const adminData = newUsersDirectory[adminUserId];
        if (adminData) {
          newUsersDirectory['admin'] = adminData;
        }
        
        setUsersDirectory(newUsersDirectory);
      } catch (e) {
        console.warn('⚠️ Could not load users directory for messages; using fallback names');
      }

      // Query messages where admin is sender or receiver
      const sentMessagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', 'admin')
      );
      
      const receivedMessagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', 'admin')
      );
      
      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentMessagesQuery),
        getDocs(receivedMessagesQuery)
      ]);
      
      const sentMessages = sentSnapshot.docs.map(doc => {
        const data = doc.data();
        const receiverId = data.receiverId;
        const userInfo = newUsersDirectory[receiverId] || {};
        
        return {
        id: doc.id,
          ...data,
          type: 'sent',
          receiverName: userInfo.name || data.receiverEmail || `User ${receiverId?.substring(0, 8)}...`,
          receiverEmail: userInfo.email || data.receiverEmail || 'No email'
        };
      });
      
      const receivedMessages = receivedSnapshot.docs.map(doc => {
        const data = doc.data();
        const senderId = data.senderId;
        const userInfo = newUsersDirectory[senderId] || {};
        
        return {
        id: doc.id,
          ...data,
          type: 'received',
          senderName: userInfo.name || data.senderName || data.senderEmail || `User ${senderId?.substring(0, 8)}...`,
          senderEmail: userInfo.email || data.senderEmail || 'No email'
        };
      });
      
      // Combine and sort all messages by timestamp
      const allMessages = [...sentMessages, ...receivedMessages]
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setAdminMessages(allMessages);
      console.log('Loaded admin messages:', allMessages.length);
      console.log('Sent messages:', sentMessages.length);
      console.log('Received messages:', receivedMessages.length);
      console.log('Sample messages:', allMessages.slice(0, 3));
    } catch (error) {
      console.error('Error loading admin messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message to specific user
  const sendMessageToUser = async () => {
    if (!selectedUser || !messageText.trim()) {
      Alert.alert('Error', 'Please select a user and enter a message');
      return;
    }

    console.log('Selected user data:', selectedUser);
    console.log('User UID:', selectedUser.uid);
    console.log('User ID:', selectedUser.id);

    setSendingMessage(true);
    try {
      const messageData = {
        id: Date.now().toString(),
        senderId: 'admin',
        senderName: 'Admin',
        receiverId: selectedUser.id, // Use 'id' since uid is undefined
        receiverEmail: selectedUser.email,
        content: messageText.trim(),
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'admin_message'
      };

      // Add to Firestore messages collection
      await addDoc(collection(db, 'messages'), messageData);
      
      Alert.alert('Success', `Message sent to ${selectedUser.displayName}`, [
        {
          text: 'OK',
          onPress: () => {
            setMessageText('');
            setSelectedUser(null);
            setShowComposeMessage(false);
            setShowUserList(false);
            // Reload messages to show the sent message
            loadAdminMessages();
          }
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Show the latest announcement as sliding notification when admin page loads
  useEffect(() => {
    if (announcements.length > 0) {
      const latestAnnouncement = announcements[0]; // First announcement is the latest
      showNotification({
        title: latestAnnouncement.title,
        message: latestAnnouncement.content,
        type: 'info',
      });
    }
  }, [announcements]);

  // Load admin messages when navigating to messages section
  useEffect(() => {
    if (activeNav === 'messages') {
      loadAdminMessages();
    }
  }, [activeNav]);

  // Refresh messages when component becomes focused (returning from chat)
  useFocusEffect(
    useCallback(() => {
      if (activeNav === 'messages') {
        console.log('Admin page focused - refreshing messages');
        loadAdminMessages();
      }
    }, [activeNav])
  );

  // Load users when navigating to user management section
  useEffect(() => {
    if (activeNav === 'user-management') {
      loadUserManagementUsers();
    }
  }, [activeNav]);

  // Load records when navigating to records sections
  useEffect(() => {
    if (activeNav === 'planting-records' || activeNav === 'harvest-records') {
      loadRecords();
      loadGlobalAnalytics();
    }
  }, [activeNav]);

  // Reload analytics when selectedMonth changes
  useEffect(() => {
    if (activeNav === 'planting-records') {
      loadGlobalAnalytics();
    }
  }, [selectedMonth]);

  // Load global analytics (all users data)
  const loadGlobalAnalytics = async () => {
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

    } catch (error) {
      console.error('Error loading global analytics:', error);
    } finally {
      setGlobalLoading(false);
    }
  };

  // Calculate global analytics
  const calculateGlobalAnalytics = (reports: any[]) => {
    const cropDistribution: { [key: string]: { total: number, userCount: number } } = {};
    const farmersPerCrop: { [key: string]: Set<string> } = {};
    
    reports.forEach(report => {
      const crop = report.crop;
      const userId = report.userId || report.farmerEmail || report.userEmail;
      
      if (!cropDistribution[crop]) {
        cropDistribution[crop] = { total: 0, userCount: 0 };
        farmersPerCrop[crop] = new Set();
      }
      
      cropDistribution[crop].total += report.plantCount || 0;
      farmersPerCrop[crop].add(userId);
    });

    // Update userCount with actual unique users
    Object.keys(cropDistribution).forEach(crop => {
      cropDistribution[crop].userCount = farmersPerCrop[crop].size;
    });

    const sortedCrops = Object.entries(cropDistribution)
      .map(([crop, data]) => ({ crop, ...data }))
      .sort((a, b) => b.total - a.total);

    const sortedFarmers = Object.entries(farmersPerCrop)
      .map(([crop, farmers]) => ({ crop, farmerCount: farmers.size }))
      .sort((a, b) => b.farmerCount - a.farmerCount);

    return {
      cropDistribution: sortedCrops,
      farmersPerCrop: sortedFarmers,
      totalPlants: reports.reduce((sum, report) => sum + (report.plantCount || 0), 0),
      totalUsers: new Set(reports.map(r => r.userId || r.farmerEmail || r.userEmail)).size
    };
  };

  // Load global harvest analytics
  const loadGlobalHarvestAnalytics = async (month: Date) => {
    setGlobalHarvestLoading(true);
    try {
      // Get all harvest reports from all users for global trends
      const harvestQuery = query(collection(db, 'harvestReports'));
      const harvestSnapshot = await getDocs(harvestQuery);
      const rawHarvestReports = harvestSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id, // Ensure ID is preserved
      }));
      
      // Convert to unified format
      const allHarvestReports = rawHarvestReports.map(convertToUnifiedFormat);

      // Filter by month - only show records from the selected month
      const targetMonth = month.getMonth();
      const targetYear = month.getFullYear();
      
      // Current month data
      const filteredReports = allHarvestReports.filter(report => {
        if (!report.harvestDate) return false;
        
        const reportDate = new Date(report.harvestDate);
        const reportMonth = reportDate.getMonth();
        const reportYear = reportDate.getFullYear();
        
        return reportMonth === targetMonth && reportYear === targetYear;
      });

      // Previous year same month data
      const previousYearMonth = targetMonth;
      const previousYear = targetYear - 1;
      const filteredPreviousYearReports = allHarvestReports.filter(report => {
        if (!report.harvestDate) return false;
        
        const reportDate = new Date(report.harvestDate);
        const reportMonth = reportDate.getMonth();
        const reportYear = reportDate.getFullYear();
        
        return reportMonth === previousYearMonth && reportYear === previousYear;
      });

      // Previous month data
      const previousMonthDate = new Date(targetYear, targetMonth - 1, 1);
      const previousMonth = previousMonthDate.getMonth();
      const previousMonthYear = previousMonthDate.getFullYear();
      const filteredPreviousMonthReports = allHarvestReports.filter(report => {
        if (!report.harvestDate) return false;
        
        const reportDate = new Date(report.harvestDate);
        const reportMonth = reportDate.getMonth();
        const reportYear = reportDate.getFullYear();
        
        return reportMonth === previousMonth && reportYear === previousMonthYear;
      });

      // Calculate global analytics with comparisons
      calculateGlobalHarvestAnalytics(
        filteredReports,
        filteredPreviousYearReports,
        filteredPreviousMonthReports
      );
      
      console.log('✅ Loaded global harvest analytics for', month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), ':', filteredReports.length, 'records. Previous year:', filteredPreviousYearReports.length, 'Previous month:', filteredPreviousMonthReports.length);
    } catch (error) {
      console.error('Error loading global harvest analytics:', error);
    } finally {
      setGlobalHarvestLoading(false);
    }
  };

  const calculateGlobalHarvestAnalytics = (
    reports: any[],
    previousYearReports: any[] = [],
    previousMonthReports: any[] = []
  ) => {
    // Helper function to calculate harvest data for a set of reports
    const calculateHarvestData = (reportList: any[]) => {
      const cropMap = new Map();
      const cropUserMap = new Map();

      reportList.forEach(report => {
        const crop = report.crop;
        const harvest = report.actualHarvest || report.harvestWeight || 0;
        const userEmail = report.farmerEmail || report.userEmail;

        // Track harvest amounts
        if (cropMap.has(crop)) {
          const existing = cropMap.get(crop);
          cropMap.set(crop, {
            count: existing.count + 1,
            totalHarvest: existing.totalHarvest + harvest
          });
        } else {
          cropMap.set(crop, {
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

      return { cropMap, cropUserMap };
    };

    // Calculate current month data
    const current = calculateHarvestData(reports);
    const prevYear = calculateHarvestData(previousYearReports);
    const prevMonth = calculateHarvestData(previousMonthReports);

    // Get all unique crops from current, previous year, and previous month
    // This ensures we include crops even if they only have previous month/year data
    const allCrops = new Set<string>();
    current.cropMap.forEach((_, crop) => allCrops.add(crop));
    prevYear.cropMap.forEach((_, crop) => allCrops.add(crop));
    prevMonth.cropMap.forEach((_, crop) => allCrops.add(crop));

    // If no crops at all, return empty
    if (allCrops.size === 0) {
      setGlobalHarvestAnalytics({
        totalHarvested: 0,
        totalUsers: 0,
        mostPopularCrop: '',
        cropDistribution: []
      });
      return;
    }

    // Calculate total harvested globally
    const totalHarvested = reports.reduce((sum, report) => {
      const harvest = report.actualHarvest || report.harvestWeight || 0;
      return sum + harvest;
    }, 0);

    // Get unique users
    const uniqueUsers = new Set(reports.map(report => report.userEmail || report.farmerEmail));
    const totalUsers = uniqueUsers.size;

    // Convert to array and calculate percentages with comparisons
    const cropDistribution = Array.from(allCrops).map(crop => {
      const currentData = current.cropMap.get(crop) || { count: 0, totalHarvest: 0 };
      const prevYearData = prevYear.cropMap.get(crop) || { count: 0, totalHarvest: 0 };
      const prevMonthData = prevMonth.cropMap.get(crop) || { count: 0, totalHarvest: 0 };

      const previousYearChange = prevYearData.totalHarvest > 0
        ? ((currentData.totalHarvest - prevYearData.totalHarvest) / prevYearData.totalHarvest) * 100
        : currentData.totalHarvest > 0 ? 100 : 0;

      const previousMonthChange = prevMonthData.totalHarvest > 0
        ? ((currentData.totalHarvest - prevMonthData.totalHarvest) / prevMonthData.totalHarvest) * 100
        : currentData.totalHarvest > 0 ? 100 : 0;

      return {
        crop,
        count: currentData.count,
        userCount: current.cropUserMap.get(crop)?.size || 0,
        totalHarvest: currentData.totalHarvest,
        percentage: totalHarvested > 0 ? (currentData.totalHarvest / totalHarvested) * 100 : 0,
        color: getCropHarvestColor(crop),
        previousYearTotal: prevYearData.totalHarvest,
        previousYearUserCount: prevYear.cropUserMap.get(crop)?.size || 0,
        previousYearChange,
        previousMonthTotal: prevMonthData.totalHarvest,
        previousMonthUserCount: prevMonth.cropUserMap.get(crop)?.size || 0,
        previousMonthChange,
      };
    }).sort((a, b) => b.totalHarvest - a.totalHarvest);

    // Find most popular crop
    const mostPopularCrop = cropDistribution.length > 0 ? cropDistribution[0].crop : '';

    setGlobalHarvestAnalytics({
      totalHarvested,
      totalUsers,
      mostPopularCrop,
      cropDistribution
    });
  };

  const getCropHarvestColor = (crop: string) => {
    // Use consistent green colors like planting report
    const colors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E8'];
    const index = crop.length % colors.length;
    return colors[index];
  };

  // Check if harvest data exists for selected month
  const hasHarvestDataForMonth = (month: Date) => {
    if (!globalHarvestAnalytics || !globalHarvestAnalytics.cropDistribution) return false;
    return globalHarvestAnalytics.cropDistribution.length > 0;
  };

  // Check if data exists for selected month
  const hasDataForMonth = (month: Date) => {
    if (!globalAnalytics) return false;
    return globalAnalytics.cropDistribution && globalAnalytics.cropDistribution.length > 0;
  };

  // Load farmers data when navigating to farmers-records section
  useEffect(() => {
    if (activeNav === 'farmers-records') {
      loadFarmersData();
    }
  }, [activeNav]);

  // Load read reports from AsyncStorage on component mount
  useEffect(() => {
    loadReadReports();
  }, []);

  // Function to load read reports from AsyncStorage
  const loadReadReports = async () => {
    try {
      const readReportsData = await AsyncStorage.getItem('admin_read_reports');
      if (readReportsData) {
        const readReportsArray = JSON.parse(readReportsData);
        setReadReports(new Set(readReportsArray));
        console.log('✅ Loaded read reports from storage:', readReportsArray.length);
      }
    } catch (error) {
      console.error('❌ Error loading read reports:', error);
    }
  };

  // Function to save read reports to AsyncStorage
  const saveReadReports = async (readReportsSet: Set<string>) => {
    try {
      const readReportsArray = Array.from(readReportsSet);
      await AsyncStorage.setItem('admin_read_reports', JSON.stringify(readReportsArray));
      console.log('✅ Saved read reports to storage:', readReportsArray.length);
    } catch (error) {
      console.error('❌ Error saving read reports:', error);
    }
  };

  // Function to mark a report as read
  const markReportAsRead = async (reportId: string) => {
    const newReadReports = new Set(readReports);
    newReadReports.add(reportId);
    setReadReports(newReadReports);
    await saveReadReports(newReadReports);
    
    // Update the records state to reflect the read status
    updateRecordsReadStatus(reportId);
  };

  // Function to update records state with read status
  const updateRecordsReadStatus = (reportId: string) => {
    // Update planting records and regroup immediately
    setPlantingRecords(prevRecords => {
      const updatedRecords = prevRecords.map(record => 
        record.id === reportId ? { ...record, read: true } : record
      );
      // Regroup with updated records
      setGroupedPlantingRecords(groupRecordsByUser(updatedRecords, 'planting'));
      return updatedRecords;
    });
    
    // Update harvest records and regroup immediately
    setHarvestRecords(prevRecords => {
      const updatedRecords = prevRecords.map(record => 
        record.id === reportId ? { ...record, read: true } : record
      );
      // Regroup with updated records
      setGroupedHarvestRecords(groupRecordsByUser(updatedRecords, 'harvest'));
      return updatedRecords;
    });
  };


  // Function to load planting and harvest records
  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      console.log('🔄 Loading records...');
      
      // Load all planting records from all users for admin view
      try {
        const plantingQuery = query(collection(db, 'plantingReports'));
        const plantingSnapshot = await getDocs(plantingQuery);
        const plantingData = plantingSnapshot.docs.map(doc => {
          const unified = convertToUnifiedFormat({
            id: doc.id,
            ...doc.data(),
          });
          return {
            ...unified,
            read: readReports.has(doc.id), // Use persistent read status
          };
        });
        setPlantingRecords(plantingData);

        // Group planting records by user
        const groupedPlanting = groupRecordsByUser(plantingData, 'planting');
        setGroupedPlantingRecords(groupedPlanting);

        console.log('✅ Loaded planting records:', plantingData.length);
        console.log('✅ Grouped planting records:', groupedPlanting.length, 'users');
      } catch (plantingError) {
        console.log('⚠️ No planting records found or error:', plantingError);
        setPlantingRecords([]);
        setGroupedPlantingRecords([]);
      }

      // Load all harvest records from all users for admin view
      try {
        const harvestQuery = query(collection(db, 'harvestReports'));
        const harvestSnapshot = await getDocs(harvestQuery);
        const harvestData = harvestSnapshot.docs.map(doc => {
          const unified = convertToUnifiedFormat({
            id: doc.id,
            ...doc.data(),
          });
          return {
            ...unified,
            read: readReports.has(doc.id), // Use persistent read status
          };
        });
        setHarvestRecords(harvestData);

        // Group harvest records by user
        const groupedHarvest = groupRecordsByUser(harvestData, 'harvest');
        setGroupedHarvestRecords(groupedHarvest);

        console.log('✅ Loaded harvest records:', harvestData.length);
        console.log('✅ Grouped harvest records:', groupedHarvest.length, 'users');
      } catch (harvestError) {
        console.log('⚠️ No harvest records found or error:', harvestError);
        setHarvestRecords([]);
        setGroupedHarvestRecords([]);
      }
      
      // Load global analytics for both planting and harvest
      await loadGlobalAnalytics();
      await loadGlobalHarvestAnalytics(selectedHarvestMonth);
      
      console.log('✅ Records loading completed');
    } catch (error) {
      console.error('❌ Error loading records:', error);
      Alert.alert('Error', 'Failed to load records. Please try again.');
    } finally {
      setLoadingRecords(false);
    }
  };

  // Crop icon and Tagalog name functions
  const getCropIcon = (crop: string) => {
    const cropIcons: { [key: string]: string } = {
      'Rice': '🌾', 'Corn': '🌽', 'Tomato': '🍅', 'Eggplant': '🍆', 'Squash': '🎃',
      'Cabbage': '🥬', 'Carrot': '🥕', 'Onion': '🧅', 'Garlic': '🧄', 'Potato': '🥔',
      'Sweet Potato': '🍠', 'Cassava': '🌿', 'Banana': '🍌', 'Mango': '🥭', 'Papaya': '🍈',
      'Pineapple': '🍍', 'Coconut': '🥥', 'Coffee': '☕', 'Cacao': '🍫', 'Sugarcane': '🎋',
      'Peanut': '🥜', 'Soybean': '🫘', 'Mung Bean': '🫘', 'Beans': '🫘', 'Bataw': '🫘',
      'Chili': '🌶️', 'Bell Pepper': '🫑', 'Cucumber': '🥒', 'Lettuce': '🥬', 'Spinach': '🥬',
      'Kangkong': '🥬', 'Ampalaya': '🥒', 'Okra': '🥒', 'Radish': '🥕', 'Turnip': '🥕',
      'Ginger': '🫚', 'Turmeric': '🫚', 'Lemongrass': '🌿', 'Basil': '🌿', 'Oregano': '🌿',
      'Mint': '🌿', 'Parsley': '🌿', 'Cilantro': '🌿', 'Rosemary': '🌿', 'Thyme': '🌿'
    };
    return cropIcons[crop] || '🌱';
  };

  const getCropTagalogName = (crop: string) => {
    const cropTagalog: { [key: string]: string } = {
      'Rice': 'Palay', 'Corn': 'Mais', 'Tomato': 'Kamatis', 'Eggplant': 'Talong', 'Squash': 'Kalabasa',
      'Cabbage': 'Repolyo', 'Carrot': 'Karot', 'Onion': 'Sibuyas', 'Garlic': 'Bawang', 'Potato': 'Patatas',
      'Sweet Potato': 'Kamote', 'Cassava': 'Kamoteng Kahoy', 'Banana': 'Saging', 'Mango': 'Mangga', 'Papaya': 'Papaya',
      'Pineapple': 'Pinya', 'Coconut': 'Niyog', 'Coffee': 'Kape', 'Cacao': 'Kakaw', 'Sugarcane': 'Tubo',
      'Peanut': 'Mani', 'Soybean': 'Soybean', 'Mung Bean': 'Munggo', 'Beans': 'Patani', 'Bataw': 'Bataw',
      'Chili': 'Sili', 'Bell Pepper': 'Paminta', 'Cucumber': 'Pipino', 'Lettuce': 'Lettuce', 'Spinach': 'Spinach',
      'Kangkong': 'Kangkong', 'Ampalaya': 'Ampalaya', 'Okra': 'Okra', 'Radish': 'Labanos', 'Turnip': 'Singkamas',
      'Ginger': 'Luya', 'Turmeric': 'Luyang Dilaw', 'Lemongrass': 'Tanglad', 'Basil': 'Balanoy', 'Oregano': 'Oregano',
      'Mint': 'Mentha', 'Parsley': 'Perehil', 'Cilantro': 'Wansoy', 'Rosemary': 'Rosemary', 'Thyme': 'Thyme'
    };
    return cropTagalog[crop] || crop;
  };

  type CropTimelineStats = {
    crop: string;
    averageExpectedDurationDays: number | null;
    averageActualDurationDays: number | null;
    expectedSampleSize: number;
    actualSampleSize: number;
    totalReportCount: number;
    dateDifferenceDays: number | null;
    averageExpectedYieldPerPlant: number | null;
    averageActualYieldPerPlant: number | null;
    expectedYieldPerPlantSampleSize: number;
    actualYieldPerPlantSampleSize: number;
    yieldDifference: number | null;
  };

  const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

  const coerceNumber = (value: any): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '').trim();
      if (cleaned.length === 0) {
        return null;
      }
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value === 'object') {
      if (typeof value.toNumber === 'function') {
        const num = value.toNumber();
        return Number.isFinite(num) ? num : null;
      }
    }
    return null;
  };

  const firstValidNumber = (values: any[]): number | null => {
    for (const value of values) {
      const parsed = coerceNumber(value);
      if (parsed !== null) {
        return parsed;
      }
    }
    return null;
  };

  const toTimestamp = (value: any): number | null => {
    if (!value && value !== 0) {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.getTime();
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }
    if (typeof value === 'object') {
      if (typeof value.toDate === 'function') {
        const date = value.toDate();
        return Number.isNaN(date.getTime()) ? null : date.getTime();
      }
      if ('seconds' in value && typeof value.seconds === 'number') {
        const milliseconds = value.seconds * 1000 + (value.nanoseconds || 0) / 1_000_000;
        return milliseconds;
      }
    }
    return null;
  };

  const extractDateFromFields = (record: any, fields: string[]): number | null => {
    for (const field of fields) {
      if (field in record) {
        const timestamp = toTimestamp(record[field]);
        if (timestamp !== null) {
          return timestamp;
        }
      }
    }
    return null;
  };

  const extractExpectedHarvestDateMs = (report: any): number | null => {
    return extractDateFromFields(report, [
      'expectedHarvestDate',
      'expectedDate',
      'expectedHarvestTime',
      'expectedHarvestSchedule',
    ]);
  };

  const extractActualHarvestDateMs = (report: any): number | null => {
    return extractDateFromFields(report, [
      'actualHarvestDate',
      'harvestDate',
      'dateHarvested',
      'actualDate',
      'completedAt',
    ]);
  };

  const extractExpectedYieldKg = (report: any): number | null => {
    return firstValidNumber([
      report.expectedYield,
      report.expectedHarvest,
      report.expectedWeight,
      report.expectedHarvestKg,
    ]);
  };

  const extractActualHarvestKg = (report: any): number | null => {
    const candidates = [
      report.actualHarvestAmount,
      report.actualHarvest,
      report.harvestWeight,
      report.actualYield,
      report.amount,
      report.totalHarvest,
    ]
      .map(coerceNumber)
      .filter(value => value !== null) as number[];

    const positive = candidates.find(value => value > 0);
    if (positive !== undefined) {
      return positive;
    }
    if (candidates.length > 0) {
      return candidates[0];
    }
    return null;
  };

  const extractPlantCount = (report: any): number | null => {
    return coerceNumber(
      report?.plantCount ??
        report?.plantNumber ??
        report?.numberOfPlants ??
        report?.plants ??
        report?.plantingCount
    );
  };

  const isReportHarvested = (report: any): boolean => {
    if (!report) return false;
    if (report.isHarvested === true) return true;
    const status = typeof report.status === 'string' ? report.status.toLowerCase() : '';
    if (status === 'harvested' || status === 'completed') return true;
    if (report.harvestDate || report.actualHarvestDate) return true;
    const harvest = extractActualHarvestKg(report);
    return harvest !== null && harvest > 0;
  };

  const formatDurationValue = (days?: number | null, emptyLabel: string = 'N/A') => {
    if (days === null || days === undefined || Number.isNaN(days)) {
      return emptyLabel;
    }
    const rounded = Math.round(days);
    const months = Math.floor(rounded / 30);
    const remainingDays = Math.max(0, rounded - months * 30);
    const parts: string[] = [];
    if (months > 0) {
      parts.push(`${months} month${months === 1 ? '' : 's'}`);
    }
    if (remainingDays > 0 || parts.length === 0) {
      parts.push(`${remainingDays} day${remainingDays === 1 ? '' : 's'}`);
    }
    return parts.join(' ');
  };

  const formatYieldPerPlantValue = (value?: number | null, emptyLabel: string = 'N/A') => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return emptyLabel;
    }
    return `${value.toFixed(2)} kg/plant`;
  };

  const average = (values: number[]): number | null => {
    if (!values || values.length === 0) return null;
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
  };

  const formatPerPlantDisplay = (value: number | null, blankIfMissing = false) => {
    if (value === null || Number.isNaN(value)) {
      return blankIfMissing ? '' : 'N/A';
    }
    return `${value.toFixed(2)} kg/plant`;
  };

  const formatDurationLabel = (daysValue: number) => {
    const rounded = Math.round(daysValue);
    const months = Math.floor(rounded / 30);
    const days = Math.max(0, rounded - months * 30);
    const parts: string[] = [];
    if (months > 0) {
      parts.push(`${months} month${months === 1 ? '' : 's'}`);
    }
    if (days > 0 || parts.length === 0) {
      parts.push(`${days} day${days === 1 ? '' : 's'}`);
    }
    return parts.join(' ');
  };

  const formatDurationDays = (value: number | null, blankIfMissing = false) => {
    if (value === null || Number.isNaN(value)) {
      return blankIfMissing ? '' : 'N/A';
    }
    return formatDurationLabel(value);
  };

  const formatDateDifference = (value: number | null) => {
    if (value === null) {
      return '';
    }
    if (Math.abs(value) < 1) {
      return 'On schedule';
    }
    const durationText = formatDurationLabel(Math.abs(value));
    return value > 0 ? `${durationText} later than expected` : `${durationText} earlier than expected`;
  };

  const formatYieldDifference = (value: number | null) => {
    if (value === null) {
      return '';
    }
    if (Math.abs(value) < 0.1) {
      return 'Yield on target';
    }
    const formatted = `${value > 0 ? '+' : ''}${value.toFixed(2)} kg/plant`;
    return value > 0 ? `${formatted} above expected` : `${formatted} below expected`;
  };

  const buildCropTimeline = (plantingReports: any[], harvestedReports: any[]): CropTimelineStats[] => {
    if (plantingReports.length === 0) {
      return [];
    }

    const expectedMap = new Map<
      string,
      {
        expectedDurations: number[];
        expectedYieldPerPlant: number[];
      }
    >();

    const actualMap = new Map<
      string,
      {
        actualDurations: number[];
        actualYieldPerPlant: number[];
      }
    >();
    const totalCounts = new Map<string, number>();

    const ensureExpectedEntry = (crop: string) => {
      if (!expectedMap.has(crop)) {
        expectedMap.set(crop, {
          expectedDurations: [],
          expectedYieldPerPlant: [],
        });
      }
      return expectedMap.get(crop)!;
    };

    const ensureActualEntry = (crop: string) => {
      if (!actualMap.has(crop)) {
        actualMap.set(crop, {
          actualDurations: [],
          actualYieldPerPlant: [],
        });
      }
      return actualMap.get(crop)!;
    };

    plantingReports.forEach(report => {
      const crop = report.crop || 'Unspecified Crop';
      const expectedEntry = ensureExpectedEntry(crop);
      totalCounts.set(crop, (totalCounts.get(crop) || 0) + 1);

      const expectedDateMs = extractExpectedHarvestDateMs(report);
      const plantingDateMs = extractDateFromFields(report, ['plantingDate', 'plantedDate']);
      if (expectedDateMs !== null && plantingDateMs !== null) {
        const durationDays = (expectedDateMs - plantingDateMs) / ONE_DAY_IN_MS;
        if (Number.isFinite(durationDays)) {
          expectedEntry.expectedDurations.push(durationDays);
        }
      }

      const expectedYield = extractExpectedYieldKg(report);
      if (expectedYield !== null) {
        const plantCount = extractPlantCount(report);
        if (plantCount && plantCount > 0) {
          expectedEntry.expectedYieldPerPlant.push(expectedYield / plantCount);
        }
      }
    });

    harvestedReports.forEach(report => {
      const crop = report.crop || 'Unspecified Crop';
      const actualEntry = ensureActualEntry(crop);

      const actualDateMs = extractActualHarvestDateMs(report);
      const plantingDateMs = extractDateFromFields(report, ['plantingDate', 'plantedDate']);
      if (actualDateMs !== null && plantingDateMs !== null) {
        const durationDays = (actualDateMs - plantingDateMs) / ONE_DAY_IN_MS;
        if (Number.isFinite(durationDays)) {
          actualEntry.actualDurations.push(durationDays);
        }
      }

      const actualYield = extractActualHarvestKg(report);
      if (actualYield !== null) {
        const plantCount = extractPlantCount(report);
        if (plantCount && plantCount > 0) {
          actualEntry.actualYieldPerPlant.push(actualYield / plantCount);
        }
      }
    });

    const crops = new Set<string>([
      ...Array.from(expectedMap.keys()),
      ...Array.from(actualMap.keys()),
    ]);

    return Array.from(crops)
      .map(crop => {
        const expectedEntry = expectedMap.get(crop);
        const actualEntry = actualMap.get(crop);

        if (!expectedEntry || expectedEntry.expectedDurations.length === 0) {
          return null;
        }

        const avgExpectedDuration = average(expectedEntry.expectedDurations);
        const avgActualDuration = actualEntry ? average(actualEntry.actualDurations) : null;
        const avgExpectedYieldPerPlant = average(expectedEntry.expectedYieldPerPlant);
        const avgActualYieldPerPlant = actualEntry ? average(actualEntry.actualYieldPerPlant) : null;

        const dateDifferenceDays =
          avgExpectedDuration !== null && avgActualDuration !== null
            ? avgActualDuration - avgExpectedDuration
            : null;
        const yieldDifference =
          avgExpectedYieldPerPlant !== null && avgActualYieldPerPlant !== null
            ? avgActualYieldPerPlant - avgExpectedYieldPerPlant
            : null;

        const expectedSampleSize = expectedEntry.expectedDurations.length;
        const actualSampleSize = actualEntry ? actualEntry.actualDurations.length : 0;
        const expectedYieldPerPlantSampleSize = expectedEntry.expectedYieldPerPlant.length;
        const actualYieldPerPlantSampleSize = actualEntry ? actualEntry.actualYieldPerPlant.length : 0;

        return {
          crop,
          averageExpectedDurationDays: avgExpectedDuration,
          averageActualDurationDays: avgActualDuration,
          expectedSampleSize,
          actualSampleSize,
          totalReportCount: totalCounts.get(crop) || 0,
          dateDifferenceDays,
          averageExpectedYieldPerPlant: avgExpectedYieldPerPlant,
          averageActualYieldPerPlant: avgActualYieldPerPlant,
          expectedYieldPerPlantSampleSize,
          actualYieldPerPlantSampleSize,
          yieldDifference,
        } as CropTimelineStats;
      })
      .filter((item): item is CropTimelineStats => item !== null)
      .filter(item => item.expectedSampleSize > 0)
      .sort((a, b) => {
        const aScore =
          (a.actualSampleSize || 0) +
          (a.expectedSampleSize || 0) +
          (a.expectedYieldPerPlantSampleSize || 0) +
          (a.actualYieldPerPlantSampleSize || 0);
        const bScore =
          (b.actualSampleSize || 0) +
          (b.expectedSampleSize || 0) +
          (b.expectedYieldPerPlantSampleSize || 0) +
          (b.actualYieldPerPlantSampleSize || 0);
        return bScore - aScore;
      });
  };

  const sortedHarvestEntries = React.useMemo(() => {
    const entries = harvestRecords.slice();

    const getExpected = (record: any) =>
      typeof record.expectedDurationDays === 'number' ? record.expectedDurationDays : null;
    const getActual = (record: any) =>
      typeof record.actualDurationDays === 'number' ? record.actualDurationDays : null;

    const compareDesc = (aVal: number | null, bVal: number | null) => {
      const aNum = typeof aVal === 'number' ? aVal : -Infinity;
      const bNum = typeof bVal === 'number' ? bVal : -Infinity;
      return bNum - aNum;
    };

    const compareAsc = (aVal: number | null, bVal: number | null) => {
      const aNum = typeof aVal === 'number' ? aVal : Infinity;
      const bNum = typeof bVal === 'number' ? bVal : Infinity;
      return aNum - bNum;
    };

    switch (harvestSortOption) {
      case 'expectedDesc':
        entries.sort((a, b) => compareDesc(getExpected(a), getExpected(b)));
        break;
      case 'expectedAsc':
        entries.sort((a, b) => compareAsc(getExpected(a), getExpected(b)));
        break;
      case 'actualDesc':
        entries.sort((a, b) => compareDesc(getActual(a), getActual(b)));
        break;
      case 'actualAsc':
        entries.sort((a, b) => compareAsc(getActual(a), getActual(b)));
        break;
      default:
        break;
    }

    return entries;
  }, [harvestRecords, harvestSortOption]);

  const harvestTimelineStats = React.useMemo(() => {
    if (plantingRecords.length === 0) {
      return [];
    }
    const harvestedReports = harvestRecords.filter(isReportHarvested);
    return buildCropTimeline(plantingRecords, harvestedReports);
  }, [plantingRecords, harvestRecords]);

  // Function to group records by user account
  const groupRecordsByUser = (records: any[], recordType: 'planting' | 'harvest' = 'planting') => {
    const userGroups: { [key: string]: any } = {};
    
    // For harvest records, filter to only show the latest harvest per planting report
    let processedRecords = records;
    if (recordType === 'harvest') {
      const plantingReportMap = new Map();
      
      // Group harvest records by plantingReportId and keep only the latest one
      records.forEach(record => {
        const plantingReportId = record.plantingReportId;
        if (plantingReportId) {
          const existingRecord = plantingReportMap.get(plantingReportId);
          if (!existingRecord) {
            plantingReportMap.set(plantingReportId, record);
          } else {
            // Compare dates and keep the latest one
            const currentDate = record.submittedAt?.toDate?.() || record.updatedAt?.toDate?.() || new Date(0);
            const existingDate = existingRecord.submittedAt?.toDate?.() || existingRecord.updatedAt?.toDate?.() || new Date(0);
            
            if (currentDate > existingDate) {
              plantingReportMap.set(plantingReportId, record);
            }
          }
        }
      });
      
      processedRecords = Array.from(plantingReportMap.values());
      console.log(`📊 Filtered harvest records: ${records.length} → ${processedRecords.length} (removed duplicates)`);
    }
    
    const emailSet = new Set<string>();
    const uniqueEmailRecords = processedRecords.filter(record => {
      if (recordType !== 'harvest') return true;
      const email = record.farmerEmail || record.userEmail || '';
      if (!email) return true;
      if (emailSet.has(email)) {
        return false;
      }
      emailSet.add(email);
      return true;
    });

    uniqueEmailRecords.forEach(record => {
      const email = record.farmerEmail || record.userEmail || '';
      const userKey = email || record.userId || 'unknown-user';
      const userName = record.farmerName || record.userName || 'Unknown User';
      const userEmail = email || record.userEmail || record.farmerEmail || 'unknown@email.com';
      
      if (!userGroups[userKey]) {
        userGroups[userKey] = {
          userId: userKey,
          userName: userName,
          userEmail: userEmail,
          userCropEmoji: usersDirectory[userKey]?.userCropEmoji,
          reports: [],
          unreadCount: 0,
          latestReportDate: null
        };
      }
      
      userGroups[userKey].reports.push(record);
      if (!record.read) {
        userGroups[userKey].unreadCount++;
      }
      
      // Track latest report date
      const reportDate = record.submittedAt?.toDate?.() || record.updatedAt?.toDate?.() || new Date();
      if (!userGroups[userKey].latestReportDate || reportDate > userGroups[userKey].latestReportDate) {
        userGroups[userKey].latestReportDate = reportDate;
      }
    });
    
    // Convert to array and sort by latest report date
    return Object.values(userGroups).sort((a: any, b: any) => 
      new Date(b.latestReportDate).getTime() - new Date(a.latestReportDate).getTime()
    );
  };

  // Function to mark reports as read
  const markReportsAsRead = async (userId: string, reportType: 'planting' | 'harvest') => {
    const records = reportType === 'planting' ? plantingRecords : harvestRecords;
    const setRecords = reportType === 'planting' ? setPlantingRecords : setHarvestRecords;
    const setGroupedRecords = reportType === 'planting' ? setGroupedPlantingRecords : setGroupedHarvestRecords;
    
    // Get records for this user that are unread
    const userRecords = records.filter(record => 
      record.userId === userId && !record.read
    );
    
    // Update persistent read status for all user's unread records
    const newReadReports = new Set(readReports);
    userRecords.forEach(record => {
      newReadReports.add(record.id);
    });
    setReadReports(newReadReports);
    await saveReadReports(newReadReports);
    
    // Update individual records
    const updatedRecords = records.map(record => 
      record.userId === userId ? { ...record, read: true } : record
    );
    setRecords(updatedRecords);
    
    // Update grouped records
    const updatedGrouped = groupRecordsByUser(updatedRecords, reportType);
    setGroupedRecords(updatedGrouped);
  };

  // Function to open detailed report view
  const openReportDetail = async (report: any) => {
    setSelectedReport(report);
    setShowReportDetail(true);
    
    // Mark as read when opened
    if (!readReports.has(report.id)) {
      await markReportAsRead(report.id);
    }
  };

  // Function to create and broadcast announcement to all users
  const createAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content for the announcement.');
      return;
    }

    try {
      const announcementData = {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        icon: announcementIcon,
        date: new Date().toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        createdBy: 'Admin'
      };

      // Add announcement to Firebase (this will be visible to all users)
      console.log('📢 Creating announcement:', announcementData);
      await addAnnouncement(announcementData);
      console.log('✅ Announcement created successfully');

      // Reset form
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementIcon('megaphone');
      setShowCreateAnnouncement(false);

            // Show the new announcement as sliding notification
            showNotification({
              title: announcementData.title,
              message: announcementData.content,
              type: 'info',
            });

            // Show success message
            Alert.alert(
              'Announcement Created!', 
              'Your announcement has been successfully sent to all users and saved to the database.',
              [{ text: 'OK', style: 'default' }]
            );
          } catch (error) {
            console.error('Error creating announcement:', error);
            
            // Show error notification
            showNotification({
              title: '❌ Announcement Failed',
              message: 'Failed to create announcement. Please try again.',
              type: 'error',
              duration: 5000,
            });
            
            Alert.alert(
              'Error', 
              'Failed to create announcement. Please check your internet connection and try again.',
              [{ text: 'OK', style: 'default' }]
            );
          }
  };

  // Function to cancel announcement creation
  const cancelAnnouncement = () => {
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setAnnouncementIcon('megaphone');
    setShowCreateAnnouncement(false);
  };

  const onRefresh = async () => {
    setAdminRefreshing(true);
    try {
      // Reset admin data
      setProducts([...COMMODITY_DATA]);
      setDailyPriceData(null);
      setHasUploadedPDF(false);
      setSearchQuery('');
      setProcessingProgress(0);
      setIsProcessing(false);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setAdminRefreshing(false);
    }
  };

  // Function to load farmers data from farmerProfiles collection ONLY
  const loadFarmersData = async () => {
    setLoadingFarmers(true);
    try {
      console.log('📥 Loading farmers form data from farmerProfiles collection...');
      
      const farmersList: any[] = [];
      
      // Load ONLY from farmerProfiles collection (no AsyncStorage, no old data)
      const farmerProfilesSnapshot = await getDocs(collection(db, 'farmerProfiles'));
      
      farmerProfilesSnapshot.forEach((docSnap) => {
        const profileData: any = docSnap.data();
        
        // Get form data from farmer profile document (stored under formData field)
        const formData = profileData.formData || {};
        
        // Count completed forms
        const completedForms = Object.values(formData).filter((form: any) => form?.isSubmitted).length;
        const totalForms = Object.keys(formData).length;
        
        // Only include farmers who have at least some form data
        if (totalForms > 0) {
          const userId = profileData.uid || docSnap.id;
          // Document ID is the email, so use it as fallback
          const userEmail = profileData.email || docSnap.id || 'No email';
          
          farmersList.push({
            id: userId,
            userId,
            userEmail: userEmail,
            userName: profileData.name || 'Unknown User',
            userCropEmoji: profileData.selectedCropEmoji,
            formData,
            completedForms,
            totalForms,
            completionPercentage: totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0,
          });
        }
      });
      
      setFarmersData(farmersList);
      console.log(`✅ Loaded ${farmersList.length} farmers from farmerProfiles collection`);
    } catch (error) {
      console.error('❌ Error loading farmers data:', error);
      Alert.alert('Error', 'Failed to load farmers data');
    } finally {
      setLoadingFarmers(false);
    }
  };

  // Calculate summary statistics for farmers records
  const farmersSummary = React.useMemo(() => {
    if (farmersData.length === 0) {
      return {
        totalFarmers: 0,
        totalFormsSubmitted: 0,
        totalPossibleForms: 0,
        overallCompletionPercentage: 0,
        formBreakdown: {
          demographics: { submitted: 0, total: 0 },
          farmingProfile: { submitted: 0, total: 0 },
          economicFinancial: { submitted: 0, total: 0 },
          technologyInnovation: { submitted: 0, total: 0 },
          supportResources: { submitted: 0, total: 0 },
          addressesHousehold: { submitted: 0, total: 0 },
          homeAssets: { submitted: 0, total: 0 },
          incomeMarketing: { submitted: 0, total: 0 },
        },
        inventoryBreakdown: {
          demographics: {
            ageGroups: {},
            gender: {},
            maritalStatus: {},
            education: {},
            dependents: {},
            monthlyIncome: {},
          },
          farmingProfile: {},
          economicFinancial: {},
          technologyInnovation: {},
          supportResources: {},
          addressesHousehold: {},
          homeAssets: {},
          incomeMarketing: {},
        }
      };
    }

    const formKeys = [
      'demographics',
      'farmingProfile',
      'economicFinancial',
      'technologyInnovation',
      'supportResources',
      'addressesHousehold',
      'homeAssets',
      'incomeMarketing'
    ];

    const formBreakdown: any = {};
    formKeys.forEach(key => {
      formBreakdown[key] = { submitted: 0, total: 0 };
    });

    // Comprehensive inventory breakdown for all forms - includes ALL fields from the form
    const inventoryBreakdown: any = {
      demographics: {
        ageGroups: {},
        gender: {},
        maritalStatus: {},
        education: {},
        dependents: {},
        monthlyIncome: {},
        // Additional fields that might be in the form
        monthlyExpenses: {},
        electricity: {},
        comfortRoom: {},
        sourceOfDrinkingWater: {},
        numberOfChildren: {},
        memberOfOrganization: {},
        fourPsBeneficiary: {},
        religion: {},
        completeAddress: {},
        typeOfHousing: {},
        sourceOfCapitalInFarming: {},
      },
      farmingProfile: {
        yearsFarming: {},
        farmCommodity: {},
        numberOfCommodity: {},
        livestock: {},
        numberOfLivestock: {},
        landOwnership: {},
        rentalAmount: {},
        tenantCondition: {},
        farmSize: {},
        farmingMethods: {},
        otherCommodity: {},
        otherLivestock: {},
        otherFarmSize: {},
      },
      economicFinancial: {
        incomeSources: {},
        farmingFinances: {},
        farmingIncomePercentage: {},
        governmentAssistance: {},
        ngoAssistance: {},
        industryAssistance: {},
        otherIncome: {},
        otherFinances: {},
      },
      technologyInnovation: {
        farmingEquipment: {},
        machineOwnership: {},
        machinePurchasePrice: {},
        machineRentalPrice: {},
        irrigationExpenses: {},
        newTechniques: {},
        modernPractices: {},
        agriculturalInfo: {},
        otherEquipment: {},
        otherInfo: {},
      },
      supportResources: {
        farmersAssociation: {},
        governmentPrograms: {},
        governmentSupport: {},
        ngoSupport: {},
        industrySupport: {},
        extensionServices: {},
        otherGovSupport: {},
        otherNgoSupport: {},
        otherIndustrySupport: {},
      },
      addressesHousehold: {
        residentialAddress: {},
        farmAddress: {},
        householdSize: {},
        adultsInHousehold: {},
        childrenInHousehold: {},
        educationAttainment: {},
        maritalStatus: {},
      },
      homeAssets: {
        electricity: {},
        television: {},
        refrigerator: {},
        comfortRoom: {},
        houseType: {},
        monthlyRent: {},
        houseOwnership: {},
        incomeType: {},
        monthlyExpenses: {},
        farmingType: {},
      },
      incomeMarketing: {
        farmingPrimaryIncome: {},
        annualFarmIncome: {},
        incomeChange: {},
        salesChannels: {},
        otherIncomeSources: {},
        monthlyIncome: {},
        monthlyExpensesAmount: {},
      },
    };

    let totalFormsSubmitted = 0;
    let totalPossibleForms = 0;

    // Helper function to count array items
    const countArrayItems = (arr: any[], counter: any) => {
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item) {
            counter[item] = (counter[item] || 0) + 1;
          }
        });
      }
    };

    farmersData.forEach(farmer => {
      if (farmer.formData) {
        formKeys.forEach(formKey => {
          formBreakdown[formKey].total += 1;
          totalPossibleForms += 1;
          if (farmer.formData[formKey]?.isSubmitted) {
            formBreakdown[formKey].submitted += 1;
            totalFormsSubmitted += 1;
          }
        });

        // Process all form data for comprehensive inventory
        Object.keys(farmer.formData).forEach(formKey => {
          const form = farmer.formData[formKey];
          if (form?.isSubmitted && inventoryBreakdown[formKey]) {
            Object.keys(form).forEach(fieldKey => {
              if (fieldKey !== 'isSubmitted' && inventoryBreakdown[formKey][fieldKey] !== undefined) {
                const value = form[fieldKey];
                if (value) {
                  if (Array.isArray(value)) {
                    countArrayItems(value, inventoryBreakdown[formKey][fieldKey]);
                  } else if (typeof value === 'string' && value.trim()) {
                    // Special handling for age
                    if (fieldKey === 'age' && formKey === 'demographics') {
                      const age = parseInt(value);
                      if (!isNaN(age)) {
                        let ageGroup = '';
                        if (age < 18) ageGroup = 'Under 18';
                        else if (age < 26) ageGroup = '18-25';
                        else if (age < 36) ageGroup = '26-35';
                        else if (age < 46) ageGroup = '36-45';
                        else if (age < 56) ageGroup = '46-55';
                        else if (age < 66) ageGroup = '56-65';
                        else ageGroup = '65+';
                        inventoryBreakdown.demographics.ageGroups[ageGroup] = 
                          (inventoryBreakdown.demographics.ageGroups[ageGroup] || 0) + 1;
                      }
                    } else {
                      inventoryBreakdown[formKey][fieldKey][value] = 
                        (inventoryBreakdown[formKey][fieldKey][value] || 0) + 1;
                    }
                  }
                }
              }
            });
          }
        });
      }
    });

    const overallCompletionPercentage = totalPossibleForms > 0
      ? Math.round((totalFormsSubmitted / totalPossibleForms) * 100)
      : 0;

    return {
      totalFarmers: farmersData.length,
      totalFormsSubmitted,
      totalPossibleForms,
      overallCompletionPercentage,
      formBreakdown,
      inventoryBreakdown
    };
  }, [farmersData]);

  // Function to fetch all users from the database
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Debug: Check if user is authenticated
      console.log('Current user:', user);
      console.log('User profile:', profile);
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to access this feature.');
        setShowUserList(false);
        return;
      }
      
      if (profile.role !== 'admin') {
        Alert.alert('Error', 'Only administrators can access this feature.');
        setShowUserList(false);
        return;
      }
      
      // Test: Try to access a simple collection first
      console.log('Attempting to fetch users...');
      
      // Fetch from Firebase users collection
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const usersList: any[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Skip admin accounts from messaging
        if (userData.role === 'admin' || userData.email === 'agriassistme@gmail.com' || userData.email === 'AAadmin') {
          return;
        }
        
        usersList.push({
          id: doc.id,
          uid: userData.uid || doc.id, // Include UID field, fallback to doc.id
          email: userData.email || 'No email',
          displayName: userData.name || 'Unknown User',
          role: userData.role || 'farmer',
          location: userData.location || 'Philippines',
          barangay: userData.barangay || '',
          approved: userData.approved || false,
          createdAt: userData.createdAt || new Date().toISOString(),
          profileImage: userData.profileImage || '',
          userCropEmoji: userData.selectedCropEmoji,
          ...userData
        });
      });
      
      setUsers(usersList);
      setFilteredUsers(usersList); // Initialize filtered users with all users
      console.log('Successfully loaded users from Firebase:', usersList.length);
      
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set empty array if fetch fails
      setFilteredUsers([]); // Also clear filtered users
      
      let errorMessage = 'Failed to load users from database.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firebase security rules or contact the administrator.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Database is temporarily unavailable. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search query
  const filterUsers = (query: string) => {
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => {
      const searchLower = query.toLowerCase();
      const name = user.displayName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const role = user.role?.toLowerCase() || '';
      const location = user.location?.toLowerCase() || '';
      const barangay = user.barangay?.toLowerCase() || '';
      
      return name.includes(searchLower) || 
             email.includes(searchLower) || 
             role.includes(searchLower) ||
             location.includes(searchLower) ||
             barangay.includes(searchLower);
    });
    
    setFilteredUsers(filtered);
  };

  // Handle search query change
  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
    filterUsers(query);
  };

  // Load users for user management
  const loadUserManagementUsers = async () => {
    setLoadingUserManagement(true);
    try {
      console.log('Attempting to fetch users for management...');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList: any[] = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Skip admin accounts from user management
        if (userData.role === 'admin' || userData.email === 'agriassistme@gmail.com' || userData.email === 'AAadmin') {
          return;
        }
        
        usersList.push({
          id: doc.id,
          uid: userData.uid || doc.id,
          displayName: userData.displayName || userData.name || 'Unknown User',
          email: userData.email || 'No email',
          role: userData.role || 'user',
          location: userData.location || 'Unknown',
          barangay: userData.barangay || '',
          userCropEmoji: userData.selectedCropEmoji,
          isBlocked: userData.isBlocked || false,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin,
          ...userData
        });
      });
      
      setUserManagementUsers(usersList);
      setFilteredUserManagementUsers(usersList);
      console.log('Successfully loaded users for management:', usersList.length);
      
      // Check user activity after loading users
      setTimeout(() => {
        checkUserActivity();
      }, 500);
      
    } catch (error: any) {
      console.error('Error fetching users for management:', error);
      setUserManagementUsers([]);
      setFilteredUserManagementUsers([]);
      
      let errorMessage = 'Failed to load users from database.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firebase security rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Database is currently unavailable. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoadingUserManagement(false);
    }
  };

  // Filter users for user management
  const filterUserManagementUsers = (query: string) => {
    if (!query.trim()) {
      setFilteredUserManagementUsers(userManagementUsers);
      return;
    }
    
    const filtered = userManagementUsers.filter(user => {
      const searchLower = query.toLowerCase();
      const name = user.displayName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const role = user.role?.toLowerCase() || '';
      const location = user.location?.toLowerCase() || '';
      const barangay = user.barangay?.toLowerCase() || '';
      
      return name.includes(searchLower) || 
             email.includes(searchLower) || 
             role.includes(searchLower) ||
             location.includes(searchLower) ||
             barangay.includes(searchLower);
    });
    
    setFilteredUserManagementUsers(filtered);
  };

  // Handle user management search
  const handleUserManagementSearch = (query: string) => {
    setUserManagementSearchQuery(query);
    filterUserManagementUsers(query);
  };

  // Block/Unblock user
  const toggleUserBlock = async (userId: string, isCurrentlyBlocked: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isBlocked: !isCurrentlyBlocked,
        blockedAt: !isCurrentlyBlocked ? new Date().toISOString() : null,
        blockedBy: !isCurrentlyBlocked ? user?.email || 'admin' : null
      });

      // Update local state
      setUserManagementUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isBlocked: !isCurrentlyBlocked } : user
      ));
      setFilteredUserManagementUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isBlocked: !isCurrentlyBlocked } : user
      ));

      Alert.alert(
        'Success', 
        `User has been ${!isCurrentlyBlocked ? 'blocked' : 'unblocked'} successfully.`
      );
    } catch (error) {
      console.error('Error toggling user block status:', error);
      Alert.alert('Error', 'Failed to update user status. Please try again.');
    }
  };

  // Delete user
  const deleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete "${userName}"? This action cannot be undone and will remove all user data including records and messages.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user document
              const userRef = doc(db, 'users', userId);
              await deleteDoc(userRef);

              // Update local state
              setUserManagementUsers(prev => prev.filter(user => user.id !== userId));
              setFilteredUserManagementUsers(prev => prev.filter(user => user.id !== userId));

              Alert.alert('Success', 'User has been deleted successfully.');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Check for duplicate emails
  const checkDuplicateEmails = () => {
    const emailCounts: { [key: string]: number } = {};
    const duplicates: string[] = [];
    
    userManagementUsers.forEach(user => {
      if (user.email && user.email !== 'No email') {
        emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
        if (emailCounts[user.email] > 1 && !duplicates.includes(user.email)) {
          duplicates.push(user.email);
        }
      }
    });
    
    if (duplicates.length > 0) {
      Alert.alert(
        'Duplicate Emails Found',
        `The following email addresses have multiple accounts:\n\n${duplicates.join('\n')}\n\nPlease review and clean up these duplicate accounts.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('No Duplicates', 'All email addresses are unique.');
    }
  };

  // Check user activity based on recent reports
  const checkUserActivity = async () => {
    const activityStatus: {[key: string]: 'active' | 'inactive' | 'no-reports'} = {};
    const currentDate = new Date();
    const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    
    try {
      // Try to get planting and harvest records with error handling
      let plantingSnapshot: any = null;
      let harvestSnapshot: any = null;
      
      try {
        plantingSnapshot = await getDocs(collection(db, 'plantingRecords'));
        console.log('Successfully loaded planting records for activity check');
      } catch (plantingError: any) {
        console.log('Could not access planting records:', plantingError?.message || 'Unknown error');
      }
      
      try {
        harvestSnapshot = await getDocs(collection(db, 'harvestRecords'));
        console.log('Successfully loaded harvest records for activity check');
      } catch (harvestError: any) {
        console.log('Could not access harvest records:', harvestError?.message || 'Unknown error');
      }
      
      // Process planting records if available
      if (plantingSnapshot) {
        plantingSnapshot.forEach((doc) => {
          const data = doc.data();
          const userId = data.userId || data.uid;
          const recordDate = data.date ? new Date(data.date) : new Date(data.createdAt);
          
          if (userId && recordDate >= oneMonthAgo) {
            activityStatus[userId] = 'active';
          }
        });
      }
      
      // Process harvest records if available
      if (harvestSnapshot) {
        harvestSnapshot.forEach((doc) => {
          const data = doc.data();
          const userId = data.userId || data.uid;
          const recordDate = data.date ? new Date(data.date) : new Date(data.createdAt);
          
          if (userId && recordDate >= oneMonthAgo) {
            activityStatus[userId] = 'active';
          }
        });
      }
      
      // Set status for all users
      userManagementUsers.forEach(user => {
        if (!activityStatus[user.id]) {
          // Check if user has any reports at all (if we have access to records)
          let hasAnyReports = false;
          
          if (plantingSnapshot) {
            hasAnyReports = plantingSnapshot.docs.some(doc => {
              const data = doc.data();
              return (data.userId || data.uid) === user.id;
            });
          }
          
          if (!hasAnyReports && harvestSnapshot) {
            hasAnyReports = harvestSnapshot.docs.some(doc => {
              const data = doc.data();
              return (data.userId || data.uid) === user.id;
            });
          }
          
          // If we can't access records, mark as no-reports
          if (!plantingSnapshot && !harvestSnapshot) {
            activityStatus[user.id] = 'no-reports';
          } else {
            activityStatus[user.id] = hasAnyReports ? 'inactive' : 'no-reports';
          }
        }
      });
      
      setUserActivityStatus(activityStatus);
      console.log('User activity status updated:', Object.keys(activityStatus).length, 'users processed');
    } catch (error) {
      console.error('Error checking user activity:', error);
      // Set all users to no-reports as fallback
      const fallbackStatus: {[key: string]: 'no-reports'} = {};
      userManagementUsers.forEach(user => {
        fallbackStatus[user.id] = 'no-reports';
      });
      setUserActivityStatus(fallbackStatus);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBorder} />

      {/* Main Content */}
      {activeNav === 'home' && (
        <>
          {/* Fixed Sliding Announcement - Only on Home */}
          <SlidingAnnouncement />
        <ScrollView 
          style={[styles.scrollView, { paddingTop: 60 }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={adminRefreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Welcome to</Text>
                
                {/* Centered Icon/Logo */}
                <View style={styles.centeredIconContainer}>
                  <View style={styles.centeredIcon}>
                    <Image source={require('../assets/images/Logo.png')} style={styles.logoImage} />
                  </View>
                </View>
              </View>
            </View>
            
            <Text style={styles.heroDescription}>
              Hello Admin! - Manage your agricultural system efficiently
            </Text>
            

            {/* Admin Tools Section */}
            <View style={styles.toolsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Admin Tools</Text>
                <Text style={styles.sectionSubtitle}>Manage your agricultural system</Text>
              </View>
              
              {/* Top Row - Announcements (Wide Horizontal) */}
                <TouchableOpacity 
                style={styles.wideToolCard}
                  onPress={() => setActiveNav('announcements')}
                >
                <View style={styles.horizontalIconContainer}>
                  <Ionicons name="megaphone" size={24} color={GREEN} />
                  </View>
                <View style={styles.horizontalTextContainer}>
                  <Text style={styles.horizontalToolTitle}>Announcements</Text>
                  <Text style={styles.horizontalToolDescription}>Send announcements to farmers</Text>
                </View>
                </TouchableOpacity>
                
              {/* Messages */}
                <TouchableOpacity 
                style={styles.wideToolCard}
                  onPress={() => setActiveNav('messages')}
                >
                <View style={styles.horizontalIconContainer}>
                  <Ionicons name="chatbubbles" size={24} color={GREEN} />
                  </View>
                <View style={styles.horizontalTextContainer}>
                  <Text style={styles.horizontalToolTitle}>Messages</Text>
                  <Text style={styles.horizontalToolDescription}>Communicate with farmers</Text>
              </View>
              </TouchableOpacity>
              
              {/* User Management */}
                <TouchableOpacity 
                style={styles.wideToolCard}
                  onPress={() => setActiveNav('user-management')}
                >
                <View style={styles.horizontalIconContainer}>
                  <Ionicons name="people" size={24} color={GREEN} />
                  </View>
                <View style={styles.horizontalTextContainer}>
                  <Text style={styles.horizontalToolTitle}>User Management</Text>
                  <Text style={styles.horizontalToolDescription}>Manage users, block, and delete accounts</Text>
              </View>
              </TouchableOpacity>
              
              {/* Farmers Records */}
                <TouchableOpacity 
                style={styles.wideToolCard}
                onPress={() => setActiveNav('farmers-records')}
                >
                <View style={styles.horizontalIconContainer}>
                  <Ionicons name="people" size={24} color={GREEN} />
                  </View>
                <View style={styles.horizontalTextContainer}>
                  <Text style={styles.horizontalToolTitle}>Farmers Records</Text>
                  <Text style={styles.horizontalToolDescription}>View and manage farmer profiles</Text>
                </View>
                </TouchableOpacity>
                
              {/* Planting Records */}
                <TouchableOpacity 
                style={styles.wideToolCard}
                onPress={() => setActiveNav('planting-records')}
                >
                <View style={styles.horizontalIconContainer}>
                  <Ionicons name="leaf" size={24} color={GREEN} />
                  </View>
                <View style={styles.horizontalTextContainer}>
                  <Text style={styles.horizontalToolTitle}>Planting Records</Text>
                  <Text style={styles.horizontalToolDescription}>View and manage planting data</Text>
              </View>
              </TouchableOpacity>
              
              {/* Harvest Records */}
                <TouchableOpacity 
                style={styles.wideToolCard}
                onPress={() => setActiveNav('harvest-records')}
                >
                <View style={styles.horizontalIconContainer}>
                  <Ionicons name="basket" size={24} color={GREEN} />
                  </View>
                <View style={styles.horizontalTextContainer}>
                  <Text style={styles.horizontalToolTitle}>Harvest Records</Text>
                  <Text style={styles.horizontalToolDescription}>View and manage harvest data</Text>
                </View>
                </TouchableOpacity>


            </View>

          </View>
        </ScrollView>
        </>
      )}

      {activeNav === 'price-monitoring' && (
        <View style={styles.adminPriceMonitoringContainer}>
          <PriceMonitoringList 
            commodities={priceCommodities} 
            loading={loadingPrices}
            showViewAllButton={true}
            onViewAllPress={() => {
              setShowDownloadModal(true);
              // Select all by default
              setSelectedCommodities(new Set(priceCommodities.map(c => c.name)));
            }}
            onUploadPress={() => {
              setShowUploadModal(true);
            }}
          />
        </View>
      )}

      {activeNav === 'price-monitoring-old' && (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Price Monitoring (Old)</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={styles.sectionSubtitle}>Manage agricultural price data</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by item name or section..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Price List */}
            {dailyPriceData ? (
              <View style={styles.priceListContainer}>
                <View style={styles.priceListHeader}>
                  <Text style={styles.priceListTitle}>
                    Agricultural Price Data ({filteredDailyPriceItems.length} records)
                  </Text>
                  <Text style={styles.priceListSubtitle}>
                    Use search to filter data
                  </Text>
                </View>
                
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Commodity</Text>
                  <Text style={styles.tableHeaderText}>Specification</Text>
                  <Text style={styles.tableHeaderText}>Average Price</Text>
                  <Text style={styles.tableHeaderText}>Date</Text>
                </View>
                
                <View style={styles.priceItemsContainer}>
                  {filteredDailyPriceItems.map((item: any, index: number) => (
                    <View key={index} style={styles.priceItemCard}>
                      <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{item.commodity || 'N/A'}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{item.specification || 'N/A'}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        {item.average ? (
                          <Text style={styles.priceValue}>₱{item.average.toFixed(2)}</Text>
                        ) : (
                          <Text style={styles.priceNA}>N/A</Text>
                        )}
                      </View>
                      <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{item.date || 'N/A'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="document-text-outline" size={64} color="#ccc" />
                <Text style={styles.noDataTitle}>No Price Data Available</Text>
                <Text style={styles.noDataText}>
                  Upload a government PDF file to automatically convert it to price data
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {activeNav === 'search' && (
        <View style={styles.searchPageContainer}>
          {/* Header */}
          <View style={styles.searchPageHeader}>
            <TouchableOpacity 
              style={[styles.backButton, styles.searchPageBackButton]}
              onPress={() => setActiveNav('home')}
            >
              <Ionicons name="arrow-back" size={24} color={GREEN} />
            </TouchableOpacity>
            <Text style={styles.searchPageTitle}>Search</Text>
          </View>
          
          <ScrollView 
            style={styles.searchPageScrollView}
            contentContainerStyle={styles.searchPageScrollContent}
            showsVerticalScrollIndicator={false}
          >
            
            {/* Search Bar */}
            <View style={styles.searchPageSearchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchPageSearchIcon} />
              <TextInput
                style={styles.searchPageSearchInput}
                placeholder="Search features..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchPageClearButton}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Content */}
            <View style={styles.searchPageContent}>
              {searchQuery.length === 0 ? (
                <View style={styles.searchPageAllFeatures}>
                  <Text style={styles.searchPageAllFeaturesTitle}>All Features</Text>
                  
                  {searchData.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchPageFeatureItem}
                      onPress={() => handleSearchResultPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchPageFeatureIcon}>
                        <Ionicons name={item.icon as any} size={24} color={GREEN} />
                      </View>
                      <View style={styles.searchPageFeatureContent}>
                        <Text style={styles.searchPageFeatureTitle}>{item.title}</Text>
                        <Text style={styles.searchPageFeatureDescription}>{item.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : searchResults.length > 0 ? (
                <View style={styles.searchPageResults}>
                  <Text style={styles.searchPageResultsTitle}>Search Results</Text>
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchPageFeatureItem}
                      onPress={() => handleSearchResultPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchPageFeatureIcon}>
                        <Ionicons name={item.icon as any} size={24} color={GREEN} />
                      </View>
                      <View style={styles.searchPageFeatureContent}>
                        <Text style={styles.searchPageFeatureTitle}>{item.title}</Text>
                        <Text style={styles.searchPageFeatureDescription}>{item.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.searchPageNoResults}>
                  <Ionicons name="search" size={60} color="#ccc" />
                  <Text style={styles.searchPageNoResultsTitle}>No results found</Text>
                  <Text style={styles.searchPageNoResultsDescription}>
                    No features match "{searchQuery}"
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {activeNav === 'announcements' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={adminRefreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Announcements</Text>
              <View style={{ width: 24 }} />
            </View>
            
            {/* New Announcement Button */}
            <View style={styles.newMessageContainer}>
              <TouchableOpacity 
                style={styles.newMessageButton}
                onPress={() => setShowCreateAnnouncement(true)}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.newMessageButtonText}>Create New Announcement</Text>
              </TouchableOpacity>
            </View>
            
            {/* Announcements List Section */}
            <View style={styles.inboxContainer}>
              <View style={styles.inboxHeader}>
                <Text style={styles.inboxTitle}>Announcements</Text>
              </View>
              
              {announcementLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading announcements...</Text>
                </View>
              ) : announcements.length > 0 ? (
                <View style={styles.contactListContainer}>
                  {announcements.map((announcement: any) => (
              <TouchableOpacity 
                      key={announcement.id} 
                      style={styles.contactItem}
                      onPress={() => {
                        setSelectedAnnouncement(announcement);
                        setShowViewAnnouncements(true);
                      }}
                    >
                      <View style={styles.contactAvatar}>
                        <Ionicons name="megaphone" size={24} color="#fff" />
                      </View>
                      <View style={styles.contactInfo}>
                        <View style={styles.contactHeader}>
                          <Text style={styles.contactName}>{announcement.title || 'Untitled Announcement'}</Text>
                          <Text style={styles.contactTime}>
                            {announcement.date || announcement.createdAt ? 
                              (() => {
                                try {
                                  const dateValue = announcement.date || announcement.createdAt;
                                  console.log('🔍 Date value:', dateValue, 'Type:', typeof dateValue);
                                  const parsedDate = new Date(dateValue);
                                  console.log('🔍 Parsed date:', parsedDate, 'Is valid:', !isNaN(parsedDate.getTime()));
                                  return isNaN(parsedDate.getTime()) ? 
                                    dateValue : // Show raw value if parsing fails
                                    parsedDate.toLocaleDateString();
                                } catch (error) {
                                  console.log('🔍 Date parsing error:', error);
                                  return announcement.date || announcement.createdAt || 'Unknown Date';
                                }
                              })() : 
                              'Unknown Date'
                            }
                          </Text>
                        </View>
                        <Text style={styles.contactLastMessage} numberOfLines={1}>
                          {announcement.content || 'No content available'}
                        </Text>
                      </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="megaphone" size={64} color="#ccc" />
                  <Text style={styles.placeholderTitle}>No Announcements</Text>
                  <Text style={styles.placeholderDescription}>
                    No announcements have been created yet.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {activeNav === 'messages' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={adminRefreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Messages</Text>
              <View style={{ width: 24 }} />
            </View>
            
            {/* New Message Button */}
            <View style={styles.newMessageContainer}>
              <TouchableOpacity 
                style={styles.newMessageButton}
                onPress={() => {
                  fetchUsers();
                  setShowUserList(true);
                }}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.newMessageButtonText}>New Message</Text>
              </TouchableOpacity>
            </View>
            
            {/* Inbox Section */}
            <View style={styles.inboxContainer}>
              <View style={styles.inboxHeader}>
                <Text style={styles.inboxTitle}>Messages</Text>
              </View>
              
              {loadingMessages ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
              ) : adminMessages.length > 0 ? (
                <View style={styles.contactListContainer}>
                  {groupMessagesByContact(adminMessages, usersDirectory).map((contact) => (
                    <TouchableOpacity 
                      key={contact.id} 
                      style={styles.contactItem}
                      onPress={() => openChat(contact)}
                    >
                      <View style={styles.contactAvatar}>
                        {contact.userCropEmoji ? (
                          <Text style={styles.adminContactCropEmoji}>{contact.userCropEmoji}</Text>
                        ) : (
                        <Ionicons name="person" size={24} color="#fff" />
                        )}
                      </View>
                      <View style={styles.contactInfo}>
                        <View style={styles.contactHeader}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactTime}>
                            {contact.lastMessage?.createdAt ? 
                              new Date(contact.lastMessage.createdAt).toLocaleDateString() : 
                              'Unknown'
                            }
                          </Text>
                        </View>
                        <Text style={styles.contactLastMessage} numberOfLines={1}>
                          {contact.lastMessage?.content || 'No messages'}
                        </Text>
                      </View>
                      {contact.unreadCount > 0 && (
                        <View style={styles.contactUnreadBadge}>
                          <Text style={styles.contactUnreadCount}>{contact.unreadCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyInboxContainer}>
                  <Ionicons name="mail-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyInboxTitle}>No Messages Yet</Text>
                  <Text style={styles.emptyInboxText}>
                    When farmers send you messages, they will appear here. Start a conversation by creating a new message.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {activeNav === 'user-management' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loadingUserManagement}
              onRefresh={loadUserManagementUsers}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>User Management</Text>
              <TouchableOpacity 
                style={styles.duplicateCheckButton}
                onPress={checkDuplicateEmails}
              >
                <Ionicons name="warning" size={20} color="#f39c12" />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.userSearchContainer}>
              <View style={styles.userSearchInputContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.userSearchIcon} />
                <TextInput
                  style={styles.userSearchInput}
                  placeholder="Search users by name, email, role, or location..."
                  value={userManagementSearchQuery}
                  onChangeText={handleUserManagementSearch}
                  placeholderTextColor="#999"
                />
                {userManagementSearchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => handleUserManagementSearch('')}
                    style={styles.userClearSearchButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* User Statistics */}
            <View style={styles.userStatsContainer}>
              <View style={styles.userStatCard}>
                <Text style={styles.userStatNumber}>{filteredUserManagementUsers.length}</Text>
                <Text style={styles.userStatLabel}>Total Users</Text>
              </View>
              <View style={styles.userStatCard}>
                <Text style={styles.userStatNumber}>
                  {filteredUserManagementUsers.filter(u => userActivityStatus[u.id] === 'active').length}
                </Text>
                <Text style={styles.userStatLabel}>Active</Text>
              </View>
              <View style={styles.userStatCard}>
                <Text style={styles.userStatNumber}>
                  {filteredUserManagementUsers.filter(u => u.isBlocked).length}
                </Text>
                <Text style={styles.userStatLabel}>Blocked</Text>
              </View>
            </View>

            {/* Activity Legend */}
            <View style={styles.activityLegendContainer}>
              <Text style={styles.activityLegendTitle}>Activity Status</Text>
              <View style={styles.activityLegendItems}>
                <View style={styles.activityLegendItem}>
                  <View style={[styles.activityDot, styles.activeDot]} />
                  <Text style={styles.activityLegendText}>Active (reports this month)</Text>
                </View>
                <View style={styles.activityLegendItem}>
                  <View style={[styles.activityDot, styles.inactiveDot]} />
                  <Text style={styles.activityLegendText}>Inactive (old reports)</Text>
                </View>
                <View style={styles.activityLegendItem}>
                  <View style={[styles.activityDot, styles.noReportsDot]} />
                  <Text style={styles.activityLegendText}>No reports / Limited access</Text>
                </View>
              </View>
              <Text style={styles.activityLegendNote}>
                Note: Activity status may be limited due to database permissions
              </Text>
            </View>

            {/* Users List */}
            <View style={styles.userManagementListContainer}>
              {loadingUserManagement ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : filteredUserManagementUsers.length > 0 ? (
                filteredUserManagementUsers.map((user, index) => {
                  // Check if this email is duplicated
                  const isDuplicate = userManagementUsers.filter(u => u.email === user.email && u.email !== 'No email').length > 1;
                  
                  return (
                  <View key={user.id || index} style={[
                    styles.userManagementItem,
                    user.isBlocked && styles.blockedUserItem,
                    isDuplicate && styles.duplicateUserItem
                  ]}>
                    <View style={styles.userManagementItemHeader}>
                      <View style={styles.userManagementAvatarContainer}>
                        <View style={styles.userManagementAvatar}>
                          {user.userCropEmoji ? (
                            <Text style={styles.userManagementCropEmoji}>{user.userCropEmoji}</Text>
                          ) : (
                            <Ionicons name="person" size={24} color="#fff" />
                          )}
                        </View>
                        {/* Activity Status Dot */}
                        <View style={[
                          styles.activityStatusDot,
                          userActivityStatus[user.id] === 'active' && styles.activeStatusDot,
                          userActivityStatus[user.id] === 'inactive' && styles.inactiveStatusDot,
                          userActivityStatus[user.id] === 'no-reports' && styles.noReportsStatusDot
                        ]} />
                      </View>
                      <View style={styles.userManagementItemContent}>
                        <View style={styles.userManagementNameRow}>
                          <Text style={styles.userManagementName}>{user.displayName}</Text>
                          {user.isBlocked && (
                            <View style={styles.blockedBadge}>
                              <Text style={styles.blockedBadgeText}>BLOCKED</Text>
                            </View>
                          )}
                          {isDuplicate && (
                            <View style={styles.duplicateBadge}>
                              <Text style={styles.duplicateBadgeText}>DUPLICATE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userManagementEmail}>{user.email}</Text>
                        <Text style={styles.userManagementDetails}>
                          {user.role} • {user.barangay ? user.barangay : user.location}
                        </Text>
                        {user.createdAt && (
                          <Text style={styles.userManagementDate}>
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Action Buttons */}
                    <View style={styles.userManagementActions}>
                      <TouchableOpacity 
                        style={[
                          styles.userManagementActionButton,
                          user.isBlocked ? styles.unblockButton : styles.blockButton
                        ]}
                        onPress={() => toggleUserBlock(user.id, user.isBlocked)}
                      >
                        <Ionicons 
                          name={user.isBlocked ? "checkmark-circle" : "ban"} 
                          size={16} 
                          color="#fff" 
                        />
                        <Text style={styles.userManagementActionText}>
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.userManagementActionButton}
                        onPress={() => deleteUser(user.id, user.displayName)}
                      >
                        <Ionicons name="trash" size={16} color="#fff" />
                        <Text style={styles.userManagementActionText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  );
                })
              ) : (
                <View style={styles.noAnnouncementsContainer}>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={styles.noAnnouncementsTitle}>
                    {userManagementSearchQuery ? 'No Users Found' : 'No Users Available'}
                  </Text>
                  <Text style={styles.noAnnouncementsText}>
                    {userManagementSearchQuery 
                      ? `No users match "${userManagementSearchQuery}". Try a different search term.`
                      : 'No users are currently registered in the system.'
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {activeNav === 'settings' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={adminRefreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={{ width: 24 }} />
            </View>
            
              {/* Admin Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                {profile.selectedCropEmoji ? (
                  <Text style={styles.adminProfileCropEmoji}>{profile.selectedCropEmoji}</Text>
                ) : (
                <Ionicons name="person" size={50} color={GREEN} />
                )}
                </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Admin</Text>
                <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                <Text style={styles.profileRole}>Administrator</Text>
              </View>
              </View>

              {/* Settings Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsTitle}>Settings & Preferences</Text>
                

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/privacy')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="shield-checkmark" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Privacy & Security</Text>
                    <Text style={styles.settingDescription}>Account security settings</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/language')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="language" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingDescription}>English (US)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/help')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="help-circle" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Help & Support</Text>
                    <Text style={styles.settingDescription}>Get assistance</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/about')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="information-circle" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>About</Text>
                    <Text style={styles.settingDescription}>App version & info</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={async () => {
                    // Reset selection so Deploy/Undeploy are hidden
                    setSelectedUpdateId(null);
                    await loadAppUpdates();
                    setShowAppUpdateModal(true);
                  }}
                >
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="cloud-download" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>App Updates</Text>
                    <Text style={styles.settingDescription}>
                      Manage version links and force-update notice
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="log-out" size={24} color="#e74c3c" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Sign Out</Text>
                  <Text style={styles.settingDescription}>Logout from your account</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {activeNav === 'planting-records' && !showUserReports && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={adminRefreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Planting Records</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={styles.sectionDescription}>
              Reports grouped by farmer account
            </Text>

            {/* View Records Button */}
            <TouchableOpacity 
              style={styles.viewRecordsButton}
              onPress={() => {
                setReportType('planting');
                setShowUserReports(true);
                setSelectedUserAccount(null);
              }}
            >
              <Ionicons name="list" size={24} color="#2E7D32" />
              <Text style={styles.viewRecordsButtonTitle}>View Records</Text>
              <Text style={styles.viewRecordsButtonSubtitle}>View your submitted planting reports</Text>
            </TouchableOpacity>

            {/* Global Planting Trends */}
            <View style={styles.globalTrendsCard}>
              <View style={styles.globalTrendsHeader}>
                <Text style={styles.globalTrendsTitle}>🌍 Lopez Planting Trends</Text>
              </View>

              {globalLoading ? (
                <View style={styles.analyticsLoadingContainer}>
                  <Text style={styles.analyticsLoadingText}>Loading analytics...</Text>
                </View>
              ) : (
                <>
                  {/* Global Crop Distribution */}
                  <View style={styles.barChartContainer}>
                    <Text style={styles.barChartTitle}>Lopez Crop Distribution</Text>
                    
                    {/* Month Navigation */}
                    <View style={styles.monthNavigationContainer}>
                      <TouchableOpacity 
                        style={styles.monthNavButton}
                        onPress={() => {
                          const newMonth = new Date(selectedMonth);
                          newMonth.setMonth(newMonth.getMonth() - 1);
                          setSelectedMonth(newMonth);
                          loadGlobalAnalytics();
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color="#2E7D32" />
                      </TouchableOpacity>
                      
                      <Text style={styles.monthDisplay}>
                        {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Text>
                      
                      <TouchableOpacity 
                        style={styles.monthNavButton}
                        onPress={() => {
                          const newMonth = new Date(selectedMonth);
                          newMonth.setMonth(newMonth.getMonth() + 1);
                          setSelectedMonth(newMonth);
                          loadGlobalAnalytics();
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#2E7D32" />
                      </TouchableOpacity>
                    </View>
                    
                    {!hasDataForMonth(selectedMonth) ? (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No data available for {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                        <Text style={styles.noDataSubtext}>No planting records found for this month</Text>
                      </View>
                    ) : (
                      <View style={styles.horizontalBarChartWrapper}>
                        {globalAnalytics?.cropDistribution
                          .sort((a, b) => b.count - a.count) // Sort by plant count (total plants)
                          .slice(0, 10).map((item: any, index: number) => {
                          const rank = index + 1;
                          const maxValue = Math.max(...globalAnalytics.cropDistribution.map((c: any) => c.count));
                          const barWidth = (item.count / maxValue) * 100;
                          
                          return (
                            <View key={item.crop} style={[
                              styles.horizontalBarItem,
                              rank === 1 && styles.horizontalBarItemFirst,
                              rank === 2 && styles.horizontalBarItemSecond,
                              rank === 3 && styles.horizontalBarItemThird
                            ]}>
                              <View style={[
                                styles.horizontalBarSideNumber,
                                rank === 1 && styles.horizontalBarSideNumberFirst,
                                rank === 2 && styles.horizontalBarSideNumberSecond,
                                rank === 3 && styles.horizontalBarSideNumberThird
                              ]}>
                                <Text style={[
                                  styles.horizontalBarSideNumberText,
                                  rank === 1 && styles.horizontalBarSideNumberTextFirst,
                                  rank === 2 && styles.horizontalBarSideNumberTextSecond,
                                  rank === 3 && styles.horizontalBarSideNumberTextThird
                                ]}>
                                  {rank}
                                </Text>
                              </View>
                              
                              <View style={styles.horizontalBarLabelContainer}>
                                <View style={styles.rankContainer}>
                                  <View style={[
                                    styles.horizontalBarRankWrapper,
                                    rank === 1 && styles.horizontalBarRankFirst,
                                    rank === 2 && styles.horizontalBarRankSecond,
                                    rank === 3 && styles.horizontalBarRankThird
                                  ]}>
                                    <Text style={[
                                      styles.horizontalBarRank,
                                      rank === 1 && styles.horizontalBarRankFirst,
                                      rank === 2 && styles.horizontalBarRankSecond,
                                      rank === 3 && styles.horizontalBarRankThird
                                    ]}>
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                    </Text>
                                  </View>
                                </View>
                                
                                <View style={styles.cropInfoContainer}>
                                  <View style={styles.cropNameRow}>
                                    <Text style={styles.cropIcon}>{getCropIcon(item.crop)}</Text>
                                    <Text style={styles.horizontalBarCropName} numberOfLines={1}>{item.crop}</Text>
                                    <Text style={styles.cropTagalogName} numberOfLines={1}> / {getCropTagalogName(item.crop)}</Text>
                                  </View>
                                </View>
                                
                                <View style={styles.percentageContainer}>
                                  <Text style={styles.horizontalBarPercentageText}>
                                    {item.percentage}%
                                  </Text>
                                </View>
                              </View>
                              
                                <View style={styles.horizontalBarContainer}>
                                  <View style={[
                                    styles.horizontalBar, 
                                    { 
                                      width: `${barWidth}%`,
                                      backgroundColor: '#81C784'
                                    }
                                  ]}>
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
                    )}
                  </View>

                  {/* Notes */}
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>
                      Total: {globalAnalytics?.totalPlants.toLocaleString()} plants across all farmers
                    </Text>
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
                    <Text style={styles.farmersGrowingTitle}>Farmers Growing Each Crop</Text>
                    
                    {!hasDataForMonth(selectedMonth) ? (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No data available for {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                        <Text style={styles.noDataSubtext}>No planting records found for this month</Text>
                      </View>
                    ) : (
                      <View style={styles.horizontalBarChartWrapper}>
                        {globalAnalytics?.cropDistribution
                          .sort((a, b) => b.userCount - a.userCount) // Sort by farmer count
                          .slice(0, 10).map((item: any, index: number) => {
                          const rank = index + 1;
                          const maxUsers = Math.max(...globalAnalytics.cropDistribution.map(crop => crop.userCount));
                          const barWidth = maxUsers > 0 ? (item.userCount / maxUsers) * 100 : 0;
                          
                          return (
                            <View key={item.crop} style={[
                              styles.horizontalBarItem,
                              rank === 1 && styles.horizontalBarItemFirst,
                              rank === 2 && styles.horizontalBarItemSecond,
                              rank === 3 && styles.horizontalBarItemThird
                            ]}>
                              <View style={[
                                styles.horizontalBarSideNumber,
                                rank === 1 && styles.horizontalBarSideNumberFirst,
                                rank === 2 && styles.horizontalBarSideNumberSecond,
                                rank === 3 && styles.horizontalBarSideNumberThird
                              ]}>
                                <Text style={styles.horizontalBarSideNumberText}>
                                  {rank}
                                </Text>
                              </View>
                              
                              <View style={styles.horizontalBarLabelContainer}>
                                <View style={styles.rankContainer}>
                                  <View style={[
                                    styles.horizontalBarRankWrapper,
                                    rank === 1 && styles.horizontalBarRankFirst,
                                    rank === 2 && styles.horizontalBarRankSecond,
                                    rank === 3 && styles.horizontalBarRankThird
                                  ]}>
                                    <Text style={[
                                      styles.horizontalBarRank,
                                      rank === 1 && styles.horizontalBarRankFirst,
                                      rank === 2 && styles.horizontalBarRankSecond,
                                      rank === 3 && styles.horizontalBarRankThird
                                    ]}>
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                    </Text>
                                  </View>
                                </View>
                                
                                <View style={styles.cropInfoContainer}>
                                  <View style={styles.cropNameRow}>
                                    <Text style={styles.cropIcon}>{getCropIcon(item.crop)}</Text>
                                    <Text style={styles.horizontalBarCropName} numberOfLines={1}>{item.crop}</Text>
                                    <Text style={styles.cropTagalogName} numberOfLines={1}> / {getCropTagalogName(item.crop)}</Text>
                                  </View>
                                </View>
                                
                                <View style={styles.percentageContainer}>
                                  <Text style={styles.horizontalBarPercentageText}>
                                    {item.userCount} farmer{item.userCount !== 1 ? 's' : ''}
                                  </Text>
                                </View>
                              </View>
                              
                              <View style={styles.horizontalBarContainer}>
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
                    )}
                  </View>

                  {/* Notes */}
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>
                      Number of different farmers growing each crop type
                    </Text>
                  </View>

                  {/* Comparison Section - Always show if there's any data (current, previous month, or previous year) */}
                  {globalAnalytics?.cropDistribution.some((item: any) => 
                    item.count > 0 || 
                    item.previousYearTotal > 0 || 
                    item.previousMonthTotal > 0
                  ) && (
                    <View style={styles.comparisonSection}>
                      <Text style={styles.comparisonSectionTitle}>📊 Planting Comparison Analysis</Text>
                      {globalAnalytics.cropDistribution
                        .filter((item: any) => 
                          item.count > 0 || 
                          item.previousYearTotal > 0 || 
                          item.previousMonthTotal > 0
                        )
                        .sort((a: any, b: any) => {
                          // Sort by: current count first, then previous month, then previous year
                          const aMax = Math.max(a.count, a.previousMonthTotal, a.previousYearTotal);
                          const bMax = Math.max(b.count, b.previousMonthTotal, b.previousYearTotal);
                          return bMax - aMax;
                        })
                        .map((item: any) => (
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

                </>
              )}
            </View>

            {/* Summary Cards - Outside Global Trends */}
            {globalAnalytics && (
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
            )}

                        </View>
        </ScrollView>
      )}

      {/* All Planting Records View - Grouped by User */}
      {activeNav === 'planting-records' && showUserReports && !selectedUserAccount && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowUserReports(false)}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>All Planting Records</Text>
              <View style={{ width: 24 }} />
                      </View>
                      
            <Text style={styles.sectionDescription}>
              All planting reports grouped by farmer
            </Text>

            {loadingRecords ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading planting records...</Text>
              </View>
            ) : groupedPlantingRecords.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="leaf-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No planting records found</Text>
              </View>
            ) : (
              <View style={styles.messagesList}>
                {groupedPlantingRecords.map((userGroup, index) => (
                  <TouchableOpacity 
                    key={userGroup.userId} 
                    style={[
                      styles.messageCard,
                      userGroup.unreadCount > 0 && styles.messageCardUnread
                    ]}
                    onPress={() => {
                      setSelectedUserAccount(userGroup);
                      setReportType('planting');
                      setShowUserReports(true);
                      markReportsAsRead(userGroup.userId, 'planting');
                    }}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.userInfo}>
                        <View style={styles.messageUserAvatar}>
                          {userGroup.userCropEmoji ? (
                            <Text style={styles.adminMessageCropEmoji}>{userGroup.userCropEmoji}</Text>
                          ) : (
                          <Ionicons name="person" size={20} color={GREEN} />
                          )}
                        </View>
                        <View style={styles.userDetails}>
                          <Text style={styles.userName}>{userGroup.userName}</Text>
                          <Text style={styles.userEmail}>{userGroup.userEmail}</Text>
                        </View>
                      </View>
                      <View style={styles.messageMetaInfo}>
                        {userGroup.unreadCount > 0 && (
                          <View style={styles.messageUnreadBadge}>
                            <Text style={styles.unreadCount}>{userGroup.unreadCount}</Text>
                          </View>
                        )}
                        <Text style={styles.messageTimeText}>
                          {userGroup.latestReportDate?.toLocaleDateString() || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.messagePreviewContainer}>
                      <Text style={styles.messagePreviewText}>
                        {userGroup.reports.length} report{userGroup.reports.length !== 1 ? 's' : ''}
                        {userGroup.unreadCount > 0 && ` • ${userGroup.unreadCount} unread`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Individual User Reports View */}
      {activeNav === 'planting-records' && showUserReports && selectedUserAccount && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  setSelectedUserAccount(null);
                  setShowUserReports(false);
                }}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>{selectedUserAccount?.userName}'s Reports</Text>
              <View style={{ width: 24 }} />
                      </View>
                      
            <Text style={styles.sectionDescription}>
              {reportType === 'planting' ? 'Planting' : 'Harvest'} reports from {selectedUserAccount?.userEmail}
            </Text>

            {selectedUserAccount && (
                      <View style={styles.userReportsList}>
                {selectedUserAccount.reports.map((report: any, index: number) => (
                  <TouchableOpacity 
                    key={report.id} 
                    style={[
                      styles.reportCard,
                      !report.read && styles.reportCardUnread
                    ]}
                    onPress={() => openReportDetail(report)}
                  >
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportCrop}>{report.crop}</Text>
                                <View style={[
                                  styles.statusBadge,
                        report.read ? styles.statusRead : styles.statusUnread
                                ]}>
                        <Text style={styles.statusText}>{report.read ? 'READ' : 'UNREAD'}</Text>
                                </View>
                                  </View>
                    <View style={styles.reportDetailsContainer}>
                              <Ionicons name="resize" size={16} color="#666" />
                      <Text style={styles.reportDetails}>
                        Area Planted: {report.areaPlanted} {report.areaType}
                        {report.customAreaType && ` (${report.customAreaType})`}
                              </Text>
                            </View>
                    {report.expectedHarvestDate && (
                      <View style={styles.reportDetailsContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.reportDetails}>
                          Expected Harvest: {report.expectedHarvestDate}
                        </Text>
                      </View>
                    )}
                    {report.plantCount && (
                      <View style={styles.reportDetailsContainer}>
                        <Ionicons name="leaf-outline" size={16} color="#666" />
                        <Text style={styles.reportDetails}>
                          Plants/Seeds: {report.plantCount}
                        </Text>
                      </View>
                    )}
                    {report.expectedHarvest && (
                      <View style={styles.reportDetailsContainer}>
                        <Ionicons name="basket-outline" size={16} color="#666" />
                        <Text style={styles.reportDetails}>
                          Expected Yield: {report.expectedHarvest} kg
                        </Text>
                      </View>
                    )}
                    <View style={styles.reportDateContainer}>
                              <Ionicons name="calendar" size={16} color="#999" />
                      <Text style={styles.reportDate}>
                        Submitted: {report.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                              </Text>
                      {!report.read && (
                        <View style={styles.readIndicator}>
                          <Text style={styles.readIndicatorText}>NEW</Text>
                            </View>
                      )}
                          </View>
                    <View style={styles.reportTapHint}>
                      <Text style={styles.reportTapHintText}>Tap to view details</Text>
                      <Ionicons name="chevron-forward" size={16} color="#999" />
                    </View>
                  </TouchableOpacity>
                        ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {activeNav === 'harvest-records' && !showUserReports && !showAllHarvestEntries && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={adminRefreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>All Harvest Records</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={styles.sectionDescription}>
              All harvest reports from all farmers
            </Text>

            {/* View Records Button */}
            <TouchableOpacity 
              style={styles.viewRecordsButton}
              onPress={() => {
                setReportType('harvest');
                setShowUserReports(true);
                setShowAllHarvestEntries(false);
                setSelectedUserAccount(null);
              }}
            >
              <Ionicons name="list" size={24} color="#2E7D32" />
              <Text style={styles.viewRecordsButtonTitle}>View Records</Text>
              <Text style={styles.viewRecordsButtonSubtitle}>Review harvest reports by farmer</Text>
            </TouchableOpacity>

            {/* Global Harvest Trends Section */}
            <View style={styles.globalTrendsCard}>
              <View style={styles.globalTrendsHeader}>
                <Text style={styles.globalTrendsTitle}>🌍 Lopez Harvest Trends</Text>
              </View>

              {/* Loading State */}
              {globalHarvestLoading ? (
                <View style={styles.analyticsLoadingContainer}>
                  <ActivityIndicator size="large" color={GREEN} />
                  <Text style={styles.analyticsLoadingText}>Loading global trends...</Text>
                </View>
              ) : (
                <>
                  {/* Horizontal Bar Chart with Rankings */}
                  <View style={styles.barChartContainer}>
                    <Text style={styles.barChartTitle}>Lopez Harvest Distribution</Text>
                    
                    {/* Month Navigation */}
                    <View style={styles.monthNavigationContainer}>
                      <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={async () => {
                          const newDate = new Date(selectedHarvestMonth);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setSelectedHarvestMonth(newDate);
                          await loadGlobalHarvestAnalytics(newDate);
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={GREEN} />
                      </TouchableOpacity>
                      
                      <Text style={styles.monthDisplay}>
                        {selectedHarvestMonth.toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </Text>
                  
                      <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={async () => {
                          const newDate = new Date(selectedHarvestMonth);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setSelectedHarvestMonth(newDate);
                          await loadGlobalHarvestAnalytics(newDate);
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={GREEN} />
                      </TouchableOpacity>
                    </View>
                    
                    {hasHarvestDataForMonth(selectedHarvestMonth) && globalHarvestAnalytics ? (
                      <>
                        <View style={styles.horizontalBarChartWrapper}>
                          {globalHarvestAnalytics.cropDistribution.map((item: any, index: number) => {
                            const rank = index + 1;
                            const maxValue = Math.max(...globalHarvestAnalytics.cropDistribution.map((crop: any) => crop.totalHarvest));
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
                          <Text style={styles.notesText}>Total: {globalHarvestAnalytics.totalHarvested.toFixed(1)} kg harvested across all farmers</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Ionicons name="leaf-outline" size={48} color="#ccc" />
                        <Text style={styles.noDataText}>No harvest data for {selectedHarvestMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
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
                    
                    {globalHarvestAnalytics && globalHarvestAnalytics.cropDistribution.length > 0 ? (
                      <View style={styles.horizontalBarChartWrapper}>
                        {globalHarvestAnalytics.cropDistribution
                          .sort((a: any, b: any) => b.userCount - a.userCount)
                          .map((item: any, index: number) => {
                            const rank = index + 1;
                            const maxValue = Math.max(...globalHarvestAnalytics.cropDistribution.map((crop: any) => crop.userCount));
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

                  {/* Comparison Section - Always show if there's any data (current, previous month, or previous year) */}
                  {globalHarvestAnalytics && globalHarvestAnalytics.cropDistribution.some((item: any) => 
                    item.totalHarvest > 0 || 
                    item.previousYearTotal > 0 || 
                    item.previousMonthTotal > 0
                  ) && (
                    <View style={styles.comparisonSection}>
                      <Text style={styles.comparisonSectionTitle}>📊 Harvest Comparison Analysis</Text>
                      {globalHarvestAnalytics.cropDistribution
                        .filter((item: any) => 
                          item.totalHarvest > 0 || 
                          item.previousYearTotal > 0 || 
                          item.previousMonthTotal > 0
                        )
                        .sort((a: any, b: any) => {
                          // Sort by: current harvest first, then previous month, then previous year
                          const aMax = Math.max(a.totalHarvest, a.previousMonthTotal, a.previousYearTotal);
                          const bMax = Math.max(b.totalHarvest, b.previousMonthTotal, b.previousYearTotal);
                          return bMax - aMax;
                        })
                        .map((item: any) => (
                        <View key={item.crop} style={styles.comparisonItemCard}>
                          <View style={styles.comparisonItemHeader}>
                            <Text style={styles.comparisonCropIcon}>{getCropIcon(item.crop)}</Text>
                            <Text style={styles.comparisonCropName}>{item.crop}</Text>
                          </View>
                          <View style={styles.comparisonItemContent}>
                            {/* Current Month */}
                            <View style={styles.comparisonDataRow}>
                              <Text style={styles.comparisonPeriodLabel}>Current Month:</Text>
                              {item.totalHarvest > 0 ? (
                                <View style={styles.comparisonDataValueContainer}>
                                  <Text style={styles.comparisonDataValue}>{item.totalHarvest.toFixed(1)} kg</Text>
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
                                  {item.totalHarvest > 0 && (
                                    <Text style={[
                                      styles.comparisonChangeIndicator,
                                      item.previousYearChange >= 0 ? styles.comparisonPositive : styles.comparisonNegative
                                    ]}>
                                      {item.previousYearChange >= 0 ? '↑' : '↓'} {Math.abs(item.previousYearChange).toFixed(1)}%
                                    </Text>
                                  )}
                                  <Text style={styles.comparisonDataValue}>{item.previousYearTotal.toFixed(1)} kg</Text>
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
                                  {item.totalHarvest > 0 && (
                                    <Text style={[
                                      styles.comparisonChangeIndicator,
                                      item.previousMonthChange >= 0 ? styles.comparisonPositive : styles.comparisonNegative
                                    ]}>
                                      {item.previousMonthChange >= 0 ? '↑' : '↓'} {Math.abs(item.previousMonthChange).toFixed(1)}%
                                    </Text>
                                  )}
                                  <Text style={styles.comparisonDataValue}>{item.previousMonthTotal.toFixed(1)} kg</Text>
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
                </>
              )}
            </View>

            <View style={styles.cropTimelineCard}>
              <Text style={styles.cropTimelineTitle}>📈 Expected and Actual Harvest</Text>
              <Text style={styles.cropTimelineSubtitle}>
                Compare planned harvest timelines and yields for each crop
              </Text>

              {harvestTimelineStats.length > 0 ? (
                harvestTimelineStats.map((item, index) => {
                  const dateDifferenceText = formatDateDifference(item.dateDifferenceDays);
                  const yieldDifferenceText = formatYieldDifference(item.yieldDifference);
                  const isDateOnTime = item.dateDifferenceDays !== null && Math.abs(item.dateDifferenceDays) < 1;
                  const isDateDelayed = item.dateDifferenceDays !== null && item.dateDifferenceDays > 0;
                  const isYieldEven = item.yieldDifference !== null && Math.abs(item.yieldDifference) < 0.1;
                  const isYieldGain = item.yieldDifference !== null && item.yieldDifference > 0;

                  return (
                    <View
                      key={item.crop}
                      style={styles.cropTimelineItemCard}
                    >
                      <View style={styles.cropTimelineItemHeader}>
                        <View style={styles.cropTimelineName}>
                          <Text style={styles.cropTimelineIcon}>{getCropIcon(item.crop)}</Text>
                          <View style={styles.cropTimelineNameText}>
                            <Text style={styles.cropTimelineCrop}>{item.crop}</Text>
                            <Text style={styles.cropTimelineTagalog}>{getCropTagalogName(item.crop)}</Text>
                          </View>
                        </View>
                        <View style={styles.cropTimelineBadge}>
                          <Ionicons name="document-text" size={12} color="#666" />
                          <Text style={styles.cropTimelineSamples}>{item.totalReportCount}</Text>
                        </View>
                      </View>

                      <View style={styles.cropTimelineComparisonContainer}>
                        {/* Expected Section */}
                        <View style={styles.cropTimelineSection}>
                          <View style={styles.cropTimelineSectionHeader}>
                            <Ionicons name="calendar-outline" size={16} color="#2E7D32" />
                            <Text style={styles.cropTimelineSectionLabel}>Expected</Text>
                          </View>
                          <View style={styles.cropTimelineStatsGrid}>
                            <View style={styles.cropTimelineStatCard}>
                              <Text style={styles.cropTimelineStatLabel}>Avg Duration</Text>
                              <Text style={styles.cropTimelineStatValue}>
                                {formatDurationDays(item.averageExpectedDurationDays)}
                              </Text>
                            </View>
                            <View style={styles.cropTimelineStatCard}>
                              <Text style={styles.cropTimelineStatLabel}>Yield / Plant</Text>
                              <Text style={styles.cropTimelineStatValue}>
                                {formatPerPlantDisplay(item.averageExpectedYieldPerPlant)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Actual Section */}
                        <View style={styles.cropTimelineSection}>
                          <View style={styles.cropTimelineSectionHeader}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#1976D2" />
                            <Text style={styles.cropTimelineSectionLabel}>Actual</Text>
                          </View>
                          <View style={styles.cropTimelineStatsGrid}>
                            <View style={styles.cropTimelineStatCard}>
                              <Text style={styles.cropTimelineStatLabel}>Avg Duration</Text>
                              <Text style={styles.cropTimelineStatValue}>
                                {formatDurationDays(item.averageActualDurationDays, true)}
                              </Text>
                            </View>
                            <View style={styles.cropTimelineStatCard}>
                              <Text style={styles.cropTimelineStatLabel}>Yield / Plant</Text>
                              <Text style={styles.cropTimelineStatValue}>
                                {formatPerPlantDisplay(item.averageActualYieldPerPlant, true)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Differences Section */}
                      {(dateDifferenceText || yieldDifferenceText) && (
                        <View style={styles.cropTimelineDeltaContainer}>
                          {dateDifferenceText && (
                            <View style={[
                              styles.cropTimelineDeltaBadge,
                              isDateOnTime && styles.cropTimelineDeltaBadgeOnTime,
                              isDateDelayed && styles.cropTimelineDeltaBadgeDelay,
                              !isDateOnTime && !isDateDelayed && styles.cropTimelineDeltaBadgeAhead,
                            ]}>
                              <Ionicons 
                                name={isDateOnTime ? "checkmark-circle" : isDateDelayed ? "time-outline" : "flash-outline"} 
                                size={14} 
                                color={isDateOnTime ? "#2E7D32" : isDateDelayed ? "#C62828" : "#1B5E20"} 
                              />
                              <Text style={[
                                styles.cropTimelineDeltaText,
                                isDateOnTime && styles.cropTimelineOnTime,
                                isDateDelayed && styles.cropTimelineDelay,
                                !isDateOnTime && !isDateDelayed && styles.cropTimelineAhead,
                              ]}>
                                {dateDifferenceText}
                              </Text>
                            </View>
                          )}
                          {yieldDifferenceText && (
                            <View style={[
                              styles.cropTimelineDeltaBadge,
                              isYieldEven && styles.cropTimelineDeltaBadgeEven,
                              isYieldGain && styles.cropTimelineDeltaBadgeGain,
                              !isYieldEven && !isYieldGain && styles.cropTimelineDeltaBadgeDrop,
                            ]}>
                              <Ionicons 
                                name={isYieldEven ? "remove-circle" : isYieldGain ? "trending-up" : "trending-down"} 
                                size={14} 
                                color={isYieldEven ? "#2E7D32" : isYieldGain ? "#1B5E20" : "#C62828"} 
                              />
                              <Text style={[
                                styles.cropTimelineDeltaText,
                                isYieldEven && styles.cropTimelineYieldEven,
                                isYieldGain && styles.cropTimelineYieldGain,
                                !isYieldEven && !isYieldGain && styles.cropTimelineYieldDrop,
                              ]}>
                                {yieldDifferenceText}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.cropTimelineEmptyState}>
                  <Ionicons name="analytics-outline" size={40} color="#9E9E9E" />
                  <Text style={styles.cropTimelineEmptyTitle}>No comparisons yet</Text>
                  <Text style={styles.cropTimelineEmptySubtitle}>
                    Submit both planting and harvest reports to unlock crop averages.
                  </Text>
                </View>
              )}
            </View>

            {/* Summary Cards - Outside Global Trends */}
            {globalHarvestAnalytics && (
              <View style={styles.highlightsContainer}>
                <View style={styles.highlightCard}>
                  <Ionicons name="trophy" size={24} color="#FFD700" />
                  <Text style={styles.highlightTitle}>Most Harvested</Text>
                  <Text style={styles.highlightValue}>{globalHarvestAnalytics.mostPopularCrop || 'None'}</Text>
                </View>
                <View style={styles.highlightCard}>
                  <Ionicons name="basket" size={24} color="#4CAF50" />
                  <Text style={styles.highlightTitle}>Total Harvest</Text>
                  <Text style={styles.highlightValue}>{globalHarvestAnalytics.totalHarvested.toFixed(1)} kg</Text>
                </View>
                <View style={styles.highlightCard}>
                  <Ionicons name="document-text" size={24} color="#2196F3" />
                  <Text style={styles.highlightTitle}>Reports</Text>
                  <Text style={styles.highlightValue}>{globalHarvestAnalytics.totalUsers}</Text>
                </View>
              </View>
            )}

                        </View>
        </ScrollView>
      )}

      {activeNav === 'harvest-records' && showAllHarvestEntries && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setShowAllHarvestEntries(false);
                }}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>All Harvest Entries</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.sectionDescription}>
              Every harvest report submitted by farmers across Lopez
            </Text>

            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by</Text>
              <View style={styles.sortButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    harvestSortOption === 'expectedDesc' && styles.sortChipActive,
                  ]}
                  onPress={() => setHarvestSortOption('expectedDesc')}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      harvestSortOption === 'expectedDesc' && styles.sortChipTextActive,
                    ]}
                  >
                    Expected duration ↓
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    harvestSortOption === 'expectedAsc' && styles.sortChipActive,
                  ]}
                  onPress={() => setHarvestSortOption('expectedAsc')}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      harvestSortOption === 'expectedAsc' && styles.sortChipTextActive,
                    ]}
                  >
                    Expected duration ↑
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    harvestSortOption === 'actualDesc' && styles.sortChipActive,
                  ]}
                  onPress={() => setHarvestSortOption('actualDesc')}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      harvestSortOption === 'actualDesc' && styles.sortChipTextActive,
                    ]}
                  >
                    Actual duration ↓
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    harvestSortOption === 'actualAsc' && styles.sortChipActive,
                  ]}
                  onPress={() => setHarvestSortOption('actualAsc')}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      harvestSortOption === 'actualAsc' && styles.sortChipTextActive,
                    ]}
                  >
                    Actual duration ↑
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {sortedHarvestEntries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No harvest entries available</Text>
              </View>
            ) : (
              <View style={styles.allEntriesList}>
                {sortedHarvestEntries.map((record: any) => {
                  const hasActualHarvest =
                    record.actualHarvest != null ||
                    record.harvestWeight != null ||
                    record.actualYieldPerPlant != null;

                  const statusLabel = hasActualHarvest ? 'Harvested' : 'Planned';

                  return (
                    <TouchableOpacity
                      key={record.id}
                      style={styles.allEntryCard}
                      onPress={() => openReportDetail(record)}
                      activeOpacity={0.7}
                    >
                      {/* Header with crop + status */}
                      <View style={styles.allEntryHeader}>
                        <View style={styles.allEntryHeaderLeft}>
                          <View style={styles.allEntryIconCircle}>
                            <Text style={styles.allEntryIconEmoji}>
                              {getCropIcon(record.crop)}
                            </Text>
                          </View>
                          <View style={styles.allEntryCropTextContainer}>
                            <View style={styles.allEntryCropRow}>
                              <Text style={styles.allEntryCrop}>
                                {record.crop || 'Unknown Crop'}
                              </Text>
                              <Text style={styles.cropTagalogName}>
                                {' '}
                                / {getCropTagalogName(record.crop)}
                              </Text>
                            </View>
                            <Text style={styles.allEntryFarmer}>
                              {record.farmerName || 'Unknown Farmer'} •{' '}
                              {record.farmerEmail || 'unknown@email.com'}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.allEntryStatusBadge,
                            hasActualHarvest
                              ? styles.allEntryStatusHarvested
                              : styles.allEntryStatusPlanned,
                          ]}
                        >
                          <Ionicons
                            name={hasActualHarvest ? 'leaf' : 'calendar-outline'}
                            size={12}
                            color={hasActualHarvest ? '#1B5E20' : '#1565C0'}
                          />
                          <Text
                            style={[
                              styles.allEntryStatusText,
                              hasActualHarvest
                                ? styles.allEntryStatusTextHarvested
                                : styles.allEntryStatusTextPlanned,
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>

                      {/* Durations */}
                      <View style={styles.allEntryDurationRow}>
                        <View style={styles.allEntryDurationColumn}>
                          <Text style={styles.allEntryLabel}>Expected duration</Text>
                          <Text style={styles.allEntryValue}>
                            {formatDurationValue(record.expectedDurationDays)}
                          </Text>
                        </View>
                        <View style={styles.allEntryDurationColumn}>
                          <Text style={styles.allEntryLabel}>Actual duration</Text>
                          <Text style={styles.allEntryValue}>
                            {formatDurationValue(
                              record.actualDurationDays,
                              'Not harvested yet'
                            )}
                          </Text>
                        </View>
                      </View>

                      {/* Yield per plant */}
                      <View style={styles.allEntryDurationRow}>
                        <View style={styles.allEntryDurationColumn}>
                          <Text style={styles.allEntryLabel}>Expected yield / plant</Text>
                          <Text style={styles.allEntryValue}>
                            {formatYieldPerPlantValue(record.expectedYieldPerPlant)}
                          </Text>
                        </View>
                        <View style={styles.allEntryDurationColumn}>
                          <Text style={styles.allEntryLabel}>Actual yield / plant</Text>
                          <Text style={styles.allEntryValue}>
                            {formatYieldPerPlantValue(
                              record.actualYieldPerPlant,
                              'Not harvested yet'
                            )}
                          </Text>
                        </View>
                      </View>

                      {/* Totals and date */}
                      <View style={styles.allEntryMetaRow}>
                        <Text style={styles.allEntryStatsText}>
                          Expected: {record.expectedYield ?? 0} kg • Actual:{' '}
                          {record.actualHarvest ?? record.harvestWeight ?? 0} kg
                        </Text>
                        <Text style={styles.allEntryDate}>
                          Submitted:{' '}
                          {record.submittedAt?.toDate?.()?.toLocaleDateString() ||
                            'Unknown'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* All Harvest Records View - Grouped by User */}
      {activeNav === 'harvest-records' && showUserReports && !selectedUserAccount && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowUserReports(false)}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>All Harvest Records</Text>
              <View style={{ width: 24 }} />
                      </View>
                      
            <Text style={styles.sectionDescription}>
              All harvest reports from all farmers
            </Text>

            {loadingRecords ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading harvest records...</Text>
              </View>
            ) : groupedHarvestRecords.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No harvest records found</Text>
              </View>
            ) : (
              <View style={styles.messagesList}>
                <TouchableOpacity
                  style={[styles.messageCard, styles.viewAllMessageCard]}
                  onPress={() => {
                    setShowAllHarvestEntries(true);
                    setShowUserReports(false);
                    setSelectedUserAccount(null);
                  }}
                >
                  <View style={styles.messageHeader}>
                    <View style={styles.userInfo}>
                      <View style={[styles.messageUserAvatar, styles.viewAllAvatar]}>
                        <Ionicons name="layers" size={18} color={GREEN} />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>View All Records</Text>
                        <Text style={styles.viewAllSubtitle}>See every harvest report across all farmers</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={GREEN} />
                  </View>
                </TouchableOpacity>

                {groupedHarvestRecords.map((userGroup, index) => (
                  <TouchableOpacity 
                    key={userGroup.userId} 
                    style={[
                      styles.messageCard,
                      userGroup.unreadCount > 0 && styles.messageCardUnread
                    ]}
                    onPress={() => {
                      setSelectedUserAccount(userGroup);
                      setReportType('harvest');
                      setShowUserReports(true);
                      markReportsAsRead(userGroup.userId, 'harvest');
                    }}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.userInfo}>
                        <View style={styles.messageUserAvatar}>
                          {userGroup.userCropEmoji ? (
                            <Text style={styles.adminMessageCropEmoji}>{userGroup.userCropEmoji}</Text>
                          ) : (
                          <Ionicons name="person" size={20} color={GREEN} />
                          )}
                        </View>
                        <View style={styles.userDetails}>
                          <Text style={styles.userName}>{userGroup.userName}</Text>
                          <Text style={styles.userEmail}>{userGroup.userEmail}</Text>
                        </View>
                      </View>
                      <View style={styles.messageMetaInfo}>
                        {userGroup.unreadCount > 0 && (
                          <View style={styles.messageUnreadBadge}>
                            <Text style={styles.unreadCount}>{userGroup.unreadCount}</Text>
                          </View>
                        )}
                        <Text style={styles.messageTimeText}>
                          {userGroup.latestReportDate?.toLocaleDateString() || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.messagePreviewContainer}>
                      <Text style={styles.messagePreviewText}>
                        {userGroup.reports.length} report{userGroup.reports.length !== 1 ? 's' : ''}
                        {userGroup.unreadCount > 0 && ` • ${userGroup.unreadCount} unread`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Individual User Harvest Reports View */}
      {activeNav === 'harvest-records' && showUserReports && selectedUserAccount && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  setSelectedUserAccount(null);
                  setShowUserReports(false);
                }}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>{selectedUserAccount?.userName}'s Reports</Text>
              <View style={{ width: 24 }} />
                      </View>
                      
            <Text style={styles.sectionDescription}>
              {reportType === 'planting' ? 'Planting' : 'Harvest'} reports from {selectedUserAccount?.userEmail}
            </Text>

            {selectedUserAccount && (
                      <View style={styles.userReportsList}>
                {selectedUserAccount.reports.map((report: any, index: number) => (
                  <TouchableOpacity 
                    key={report.id} 
                    style={[
                      styles.reportCard,
                      !report.read && styles.reportCardUnread
                    ]}
                    onPress={() => openReportDetail(report)}
                  >
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportCrop}>{report.crop}</Text>
                                <View style={[
                                  styles.statusBadge,
                        report.read ? styles.statusRead : styles.statusUnread
                                ]}>
                        <Text style={styles.statusText}>{report.read ? 'READ' : 'UNREAD'}</Text>
                                </View>
                                  </View>
                    <View style={styles.reportDetailsContainer}>
                              <Ionicons name="basket" size={16} color="#666" />
                      <Text style={styles.reportDetails}>
                        Expected: {report.expectedYield} kg • Actual: {report.actualHarvest || report.harvestWeight || 0} kg
                              </Text>
                    </View>

                    {(report.expectedDurationDays || report.actualDurationDays) && (
                      <View style={styles.reportDetailsContainer}>
                        <Ionicons name="time" size={16} color="#666" />
                        <View style={styles.reportDurationContent}>
                          <Text style={styles.reportDetails}>
                            Expected duration: {formatDurationValue(report.expectedDurationDays)}
                          </Text>
                          <Text style={styles.reportDetails}>
                            Actual duration: {formatDurationValue(report.actualDurationDays, 'Not harvested yet')}
                          </Text>
                        </View>
                      </View>
                    )}

                    {(report.expectedYieldPerPlant || report.actualYieldPerPlant) && (
                      <View style={styles.reportDetailsContainer}>
                        <Ionicons name="speedometer" size={16} color="#666" />
                        <View style={styles.reportDurationContent}>
                          <Text style={styles.reportDetails}>
                            Expected yield / plant: {formatYieldPerPlantValue(report.expectedYieldPerPlant)}
                          </Text>
                          <Text style={styles.reportDetails}>
                            Actual yield / plant: {formatYieldPerPlantValue(report.actualYieldPerPlant, 'Not harvested yet')}
                          </Text>
                        </View>
                      </View>
                    )}
                    
                    {/* Show decline reason if harvest was lower than expected */}
                    {report.declineReason && (
                      <View style={styles.reportDetailsContainer}>
                        <Ionicons name="alert-circle" size={16} color="#ff6b35" />
                        <Text style={styles.declineReasonText}>
                          Reason for Lower Harvest: {report.declineReason}
                        </Text>
                      </View>
                    )}
                    <View style={styles.reportDateContainer}>
                              <Ionicons name="calendar" size={16} color="#999" />
                      <Text style={styles.reportDate}>
                        Submitted: {report.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                              </Text>
                      {!report.read && (
                        <View style={styles.readIndicator}>
                          <Text style={styles.readIndicatorText}>NEW</Text>
                            </View>
                      )}
                          </View>
                    <View style={styles.reportTapHint}>
                      <Text style={styles.reportTapHintText}>Tap to view details</Text>
                      <Ionicons name="chevron-forward" size={16} color="#999" />
                    </View>
                  </TouchableOpacity>
                        ))}
                      </View>
            )}
                    </View>
        </ScrollView>
      )}

      {/* Farmers Records Section */}
      {activeNav === 'farmers-records' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Farmers Records</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={styles.sectionDescription}>
              View and manage farmer profiles and information
            </Text>

            {/* Summary & Inventory Button */}
            {!loadingFarmers && farmersData.length > 0 && (
              <TouchableOpacity
                style={styles.summaryInventoryButton}
                onPress={() => setShowSummaryInventory(true)}
                activeOpacity={0.7}
              >
                <View style={styles.summaryInventoryButtonContent}>
                  <Ionicons name="stats-chart" size={24} color="#fff" />
                  <Text style={styles.summaryInventoryButtonText}>Summary & Inventory</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            )}

            {loadingFarmers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={GREEN} />
                <Text style={styles.loadingText}>Loading farmers data...</Text>
              </View>
            ) : farmersData.length === 0 ? (
              <View style={styles.placeholderContainer}>
                <Ionicons name="people" size={64} color="#ccc" />
                <Text style={styles.placeholderTitle}>No Farmers Data</Text>
                <Text style={styles.placeholderDescription}>
                  No farmer profiles have been submitted yet.
                </Text>
              </View>
            ) : (
              <View style={styles.farmersList}>
                {farmersData.map((farmer) => (
                  <TouchableOpacity
                    key={farmer.id}
                    style={styles.farmerCard}
                    onPress={() => {
                      setSelectedFarmer(farmer);
                      setShowFarmerDetail(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.farmerCardHeader}>
                      <View style={styles.farmerAvatar}>
                        {farmer.userCropEmoji ? (
                          <Text style={styles.adminFarmerCropEmoji}>{farmer.userCropEmoji}</Text>
                        ) : (
                        <Ionicons name="person" size={24} color={GREEN} />
                        )}
                      </View>
                      <View style={styles.farmerInfo}>
                        <Text style={styles.farmerName}>{farmer.userName || 'Unknown'}</Text>
                        <Text style={styles.farmerEmail}>{farmer.userEmail || 'Unknown'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </View>
                    
                    <View style={styles.farmerStats}>
                      <View style={styles.farmerStat}>
                        <Text style={styles.farmerStatLabel}>Forms Completed</Text>
                        <Text style={styles.farmerStatValue}>
                          {farmer.completedForms || 0} / {farmer.totalForms || 0}
                        </Text>
                      </View>
                      <View style={styles.farmerStat}>
                        <Text style={styles.farmerStatLabel}>Completion</Text>
                        <Text style={styles.farmerStatValue}>
                          {farmer.completionPercentage || 0}%
                        </Text>
                      </View>
                    </View>
                    
                    {/* Show completed forms summary */}
                    {farmer.formData && (
                      <View style={styles.completedFormsSummary}>
                        <Text style={styles.completedFormsLabel}>Completed Forms:</Text>
                        <View style={styles.completedFormsList}>
                          {Object.keys(farmer.formData).map((formKey) => {
                            const formData = farmer.formData[formKey];
                            if (formData?.isSubmitted) {
                              const formTitle = formKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                              return (
                                <View key={formKey} style={styles.completedFormItem}>
                                  <Ionicons name="checkmark-circle" size={12} color="#4caf50" />
                                  <Text style={styles.completedFormText}>{formTitle}</Text>
                                </View>
                              );
                            }
                            return null;
                          })}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Detailed Report View Modal */}
      <Modal
        visible={showReportDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReportDetail(false)}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity 
              style={styles.detailModalCloseButton}
              onPress={() => setShowReportDetail(false)}
            >
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Report Details</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {selectedReport && (
            <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View style={styles.detailUserInfo}>
                    <View style={styles.detailUserAvatar}>
                      {selectedReport.userCropEmoji ? (
                        <Text style={styles.adminDetailCropEmoji}>{selectedReport.userCropEmoji}</Text>
                      ) : (
                      <Ionicons name="person" size={24} color={GREEN} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.detailUserName}>{selectedReport.farmerName}</Text>
                      <Text style={styles.detailUserEmail}>{selectedReport.farmerEmail}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.detailStatusBadge,
                    selectedReport.read ? styles.detailStatusRead : styles.detailStatusUnread
                  ]}>
                    <Text style={styles.detailStatusText}>{selectedReport.read ? 'READ' : 'UNREAD'}</Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Crop Information</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="leaf" size={20} color={GREEN} />
                    <Text style={styles.detailLabel}>Crop:</Text>
                    <Text style={styles.detailValue}>{selectedReport.crop}</Text>
                  </View>
                  {selectedReport.plantingDate && (
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={20} color={GREEN} />
                      <Text style={styles.detailLabel}>Planting Date:</Text>
                      <Text style={styles.detailValue}>{selectedReport.plantingDate}</Text>
                    </View>
                  )}
                  {selectedReport.expectedHarvestDate && (
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={20} color={GREEN} />
                      <Text style={styles.detailLabel}>Expected Harvest Date:</Text>
                      <Text style={styles.detailValue}>{selectedReport.expectedHarvestDate}</Text>
                    </View>
                  )}
                  {selectedReport.plantCount && (
                    <View style={styles.detailRow}>
                      <Ionicons name="leaf-outline" size={20} color={GREEN} />
                      <Text style={styles.detailLabel}>Number of Plants/Seeds:</Text>
                      <Text style={styles.detailValue}>{selectedReport.plantCount}</Text>
                    </View>
                  )}
                  {selectedReport.expectedHarvest && (
                    <View style={styles.detailRow}>
                      <Ionicons name="basket-outline" size={20} color={GREEN} />
                      <Text style={styles.detailLabel}>Expected Harvest:</Text>
                      <Text style={styles.detailValue}>{selectedReport.expectedHarvest} kg</Text>
                    </View>
                  )}
                  {(selectedReport.expectedDurationDays || selectedReport.actualDurationDays) && (
                    <View style={styles.detailDurationInfo}>
                      <Ionicons name="time" size={20} color={GREEN} />
                      <View style={styles.detailDurationText}>
                        <Text style={styles.detailLabel}>Expected duration:</Text>
                        <Text style={styles.detailValue}>
                          {formatDurationValue(selectedReport.expectedDurationDays)}
                        </Text>
                        <Text style={styles.detailLabel}>Actual duration:</Text>
                        <Text style={styles.detailValue}>
                          {formatDurationValue(selectedReport.actualDurationDays, 'Not harvested yet')}
                        </Text>
                      </View>
                    </View>
                  )}
                  {selectedReport.actualHarvest && (
                    <View style={styles.detailRow}>
                      <Ionicons name="basket" size={20} color={GREEN} />
                      <Text style={styles.detailLabel}>Actual Harvest:</Text>
                      <Text style={styles.detailValue}>{selectedReport.actualHarvest} kg</Text>
                    </View>
                  )}
                  {(selectedReport.expectedYieldPerPlant || selectedReport.actualYieldPerPlant) && (
                    <View style={styles.detailDurationInfo}>
                      <Ionicons name="speedometer" size={20} color={GREEN} />
                      <View style={styles.detailDurationText}>
                        <Text style={styles.detailLabel}>Expected yield / plant:</Text>
                        <Text style={styles.detailValue}>
                          {formatYieldPerPlantValue(selectedReport.expectedYieldPerPlant)}
                        </Text>
                        <Text style={styles.detailLabel}>Actual yield / plant:</Text>
                        <Text style={styles.detailValue}>
                          {formatYieldPerPlantValue(selectedReport.actualYieldPerPlant, 'Not harvested yet')}
                        </Text>
                      </View>
                    </View>
                  )}
                  {selectedReport.declineReason && (
                    <View style={styles.detailRow}>
                      <Ionicons name="alert-circle" size={20} color="#ff6b35" />
                      <Text style={styles.detailLabel}>Reason for Lower Harvest:</Text>
                      <Text style={styles.detailDeclineReason}>{selectedReport.declineReason}</Text>
                    </View>
                  )}
                </View>
                
                {selectedReport.areaPlanted && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Area Information</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="resize" size={20} color={GREEN} />
                      <Text style={styles.detailLabel}>Area Planted:</Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.areaPlanted} {selectedReport.areaType}
                        {selectedReport.customAreaType && ` (${selectedReport.customAreaType})`}
                      </Text>
                    </View>
                  </View>
                )}
                
                {selectedReport.amount && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Harvest Information</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="basket" size={20} color={GREEN} />
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.amount} {selectedReport.amountType}
                        {selectedReport.customAmountType && ` (${selectedReport.customAmountType})`}
                      </Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Submission Details</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={20} color={GREEN} />
                    <Text style={styles.detailLabel}>Submitted:</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={20} color={GREEN} />
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.submittedAt?.toDate?.()?.toLocaleTimeString() || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="checkmark-circle" size={20} color={GREEN} />
                    <Text style={styles.detailLabel}>Read Status:</Text>
                    <Text style={[styles.detailValue, { color: selectedReport.read ? GREEN : '#ff6b6b' }]}>
                      {selectedReport.read ? 'Read' : 'Unread'}
                    </Text>
                  </View>
                </View>
                
                {selectedReport.imageUrl && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Documentation</Text>
                    <View style={styles.detailImageContainer}>
                      <Image source={{ uri: selectedReport.imageUrl }} style={styles.detailImage} />
                    </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}
        </View>
      </Modal>

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNavTabs}>
        <TouchableOpacity 
          style={[styles.navTab, activeNav === 'home' && styles.activeNavTab]}
          onPress={() => setActiveNav('home')}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeNav === 'home' ? GREEN : '#666'} 
          />
          <Text style={[styles.navTabText, activeNav === 'home' && styles.activeNavTabText]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navTab, activeNav === 'price-monitoring' && styles.activeNavTab]}
          onPress={() => setActiveNav('price-monitoring')}
        >
          <Ionicons 
            name="analytics" 
            size={24} 
            color={activeNav === 'price-monitoring' ? GREEN : '#666'} 
          />
          <Text style={[styles.navTabText, activeNav === 'price-monitoring' && styles.activeNavTabText]}>
            Price Monitoring
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navTab, activeNav === 'search' && styles.activeNavTab]}
          onPress={() => setActiveNav('search')}
        >
          <Ionicons 
            name="search" 
            size={24} 
            color={activeNav === 'search' ? GREEN : '#666'} 
          />
          <Text style={[styles.navTabText, activeNav === 'search' && styles.activeNavTabText]}>
            Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navTab, activeNav === 'settings' && styles.activeNavTab]}
          onPress={() => setActiveNav('settings')}
        >
          <Ionicons 
            name="settings" 
            size={24} 
            color={activeNav === 'settings' ? GREEN : '#666'} 
          />
          <Text style={[styles.navTabText, activeNav === 'settings' && styles.activeNavTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Announcement Modal */}
      <Modal
        visible={showCreateAnnouncement}
        animationType="slide"
        transparent={true}
        onRequestClose={cancelAnnouncement}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Announcement</Text>
              <TouchableOpacity onPress={cancelAnnouncement}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Announcement Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter announcement title..."
                  value={announcementTitle}
                  onChangeText={setAnnouncementTitle}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Icon</Text>
                <View style={styles.iconSelector}>
                  <TouchableOpacity 
                    style={[styles.iconOption, announcementIcon === 'megaphone' && styles.selectedIcon]}
                    onPress={() => setAnnouncementIcon('megaphone')}
                  >
                    <Ionicons name="megaphone" size={24} color={announcementIcon === 'megaphone' ? '#fff' : GREEN} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconOption, announcementIcon === 'warning' && styles.selectedIcon]}
                    onPress={() => setAnnouncementIcon('warning')}
                  >
                    <Ionicons name="warning" size={24} color={announcementIcon === 'warning' ? '#fff' : GREEN} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconOption, announcementIcon === 'information-circle' && styles.selectedIcon]}
                    onPress={() => setAnnouncementIcon('information-circle')}
                  >
                    <Ionicons name="information-circle" size={24} color={announcementIcon === 'information-circle' ? '#fff' : GREEN} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconOption, announcementIcon === 'leaf' && styles.selectedIcon]}
                    onPress={() => setAnnouncementIcon('leaf')}
                  >
                    <Ionicons name="leaf" size={24} color={announcementIcon === 'leaf' ? '#fff' : GREEN} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Announcement Content</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter the announcement content..."
                  value={announcementContent}
                  onChangeText={setAnnouncementContent}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text style={styles.characterCount}>{announcementContent.length}/1000</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelAnnouncement}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.createButton, announcementLoading && styles.createButtonDisabled]}
                onPress={createAnnouncement}
                disabled={announcementLoading}
              >
                {announcementLoading ? (
                  <>
                    <Ionicons name="hourglass" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Creating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Create & Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Compose Message Modal */}
      <Modal
        visible={showComposeMessage}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComposeMessage(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.viewModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compose Message</Text>
              <TouchableOpacity onPress={() => setShowComposeMessage(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.composeMessageContainer}>
              <View style={styles.recipientInfo}>
                <View style={styles.recipientAvatar}>
                  {selectedUser?.userCropEmoji ? (
                    <Text style={styles.adminRecipientCropEmoji}>{selectedUser.userCropEmoji}</Text>
                  ) : (
                  <Ionicons name="person" size={24} color="#fff" />
                  )}
                </View>
                <View style={styles.recipientDetails}>
                  <Text style={styles.recipientName}>{selectedUser?.displayName}</Text>
                  <Text style={styles.recipientEmail}>{selectedUser?.email}</Text>
                </View>
              </View>

              <View style={styles.messageInputContainer}>
                <Text style={styles.messageLabel}>Message:</Text>
                <TextInput
                  style={styles.messageTextInput}
                  placeholder="Type your message here..."
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.composeButtonsContainer}>
                <TouchableOpacity
                  style={styles.composeCancelButton}
                  onPress={() => {
                    setMessageText('');
                    setSelectedUser(null);
                    setShowComposeMessage(false);
                  }}
                >
                  <Text style={styles.composeCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.sendButton, sendingMessage && styles.sendButtonDisabled]}
                  onPress={sendMessageToUser}
                  disabled={sendingMessage || !messageText.trim()}
                >
                  {sendingMessage ? (
                    <Text style={styles.sendButtonText}>Sending...</Text>
                  ) : (
                    <Text style={styles.sendButtonText}>Send Message</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* App Updates Modal */}
      <Modal
        visible={showAppUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAppUpdateModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.viewModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>App Updates</Text>
              <TouchableOpacity onPress={() => setShowAppUpdateModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Body scroll area */}
            <View style={styles.appUpdateBody}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Version</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1.1.0"
                  value={updateVersion}
                  onChangeText={setUpdateVersion}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Update Link</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Paste download link (Play Store, APK, etc.)"
                  value={updateUrl}
                  onChangeText={setUpdateUrl}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Update Message (shown to users)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Explain what is new or why this update is required..."
                  value={updateMessage}
                  onChangeText={setUpdateMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Force update for all users</Text>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setUpdateIsActive(!updateIsActive)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.togglePill,
                      updateIsActive && styles.togglePillActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        updateIsActive && styles.toggleThumbActive,
                      ]}
                    />
                  </View>
                  <Text style={styles.toggleLabel}>
                    {updateIsActive
                      ? 'ON – users will see a blocking update screen'
                      : 'OFF – users can continue using current version'}
                  </Text>
                </TouchableOpacity>
              </View>

              {recentUpdates.length > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Recent Updates</Text>
                  {recentUpdates.slice(0, 5).map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[
                        styles.updateHistoryItem,
                        selectedUpdateId === u.id && styles.updateHistoryItemSelected,
                      ]}
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedUpdateId(u.id);
                        setUpdateVersion(u.version || '');
                        setUpdateUrl(u.url || '');
                        setUpdateMessage(u.message || '');
                        setUpdateIsActive(!!u.isActive);
                      }}
                    >
                      <View style={styles.updateHistoryHeader}>
                        <Text style={styles.updateHistoryVersion}>
                          v{u.version || 'N/A'}
                        </Text>
                        {u.isActive && (
                          <View style={styles.updateHistoryBadge}>
                            <Text style={styles.updateHistoryBadgeText}>
                              Active
                            </Text>
                          </View>
                        )}
                      </View>
                      {u.message ? (
                        <Text style={styles.updateHistoryMessage} numberOfLines={2}>
                          {u.message}
                        </Text>
                      ) : null}
                      <Text style={styles.updateHistoryMeta}>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleString()
                          : 'No date'}{' '}
                        • {u.createdBy || 'admin'}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {selectedUpdateId && (
                    <View style={styles.updateActionsRow}>
                      <TouchableOpacity
                        style={[styles.secondaryButton, styles.dangerButton]}
                        onPress={deleteSelectedAppUpdate}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="trash" size={18} color="#c0392b" />
                        <Text
                          style={[
                            styles.secondaryButtonText,
                            styles.dangerButtonText,
                          ]}
                        >
                          Delete
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={undeployAllAppUpdates}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="power" size={18} color={GREEN} />
                        <Text style={styles.secondaryButtonText}>Undeploy</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={deployLatestAppUpdate}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="rocket" size={18} color={GREEN} />
                        <Text style={styles.secondaryButtonText}>Deploy</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              </ScrollView>
            </View>

            <View style={styles.appUpdateFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAppUpdateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  savingUpdate && styles.createButtonDisabled,
                ]}
                onPress={handleSaveAppUpdate}
                disabled={savingUpdate}
              >
                {savingUpdate ? (
                  <>
                    <Ionicons name="hourglass" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Save Update</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Announcement Modal */}
      <Modal
        visible={showViewAnnouncements}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowViewAnnouncements(false);
          setSelectedAnnouncement(null);
        }}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.viewModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedAnnouncement ? 'Announcement Details' : `All Announcements (${announcements.length})`}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowViewAnnouncements(false);
                setSelectedAnnouncement(null);
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.announcementsListContainer} showsVerticalScrollIndicator={false}>
              {selectedAnnouncement ? (
                // Show single announcement details
                <View style={styles.announcementDetailContainer}>
                  <View style={styles.announcementDetailHeader}>
                    <View style={styles.announcementDetailIconContainer}>
                      <Ionicons 
                        name={selectedAnnouncement.icon as any || "megaphone"} 
                        size={32} 
                        color={GREEN} 
                      />
                    </View>
                    <View style={styles.announcementDetailContent}>
                      <Text style={styles.announcementDetailTitle}>{selectedAnnouncement.title}</Text>
                      <Text style={styles.announcementDetailDate}>
                        {selectedAnnouncement.date || selectedAnnouncement.createdAt} • By {selectedAnnouncement.createdBy || 'Admin'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.announcementDetailBody}>
                    <Text style={styles.announcementDetailText}>
                      {selectedAnnouncement.content}
                    </Text>
                  </View>
                  
                  <View style={styles.announcementDetailFooter}>
                    <Text style={styles.announcementDetailId}>ID: {selectedAnnouncement.id}</Text>
                  </View>
                </View>
              ) : announcementLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading announcements...</Text>
                </View>
              ) : announcements.length > 0 ? (
                announcements.map((announcement, index) => (
                  <View key={announcement.id || index} style={styles.announcementItem}>
                    <View style={styles.announcementItemHeader}>
                      <View style={styles.announcementItemIconContainer}>
                        <Ionicons 
                          name={announcement.icon as any || "megaphone"} 
                          size={20} 
                          color={GREEN} 
                        />
                      </View>
                      <View style={styles.announcementItemContent}>
                        <Text style={styles.announcementItemTitle}>{announcement.title}</Text>
                        <Text style={styles.announcementItemDate}>
                          {announcement.date} • By {announcement.createdBy}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Announcement',
                            'Are you sure you want to delete this announcement? This action cannot be undone.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                style: 'destructive',
                                onPress: () => {
                                  deleteAnnouncement(announcement.id);
                                  // If we're viewing this announcement, go back to the list
                                  if (selectedAnnouncement && selectedAnnouncement.id === announcement.id) {
                                    setSelectedAnnouncement(null);
                                  }
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.announcementItemText}>
                      {announcement.content}
                    </Text>
                    <View style={styles.announcementItemFooter}>
                      <Text style={styles.announcementItemId}>ID: {announcement.id}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noAnnouncementsContainer}>
                  <Ionicons name="megaphone-outline" size={64} color="#ccc" />
                  <Text style={styles.noAnnouncementsTitle}>No Announcements Yet</Text>
                  <Text style={styles.noAnnouncementsText}>
                    Create your first announcement to get started!
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.viewModalFooter}>
              {selectedAnnouncement ? (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      'Delete Announcement',
                      'Are you sure you want to delete this announcement? This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: () => {
                            deleteAnnouncement(selectedAnnouncement.id);
                            setSelectedAnnouncement(null);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => {
                    loadAnnouncements();
                  }}
                >
                  <Ionicons name="refresh" size={20} color={GREEN} />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowViewAnnouncements(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User List Modal */}
      <Modal
        visible={showUserList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowUserList(false);
          setUserSearchQuery('');
          setFilteredUsers(users);
        }}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.viewModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select User to Message ({filteredUsers.length})</Text>
              <TouchableOpacity onPress={() => {
                setShowUserList(false);
                setUserSearchQuery('');
                setFilteredUsers(users);
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.userSearchContainer}>
              <View style={styles.userSearchInputContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.userSearchIcon} />
                <TextInput
                  style={styles.userSearchInput}
                  placeholder="Search by name, email, role, or location..."
                  value={userSearchQuery}
                  onChangeText={handleUserSearch}
                  placeholderTextColor="#999"
                />
                {userSearchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => handleUserSearch('')}
                    style={styles.userClearSearchButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView style={styles.announcementsListContainer} showsVerticalScrollIndicator={false}>
              {loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <TouchableOpacity 
                    key={user.id || index} 
                    style={styles.userItem}
                    onPress={() => {
                      setSelectedUser(user);
                      setShowUserList(false);
                      setShowComposeMessage(true);
                    }}
                  >
                    <View style={styles.userItemHeader}>
                      <View style={styles.userAvatar}>
                        {user.userCropEmoji ? (
                          <Text style={styles.adminUserCropEmoji}>{user.userCropEmoji}</Text>
                        ) : (
                        <Ionicons name="person" size={24} color="#fff" />
                        )}
                      </View>
                      <View style={styles.userItemContent}>
                        <Text style={styles.userItemName}>{user.displayName}</Text>
                        <Text style={styles.userItemEmail}>{user.email}</Text>
                        <Text style={styles.userItemRole}>
                          {user.role} • {user.barangay ? user.barangay : user.location}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noAnnouncementsContainer}>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={styles.noAnnouncementsTitle}>
                    {userSearchQuery ? 'No Users Found' : 'No Users Available'}
                  </Text>
                  <Text style={styles.noAnnouncementsText}>
                    {userSearchQuery 
                      ? `No users match "${userSearchQuery}". Try a different search term.`
                      : 'No users are currently registered in the system.'
                    }
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.viewModalFooter}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => {
                  fetchUsers();
                }}
              >
                <Ionicons name="refresh" size={20} color={GREEN} />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowUserList(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Summary & Inventory Modal */}
      <Modal
        visible={showSummaryInventory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSummaryInventory(false)}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity 
              style={styles.detailModalCloseButton}
              onPress={() => setShowSummaryInventory(false)}
            >
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Summary & Inventory</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                {/* Summary Stats */}
                <View style={styles.summaryStatsContainer}>
                  <View style={styles.summaryStatCard}>
                    <Text style={styles.summaryStatValue}>{farmersSummary.totalFarmers}</Text>
                    <Text style={styles.summaryStatLabel}>Total Farmers</Text>
                  </View>
                  <View style={styles.summaryStatCard}>
                    <Text style={styles.summaryStatValue}>
                      {farmersSummary.totalFormsSubmitted} / {farmersSummary.totalPossibleForms}
                    </Text>
                    <Text style={styles.summaryStatLabel}>Forms Submitted</Text>
                  </View>
                  <View style={styles.summaryStatCard}>
                    <Text style={styles.summaryStatValue}>
                      {farmersSummary.overallCompletionPercentage}%
                    </Text>
                    <Text style={styles.summaryStatLabel}>Overall Completion</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                {/* Comprehensive Inventory */}
                <Text style={styles.summarySubtitle}>Complete Inventory</Text>
                
                {Object.keys(farmersSummary.inventoryBreakdown).map((formKey) => {
                  const formInventory = farmersSummary.inventoryBreakdown[formKey];
                  const formTitle = formKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  
                  // Check if this form has any data
                  const hasData = Object.keys(formInventory).some(fieldKey => {
                    const fieldData = formInventory[fieldKey];
                    return fieldData && typeof fieldData === 'object' && Object.keys(fieldData).length > 0;
                  });

                  if (!hasData) return null;

                  // Count how many fields have data for this form
                  const fieldsWithDataCount = Object.keys(formInventory).reduce((count, fieldKey) => {
                    const fieldData = formInventory[fieldKey];
                    if (fieldData && typeof fieldData === 'object' && Object.keys(fieldData).length > 0) {
                      return count + 1;
                    }
                    return count;
                  }, 0);
                  
                  return (
                    <View key={formKey} style={styles.inventoryFormSection}>
                      <View style={styles.inventoryFormHeader}>
                        <View style={styles.inventoryFormIcon}>
                          <Ionicons name="stats-chart" size={18} color={GREEN} />
                        </View>
                        <View style={styles.inventoryFormHeaderText}>
                          <Text style={styles.inventoryFormTitle}>{formTitle}</Text>
                          <Text style={styles.inventoryFormSubtitle}>
                            {fieldsWithDataCount} key indicators
                          </Text>
                        </View>
                      </View>
                      {Object.keys(formInventory).map((fieldKey) => {
                        const fieldData = formInventory[fieldKey];
                        if (!fieldData || typeof fieldData !== 'object' || Object.keys(fieldData).length === 0) {
                          return null;
                        }

                        const fieldTitle = fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        
                        return (
                          <View key={fieldKey} style={styles.inventoryFieldSection}>
                            <Text style={styles.inventoryFieldTitle}>{fieldTitle}</Text>
                            <View style={styles.breakdownGrid}>
                              {Object.entries(fieldData)
                                // Ensure we are sorting numeric counts; non-numbers are treated as 0
                                .sort(([, a]: [string, any], [, b]: [string, any]) => {
                                  const numA = typeof a === 'number' ? a : 0;
                                  const numB = typeof b === 'number' ? b : 0;
                                  return numB - numA;
                                })
                                .map(([value, count]: [string, any]) => {
                                  // Skip entries that are not meaningful
                                  const safeCount = typeof count === 'number' ? count : 0;
                                  if (!safeCount) return null;

                                  return (
                                    <View key={value} style={styles.breakdownItem}>
                                      <Text style={styles.breakdownValue}>{safeCount}</Text>
                                      <Text style={styles.breakdownLabel} numberOfLines={2}>
                                        {String(value)}
                                      </Text>
                                    </View>
                                  );
                                })}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Download CSV Modal */}
      <Modal
        visible={showDownloadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!downloading) {
            setShowDownloadModal(false);
            setSelectedCommodities(new Set());
          }
        }}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity 
              style={styles.detailModalCloseButton}
              onPress={() => {
                if (!downloading) {
                  setShowDownloadModal(false);
                  setSelectedCommodities(new Set());
                }
              }}
              disabled={downloading}
            >
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Download Price Data</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.downloadModalContent}>
              <Text style={styles.downloadModalDescription}>
                Select the commodities you want to download. The CSV will include current prices and forecast data.
              </Text>

              <View style={styles.downloadModalActions}>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={() => {
                    if (selectedCommodities.size === priceCommodities.length) {
                      setSelectedCommodities(new Set());
                    } else {
                      setSelectedCommodities(new Set(priceCommodities.map(c => c.name)));
                    }
                  }}
                >
                  <Text style={styles.selectAllButtonText}>
                    {selectedCommodities.size === priceCommodities.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.commodityList}>
                {priceCommodities.map((commodity) => {
                  const isSelected = selectedCommodities.has(commodity.name);
                  return (
                    <TouchableOpacity
                      key={commodity.name}
                      style={[
                        styles.commodityCheckboxItem,
                        isSelected && styles.commodityCheckboxItemSelected
                      ]}
                      onPress={() => {
                        const newSelected = new Set(selectedCommodities);
                        if (isSelected) {
                          newSelected.delete(commodity.name);
                        } else {
                          newSelected.add(commodity.name);
                        }
                        setSelectedCommodities(newSelected);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.commodityCheckbox,
                        isSelected && styles.commodityCheckboxSelected
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={styles.commodityCheckboxInfo}>
                        <Text style={styles.commodityCheckboxName}>
                          {commodity.displayName || commodity.name}
                        </Text>
                        <Text style={styles.commodityCheckboxCategory}>
                          {commodity.category} • ₱{commodity.currentPrice?.toFixed(2) || 'N/A'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.downloadModalFooter}>
                <Text style={styles.selectedCount}>
                  {selectedCommodities.size} of {priceCommodities.length} selected
                </Text>
                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    (selectedCommodities.size === 0 || downloading) && styles.downloadButtonDisabled
                  ]}
                  onPress={handleDownloadCSV}
                  disabled={selectedCommodities.size === 0 || downloading}
                >
                  {downloading ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.downloadButtonText}>Generating CSV...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="download" size={20} color="#fff" />
                      <Text style={styles.downloadButtonText}>Download CSV</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Upload CSV Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!uploading) {
            setShowUploadModal(false);
            setUploadedFile(null);
          }
        }}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity 
              style={styles.detailModalCloseButton}
              onPress={() => {
                if (!uploading) {
                  setShowUploadModal(false);
                  setUploadedFile(null);
                }
              }}
              disabled={uploading}
            >
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Upload Price Data CSV</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.downloadModalContent}>
              <Text style={styles.downloadModalDescription}>
                Upload a CSV file with new price data from DA (Department of Agriculture).{'\n\n'}
                Expected format: commodity,price,date{'\n\n'}
                The CSV should contain current prices that will update the price monitoring data.
              </Text>

              {uploadedFile && (
                <View style={styles.uploadedFileInfo}>
                  <Ionicons name="document" size={24} color={GREEN} />
                  <Text style={styles.uploadedFileName}>{uploadedFile}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  uploading && styles.downloadButtonDisabled
                ]}
                onPress={handleUploadCSV}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.downloadButtonText}>Processing CSV...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.downloadButtonText}>
                      {uploadedFile ? 'Process CSV' : 'Select CSV File'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Farmer Detail Modal */}
      <Modal
        visible={showFarmerDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFarmerDetail(false)}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity 
              style={styles.detailModalCloseButton}
              onPress={() => setShowFarmerDetail(false)}
            >
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Farmer Profile</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {selectedFarmer && (
            <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.farmerDetailCard}>
                <View style={styles.farmerDetailHeader}>
                  <View style={styles.farmerDetailAvatar}>
                    {selectedFarmer.userCropEmoji ? (
                      <Text style={styles.adminFarmerDetailCropEmoji}>{selectedFarmer.userCropEmoji}</Text>
                    ) : (
                    <Ionicons name="person" size={32} color={GREEN} />
                    )}
                  </View>
                  <View style={styles.farmerDetailInfo}>
                    <Text style={styles.farmerDetailName}>{selectedFarmer.userName || 'Unknown'}</Text>
                    <Text style={styles.farmerDetailEmail}>{selectedFarmer.userEmail || 'Unknown'}</Text>
                    <Text style={styles.farmerDetailId}>ID: {selectedFarmer.userId || selectedFarmer.id}</Text>
                  </View>
                </View>
                
                <View style={styles.farmerDetailStats}>
                  <View style={styles.farmerDetailStat}>
                    <Text style={styles.farmerDetailStatLabel}>Forms Completed</Text>
                    <Text style={styles.farmerDetailStatValue}>
                      {selectedFarmer.completedForms || 0} / {selectedFarmer.totalForms || 0}
                    </Text>
                  </View>
                  <View style={styles.farmerDetailStat}>
                    <Text style={styles.farmerDetailStatLabel}>Completion</Text>
                    <Text style={styles.farmerDetailStatValue}>
                      {selectedFarmer.completionPercentage || 0}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Form Sections - Show All Forms (Submitted and Not Submitted) */}
              {selectedFarmer.formData && Object.keys(selectedFarmer.formData).map((key) => {
                const formData = selectedFarmer.formData[key];
                const formTitle = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                return (
                  <View key={key} style={styles.farmerFormSection}>
                    <View style={styles.farmerFormHeader}>
                      <Text style={styles.farmerFormTitle}>{formTitle}</Text>
                      <View style={[
                        styles.formStatusBadge, 
                        formData?.isSubmitted ? styles.formStatusSubmitted : styles.formStatusNotSubmitted
                      ]}>
                        <Text style={[
                          styles.formStatusText,
                          formData?.isSubmitted ? styles.formStatusTextSubmitted : styles.formStatusTextNotSubmitted
                        ]}>
                          {formData?.isSubmitted ? 'SUBMITTED' : 'NOT SUBMITTED'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.farmerFormContent}>
                      {Object.keys(formData).map((fieldKey) => {
                        if (fieldKey === 'isSubmitted') {
                          return null;
                        }

                        const value = formData[fieldKey];
                        const fieldTitle = fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                        // Normalize value for display
                        const isEmpty =
                          value == null ||
                          (Array.isArray(value) && value.length === 0) ||
                          (!Array.isArray(value) &&
                            typeof value === 'object' &&
                            Object.keys(value || {}).length === 0);

                        let displayValue: string = '';

                        if (isEmpty) {
                          displayValue = 'No answer provided';
                        } else if (Array.isArray(value)) {
                          displayValue = value.join(', ');
                        } else if (value && typeof value === 'object') {
                          // For object fields (like *_counts), show key (count) pairs
                          displayValue = Object.entries(value)
                            .map(([k, v]) => {
                              const num = typeof v === 'number' ? v : 0;
                              return num ? `${k} (${num})` : '';
                            })
                            .filter(Boolean)
                            .join(', ');

                          if (!displayValue) {
                            displayValue = '[data]';
                          }
                        } else {
                          displayValue = String(value);
                        }
                        
                        return (
                          <View key={fieldKey} style={styles.farmerFormField}>
                            <Text style={styles.farmerFormFieldLabel}>{fieldTitle}:</Text>
                            <Text
                              style={[
                                styles.farmerFormFieldValue,
                                isEmpty && styles.farmerFormFieldEmpty,
                              ]}
                            >
                              {displayValue}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Forecasting Calendar Modal */}
      {selectedCommodity && (
        <ForecastingCalendar
          visible={forecastModalVisible}
          onClose={() => {
            setForecastModalVisible(false);
            setSelectedCommodity(null);
          }}
          commodity={selectedCommodity.name}
          specification={selectedCommodity.specification}
          currentPrice={selectedCommodity.price}
          unit={selectedCommodity.unit}
        />
      )}

     </View>
   );
 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBorder: {
    height: 35,
    width: '100%',
    backgroundColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Add space for bottom navigation
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 100, // Add space for bottom navigation
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  adminToolsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toolButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  toolsSection: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  farmersRecordsContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 22,
    borderRadius: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 150,
  },
  centeredToolCard: {
    alignSelf: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  wideToolCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 60,
  },
  halfToolCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 60,
  },
  toolIconContainer: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaf7ee',
    borderRadius: 37,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#d7eedb',
  },
  horizontalIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaf7ee',
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#d7eedb',
  },
  toolTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  toolDescription: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
  },
  horizontalTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontalToolTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  horizontalToolDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    fontWeight: '500',
  },
  announcementToolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  announcementToolDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  toolCardPlaceholder: {
    width: '48%',
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomNavTabs: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeNavTab: {
    borderTopWidth: 2,
    borderTopColor: GREEN,
  },
  navTabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeNavTabText: {
    color: GREEN,
    fontWeight: '600',
  },
  pdfUploadContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfUploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pdfUploadDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  pdfFormatInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  pdfFormatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pdfFormatText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  pdfUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  pdfUploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pdfUploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sampleButtonText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GREEN,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
  },
  dataInfo: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  dataInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  dataInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  priceListContainer: {
    marginTop: 20,
  },
  priceListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 5,
  },
  priceListSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  priceItemsContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  priceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  priceItemInfo: {
    flex: 1,
  },
  priceItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  priceItemSection: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  priceItemLine: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  priceItemPrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  priceNA: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  // Profile and Settings Styles
  profileHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminProfileCropEmoji: {
    fontSize: 45,
  },
  adminMessageCropEmoji: {
    fontSize: 20,
  },
  adminContactCropEmoji: {
    fontSize: 24,
  },
  adminFarmerCropEmoji: {
    fontSize: 24,
  },
  adminDetailCropEmoji: {
    fontSize: 24,
  },
  adminRecipientCropEmoji: {
    fontSize: 24,
  },
  adminUserCropEmoji: {
    fontSize: 24,
  },
  adminFarmerDetailCropEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '400',
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    textAlign: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0f2e0',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e0f2e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingContent: {
    flex: 1,
    marginLeft: 20,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  settingDescription: {
    fontSize: 14,
    color: '#555',
    fontWeight: '400',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  iconSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GREEN,
    backgroundColor: '#f8f9fa',
  },
  selectedIcon: {
    backgroundColor: GREEN,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 15,
    backgroundColor: '#fff',
  },
  appUpdateFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 15,
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  updateActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GREEN,
    gap: 6,
    minWidth: 100,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  dangerButton: {
    borderColor: '#c0392b',
    backgroundColor: '#FFF5F5',
  },
  dangerButtonText: {
    color: '#c0392b',
  },
  
  // View All Announcements Modal Styles
  viewModalContainer: {
    backgroundColor: 'white',
    flex: 1,
    margin: 0,
    borderRadius: 0,
  },
  appUpdateBody: {
    flex: 1,
    paddingBottom: 80,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  togglePill: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dde5e1',
    padding: 2,
    justifyContent: 'center',
  },
  togglePillActive: {
    backgroundColor: '#a5d6a7',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleLabel: {
    marginLeft: 10,
    fontSize: 12,
    color: '#555',
    flex: 1,
  },
  updateHistoryItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },
  updateHistoryItemSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: GREEN,
  },
  updateHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  updateHistoryVersion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  updateHistoryBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  updateHistoryBadgeText: {
    fontSize: 10,
    color: '#1B5E20',
    fontWeight: '600',
  },
  updateHistoryMessage: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  updateHistoryMeta: {
    fontSize: 11,
    color: '#888',
  },
  announcementsListContainer: {
    flex: 1,
    padding: 16,
  },
  announcementItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  announcementItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  announcementItemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementItemContent: {
    flex: 1,
  },
  announcementItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  announcementItemDate: {
    fontSize: 14,
    color: '#666',
  },
  announcementItemText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  announcementItemFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  announcementItemId: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    marginLeft: 4,
  },
  // Announcement Detail Styles
  announcementDetailContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  announcementDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  announcementDetailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  announcementDetailContent: {
    flex: 1,
  },
  announcementDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  announcementDetailDate: {
    fontSize: 14,
    color: '#666',
  },
  announcementDetailBody: {
    marginBottom: 16,
  },
  announcementDetailText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  announcementDetailFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  announcementDetailId: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  viewModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // Missing styles for the view modal
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noAnnouncementsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAnnouncementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noAnnouncementsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GREEN,
    flex: 1,
    marginRight: 8,
  },
  refreshButtonText: {
    color: GREEN,
    marginLeft: 8,
    fontWeight: '600',
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'white',
  },
  // New Message Button Styles
  newMessageContainer: {
    marginBottom: 20,
  },
  newMessageButton: {
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Inbox Styles
  inboxContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inboxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 15,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageSender: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Empty Inbox Styles
  emptyInboxContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyInboxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyInboxText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // User Search Styles
  userSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userSearchIcon: {
    marginRight: 8,
  },
  userSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  userClearSearchButton: {
    marginLeft: 8,
    padding: 2,
  },
  // User Management Styles
  userStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  userStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  userManagementListContainer: {
    paddingHorizontal: 16,
  },
  userManagementItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  blockedUserItem: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#e74c3c',
    opacity: 0.8,
  },
  duplicateUserItem: {
    borderLeftColor: '#f39c12',
    backgroundColor: '#fffbf0',
  },
  userManagementItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userManagementAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userManagementCropEmoji: {
    fontSize: 24,
  },
  userManagementItemContent: {
    flex: 1,
  },
  userManagementNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userManagementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  blockedBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  blockedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  duplicateBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  duplicateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userManagementEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userManagementDetails: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  userManagementDate: {
    fontSize: 12,
    color: '#999',
  },
  userManagementActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  userManagementActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#6c757d',
  },
  blockButton: {
    backgroundColor: '#f39c12',
  },
  unblockButton: {
    backgroundColor: '#27ae60',
  },
  userManagementActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  duplicateCheckButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  // Activity Legend Styles
  activityLegendContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activityLegendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  activityLegendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#27ae60',
  },
  inactiveDot: {
    backgroundColor: '#95a5a6',
  },
  noReportsDot: {
    backgroundColor: '#2c3e50',
  },
  activityLegendText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  activityLegendNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  // Activity Status Dot Styles
  userManagementAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  activityStatusDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  activeStatusDot: {
    backgroundColor: '#27ae60',
  },
  inactiveStatusDot: {
    backgroundColor: '#95a5a6',
  },
  noReportsStatusDot: {
    backgroundColor: '#2c3e50',
  },
  // User List Modal Styles
  userItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  userItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userItemContent: {
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userItemEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userItemRole: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  // Compose Message Modal Styles
  composeMessageContainer: {
    flex: 1,
    padding: 20,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  recipientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recipientEmail: {
    fontSize: 14,
    color: '#666',
  },
  messageInputContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  messageTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  composeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  composeCancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  composeCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sendButton: {
    flex: 1,
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Admin Inbox Styles
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshInboxButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  // Chat Interface Styles
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatMessageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  chatBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: {
    backgroundColor: GREEN,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#f1f3f4',
    borderBottomLeftRadius: 4,
  },
  chatMessageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333',
  },
  chatTimestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  sentTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  receivedTimestamp: {
    color: '#666',
    textAlign: 'left',
  },
  chatMessageInfo: {
    marginTop: 4,
    paddingHorizontal: 8,
  },
  chatSenderInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // Contact List Styles
  contactListContainer: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactTime: {
    fontSize: 12,
    color: '#666',
  },
  contactLastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  contactUnreadBadge: {
    backgroundColor: GREEN,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  contactUnreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Chat Header Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backToContactsButton: {
    padding: 8,
    marginRight: 12,
  },
  chatContactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatContactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatContactDetails: {
    flex: 1,
  },
  chatContactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  chatContactEmail: {
    fontSize: 12,
    color: '#666',
  },
  chatOptionsButton: {
    padding: 8,
  },
  // Welcome Header Styles
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  adminLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeaea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  adminLogoutText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  heroSection: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  heroContent: {
    flex: 1,
    marginRight: 0,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  centeredIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  centeredIcon: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  heroDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 25,
  },
  // Records styles
  recordsSection: {
    marginBottom: 30,
  },
  recordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 10,
    flex: 1,
  },
  recordsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusRead: {
    backgroundColor: '#d4edda',
    borderColor: '#74c0fc',
  },
  statusUnread: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  recordFarmer: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginLeft: 6,
  },
  recordEmail: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  recordDetails: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  reportDurationContent: {
    flex: 1,
    marginLeft: 6,
    gap: 2,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  sortContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    fontWeight: '600',
  },
  sortButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  sortChipActive: {
    backgroundColor: '#E8F5E8',
    borderColor: GREEN,
  },
  sortChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: GREEN,
  },
  cropTimelineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 2,
    borderColor: GREEN,
  },
  cropTimelineTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  cropTimelineSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  cropTimelineItemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cropTimelineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e8e8e8',
  },
  cropTimelineName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cropTimelineNameText: {
    marginLeft: 10,
  },
  cropTimelineIcon: {
    fontSize: 24,
  },
  cropTimelineCrop: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.2,
  },
  cropTimelineTagalog: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  cropTimelineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    gap: 4,
  },
  cropTimelineSamples: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  cropTimelineComparisonContainer: {
    gap: 12,
  },
  cropTimelineSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  cropTimelineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  cropTimelineSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.2,
  },
  cropTimelineStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  cropTimelineStatCard: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  cropTimelineStatLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  cropTimelineStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  cropTimelineDeltaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  cropTimelineDeltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    backgroundColor: '#f5f5f5',
  },
  cropTimelineDeltaBadgeOnTime: {
    backgroundColor: '#E8F5E9',
  },
  cropTimelineDeltaBadgeDelay: {
    backgroundColor: '#FFEBEE',
  },
  cropTimelineDeltaBadgeAhead: {
    backgroundColor: '#E8F5E9',
  },
  cropTimelineDeltaBadgeEven: {
    backgroundColor: '#E8F5E9',
  },
  cropTimelineDeltaBadgeGain: {
    backgroundColor: '#E8F5E9',
  },
  cropTimelineDeltaBadgeDrop: {
    backgroundColor: '#FFEBEE',
  },
  cropTimelineDeltaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cropTimelineOnTime: {
    color: '#2E7D32',
  },
  cropTimelineDelay: {
    color: '#C62828',
  },
  cropTimelineAhead: {
    color: '#1B5E20',
  },
  cropTimelineYieldEven: {
    color: '#2E7D32',
  },
  cropTimelineYieldGain: {
    color: '#1B5E20',
  },
  cropTimelineYieldDrop: {
    color: '#C62828',
  },
  cropTimelineEmptyState: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  cropTimelineEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  cropTimelineEmptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  viewRecordsButton: {
    backgroundColor: '#fff',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
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
  viewRecordsButtonTitle: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  viewRecordsButtonSubtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8F5E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryActionTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  secondaryActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
  },
  secondaryActionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  viewAllMessageCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  viewAllAvatar: {
    backgroundColor: '#E8F5E8',
    borderColor: '#C8E6C9',
  },
  viewAllSubtitle: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 2,
  },
  globalTrendsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  globalTrendsHeader: {
    marginBottom: 20,
  },
  globalTrendsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  analyticsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  analyticsLoadingText: {
    fontSize: 16,
    color: '#666',
  },
  barChartContainer: {
    marginBottom: 20,
  },
  barChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  horizontalBarChartWrapper: {
    marginBottom: 10,
  },
  horizontalBarItem: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  horizontalBarItemFirst: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
  },
  horizontalBarItemSecond: {
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
  },
  horizontalBarItemThird: {
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
  },
  horizontalBarSideNumber: {
    position: 'absolute',
    left: -14,
    top: '50%',
    transform: [{ translateY: -14 }],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  horizontalBarSideNumberFirst: {
    backgroundColor: '#fff',
    borderColor: '#d0d0d0',
  },
  horizontalBarSideNumberSecond: {
    backgroundColor: '#fff',
    borderColor: '#d0d0d0',
  },
  horizontalBarSideNumberThird: {
    backgroundColor: '#fff',
    borderColor: '#d0d0d0',
  },
  horizontalBarSideNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  horizontalBarSideNumberTextFirst: {
    color: '#FFD700',
  },
  horizontalBarSideNumberTextSecond: {
    color: '#C0C0C0',
  },
  horizontalBarSideNumberTextThird: {
    color: '#CD7F32',
  },
  horizontalBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 40,
    marginRight: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  rankContainer: {
    width: 50,
    alignItems: 'flex-start',
  },
  horizontalBarRankWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalBarRankFirst: {
    // No background - medals appear without circular container
  },
  horizontalBarRankSecond: {
    // No background - medals appear without circular container
  },
  horizontalBarRankThird: {
    // No background - medals appear without circular container
  },
  horizontalBarRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cropInfoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cropNameRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    minWidth: 120,
  },
  horizontalBarLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  percentageContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  farmerCountContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  horizontalBarPercentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  horizontalBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 40,
    marginRight: 8,
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
  horizontalBarValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  farmersGrowingCard: {
    marginTop: 20,
  },
  farmersGrowingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  notesText: {
    fontSize: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    marginHorizontal: 10,
  },
  dividerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  monthDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 120,
    textAlign: 'center',
  },
  cropIcon: {
    fontSize: 16,
    marginRight: 6,
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
  horizontalBarCropContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalBarCropIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  horizontalBarPercentageWrapper: {
    flex: 1,
    alignItems: 'flex-end',
  },
  horizontalBarValueOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalBarValueOnBar: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  summaryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryStatCard: {
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
    borderColor: '#f0f0f0',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  popularCropCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  popularCropLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  popularCropName: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  analyticsDivider: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  analyticsDividerText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartSection: {
    marginBottom: 20,
  },
  horizontalBarChart: {
    gap: 8,
  },
  horizontalBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  horizontalBarCropName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
    flexShrink: 0,
  },
  cropTagalogName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
    flexShrink: 0,
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
  comparisonContainer: {
    marginTop: 6,
    width: '100%',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
  },
  comparisonValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  comparisonPositive: {
    color: '#2E7D32',
  },
  comparisonNegative: {
    color: '#C62828',
  },
  horizontalBarValue: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  allEntriesList: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  allEntryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  allEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  allEntryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  allEntryIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  allEntryIconEmoji: {
    fontSize: 18,
  },
  allEntryCropTextContainer: {
    flex: 1,
  },
  allEntryCropRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  allEntryCrop: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  allEntryFarmer: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  allEntryDurationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  allEntryDurationColumn: {
    flex: 1,
  },
  allEntryLabel: {
    fontSize: 11,
    color: '#777',
    marginBottom: 2,
  },
  allEntryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  allEntryStatsText: {
    marginTop: 4,
    fontSize: 13,
    color: '#555',
  },
  allEntryDate: {
    marginTop: 2,
    fontSize: 12,
    color: '#999',
  },
  allEntryMetaRow: {
    marginTop: 8,
  },
  allEntryStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  allEntryStatusHarvested: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  allEntryStatusPlanned: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  allEntryStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  allEntryStatusTextHarvested: {
    color: '#1B5E20',
  },
  allEntryStatusTextPlanned: {
    color: '#1565C0',
  },
  farmersList: {
    gap: 12,
  },
  summaryInventoryButton: {
    backgroundColor: GREEN,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryInventoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryInventoryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  summaryContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 20,
  },
  summarySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formBreakdownContainer: {
    gap: 16,
  },
  formBreakdownItem: {
    marginBottom: 4,
  },
  formBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formBreakdownName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  formBreakdownCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  formBreakdownProgressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  formBreakdownProgressFill: {
    height: '100%',
    backgroundColor: GREEN,
    borderRadius: 4,
  },
  formBreakdownPercentage: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  inventoryFormSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FBF7',
    borderWidth: 1,
    borderColor: '#E2F0E8',
  },
  inventoryFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inventoryFormIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  inventoryFormHeaderText: {
    flex: 1,
  },
  inventoryFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  inventoryFormSubtitle: {
    fontSize: 12,
    color: '#55696a',
    marginTop: 2,
  },
  inventoryFieldSection: {
    marginBottom: 18,
  },
  inventoryFieldTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 10,
  },
  breakdownSection: {
    marginBottom: 20,
  },
  breakdownSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  breakdownItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE6DF',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 2,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#607179',
    textAlign: 'center',
    fontWeight: '500',
  },
  farmerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  farmerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  farmerEmail: {
    fontSize: 14,
    color: '#666',
  },
  farmerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  farmerStat: {
    alignItems: 'center',
  },
  farmerStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  farmerStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  farmerDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  farmerDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  farmerDetailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  farmerDetailInfo: {
    flex: 1,
  },
  farmerDetailName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  farmerDetailEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  farmerDetailId: {
    fontSize: 14,
    color: '#999',
  },
  farmerDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  farmerDetailStat: {
    alignItems: 'center',
  },
  farmerDetailStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  farmerDetailStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
  },
  farmerFormSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  farmerFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 12,
  },
  farmerFormContent: {
    gap: 8,
  },
  farmerFormField: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  farmerFormFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    width: 120,
    flexShrink: 0,
  },
  farmerFormFieldValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  farmerFormFieldEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  farmerFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  formStatusSubmitted: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  formStatusNotSubmitted: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  formStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  formStatusTextSubmitted: {
    color: '#2e7d32',
  },
  formStatusTextNotSubmitted: {
    color: '#f57c00',
  },
  completedFormsSummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  completedFormsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  completedFormsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  completedFormItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  completedFormText: {
    fontSize: 10,
    color: '#4caf50',
    marginLeft: 2,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 12,
  },
  summaryStatCardSmall: {
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
    borderColor: '#f0f0f0',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: GREEN,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  recentReportsContainer: {
    marginTop: 20,
  },
  recentReportsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 12,
  },
  recentReportsList: {
    gap: 8,
  },
  recentReportCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  recentReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recentReportType: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  recentReportCrop: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 2,
  },
  recentReportFarmer: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  // Messaging-style interface styles
  messagesList: {
    gap: 12,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageCardUnread: {
    backgroundColor: '#f8fffe',
    borderColor: GREEN,
    borderWidth: 2,
    shadowColor: GREEN,
    shadowOpacity: 0.15,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: GREEN,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  messageMetaInfo: {
    alignItems: 'flex-end',
  },
  messageUnreadBadge: {
    backgroundColor: GREEN,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messageTimeText: {
    fontSize: 11,
    color: '#999',
  },
  messagePreviewContainer: {
    marginTop: 4,
  },
  messagePreviewText: {
    fontSize: 14,
    color: '#666',
  },
  userReportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  reportCardUnread: {
    backgroundColor: '#f8fffe',
    borderColor: GREEN,
    borderWidth: 2,
    shadowColor: GREEN,
    shadowOpacity: 0.15,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
  },
  reportDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportDetails: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  declineReasonText: {
    fontSize: 14,
    color: '#ff6b35',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  reportDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  readIndicator: {
    backgroundColor: GREEN,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  readIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  reportTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reportTapHintText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  // Detailed Report Modal Styles
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailModalCloseButton: {
    padding: 8,
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GREEN,
  },
  detailModalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: GREEN,
  },
  detailUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  detailUserEmail: {
    fontSize: 14,
    color: '#666',
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailStatusRead: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#74c0fc',
  },
  detailStatusUnread: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  detailDurationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  detailDurationText: {
    flex: 1,
    gap: 2,
  },
  detailDeclineReason: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '500',
    fontStyle: 'italic',
    flex: 1,
  },
  detailImageContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  // Admin price monitoring styles
  adminPriceMonitoringContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  adminPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  adminPriceHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    flex: 1,
    textAlign: 'center',
  },
  adminMLRefreshContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  adminMLRefreshButton: {
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  adminMLRefreshButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  adminMLRefreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  adminMLRefreshButtonTextDisabled: {
    color: '#999',
  },
  adminMLRefreshIconSpinning: {
    transform: [{ rotate: '180deg' }],
  },
  adminMLForecastsCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  excelUploadButton: {
    padding: 8,
    marginLeft: 8,
  },
  adminPriceErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffb3b3',
  },
  adminPriceErrorText: {
    fontSize: 14,
    color: '#d63031',
    marginLeft: 8,
    flex: 1,
  },
  adminPriceSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  adminPriceSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminPriceSearchIcon: {
    marginRight: 10,
  },
  adminPriceSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  adminPriceClearButton: {
    padding: 5,
    marginLeft: 10,
  },
  adminPriceFilterButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'space-between',
  },
  adminPriceFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#74bfa3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 0.2,
    justifyContent: 'center',
    minHeight: 44,
    maxHeight: 44,
    minWidth: 50,
  },
  adminPriceFilterButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  adminPriceFilterButtonText: {
    fontSize: 14,
    color: GREEN,
    marginLeft: 6,
    fontWeight: '600',
    flexShrink: 0,
    textAlign: 'center',
  },
  adminPriceFilterButtonTextActive: {
    color: '#fff',
  },
  uploadPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  priceActionButtonsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
    marginBottom: 8,
  },
  priceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 4,
  },
  priceActionButtonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  priceActionButtonContent: {
    flex: 1,
  },
  priceActionButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  priceActionButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  uploadPdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  extractedDataText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  extractedDataCloseButton: {
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  extractedDataCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pasteInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  pasteTextInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  pasteTextLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  productPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  productPickerItemSelected: {
    backgroundColor: '#e8f5e8',
  },
  productPickerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productPickerTextContainer: {
    flex: 1,
  },
  productPickerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPickerItemCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  productPickerItemSpec: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  // Product Search Styles
  productSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  productSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  productSearchIcon: {
    marginRight: 8,
  },
  productSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  productSearchClearButton: {
    padding: 4,
  },
  productSearchNoResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  productSearchNoResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  productSearchNoResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Product Picker Filter Styles
  productPickerFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  productPickerFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#74bfa3',
    flex: 0.48,
    justifyContent: 'center',
  },
  productPickerFilterButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  productPickerFilterButtonText: {
    fontSize: 12,
    color: GREEN,
    marginLeft: 4,
    fontWeight: '500',
  },
  productPickerFilterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  manualInputGroup: {
    marginBottom: 24,
  },
  manualInputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  manualInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  manualProductSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 60,
  },
  manualProductName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  manualProductCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  manualProductSpec: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  manualProductPlaceholder: {
    fontSize: 15,
    color: '#999',
    flex: 1,
  },
  manualAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  manualCurrencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: GREEN,
    marginRight: 8,
  },
  manualAmountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 14,
  },
  manualDateInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  manualDateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 60,
  },
  manualDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  pasteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  pasteCancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  pasteCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  pasteProcessButton: {
    flex: 1,
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteProcessButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminPriceLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  adminPriceLoadingText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
  },
  adminPriceCommodityList: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
    flexGrow: 1,
  },
  adminPriceCommodityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  adminPriceCommodityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adminPriceCommodityInfo: {
    flex: 1,
  },
  adminPriceCommodityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f3d2a',
    marginBottom: 4,
  },
  adminPriceCommodityCategory: {
    fontSize: 14,
    color: '#74bfa3',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminPriceDate: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    marginTop: 1,
  },
  adminPriceSpecification: {
    fontSize: 9,
    color: '#777',
    fontWeight: '500',
    marginTop: 1,
  },
  adminPriceSource: {
    fontSize: 9,
    color: '#888',
    fontWeight: '400',
    marginTop: 1,
  },
  adminPriceContainer: {
    alignItems: 'flex-end',
  },
  adminPriceStatusBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  adminPriceStatusBadgeUnavailable: {
    backgroundColor: '#ffeaea',
  },
  adminPriceStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: GREEN,
  },
  adminPriceStatusTextUnavailable: {
    color: '#d63031',
  },
  adminPriceCurrentPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
  },
  adminPriceUnit: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  adminPriceNoPriceText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  adminPriceChangeContainer: {
    marginBottom: 12,
  },
  adminPriceChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminPriceChangeEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  adminPriceIncrease: {
    backgroundColor: '#e8f5e8',
  },
  adminPriceDecrease: {
    backgroundColor: '#ffeaea',
  },
  adminPriceChangeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: GREEN,
  },
  adminPriceForecastContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  adminPriceForecastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f3d2a',
    marginBottom: 12,
  },
  adminPriceForecastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  adminPriceForecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  adminPriceForecastLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  adminPriceForecastPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  adminPriceTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  adminPriceTrendUp: {
    backgroundColor: '#4caf50',
  },
  adminPriceTrendDown: {
    backgroundColor: '#f44336',
  },
  adminPriceTrendStable: {
    backgroundColor: '#ff9800',
  },
  adminPriceTrendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  adminPriceFactorsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  adminPriceFactorsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f3d2a',
    marginBottom: 4,
  },
  adminPriceFactorText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    lineHeight: 16,
  },
  adminPriceLastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
  adminPriceEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  adminPriceEmptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  adminPriceEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f3d2a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  adminPriceEmptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  adminPriceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  adminPriceModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  adminPriceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  adminPriceModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  adminPriceModalCloseButton: {
    padding: 5,
  },
  adminPriceModalScrollView: {
    maxHeight: 400,
  },
  adminPriceModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  adminPriceModalCategoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  adminPriceModalItemActive: {
    backgroundColor: '#f0f8f0',
  },
  adminPriceModalItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  adminPriceModalItemTextActive: {
    color: GREEN,
    fontWeight: '600',
  },
  // Search page styles - matching the user's search design exactly
  searchPageContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  searchPageBackButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    marginRight: 0,
    padding: 8,
    justifyContent: 'center',
  },
  searchPageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
  },
  searchPageScrollView: {
    flex: 1,
  },
  searchPageScrollContent: {
    paddingBottom: 100,
  },
  searchPageSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchPageSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchPageSearchIcon: {
    marginRight: 12,
  },
  searchPageSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  searchPageClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchPageContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchPageAllFeatures: {
    flex: 1,
  },
  searchPageAllFeaturesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 16,
  },
  searchPageResults: {
    flex: 1,
  },
  searchPageResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 16,
  },
  searchPageFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchPageFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  searchPageFeatureContent: {
    flex: 1,
  },
  searchPageFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 4,
  },
  searchPageFeatureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  searchPageNoResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  searchPageNoResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  searchPageNoResultsDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  highlightsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
    shadowRadius: 4,
    elevation: 3,
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
  // Admin PDF data styles
  adminDataSourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#e8f5e8',
    marginBottom: 10,
  },
  adminDataSourceText: {
    fontSize: 12,
    color: GREEN,
    marginLeft: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  adminCategoryScrollView: {
    maxHeight: 50,
  },
  adminCategoryScrollContent: {
    paddingHorizontal: 8,
  },
  adminCategoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: '#f0f8f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GREEN,
  },
  adminCategoryFilterButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  adminCategoryFilterEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  adminCategoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  adminCategoryFilterTextActive: {
    color: '#fff',
  },
  adminCategoryList: {
    padding: 16,
  },
  adminCategorySection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  adminCategoryEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  adminCategoryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  adminCategoryCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminCategoryItems: {
    padding: 8,
  },
  adminCommodityItem: {
    backgroundColor: '#f8f9fa',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    padding: 12,
  },
  adminCommodityItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminCommodityItemInfo: {
    flex: 1,
  },
  adminCommodityItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  adminCommodityItemSpec: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  adminCommodityItemDate: {
    fontSize: 10,
    color: '#999',
  },
  adminCommodityItemPrice: {
    alignItems: 'flex-end',
  },
  adminCommodityItemPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  adminCommodityItemUnit: {
    fontSize: 12,
    color: '#666',
  },
  // Download Modal Styles
  downloadModalContent: {
    padding: 20,
  },
  downloadModalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  downloadModalActions: {
    marginBottom: 20,
  },
  selectAllButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: LIGHT_GREEN + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GREEN,
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  commodityList: {
    marginBottom: 20,
  },
  commodityCheckboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  commodityCheckboxItemSelected: {
    borderColor: GREEN,
    backgroundColor: LIGHT_GREEN + '10',
  },
  commodityCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  commodityCheckboxSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  commodityCheckboxInfo: {
    flex: 1,
  },
  commodityCheckboxName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  commodityCheckboxCategory: {
    fontSize: 14,
    color: '#666',
  },
  downloadModalFooter: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 20,
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GREEN + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadedFileName: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
});



