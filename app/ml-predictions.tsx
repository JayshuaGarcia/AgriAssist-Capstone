import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { MLPredictionCard } from '../components/MLPredictionCard';
import { useMLPredictions } from '../hooks/useMLPredictions';
import { MLPrediction } from '../services/firebaseMLService';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const DARK_GREEN = '#0f3d2a';
const { width } = Dimensions.get('window');

export default function MLPredictionsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { predictions, loading, error, runNewPredictions } = useMLPredictions();

  const onRefresh = async () => {
    setRefreshing(true);
    const result = await runNewPredictions();
    if (result.success) {
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
    setRefreshing(false);
  };

  const handleRunPredictions = async () => {
    Alert.alert(
      'Generate ML Predictions',
      'This will analyze all price history data and generate new predictions. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: async () => {
            const result = await runNewPredictions();
            if (result.success) {
              Alert.alert('Success', result.message);
            } else {
              Alert.alert('Error', result.message);
            }
          }
        }
      ]
    );
  };

  const filteredPredictions = predictions.filter(prediction => {
    const matchesSearch = prediction.commodityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prediction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (prediction.type && prediction.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (prediction.specification && prediction.specification.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || prediction.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(predictions.map(p => p.category))).sort();

  const renderPredictionItem = ({ item }: { item: MLPrediction }) => (
    <MLPredictionCard 
      prediction={item}
      onPress={() => {
        // Navigate to detailed view or analytics
        console.log('Prediction card pressed:', item.commodityName);
      }}
    />
  );

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      <TouchableOpacity
        style={[styles.categoryButton, !selectedCategory && styles.categoryButtonActive]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text style={[styles.categoryButtonText, !selectedCategory && styles.categoryButtonTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextActive]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
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
        <Text style={styles.headerTitle}>🤖 ML PRICE PREDICTIONS 📈</Text>
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={handleRunPredictions}
        >
          <Ionicons name="refresh" size={24} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search commodities, types, specifications..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{predictions.length}</Text>
          <Text style={styles.statLabel}>Total Predictions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {predictions.filter(p => p.confidence >= 80).length}
          </Text>
          <Text style={styles.statLabel}>High Confidence</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {predictions.filter(p => p.trend === 'up').length}
          </Text>
          <Text style={styles.statLabel}>Rising Trends</Text>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>🤖 Loading ML predictions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorTitle}>Error Loading Predictions</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPredictions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🤖</Text>
          <Text style={styles.emptyTitle}>No Predictions Found</Text>
          <Text style={styles.emptyMessage}>
            {predictions.length === 0 
              ? "No ML predictions available. Tap the refresh button to generate predictions from your price history data."
              : "No predictions match your search criteria. Try adjusting your filters."
            }
          </Text>
          {predictions.length === 0 && (
            <TouchableOpacity style={styles.generateButtonLarge} onPress={handleRunPredictions}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.generateButtonText}>Generate Predictions</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPredictions}
          renderItem={renderPredictionItem}
          keyExtractor={(item) => `${item.commodityId}-${item.type || 'default'}-${item.specification || 'default'}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
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
    height: 4,
    backgroundColor: GREEN,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    flex: 1,
    textAlign: 'center',
  },
  generateButton: {
    padding: 8,
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  categoryFilter: {
    marginVertical: 8,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: GREEN,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  generateButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

