import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../components/AuthContext';
import { useRecordType } from '../../../components/RecordTypeContext';
import { useBarangay } from '../../../components/RoleContext';

const GREEN = '#16543a';
const WHITE = '#ffffff';

export default function AnnexEScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const { setRecordType } = useRecordType();
  const { barangay } = useBarangay();
  
  const [farmerName, setFarmerName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [soilType, setSoilType] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [slope, setSlope] = useState('');
  const [accessibility, setAccessibility] = useState('');
  const [climate, setClimate] = useState('');
  const [suitabilityScore, setSuitabilityScore] = useState('');

  // Auto-redirect for Viewer and Admin roles
  React.useEffect(() => {
    if (profile.role === 'Viewer') {
      router.push('/farmers/profile');
    } else if (profile.role === 'Admin') {
      setRecordType('farmer-profiles');
      router.push('/barangay-select-records');
    }
  }, [profile.role]);

  const handleSubmit = () => {
    if (!farmerName || !farmLocation || !farmSize) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }
    
    Alert.alert('Success', 'Farm suitability assessment submitted successfully!');
  };

  const calculateSuitability = () => {
    // Simple suitability calculation based on inputs
    let score = 0;
    if (soilType === 'Loam') score += 25;
    if (waterSource === 'Irrigation') score += 25;
    if (slope === 'Flat to Gentle') score += 25;
    if (accessibility === 'Good') score += 25;
    
    setSuitabilityScore(score.toString());
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Annex E – Farm Suitability</Text>
          <Text style={styles.headerSubtitle}>Assess farm suitability and conditions.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farmer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter farmer's full name"
                value={farmerName}
                onChangeText={setFarmerName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farm Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter farm location/address"
                value={farmLocation}
                onChangeText={setFarmLocation}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farm Size (hectares) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter farm size"
                value={farmSize}
                onChangeText={setFarmSize}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environmental Factors</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Soil Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Loam, Clay, Sandy"
                value={soilType}
                onChangeText={setSoilType}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Water Source</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Irrigation, Rain-fed, Well"
                value={waterSource}
                onChangeText={setWaterSource}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Slope</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Flat to Gentle, Moderate, Steep"
                value={slope}
                onChangeText={setSlope}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Accessibility</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Good, Fair, Poor"
                value={accessibility}
                onChangeText={setAccessibility}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Climate</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Tropical, Temperate"
                value={climate}
                onChangeText={setClimate}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suitability Assessment</Text>
            
            <TouchableOpacity style={styles.calculateButton} onPress={calculateSuitability}>
              <MaterialCommunityIcons name="calculator" size={20} color={WHITE} />
              <Text style={styles.calculateButtonText}>Calculate Suitability Score</Text>
            </TouchableOpacity>

            {suitabilityScore && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Suitability Score:</Text>
                <Text style={styles.scoreValue}>{suitabilityScore}%</Text>
                <Text style={styles.scoreDescription}>
                  {parseInt(suitabilityScore) >= 75 ? 'Highly Suitable' : 
                   parseInt(suitabilityScore) >= 50 ? 'Moderately Suitable' : 
                   parseInt(suitabilityScore) >= 25 ? 'Low Suitability' : 'Not Suitable'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <MaterialCommunityIcons name="content-save" size={20} color={WHITE} />
            <Text style={styles.submitButtonText}>Submit Assessment</Text>
          </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
    marginLeft: 8,
  },
  scoreContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WHITE,
    marginLeft: 8,
  },
}); 