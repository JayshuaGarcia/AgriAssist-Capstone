import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ExcelDataUploadService } from '../services/excelDataUploadService';

interface ExcelDataUploaderProps {
  onUploadComplete?: (result: any) => void;
}

export const ExcelDataUploader: React.FC<ExcelDataUploaderProps> = ({ onUploadComplete }) => {
  const [csvData, setCsvData] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadMode, setUploadMode] = useState<'text' | 'file'>('file');
  
  // Progress tracking states
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [processedRecords, setProcessedRecords] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  // React Native compatible base64 conversion
  const arrayBufferToBase64 = async (buffer: ArrayBuffer): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const uint8Array = new Uint8Array(buffer);
        let binary = '';
        
        // Process in smaller chunks to avoid memory issues
        const chunkSize = 8192; // 8KB chunks
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          // Convert chunk to string using Array.from to avoid spread operator issues
          const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
          binary += chunkString;
        }
        
        const base64 = btoa(binary);
        resolve(base64);
      } catch (error) {
        console.error('Base64 conversion error:', error);
        reject(error);
      }
    });
  };

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        console.log('📁 File selected:', file.name);
        
        // Read the file content
        if (file.uri) {
          try {
            console.log('📖 Reading file content...');
            const response = await fetch(file.uri);
            
            // Check if it's an Excel file
            const isExcelFile = file.name.toLowerCase().endsWith('.xlsx') || 
                               file.name.toLowerCase().endsWith('.xls');
            
            if (isExcelFile) {
              console.log('📊 Processing Excel file...');
              // For Excel files, use a React Native compatible approach
              const arrayBuffer = await response.arrayBuffer();
              console.log(`📏 File size: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
              
              // Convert ArrayBuffer to base64 using a React Native compatible method
              const base64String = await arrayBufferToBase64(arrayBuffer);
              
              setCsvData(base64String); // Store base64 for Excel parsing
              console.log('✅ Excel file content loaded as base64 (React Native compatible)');
            } else {
              // For CSV files, get text
              const text = await response.text();
              setCsvData(text);
              console.log('✅ CSV file content loaded as text');
            }
          } catch (error) {
            console.error('Error reading file:', error);
            Alert.alert('Error', `Could not read the selected file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to select file.');
    }
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && !selectedFile) {
      Alert.alert('Error', 'Please select an Excel/CSV file first.');
      return;
    }
    
    if (uploadMode === 'text' && !csvData.trim()) {
      Alert.alert('Error', 'Please paste your Excel/CSV data first.');
      return;
    }

    setUploading(true);
    setShowProgressModal(true);
    setUploadProgress(0);
    setProcessedRecords(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setCurrentStep('Initializing upload...');
    
    try {
      console.log('🚀 Starting Excel data upload...');
      setCurrentStep('📖 Reading and parsing data...');
      setUploadProgress(0.1);
      
      // Check if it's an Excel file (base64) or CSV text
      const isExcelFile = selectedFile && (
        selectedFile.name.toLowerCase().endsWith('.xlsx') || 
        selectedFile.name.toLowerCase().endsWith('.xls')
      );
      
      // Parse data first to get total count
      let parsedData;
      if (isExcelFile) {
        console.log('📊 Detected Excel file, using binary parser...');
        parsedData = ExcelDataUploadService.parseExcelBinaryData(csvData);
      } else {
        console.log('📄 Detected CSV file, using text parser...');
        parsedData = ExcelDataUploadService.parseExcelData(csvData);
      }
      
      const processedData = ExcelDataUploadService.processExcelData(parsedData);
      
      setTotalRecords(processedData.length);
      setTotalBatches(Math.ceil(processedData.length / 100));
      setCurrentStep('📦 Preparing data for upload...');
      setUploadProgress(0.2);
      
      // Upload with progress tracking
      const result = await ExcelDataUploadService.uploadExcelDataWithProgress(
        csvData,
        (progress) => {
          try {
            const safeProgress = Math.max(0, Math.min(1, progress.progress || 0));
            setUploadProgress(0.2 + (safeProgress * 0.8)); // 20% to 100%
            setCurrentStep(`📤 Uploading batch ${progress.batch || 0}/${progress.totalBatches || 0}...`);
            setProcessedRecords(progress.uploaded || 0);
            setCurrentBatch(progress.batch || 0);
          } catch (error) {
            console.error('Progress callback error:', error);
          }
        },
        isExcelFile // Pass the Excel file flag
      );
      
      setCurrentStep('✅ Upload completed!');
      setUploadProgress(1.0);
      
      // Wait a moment to show completion
      setTimeout(() => {
        setShowProgressModal(false);
        
        if (result.success) {
          Alert.alert(
            'Success! 🎉',
            `${result.message}\n\n📊 Uploaded: ${result.uploaded} records\n❌ Errors: ${result.errors}\n\n🤖 Your ML system is now ready with real data!`,
            [
              {
                text: 'OK',
                onPress: () => {
                  if (onUploadComplete) {
                    onUploadComplete(result);
                  }
                  setCsvData(''); // Clear the input
                  setSelectedFile(null); // Clear selected file
                }
              }
            ]
          );
        } else {
          Alert.alert('Upload Failed', result.message);
        }
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setShowProgressModal(false);
      Alert.alert('Error', 'Failed to upload data. Please check your Firebase configuration.');
    } finally {
      setUploading(false);
    }
  };

  const loadSampleData = () => {
    const sampleData = ExcelDataUploadService.generateSampleFormat();
    setCsvData(sampleData);
    setShowSample(true);
  };

  const clearData = () => {
    setCsvData('');
    setShowSample(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-upload" size={24} color="#16543a" />
        <Text style={styles.title}>📊 Excel Data Upload</Text>
      </View>

      <Text style={styles.description}>
        Paste your Excel/CSV price data below. The system will automatically:
      </Text>

      <View style={styles.featuresList}>
        <Text style={styles.feature}>✅ Parse your data format</Text>
        <Text style={styles.feature}>✅ Upload to Firebase</Text>
        <Text style={styles.feature}>✅ Set up ML predictions</Text>
        <Text style={styles.feature}>✅ Make everything work</Text>
      </View>

      <View style={styles.modeSection}>
        <TouchableOpacity 
          style={[styles.modeButton, uploadMode === 'file' && styles.modeButtonActive]}
          onPress={() => setUploadMode('file')}
        >
          <Ionicons name="document" size={16} color={uploadMode === 'file' ? '#fff' : '#16543a'} />
          <Text style={[styles.modeButtonText, uploadMode === 'file' && styles.modeButtonTextActive]}>
            Upload File
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modeButton, uploadMode === 'text' && styles.modeButtonActive]}
          onPress={() => setUploadMode('text')}
        >
          <Ionicons name="text" size={16} color={uploadMode === 'text' ? '#fff' : '#16543a'} />
          <Text style={[styles.modeButtonText, uploadMode === 'text' && styles.modeButtonTextActive]}>
            Paste Text
          </Text>
        </TouchableOpacity>
      </View>

      {uploadMode === 'file' ? (
        <View style={styles.fileSection}>
          <TouchableOpacity style={styles.fileButton} onPress={handleFilePicker}>
            <Ionicons name="cloud-upload" size={20} color="#16543a" />
            <Text style={styles.fileButtonText}>
              {selectedFile ? `Selected: ${selectedFile.name}` : 'Select Excel/CSV File'}
            </Text>
          </TouchableOpacity>
          
          {selectedFile && (
            <View style={styles.fileInfo}>
              <Text style={styles.fileInfoText}>📁 {selectedFile.name}</Text>
              <Text style={styles.fileInfoText}>📏 {(selectedFile.size / 1024).toFixed(2)} KB</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.sampleSection}>
          <TouchableOpacity style={styles.sampleButton} onPress={loadSampleData}>
            <Ionicons name="document-text" size={16} color="#16543a" />
            <Text style={styles.sampleButtonText}>Load Sample Format</Text>
          </TouchableOpacity>
          
          {showSample && (
            <TouchableOpacity style={styles.clearButton} onPress={clearData}>
              <Ionicons name="close-circle" size={16} color="#666" />
              <Text style={styles.clearButtonText}>Clear Sample</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {uploadMode === 'text' && (
        <TextInput
          style={styles.textInput}
          placeholder="Paste your Excel/CSV data here...

Example format:
Commodity Name,Price,Date,Unit,Category,Type,Specification
Beef Brisket Imported,450.00,2024-01-15,kg,BEEF MEAT PRODUCTS,Imported,Premium
Pork Belly Local,320.00,2024-01-15,kg,PORK MEAT PRODUCTS,Local,Standard
Rice Premium,65.00,2024-01-15,kg,LOCAL COMMERCIAL RICE,Premium,Well Milled"
          value={csvData}
          onChangeText={setCsvData}
          multiline
          numberOfLines={15}
          textAlignVertical="top"
          placeholderTextColor="#999"
        />
      )}

      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.uploadButtonText}>Uploading...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload to Firebase</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>📋 Supported Formats:</Text>
        <Text style={styles.infoText}>• CSV files (comma-separated)</Text>
        <Text style={styles.infoText}>• Excel data (copy-paste)</Text>
        <Text style={styles.infoText}>• Any text format with headers</Text>
        
        <Text style={styles.infoTitle}>📊 Required Columns:</Text>
        <Text style={styles.infoText}>• Commodity Name (required)</Text>
        <Text style={styles.infoText}>• Price (required)</Text>
        <Text style={styles.infoText}>• Date (required)</Text>
        <Text style={styles.infoText}>• Category, Unit, Type (optional)</Text>
      </View>

      {/* Progress Modal */}
      <Modal
        visible={showProgressModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.progressModalOverlay}>
          <View style={styles.progressModal}>
            <View style={styles.progressHeader}>
              <Ionicons name="cloud-upload" size={32} color="#16543a" />
              <Text style={styles.progressTitle}>Uploading Data</Text>
            </View>
            
            <View style={styles.progressContent}>
              <Text style={styles.currentStep}>{currentStep}</Text>
              
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                {Platform.OS === 'android' ? (
                  <View style={styles.progressBarAndroid}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${Math.max(0, Math.min(100, uploadProgress * 100))}%` }
                      ]} 
                    />
                  </View>
                ) : (
                  <View style={styles.progressBarIOS}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${Math.max(0, Math.min(100, uploadProgress * 100))}%` }
                      ]} 
                    />
                  </View>
                )}
                <Text style={styles.progressText}>
                  {Math.round(Math.max(0, Math.min(100, uploadProgress * 100)))}%
                </Text>
              </View>
              
              {/* Upload Statistics */}
              <View style={styles.uploadStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Records:</Text>
                  <Text style={styles.statValue}>
                    {processedRecords.toLocaleString()} / {totalRecords.toLocaleString()}
                  </Text>
                </View>
                
                {totalBatches > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Batches:</Text>
                    <Text style={styles.statValue}>
                      {currentBatch} / {totalBatches}
                    </Text>
                  </View>
                )}
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>File:</Text>
                  <Text style={styles.statValue}>
                    {selectedFile ? selectedFile.name : 'Text Data'}
                  </Text>
                </View>
              </View>
              
              {/* Loading Animation */}
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16543a" />
                <Text style={styles.loadingText}>Please wait...</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16543a',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresList: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  feature: {
    fontSize: 14,
    color: '#16543a',
    marginBottom: 4,
  },
  modeSection: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  modeButtonActive: {
    backgroundColor: '#16543a',
  },
  modeButtonText: {
    color: '#16543a',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  fileSection: {
    marginBottom: 16,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#16543a',
    borderStyle: 'dashed',
  },
  fileButtonText: {
    color: '#16543a',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
  fileInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  fileInfoText: {
    fontSize: 14,
    color: '#16543a',
    marginBottom: 4,
  },
  sampleSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#16543a',
    marginRight: 8,
  },
  sampleButtonText: {
    color: '#16543a',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#666',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 200,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16543a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#74bfa3',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16543a',
    marginBottom: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  // Progress Modal Styles
  progressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 320,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16543a',
    marginTop: 8,
  },
  progressContent: {
    alignItems: 'center',
  },
  currentStep: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 20,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBarAndroid: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarIOS: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16543a',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16543a',
    textAlign: 'center',
    marginTop: 8,
  },
  uploadStats: {
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    color: '#16543a',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default ExcelDataUploader;
