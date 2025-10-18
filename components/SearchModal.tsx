import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from './AuthContext';
import { SearchableItem, useSearch } from './SearchContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const INPUT_GREEN = '#f0f8f0';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onItemPress: (item: SearchableItem) => void;
}

export default function SearchModal({ visible, onClose, onItemPress }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableItem[]>([]);
  const { searchItems, searchableItems } = useSearch();
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchItems(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchItems]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleItemPress = (item: SearchableItem) => {
    // Execute the item's action if it exists
    if (item.action) {
      item.action();
    }
    
    // Navigate based on screen
    if (item.screen) {
      switch (item.screen) {
        case 'farmers':
          // Only allow non-admin users to access farmers form
          if (profile.role !== 'admin') {
            router.push('/(tabs)/farmers');
          } else {
            // Redirect admin users to admin page
            router.push('/admin');
          }
          break;
        case 'forecast':
          // Navigate to home and set forecast as active
          router.push('/(tabs)');
          // The home screen will handle setting activeNav to 'forecast'
          break;
        case 'help':
          router.push('/help');
          break;
        case 'privacy':
          router.push('/privacy');
          break;
        case 'about':
          router.push('/about');
          break;
        case 'language':
          router.push('/language');
          break;
        case 'tutorial':
          // Navigate to home and set tutorial as active
          router.push('/(tabs)');
          break;
        case 'settings':
          // Navigate to home and set profile (settings) as active
          router.push('/(tabs)');
          break;
        case 'price-monitoring':
        case 'planting-report':
        case 'harvest-report':
          // Navigate to placeholder screen for features not yet implemented
          router.push(`/feature-placeholder?title=${encodeURIComponent(item.title)}&description=${encodeURIComponent(item.description)}&icon=${encodeURIComponent(item.icon)}`);
          break;
        default:
          console.log(`Navigate to ${item.screen}`);
          break;
      }
    }
    
    onItemPress(item);
    onClose();
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  const renderSearchItem = ({ item }: { item: SearchableItem }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.searchItemIcon}>
        <Ionicons name={item.icon as any} size={24} color={GREEN} />
      </View>
      <View style={styles.searchItemContent}>
        <Text style={styles.searchItemTitle}>{item.title}</Text>
        <Text style={styles.searchItemDescription}>{item.description}</Text>
        <Text style={styles.searchItemCategory}>{item.category}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={60} color="#ccc" />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No results found' : 'Search all features'}
      </Text>
      <Text style={styles.emptyStateDescription}>
        {searchQuery 
          ? `No features match "${searchQuery}"`
          : 'Type to search for features, forms, and tools'
        }
      </Text>
    </View>
  );

  const renderRecentSearches = () => {
    const popularItems = searchableItems.slice(0, 5);
    const categories = [...new Set(searchableItems.map(item => item.category))];
    
    return (
      <View style={styles.recentSearches}>
        <Text style={styles.recentSearchesTitle}>Quick Access</Text>
        
        {/* Popular Items */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Popular Features</Text>
          {popularItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentItem}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.recentItemIcon}>
                <Ionicons name={item.icon as any} size={20} color={GREEN} />
              </View>
              <View style={styles.recentItemContent}>
                <Text style={styles.recentItemText}>{item.title}</Text>
                <Text style={styles.recentItemDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.slice(0, 6).map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryChip}
                onPress={() => setSearchQuery(category)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryChipText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={GREEN} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search features, forms, and tools..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus={true}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {searchQuery.length === 0 ? (
            renderRecentSearches()
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_GREEN,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: GREEN,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
  },
  closeButton: {
    paddingVertical: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: GREEN,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  resultsList: {
    padding: 20,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchItemIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 25,
    marginRight: 15,
  },
  searchItemContent: {
    flex: 1,
  },
  searchItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 5,
  },
  searchItemDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  searchItemCategory: {
    fontSize: 12,
    color: LIGHT_GREEN,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
  recentSearches: {
    padding: 20,
  },
  recentSearchesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 20,
    textAlign: 'center',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentItemIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 20,
    marginRight: 15,
  },
  recentItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 2,
  },
  recentItemContent: {
    flex: 1,
    marginLeft: 15,
  },
  recentItemDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0f2e0',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
});

