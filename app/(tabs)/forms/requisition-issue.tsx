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

export default function RequisitionIssueScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const { setRecordType } = useRecordType();
  const { barangay } = useBarangay();
  
  const [formType, setFormType] = useState('requisition'); // 'requisition' or 'issue'
  const [requestorName, setRequestorName] = useState('');
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [purpose, setPurpose] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [remarks, setRemarks] = useState('');

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
    if (!requestorName || !department || !date || !itemName || !quantity) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }
    
    Alert.alert('Success', `${formType === 'requisition' ? 'Requisition' : 'Issue'} slip submitted successfully!`);
  };

  const toggleFormType = () => {
    setFormType(formType === 'requisition' ? 'issue' : 'requisition');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Requisition and Issue Slips</Text>
          <Text style={styles.headerSubtitle}>Manage inventory requests and issues.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Form Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, formType === 'requisition' && styles.activeToggle]}
              onPress={() => setFormType('requisition')}
            >
              <MaterialCommunityIcons 
                name="file-document-outline" 
                size={20} 
                color={formType === 'requisition' ? WHITE : GREEN} 
              />
              <Text style={[styles.toggleText, formType === 'requisition' && styles.activeToggleText]}>
                Requisition Slip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, formType === 'issue' && styles.activeToggle]}
              onPress={() => setFormType('issue')}
            >
              <MaterialCommunityIcons 
                name="package-variant" 
                size={20} 
                color={formType === 'issue' ? WHITE : GREEN} 
              />
              <Text style={[styles.toggleText, formType === 'issue' && styles.activeToggleText]}>
                Issue Slip
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {formType === 'requisition' ? 'Requisition Details' : 'Issue Details'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Requestor Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter requestor's full name"
                value={requestorName}
                onChangeText={setRequestorName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Department *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter department name"
                value={department}
                onChangeText={setDepartment}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter item name"
                value={itemName}
                onChangeText={setItemName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Unit</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., kg, pcs, liters"
                  value={unit}
                  onChangeText={setUnit}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purpose</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter purpose of request/issue"
                value={purpose}
                onChangeText={setPurpose}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approval & Remarks</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Approved By</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter approver's name"
                value={approvedBy}
                onChangeText={setApprovedBy}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional remarks or notes"
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <MaterialCommunityIcons name="content-save" size={20} color={WHITE} />
            <Text style={styles.submitButtonText}>
              Submit {formType === 'requisition' ? 'Requisition' : 'Issue'} Slip
            </Text>
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeToggle: {
    backgroundColor: GREEN,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  activeToggleText: {
    color: WHITE,
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
  row: {
    flexDirection: 'row',
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
    textAlignVertical: 'top',
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