import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../components/AuthContext';
import { useRecordType } from '../../../components/RecordTypeContext';
import { useBarangay } from '../../../components/RoleContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';

export default function FarmerProfileFormScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const { setRecordType } = useRecordType();
  const { barangay } = useBarangay();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [sex, setSex] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropArea, setCropArea] = useState('');

  // Auto-redirect for Viewer and Admin roles
  React.useEffect(() => {
    if (profile.role === 'Viewer') {
      router.push('/farmers/profile');
    } else if (profile.role === 'Admin') {
      setRecordType('farmer-profiles');
      router.push('/barangay-select-records');
    }
  }, [profile.role]);

  const handleSave = () => {
    if (!firstName || !lastName || !contactNumber) {
      Alert.alert('Required Fields', 'Please fill in First Name, Last Name, and Contact Number');
      return;
    }
    Alert.alert('Success', 'Farmer profile saved successfully!');
  };

  const handleClear = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setBirthday('');
    setSex('');
    setContactNumber('');
    setCropName('');
    setCropArea('');
  };

  const handleViewRecord = () => {
    Alert.alert('View Records', 'This will show all saved farmer profiles');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Farmer Profile Form</Text>
          <Text style={styles.headerSubtitle}>Complete farmer information and details.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Personal Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-details" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Middle Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter middle name"
                value={middleName}
                onChangeText={setMiddleName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Birthday</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/DD/YYYY"
                  value={birthday}
                  onChangeText={setBirthday}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Sex</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Male/Female"
                  value={sex}
                  onChangeText={setSex}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter contact number"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Farming Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="sprout" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Farming Information</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Crop Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter crop name"
                value={cropName}
                onChangeText={setCropName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Crop Area</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter crop area (hectares)"
                value={cropArea}
                onChangeText={setCropArea}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
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

            <TouchableOpacity style={[styles.button, styles.viewButton]} onPress={handleViewRecord}>
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
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