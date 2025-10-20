import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';

export default function HarvestTrackerScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [irrigationType, setIrrigationType] = useState('');
  const [cropType, setCropType] = useState('');
  const [week1, setWeek1] = useState('');
  const [week2, setWeek2] = useState('');
  const [week3, setWeek3] = useState('');
  const [week4, setWeek4] = useState('');
  const [total, setTotal] = useState('0');

  // Calculate total whenever any week value changes
  useEffect(() => {
    const week1Value = parseFloat(week1) || 0;
    const week2Value = parseFloat(week2) || 0;
    const week3Value = parseFloat(week3) || 0;
    const week4Value = parseFloat(week4) || 0;
    
    const calculatedTotal = week1Value + week2Value + week3Value + week4Value;
    setTotal(calculatedTotal.toString());
  }, [week1, week2, week3, week4]);

  const handleSave = () => {
    if (!name.trim() || !irrigationType.trim() || !cropType.trim()) {
      Alert.alert('Required Fields', 'Please fill in Name, Irrigation Type, and Crop Type/Variety');
      return;
    }

    if (parseFloat(total) === 0) {
      Alert.alert('Required Fields', 'Please enter area harvested for at least one week');
      return;
    }

    Alert.alert('Success', 'Harvest tracker saved successfully!');
  };

  const handleClear = () => {
    setName('');
    setIrrigationType('');
    setCropType('');
    setWeek1('');
    setWeek2('');
    setWeek3('');
    setWeek4('');
    setTotal('0');
  };

  const handleViewRecords = () => {
    Alert.alert('View Records', 'This will show all saved harvest tracker records');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Harvest Tracker</Text>
          <Text style={styles.headerSubtitle}>Track harvest activities and yields.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Basic Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter farmer name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Irrigation Type *</Text>
              <TextInput
                style={styles.input}
                placeholder="Irrigated or Non-irrigated"
                value={irrigationType}
                onChangeText={setIrrigationType}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Crop Type/Variety *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter crop type or variety"
                value={cropType}
                onChangeText={setCropType}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Area Harvested Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="basket" size={24} color={GREEN} />
              <Text style={styles.sectionTitle}>Area Harvested (Hectares)</Text>
            </View>
            
            <View style={styles.weekGrid}>
              <View style={styles.weekItem}>
                <Text style={styles.weekLabel}>Week 1</Text>
                <TextInput
                  style={styles.weekInput}
                  placeholder="0.0"
                  value={week1}
                  onChangeText={setWeek1}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.weekItem}>
                <Text style={styles.weekLabel}>Week 2</Text>
                <TextInput
                  style={styles.weekInput}
                  placeholder="0.0"
                  value={week2}
                  onChangeText={setWeek2}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.weekItem}>
                <Text style={styles.weekLabel}>Week 3</Text>
                <TextInput
                  style={styles.weekInput}
                  placeholder="0.0"
                  value={week3}
                  onChangeText={setWeek3}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.weekItem}>
                <Text style={styles.weekLabel}>Week 4</Text>
                <TextInput
                  style={styles.weekInput}
                  placeholder="0.0"
                  value={week4}
                  onChangeText={setWeek4}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Total Display */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Area Harvested:</Text>
              <Text style={styles.totalValue}>{total} hectares</Text>
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
}); 