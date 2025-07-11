import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';

const GREEN = '#16543a';

// Define all app features with their navigation paths and categories
const APP_FEATURES = [
  // Main Features
  { id: 'home', title: 'Home Dashboard', path: '/', category: 'Main', icon: 'home' },
  { id: 'explore', title: 'Explore', path: './explore', category: 'Main', icon: 'map-search' },
  { id: 'farmers', title: 'Farmers Management', path: './farmers', category: 'Main', icon: 'account-group' },
  { id: 'analytics', title: 'Analytics & Forecasting', path: './analytics', category: 'Main', icon: 'chart-line' },
  { id: 'monitoring', title: 'Monitoring', path: './monitoring', category: 'Main', icon: 'monitor-dashboard' },
  { id: 'operations', title: 'Operations', path: './operations', category: 'Main', icon: 'tractor' },
  { id: 'forms', title: 'Forms & Templates', path: './forms', category: 'Main', icon: 'file-document' },
  { id: 'notifications', title: 'Notifications & Calendar', path: './notifications', category: 'Main', icon: 'bell' },
  { id: 'data-import', title: 'Data Import', path: './data-import', category: 'Main', icon: 'database-import' },
  
  // Farmers Features
  { id: 'farmer-profiles', title: 'Farmer Profiles', path: './farmers/farmer-profiles-records', category: 'Farmers', icon: 'account-details' },
  { id: 'farmer-profile-form', title: 'Farmer Profile Form', path: './forms/farmer-profile-form', category: 'Farmers', icon: 'account-plus' },
  { id: 'demographics', title: 'Demographics', path: './farmers/demographics', category: 'Farmers', icon: 'chart-pie' },
  { id: 'duplicate-checker', title: 'Duplicate Checker', path: './farmers/duplicate-checker', category: 'Farmers', icon: 'content-duplicate' },
  { id: 'livestock', title: 'Livestock Management', path: './farmers/livestock', category: 'Farmers', icon: 'cow' },
  { id: 'livestock-records', title: 'Livestock Records', path: './farmers/livestock-records', category: 'Farmers', icon: 'clipboard-list' },
  
  // Analytics Features
  { id: 'crop-trend', title: 'Crop Trend Analytics', path: './analytics/crop-trend', category: 'Analytics', icon: 'trending-up' },
  { id: 'comparative-analysis', title: 'Comparative Analysis', path: './analytics/comparative-analysis', category: 'Analytics', icon: 'compare' },
  { id: 'performance-insights', title: 'Performance Insights', path: './analytics/performance-insights', category: 'Analytics', icon: 'lightbulb' },
  { id: 'forecast-tools', title: 'Forecast Tools', path: './analytics/forecast-tools', category: 'Analytics', icon: 'crystal-ball' },
  
  // Monitoring Features
  { id: 'crop-monitoring', title: 'Crop Monitoring', path: './monitoring/crop-monitoring', category: 'Monitoring', icon: 'sprout' },
  { id: 'crop-monitoring-records', title: 'Crop Monitoring Records', path: './monitoring/crop-monitoring-records', category: 'Monitoring', icon: 'clipboard-text' },
  { id: 'fertilizer-logs', title: 'Fertilizer Logs', path: './monitoring/fertilizer-logs', category: 'Monitoring', icon: 'fertilizer' },
  { id: 'fertilizer-logs-records', title: 'Fertilizer Logs Records', path: './monitoring/fertilizer-logs-records', category: 'Monitoring', icon: 'clipboard-list' },
  { id: 'accomplishment-reports', title: 'Accomplishment Reports', path: './monitoring/accomplishment-reports', category: 'Monitoring', icon: 'file-chart' },
  { id: 'accomplishment-reports-records', title: 'Accomplishment Reports Records', path: './monitoring/accomplishment-reports-records', category: 'Monitoring', icon: 'clipboard-text' },
  { id: 'commodity-map', title: 'Commodity Map', path: './monitoring/commodity-map', category: 'Monitoring', icon: 'map-marker' },
  
  // Operations Features
  { id: 'planting-tracker', title: 'Planting Tracker', path: './operations/planting-tracker', category: 'Operations', icon: 'seed' },
  { id: 'planting-tracker-records', title: 'Planting Tracker Records', path: './operations/planting-tracker-records', category: 'Operations', icon: 'clipboard-list' },
  { id: 'harvest-tracker', title: 'Harvest Tracker', path: './operations/harvest-tracker', category: 'Operations', icon: 'basket' },
  { id: 'harvest-tracker-records', title: 'Harvest Tracker Records', path: './operations/harvest-tracker-records', category: 'Operations', icon: 'clipboard-list' },
  { id: 'training-attendance', title: 'Training Attendance', path: './operations/training-attendance', category: 'Operations', icon: 'school' },
  { id: 'photo-gps', title: 'Photo GPS', path: './operations/photo-gps', category: 'Operations', icon: 'camera' },
  
  // Forms Features
  { id: 'annex-e', title: 'Annex E - Farm Suitability', path: './forms/annex-e', category: 'Forms', icon: 'file-check' },
  { id: 'requisition-issue', title: 'Requisition & Issue Slips', path: './forms/requisition-issue', category: 'Forms', icon: 'file-document-edit' },
  
  // Notifications Features
  { id: 'reminders', title: 'Reminders', path: './notifications/reminders', category: 'Notifications', icon: 'alarm' },
  { id: 'seasonal-calendar', title: 'Seasonal Calendar', path: './notifications/seasonal-calendar', category: 'Notifications', icon: 'calendar' },
  { id: 'weather-feed', title: 'Weather Feed', path: './notifications/weather-feed', category: 'Notifications', icon: 'weather-partly-cloudy' },
  
  // Profile Features
  { id: 'profile', title: 'Profile', path: './profile', category: 'Profile', icon: 'account' },
  { id: 'profile-edit', title: 'Edit Profile', path: './profile-edit', category: 'Profile', icon: 'account-edit' },
  { id: 'profile-about', title: 'About', path: './profile-about', category: 'Profile', icon: 'information' },
  { id: 'profile-help', title: 'Help', path: './profile-help', category: 'Profile', icon: 'help-circle' },
  { id: 'profile-notifications', title: 'Notification Settings', path: './profile-notifications', category: 'Profile', icon: 'bell-settings' },
  { id: 'profile-privacy', title: 'Privacy Settings', path: './profile-privacy', category: 'Profile', icon: 'shield' },
  
  // Requests Features
  { id: 'account-requests', title: 'Account Requests', path: './account-requests', category: 'Requests', icon: 'account-clock' },
  { id: 'viewer-requests', title: 'Viewer Requests', path: './viewer-requests', category: 'Requests', icon: 'eye' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('search');
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFeatures, setFilteredFeatures] = useState(APP_FEATURES);
  const [showResults, setShowResults] = useState(false);
  const searchBarRef = useRef(null);
  const [searchBarLayout, setSearchBarLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFeatures(APP_FEATURES);
      setShowResults(false);
    } else {
      const filtered = APP_FEATURES.filter(feature =>
        feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFeatures(filtered);
    }
  }, [searchQuery]);

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        router.replace('/');
        break;
      case 'explore':
        router.replace('./explore');
        break;
      case 'search':
        router.replace('./search');
        break;
      case 'profile':
        router.replace('./profile');
        break;
      default:
        break;
    }
  };

  const handleFeaturePress = (feature: any) => {
    router.push(feature.path);
  };

  const handleSearchButton = () => {
    setShowResults(true);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'home':
      case 'person':
      case 'search-circle':
        return <Ionicons name={iconName as any} size={24} color={GREEN} />;
      default:
        return <MaterialCommunityIcons name={iconName as any} size={24} color={GREEN} />;
    }
  };

  const renderFeatureItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.featureItem}
      onPress={() => handleFeaturePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.featureIcon}>
        {getIconComponent(item.icon)}
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{item.title}</Text>
        <Text style={styles.featureCategory}>{item.category}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderCategoryHeader = ({ item }: { item: any }) => {
    const categoryFeatures = filteredFeatures.filter(f => f.category === item);
    if (categoryFeatures.length === 0) return null;
    
    return (
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{item}</Text>
        <Text style={styles.categoryCount}>{categoryFeatures.length} features</Text>
      </View>
    );
  };

  const getCategories = () => {
    const categories = [...new Set(filteredFeatures.map(f => f.category))];
    return categories.sort();
  };

  const renderSearchResults = (showAll: boolean = true) => {
    if (searchQuery.trim() === '') {
      return (
        <View style={styles.welcomeSection}>
          <MaterialCommunityIcons name="search-web" size={48} color={GREEN} />
          <Text style={styles.welcomeTitle}>Search Features</Text>
          <Text style={styles.welcomeSubtitle}>Find and navigate to any feature in the app</Text>
          
          <View style={styles.popularSearches}>
            <Text style={styles.suggestionsTitle}>Popular Searches</Text>
            <View style={styles.suggestionChips}>
              <TouchableOpacity style={styles.chip} onPress={() => setSearchQuery('Farmers')}>
                <Text style={styles.chipText}>Farmers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chip} onPress={() => setSearchQuery('Analytics')}>
                <Text style={styles.chipText}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chip} onPress={() => setSearchQuery('Monitoring')}>
                <Text style={styles.chipText}>Monitoring</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chip} onPress={() => setSearchQuery('Operations')}>
                <Text style={styles.chipText}>Operations</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    const categories = getCategories();
    const allItems: Array<{ type: 'category' | 'feature'; data: string | any }> = [];
    
    categories.forEach(category => {
      allItems.push({ type: 'category', data: category });
      const categoryFeatures = filteredFeatures.filter(f => f.category === category);
      categoryFeatures.forEach(feature => {
        allItems.push({ type: 'feature', data: feature });
      });
    });

    return (
      <FlatList
        data={allItems}
        keyExtractor={(item, index) => `${item.type}-${typeof item.data === 'string' ? item.data : item.data.id}-${index}`}
        renderItem={({ item }) => 
          item.type === 'category' 
            ? renderCategoryHeader({ item: item.data as string })
            : renderFeatureItem({ item: item.data })
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContainer}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#111" style={{ marginLeft: 12 }} />
          <View
            ref={searchBarRef}
            style={{ flex: 1, position: 'relative' }}
            onLayout={e => setSearchBarLayout(e.nativeEvent.layout)}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Search features..."
              placeholderTextColor="#111"
              value={searchQuery}
              onChangeText={text => { setSearchQuery(text); setShowResults(false); }}
              accessibilityLabel="Search features"
              returnKeyType="search"
              onSubmitEditing={handleSearchButton}
            />
          </View>
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setShowResults(false); }} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchButton}
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      {/* Suggestions Dropdown absolutely positioned below search bar */}
      {/* Removed as per user request */}

      {/* Search Results */}
      <View style={styles.content}>
        {showResults && searchQuery.trim() !== ''
          ? renderSearchResults()
          : renderSearchResults(false)
        }
      </View>

      {/* Custom bottom bar */}
      <View style={styles.customTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('home')} activeOpacity={0.7}>
          <Ionicons name="home" size={28} color={activeTab === 'home' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'home' ? '#111' : '#fff' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('explore')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="map-search" size={28} color={activeTab === 'explore' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'explore' ? '#111' : '#fff' }]}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('search')} activeOpacity={0.7}>
          <Ionicons name="search-circle" size={32} color={activeTab === 'search' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'search' ? '#111' : '#fff' }]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('profile')} activeOpacity={0.7}>
          <Ionicons name="person" size={28} color={activeTab === 'profile' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'profile' ? '#111' : '#fff' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    marginHorizontal: 8,
    height: 40,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 22,
    paddingHorizontal: 12,
    fontSize: 16,
    color: GREEN,
    height: 40,
  },
  clearButton: {
    padding: 4,
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
  content: {
    flex: 1,
    paddingBottom: 80, // Account for bottom tab bar
  },
  welcomeSection: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  popularSearches: {
    width: '100%',
    maxWidth: 400,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureCategory: {
    fontSize: 12,
    color: '#666',
  },
  tabLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  customTabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: GREEN,
    height: 64,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 0,
    zIndex: 100,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsDropdown: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 15,
    color: '#222',
  },
  noResultsText: {
    padding: 16,
    color: '#888',
    textAlign: 'center',
    fontSize: 15,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
}); 