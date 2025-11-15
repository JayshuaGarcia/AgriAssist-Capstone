import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommodityPrice, ForecastRecord, groupByCategory } from '../services/csvPriceService';
import { PriceDetailModal } from './PriceDetailModal';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

interface PriceMonitoringListProps {
  commodities: CommodityPrice[];
  loading?: boolean;
  showViewAllButton?: boolean;
  onViewAllPress?: () => void;
  onUploadPress?: () => void;
}

export const PriceMonitoringList: React.FC<PriceMonitoringListProps> = ({
  commodities,
  loading = false,
  showViewAllButton = false,
  onViewAllPress,
  onUploadPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityPrice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Group by category
  const categorized = useMemo(() => groupByCategory(commodities), [commodities]);

  // Get unique categories
  const categories = useMemo(() => Object.keys(categorized).sort(), [categorized]);

  // Filter commodities
  const filteredCommodities = useMemo(() => {
    let filtered = commodities;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.displayName.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [commodities, selectedCategory, searchQuery]);

  // Group filtered results
  const filteredCategorized = useMemo(
    () => groupByCategory(filteredCommodities),
    [filteredCommodities]
  );

  const formatPrice = (price: number) => {
    return `₱${price.toFixed(2)}`;
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return '#e74c3c';
      case 'down':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const handleCommodityPress = async (commodity: CommodityPrice) => {
    setSelectedCommodity(commodity);
    setModalVisible(true);
  };

  // Calculate next week and next month forecasts
  const getForecastPrices = (item: CommodityPrice) => {
    if (!item.forecastData || item.forecastData.length === 0) {
      return { nextWeek: null, nextMonth: null };
    }

    const today = new Date();
    const nextWeekDate = new Date(today);
    nextWeekDate.setDate(today.getDate() + 7);
    const nextMonthDate = new Date(today);
    nextMonthDate.setDate(today.getDate() + 30);

    // Find closest forecast dates
    const findClosestForecast = (targetDate: Date) => {
      let closest: ForecastRecord | null = null;
      let minDiff = Infinity;

      item.forecastData!.forEach(forecast => {
        const forecastDate = new Date(forecast.date);
        const diff = Math.abs(forecastDate.getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closest = forecast;
        }
      });

      return closest?.forecast || null;
    };

    return {
      nextWeek: findClosestForecast(nextWeekDate),
      nextMonth: findClosestForecast(nextMonthDate),
    };
  };

  const renderCommodityItem = ({ item }: { item: CommodityPrice }) => {
    const forecasts = getForecastPrices(item);
    const hasForecast = forecasts.nextWeek !== null || forecasts.nextMonth !== null;

    return (
      <TouchableOpacity
        style={styles.commodityCard}
        onPress={() => handleCommodityPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.commodityCardContent}>
          <View style={styles.commodityContent}>
            <View style={styles.commodityInfo}>
              <Text style={styles.commodityName}>{item.displayName}</Text>
              <Text style={styles.commodityCategory}>{item.category}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.commodityPrice}>{formatPrice(item.currentPrice)}</Text>
              {item.trend && (
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={getTrendIcon(item.trend) as any}
                    size={16}
                    color={getTrendColor(item.trend)}
                  />
                  {item.changePercent !== undefined && item.changePercent !== 0 && (
                    <Text style={[styles.changeText, { color: getTrendColor(item.trend) }]}>
                      {Math.abs(item.changePercent).toFixed(1)}%
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Forecast Section */}
          {hasForecast && (
            <View style={styles.forecastContainer}>
              <Text style={styles.forecastTitle}>📈 Forecast</Text>
              <View style={styles.forecastGrid}>
                {forecasts.nextWeek !== null && (
                  <View style={styles.forecastItem}>
                    <Text style={styles.forecastLabel}>Next Week</Text>
                    <Text style={styles.forecastPrice}>₱{forecasts.nextWeek.toFixed(2)}</Text>
                  </View>
                )}
                {forecasts.nextMonth !== null && (
                  <View style={styles.forecastItem}>
                    <Text style={styles.forecastLabel}>Next Month</Text>
                    <Text style={styles.forecastPrice}>₱{forecasts.nextMonth.toFixed(2)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevronIcon} />
      </TouchableOpacity>
    );
  };

  const renderCategorySection = ({ item: category }: { item: string }) => {
    const categoryCommodities = filteredCategorized[category] || [];
    if (categoryCommodities.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <Text style={styles.categoryCount}>({categoryCommodities.length})</Text>
        </View>
        {categoryCommodities.map((commodity, index) => (
          <View key={index}>{renderCommodityItem({ item: commodity })}</View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingText}>Loading price data...</Text>
      </View>
    );
  }

  if (commodities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="pricetag-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Price Data Available</Text>
        <Text style={styles.emptyText}>
          Price monitoring data will appear here once available.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with View All Button */}
      {(showViewAllButton || categories.length > 0) && (
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {onUploadPress && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={onUploadPress}
              >
                <Ionicons name="add" size={24} color={GREEN} />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Price Monitoring</Text>
            {showViewAllButton && onViewAllPress && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={onViewAllPress}
              >
                <Ionicons name="download" size={20} color={GREEN} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search commodities..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filters */}
          {categories.length > 0 && (
            <View style={styles.categoryFilterContainer}>
              <View style={styles.categoryFilterRow}>
                <TouchableOpacity
                  style={[styles.categoryFilterButton, !selectedCategory && styles.activeFilterButton]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[styles.categoryFilterText, !selectedCategory && styles.activeFilterText]}>
                    All
                  </Text>
                </TouchableOpacity>
                {categories.slice(0, 2).map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryFilterButton,
                      selectedCategory === category && styles.activeFilterButton,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryFilterText,
                        selectedCategory === category && styles.activeFilterText,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {categories.length > 2 && (
                <View style={styles.categoryFilterRow}>
                  {categories.slice(2, 5).map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryFilterButton,
                        selectedCategory === category && styles.activeFilterButton,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.categoryFilterText,
                          selectedCategory === category && styles.activeFilterText,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {/* Fill empty slots if less than 3 in second row */}
                  {categories.slice(2, 5).length < 3 && (
                    <View style={[styles.categoryFilterButton, styles.categoryFilterButtonEmpty]} />
                  )}
                  {categories.slice(2, 5).length < 2 && (
                    <View style={[styles.categoryFilterButton, styles.categoryFilterButtonEmpty]} />
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Commodity List */}
      <FlatList
        data={categories}
        renderItem={renderCategorySection}
        keyExtractor={(item) => item}
        contentContainerStyle={[styles.listContent, { paddingBottom: 95 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filter criteria.
            </Text>
          </View>
        }
      />

      {/* Price Detail Modal */}
      <PriceDetailModal
        visible={modalVisible}
        commodity={selectedCommodity}
        onClose={() => {
          setModalVisible(false);
          setSelectedCommodity(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    zIndex: 0,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LIGHT_GREEN + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: 44,
    height: 44,
    zIndex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LIGHT_GREEN + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: 44,
    height: 44,
    zIndex: 1,
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  categoryFilterContainer: {
    marginTop: 4,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  categoryFilterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  categoryFilterButtonEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  activeFilterButton: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginRight: 8,
  },
  categoryCount: {
    fontSize: 14,
    color: '#999',
  },
  commodityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commodityCardContent: {
    flex: 1,
  },
  commodityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevronIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  commodityInfo: {
    flex: 1,
  },
  commodityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  commodityCategory: {
    fontSize: 12,
    color: '#999',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  commodityPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  forecastContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  forecastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  forecastGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  forecastItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  forecastLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  forecastPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
  },
});


