import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../components/AuthContext';
import { useRecordType } from '../../../components/RecordTypeContext';
import { useBarangay } from '../../../components/RoleContext';
import { deleteAllLivestockRecords, deleteLivestockRecord, fetchLivestockRecords, updateLivestockRecord, uploadLivestockRecord } from '../../../services/livestockUploadService';

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
  const { barangay } = useBarangay();
  const { setRecordType } = useRecordType();
  const [farmerName, setFarmerName] = useState('');
  const [animals, setAnimals] = useState<AnimalEntry[]>([
    { id: '1', type: '', maleCount: '', femaleCount: '' }
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [livestockRecords, setLivestockRecords] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Auto-load records for Viewers and Admins
  React.useEffect(() => {
    if (profile.role === 'Viewer') {
      router.push('/farmers/livestock-records');
    } else if (profile.role === 'Admin') {
      setRecordType('livestock');
      router.push('/barangay-select-records');
    }
  }, [profile.role]);

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

  const handleSave = async () => {
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
    // Save each animal as a separate record with farmerName
    try {
      for (const animal of animals) {
        if (animal.type.trim() && (animal.maleCount.trim() || animal.femaleCount.trim())) {
          const record = {
            farmerName,
            type: animal.type,
            maleCount: animal.maleCount,
            femaleCount: animal.femaleCount,
            barangay,
            timestamp: Date.now(),
          };
          if (editingId && animal.id === editingId) {
            await updateLivestockRecord(editingId, record);
            setEditingId(null);
          } else {
            await uploadLivestockRecord(record);
          }
        }
      }
      Alert.alert('Success', 'Livestock inventory saved and uploaded!');
      handleClear();
    } catch (error) {
      Alert.alert('Error', 'Failed to save inventory.');
    }
  };

  const handleEditRecord = (record: any) => {
    setFarmerName(record.farmerName);
    setAnimals([{ id: record.id, type: record.type, maleCount: record.maleCount, femaleCount: record.femaleCount }]);
    setEditingId(record.id);
    setModalVisible(false);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteLivestockRecord(id);
      Alert.alert('Deleted', 'Record deleted successfully.');
      handleViewRecords();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete record.');
    }
  };

  const handleDeleteAllRecords = async () => {
    try {
      await deleteAllLivestockRecords();
      Alert.alert('Deleted', 'All records deleted successfully.');
      setLivestockRecords([]);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete all records.');
    }
  };

  const handleViewRecords = async () => {
    try {
      const records = await fetchLivestockRecords();
      if (!records || records.length === 0) {
        Alert.alert('No records found.');
        return;
      }
      setLivestockRecords(records);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch records.');
    }
  };

  const handleClear = () => {
    setFarmerName('');
    setAnimals([{ id: '1', type: '', maleCount: '', femaleCount: '' }]);
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
    'Farmer Name': 'farmerName',
    'Type of Animal': 'type',
    'Male Count': 'maleCount',
    'Female Count': 'femaleCount',
  };

  const mapHeaders = (obj: any) => {
    const newObj: any = {};
    for (const key in obj) {
      const mappedKey = headerMap[key.trim()] || key.trim();
      newObj[mappedKey] = obj[key];
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
            await uploadLivestockRecord(sanitized);
          }
          setUploading(false);
          Alert.alert('Success', 'All records uploaded!');
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

      {/* Show form for non-Viewers, records for Viewers */}
      {profile.role !== 'Viewer' ? (
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
      {/* Modal for Livestock Records remains for non-Viewers */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 20, alignItems: 'center', justifyContent: 'flex-start' }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10, alignSelf: 'center' }}>Livestock Records</Text>
          <View style={{ flex: 1, width: '100%', marginTop: 0, marginBottom: 10, justifyContent: 'flex-start' }}>
            <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ borderWidth: 2, borderColor: '#888', borderRadius: 8, minWidth: 700, flex: 1, backgroundColor: '#fafbfc', minHeight: 456, borderBottomWidth: 2, marginBottom: 8 }}>
                {/* Table Header */}
                <View style={{ flexDirection: 'row', backgroundColor: '#e0e0e0', borderBottomWidth: 1, borderColor: '#ccc', height: 38, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  {['No.', 'Farmer Name', 'Type of Animal', 'Male Count', 'Female Count', ' '].map((header, hIdx) => (
                    <View
                      key={hIdx}
                      style={{
                        width: [60, 180, 180, 120, 120, 210][hIdx],
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
                  {livestockRecords.length > 0 ? (
                    livestockRecords.map((r, rowIdx) => (
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
                        <View style={{ width: 180, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.farmerName}</Text>
                        </View>
                        <View style={{ width: 180, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.type}</Text>
                        </View>
                        <View style={{ width: 120, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.maleCount}</Text>
                        </View>
                        <View style={{ width: 120, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.femaleCount}</Text>
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
                      <Text style={{ color: '#888', fontStyle: 'italic', fontSize: 16 }}>No records found.</Text>
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
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Delete All Records</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Show uploading indicator */}
      {uploading && <Text style={{ color: 'orange', textAlign: 'center', marginVertical: 10 }}>Uploading records, please wait...</Text>}
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