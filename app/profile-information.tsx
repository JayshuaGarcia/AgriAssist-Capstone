import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';

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

  const loadFarmerData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading farmer form data from AsyncStorage...');
      
      // Get all AsyncStorage keys (same method as admin)
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter keys that start with 'farmerFormData_'
      const farmerFormKeys = keys.filter(key => key.startsWith('farmerFormData_'));
      
      console.log('Found farmer form keys:', farmerFormKeys);
      
      // Look for data with current user's UID first
      const currentUserKey = `farmerFormData_${user?.uid}`;
      let foundData = null;
      
      // Try current user's key first
      if (farmerFormKeys.includes(currentUserKey)) {
        const storedFormData = await AsyncStorage.getItem(currentUserKey);
        if (storedFormData) {
          foundData = JSON.parse(storedFormData);
          console.log('Found form data for current user:', foundData);
        }
      }
      
      // If not found, try to find any data for this user (fallback)
      if (!foundData && farmerFormKeys.length > 0) {
        for (const key of farmerFormKeys) {
          const storedFormData = await AsyncStorage.getItem(key);
          if (storedFormData) {
            const parsedData = JSON.parse(storedFormData);
            // Check if this data belongs to current user by email
            if (parsedData.userEmail === user?.email || parsedData.email === user?.email) {
              foundData = parsedData;
              console.log('Found form data for user by email:', foundData);
              break;
            }
          }
        }
      }
      
      // If still not found, just take the first available data (for testing)
      if (!foundData && farmerFormKeys.length > 0) {
        const firstKey = farmerFormKeys[0];
        const storedFormData = await AsyncStorage.getItem(firstKey);
        if (storedFormData) {
          foundData = JSON.parse(storedFormData);
          console.log('Using first available form data:', foundData);
        }
      }
      
      if (foundData) {
        // Combine with basic user info
        const combinedData = {
          name: user?.displayName || foundData.name || 'User',
          email: user?.email || foundData.email || '',
          role: 'Farmer',
          location: foundData.location || '',
          formData: foundData
        };
        
        setFarmerData(combinedData);
        console.log('✅ Form data loaded successfully');
        return;
      }

      // Fallback: try to get user document from Firestore
      if (user?.email) {
        const userDoc = await getDoc(doc(db, 'users', user.email));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data loaded from Firebase:', userData);
          setFarmerData(userData);
          return;
        }
      }

      console.log('No form data found in AsyncStorage or Firebase');
      setFarmerData(null);
    } catch (error) {
      console.error('Error loading farmer data:', error);
      setFarmerData(null);
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

  const renderFormSection = (title: string, data: any, sectionKey: string) => {
    if (!data || Object.keys(data).length === 0) return null;
    
    return (
      <View style={styles.formSection} key={sectionKey}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        
        <View style={styles.sectionContent}>
          {Object.entries(data).map(([key, value]: [string, any]) => {
            // Skip only isSubmitted field, show everything else
            if (key === 'isSubmitted') {
              return null;
            }
            
            // Format the value for display
            let displayValue = '';
            if (Array.isArray(value)) {
              displayValue = value.length > 0 ? value.join(', ') : 'Not specified';
            } else if (typeof value === 'object' && value !== null) {
              displayValue = JSON.stringify(value, null, 2);
            } else {
              displayValue = value || 'Not specified';
            }
            
            return (
              <View style={styles.dataRow} key={key}>
                <Text style={styles.dataLabel}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </Text>
                <Text style={[styles.dataValue, !value || value === '' ? styles.emptyValue : null]}>
                  {displayValue}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <View style={styles.topBorder} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Information</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading your information...</Text>
        </View>
      </View>
    );
  }

  if (!farmerData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <View style={styles.topBorder} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Information</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.noDataContainer}>
          <Ionicons name="document-outline" size={64} color={GREEN} />
          <Text style={styles.noDataTitle}>No Registration Data Found</Text>
          <Text style={styles.noDataText}>
            You haven't completed the farmer registration form yet.{'\n\n'}
            To see your profile information here, please complete the registration form in the Farmers section.
          </Text>
          <TouchableOpacity style={styles.registerButton}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.registerButtonText}>Go to Registration</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={styles.topBorder} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.basicInfoCard}>
          <View style={styles.basicInfoHeader}>
            <Ionicons name="person-circle" size={24} color={GREEN} />
            <Text style={styles.basicInfoTitle}>Basic Information</Text>
          </View>
          <View style={styles.basicInfoContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{farmerData.name || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{farmerData.email || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>{farmerData.role || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{farmerData.location || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Form Data Sections */}
        {farmerData.formData && (
          <View style={styles.formDataContainer}>
            <Text style={styles.formDataTitle}>Registration Forms</Text>
            
            {renderFormSection(
              'Demographics', 
              farmerData.formData.demographics, 
              'demographics'
            )}
            
            {renderFormSection(
              'Farming Profile', 
              farmerData.formData.farmingProfile, 
              'farmingProfile'
            )}
            
            {renderFormSection(
              'Economic Financial', 
              farmerData.formData.economicFinancial, 
              'economicFinancial'
            )}
            
            {renderFormSection(
              'Technology Innovation', 
              farmerData.formData.technologyInnovation, 
              'technologyInnovation'
            )}
            
            {renderFormSection(
              'Support Resources', 
              farmerData.formData.supportResources, 
              'supportResources'
            )}
            
            {renderFormSection(
              'Addresses Household', 
              farmerData.formData.addressesHousehold, 
              'addressesHousehold'
            )}
            
            {renderFormSection(
              'Home Assets', 
              farmerData.formData.homeAssets, 
              'homeAssets'
            )}
            
            {renderFormSection(
              'Farming Demographics', 
              farmerData.formData.farmingDemographics, 
              'farmingDemographics'
            )}
            
            {renderFormSection(
              'Income Marketing', 
              farmerData.formData.incomeMarketing, 
              'incomeMarketing'
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
                <View style={styles.infoRow} key={key}>
                  <Text style={styles.infoLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
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
  topBorder: {
    height: 36,
    width: '100%',
    backgroundColor: GREEN,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: GREEN
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
    color: GREEN,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  basicInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  basicInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  basicInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginLeft: 8,
  },
  basicInfoContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    textAlign: 'center',
  },
  sectionContent: {
    padding: 16,
  },
  dataRow: {
    marginBottom: 12,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyValue: {
    color: '#999',
    fontStyle: 'italic',
  },
  additionalInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  additionalInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginLeft: 8,
  },
  additionalInfoContent: {
    gap: 12,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
