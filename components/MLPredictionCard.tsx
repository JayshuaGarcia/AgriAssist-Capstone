import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MLPrediction } from '../services/firebaseMLService';

interface MLPredictionCardProps {
  prediction: MLPrediction;
  onPress?: () => void;
}

export const MLPredictionCard: React.FC<MLPredictionCardProps> = ({ prediction, onPress }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'trending-flat';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4CAF50';
    if (confidence >= 60) return '#FF9800';
    return '#F44336';
  };

  const priceChange = prediction.predictedPrice - prediction.currentPrice;
  const priceChangePercent = (priceChange / prediction.currentPrice) * 100;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.commodityInfo}>
          <Text style={styles.commodityName}>{prediction.commodityName}</Text>
          <Text style={styles.category}>{prediction.category}</Text>
          {prediction.type && (
            <Text style={styles.type}>🏷️ {prediction.type}</Text>
          )}
          {prediction.specification && (
            <Text style={styles.specification}>📝 {prediction.specification}</Text>
          )}
        </View>
        <View style={styles.confidenceContainer}>
          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(prediction.confidence) }]}>
            <Text style={styles.confidenceText}>{prediction.confidence}%</Text>
          </View>
        </View>
      </View>

      {/* Price Information */}
      <View style={styles.priceSection}>
        <View style={styles.currentPriceContainer}>
          <Text style={styles.currentPriceLabel}>Current Price</Text>
          <Text style={styles.currentPrice}>₱{prediction.currentPrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.predictedPriceContainer}>
          <Text style={styles.predictedPriceLabel}>Predicted Price</Text>
          <Text style={styles.predictedPrice}>₱{prediction.predictedPrice.toFixed(2)}</Text>
        </View>
      </View>

      {/* Price Change */}
      <View style={styles.priceChangeContainer}>
        <View style={styles.priceChangeInfo}>
          <Ionicons 
            name={getTrendIcon(prediction.trend)} 
            size={20} 
            color={getTrendColor(prediction.trend)} 
          />
          <Text style={[styles.priceChangeText, { color: getTrendColor(prediction.trend) }]}>
            {priceChange >= 0 ? '+' : ''}₱{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%)
          </Text>
        </View>
        <Text style={styles.trendText}>Trend: {prediction.trend.toUpperCase()}</Text>
      </View>

      {/* Forecasts */}
      <View style={styles.forecastSection}>
        <View style={styles.forecastItem}>
          <Text style={styles.forecastLabel}>📅 Next Week</Text>
          <Text style={styles.forecastPrice}>₱{prediction.nextWeekForecast.toFixed(2)}</Text>
        </View>
        <View style={styles.forecastItem}>
          <Text style={styles.forecastLabel}>📆 Next Month</Text>
          <Text style={styles.forecastPrice}>₱{prediction.nextMonthForecast.toFixed(2)}</Text>
        </View>
      </View>

      {/* Factors */}
      {prediction.factors.length > 0 && (
        <View style={styles.factorsSection}>
          <Text style={styles.factorsTitle}>🎯 Key Factors</Text>
          <View style={styles.factorsContainer}>
            {prediction.factors.map((factor, index) => (
              <View key={index} style={styles.factorTag}>
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          Generated: {prediction.createdAt.toDate().toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commodityInfo: {
    flex: 1,
  },
  commodityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16543a',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  type: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  specification: {
    fontSize: 12,
    color: '#888',
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currentPriceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  currentPriceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16543a',
  },
  predictedPriceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  predictedPriceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  predictedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  priceChangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceChangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChangeText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  trendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  forecastSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  forecastItem: {
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  forecastPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  factorsSection: {
    marginBottom: 12,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16543a',
    marginBottom: 8,
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  factorTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  factorText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
});

export default MLPredictionCard;





