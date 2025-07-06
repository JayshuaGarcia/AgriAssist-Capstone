import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

export const ExcelConverter: React.FC = () => {
  const showConversionSteps = () => {
    Alert.alert(
      'Excel to CSV Conversion Steps',
      `1. Open your "Farmers Data.xlsx" file in Excel or Google Sheets
2. Click "File" → "Save As" or "Export"
3. Choose "CSV (Comma delimited) (*.csv)" format
4. Save the file
5. Use this CSV file in the Import Data section`,
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  const showExpectedHeaders = () => {
    Alert.alert(
      'Expected Column Headers',
      `Required columns:
• name (or farmer_name, full_name)
• email
• phone (or contact, mobile)
• location (or address, area)
• farm_size (or area_hectares)

Optional columns:
• crops (or crop_types) - comma separated
• livestock (or animals) - comma separated
• registration_date (or date_registered)`,
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  const showExampleFormat = () => {
    Alert.alert(
      'Example CSV Format',
      `name,email,phone,location,farm_size,crops,livestock
Juan Dela Cruz,juan@example.com,+639123456789,Manila,5.5,"Rice,Corn","Chicken,Pigs"
Maria Santos,maria@example.com,+639234567890,Bulacan,3.2,"Rice,Tomatoes","Cattle"`,
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>📊 Prepare Your Excel Data</ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Convert your "Farmers Data.xlsx" file to CSV format for import
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Step 1: Convert Excel to CSV</ThemedText>
          <TouchableOpacity style={styles.button} onPress={showConversionSteps}>
            <ThemedText style={styles.buttonText}>📋 Show Conversion Steps</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Step 2: Check Column Headers</ThemedText>
          <TouchableOpacity style={styles.button} onPress={showExpectedHeaders}>
            <ThemedText style={styles.buttonText}>📝 Expected Headers</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Step 3: Example Format</ThemedText>
          <TouchableOpacity style={styles.button} onPress={showExampleFormat}>
            <ThemedText style={styles.buttonText}>📄 View Example</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsSection}>
          <ThemedText style={styles.sectionTitle}>💡 Important Tips</ThemedText>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipNumber}>1.</ThemedText>
            <ThemedText style={styles.tipText}>
              Use commas to separate multiple crops or livestock types
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipNumber}>2.</ThemedText>
            <ThemedText style={styles.tipText}>
              Ensure dates are in YYYY-MM-DD format (e.g., 2023-01-15)
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipNumber}>3.</ThemedText>
            <ThemedText style={styles.tipText}>
              Farm size should be a number in hectares (e.g., 5.5)
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipNumber}>4.</ThemedText>
            <ThemedText style={styles.tipText}>
              Test with a few rows first before importing all data
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipNumber}>5.</ThemedText>
            <ThemedText style={styles.tipText}>
              Make sure all required fields are filled
            </ThemedText>
          </View>
        </View>

        <View style={styles.nextStepsSection}>
          <ThemedText style={styles.sectionTitle}>🚀 Next Steps</ThemedText>
          <ThemedText style={styles.nextStepText}>
            1. Convert your Excel file to CSV format
          </ThemedText>
          <ThemedText style={styles.nextStepText}>
            2. Go to "Import Data" tab in the app
          </ThemedText>
          <ThemedText style={styles.nextStepText}>
            3. Select your CSV file
          </ThemedText>
          <ThemedText style={styles.nextStepText}>
            4. Click "Start Import"
          </ThemedText>
        </View>
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
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  tipsSection: {
    marginBottom: 25,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#2196F3',
  },
  tipText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  nextStepsSection: {
    backgroundColor: '#f0f8ff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  nextStepText: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
}); 