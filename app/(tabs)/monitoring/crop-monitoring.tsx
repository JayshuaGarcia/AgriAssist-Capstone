import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';
const WARNING_COLOR = '#ff9800';
const ERROR_COLOR = '#f44336';

export default function CropMonitoringScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [farmerName, setFarmerName] = useState('');
  const [cropType, setCropType] = useState('');
  const [fieldLocation, setFieldLocation] = useState('');
  const [monitoringDate, setMonitoringDate] = useState('');
  const [cropCondition, setCropCondition] = useState('');
  const [pestSightings, setPestSightings] = useState('');
  const [diseaseObservations, setDiseaseObservations] = useState('');
  const [weatherConditions, setWeatherConditions] = useState('');
  const [irrigationStatus, setIrrigationStatus] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const cropConditions = [
    { key: 'excellent', label: 'Excellent', icon: 'check-circle', color: '#4caf50' },
    { key: 'good', label: 'Good', icon: 'check', color: '#8bc34a' },
    { key: 'fair', label: 'Fair', icon: 'minus-circle', color: WARNING_COLOR },
    { key: 'poor', label: 'Poor', icon: 'close-circle', color: ERROR_COLOR },
  ];

  const growthStages = [
    'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest Ready', 'Mature'
  ];

  const handleSave = () => {
    if (!farmerName.trim() || !cropType.trim() || !fieldLocation.trim() || !monitoringDate.trim()) {
      Alert.alert('Required Fields', 'Please fill in Farmer Name, Crop Type, Field Location, and Monitoring Date');
      return;
    }

    if (!cropCondition) {
      Alert.alert('Required Fields', 'Please select a crop condition');
      return;
    }

    Alert.alert('Success', 'Crop monitoring report saved successfully!');
  };

  const handleClear = () => {
    setFarmerName('');
    setCropType('');
    setFieldLocation('');
    setMonitoringDate('');
    setCropCondition('');
    setPestSightings('');
    setDiseaseObservations('');
    setWeatherConditions('');
    setIrrigationStatus('');
    setGrowthStage('');
    setAdditionalNotes('');
  };

  const handleViewReports = () => {
    Alert.alert('View Reports', 'This will show all saved crop monitoring reports');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Crop Monitoring</Text>
          <Text style={styles.headerSubtitle}>Monitor crop health and progress.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Basic Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Crop Type *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter crop type (e.g., Rice, Corn, Vegetables)"
                value={cropType}
                onChangeText={setCropType}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Field Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter field location or coordinates"
                value={fieldLocation}
                onChangeText={setFieldLocation}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Monitoring Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/DD/YYYY"
                value={monitoringDate}
                onChangeText={setMonitoringDate}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Crop Assessment Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="sprout" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Crop Assessment</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Crop Condition *</Text>
              <View style={styles.conditionGrid}>
                {cropConditions.map((condition) => (
                  <TouchableOpacity
                    key={condition.key}
                    style={[
                      styles.conditionOption,
                      cropCondition === condition.key && styles.selectedCondition
                    ]}
                    onPress={() => setCropCondition(condition.key)}
                  >
                    <MaterialCommunityIcons 
                      name={condition.icon as any} 
                      size={20} 
                      color={cropCondition === condition.key ? WHITE : condition.color} 
                    />
                    <Text style={[
                      styles.conditionText,
                      cropCondition === condition.key && styles.selectedConditionText
                    ]}>
                      {condition.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Growth Stage</Text>
              <TextInput
                style={styles.input}
                placeholder="Select growth stage (e.g., Seedling, Flowering)"
                value={growthStage}
                onChangeText={setGrowthStage}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Irrigation Status</Text>
              <TextInput
                style={styles.input}
                placeholder="Describe irrigation status"
                value={irrigationStatus}
                onChangeText={setIrrigationStatus}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Issues & Observations Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert-circle" size={24} color={WARNING_COLOR} />
              <Text style={styles.sectionTitle}>Issues & Observations</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pest Sightings</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe any pest sightings, type, and severity..."
                value={pestSightings}
                onChangeText={setPestSightings}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Disease Observations</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe any disease symptoms, affected areas..."
                value={diseaseObservations}
                onChangeText={setDiseaseObservations}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weather Conditions</Text>
              <TextInput
                style={styles.input}
                placeholder="Describe current weather conditions"
                value={weatherConditions}
                onChangeText={setWeatherConditions}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Additional Notes Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="note-text" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any additional observations, recommendations, or notes..."
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Ionicons name="save" size={20} color={WHITE} />
              <Text style={styles.buttonText}>Save Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClear}>
              <Ionicons name="refresh" size={20} color={GREEN} />
              <Text style={[styles.buttonText, { color: GREEN }]}>Clear Form</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.viewButton]} onPress={handleViewReports}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={WHITE} />
              <Text style={styles.buttonText}>View Reports</Text>
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
    paddingBottom: 14,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionOption: {
    flex: 1,
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    gap: 6,
  },
  selectedCondition: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedConditionText: {
    color: WHITE,
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