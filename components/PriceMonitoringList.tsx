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
import { CommodityPrice, groupByCategory } from '../services/csvPriceService';
import { PriceDetailModal } from './PriceDetailModal';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

interface PriceMonitoringListProps {
  commodities: CommodityPrice[];
  loading?: boolean;
  showViewAllButton?: boolean;
  onViewAllPress?: () => void;
}

export const PriceMonitoringList: React.FC<PriceMonitoringListProps> = ({
  commodities,
  loading = false,
  showViewAllButton = false,
  onViewAllPress,
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

  const renderCommodityItem = ({ item }: { item: CommodityPrice }) => (
    <TouchableOpacity
      style={styles.commodityCard}
      onPress={() => handleCommodityPress(item)}
      activeOpacity={0.7}
    >
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
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

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
            <Text style={styles.headerTitle}>Price Monitoring</Text>
            {showViewAllButton && onViewAllPress && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={onViewAllPress}
              >
                <Ionicons name="list" size={18} color={GREEN} />
                <Text style={styles.viewAllText}>View All</Text>
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
            <View style={styles.categoryFilter}>
              <TouchableOpacity
                style={[styles.categoryFilterButton, !selectedCategory && styles.activeFilterButton]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryFilterText, !selectedCategory && styles.activeFilterText]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map(category => (
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
          )}
        </View>
      )}

      {/* Commodity List */}
      <FlatList
        data={categories}
        renderItem={renderCategorySection}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GREEN + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
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
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterButton: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
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
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commodityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

