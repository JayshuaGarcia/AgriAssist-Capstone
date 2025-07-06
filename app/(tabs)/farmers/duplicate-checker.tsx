import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, FlatList, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';
const WARNING_COLOR = '#ff9800';
const ERROR_COLOR = '#f44336';

export default function DuplicateCheckerScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [searchField, setSearchField] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  // Sample data for demonstration
  const sampleFarmers = [
    { id: 1, name: 'Juan Dela Cruz', contact: '09123456789', address: 'Barangay 1' },
    { id: 2, name: 'Maria Santos', contact: '09234567890', address: 'Barangay 2' },
    { id: 3, name: 'Juan Dela Cruz', contact: '09345678901', address: 'Barangay 3' },
    { id: 4, name: 'Pedro Garcia', contact: '09123456789', address: 'Barangay 4' },
    { id: 5, name: 'Ana Reyes', contact: '09456789012', address: 'Barangay 5' },
    { id: 6, name: 'Juan Dela Cruz', contact: '09567890123', address: 'Barangay 6' },
  ];

  const searchFields = [
    { key: 'name', label: 'Name', icon: 'account' },
    { key: 'contact', label: 'Contact Number', icon: 'phone' },
    { key: 'address', label: 'Address', icon: 'map-marker' },
  ];

  const findDuplicates = () => {
    if (!searchField || !searchValue.trim()) {
      Alert.alert('Required Fields', 'Please select a field and enter a value to search');
      return;
    }

    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      const foundDuplicates = sampleFarmers.filter(farmer => 
        farmer[searchField as keyof typeof farmer]?.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
      
      setDuplicates(foundDuplicates);
      setIsScanning(false);
      
      if (foundDuplicates.length === 0) {
        Alert.alert('No Duplicates Found', 'No duplicate entries found for the specified criteria.');
      } else if (foundDuplicates.length === 1) {
        Alert.alert('No Duplicates Found', 'Only one entry found for the specified criteria.');
      } else {
        Alert.alert('Duplicates Found', `${foundDuplicates.length} entries found. Check the list below.`);
      }
    }, 1500);
  };

  const scanAllRecords = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const allDuplicates: any[] = [];
      
      // Check for name duplicates
      const nameGroups: { [key: string]: any[] } = {};
      sampleFarmers.forEach(farmer => {
        const name = farmer.name.toLowerCase();
        if (!nameGroups[name]) nameGroups[name] = [];
        nameGroups[name].push(farmer);
      });
      
      Object.values(nameGroups).forEach(group => {
        if (group.length > 1) {
          allDuplicates.push(...group);
        }
      });
      
      // Check for contact duplicates
      const contactGroups: { [key: string]: any[] } = {};
      sampleFarmers.forEach(farmer => {
        const contact = farmer.contact;
        if (!contactGroups[contact]) contactGroups[contact] = [];
        contactGroups[contact].push(farmer);
      });
      
      Object.values(contactGroups).forEach(group => {
        if (group.length > 1) {
          allDuplicates.push(...group);
        }
      });
      
      // Remove duplicates from the array
      const uniqueDuplicates = allDuplicates.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );
      
      setDuplicates(uniqueDuplicates);
      setIsScanning(false);
      
      if (uniqueDuplicates.length === 0) {
        Alert.alert('Scan Complete', 'No duplicate entries found in the database.');
      } else {
        Alert.alert('Duplicates Found', `${uniqueDuplicates.length} duplicate entries found.`);
      }
    }, 2000);
  };

  const clearResults = () => {
    setDuplicates([]);
    setSearchValue('');
  };

  const renderDuplicateItem = ({ item }: { item: any }) => (
    <View style={styles.duplicateItem}>
      <View style={styles.duplicateHeader}>
        <MaterialCommunityIcons name="alert-circle" size={20} color={WARNING_COLOR} />
        <Text style={styles.duplicateTitle}>Duplicate Entry #{item.id}</Text>
      </View>
      <View style={styles.duplicateDetails}>
        <Text style={styles.detailText}>Name: {item.name}</Text>
        <Text style={styles.detailText}>Contact: {item.contact}</Text>
        <Text style={styles.detailText}>Address: {item.address}</Text>
      </View>
      <View style={styles.duplicateActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye" size={16} color={GREEN} />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create" size={16} color={GREEN} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
          <Ionicons name="trash" size={16} color={ERROR_COLOR} />
          <Text style={[styles.actionText, { color: ERROR_COLOR }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Duplicate Checker</Text>
          <Text style={styles.headerSubtitle}>Find and resolve duplicate farmer records.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Search Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="magnify" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Search for Duplicates</Text>
            </View>
            
            <View style={styles.searchContainer}>
              <Text style={styles.label}>Search Field *</Text>
              <View style={styles.fieldSelector}>
                {searchFields.map((field) => (
                  <TouchableOpacity
                    key={field.key}
                    style={[
                      styles.fieldOption,
                      searchField === field.key && styles.selectedField
                    ]}
                    onPress={() => setSearchField(field.key)}
                  >
                    <MaterialCommunityIcons 
                      name={field.icon as any} 
                      size={16} 
                      color={searchField === field.key ? WHITE : GREEN} 
                    />
                    <Text style={[
                      styles.fieldText,
                      searchField === field.key && styles.selectedFieldText
                    ]}>
                      {field.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Search Value *</Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter ${searchField || 'search'} value`}
                value={searchValue}
                onChangeText={setSearchValue}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.searchButton]} 
              onPress={findDuplicates}
              disabled={isScanning}
            >
              <MaterialCommunityIcons name="magnify" size={20} color={WHITE} />
              <Text style={styles.buttonText}>
                {isScanning ? 'Scanning...' : 'Search Duplicates'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={[styles.quickButton, styles.scanAllButton]} 
                onPress={scanAllRecords}
                disabled={isScanning}
              >
                <MaterialCommunityIcons name="database-search" size={24} color={WHITE} />
                <Text style={styles.quickButtonText}>Scan All Records</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickButton, styles.clearButton]} 
                onPress={clearResults}
              >
                <MaterialCommunityIcons name="refresh" size={24} color={GREEN} />
                <Text style={[styles.quickButtonText, { color: GREEN }]}>Clear Results</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Results Section */}
          {duplicates.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="alert-circle" size={24} color={WARNING_COLOR} />
                <Text style={styles.sectionTitle}>
                  Duplicate Entries Found ({duplicates.length})
                </Text>
              </View>
              
              <FlatList
                data={duplicates}
                renderItem={renderDuplicateItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginLeft: 12,
  },
  searchContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GREEN,
    gap: 6,
  },
  selectedField: {
    backgroundColor: GREEN,
  },
  fieldText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  selectedFieldText: {
    color: WHITE,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: GREEN,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    marginLeft: 8,
  },
  quickActions: {
    gap: 12,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  scanAllButton: {
    backgroundColor: LIGHT_GREEN,
  },
  clearButton: {
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: GREEN,
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
  },
  duplicateItem: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: WARNING_COLOR,
  },
  duplicateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  duplicateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  duplicateDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  duplicateActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    gap: 4,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: 'space-between',
  },
  logo: {
    width: 54,
    height: 54,
    marginRight: 8,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2f1',
    marginTop: 2,
    textAlign: 'center',
  },
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eee',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
}); 