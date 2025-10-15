import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';

interface AnimalEntry {
  id: string;
  type: string;
  maleCount: string;
  femaleCount: string;
}

export default function LivestockInventoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [farmerName, setFarmerName] = useState('');
  const [animals, setAnimals] = useState<AnimalEntry[]>([
    { id: '1', type: '', maleCount: '', femaleCount: '' }
  ]);

  const addAnimal = () => {
    const newId = (animals.length + 1).toString();
    setAnimals([...animals, { id: newId, type: '', maleCount: '', femaleCount: '' }]);
  };

  const removeAnimal = (id: string) => {
    if (animals.length > 1) {
      setAnimals(animals.filter(animal => animal.id !== id));
    }
  };

  const updateAnimal = (id: string, field: keyof AnimalEntry, value: string) => {
    setAnimals(animals.map(animal => 
      animal.id === id ? { ...animal, [field]: value } : animal
    ));
  };

  const handleSave = () => {
    if (!farmerName.trim()) {
      Alert.alert('Required Field', 'Please enter the farmer name');
      return;
    }

    const hasValidAnimals = animals.some(animal => 
      animal.type.trim() && (animal.maleCount.trim() || animal.femaleCount.trim())
    );

    if (!hasValidAnimals) {
      Alert.alert('Required Fields', 'Please enter at least one animal type and count');
      return;
    }

    Alert.alert('Success', 'Livestock inventory saved successfully!');
  };

  const handleClear = () => {
    setFarmerName('');
    setAnimals([{ id: '1', type: '', maleCount: '', femaleCount: '' }]);
  };

  const handleViewRecords = () => {
    Alert.alert('View Records', 'This will show all saved livestock inventories');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Livestock Inventory</Text>
          <Text style={styles.headerSubtitle}>Livestock inventory and management.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Farmer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Farmer Information</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Farmer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter farmer name"
                value={farmerName}
                onChangeText={setFarmerName}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Livestock Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cow" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Livestock Information</Text>
            </View>
            
            {animals.map((animal, index) => (
              <View key={animal.id} style={styles.animalCard}>
                <View style={styles.animalHeader}>
                  <Text style={styles.animalTitle}>Animal #{index + 1}</Text>
                  {animals.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeAnimal(animal.id)}
                    >
                      <Ionicons name="close-circle" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Type of Animal *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Cattle, Pigs, Chickens"
                    value={animal.type}
                    onChangeText={(value) => updateAnimal(animal.id, 'type', value)}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Male Count</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      value={animal.maleCount}
                      onChangeText={(value) => updateAnimal(animal.id, 'maleCount', value)}
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Female Count</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      value={animal.femaleCount}
                      onChangeText={(value) => updateAnimal(animal.id, 'femaleCount', value)}
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>
            ))}

            {/* Add Animal Button */}
            <TouchableOpacity style={styles.addButton} onPress={addAnimal}>
              <Ionicons name="add-circle" size={24} color={WHITE} />
              <Text style={styles.addButtonText}>Add Another Animal</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Ionicons name="save" size={20} color={WHITE} />
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
              <Ionicons name="refresh" size={20} color={GREEN} />
              <Text style={[styles.buttonText, { color: GREEN }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.viewButton]} onPress={handleViewRecords}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={WHITE} />
              <Text style={styles.buttonText}>View Records</Text>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
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
  animalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  animalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
  },
  removeButton: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
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
  saveButton: {
    backgroundColor: GREEN,
  },
  clearButton: {
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: GREEN,
  },
  viewButton: {
    backgroundColor: LIGHT_GREEN,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    marginLeft: 8,
  },
}); 