import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import FallbackMLService from '../services/fallbackMLService';
import OfflineMLForecastsService from '../services/offlineMLForecastsService';

const GREEN = '#16543a';

interface MLForecastsInitializerProps {
  onInitializationComplete?: () => void;
}

export const MLForecastsInitializer: React.FC<MLForecastsInitializerProps> = ({ 
  onInitializationComplete 
}) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState<string>('');

  useEffect(() => {
    initializeMLForecasts();
  }, []);

  const initializeMLForecasts = async () => {
    try {
      setIsInitializing(true);
      setInitializationStatus('Checking ML forecasts...');
      
      // Check if we already have ML forecasts
      const existingForecasts = await OfflineMLForecastsService.getMLForecasts();
      
      if (existingForecasts.length > 0) {
        console.log(`✅ Found ${existingForecasts.length} existing ML forecasts`);
        setInitializationStatus(`Found ${existingForecasts.length} ML forecasts`);
        onInitializationComplete?.();
        return;
      }
      
      setInitializationStatus('Generating ML forecasts from existing data...');
      
      // Generate fallback ML forecasts from existing price data
      const fallbackForecasts = await FallbackMLService.generateForecastsFromExistingData();
      
      if (fallbackForecasts.length > 0) {
        console.log(`✅ Generated ${fallbackForecasts.length} fallback ML forecasts`);
        setInitializationStatus(`Generated ${fallbackForecasts.length} ML forecasts`);
      } else {
        console.log('⚠️ No price data available for ML forecasting');
        setInitializationStatus('No price data available for ML forecasting');
      }
      
    } catch (error) {
      console.error('❌ Error initializing ML forecasts:', error);
      setInitializationStatus('Failed to initialize ML forecasts');
    } finally {
      setIsInitializing(false);
      onInitializationComplete?.();
    }
  };

  if (!isInitializing && initializationStatus) {
    return null; // Don't show anything after initialization
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={GREEN} />
      <Text style={styles.statusText}>{initializationStatus}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statusText: {
    marginLeft: 10,
    fontSize: 14,
    color: GREEN,
    fontWeight: '500',
  },
});

export default MLForecastsInitializer;
