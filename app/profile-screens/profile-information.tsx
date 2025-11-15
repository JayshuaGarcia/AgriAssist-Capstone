import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../lib/firebase';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function ProfileInformationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [farmerData, setFarmerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadFarmerData();
  }, []);

  // Reload data when screen comes into focus (after editing)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Profile information screen focused - reloading data...');
      loadFarmerData();
    }, [])
  );

  const loadFarmerData = async () => {
    try {
      setLoading(true);
      if (!user?.email) {
        Alert.alert('Error', 'User email not found');
        return;
      }

      // Get farmer profile from farmerProfiles collection
      const farmerProfileDoc = await getDoc(doc(db, 'farmerProfiles', user.email));
      if (farmerProfileDoc.exists()) {
        const profileData = farmerProfileDoc.data();
        setFarmerData(profileData);
      } else {
        Alert.alert('No Data', 'No farmer information found for this account');
      }
    } catch (error) {
      console.error('Error loading farmer data:', error);
      Alert.alert('Error', 'Failed to load farmer information');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleEditForm = (sectionKey: string) => {
    // Navigate to farmers screen and open the specific form section
    // Store the section to open in AsyncStorage so farmers screen can read it
    AsyncStorage.setItem('editFormSection', sectionKey).then(() => {
      router.push('/(tabs)/farmers');
    });
  };

  const renderFormSection = (title: string, data: any, sectionKey: string) => {
    if (!data || Object.keys(data).length === 0) return null;

    const isExpanded = expandedSections[sectionKey];
    
    return (
      <View style={styles.formSection} key={sectionKey}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity 
            style={styles.sectionHeaderLeft}
            onPress={() => toggleSection(sectionKey)}
          >
            <Text style={styles.sectionTitle}>{title}</Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={GREEN} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditForm(sectionKey)}
          >
            <Ionicons name="create-outline" size={18} color={GREEN} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            {Object.entries(data).map(([key, value]: [string, any]) => (
              <View style={styles.dataRow} key={key}>
                <Text style={styles.dataLabel}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text style={styles.dataValue}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingText}>Loading your information...</Text>
      </View>
    );
  }

  if (!farmerData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile Information</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Ionicons name="document-outline" size={64} color="#ccc" />
          <Text style={styles.noDataTitle}>No Information Available</Text>
          <Text style={styles.noDataText}>
            Complete the farmer registration form to see your profile information here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Information</Text>
        <Text style={styles.subtitle}>Your farmer registration details</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.basicInfoCard}>
          <View style={styles.basicInfoHeader}>
            <Ionicons name="person-circle" size={24} color={GREEN} />
            <Text style={styles.basicInfoTitle}>Basic Information</Text>
          </View>
          <View style={styles.basicInfoContent}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{farmerData.name || 'Not provided'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{farmerData.email || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Form Data Sections */}
        {farmerData.formData && (
          <View style={styles.formDataContainer}>
            <Text style={styles.formDataTitle}>Registration Forms</Text>
            
            {renderFormSection(
              'Demographic Information', 
              farmerData.formData.demographicInformation, 
              'demographic'
            )}
            
            {renderFormSection(
              'Farming Profile', 
              farmerData.formData.farmingProfile, 
              'farming'
            )}
            
            {renderFormSection(
              'Economic and Financial Information', 
              farmerData.formData.economicAndFinancialInformation, 
              'economic'
            )}
            
            {renderFormSection(
              'Technology and Innovation', 
              farmerData.formData.technologyAndInnovation, 
              'technology'
            )}
            
            {renderFormSection(
              'Support and Resources', 
              farmerData.formData.supportAndResources, 
              'support'
            )}
            
            {renderFormSection(
              'Addresses and Household', 
              farmerData.formData.addressesAndHousehold, 
              'addresses'
            )}
            
            {renderFormSection(
              'Home and Assets', 
              farmerData.formData.homeAndAssets, 
              'assets'
            )}
          </View>
        )}

        {/* Additional Information */}
        {farmerData.additionalInfo && (
          <View style={styles.additionalInfoCard}>
            <View style={styles.additionalInfoHeader}>
              <Ionicons name="information-circle" size={24} color={GREEN} />
              <Text style={styles.additionalInfoTitle}>Additional Information</Text>
            </View>
            <View style={styles.additionalInfoContent}>
              {Object.entries(farmerData.additionalInfo).map(([key, value]: [string, any]) => (
                <View style={styles.infoItem} key={key}>
                  <Text style={styles.infoLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                  <Text style={styles.infoValue}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: GREEN,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#e8f5e8',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  basicInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: GREEN,
  },
  basicInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e8e8e8',
  },
  basicInfoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  basicInfoContent: {
    gap: 16,
  },
  infoItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  formDataContainer: {
    marginBottom: 20,
  },
  formDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 16,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e8e8e8',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    letterSpacing: 0.2,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8f4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GREEN,
    gap: 4,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN,
  },
  sectionContent: {
    padding: 16,
  },
  dataRow: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  dataValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
    textAlign: 'center',
  },
  additionalInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: GREEN,
  },
  additionalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e8e8e8',
  },
  additionalInfoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  additionalInfoContent: {
    gap: 16,
  },
});













