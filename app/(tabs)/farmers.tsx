import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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

const createInitialFormData = () => ({
  demographics: {
    age: '',
    gender: '',
    maritalStatus: '',
    dependents: '',
    education: '',
    monthlyIncome: '',
    householdExpenses: '',
    drinkingWater: '',
    numChildren: '',
    organizationMember: '',
    fourPsBeneficiary: '',
    religion: '',
    completeAddress: '',
    housingType: '',
    sourceOfCapital: '',
    isSubmitted: false
  },
  farmingProfile: {
    yearsFarming: '',
    farmCommodity: [] as string[],
    commodityCounts: {} as { [key: string]: string },
    livestock: [] as string[],
    livestockCounts: {} as { [key: string]: string },
    landOwnership: '',
    rentalAmount: '',
    tenantCondition: '',
    farmSize: '',
    farmingMethods: [] as string[],
    otherCommodity: '',
    otherCommodityCount: '',
    otherLivestock: '',
    otherLivestockCount: '',
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
    machineOwnership: '',
    machinePurchasePrice: '',
    machineRentalPrice: '',
    irrigationExpenses: '',
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

type FormDataState = ReturnType<typeof createInitialFormData>;

export default function FarmersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureButton | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditingFromProfile, setIsEditingFromProfile] = useState(false);
  const [pendingEditSection, setPendingEditSection] = useState<string | null>(null);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  
  // Form state management
  const [formData, setFormData] = useState<FormDataState>(() => createInitialFormData());

  const [editingForm, setEditingForm] = useState<string | null>(null);

  // Save form data to AsyncStorage (user-specific)
  const saveFormDataToStorage = async (data: FormDataState) => {
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

  // Load form data from farmerProfiles collection (Firebase only)
  const loadFormDataFromStorage = async (): Promise<boolean> => {
    if (!user?.email) {
      console.log('❌ No user email available, cannot load form data');
      setFormDataLoaded(true);
      return false;
    }
    
    try {
      // Load from farmerProfiles collection ONLY
      const farmerProfileDoc = await getDoc(doc(db, 'farmerProfiles', user.email));
      if (farmerProfileDoc.exists()) {
        const profileData = farmerProfileDoc.data();
        const savedFormData = profileData.formData || {};
        console.log(`📦 Loaded form data from farmerProfiles:`, savedFormData);
        console.log(`📦 Demographics data:`, savedFormData.demographics);
        
        // Merge with initial form data to ensure all sections exist
        const initialData = createInitialFormData();
        const mergedData = { ...initialData, ...savedFormData };
        // Also merge each section to ensure all fields exist
        Object.keys(initialData).forEach(key => {
          if (mergedData[key] && initialData[key as keyof FormDataState]) {
            mergedData[key] = { ...initialData[key as keyof FormDataState], ...mergedData[key] };
          }
        });
        setFormData(mergedData);
        setFormDataLoaded(true);
        console.log(`✅ Form data loaded and merged from farmerProfiles for user: ${user.email}`);
        console.log(`✅ Merged demographics:`, mergedData.demographics);
        return true;
      } else {
        console.log(`ℹ️ No saved form data found in farmerProfiles for user: ${user.email}`);
        setFormDataLoaded(true); // Still mark as loaded even if no data
        return false;
      }
    } catch (error) {
      console.error('❌ Error loading form data from farmerProfiles:', error);
      setFormDataLoaded(true);
      return false;
    }
  };

  const resetFormSection = (sectionId: keyof FormDataState) => {
    setFormData(prev => {
      const defaults = createInitialFormData();
      const updated = {
        ...prev,
        [sectionId]: defaults[sectionId]
      };
      // No need to save to AsyncStorage - will be saved to Firebase on submit
      return updated;
    });
  };

  const hasSectionInput = (sectionId: keyof FormDataState) => {
    const defaults = createInitialFormData();
    return JSON.stringify(formData[sectionId]) !== JSON.stringify(defaults[sectionId]);
  };

  const isNonEmptyString = (value?: string | null) =>
    typeof value === 'string' && value.trim().length > 0;

  const hasSelection = (list?: string[]) => Array.isArray(list) && list.length > 0;

  const validateFormSection = (formId: keyof FormDataState): { valid: boolean; message?: string } => {
    const fail = (message: string) => ({ valid: false, message });

    switch (formId) {
      case 'demographics': {
        const data = formData.demographics;
        if (!isNonEmptyString(data.age)) return fail('Please enter your age.');
        const ageNumber = Number(data.age);
        if (!Number.isFinite(ageNumber) || ageNumber <= 0) return fail('Please enter a valid age.');
        if (!isNonEmptyString(data.gender)) return fail('Please select your gender.');
        if (!isNonEmptyString(data.maritalStatus)) return fail('Please select your marital status.');
        if (!isNonEmptyString(data.dependents)) return fail('Please select the number of dependents.');
        if (!isNonEmptyString(data.education)) return fail('Please select your highest education level.');
        if (!isNonEmptyString(data.monthlyIncome)) return fail('Please select your household income level.');
        return { valid: true };
      }
      case 'farmingProfile': {
        const data = formData.farmingProfile;
        if (!isNonEmptyString(data.yearsFarming)) return fail('Please select your number of years in farming.');
        if (!hasSelection(data.farmCommodity) && !isNonEmptyString(data.otherCommodity)) {
          return fail('Please select at least one farm commodity or specify other.');
        }
        if (!hasSelection(data.livestock) && !isNonEmptyString(data.otherLivestock)) {
          return fail('Please select at least one livestock type or specify other.');
        }
        // If livestock types are selected, ensure each selected type has a count > 0
        if (hasSelection(data.livestock)) {
          for (const type of data.livestock) {
            const rawCount = data.livestockCounts?.[type] ?? '';
            const parsed = Number(rawCount);
            if (!Number.isFinite(parsed) || parsed <= 0) {
              return fail(`Please enter a valid count greater than 0 for ${type} under Type of Livestock Raised.`);
            }
          }
        }
        // If "Other Livestock" is specified, ensure its count > 0 as well
        if (isNonEmptyString(data.otherLivestock)) {
          const otherParsed = Number(data.otherLivestockCount ?? '');
          if (!Number.isFinite(otherParsed) || otherParsed <= 0) {
            return fail('Please enter a valid count greater than 0 for Other Livestock.');
          }
        }
        if (!isNonEmptyString(data.landOwnership)) return fail('Please select your land ownership status.');
        if (!isNonEmptyString(data.farmSize) && !isNonEmptyString(data.otherFarmSize)) {
          return fail('Please choose your farm size or specify other.');
        }
        if (!hasSelection(data.farmingMethods)) {
          return fail('Please select at least one farming method.');
        }
        return { valid: true };
      }
      case 'economicFinancial': {
        const data = formData.economicFinancial;
        if (!isNonEmptyString(data.incomeSources) && !isNonEmptyString(data.otherIncome)) {
          return fail('Please select your main income source or specify other.');
        }
        if (!isNonEmptyString(data.farmingFinances) && !isNonEmptyString(data.otherFinances)) {
          return fail('Please select your source of farming finances or specify other.');
        }
        if (!isNonEmptyString(data.farmingIncomePercentage)) {
          return fail('Please select the percentage of income generated from farming.');
        }
        if (!isNonEmptyString(data.governmentAssistance)) {
          return fail('Please indicate if you received government assistance.');
        }
        if (!isNonEmptyString(data.ngoAssistance)) {
          return fail('Please indicate if you received NGO assistance.');
        }
        if (!isNonEmptyString(data.industryAssistance)) {
          return fail('Please indicate if you received industry assistance.');
        }
        return { valid: true };
      }
      case 'technologyInnovation': {
        const data = formData.technologyInnovation;
        if (!hasSelection(data.farmingEquipment) && !isNonEmptyString(data.otherEquipment)) {
          return fail('Please select at least one farming equipment or specify other.');
        }
        if (!isNonEmptyString(data.newTechniques)) {
          return fail('Please indicate if you have adopted new farming techniques.');
        }
        if (!isNonEmptyString(data.modernPractices)) {
          return fail('Please indicate your awareness of modern agricultural practices.');
        }
        if (!hasSelection(data.agriculturalInfo) && !isNonEmptyString(data.otherInfo)) {
          return fail('Please select at least one source of agricultural information or specify other.');
        }
        return { valid: true };
      }
      case 'supportResources': {
        const data = formData.supportResources;
        if (!isNonEmptyString(data.farmersAssociation)) {
          return fail('Please indicate your farmers association membership.');
        }
        if (!isNonEmptyString(data.governmentPrograms)) {
          return fail('Please indicate whether you participated in government or NGO programs.');
        }
        const needsGovernmentDetails = data.governmentPrograms === 'Yes';
        if (needsGovernmentDetails && !hasSelection(data.governmentSupport) && !isNonEmptyString(data.otherGovSupport)) {
          return fail('Please select the type of government support received or specify other (enter "None" if not applicable).');
        }
        if (!hasSelection(data.ngoSupport) && !isNonEmptyString(data.otherNgoSupport)) {
          return fail('Please select the type of NGO support received or specify other (enter "None" if not applicable).');
        }
        if (!hasSelection(data.industrySupport) && !isNonEmptyString(data.otherIndustrySupport)) {
          return fail('Please select the type of industry support received or specify other (enter "None" if not applicable).');
        }
        if (!isNonEmptyString(data.extensionServices)) {
          return fail('Please indicate how often you receive extension services.');
        }
        return { valid: true };
      }
      case 'addressesHousehold': {
        const data = formData.addressesHousehold;
        if (!isNonEmptyString(data.residentialAddress)) {
          return fail('Please enter your residential address.');
        }
        if (!isNonEmptyString(data.farmAddress)) {
          return fail('Please enter your farm address.');
        }
        if (!isNonEmptyString(data.householdSize)) {
          return fail('Please select your household size.');
        }
        if (!isNonEmptyString(data.adultsInHousehold)) {
          return fail('Please select the number of adults in your household.');
        }
        if (!isNonEmptyString(data.childrenInHousehold)) {
          return fail('Please select the number of children in your household.');
        }
        return { valid: true };
      }
      case 'homeAssets': {
        const data = formData.homeAssets;
        if (!isNonEmptyString(data.electricity)) return fail('Please indicate if you have electricity.');
        if (!isNonEmptyString(data.television)) return fail('Please indicate if you have a television.');
        if (!isNonEmptyString(data.refrigerator)) return fail('Please indicate if you have a refrigerator.');
        if (!isNonEmptyString(data.comfortRoom)) return fail('Please indicate if you have a comfort room.');
        if (!isNonEmptyString(data.houseType)) return fail('Please select your house type.');
        if (!isNonEmptyString(data.monthlyRent)) return fail('Please select your monthly rent range.');
        if (!isNonEmptyString(data.houseOwnership)) return fail('Please select your house ownership status.');
        if (!isNonEmptyString(data.incomeType)) return fail('Please select your income type.');
        if (!isNonEmptyString(data.monthlyExpenses)) return fail('Please select your monthly expenses range.');
        if (!isNonEmptyString(data.farmingType)) return fail('Please select your farming type.');
        return { valid: true };
      }
      case 'incomeMarketing': {
        const data = formData.incomeMarketing;
        if (!isNonEmptyString(data.farmingPrimaryIncome)) {
          return fail('Please indicate if farming is your primary income source.');
        }
        if (!isNonEmptyString(data.annualFarmIncome)) {
          return fail('Please select your average annual farm income.');
        }
        if (!isNonEmptyString(data.incomeChange)) {
          return fail('Please indicate how your farm income has changed.');
        }
        if (!hasSelection(data.salesChannels)) {
          return fail('Please select at least one sales channel.');
        }
        if (!isNonEmptyString(data.otherIncomeSources)) {
          return fail('Please select your other source of income.');
        }
        if (!isNonEmptyString(data.monthlyIncome)) {
          return fail('Please select your monthly income range.');
        }
        if (!isNonEmptyString(data.monthlyExpensesAmount)) {
          return fail('Please select your monthly expenses range.');
        }
        return { valid: true };
      }
      default:
        return { valid: true };
    }
  };

  // Helper function to update form data (no AsyncStorage saving - only Firebase on submit)
  const updateFormData = async (updater: (prev: FormDataState) => FormDataState) => {
    const newFormData = updater(formData);
    setFormData(newFormData);
    // No AsyncStorage saving - data will be saved to Firebase on submit
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
      setFormData(createInitialFormData());
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
      id: 'incomeMarketing',
      title: 'Income and Marketing',
      icon: 'analytics'
    }
  ];

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);

  // Load form data from farmerProfiles collection when user changes
  useEffect(() => {
    const loadDataAndCheckEdit = async () => {
      if (!user?.uid) return;
      
      // First, load the form data
      await loadFormDataFromStorage();
      
      // Then check if we need to open a specific form section (from Edit button)
      try {
        const editSection = await AsyncStorage.getItem('editFormSection');
        if (editSection) {
          // Store the section to open after data is loaded
          setPendingEditSection(editSection);
          // Clear the edit section flag
          await AsyncStorage.removeItem('editFormSection');
        }
      } catch (error) {
        console.error('Error checking edit form section:', error);
      }
    };
    
    if (user?.uid) {
      loadDataAndCheckEdit();
    }
  }, [user?.uid]);

  // Open the edit modal after form data is loaded
  useEffect(() => {
    if (pendingEditSection && formDataLoaded && formData) {
      // Find the corresponding feature button
      const feature = featureButtons.find(btn => btn.id === pendingEditSection);
      if (feature) {
        // Check if the section data exists in formData
        const sectionData = formData[pendingEditSection as keyof FormDataState];
        if (sectionData) {
          console.log(`✅ Opening edit modal for ${pendingEditSection} with data:`, sectionData);
          // Use requestAnimationFrame to ensure DOM is ready, then a small delay
          requestAnimationFrame(() => {
            setTimeout(() => {
              setIsEditingFromProfile(true);
              setSelectedFeature(feature);
              // Set editing mode for the form (this makes it editable)
              setEditingForm(pendingEditSection);
              // Open modal
              setModalVisible(true);
              // Clear pending edit
              setPendingEditSection(null);
            }, 300);
          });
        } else {
          console.log(`⚠️ Section data not found for ${pendingEditSection}, but opening anyway for new entry`);
          // Open anyway - might be a new form
          requestAnimationFrame(() => {
            setTimeout(() => {
              setIsEditingFromProfile(true);
              setSelectedFeature(feature);
              setEditingForm(pendingEditSection);
              setModalVisible(true);
              setPendingEditSection(null);
            }, 300);
          });
        }
      }
    }
  }, [pendingEditSection, formDataLoaded, formData]);

  useEffect(() => {
    if (Object.values(formData).filter(form => form.isSubmitted).length === 9) {
      const timer = setTimeout(() => {
        router.replace('/'); // Redirect to category/home page
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  const handleFeaturePress = (feature: FeatureButton) => {
    const sectionId = feature.id as keyof FormDataState;
    if (!isFormSubmitted(feature.id) && hasSectionInput(sectionId)) {
      resetFormSection(sectionId);
    }
    setSelectedFeature(feature);
    setEditingForm(null); // Reset editing state when opening new form
    setIsEditingFromProfile(false); // Reset flag when manually opening
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

    const typedFormId = formId as keyof FormDataState;
    const validationResult = validateFormSection(typedFormId);
    if (!validationResult.valid) {
      Alert.alert('Incomplete Form', validationResult.message || 'Please complete all required fields before submitting.');
      return;
    }

    const sectionSnapshot = { ...(formData[typedFormId] as any) };
    console.log('💾 Current form data before save:', formData[typedFormId]);
    console.log('💾 Section snapshot:', sectionSnapshot);

    try {
      // Update local state and save to AsyncStorage - preserve ALL current field values
      let updatedFormData: FormDataState;
      await updateFormData(prev => {
        updatedFormData = {
          ...prev,
          [typedFormId]: {
            ...prev[typedFormId], // This preserves all current field values
            isSubmitted: true
          }
        };
        console.log('💾 Updated form data to save:', updatedFormData[typedFormId]);
        return updatedFormData;
      });

      // Save to farmerProfiles collection
      if (!user?.email) {
        Alert.alert('Error', 'User email not found');
        return;
      }

      console.log('📝 Saving form data to farmerProfiles collection...');
      const farmerProfileRef = doc(db, 'farmerProfiles', user.email);
      
      // Get existing farmer profile to merge with
      const existingProfileDoc = await getDoc(farmerProfileRef);
      const existingData = existingProfileDoc.exists() ? existingProfileDoc.data() : {};
      
      // Prepare the farmer profile document
      // Use ONLY the current formData (no AsyncStorage migration - clean start)
      const farmerProfileData: any = {
        ...existingData,
        email: user.email, // Always use current user email
        name: profile?.name || existingData.name || user?.displayName || user?.email?.split('@')[0] || 'User',
        uid: user.uid,
        updatedAt: serverTimestamp(),
        // Save complete form data (all sections) - ONLY from current form state
        formData: updatedFormData!
      };
      
      // Ensure email is set (document ID should match email)
      if (!farmerProfileData.email && user.email) {
        farmerProfileData.email = user.email;
      }

      console.log('📝 Farmer profile data to save:', farmerProfileData);
      console.log('📝 Form section to update:', typedFormId);

      // Use setDoc with merge to update/create the farmer profile document
      await setDoc(farmerProfileRef, farmerProfileData, { merge: true });
      console.log('✅ Farmer profile saved successfully to farmerProfiles collection!');

      setEditingForm(null);
      console.log(`Form ${formId} submitted successfully to database!`);
      
      // If editing from profile, close modal and go back
      if (isEditingFromProfile) {
        setModalVisible(false);
        setIsEditingFromProfile(false);
        Alert.alert('Success', 'Form updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Success', 'Form submitted successfully!');
      }
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
    
    // Debug logging
    if (isEditing) {
      console.log(`🔍 Rendering demographics form in EDIT mode:`, data);
      console.log(`🔍 Age: "${data.age}", Gender: "${data.gender}", Marital Status: "${data.maritalStatus}"`);
    }

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Household Expenses (Monthly):</Text>
          <View style={styles.radioGroup}>
            {[
              'Below ₱5,000', '₱5,001 – ₱10,000', '₱10,001 – ₱15,000',
              '₱15,001 – ₱20,000', '₱20,001 – ₱25,000', '₱25,001 above'
            ].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.householdExpenses === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, householdExpenses: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.householdExpenses === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Source of Drinking Water:</Text>
          <View style={styles.radioGroup}>
            {['River', 'Lakes', 'Groundwater'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.drinkingWater === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, drinkingWater: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.drinkingWater === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput, { marginTop: 8 }]} 
            placeholder="Other, please specify" 
            value={data.drinkingWater && !['River', 'Lakes', 'Groundwater'].includes(data.drinkingWater) ? data.drinkingWater : ''}
            onChangeText={(value) => {
              updateFormData(prev => ({
                ...prev,
                demographics: { ...prev.demographics, drinkingWater: value }
              }));
            }}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Children:</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter number of children" 
            keyboardType="numeric"
            value={data.numChildren}
            onChangeText={(value) => updateFormData(prev => ({
              ...prev,
              demographics: { ...prev.demographics, numChildren: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Are you a member of any organization?</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.organizationMember === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, organizationMember: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.organizationMember === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Are you a 4Ps beneficiary?</Text>
          <View style={styles.radioGroup}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.fourPsBeneficiary === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, fourPsBeneficiary: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.fourPsBeneficiary === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Religion:</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter religion" 
            value={data.religion}
            onChangeText={(value) => updateFormData(prev => ({
              ...prev,
              demographics: { ...prev.demographics, religion: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Complete Address:</Text>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
            placeholder="Enter complete address" 
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={data.completeAddress}
            onChangeText={(value) => updateFormData(prev => ({
              ...prev,
              demographics: { ...prev.demographics, completeAddress: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of Housing:</Text>
          <View style={styles.radioGroup}>
            {['Fully Concrete', 'Half Concrete', 'Nepa House', 'Other'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.housingType === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, housingType: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.housingType === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Source of Capital in Farming:</Text>
          <View style={styles.radioGroup}>
            {['Personal Savings', 'Bank Loan', 'Cooperative Credit', 'Government Loan', 'NGO Support', 'Family/Friends', 'Money Lender'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                  styles.radioButton, 
                  data.sourceOfCapital === option && styles.radioButtonSelected,
                  isSubmitted && !isEditing && styles.readOnlyRadioButton
                ]}
                onPress={() => {
                  if (!isSubmitted || isEditing) {
                    updateFormData(prev => ({
                      ...prev,
                      demographics: { ...prev.demographics, sourceOfCapital: option }
                    }));
                  }
                }}
                disabled={!canSubmit}
              >
                <Text style={[
                  styles.radioText, 
                  data.sourceOfCapital === option && styles.radioTextSelected,
                  isSubmitted && !isEditing && styles.readOnlyText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput 
            style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput, { marginTop: 8 }]} 
            placeholder="Other, please specify" 
            value={data.sourceOfCapital && !['Personal Savings', 'Bank Loan', 'Cooperative Credit', 'Government Loan', 'NGO Support', 'Family/Friends', 'Money Lender'].includes(data.sourceOfCapital) ? data.sourceOfCapital : ''}
            onChangeText={(value) => {
              updateFormData(prev => ({
                ...prev,
                demographics: { ...prev.demographics, sourceOfCapital: value }
              }));
            }}
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

  const renderFarmingProfileForm = () => {
    const formId = 'farmingProfile';
    const data = formData.farmingProfile;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
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
                      updateFormData(prev => ({
                        ...prev,
                        farmingProfile: { ...prev.farmingProfile, farmCommodity: filtered }
                      }));
                    } else {
                      updateFormData(prev => ({
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
                    <Ionicons name="checkmark" size={16} color={GREEN} />
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
            onChangeText={(value) => updateFormData(prev => ({
              ...prev,
              farmingProfile: { ...prev.farmingProfile, otherCommodity: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of Livestock Raised:</Text>
          <View style={styles.checkboxGroup}>
            {['Swine', 'Chicken', 'Pig', 'Carabao', 'Small Ruminant', 'Large Ruminant'].map((option) => {
              const isSelected = data.livestock.includes(option);
              const count = data.livestockCounts?.[option] || '';
              
              return (
                <View key={option} style={styles.livestockItemContainer}>
                  <TouchableOpacity 
                    style={styles.checkboxRow}
                    onPress={() => {
                      if (!isSubmitted || isEditing) {
                        const currentLivestock = [...data.livestock];
                        const currentCounts = { ...(data.livestockCounts || {}) };
                        
                        if (currentLivestock.includes(option)) {
                          const filtered = currentLivestock.filter(item => item !== option);
                          delete currentCounts[option];
                          updateFormData(prev => ({
                            ...prev,
                            farmingProfile: { 
                              ...prev.farmingProfile, 
                              livestock: filtered,
                              livestockCounts: currentCounts
                            }
                          }));
                        } else {
                          updateFormData(prev => ({
                            ...prev,
                            farmingProfile: { 
                              ...prev.farmingProfile, 
                              livestock: [...currentLivestock, option],
                              livestockCounts: { ...currentCounts, [option]: '' }
                            }
                          }));
                        }
                      }
                    }}
                    disabled={!canSubmit}
                  >
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                      isSubmitted && !isEditing && styles.readOnlyCheckbox
                    ]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={GREEN} />
                      )}
                    </View>
                    <Text style={[
                      styles.checkboxText,
                      isSubmitted && !isEditing && styles.readOnlyText
                    ]}>{option}</Text>
                  </TouchableOpacity>
                  
                  {isSelected && (
                    <View style={styles.livestockCountContainer}>
                      <Text style={styles.countLabel}>Count:</Text>
                      <TextInput 
                        style={[styles.countInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
                        placeholder="0" 
                        keyboardType="numeric"
                        value={count}
                        onChangeText={(value) => {
                          updateFormData(prev => ({
                            ...prev,
                            farmingProfile: { 
                              ...prev.farmingProfile, 
                              livestockCounts: { 
                                ...(prev.farmingProfile.livestockCounts || {}), 
                                [option]: value 
                              }
                            }
                          }));
                        }}
                        editable={!isSubmitted || isEditing}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          
          {data.otherLivestock && (
            <View style={styles.otherLivestockContainer}>
              <Text style={styles.label}>Other Livestock:</Text>
              <TextInput 
                style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
                placeholder="Others, please specify" 
                value={data.otherLivestock}
                onChangeText={(value) => updateFormData(prev => ({
                  ...prev,
                  farmingProfile: { ...prev.farmingProfile, otherLivestock: value }
                }))}
                editable={!isSubmitted || isEditing}
              />
              <View style={styles.livestockCountContainer}>
                <Text style={styles.countLabel}>Count:</Text>
                <TextInput 
                  style={[styles.countInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
                  placeholder="0" 
                  keyboardType="numeric"
                  value={data.otherLivestockCount || ''}
                  onChangeText={(value) => updateFormData(prev => ({
                    ...prev,
                    farmingProfile: { ...prev.farmingProfile, otherLivestockCount: value }
                  }))}
                  editable={!isSubmitted || isEditing}
                />
              </View>
            </View>
          )}
          
          {!data.otherLivestock && (
            <TextInput 
              style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput, { marginTop: 8 }]} 
              placeholder="Others, please specify" 
              value={data.otherLivestock}
              onChangeText={(value) => updateFormData(prev => ({
                ...prev,
                farmingProfile: { 
                  ...prev.farmingProfile, 
                  otherLivestock: value,
                  otherLivestockCount: value ? (prev.farmingProfile.otherLivestockCount || '') : ''
                }
              }))}
              editable={!isSubmitted || isEditing}
            />
          )}
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

        {data.landOwnership === 'Rental' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>If rental, how much do you pay?</Text>
            <TextInput 
              style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
              placeholder="Enter rental amount" 
              keyboardType="numeric"
              value={data.rentalAmount}
              onChangeText={(value) => updateFormData(prev => ({
                ...prev,
                farmingProfile: { ...prev.farmingProfile, rentalAmount: value }
              }))}
              editable={!isSubmitted || isEditing}
            />
          </View>
        )}

        {data.landOwnership === 'Tenant' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>If tenant, what condition?</Text>
            <TextInput 
              style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
              placeholder="Enter tenant condition" 
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={data.tenantCondition}
              onChangeText={(value) => updateFormData(prev => ({
                ...prev,
                farmingProfile: { ...prev.farmingProfile, tenantCondition: value }
              }))}
              editable={!isSubmitted || isEditing}
            />
          </View>
        )}

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
                      farmingProfile: { ...prev.farmingProfile, farmSize: option, otherFarmSize: '' }
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
              farmingProfile: { 
                ...prev.farmingProfile, 
                otherFarmSize: value,
                farmSize: value ? '' : prev.farmingProfile.farmSize
              }
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
                    <Ionicons name="checkmark" size={16} color={GREEN} />
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
                      economicFinancial: { ...prev.economicFinancial, incomeSources: option, otherIncome: '' }
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
              economicFinancial: { 
                ...prev.economicFinancial, 
                otherIncome: value,
                incomeSources: value ? '' : prev.economicFinancial.incomeSources
              }
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
                      economicFinancial: { ...prev.economicFinancial, farmingFinances: option, otherFinances: '' }
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
              economicFinancial: { 
                ...prev.economicFinancial, 
                otherFinances: value,
                farmingFinances: value ? '' : prev.economicFinancial.farmingFinances
              }
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
                    <Ionicons name="checkmark" size={16} color={GREEN} />
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
            onChangeText={(value) => updateFormData(prev => ({
              ...prev,
              technologyInnovation: { ...prev.technologyInnovation, otherEquipment: value }
            }))}
            editable={!isSubmitted || isEditing}
          />
        </View>

        {data.farmingEquipment.includes('Machinery') && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>If you use machine, is it owned or rented?</Text>
              <View style={styles.radioGroup}>
                {['Owned', 'Rented'].map((option) => (
                  <TouchableOpacity 
                    key={option} 
                    style={[
                      styles.radioButton, 
                      data.machineOwnership === option && styles.radioButtonSelected,
                      isSubmitted && !isEditing && styles.readOnlyRadioButton
                    ]}
                    onPress={() => {
                      if (!isSubmitted || isEditing) {
                        updateFormData(prev => ({
                          ...prev,
                          technologyInnovation: { ...prev.technologyInnovation, machineOwnership: option }
                        }));
                      }
                    }}
                    disabled={!canSubmit}
                  >
                    <Text style={[
                      styles.radioText, 
                      data.machineOwnership === option && styles.radioTextSelected,
                      isSubmitted && !isEditing && styles.readOnlyText
                    ]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {data.machineOwnership === 'Owned' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>If own, how much did you buy it?</Text>
                <TextInput 
                  style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
                  placeholder="Enter purchase price" 
                  keyboardType="numeric"
                  value={data.machinePurchasePrice}
                  onChangeText={(value) => updateFormData(prev => ({
                    ...prev,
                    technologyInnovation: { ...prev.technologyInnovation, machinePurchasePrice: value }
                  }))}
                  editable={!isSubmitted || isEditing}
                />
              </View>
            )}

            {data.machineOwnership === 'Rented' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>If rented, how much is the rental?</Text>
                <TextInput 
                  style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
                  placeholder="Enter rental price" 
                  keyboardType="numeric"
                  value={data.machineRentalPrice}
                  onChangeText={(value) => updateFormData(prev => ({
                    ...prev,
                    technologyInnovation: { ...prev.technologyInnovation, machineRentalPrice: value }
                  }))}
                  editable={!isSubmitted || isEditing}
                />
              </View>
            )}
          </>
        )}

        {data.farmingEquipment.includes('Irrigation system') && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Irrigation Expenses:</Text>
            <TextInput 
              style={[styles.textInput, isSubmitted && !isEditing && styles.readOnlyInput]} 
              placeholder="Enter irrigation expenses" 
              keyboardType="numeric"
              value={data.irrigationExpenses}
              onChangeText={(value) => updateFormData(prev => ({
                ...prev,
                technologyInnovation: { ...prev.technologyInnovation, irrigationExpenses: value }
              }))}
              editable={!isSubmitted || isEditing}
            />
          </View>
        )}

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
                    <Ionicons name="checkmark" size={16} color={GREEN} />
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
                    <Ionicons name="checkmark" size={16} color={GREEN} />
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
                    <Ionicons name="checkmark" size={16} color={GREEN} />
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
                    <Ionicons name="checkmark" size={16} color={GREEN} />
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

  const renderIncomeMarketingForm = () => {
    const formId = 'incomeMarketing';
    const data = formData.incomeMarketing;
    const isSubmitted = isFormSubmitted(formId);
    const isEditing = isFormEditing(formId);
    const canEdit = canEditForm(formId);
    const canSubmit = canSubmitForm(formId);

    return (
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
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
                    <Ionicons name="checkmark" size={16} color={GREEN} />
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

  const allFormsCompleted =
    Object.values(formData).filter((form) => form.isSubmitted).length ===
    featureButtons.length;

  useEffect(() => {
    if (!allFormsCompleted) return;

    // Mark forms as completed locally so future logins can skip this screen
    const markCompletedAndRedirect = async () => {
      try {
        if (user?.email) {
          const completionKey = `farmerFormsCompleted_${user.email.toLowerCase()}`;
          await AsyncStorage.setItem(completionKey, 'true');
          console.log('✅ Marked farmer forms as completed in AsyncStorage');
        }
      } catch (e) {
        console.error('❌ Error marking farmer forms as completed:', e);
      }

      // Redirect away from the farmer form once everything is done
      if (modalVisible) {
        setModalVisible(false); // Close the modal if open, then go back to profile
        setTimeout(() => {
          if (isEditingFromProfile) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }, 300);
      } else {
        router.replace('/(tabs)');
      }
    };

    markCompletedAndRedirect();
  }, [allFormsCompleted, modalVisible, user?.email, isEditingFromProfile, router]);

  // If all forms are completed, don't render this screen's UI while we redirect.
  if (allFormsCompleted) {
    return <View style={{ flex: 1, backgroundColor: '#f8f9fa' }} />;
  }

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
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 24 }}>
        {!allFormsCompleted && (
          <>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#16543a', marginBottom: 8 }}>
              Welcome {profile?.name || 'User'}!
            </Text>
            <Text style={{ fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' }}>
              Please fill up the form below.
            </Text>
          </>
        )}

        {!allFormsCompleted && !isEditingFromProfile ? (
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: '90%' }}>
              {featureButtons.map(renderFeatureButton)}
            </View>
          </ScrollView>
        ) : null}
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
                  onPress={() => {
                    setModalVisible(false);
                    if (isEditingFromProfile) {
                      setIsEditingFromProfile(false);
                      router.back(); // Go back to profile information screen
                    }
                  }}
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
    borderColor: '#9ec6b2',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GREEN,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -20,
    padding: 8,
  },
  formScroll: {
    flex: 1,
    padding: 20,
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
    borderColor: '#9ec6b2',
    borderRadius: 6,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  livestockItemContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  livestockCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 44, // Align with checkbox text
    gap: 12,
  },
  countLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 50,
  },
  countInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: WHITE,
    color: '#333',
    minHeight: 44,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otherLivestockContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
    backgroundColor: '#f1fbf6',
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