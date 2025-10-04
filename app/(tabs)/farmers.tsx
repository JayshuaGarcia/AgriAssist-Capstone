import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../lib/firebase';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';
const GRAY = '#666666';

interface FeatureButton {
  id: string;
  title: string;
  icon: string;
}

export default function FarmersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureButton | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state management
  const [formData, setFormData] = useState({
    demographics: {
      age: '',
      gender: '',
      maritalStatus: '',
      dependents: '',
      education: '',
      monthlyIncome: '',
      isSubmitted: false
    },
    farmingProfile: {
      yearsFarming: '',
      farmCommodity: [] as string[],
      livestock: [] as string[],
      landOwnership: '',
      farmSize: '',
      farmingMethods: [] as string[],
      otherCommodity: '',
      otherLivestock: '',
      otherFarmSize: '',
      isSubmitted: false
    },
    economicFinancial: {
      incomeSources: '',
      farmingFinances: '',
      farmingIncomePercentage: '',
      governmentAssistance: '',
      ngoAssistance: '',
      industryAssistance: '',
      otherIncome: '',
      otherFinances: '',
      isSubmitted: false
    },
    technologyInnovation: {
      farmingEquipment: [] as string[],
      newTechniques: '',
      modernPractices: '',
      agriculturalInfo: [] as string[],
      otherEquipment: '',
      otherInfo: '',
      isSubmitted: false
    },
    supportResources: {
      farmersAssociation: '',
      governmentPrograms: '',
      governmentSupport: [] as string[],
      ngoSupport: [] as string[],
      industrySupport: [] as string[],
      extensionServices: '',
      otherGovSupport: '',
      otherNgoSupport: '',
      otherIndustrySupport: '',
      isSubmitted: false
    },
    addressesHousehold: {
      residentialAddress: '',
      farmAddress: '',
      householdSize: '',
      adultsInHousehold: '',
      childrenInHousehold: '',
      educationAttainment: '',
      maritalStatus: '',
      isSubmitted: false
    },
    homeAssets: {
      electricity: '',
      television: '',
      refrigerator: '',
      comfortRoom: '',
      houseType: '',
      monthlyRent: '',
      houseOwnership: '',
      incomeType: '',
      monthlyExpenses: '',
      farmingType: '',
      isSubmitted: false
    },
    farmingDemographics: {
      farmSizeSqm: '',
      landOwnership: '',
      tenantEarnings: '',
      rentalAmount: '',
      cropsCultivated: [] as string[],
      livestockRaised: [] as string[],
      farmingExperience: '',
      isSubmitted: false
    },
    incomeMarketing: {
      farmingPrimaryIncome: '',
      annualFarmIncome: '',
      incomeChange: '',
      salesChannels: [] as string[],
      otherIncomeSources: '',
      monthlyIncome: '',
      monthlyExpensesAmount: '',
      isSubmitted: false
    }
  });

  const [editingForm, setEditingForm] = useState<string | null>(null);

  // Save form data to AsyncStorage (user-specific)
  const saveFormDataToStorage = async (data: typeof formData) => {
    if (!user?.uid) {
      console.log('❌ No user UID available, cannot save form data');
      return;
    }
    
    try {
      const userKey = `farmerFormData_${user.uid}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(data));
      console.log(`✅ Form data saved to AsyncStorage for user: ${user.uid}`);
    } catch (error) {
      console.error('❌ Error saving form data to AsyncStorage:', error);
    }
  };

  // Load form data from AsyncStorage (user-specific)
  const loadFormDataFromStorage = async () => {
    if (!user?.uid) {
      console.log('❌ No user UID available, cannot load form data');
      return;
    }
    
    try {
      const userKey = `farmerFormData_${user.uid}`;
      const savedData = await AsyncStorage.getItem(userKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        console.log(`✅ Form data loaded from AsyncStorage for user: ${user.uid}`);
      } else {
        console.log(`ℹ️ No saved form data found for user: ${user.uid}`);
      }
    } catch (error) {
      console.error('❌ Error loading form data from AsyncStorage:', error);
    }
  };

  // Helper function to update form data and save to AsyncStorage
  const updateFormData = async (updater: (prev: typeof formData) => typeof formData) => {
    const newFormData = updater(formData);
    setFormData(newFormData);
    await saveFormDataToStorage(newFormData);
  };

  // Function to clear all form data (for testing)
  const clearFormData = async () => {
    if (!user?.uid) {
      console.log('❌ No user UID available, cannot clear form data');
      return;
    }
    
    try {
      const userKey = `farmerFormData_${user.uid}`;
      await AsyncStorage.removeItem(userKey);
      setFormData({
        demographics: {
          age: '',
          gender: '',
          maritalStatus: '',
          dependents: '',
          education: '',
          monthlyIncome: '',
          isSubmitted: false
        },
        farmingProfile: {
          yearsFarming: '',
          farmCommodity: [],
          livestock: [],
          landOwnership: '',
          farmSize: '',
          farmingMethods: [],
          otherCommodity: '',
          otherLivestock: '',
          otherFarmSize: '',
          isSubmitted: false
        },
        economicFinancial: {
          incomeSources: '',
          farmingFinances: '',
          farmingIncomePercentage: '',
          governmentAssistance: '',
          ngoAssistance: '',
          industryAssistance: '',
          otherIncome: '',
          otherFinances: '',
          isSubmitted: false
        },
        technologyInnovation: {
          farmingEquipment: [],
          newTechniques: '',
          modernPractices: '',
          agriculturalInfo: [],
          otherEquipment: '',
          otherInfo: '',
          isSubmitted: false
        },
        supportResources: {
          farmersAssociation: '',
          governmentPrograms: '',
          governmentSupport: [],
          ngoSupport: [],
          industrySupport: [],
          extensionServices: '',
          otherGovSupport: '',
          otherNgoSupport: '',
          otherIndustrySupport: '',
          isSubmitted: false
        },
        addressesHousehold: {
          residentialAddress: '',
          farmAddress: '',
          householdSize: '',
          adultsInHousehold: '',
          childrenInHousehold: '',
          educationAttainment: '',
          maritalStatus: '',
          isSubmitted: false
        },
        homeAssets: {
          electricity: '',
          television: '',
          refrigerator: '',
          comfortRoom: '',
          houseType: '',
          monthlyRent: '',
          houseOwnership: '',
          incomeType: '',
          monthlyExpenses: '',
          farmingType: '',
          isSubmitted: false
        },
        farmingDemographics: {
          farmSizeSqm: '',
          landOwnership: '',
          tenantEarnings: '',
          rentalAmount: '',
          cropsCultivated: [],
          livestockRaised: [],
          farmingExperience: '',
          isSubmitted: false
        },
        incomeMarketing: {
          farmingPrimaryIncome: '',
          annualFarmIncome: '',
          incomeChange: '',
          salesChannels: [],
          otherIncomeSources: '',
          monthlyIncome: '',
          monthlyExpensesAmount: '',
          isSubmitted: false
        }
      });
      console.log(`✅ Form data cleared for user: ${user.uid}`);
    } catch (error) {
      console.error('❌ Error clearing form data:', error);
    }
  };

  // Function to clear all users' form data (admin function)
  const clearAllUsersFormData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const farmerFormKeys = keys.filter(key => key.startsWith('farmerFormData_'));
      
      if (farmerFormKeys.length > 0) {
        await AsyncStorage.multiRemove(farmerFormKeys);
        console.log(`✅ Cleared form data for ${farmerFormKeys.length} users`);
      } else {
        console.log('ℹ️ No user form data found to clear');
      }
    } catch (error) {
      console.error('❌ Error clearing all users form data:', error);
    }
  };
  
  const featureButtons: FeatureButton[] = [
    {
      id: 'demographics',
      title: 'Demographic Information',
      icon: 'account-group'
    },
    {
      id: 'farmingProfile',
      title: 'Farming Profile',
      icon: 'leaf'
    },
    {
      id: 'economicFinancial',
      title: 'Economic and Financial Information',
      icon: 'cash'
    },
    {
      id: 'technologyInnovation',
      title: 'Technology and Innovation',
      icon: 'bulb'
    },
    {
      id: 'supportResources',
      title: 'Support and Resources',
      icon: 'handshake'
    },
    {
      id: 'addressesHousehold',
      title: 'Addresses and Household',
      icon: 'home'
    },
    {
      id: 'homeAssets',
      title: 'Home and Assets',
      icon: 'business'
    },
    {
      id: 'farmingDemographics',
      title: 'Farming-Specific Demographics',
      icon: 'trending-up'
    },
    {
      id: 'incomeMarketing',
      title: 'Income and Marketing',
      icon: 'analytics'
    }
  ];

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);

  // Load form data from AsyncStorage when user changes
  useEffect(() => {
    if (user?.uid) {
      loadFormDataFromStorage();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (Object.values(formData).filter(form => form.isSubmitted).length === 9) {
      const timer = setTimeout(() => {
        router.replace('/'); // Redirect to category/home page
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  const handleFeaturePress = (feature: FeatureButton) => {
    setSelectedFeature(feature);
    setEditingForm(null); // Reset editing state when opening new form
    setModalVisible(true);
  };

  const handleEditForm = (formId: string) => {
    setEditingForm(formId);
  };

  const handleSubmitForm = async (formId: string) => {
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form ID:', formId);
    console.log('User object:', user);
    console.log('User UID:', user?.uid);
    console.log('User email:', user?.email);
    console.log('Profile name:', profile?.name);
    console.log('Is user authenticated?', !!user);
    console.log('Is user.uid available?', !!user?.uid);
    console.log('Auth state:', user ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Update local state and save to AsyncStorage
      await updateFormData(prev => ({
        ...prev,
        [formId]: {
          ...prev[formId as keyof typeof prev],
          isSubmitted: true
        }
      }));


      // Test: Try writing to a simple collection first
      console.log('Testing write to test collection...');
      try {
        const testRef = doc(db, 'test', 'test-doc');
        await setDoc(testRef, {
          test: true,
          timestamp: serverTimestamp(),
          userId: user.uid
        });
        console.log('Test write successful!');
      } catch (testError: any) {
        console.error('Test write failed:', testError);
        console.error('Test error code:', testError.code);
        console.error('Test error message:', testError.message);
      }

      // Try using addDoc instead of setDoc
      console.log('Trying addDoc approach...');
      const farmersCollection = collection(db, 'farmers');
      const formDataToSave = {
        ...formData[formId as keyof typeof formData],
        isSubmitted: true,
        submittedAt: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
        userName: profile.name,
        formId: formId
      };

      console.log('Form data to save:', formDataToSave);

      await addDoc(farmersCollection, formDataToSave);
      console.log('addDoc successful!');

      setEditingForm(null);
      console.log(`Form ${formId} submitted successfully to database!`);
      Alert.alert('Success', 'Form submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', `Failed to submit form: ${error.message}`);
    }
  };

  const isFormSubmitted = (formId: string) => {
    return formData[formId as keyof typeof formData]?.isSubmitted || false;
  };

  const isFormEditing = (formId: string) => {
    return editingForm === formId;
  };

  const canEditForm = (formId: string) => {
    return isFormSubmitted(formId) && !isFormEditing(formId);
  };

  const canSubmitForm = (formId: string) => {
    return !isFormSubmitted(formId) || isFormEditing(formId);
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        router.replace('/');
        break;
      case 'explore':
        router.replace('../explore');
        break;
      case 'search':
        router.replace('../search');
        break;
      case 'profile':
        router.replace('../profile');
        break;
      default:
        break;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderDemographicsForm = () => {
    const formId = 'demographics';
    const data = formData.demographics;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Demographic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age:</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter age" 
            keyboardType="numeric"
            value={data.age}
            onChangeText={(value) => updateFormData(prev => ({
              ...prev,
              demographics: { ...prev.demographics, age: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender:</Text>
          <View style={styles.radioGroup}>
            {['Male', 'Female', 'LGBTQ+', 'Prefer not to say'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.gender === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, gender: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.gender === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Marital Status:</Text>
          <View style={styles.radioGroup}>
            {['Single', 'Married', 'Widow'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.maritalStatus === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, maritalStatus: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.maritalStatus === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Dependents:</Text>
          <View style={styles.radioGroup}>
            {['1-3', '4-6', '7-9', '10 and above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.dependents === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, dependents: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.dependents === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Highest Level of Education Attained:</Text>
          <View style={styles.radioGroup}>
            {[
              'Elementary Undergraduate', 'Elementary Graduate', 'High School Undergraduate', 'High School Graduate',
              'College Undergraduate', 'College Graduate', 'Technical Course completer', 'Post Graduate'
            ].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.education === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, education: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.education === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Household Income Level (Monthly):</Text>
          <View style={styles.radioGroup}>
            {[
              'Below ₱5,000.00', '₱5,001.00 – ₱10,000.00', '₱10,001.00 – ₱15,000.00',
              '₱15,001.00 – ₱20,000.00', '₱20,001.00 – ₱25,000.00', '₱25,001.00 above'
            ].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.monthlyIncome === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, monthlyIncome: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.monthlyIncome === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderFarmingProfileForm = () => {
    const formId = 'farmingProfile';
    const data = formData.farmingProfile;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Farming Profile</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Years in Farming:</Text>
          <View style={styles.radioGroup}>
            {['1-5', '6-10', '11-15', '16-20', '21 above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.yearsFarming === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      farmingProfile: { ...prev.farmingProfile, yearsFarming: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.yearsFarming === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of farm commodity:</Text>
          <View style={styles.checkboxGroup}>
            {['Vegetable', 'Animal Production', 'Coconut', 'Rice', 'Corn', 'Fishery', 'Organic'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentCommodities = [...data.farmCommodity];
                    if (currentCommodities.includes(option)) {
                      const filtered = currentCommodities.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        farmingProfile: { ...prev.farmingProfile, farmCommodity: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        farmingProfile: { ...prev.farmingProfile, farmCommodity: [...currentCommodities, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.farmCommodity.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.farmCommodity.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Other, Please specify" 
            value={data.otherCommodity}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              farmingProfile: { ...prev.farmingProfile, otherCommodity: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of Livestock Raised:</Text>
          <View style={styles.checkboxGroup}>
            {['Swine', 'Chicken', 'Small Ruminant', 'Large Ruminant'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentLivestock = [...data.livestock];
                    if (currentLivestock.includes(option)) {
                      const filtered = currentLivestock.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        farmingProfile: { ...prev.farmingProfile, livestock: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        farmingProfile: { ...prev.farmingProfile, livestock: [...currentLivestock, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.livestock.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.livestock.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Others, please specify" 
            value={data.otherLivestock}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              farmingProfile: { ...prev.farmingProfile, otherLivestock: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ownership of Farming Land:</Text>
          <View style={styles.radioGroup}>
            {['Owned', 'Rental', 'Tenant'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.landOwnership === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      farmingProfile: { ...prev.farmingProfile, landOwnership: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.landOwnership === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Size of Farm (in hectares):</Text>
          <View style={styles.radioGroup}>
            {['Below 0.5', '0.6 to 1.0', '1.5 to 2.0', '2.0 to 2.5'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.farmSize === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      farmingProfile: { ...prev.farmingProfile, farmSize: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.farmSize === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Other, please specify" 
            value={data.otherFarmSize}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              farmingProfile: { ...prev.farmingProfile, otherFarmSize: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farming Methods Used:</Text>
          <View style={styles.checkboxGroup}>
            {['Traditional', 'Organic', 'Modern', 'Mixed'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentMethods = [...data.farmingMethods];
                    if (currentMethods.includes(option)) {
                      const filtered = currentMethods.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        farmingProfile: { ...prev.farmingProfile, farmingMethods: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        farmingProfile: { ...prev.farmingProfile, farmingMethods: [...currentMethods, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.farmingMethods.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.farmingMethods.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderEconomicFinancialForm = () => {
    const formId = 'economicFinancial';
    const data = formData.economicFinancial;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Economic and Financial Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Main Sources of Income:</Text>
          <View style={styles.radioGroup}>
            {['Farming', 'Salary', 'Business', 'Remittance'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.incomeSources === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      economicFinancial: { ...prev.economicFinancial, incomeSources: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.incomeSources === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Others, Please specify" 
            value={data.otherIncome}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              economicFinancial: { ...prev.economicFinancial, otherIncome: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Source of Farming Finances:</Text>
          <View style={styles.radioGroup}>
            {['Personal Saving', 'Loans', 'Credit from Banks or Cooperative'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.farmingFinances === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      economicFinancial: { ...prev.economicFinancial, farmingFinances: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.farmingFinances === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Others, please specify" 
            value={data.otherFinances}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              economicFinancial: { ...prev.economicFinancial, otherFinances: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Percentage of Income Generated from Farming:</Text>
          <View style={styles.radioGroup}>
            {['10-20%', '21-40%', '41-50%', '51-60%', '61-70%', '71-80%', '81-90%', '91-100%'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.farmingIncomePercentage === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      economicFinancial: { ...prev.economicFinancial, farmingIncomePercentage: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.farmingIncomePercentage === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>With Government Assistance Received:</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.governmentAssistance === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      economicFinancial: { ...prev.economicFinancial, governmentAssistance: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.governmentAssistance === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>With NGOs Assistance Received:</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.ngoAssistance === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      economicFinancial: { ...prev.economicFinancial, ngoAssistance: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.ngoAssistance === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>With Industry Assistance Received:</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.industryAssistance === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      economicFinancial: { ...prev.economicFinancial, industryAssistance: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.industryAssistance === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderTechnologyInnovationForm = () => {
    const formId = 'technologyInnovation';
    const data = formData.technologyInnovation;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Technology and Innovation</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farming Equipment or Technologies Used:</Text>
          <View style={styles.checkboxGroup}>
            {['Machinery', 'Irrigation system', 'Pesticides', 'Certified Seed'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentEquipment = [...data.farmingEquipment];
                    if (currentEquipment.includes(option)) {
                      const filtered = currentEquipment.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        technologyInnovation: { ...prev.technologyInnovation, farmingEquipment: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        technologyInnovation: { ...prev.technologyInnovation, farmingEquipment: [...currentEquipment, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.farmingEquipment.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.farmingEquipment.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Other. Please specify" 
            value={data.otherEquipment}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              technologyInnovation: { ...prev.technologyInnovation, otherEquipment: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adoption of New Farming Techniques or Innovations:</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.newTechniques === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      technologyInnovation: { ...prev.technologyInnovation, newTechniques: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.newTechniques === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Awareness of Modern Agricultural Practices:</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.modernPractices === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      technologyInnovation: { ...prev.technologyInnovation, modernPractices: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.modernPractices === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Access to Agricultural Information:</Text>
          <View style={styles.checkboxGroup}>
            {['Extension Services', 'Online Platforms', 'Community Networks'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentInfo = [...data.agriculturalInfo];
                    if (currentInfo.includes(option)) {
                      const filtered = currentInfo.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        technologyInnovation: { ...prev.technologyInnovation, agriculturalInfo: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        technologyInnovation: { ...prev.technologyInnovation, agriculturalInfo: [...currentInfo, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.agriculturalInfo.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.agriculturalInfo.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Others, please specify" 
            value={data.otherInfo}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              technologyInnovation: { ...prev.technologyInnovation, otherInfo: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderSupportResourcesForm = () => {
    const formId = 'supportResources';
    const data = formData.supportResources;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Support and Resources</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>With membership in Any Farmers' Associations or Cooperatives?</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.farmersAssociation === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      supportResources: { ...prev.supportResources, farmersAssociation: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.farmersAssociation === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Participated in Any Government or NGO Programs for Farmers?</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.governmentPrograms === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      supportResources: { ...prev.supportResources, governmentPrograms: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.governmentPrograms === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of Support Received from the government?</Text>
          <View style={styles.checkboxGroup}>
            {['Financial', 'Technical', 'Educational'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentSupport = [...data.governmentSupport];
                    if (currentSupport.includes(option)) {
                      const filtered = currentSupport.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        supportResources: { ...prev.supportResources, governmentSupport: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        supportResources: { ...prev.supportResources, governmentSupport: [...currentSupport, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.governmentSupport.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.governmentSupport.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Other please specify" 
            value={data.otherGovSupport}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              supportResources: { ...prev.supportResources, otherGovSupport: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of Support Received from the NGOs?</Text>
          <View style={styles.checkboxGroup}>
            {['Financial', 'Technical', 'Educational'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentSupport = [...data.ngoSupport];
                    if (currentSupport.includes(option)) {
                      const filtered = currentSupport.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        supportResources: { ...prev.supportResources, ngoSupport: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        supportResources: { ...prev.supportResources, ngoSupport: [...currentSupport, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.ngoSupport.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.ngoSupport.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Other please specify" 
            value={data.otherNgoSupport}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              supportResources: { ...prev.supportResources, otherNgoSupport: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of Support Received from the industry?</Text>
          <View style={styles.checkboxGroup}>
            {['Financial', 'Technical', 'Educational'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentSupport = [...data.industrySupport];
                    if (currentSupport.includes(option)) {
                      const filtered = currentSupport.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        supportResources: { ...prev.supportResources, industrySupport: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        supportResources: { ...prev.supportResources, industrySupport: [...currentSupport, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.industrySupport.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.industrySupport.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Other please specify" 
            value={data.otherIndustrySupport}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              supportResources: { ...prev.supportResources, otherIndustrySupport: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Frequency of Assistance from Agricultural Extension Services:</Text>
          <View style={styles.radioGroup}>
            {['Often', 'Occasionally', 'Rarely', 'Never'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.extensionServices === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      supportResources: { ...prev.supportResources, extensionServices: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.extensionServices === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderAddressesHouseholdForm = () => {
    const formId = 'addressesHousehold';
    const data = formData.addressesHousehold;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Addresses and Household</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Residential address:</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter residential address" 
            value={data.residentialAddress}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              addressesHousehold: { ...prev.addressesHousehold, residentialAddress: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Address:</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter farm address" 
            value={data.farmAddress}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              addressesHousehold: { ...prev.addressesHousehold, farmAddress: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Household Size:</Text>
          <View style={styles.radioGroup}>
            {['Below 3', '4-5', '6-7', '8-9', '10 Above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.householdSize === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      addressesHousehold: { ...prev.addressesHousehold, householdSize: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.householdSize === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How many adults live in your household:</Text>
          <View style={styles.radioGroup}>
            {['Below 3', '4-5', '6-7', '8-9', '10 Above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.adultsInHousehold === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      addressesHousehold: { ...prev.addressesHousehold, adultsInHousehold: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.adultsInHousehold === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How many children live in your household?</Text>
          <View style={styles.radioGroup}>
            {['Below 3', '4-5', '6-7', '8-9', '10 Above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.childrenInHousehold === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      addressesHousehold: { ...prev.addressesHousehold, childrenInHousehold: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.childrenInHousehold === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Education Attainment:</Text>
          <View style={styles.radioGroup}>
            {[
              'No formal education', 'Elementary Undergraduate', 'Elementary Graduate',
              'High school Undergraduate', 'High School Graduate', 'College Undergraduate',
              'College Graduate', 'Vocational'
            ].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.educationAttainment === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      addressesHousehold: { ...prev.addressesHousehold, educationAttainment: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.educationAttainment === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Marital Status:</Text>
          <View style={styles.radioGroup}>
            {['Single', 'Married', 'Separated', 'Widows', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.maritalStatus === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      addressesHousehold: { ...prev.addressesHousehold, maritalStatus: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.maritalStatus === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderHomeAssetsForm = () => {
    const formId = 'homeAssets';
    const data = formData.homeAssets;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Home and Assets</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Do you have:</Text>
          <View style={styles.subGroup}>
            <Text style={styles.subLabel}>Electricity:</Text>
            <View style={styles.radioGroup}>
              {['Yes', 'No'].map((option) => (
                <TouchableOpacity 
                  key={option} 
                  style={[
                    styles.radioButton, 
                    data.electricity === option && styles.radioButtonSelected,
                    isSubmitted && !isEditing && styles.readOnlyRadioButton
                  ]}
                  onPress={() => {
                    if (!isSubmitted || isEditing) {
                      setFormData(prev => ({
                        ...prev,
                        homeAssets: { ...prev.homeAssets, electricity: option }
                      }));
                    }
                  }}
                  disabled={!canSubmit}
                >
                  <Text style={[
                    styles.radioText, 
                    data.electricity === option && styles.radioTextSelected,
                    isSubmitted && !isEditing && styles.readOnlyText
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.subGroup}>
            <Text style={styles.subLabel}>Television:</Text>
            <View style={styles.radioGroup}>
              {['Yes', 'No'].map((option) => (
                <TouchableOpacity 
                  key={option} 
                  style={[
                    styles.radioButton, 
                    data.television === option && styles.radioButtonSelected,
                    isSubmitted && !isEditing && styles.readOnlyRadioButton
                  ]}
                  onPress={() => {
                    if (!isSubmitted || isEditing) {
                      setFormData(prev => ({
                        ...prev,
                        homeAssets: { ...prev.homeAssets, television: option }
                      }));
                    }
                  }}
                  disabled={!canSubmit}
                >
                  <Text style={[
                    styles.radioText, 
                    data.television === option && styles.radioTextSelected,
                    isSubmitted && !isEditing && styles.readOnlyText
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.subGroup}>
            <Text style={styles.subLabel}>Refrigerator:</Text>
            <View style={styles.radioGroup}>
              {['Yes', 'No'].map((option) => (
                <TouchableOpacity 
                  key={option} 
                  style={[
                    styles.radioButton, 
                    data.refrigerator === option && styles.radioButtonSelected,
                    isSubmitted && !isEditing && styles.readOnlyRadioButton
                  ]}
                  onPress={() => {
                    if (!isSubmitted || isEditing) {
                      setFormData(prev => ({
                        ...prev,
                        homeAssets: { ...prev.homeAssets, refrigerator: option }
                      }));
                    }
                  }}
                  disabled={!canSubmit}
                >
                  <Text style={[
                    styles.radioText, 
                    data.refrigerator === option && styles.radioTextSelected,
                    isSubmitted && !isEditing && styles.readOnlyText
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.subGroup}>
            <Text style={styles.subLabel}>Comfort Room:</Text>
            <View style={styles.radioGroup}>
              {['Yes', 'No'].map((option) => (
                <TouchableOpacity 
                  key={option} 
                  style={[
                    styles.radioButton, 
                    data.comfortRoom === option && styles.radioButtonSelected,
                    isSubmitted && !isEditing && styles.readOnlyRadioButton
                  ]}
                  onPress={() => {
                    if (!isSubmitted || isEditing) {
                      setFormData(prev => ({
                        ...prev,
                        homeAssets: { ...prev.homeAssets, comfortRoom: option }
                      }));
                    }
                  }}
                  disabled={!canSubmit}
                >
                  <Text style={[
                    styles.radioText, 
                    data.comfortRoom === option && styles.radioTextSelected,
                    isSubmitted && !isEditing && styles.readOnlyText
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>What type of house you have:</Text>
          <View style={styles.radioGroup}>
            {['Fully Concrete', 'Half Concrete', 'Light material', 'Nepa', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.houseType === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      homeAssets: { ...prev.homeAssets, houseType: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.houseType === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monthly Rent:</Text>
          <View style={styles.radioGroup}>
            {['Below 1000', '1001-5000', '5001-10000', '10001-15000', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.monthlyRent === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      homeAssets: { ...prev.homeAssets, monthlyRent: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.monthlyRent === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>House Ownership:</Text>
          <View style={styles.radioGroup}>
            {['Owner', 'Rental', 'Tenant', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.houseOwnership === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      homeAssets: { ...prev.homeAssets, houseOwnership: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.houseOwnership === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Income Type:</Text>
          <View style={styles.radioGroup}>
            {['Salary', 'Percentage', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.incomeType === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      homeAssets: { ...prev.homeAssets, incomeType: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.incomeType === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monthly Expenses:</Text>
          <View style={styles.radioGroup}>
            {['Below 3,000', '3,001-6,000', '6,001-9000', '9001-12000', 'other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.monthlyExpenses === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      homeAssets: { ...prev.homeAssets, monthlyExpenses: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.monthlyExpenses === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farming Type:</Text>
          <View style={styles.radioGroup}>
            {['Crop', 'Livestock', 'Mixed', 'Aquaculture', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.farmingType === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      homeAssets: { ...prev.homeAssets, farmingType: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.farmingType === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderFarmingDemographicsForm = () => {
    const formId = 'farmingDemographics';
    const data = formData.farmingDemographics;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Farming-Specific Demographics</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Size (sq.m.):</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter farm size in square meters" 
            keyboardType="numeric"
            value={data.farmSizeSqm}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              farmingDemographics: { ...prev.farmingDemographics, farmSizeSqm: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Land Ownership:</Text>
          <View style={styles.radioGroup}>
            {['Owner', 'Rental', 'Tenant', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.landOwnership === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      farmingDemographics: { ...prev.farmingDemographics, landOwnership: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.landOwnership === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>If Tenant, how you earn:</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter details" 
            value={data.tenantEarnings}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              farmingDemographics: { ...prev.farmingDemographics, tenantEarnings: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>If Rental, how much you paid per month:</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter amount" 
            keyboardType="numeric"
            value={data.rentalAmount}
            onChangeText={(value) => setFormData(prev => ({
              ...prev,
              farmingDemographics: { ...prev.farmingDemographics, rentalAmount: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of Farming:</Text>
          <View style={styles.checkboxGroup}>
            {['Vegetable', 'Coconut', 'Rice', 'Corn', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentCrops = [...data.cropsCultivated];
                    if (currentCrops.includes(option)) {
                      const filtered = currentCrops.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        farmingDemographics: { ...prev.farmingDemographics, cropsCultivated: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        farmingDemographics: { ...prev.farmingDemographics, cropsCultivated: [...currentCrops, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.cropsCultivated.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.cropsCultivated.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>What types of livestock do you raise?</Text>
          <View style={styles.checkboxGroup}>
            {['Swine', 'Chicken', 'Large Ruminant', 'Small Ruminant', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentLivestock = [...data.livestockRaised];
                    if (currentLivestock.includes(option)) {
                      const filtered = currentLivestock.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        farmingDemographics: { ...prev.farmingDemographics, livestockRaised: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        farmingDemographics: { ...prev.farmingDemographics, livestockRaised: [...currentLivestock, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.livestockRaised.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.livestockRaised.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years of Farming Experience:</Text>
          <View style={styles.radioGroup}>
            {['3 years below', '4 to 6 years', '7 to 9 years', '10 to 12 years', '13 years above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.farmingExperience === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      farmingDemographics: { ...prev.farmingDemographics, farmingExperience: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.farmingExperience === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderIncomeMarketingForm = () => {
    const formId = 'incomeMarketing';
    const data = formData.incomeMarketing;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Income and Marketing</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Primary Income Source:</Text>
          <Text style={styles.subLabel}>Is farming your primary source of income?</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.farmingPrimaryIncome === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      incomeMarketing: { ...prev.incomeMarketing, farmingPrimaryIncome: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.farmingPrimaryIncome === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Income:</Text>
          <Text style={styles.subLabel}>What is your average annual income from farming?</Text>
          <View style={styles.radioGroup}>
            {['below ₱60,000', '₱60,001 - ₱90,000', '₱90,001 - ₱120,000', '₱120,001-₱150,000', '₱150,001 above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.annualFarmIncome === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      incomeMarketing: { ...prev.incomeMarketing, annualFarmIncome: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.annualFarmIncome === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How has your farm income changed in the past 5 years:</Text>
          <View style={styles.radioGroup}>
            {['Better', 'Good', 'Normal', 'Bad', 'Worse'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.incomeChange === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      incomeMarketing: { ...prev.incomeMarketing, incomeChange: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.incomeChange === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Do you sell your products through?</Text>
          <View style={styles.checkboxGroup}>
            {['End user', 'Middlemen', 'Coop', 'Wholesale', 'other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.checkboxRow}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    const currentChannels = [...data.salesChannels];
                    if (currentChannels.includes(option)) {
                      const filtered = currentChannels.filter(item => item !== option);
                      setFormData(prev => ({
                        ...prev,
                        incomeMarketing: { ...prev.incomeMarketing, salesChannels: filtered }
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        incomeMarketing: { ...prev.incomeMarketing, salesChannels: [...currentChannels, option] }
                      }));
                    }
                  }
                }}
                disabled={!canSubmit}
              >
                <View style={[
                  styles.checkbox,
                  data.salesChannels.includes(option) && styles.checkboxSelected,
                  isSubmitted && !isEditing && styles.readOnlyCheckbox
                ]}>
                  {data.salesChannels.includes(option) && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
                <Text style={[
                  styles.checkboxText,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Other Source of income:</Text>
          <View style={styles.radioGroup}>
            {['Salary', 'Pension', 'Remittance', 'Business', 'other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.otherIncomeSources === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      incomeMarketing: { ...prev.incomeMarketing, otherIncomeSources: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.otherIncomeSources === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How Much your Monthly income?</Text>
          <View style={styles.radioGroup}>
            {['Below ₱5,000', '₱5,001 – ₱10,000', '₱10,001- ₱15,000', '₱15,001-₱20,000', '₱20,001 above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.monthlyIncome === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      incomeMarketing: { ...prev.incomeMarketing, monthlyIncome: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.monthlyIncome === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How Much your Monthly Expenses?</Text>
          <View style={styles.radioGroup}>
            {['Below ₱10,000', '₱10,001- ₱15,000', '₱15,001 -₱20,000', '₱20,001 – ₱25,000', '₱25,001 above'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.monthlyExpensesAmount === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    setFormData(prev => ({
                      ...prev,
                      incomeMarketing: { ...prev.incomeMarketing, monthlyExpensesAmount: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.monthlyExpensesAmount === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          {canEdit && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditForm(formId)}
            >
              <Text style={styles.editButtonText}>Edit Form</Text>
            </TouchableOpacity>
          )}
          
          {canSubmit && (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleSubmitForm(formId)}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Form' : 'Submit Form'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderForm = () => {
    if (!selectedFeature) return null;
    
    switch (selectedFeature.id) {
      case 'demographics':
        return renderDemographicsForm();
      case 'farmingProfile':
        return renderFarmingProfileForm();
      case 'economicFinancial':
        return renderEconomicFinancialForm();
      case 'technologyInnovation':
        return renderTechnologyInnovationForm();
      case 'supportResources':
        return renderSupportResourcesForm();
      case 'addressesHousehold':
        return renderAddressesHouseholdForm();
      case 'homeAssets':
        return renderHomeAssetsForm();
      case 'farmingDemographics':
        return renderFarmingDemographicsForm();
      case 'incomeMarketing':
        return renderIncomeMarketingForm();
      default:
        return (
          <View style={styles.formPlaceholder}>
            <Text style={styles.placeholderText}>{selectedFeature.title}</Text>
            <Text style={styles.placeholderSubtext}>Form implementation coming soon...</Text>
          </View>
        );
    }
  };

  const renderFeatureButton = (feature: FeatureButton) => {
    const isCompleted = isFormSubmitted(feature.id);
    
    // Debug logging
    console.log(`Button ${feature.id}: isCompleted = ${isCompleted}`);
    
    return (
      <TouchableOpacity
        key={feature.id}
        style={[styles.featureButton, isCompleted && styles.completedFeatureButton]}
        onPress={() => handleFeaturePress(feature)}
        activeOpacity={0.8}
      >
        <Text style={[styles.featureTitle, isCompleted && styles.completedFeatureTitle]}>
          {feature.title}
        </Text>
        {isCompleted && (
          <View style={styles.completionCheck}>
            <Ionicons name="checkmark" size={24} color={GREEN} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const allFormsCompleted = Object.values(formData).filter(form => form.isSubmitted).length === featureButtons.length;

  useEffect(() => {
    if (allFormsCompleted) {
      if (modalVisible) {
        setModalVisible(false); // Close the modal if open
        setTimeout(() => {
          router.replace('/'); // Redirect after modal is closed
        }, 300); // Wait for modal close animation
      } else {
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000); // Usual delay if no modal
      }
    }
  }, [allFormsCompleted, modalVisible]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Top Green Bar */}
      <View style={{ 
        height: 24, 
        width: '100%', 
        backgroundColor: '#16543a',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
      }} />
      {/* Top Green Border */}
      <View style={{ height: 12, width: '100%', backgroundColor: '#16543a', shadowColor: 'transparent', elevation: 0 }} />
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 32 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#16543a', marginBottom: 12 }}>
          Welcome {profile?.name || 'User'}!
        </Text>
        <Text style={{ fontSize: 16, color: '#333', marginBottom: 24 }}>
          Please fill up the form below.
        </Text>
        
        {/* Skip Button */}
        <TouchableOpacity 
          style={{
            backgroundColor: '#16543a',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3
          }}
          onPress={() => {
            Alert.alert(
              'Skip Form',
              'Are you sure you want to skip the form? You can always come back to fill it out later.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Skip', 
                  style: 'destructive',
                  onPress: () => router.replace('/(tabs)')
                }
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Skip Form
          </Text>
        </TouchableOpacity>
        
        {allFormsCompleted ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, color: '#16543a', fontWeight: 'bold', textAlign: 'center', marginTop: 40 }}>
              🎉 Congratulations! You are now fully registered! 🎉
            </Text>
          </View>
        ) : (
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <View style={{ width: '90%' }}>
              {featureButtons.map(renderFeatureButton)}
            </View>
          </ScrollView>
        )}
        {/* Modal for Forms (unchanged) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedFeature?.title}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={'#666'} />
                </TouchableOpacity>
              </View>
              {renderForm()}
            </View>
          </View>
        </Modal>
      </View>
      {/* Bottom Green Bar */}
      <View style={{ height: 24, width: '100%', backgroundColor: '#16543a' }} />
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: WHITE,
    opacity: 0.9,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: WHITE,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },
  formContainer: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  featureButton: {
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    minHeight: 70,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: WHITE,
    borderRadius: 20,
    width: '95%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GREEN,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  formScroll: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    backgroundColor: WHITE,
    color: '#333',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  radioGroup: {
    gap: 12,
  },
  radioButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: WHITE,
    minWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  radioText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  checkboxGroup: {
    gap: 16,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 6,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  formPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
  },
  modalActions: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: GREEN,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 160,
    marginTop: -10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  customTabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: GREEN,
    height: 64,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 0,
    zIndex: 100,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  subGroup: {
    marginBottom: 16,
  },
  subLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  readOnlyRadioButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    opacity: 0.7,
  },
  radioButtonSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  radioTextSelected: {
    color: WHITE,
    fontWeight: '600',
  },
  readOnlyText: {
    color: '#888',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  editButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 160,
  },
  editButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  completedFeatureButton: {
    backgroundColor: GREEN,
    borderColor: GREEN,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completedFeatureTitle: {
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 20,
  },
  completionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: WHITE,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GREEN,
  },
  completionCheck: {
    position: 'absolute',
    right: 25,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: WHITE,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  checkboxSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  readOnlyCheckbox: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    opacity: 0.7,
  },
  completionBanner: {
    backgroundColor: GREEN,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionBannerText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
}); 