import { useEffect, useState } from 'react';
import { FirebaseMLService, MLPrediction, PriceHistoryRecord } from '../services/firebaseMLService';

// Hook for getting ML predictions
export const useMLPredictions = () => {
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FirebaseMLService.getLatestMLPredictions();
      setPredictions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ML predictions');
      console.error('Error fetching ML predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const runNewPredictions = async (): Promise<{
    success: boolean;
    message: string;
    predictions?: MLPrediction[];
  }> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🤖 Running new ML predictions...');
      const newPredictions = await FirebaseMLService.runMLPredictionForAllCommodities();
      
      if (newPredictions.length > 0) {
        setPredictions(newPredictions);
        const message = `✅ Generated ${newPredictions.length} ML predictions!\n\n📊 Predictions include:\n• Next week forecasts\n• Confidence scores\n• Trend analysis\n• Market factors`;
        
        return {
          success: true,
          message,
          predictions: newPredictions
        };
      } else {
        const message = '⚠️ No predictions generated. Please add more price history data first.';
        return {
          success: false,
          message
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error running ML predictions:', err);
      
      return {
        success: false,
        message: `❌ Failed to generate predictions: ${errorMessage}`
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    predictions,
    loading,
    error,
    runNewPredictions,
    refetch: fetchPredictions
  };
};

// Hook for getting price history for a specific commodity
export const usePriceHistory = (commodityName: string) => {
  const [history, setHistory] = useState<PriceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (commodityName) {
      fetchHistory();
    }
  }, [commodityName]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await FirebaseMLService.getPriceHistory(commodityName);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price history');
      console.error('Error fetching price history:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
};

// Hook for adding price history
export const usePriceHistoryManagement = () => {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPriceHistory = async (record: Omit<PriceHistoryRecord, 'id' | 'createdAt'>): Promise<{
    success: boolean;
    message: string;
    id?: string;
  }> => {
    try {
      setAdding(true);
      setError(null);
      
      const id = await FirebaseMLService.addPriceHistory(record);
      
      return {
        success: true,
        message: '✅ Price history added successfully!',
        id
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error adding price history:', err);
      
      return {
        success: false,
        message: `❌ Failed to add price history: ${errorMessage}`
      };
    } finally {
      setAdding(false);
    }
  };

  return {
    addPriceHistory,
    adding,
    error
  };
};

export default {
  useMLPredictions,
  usePriceHistory,
  usePriceHistoryManagement
};
