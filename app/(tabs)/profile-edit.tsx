import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthContext';

const GREEN = '#16543a';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [location, setLocation] = useState(profile.location);
  const [image, setImage] = useState(profile.profileImage);

  // Update local state when profile changes
  useEffect(() => {
    setName(profile.name);
    setRole(profile.role);
    setLocation(profile.location);
    setImage(profile.profileImage);
  }, [profile]);

  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = () => {
    // Update the global profile state
    updateProfile({
      name,
      role,
      location,
      profileImage: image
    });
    
    Alert.alert('Success', 'Profile updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleCancel = () => {
    // Reset to original values
    setName(profile.name);
    setRole(profile.role);
    setLocation(profile.location);
    setImage(profile.profileImage);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>
      
      <TouchableOpacity onPress={pickImage} style={styles.imageWrap}>
        <Image source={{ uri: image }} style={styles.profileImage} />
        <Text style={styles.changePic}>Change Photo</Text>
      </TouchableOpacity>
      
      <View style={styles.formContainer}>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Name" 
          placeholderTextColor="#999"
        />
        <TextInput 
          style={styles.input} 
          value={role} 
          onChangeText={setRole} 
          placeholder="Role" 
          placeholderTextColor="#999"
        />
        <TextInput 
          style={styles.input} 
          value={location} 
          onChangeText={setLocation} 
          placeholder="Location" 
          placeholderTextColor="#999"
        />
      </View>
      
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa'
  },
  header: {
    backgroundColor: GREEN,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageWrap: { 
    alignItems: 'center', 
    marginTop: 24,
    marginBottom: 24,
  },
  profileImage: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    borderWidth: 3, 
    borderColor: GREEN 
  },
  changePic: { 
    color: GREEN, 
    marginTop: 8, 
    fontWeight: 'bold',
    fontSize: 16,
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  input: { 
    width: '100%', 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    padding: 16, 
    fontSize: 16, 
    color: GREEN, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btnRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  cancelBtn: { 
    flex: 1,
    backgroundColor: '#f0f0f0', 
    borderRadius: 18, 
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveBtn: { 
    flex: 1,
    backgroundColor: GREEN, 
    borderRadius: 18, 
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelText: { 
    color: '#666', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  saveText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
}); 