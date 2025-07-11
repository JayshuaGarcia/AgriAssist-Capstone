import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../components/AuthContext';
import { ReadOnlyView } from '../../../components/ReadOnlyView';
import { useRecordType } from '../../../components/RecordTypeContext';
import { useBarangay } from '../../../components/RoleContext';
import { deleteAllFarmerProfiles, deleteFarmerProfile, fetchFarmerProfiles, updateFarmerProfile, uploadFarmerProfile } from '../../../services/farmerProfileUploadService';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';

// Helper to format date to DD/MM/YYYY
function formatBirthday(dateStr: any): string {
  if (!dateStr) return '';
  if (typeof dateStr !== 'string') {
    // Try to convert Date or number to string
    if (dateStr instanceof Date) {
      // Format as DD/MM/YYYY
      const d = dateStr;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    dateStr = String(dateStr);
  }
  // If already in DD/MM/YYYY, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  // Try to parse common formats
  const parts = dateStr.split(/[\/-]/);
  if (parts.length === 3) {
    let [a, b, c] = parts;
    if (a.length === 4) { // YYYY-MM-DD or YYYY/MM/DD
      return `${b.padStart(2, '0')}/${c.padStart(2, '0')}/${a}`;
    } else if (c.length === 4) { // MM/DD/YYYY or DD/MM/YYYY
      if (parseInt(a, 10) > 12) { // DD/MM/YYYY
        return `${a.padStart(2, '0')}/${b.padStart(2, '0')}/${c}`;
      } else { // MM/DD/YYYY
        return `${b.padStart(2, '0')}/${a.padStart(2, '0')}/${c}`;
      }
    }
  }
  return dateStr;
}

export default function FarmerProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const { barangay } = useBarangay();
  const { setRecordType } = useRecordType();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [sex, setSex] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropArea, setCropArea] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [farmerProfiles, setFarmerProfiles] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Auto-load records for Viewers and Admins
  React.useEffect(() => {
    if (profile.role === 'Viewer') {
      router.push('/farmers/farmer-profiles-records');
    } else if (profile.role === 'Admin') {
      setRecordType('farmer-profiles');
      router.push('/barangay-select-records');
    }
  }, [profile.role]);

  const handleSave = async () => {
    if (!firstName || !lastName || !contactNumber) {
      Alert.alert('Required Fields', 'Please fill in First Name, Last Name, and Contact Number');
      return;
    }
    // Validate birthday format if provided
    if (birthday && !/^\d{2}\/\d{2}\/\d{4}$/.test(birthday)) {
      Alert.alert('Invalid Birthday', 'Birthday must be in DD/MM/YYYY format.');
      return;
    }
    if (!barangay) {
      Alert.alert('Barangay not set', 'Please select your barangay.');
      return;
    }
    const record = {
      firstName,
      middleName,
      lastName,
      birthday: formatBirthday(birthday),
      sex,
      contactNumber,
      cropName,
      cropArea,
      timestamp: Date.now(),
      barangay, // Add barangay to record
    };
    try {
      if (editingId) {
        await updateFarmerProfile(editingId, record);
        Alert.alert('Success', 'Farmer profile updated!');
        setEditingId(null);
      } else {
        await uploadFarmerProfile(record);
        Alert.alert('Success', 'Farmer profile saved and uploaded!');
      }
      handleClear();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile.');
    }
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

  const handleEditRecord = (record: any) => {
    setFirstName(record.firstName);
    setMiddleName(record.middleName);
    setLastName(record.lastName);
    setBirthday(formatBirthday(record.birthday));
    setSex(record.sex);
    setContactNumber(record.contactNumber);
    setCropName(record.cropName);
    setCropArea(record.cropArea);
    setEditingId(record.id);
    setModalVisible(false);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteFarmerProfile(id);
      Alert.alert('Deleted', 'Profile deleted successfully.');
      handleViewRecords();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete profile.');
    }
  };

  const handleDeleteAllRecords = async () => {
    try {
      await deleteAllFarmerProfiles();
      Alert.alert('Deleted', 'All profiles deleted successfully.');
      setFarmerProfiles([]);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete all profiles.');
    }
  };

  const handleViewRecords = async () => {
    try {
      const records = await fetchFarmerProfiles(barangay || undefined); // Filter by barangay
      if (!records || records.length === 0) {
        Alert.alert('No profiles found.');
        return;
      }
      setFarmerProfiles(records);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profiles.');
    }
  };

  const sanitizeKeys = (obj: any) => {
    const forbidden = /[.#$\[\]/]/g;
    const newObj: any = {};
    for (const key in obj) {
      const safeKey = key.replace(forbidden, '_');
      newObj[safeKey] = obj[key];
    }
    return newObj;
  };

  const headerMap: { [key: string]: string } = {
    'First Name': 'firstName',
    'Middle Name': 'middleName',
    'Last Name': 'lastName',
    'Birthday': 'birthday',
    'Sex': 'sex',
    'Contact Number': 'contactNumber',
    'Crop Name': 'cropName',
    'Crop Area': 'cropArea',
  };

  const mapHeaders = (obj: any) => {
    const newObj: any = {};
    for (const key in obj) {
      const mappedKey = headerMap[key.trim()] || key.trim();
      if (mappedKey === 'birthday') {
        newObj[mappedKey] = formatBirthday(obj[key]);
      } else {
        newObj[mappedKey] = obj[key];
      }
    }
    return newObj;
  };

  const importAndUploadExcel = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'] });
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert('File Picked', `Name: ${file.name}`);
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          if (json.length > 0) {
            Alert.alert('Parsed First Row', JSON.stringify(json[0], null, 2));
          } else {
            Alert.alert('Parsed Rows', 'No rows found.');
          }
          for (const record of json) {
            const mapped = mapHeaders(record);
            const sanitized = sanitizeKeys(mapped);
            await uploadFarmerProfile(sanitized);
          }
          setUploading(false);
          Alert.alert('Success', 'All profiles uploaded!');
        };
        reader.readAsBinaryString(blob);
      } else {
        setUploading(false);
        Alert.alert('No file', 'No file was selected.');
      }
    } catch (error) {
      setUploading(false);
      Alert.alert('Error', 'Failed to import Excel file.');
    }
  };

  return (
    <ReadOnlyView>
      <View style={styles.container}>
        <StatusBar style="dark" hidden />
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Farmer Profiles</Text>
            <Text style={styles.headerSubtitle}>Farmer profile details and updates.</Text>
          </View>
          <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
        </View>

        {/* Show form for non-Viewers, records for Viewers */}
        {profile.role !== 'Viewer' ? (
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
                      placeholder="DD/MM/YYYY"
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

                <TouchableOpacity style={[styles.button, styles.viewButton]} onPress={handleViewRecords}>
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={WHITE} />
                  <Text style={styles.buttonText}>View Records</Text>
                </TouchableOpacity>
              </View>
             <TouchableOpacity style={styles.importButton} onPress={importAndUploadExcel}>
               <Text style={styles.importButtonText}>Import Excel</Text>
             </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          // Redirect Viewers to dedicated records page
          <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
              Redirecting to records...
            </Text>
          </View>
        )}
        {/* Modal for Farmer Profiles remains for non-Viewers */}
        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: '#fff', padding: 20, alignItems: 'center', justifyContent: 'flex-start' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10, alignSelf: 'center' }}>Farmer Profiles</Text>
            <View style={{ flex: 1, width: '100%', marginTop: 0, marginBottom: 10, justifyContent: 'flex-start' }}>
              <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ borderWidth: 2, borderColor: '#888', borderRadius: 8, minWidth: 900, flex: 1, backgroundColor: '#fafbfc', minHeight: 456, borderBottomWidth: 2, marginBottom: 8 }}>
                  {/* Table Header */}
                  <View style={{ flexDirection: 'row', backgroundColor: '#e0e0e0', borderBottomWidth: 1, borderColor: '#ccc', height: 38, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                    {['No.', 'First Name', 'Middle Name', 'Last Name', 'Birthday', 'Sex', 'Contact Number', 'Crop Name', 'Crop Area', ' '].map((header, hIdx) => (
                      <View
                        key={hIdx}
                        style={{
                          width: [60, 120, 120, 120, 120, 80, 140, 120, 100, 210][hIdx],
                          height: 38,
                          borderRightWidth: 1,
                          borderColor: '#ccc',
                          justifyContent: 'center',
                          alignItems: hIdx === 0 ? 'center' : 'flex-start',
                          backgroundColor: '#e0e0e0',
                          paddingHorizontal: 8,
                        }}
                      >
                        <Text style={{ fontWeight: 'bold', textAlign: hIdx === 0 ? 'center' : 'left', paddingLeft: hIdx === 0 ? 0 : 2 }}>{header}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Table Rows - make vertically scrollable */}
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
                    {farmerProfiles.length > 0 ? (
                      farmerProfiles.map((r, rowIdx) => (
                        <View
                          key={r.id || rowIdx}
                          style={{
                            flexDirection: 'row',
                            borderBottomWidth: 1,
                            borderColor: '#eee',
                            backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f7f7f7',
                            height: 38,
                          }}
                        >
                          <View style={{ width: 60, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'center' }}>{rowIdx + 1}</Text>
                          </View>
                          <View style={{ width: 120, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.firstName}</Text>
                          </View>
                          <View style={{ width: 120, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.middleName}</Text>
                          </View>
                          <View style={{ width: 120, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.lastName}</Text>
                          </View>
                          <View style={{ width: 120, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{formatBirthday(r.birthday)}</Text>
                          </View>
                          <View style={{ width: 80, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.sex}</Text>
                          </View>
                          <View style={{ width: 140, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.contactNumber}</Text>
                          </View>
                          <View style={{ width: 120, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.cropName}</Text>
                          </View>
                          <View style={{ width: 100, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                            <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.cropArea}</Text>
                          </View>
                          <View style={{ width: 210, height: 38, borderRightWidth: 1, borderColor: '#ccc', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 8 }}>
                            <TouchableOpacity onPress={() => handleEditRecord(r)} style={{ marginRight: 6, backgroundColor: LIGHT_GREEN, padding: 6, borderRadius: 6 }}>
                              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteRecord(r.id)} style={{ backgroundColor: 'red', padding: 6, borderRadius: 6 }}>
                              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#888', fontStyle: 'italic', fontSize: 16 }}>No profiles found.</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
            {/* Action buttons at the bottom */}
            <View style={{ width: '100%', alignItems: 'center', marginTop: 8 }}>
              <TouchableOpacity style={{ marginTop: 10, alignSelf: 'center', backgroundColor: GREEN, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 }} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 12, alignSelf: 'center', backgroundColor: 'red', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 }} onPress={handleDeleteAllRecords}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Delete All Profiles</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      {/* Show uploading indicator */}
      {uploading && <Text style={{ color: 'orange', textAlign: 'center', marginVertical: 10 }}>Uploading profiles, please wait...</Text>}
      </View>
    </ReadOnlyView>
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
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eee',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  importButton: {
    marginTop: 20,
    backgroundColor: LIGHT_GREEN,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: WHITE,
  },
}); 