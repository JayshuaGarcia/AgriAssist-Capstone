import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { auth, db } from '../lib/firebase';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

// Sample crop/product data
const CROP_TYPES = [
  'Rice', 'Corn', 'Wheat', 'Soybean', 'Tomato', 'Potato', 'Onion', 'Carrot',
  'Cabbage', 'Lettuce', 'Spinach', 'Pepper', 'Eggplant', 'Cucumber', 'Squash',
  'Beans', 'Peas', 'Okra', 'Sweet Potato', 'Cassava', 'Banana', 'Mango',
  'Papaya', 'Coconut', 'Coffee', 'Cacao', 'Sugarcane', 'Cotton', 'Tobacco',
  'Sunflower', 'Peanut', 'Sesame', 'Herbs', 'Spices', 'Flowers', 'Ornamental Plants'
];

export default function PlantingReportScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState('sqm');
  const [customAmountType, setCustomAmountType] = useState('');
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Filter crops based on search query
  const filteredCrops = CROP_TYPES.filter(crop =>
    crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCropSelect = (crop: string) => {
    setSelectedCrop(crop);
    setSearchQuery(crop);
    setShowSuggestions(false);
  };

  const handleImagePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        multiple: false,
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCrop || !amount) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!user || !profile) {
      Alert.alert('Error', 'Please log in to submit reports.');
      return;
    }

    console.log('🔄 Submitting planting report...');
    console.log('👤 User:', user);
    console.log('📋 Profile:', profile);
    console.log('🔐 Auth token:', user ? 'User authenticated' : 'User not authenticated');
    
    setSubmitting(true);
    
    try {
      // Prepare planting data
      const plantingData = {
        userId: user.uid,
        farmerName: profile.name,
        farmerEmail: user.email,
        crop: selectedCrop,
        areaPlanted: parseFloat(amount),
        areaType: amountType,
        customAreaType: customAmountType || null,
        imageUrl: selectedImage || null,
        status: 'pending', // Admin can review and approve
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      console.log('📊 Planting data:', plantingData);

      // Save to Firestore
      const plantingRef = collection(db, 'plantingReports');
      console.log('🔥 Attempting to save to Firestore...');
      console.log('🔐 Current auth state:', auth.currentUser);
      console.log('🔐 User UID from context:', user?.uid);
      await addDoc(plantingRef, plantingData);
      console.log('✅ Successfully saved to Firestore!');
      
      Alert.alert(
        'Success!',
        'Planting report submitted successfully and sent to admin for review.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedCrop('');
              setSearchQuery('');
              setAmount('');
              setAmountType('sqm');
              setCustomAmountType('');
              setShowCustomUnit(false);
              setSelectedImage(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting planting report:', error);
      Alert.alert('Error', 'Failed to submit planting report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Top Green Border */}
        <View style={styles.topBorder} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Planting Report</Text>
          <View style={{ width: 24 }} />
        </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[GREEN]}
            tintColor={GREEN}
          />
        }
      >
        <View style={styles.contentContainer}>
          <Text style={styles.formSubtitle}>Record your planting activities and area details</Text>

          {/* Crop/Product Selection */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Product/Crop *</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for crops or products..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSuggestions(text.length > 0);
                  if (text.length === 0) {
                    setSelectedCrop('');
                  }
                }}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
              />
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            </View>
            
            {showSuggestions && filteredCrops.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredCrops.slice(0, 5).map((item, index) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.suggestionItem}
                    onPress={() => handleCropSelect(item)}
                  >
                    <Ionicons name="leaf" size={16} color={GREEN} />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Area Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Area Planted *</Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter area size"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <View style={styles.amountTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.amountTypeButton,
                    amountType === 'sqm' && styles.amountTypeButtonActive
                  ]}
                  onPress={() => setAmountType('sqm')}
                >
                  <Text style={[
                    styles.amountTypeText,
                    amountType === 'sqm' && styles.amountTypeTextActive
                  ]}>sqm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.amountTypeButton,
                    amountType === 'hectares' && styles.amountTypeButtonActive
                  ]}
                  onPress={() => setAmountType('hectares')}
                >
                  <Text style={[
                    styles.amountTypeText,
                    amountType === 'hectares' && styles.amountTypeTextActive
                  ]}>hectares</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.othersButton}
              onPress={() => setShowCustomUnit(!showCustomUnit)}
            >
              <Text style={styles.othersButtonText}>Other's please specify</Text>
            </TouchableOpacity>
            
            {showCustomUnit && (
              <TextInput
                style={styles.customAmountInput}
                placeholder="Specify unit (e.g., acres, square feet)"
                value={customAmountType}
                onChangeText={setCustomAmountType}
              />
            )}
          </View>

          {/* Image Upload Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Proof/Documentation</Text>
            <Text style={styles.sectionDescription}>Upload a photo for proof or documentation</Text>
            
            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imageUploadButton} onPress={handleImagePicker}>
                <Ionicons name="camera" size={24} color={GREEN} />
                <Text style={styles.imageUploadText}>Take Photo or Select from Gallery</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Ionicons 
              name={submitting ? "hourglass" : "checkmark-circle"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBorder: {
    height: 36,
    width: '100%',
    backgroundColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    flex: 1,
    textAlign: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 30,
  },
  formSection: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  amountTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  amountTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  amountTypeButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  amountTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  amountTypeTextActive: {
    color: '#fff',
  },
  othersButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  othersButtonText: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '500',
  },
  customAmountInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    marginTop: 12,
  },
  imageUploadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadText: {
    fontSize: 16,
    color: GREEN,
    marginTop: 8,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
