import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
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
      console.log('🔄 Loading farmer form data from farmerProfiles collection...');
      
      // Load ONLY from farmerProfiles collection (no AsyncStorage, no old data)
      if (!user?.email) {
        console.log('No user email found');
        setFarmerData(null);
        return;
      }

      const farmerProfileDoc = await getDoc(doc(db, 'farmerProfiles', user.email));
      if (farmerProfileDoc.exists()) {
        const profileData = farmerProfileDoc.data();
        console.log('✅ Farmer profile data loaded from Firebase:', profileData);
        setFarmerData(profileData);
      } else {
        console.log('No farmer profile found in farmerProfiles collection');
        setFarmerData(null);
      }
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

  const handleEditForm = (sectionKey: string) => {
    // Navigate to farmers screen and open the specific form section
    // Store the section to open in AsyncStorage so farmers screen can read it
    AsyncStorage.setItem('editFormSection', sectionKey).then(() => {
      router.push('/(tabs)/farmers');
    });
  };

  const renderFormSection = (title: string, data: any, sectionKey: string) => {
    if (!data || Object.keys(data).length === 0) return null;
    
    return (
      <View style={styles.formSection} key={sectionKey}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditForm(sectionKey)}
          >
            <Ionicons name="create-outline" size={18} color={GREEN} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionContent}>
          {Object.entries(data).map(([key, value]: [string, any]) => {
            // Skip only isSubmitted field, show everything else
            if (key === 'isSubmitted') {
              return null;
            }
            
            // Format the value for display
            let displayValue = '';
            if (key === 'livestock' && Array.isArray(value) && data.livestockCounts) {
              // Special handling for livestock with counts
              const livestockWithCounts = value.map((livestock: string) => {
                const count = data.livestockCounts[livestock];
                return count ? `${livestock} (${count})` : livestock;
              });
              // Add other livestock with count if exists
              if (data.otherLivestock) {
                const otherCount = data.otherLivestockCount;
                const otherDisplay = otherCount ? `${data.otherLivestock} (${otherCount})` : data.otherLivestock;
                livestockWithCounts.push(otherDisplay);
              }
              displayValue = livestockWithCounts.length > 0 ? livestockWithCounts.join(', ') : 'Not specified';
            } else if (key === 'farmCommodity' && Array.isArray(value) && data.commodityCounts) {
              // Special handling for farm commodity with counts
              const commodityWithCounts = value.map((commodity: string) => {
                const count = data.commodityCounts[commodity];
                return count ? `${commodity} (${count})` : commodity;
              });
              // Add other commodity with count if exists
              if (data.otherCommodity) {
                const otherCount = data.otherCommodityCount;
                const otherDisplay = otherCount ? `${data.otherCommodity} (${otherCount})` : data.otherCommodity;
                commodityWithCounts.push(otherDisplay);
              }
              displayValue = commodityWithCounts.length > 0 ? commodityWithCounts.join(', ') : 'Not specified';
            } else if (key === 'otherLivestock' && data.otherLivestock) {
              // Skip otherLivestock as it's shown with livestock
              return null;
            } else if (key === 'otherLivestockCount') {
              // Skip otherLivestockCount as it's shown with otherLivestock
              return null;
            } else if (key === 'otherCommodity' && data.otherCommodity) {
              // Skip otherCommodity as it's shown with farmCommodity
              return null;
            } else if (key === 'otherCommodityCount') {
              // Skip otherCommodityCount as it's shown with otherCommodity
              return null;
            } else if (Array.isArray(value)) {
              displayValue = value.length > 0 ? value.join(', ') : 'Not specified';
            } else if (typeof value === 'object' && value !== null) {
              // Skip livestockCounts and commodityCounts as they're displayed with their arrays
              if (key === 'livestockCounts' || key === 'commodityCounts') {
                return null;
              }
              displayValue = JSON.stringify(value, null, 2);
            } else {
              displayValue = value || 'Not specified';
            }
            
            // Skip livestockCounts and commodityCounts fields as they're shown with their arrays
            if (key === 'livestockCounts' || key === 'commodityCounts') {
              return null;
            }
            
            return (
              <View style={styles.dataRow} key={key}>
                <Text style={styles.dataLabel}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
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
  emptyValue: {
    color: '#999',
    fontStyle: 'italic',
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
