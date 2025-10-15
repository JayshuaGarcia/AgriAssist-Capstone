import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { DataImportComponent } from '../../components/DataImportComponent';
import { ExcelConverter } from '../../components/ExcelConverter';
import { ThemedText } from '../../components/ThemedText';

export default function DataImportScreen() {
  const [showConverter, setShowConverter] = useState(false);

  if (showConverter) {
    return <ExcelConverter />;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Import Agricultural Data</ThemedText>
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={() => setShowConverter(true)}
        >
          <ThemedText style={styles.helpButtonText}>📊 Excel Help</ThemedText>
        </TouchableOpacity>
      </View>
      <DataImportComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  helpButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
}); 