import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../components/AuthContext';
import { useRecordType } from '../components/RecordTypeContext';
import { Barangay, useBarangay } from '../components/RoleContext';

const BARANGAYS: Barangay[] = [
  'Poblacion',
  'Rizal',
  'Tabugon',
  'San Lorenzo',
  'San Pedro',
  'Pulongguit-guit',
  'Basiad',
  'Plaridel',
  'Don Tomas',
  'Maulawin',
  'Patag Ibaba',
  'Patag Ilaya',
  'Bulala',
  'Guitol',
  'Kagtalaba',
];

export default function BarangaySelectRecords() {
  const router = useRouter();
  const { profile } = useAuth();
  const { barangay, setBarangay } = useBarangay();
  const { recordType } = useRecordType();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBarangays, setFilteredBarangays] = useState<Barangay[]>(BARANGAYS);

  useEffect(() => {
    if (searchQuery) {
      const filtered = BARANGAYS.filter(barangay =>
        barangay.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBarangays(filtered);
    } else {
      setFilteredBarangays(BARANGAYS);
    }
  }, [searchQuery]);

  const handleBarangaySelect = (selectedBarangay: Barangay) => {
    setBarangay(selectedBarangay);
    
    // Navigate to the appropriate records page with barangay filter
    switch (recordType) {
      case 'farmer-profiles':
        router.push('/farmers/farmer-profiles-records');
        break;
      case 'livestock':
        router.push('/farmers/livestock-records');
        break;
      case 'fertilizer-logs':
        router.push('/monitoring/fertilizer-logs-records');
        break;
      case 'crop-monitoring':
        router.push('/monitoring/crop-monitoring-records');
        break;
      case 'accomplishment-reports':
        router.push('/monitoring/accomplishment-reports-records');
        break;
      case 'planting-tracker':
        router.push('/operations/planting-tracker-records');
        break;
      case 'harvest-tracker':
        router.push('/operations/harvest-tracker-records');
        break;
      default:
        Alert.alert('Error', 'Invalid record type');
        break;
    }
  };

  const getRecordTypeTitle = () => {
    switch (recordType) {
      case 'farmer-profiles':
        return 'Farmer Profiles';
      case 'livestock':
        return 'Livestock Inventory';
      case 'fertilizer-logs':
        return 'Fertilizer/Pesticide Logs';
      case 'crop-monitoring':
        return 'Crop Monitoring';
      case 'accomplishment-reports':
        return 'Accomplishment Reports';
      case 'planting-tracker':
        return 'Planting Tracker';
      case 'harvest-tracker':
        return 'Harvest Tracker';
      default:
        return 'Records';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Barangay</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          View {getRecordTypeTitle()} for:
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search barangay..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView style={styles.barangayList} showsVerticalScrollIndicator={false}>
        {filteredBarangays.map((barangay, index) => (
          <TouchableOpacity
            key={index}
            style={styles.barangayItem}
            onPress={() => handleBarangaySelect(barangay)}
          >
            <Text style={styles.barangayText}>{barangay}</Text>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  barangayList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  barangayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  barangayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
}); 