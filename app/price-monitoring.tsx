import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COMMODITY_CATEGORIES, COMMODITY_DATA, Commodity } from '../constants/CommodityData';
import { daPriceService, updateCommodityWithDAPrices } from '../lib/daPriceService';
import { priceMonitoringService } from '../lib/priceMonitoringService';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const DARK_GREEN = '#0f3d2a';
const { width } = Dimensions.get('window');

export default function PriceMonitoringScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [commodities, setCommodities] = React.useState<Commodity[]>(COMMODITY_DATA);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [showCommodityModal, setShowCommodityModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeNav, setActiveNav] = React.useState('tutorial');

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPriceData();
    setRefreshing(false);
  }, []);

  const handleNavigation = (screen: string) => {
    setActiveNav(screen);
    switch (screen) {
      case 'home':
        router.push('/(tabs)');
        break;
      case 'tutorial':
        // Already on price monitoring
        break;
      case 'search':
        // Navigate to search (placeholder for now)
        break;
      case 'profile':
        // Navigate to profile (placeholder for now)
        break;
      default:
        break;
    }
  };

  // Automatically load data when component mounts
  React.useEffect(() => {
    fetchPriceData();
  }, []);

  // Force refresh when component mounts or when commodities change
  React.useEffect(() => {
    if (commodities.length > 0) {
      fetchPriceData();
    }
  }, [commodities.length]);

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🌾 Fetching price data from stored data...');
      
      // First try to get prices from stored data
      const storedPriceData = await priceMonitoringService.getCurrentPrices();
      console.log('🔍 DEBUG: storedPriceData length:', storedPriceData.length);
      console.log('🔍 DEBUG: storedPriceData sample:', storedPriceData.slice(0, 2));
      
      if (storedPriceData.length > 0) {
        console.log('📊 Using stored price data:', storedPriceData.length, 'items');
        console.log('🔍 DEBUG: storedPriceData sample:', storedPriceData.slice(0, 2));
        
        // Update commodities with stored price data
        const updatedCommodities = COMMODITY_DATA.map(commodity => {
          const price = storedPriceData.find(p => p.commodityId === commodity.id);
          
          if (price) {
            return priceMonitoringService.updateCommodityWithPrices(commodity, price);
          }
          return commodity;
        });

        console.log('📊 Updated commodities with stored data:', {
          count: updatedCommodities.length,
          withPrices: updatedCommodities.filter(c => c.currentPrice).length,
          firstCommodity: updatedCommodities[0] ? {
            name: updatedCommodities[0].name,
            category: updatedCommodities[0].category,
            currentPrice: updatedCommodities[0].currentPrice,
            hasPrice: !!updatedCommodities[0].currentPrice
          } : null
        });
        
        setCommodities(updatedCommodities);
        setLastUpdated(new Date().toLocaleTimeString());
        console.log('✅ Successfully updated', updatedCommodities.length, 'commodities with stored data');
        return;
      }
      
      // Fallback to DA service if no stored data
      console.log('📊 No stored data found, falling back to DA service...');
      
      // Fetch current prices from DA service
      const priceData = await daPriceService.getCurrentPrices(COMMODITY_DATA);
      
      // Fetch forecasts from DA service
      const forecastData = await daPriceService.getPriceForecasts(COMMODITY_DATA);
      
      console.log('📊 DA price data received:', priceData.length, 'items');
      console.log('🔮 DA forecast data received:', forecastData.length, 'items');
      
      // Update commodities with DA price data
      const updatedCommodities = commodities.map(commodity => {
        const price = priceData.find(p => p.commodityId === commodity.id);
        const forecast = forecastData.find(f => f.commodityId === commodity.id);
        
        if (price) {
          return updateCommodityWithDAPrices(commodity, price, forecast);
        }
        return commodity;
      });

      console.log('📊 Updated commodities sample:', {
        count: updatedCommodities.length,
        withPrices: updatedCommodities.filter(c => c.currentPrice).length,
        firstCommodity: updatedCommodities[0] ? {
          name: updatedCommodities[0].name,
          category: updatedCommodities[0].category,
          currentPrice: updatedCommodities[0].currentPrice,
          hasPrice: !!updatedCommodities[0].currentPrice
        } : null
      });
      
      setCommodities(updatedCommodities);
      setLastUpdated(new Date().toLocaleTimeString());
      console.log('✅ Successfully updated', updatedCommodities.length, 'commodities with DA data');
    } catch (error: any) {
      setError(error.message || 'Failed to fetch price data');
      console.error('Error fetching price data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommodities = React.useMemo(() => {
    let filtered = commodities;
    
    // Filter by category first
    if (selectedCategory) {
      filtered = filtered.filter(commodity => commodity.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(commodity => 
        commodity.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery, commodities]);

  const renderCommodityItem = ({ item }: { item: Commodity }) => (
    <TouchableOpacity 
      style={[
        styles.commodityCard,
        item.currentPrice ? styles.commodityCardWithPrice : styles.commodityCardNoPrice,
        { backgroundColor: '#ff0000' } // Debug: Red background to make it obvious
      ]}
      onPress={() => {
        console.log('🎯 Commodity card pressed:', item.name);
        Alert.alert('Card Pressed!', `You pressed: ${item.name}`);
        try {
          router.push('/commodity-analytics');
          console.log('✅ Navigation triggered successfully');
        } catch (error) {
          console.error('❌ Navigation error:', error);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.commodityHeader}>
        <View style={styles.commodityInfo}>
          <Text style={styles.commodityName}>{item.name}</Text>
          <Text style={styles.commodityCategory}>{item.category}</Text>
          {item.priceDate && (
            <Text style={styles.priceDate}>📅 {new Date(item.priceDate).toLocaleDateString()}</Text>
          )}
          {item.priceSpecification && (
            <Text style={styles.priceSpecification}>📋 {item.priceSpecification}</Text>
          )}
          {item.priceSource && (
            <Text style={styles.priceSource}>📊 {item.priceSource === 'stored_data' ? 'Stored Data' : item.priceSource}</Text>
          )}
        </View>
        <View style={styles.priceContainer}>
          {item.currentPrice ? (
            <>
              <Text style={styles.currentPrice}>₱{item.currentPrice.toFixed(2)}</Text>
              <Text style={styles.unit}>/{item.unit}</Text>
            </>
          ) : (
            <Text style={styles.noPriceText}>No data</Text>
          )}
        </View>
      </View>
      
      {item.priceChange !== undefined && (
        <View style={styles.priceChangeContainer}>
          <View style={[
            styles.priceChangeBadge,
            item.priceChange >= 0 ? styles.priceIncrease : styles.priceDecrease
          ]}>
            <Ionicons 
              name={item.priceChange >= 0 ? "trending-up" : "trending-down"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.priceChangeText}>
              {item.priceChange >= 0 ? '+' : ''}₱{Math.abs(item.priceChange).toFixed(2)} 
              ({item.priceChangePercent !== undefined && item.priceChangePercent >= 0 ? '+' : ''}{item.priceChangePercent?.toFixed(1) || '0.0'}%)
            </Text>
          </View>
        </View>
      )}

      {item.forecast && (
        <View style={styles.forecastContainer}>
          <Text style={styles.forecastTitle}>📈 Forecast</Text>
          <View style={styles.forecastGrid}>
            <View style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>Next Week</Text>
              <Text style={styles.forecastPrice}>₱{item.forecast?.nextWeek?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>Next Month</Text>
              <Text style={styles.forecastPrice}>₱{item.forecast?.nextMonth?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
          <View style={[
            styles.trendBadge,
            item.forecast.trend === 'up' ? styles.trendUp : 
            item.forecast.trend === 'down' ? styles.trendDown : styles.trendStable
          ]}>
            <Ionicons 
              name={
                item.forecast.trend === 'up' ? 'arrow-up' :
                item.forecast.trend === 'down' ? 'arrow-down' : 'remove'
              } 
              size={12} 
              color="#fff" 
            />
            <Text style={styles.trendText}>
              {item.forecast.trend.toUpperCase()} TREND ({item.forecast.confidence}%)
            </Text>
          </View>
          
          {item.forecast.factors && item.forecast.factors.length > 0 && (
            <View style={styles.factorsContainer}>
              <Text style={styles.factorsTitle}>Key Factors:</Text>
              {item.forecast.factors.slice(0, 3).map((factor, index) => (
                <Text key={index} style={styles.factorText}>• {factor}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {item.lastUpdated && (
        <Text style={styles.lastUpdated}>Updated: {item.lastUpdated}</Text>
      )}
    </TouchableOpacity>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterButtonsContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedCategory === null && styles.filterButtonActive
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Ionicons 
          name="apps" 
          size={20} 
          color={selectedCategory === null ? "#fff" : GREEN} 
        />
        <Text style={[
          styles.filterButtonText,
          selectedCategory === null && styles.filterButtonTextActive
        ]}>
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedCategory !== null && styles.filterButtonActive
        ]}
        onPress={() => setShowCommodityModal(true)}
      >
        <Ionicons 
          name="basket" 
          size={20} 
          color={selectedCategory !== null ? "#fff" : GREEN} 
        />
        <Text style={[
          styles.filterButtonText,
          selectedCategory !== null && styles.filterButtonTextActive
        ]}>
          {selectedCategory || 'Commodities'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a product..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCommodityModal = () => (
    <Modal
      visible={showCommodityModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCommodityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Commodity</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCommodityModal(false)}
            >
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {Object.values(COMMODITY_CATEGORIES).map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.modalItem,
                  selectedCategory === category && styles.modalItemActive
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCommodityModal(false);
                }}
              >
                <Ionicons 
                  name={
                    category === 'KADIWA RICE-FOR-ALL' ? 'leaf' :
                    category === 'IMPORTED COMMERCIAL RICE' ? 'leaf' :
                    category === 'LOCAL COMMERCIAL RICE' ? 'leaf' :
                    category === 'CORN' ? 'flower' :
                    category === 'FISH' ? 'fish' :
                    category === 'LIVESTOCK & POULTRY PRODUCTS' ? 'restaurant' :
                    category === 'LOWLAND VEGETABLES' ? 'nutrition' :
                    category === 'HIGHLAND VEGETABLES' ? 'nutrition' :
                    category === 'SPICES' ? 'flame' :
                    category === 'FRUITS' ? 'happy' : 'basket'
                  }
                  size={20} 
                  color={selectedCategory === category ? "#fff" : GREEN} 
                />
                <Text style={[
                  styles.modalItemText,
                  selectedCategory === category && styles.modalItemTextActive
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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PRICE MONITORING - TEST</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchPriceData}
            disabled={loading}
          >
            <Ionicons 
              name={loading ? "hourglass" : "refresh"} 
              size={24} 
              color={loading ? LIGHT_GREEN : GREEN} 
            />
          </TouchableOpacity>
        </View>

        {/* Last Updated Info */}
        {lastUpdated && (
          <View style={styles.updateInfo}>
            <Ionicons name="time" size={16} color={LIGHT_GREEN} />
            <Text style={styles.updateText}>Last updated: {lastUpdated}</Text>
          </View>
        )}
        
        {/* Data Source Info */}
            <View style={styles.dataSourceInfo}>
              <Ionicons name="library" size={16} color={LIGHT_GREEN} />
              <Text style={styles.dataSourceText}>Data Source: DA Philippines Weekly Average Retail Prices (Seasonal Forecasts)</Text>
            </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Search Bar */}
        {renderSearchBar()}

        {/* Filter Buttons */}
        {renderFilterButtons()}
        
        {/* Commodity Selection Modal */}
        {renderCommodityModal()}

        {/* Main Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={styles.loadingText}>Fetching latest prices...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Refresh Button */}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => fetchPriceData()}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Refresh Prices</Text>
            </TouchableOpacity>
            
            <FlatList
              data={filteredCommodities}
              renderItem={renderCommodityItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commodityList}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[GREEN]}
                  tintColor={GREEN}
                />
              }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search" size={60} color={LIGHT_GREEN} />
                <Text style={styles.emptyTitle}>No commodities found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim() 
                    ? `No products found matching "${searchQuery}"`
                    : selectedCategory 
                      ? `No commodities found in ${selectedCategory} category`
                      : 'Try selecting a different category or check your internet connection.'
                  }
                </Text>
              </View>
            }
          />
          </View>
        )}
      </View>
      
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeNav === 'home' && styles.activeNavItem]} 
          onPress={() => handleNavigation('home')}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeNav === 'home' ? GREEN : '#666'} 
          />
          <Text style={[
            styles.navText, 
            activeNav === 'home' && styles.activeNavText
          ]}>
            Home
          </Text>
        </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, activeNav === 'tutorial' && styles.activeNavItem]} 
        onPress={() => handleNavigation('tutorial')}
      >
        <Ionicons 
          name="trending-up" 
          size={24} 
          color={activeNav === 'tutorial' ? GREEN : '#666'} 
        />
        <Text style={[
          styles.navText, 
          activeNav === 'tutorial' && styles.activeNavText
        ]}>
          Price Monitoring
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, activeNav === 'search' && styles.activeNavItem]} 
        onPress={() => handleNavigation('search')}
      >
        <Ionicons 
          name="search" 
          size={24} 
          color={activeNav === 'search' ? GREEN : '#666'} 
        />
        <Text style={[
          styles.navText, 
          activeNav === 'search' && styles.activeNavText
        ]}>
          Search
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navItem, activeNav === 'profile' && styles.activeNavItem]} 
        onPress={() => handleNavigation('profile')}
      >
        <Ionicons 
          name="person" 
          size={24} 
          color={activeNav === 'profile' ? GREEN : '#666'} 
        />
        <Text style={[
          styles.navText, 
          activeNav === 'profile' && styles.activeNavText
        ]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8f5',
    paddingBottom: 80, // Add padding to account for bottom navigation
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    flex: 1,
    textAlign: 'center',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#f0f8f0',
  },
  updateText: {
    fontSize: 12,
    color: LIGHT_GREEN,
    marginLeft: 6,
    fontWeight: '500',
  },
  dataSourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f0f8f0',
  },
  dataSourceText: {
    fontSize: 11,
    color: GREEN,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorContainer: {
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
  errorText: {
    fontSize: 14,
    color: '#d63031',
    marginLeft: 8,
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f0f8f5',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: '#e8f5e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
    marginLeft: 10,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f0f8f5',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: LIGHT_GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    flex: 0.48,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  filterButtonText: {
    fontSize: 16,
    color: GREEN,
    marginLeft: 8,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemActive: {
    backgroundColor: '#f0f8f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalItemTextActive: {
    color: GREEN,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  commodityList: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  commodityCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e8f5e8',
    marginHorizontal: 5,
  },
  commodityCardWithPrice: {
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  commodityCardNoPrice: {
    borderColor: '#ffcccb',
    borderWidth: 2,
    backgroundColor: '#fff8f8',
  },
  commodityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commodityInfo: {
    flex: 1,
  },
  commodityName: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK_GREEN,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  commodityCategory: {
    fontSize: 14,
    color: LIGHT_GREEN,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  priceSpecification: {
    fontSize: 11,
    color: '#777',
    fontWeight: '500',
    marginTop: 1,
  },
  priceSource: {
    fontSize: 11,
    color: '#888',
    fontWeight: '400',
    marginTop: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: GREEN,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  unit: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  noPriceText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  priceChangeContainer: {
    marginBottom: 12,
  },
  priceChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priceIncrease: {
    backgroundColor: '#e8f5e8',
  },
  priceDecrease: {
    backgroundColor: '#ffeaea',
  },
  priceChangeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: GREEN,
  },
  forecastContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GREEN,
    marginBottom: 12,
  },
  forecastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  forecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  forecastPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  trendUp: {
    backgroundColor: '#4caf50',
  },
  trendDown: {
    backgroundColor: '#f44336',
  },
  trendStable: {
    backgroundColor: '#ff9800',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  factorsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  factorsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_GREEN,
    marginBottom: 4,
  },
  factorText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    lineHeight: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_GREEN,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavText: {
    color: GREEN,
    fontWeight: '600',
  },
});
