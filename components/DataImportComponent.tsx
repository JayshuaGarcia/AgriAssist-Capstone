import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { DataImportService, XLRowData } from '../services/dataImportService';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

interface ImportResult {
  farmersImported: number;
  cropsImported: number;
  livestockImported: number;
  errors: string[];
}

export const DataImportComponent: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{
    farmers?: string;
    crops?: string;
    livestock?: string;
  }>({});

  const pickDocument = async (type: 'farmers' | 'crops' | 'livestock') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setSelectedFiles(prev => ({
        ...prev,
        [type]: result.assets[0].uri
      }));

      Alert.alert('Success', `${type} file selected: ${result.assets[0].name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const parseExcelFile = async (fileUri: string): Promise<XLRowData[]> => {
    try {
      // Read the file content
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Simple CSV parsing (you might want to use a proper Excel parser)
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data: XLRowData[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: XLRowData = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          data.push(row);
        }
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to parse file: ${error}`);
    }
  };

  const importData = async () => {
    if (!selectedFiles.farmers && !selectedFiles.crops && !selectedFiles.livestock) {
      Alert.alert('Error', 'Please select at least one file to import');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const farmersData: XLRowData[] = [];
      const cropsData: XLRowData[] = [];
      const livestockData: XLRowData[] = [];

      // Parse farmers file
      if (selectedFiles.farmers) {
        try {
          const data = await parseExcelFile(selectedFiles.farmers);
          farmersData.push(...data);
        } catch (error) {
          Alert.alert('Error', `Failed to parse farmers file: ${error}`);
          setImporting(false);
          return;
        }
      }

      // Parse crops file
      if (selectedFiles.crops) {
        try {
          const data = await parseExcelFile(selectedFiles.crops);
          cropsData.push(...data);
        } catch (error) {
          Alert.alert('Error', `Failed to parse crops file: ${error}`);
          setImporting(false);
          return;
        }
      }

      // Parse livestock file
      if (selectedFiles.livestock) {
        try {
          const data = await parseExcelFile(selectedFiles.livestock);
          livestockData.push(...data);
        } catch (error) {
          Alert.alert('Error', `Failed to parse livestock file: ${error}`);
          setImporting(false);
          return;
        }
      }

      // Validate data
      const farmersValidation = DataImportService.validateXLData(farmersData, ['name']);
      const cropsValidation = DataImportService.validateXLData(cropsData, ['crop_name']);
      const livestockValidation = DataImportService.validateXLData(livestockData, ['animal_type']);

      if (!farmersValidation.isValid || !cropsValidation.isValid || !livestockValidation.isValid) {
        const allErrors = [
          ...farmersValidation.errors,
          ...cropsValidation.errors,
          ...livestockValidation.errors
        ];
        Alert.alert('Validation Error', `Data validation failed:\n${allErrors.join('\n')}`);
        setImporting(false);
        return;
      }

      // Import data
      const result = await DataImportService.importCompleteDataset(
        farmersData,
        cropsData,
        livestockData
      );

      setImportResult(result);

      if (result.errors.length > 0) {
        Alert.alert(
          'Import Completed with Errors',
          `Imported: ${result.farmersImported} farmers, ${result.cropsImported} crops, ${result.livestockImported} livestock\n\nErrors: ${result.errors.join('\n')}`
        );
      } else {
        Alert.alert(
          'Import Successful',
          `Successfully imported:\n- ${result.farmersImported} farmers\n- ${result.cropsImported} crops\n- ${result.livestockImported} livestock`
        );
      }

    } catch (error) {
      Alert.alert('Import Error', `Failed to import data: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  const clearResults = () => {
    setImportResult(null);
    setSelectedFiles({});
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Import XL Data</ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Select your Excel files to import agricultural data into Firebase
        </ThemedText>

        {/* File Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Files</ThemedText>
          
          <TouchableOpacity
            style={[styles.fileButton, selectedFiles.farmers && styles.fileSelected]}
            onPress={() => pickDocument('farmers')}
          >
            <ThemedText style={styles.fileButtonText}>
              {selectedFiles.farmers ? '✓ Farmers File Selected' : 'Select Farmers File'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fileButton, selectedFiles.crops && styles.fileSelected]}
            onPress={() => pickDocument('crops')}
          >
            <ThemedText style={styles.fileButtonText}>
              {selectedFiles.crops ? '✓ Crops File Selected' : 'Select Crops File'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fileButton, selectedFiles.livestock && styles.fileSelected]}
            onPress={() => pickDocument('livestock')}
          >
            <ThemedText style={styles.fileButtonText}>
              {selectedFiles.livestock ? '✓ Livestock File Selected' : 'Select Livestock File'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Import Button */}
        <TouchableOpacity
          style={[styles.importButton, importing && styles.importButtonDisabled]}
          onPress={importData}
          disabled={importing}
        >
          <ThemedText style={styles.importButtonText}>
            {importing ? 'Importing...' : 'Start Import'}
          </ThemedText>
        </TouchableOpacity>

        {/* Results */}
        {importResult && (
          <View style={styles.resultsSection}>
            <ThemedText style={styles.sectionTitle}>Import Results</ThemedText>
            
            <View style={styles.resultItem}>
              <ThemedText style={styles.resultLabel}>Farmers Imported:</ThemedText>
              <ThemedText style={styles.resultValue}>{importResult.farmersImported}</ThemedText>
            </View>
            
            <View style={styles.resultItem}>
              <ThemedText style={styles.resultLabel}>Crops Imported:</ThemedText>
              <ThemedText style={styles.resultValue}>{importResult.cropsImported}</ThemedText>
            </View>
            
            <View style={styles.resultItem}>
              <ThemedText style={styles.resultLabel}>Livestock Imported:</ThemedText>
              <ThemedText style={styles.resultValue}>{importResult.livestockImported}</ThemedText>
            </View>

            {importResult.errors.length > 0 && (
              <View style={styles.errorsSection}>
                <ThemedText style={styles.errorTitle}>Errors:</ThemedText>
                {importResult.errors.map((error, index) => (
                  <ThemedText key={index} style={styles.errorText}>
                    • {error}
                  </ThemedText>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
              <ThemedText style={styles.clearButtonText}>Clear Results</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  fileButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fileSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  fileButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  importButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  importButtonDisabled: {
    backgroundColor: '#ccc',
  },
  importButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  resultsSection: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  errorsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginBottom: 5,
  },
  clearButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 6,
    marginTop: 15,
  },
  clearButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
}); 