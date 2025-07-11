import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../components/AuthContext';
import { useRecordType } from '../../../components/RecordTypeContext';
import { useBarangay } from '../../../components/RoleContext';
import { fetchAccomplishmentReports, uploadAccomplishmentReport } from '../../../services/accomplishmentReportService';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';

export default function AccomplishmentReportsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const { barangay } = useBarangay();
  const { setRecordType } = useRecordType();
  const [date, setDate] = useState('');
  const [accomplishment, setAccomplishment] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Auto-load records for Viewers and Admins
  React.useEffect(() => {
    if (profile.role === 'Viewer') {
      router.push('/monitoring/accomplishment-reports-records');
    } else if (profile.role === 'Admin') {
      setRecordType('accomplishment-reports');
      router.push('/barangay-select-records');
    }
  }, [profile.role]);

  const handleSave = async () => {
    if (!date.trim() || !accomplishment.trim()) {
      Alert.alert('Required Fields', 'Please fill in Date and Accomplishment');
      return;
    }
    if (!barangay) {
      Alert.alert('Barangay not set', 'Please select your barangay.');
      return;
    }
    try {
      await uploadAccomplishmentReport({
        date,
        accomplishment,
        remarks,
        barangay,
        timestamp: Date.now(),
      });
      Alert.alert('Success', 'Accomplishment report saved successfully!');
      handleClear();
    } catch (error) {
      Alert.alert('Error', 'Failed to save accomplishment report.');
    }
  };

  const handleClear = () => {
    setDate('');
    setAccomplishment('');
    setRemarks('');
  };

  const handleViewRecords = async () => {
    try {
      const data = await fetchAccomplishmentReports(barangay || undefined);
      setReports(data);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch accomplishment reports.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Accomplishment Reports</Text>
          <Text style={styles.headerSubtitle}>Track and submit accomplishment reports.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      {/* Show form for non-Viewers, records for Viewers */}
      {profile.role !== 'Viewer' ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Report Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="clipboard-check" size={24} color={GREEN} />
                <Text style={styles.sectionTitle}>Report Information</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/DD/YYYY"
                  value={date}
                  onChangeText={setDate}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Accomplishment *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the accomplishment or activity completed..."
                  value={accomplishment}
                  onChangeText={setAccomplishment}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Remarks</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Additional notes, observations, or comments..."
                  value={remarks}
                  onChangeText={setRemarks}
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
      ) : (
        // Redirect Viewers to dedicated records page
        <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
            Redirecting to records...
          </Text>
        </View>
      )}
      {/* Modal or Section to display fetched reports remains for non-Viewers */}
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
    marginBottom: 20,
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
    minHeight: 100,
    paddingTop: 16,
    paddingBottom: 16,
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