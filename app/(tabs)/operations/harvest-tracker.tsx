import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../components/AuthContext';
import { useRecordType } from '../../../components/RecordTypeContext';
import { useBarangay } from '../../../components/RoleContext';
import { deleteAllHarvestRecords, deleteHarvestRecord, fetchHarvestRecords, updateHarvestRecord, uploadHarvestRecord } from "../../../services/harvestUploadService";

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';

// List of months in order
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HarvestTrackerScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const { barangay } = useBarangay();
  const { setRecordType } = useRecordType();
  const [name, setName] = useState('');
  const [irrigationType, setIrrigationType] = useState('');
  const [cropType, setCropType] = useState('');
  const [typeVariety, setTypeVariety] = useState('');
  const [week1, setWeek1] = useState('');
  const [week2, setWeek2] = useState('');
  const [week3, setWeek3] = useState('');
  const [week4, setWeek4] = useState('');
  const [total, setTotal] = useState('0');
  const [modalVisible, setModalVisible] = useState(false);
  const [harvestRecords, setHarvestRecords] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [groupedHarvestRecords, setGroupedHarvestRecords] = useState<{ [year: string]: any[] }>({});
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>({});
  // Add state for selected year and expanded month
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  // Add state for selected month
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  // Add dropdown state
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Auto-load records for Viewers and Admins
  React.useEffect(() => {
    if (profile.role === 'Viewer') {
      router.push('/operations/harvest-tracker-records');
    } else if (profile.role === 'Admin') {
      setRecordType('harvest-tracker');
      router.push('/barangay-select-records');
    }
  }, [profile.role]);

  // Calculate total whenever any week value changes
  useEffect(() => {
    const week1Value = parseFloat(week1) || 0;
    const week2Value = parseFloat(week2) || 0;
    const week3Value = parseFloat(week3) || 0;
    const week4Value = parseFloat(week4) || 0;
    const calculatedTotal = week1Value + week2Value + week3Value + week4Value;
    setTotal(calculatedTotal.toString());
  }, [week1, week2, week3, week4]);

  const handleSave = async () => {
    if (!name.trim() || !irrigationType.trim() || !typeVariety.trim() || !cropType.trim()) {
      Alert.alert('Required Fields', 'Please fill in Name, Irrigation Type, Type/Variety, and Crop Type');
      return;
    }
    if (parseFloat(total) === 0) {
      Alert.alert('Required Fields', 'Please enter area harvested for at least one week');
      return;
    }

    // Prepare the record
    const record = {
      name,
      irrigationType,
      typeVariety,
      cropType,
      week1,
      week2,
      week3,
      week4,
      total,
      timestamp: Date.now(),
    };

    try {
      if (editingId) {
        await updateHarvestRecord(editingId, record);
        Alert.alert('Success', 'Harvest tracker updated!');
        setEditingId(null);
      } else {
        await uploadHarvestRecord(record);
        Alert.alert('Success', 'Harvest tracker saved and uploaded!');
      }
      handleClear();
    } catch (error) {
      Alert.alert('Error', 'Failed to save record.');
    }
  };

  const handleClear = () => {
    setName('');
    setIrrigationType('');
    setTypeVariety('');
    setCropType('');
    setWeek1('');
    setWeek2('');
    setWeek3('');
    setWeek4('');
    setTotal('0');
  };

  const handleEditRecord = (record: any) => {
    setName(record.name);
    setIrrigationType(record.irrigationType);
    setTypeVariety(record.typeVariety || '');
    setCropType(record.cropType);
    setWeek1(record.week1);
    setWeek2(record.week2);
    setWeek3(record.week3);
    setWeek4(record.week4);
    setTotal(record.total);
    setEditingId(record.id);
    setModalVisible(false);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteHarvestRecord(id);
      Alert.alert('Deleted', 'Record deleted successfully.');
      // Refresh records
      handleViewRecords();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete record.');
    }
  };

  const handleDeleteAllRecords = async () => {
    try {
      await deleteAllHarvestRecords();
      Alert.alert('Deleted', 'All records deleted successfully.');
      setHarvestRecords([]);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete all records.');
    }
  };

  const handleViewRecords = async () => {
    try {
      const records = await fetchHarvestRecords();
      if (!records || records.length === 0) {
        Alert.alert("No records found.");
        return;
      }
      // Remove duplicate entries (based on all fields except id)
      const seen = new Set();
      const uniqueRecords = records.filter(r => {
        // Exclude id from deduplication
        const { id, ...rest } = r;
        const key = JSON.stringify(rest);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      // Group records by year robustly
      const grouped: { [year: string]: any[] } = {};
      uniqueRecords.forEach(r => {
        let year = 'Unknown';
        if (typeof r === 'object' && r !== null) {
          if ('year' in r && r.year) {
            year = String(r.year);
          }
        }
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(r);
      });
      setGroupedHarvestRecords(grouped);
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch records.");
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

  // Map common Excel column headers to expected property names
  const headerMap: { [key: string]: string } = {
    'Name of the farmer': 'name',
    'Type of Soil': 'irrigationType',
    'Type/Variety': 'typeVariety',
    'Location': 'location',
    'Type of Crops': 'cropType',
    'Week 1': 'week1',
    'Week 2': 'week2',
    'Week 3': 'week3',
    'Week 4': 'week4',
    'Month': 'month',
    'Year': 'year',
    'Total': 'total',
    'Report Type': 'reportType',
  };

  const mapHeaders = (obj: any) => {
    const newObj: any = {};
    for (const key in obj) {
      const mappedKey = headerMap[key.trim()] || key.trim();
      newObj[mappedKey] = obj[key];
    }
    // Fix: If only cropType is present and typeVariety is missing, treat cropType as typeVariety
    if (newObj.cropType && !newObj.typeVariety) {
      newObj.typeVariety = newObj.cropType;
      newObj.cropType = '';
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
            console.log('Imported Record:', sanitized); // Debug log for imported data
            await uploadHarvestRecord(sanitized);
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

  const toggleExpandRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to group records by month for a given year
  const getMonthsForYear = (year: string) => {
    const records = groupedHarvestRecords[year] || [];
    const months: { [month: string]: any[] } = {};
    records.forEach(r => {
      let month = 'Unknown';
      if (typeof r === 'object' && r !== null && 'month' in r && r.month) {
        month = String(r.month);
      }
      if (!months[month]) months[month] = [];
      months[month].push(r);
    });
    return months;
  };

  // Helper to get records for selected year and month
  const getRecordsForYearMonth = (year: string, month: string) => {
    const records = groupedHarvestRecords[year] || [];
    return records.filter(r => {
      if (!r.month) return false;
      // Accept both string and number month
      return String(r.month).toLowerCase() === month.toLowerCase();
    });
  };

  // Define column widths for header and rows
  const columnWidths = [60, 140, 140, 140, 100, 210]; // No., Name, Irrigation Type, Crop Type, Total, Actions

  // Add 2025 to the year list for the buttons
  const allYears = Array.from(new Set(["2025", ...Object.keys(groupedHarvestRecords)])).sort((a, b) => b.localeCompare(a));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Harvest Tracker</Text>
          <Text style={styles.headerSubtitle}>Track harvest activities and progress.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      {/* Show form for non-Viewers, records for Viewers */}
      {profile.role !== 'Viewer' ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Basic Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account" size={24} color={GREEN} />
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name of the Farmer *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter farmer name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Type of Soil *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter soil type"
                  value={irrigationType}
                  onChangeText={setIrrigationType}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Type/Variety *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter crop variety"
                  value={typeVariety}
                  onChangeText={setTypeVariety}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Type of Crops *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter crop type"
                  value={cropType}
                  onChangeText={setCropType}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Weekly Harvest Data Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="calendar-week" size={24} color={GREEN} />
                <Text style={styles.sectionTitle}>Weekly Harvest Data</Text>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Week 1</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={week1}
                    onChangeText={setWeek1}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Week 2</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={week2}
                    onChangeText={setWeek2}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Week 3</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={week3}
                    onChangeText={setWeek3}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Week 4</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={week4}
                    onChangeText={setWeek4}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Total</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                  value={total}
                  editable={false}
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
      {/* Modal for Harvest.xlsx records remains for non-Viewers */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 20, alignItems: 'center', justifyContent: 'flex-start' }}>
          {/* Title on top */}
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10, alignSelf: 'center' }}>Harvest Records</Text>
          {/* Month and Year Dropdown Buttons Row, centered and close together */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 10 }}>
            {/* Month Dropdown Button */}
            <View style={{ alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREEN, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 }}
                onPress={() => setShowMonthDropdown(!showMonthDropdown)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginRight: 6 }}>{selectedMonth || 'Select Month'}</Text>
                <Ionicons name={showMonthDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
              </TouchableOpacity>
              {showMonthDropdown && (
                <View style={{ position: 'absolute', top: 44, left: 0, backgroundColor: '#fff', borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, zIndex: 10 }}>
                  {monthNames.map(month => (
                    <TouchableOpacity
                      key={month}
                      style={{ paddingVertical: 10, paddingHorizontal: 18, backgroundColor: selectedMonth === month ? LIGHT_GREEN : '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}
                      onPress={() => { setSelectedMonth(month); setShowMonthDropdown(false); }}
                    >
                      <Text style={{ color: selectedMonth === month ? '#fff' : '#333', fontWeight: selectedMonth === month ? 'bold' : 'normal' }}>{month}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {/* Year Dropdown Button */}
            <View style={{ alignItems: 'center', marginLeft: 8 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREEN, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 }}
                onPress={() => setShowYearDropdown(!showYearDropdown)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginRight: 6 }}>{selectedYear || 'Select Year'}</Text>
                <Ionicons name={showYearDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
              </TouchableOpacity>
              {showYearDropdown && (
                <View style={{ position: 'absolute', top: 44, right: 0, backgroundColor: '#fff', borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, zIndex: 10 }}>
                  {allYears.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={{ paddingVertical: 10, paddingHorizontal: 18, backgroundColor: selectedYear === year ? LIGHT_GREEN : '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}
                      onPress={() => { setSelectedYear(year); setShowYearDropdown(false); }}
                    >
                      <Text style={{ color: selectedYear === year ? '#fff' : '#333', fontWeight: selectedYear === year ? 'bold' : 'normal' }}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          {/* Table Data always rendered below buttons, tight to them, vertically scrollable */}
          <View style={{ flex: 1, width: '100%', marginTop: 0, marginBottom: 10, justifyContent: 'flex-start' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 4, alignSelf: 'flex-start' }}>
              {selectedMonth && selectedYear ? `${selectedMonth} ${selectedYear}` : 'Records'}
            </Text>
            <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ borderWidth: 2, borderColor: '#888', borderRadius: 8, minWidth: 500, flex: 1, backgroundColor: '#fafbfc', minHeight: 456, borderBottomWidth: 2, marginBottom: 8 }}>
                {/* Table Header */}
                <View style={{ flexDirection: 'row', backgroundColor: '#e0e0e0', borderBottomWidth: 1, borderColor: '#ccc', height: 38, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  {['No.', 'Name', 'Irrigation Type', 'Location', 'Type/Variety', 'Crop Type', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Total', ' '].map((header, hIdx) => (
                    <View
                      key={hIdx}
                      style={{
                        width: [60, 140, 140, 140, 140, 140, 80, 80, 80, 80, 100, 210][hIdx],
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
                  {(selectedYear && selectedMonth && getRecordsForYearMonth(selectedYear, selectedMonth).length > 0) ? (
                    getRecordsForYearMonth(selectedYear, selectedMonth).map((r, rowIdx) => (
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
                        <View style={{ width: 140, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.name}</Text>
                        </View>
                        <View style={{ width: 140, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.irrigationType}</Text>
                        </View>
                        <View style={{ width: 140, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.location}</Text>
                        </View>
                        <View style={{ width: 140, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.typeVariety}</Text>
                        </View>
                        <View style={{ width: 140, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.cropType}</Text>
                        </View>
                        <View style={{ width: 80, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.week1 || 0}</Text>
                        </View>
                        <View style={{ width: 80, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.week2 || 0}</Text>
                        </View>
                        <View style={{ width: 80, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.week3 || 0}</Text>
                        </View>
                        <View style={{ width: 80, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.week4 || 0}</Text>
                        </View>
                        <View style={{ width: 100, height: 38, borderRightWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 }}>
                          <Text style={{ textAlign: 'left', paddingLeft: 2 }}>{r.total}</Text>
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
                      <Text style={{ color: '#888', fontStyle: 'italic', fontSize: 16 }}>No records found for this month.</Text>
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
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weekItem: {
    width: '48%',
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  weekInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlign: 'center',
  },
  totalContainer: {
    backgroundColor: GREEN,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
  // Added styles for improved button layout
  buttonRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  importButton: {
    marginTop: 18,
    alignSelf: 'center',
    backgroundColor: LIGHT_GREEN,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
}); 