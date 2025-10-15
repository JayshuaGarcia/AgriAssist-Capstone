import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { usePrivacySettings } from '../components/PrivacySettingsContext';
import { sendEmailVerification, updateEmail } from '../lib/emailService';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

// Crop icon options for profile with realistic emoji icons
const CROP_ICONS = [
  { id: 'rice', name: 'Rice', emoji: '🌾', icon: 'leaf' },
  { id: 'potato', name: 'Potato', emoji: '🥔', icon: 'leaf' },
  { id: 'cabbage', name: 'Cabbage', emoji: '🥬', icon: 'leaf' },
  { id: 'spinach', name: 'Spinach', emoji: '🥬', icon: 'leaf' },
  { id: 'tomato', name: 'Tomato', emoji: '🍅', icon: 'leaf' },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', icon: 'leaf' },
  { id: 'corn', name: 'Corn', emoji: '🌽', icon: 'leaf' },
  { id: 'eggplant', name: 'Eggplant', emoji: '🍆', icon: 'leaf' },
  { id: 'pepper', name: 'Pepper', emoji: '🌶️', icon: 'leaf' },
  { id: 'cucumber', name: 'Cucumber', emoji: '🥒', icon: 'leaf' },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', icon: 'leaf' },
  { id: 'mushroom', name: 'Mushroom', emoji: '🍄', icon: 'leaf' },
  { id: 'apple', name: 'Apple', emoji: '🍎', icon: 'leaf' },
  { id: 'banana', name: 'Banana', emoji: '🍌', icon: 'leaf' },
  { id: 'orange', name: 'Orange', emoji: '🍊', icon: 'leaf' },
  { id: 'lemon', name: 'Lemon', emoji: '🍋', icon: 'leaf' },
  { id: 'grape', name: 'Grape', emoji: '🍇', icon: 'leaf' },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', icon: 'leaf' },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', icon: 'leaf' },
  { id: 'pineapple', name: 'Pineapple', emoji: '🍍', icon: 'leaf' },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', icon: 'leaf' },
  { id: 'coconut', name: 'Coconut', emoji: '🥥', icon: 'leaf' },
  { id: 'mango', name: 'Mango', emoji: '🥭', icon: 'leaf' },
  { id: 'peach', name: 'Peach', emoji: '🍑', icon: 'leaf' }
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, resetToDefaults } = usePrivacySettings();
  const [refreshing, setRefreshing] = React.useState(false);
  const { user, profile, updateProfile, updateProfileImage } = useAuth();
  const [editName, setEditName] = React.useState(profile.name || '');
  const [editPhone, setEditPhone] = React.useState(profile.phone || '');
  const [backupEmail, setBackupEmail] = React.useState(profile.backupEmail || '');
  
  // Crop icon picker states
  const [showCropIconPicker, setShowCropIconPicker] = React.useState(false);
  const [selectedCropIcon, setSelectedCropIcon] = React.useState(
    profile.selectedCropIcon || 'rice'
  );
  
  // Check if profile has a selected crop icon or a photo
  const hasCropIcon = profile.selectedCropIcon;
  const hasPhoto = profile.profileImage;

  // Update local state when profile changes
  React.useEffect(() => {
    if (profile.selectedCropIcon) {
      setSelectedCropIcon(profile.selectedCropIcon);
    }
  }, [profile.selectedCropIcon]);
  const [updatingUsername, setUpdatingUsername] = React.useState(false);
  const [updatingPhone, setUpdatingPhone] = React.useState(false);
  const [updatingBackupEmail, setUpdatingBackupEmail] = React.useState(false);
  const [usernameSuccess, setUsernameSuccess] = React.useState(false);
  const [phoneSuccess, setPhoneSuccess] = React.useState(false);
  const [backupEmailSuccess, setBackupEmailSuccess] = React.useState(false);
  
  // Email change states
  const [newEmail, setNewEmail] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [isChangingEmail, setIsChangingEmail] = React.useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = React.useState(false);
  const [emailChangeStep, setEmailChangeStep] = React.useState<'input' | 'verify' | 'success'>('input');
  const [emailChangeError, setEmailChangeError] = React.useState('');
  
  // Password change states
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordChangeError, setPasswordChangeError] = React.useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = React.useState(false);
  const [showPasswords, setShowPasswords] = React.useState({
    old: false,
    new: false,
    confirm: false
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // Email change functions
  const handleSendVerificationCode = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setEmailChangeError('Please enter a valid email address');
      return;
    }

    if (newEmail === user?.email) {
      setEmailChangeError('New email must be different from current email');
      return;
    }

    setIsChangingEmail(true);
    setEmailChangeError('');

    try {
      await sendEmailVerification(newEmail, 'email-change');
      setEmailChangeStep('verify');
      Alert.alert(
        'Verification Code Sent',
        `A verification code has been sent to ${newEmail}. Please check your email and enter the code below.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setEmailChangeError(error.message || 'Failed to send verification code');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleVerifyAndChangeEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setEmailChangeError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsVerifyingCode(true);
    setEmailChangeError('');

    try {
      await updateEmail(newEmail, verificationCode);
      setEmailChangeStep('success');
      Alert.alert(
        'Email Changed Successfully',
        `Your email has been successfully changed to ${newEmail}. You will need to log in again with your new email.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setNewEmail('');
              setVerificationCode('');
              setEmailChangeStep('input');
              setEmailChangeError('');
            }
          }
        ]
      );
    } catch (error: any) {
      setEmailChangeError(error.message || 'Failed to verify code or change email');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const resetEmailChangeForm = () => {
    setNewEmail('');
    setVerificationCode('');
    setEmailChangeStep('input');
    setEmailChangeError('');
  };

  // Password change functions

  const handleChangePassword = async () => {
    // Clear previous errors
    setPasswordChangeError('');
    setPasswordChangeSuccess(false);

    // Validation
    if (!oldPassword) {
      setPasswordChangeError('Please enter your current password');
      return;
    }

    if (!newPassword) {
      setPasswordChangeError('Please enter a new password');
      return;
    }

    if (!confirmPassword) {
      setPasswordChangeError('Please confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordChangeError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Here you would typically verify the old password and update the new password
      // For now, we'll simulate the process
      console.log('🔄 Changing password...');
      console.log('Old password:', oldPassword);
      console.log('New password:', newPassword);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would:
      // 1. Verify the old password with your authentication service
      // 2. Update the password in your database
      // 3. Handle any errors appropriately
      
      setPasswordChangeSuccess(true);
      setPasswordChangeError('');
      
      // Clear form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswords({ old: false, new: false, confirm: false });
      
      Alert.alert(
        'Password Changed Successfully',
        'Your password has been updated successfully. You will need to log in again with your new password.',
        [{ text: 'OK' }]
      );
      
      // Reset success state after 3 seconds
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
      
    } catch (error: any) {
      console.error('❌ Error changing password:', error);
      setPasswordChangeError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCropIconSelection = async (cropIconId: string) => {
    try {
      const selectedCrop = CROP_ICONS.find(crop => crop.id === cropIconId);
      if (!selectedCrop) return;
      
      console.log('🌱 Selected crop:', selectedCrop);
      
      // Update profile with selected crop icon data
      await updateProfile({ 
        selectedCropIcon: cropIconId,
        selectedCropEmoji: selectedCrop.emoji,
        selectedCropName: selectedCrop.name
      });
      
      // Clear any existing profile image when selecting crop icon
      if (hasPhoto) {
        await updateProfileImage(null);
      }
      
      setSelectedCropIcon(cropIconId);
      setShowCropIconPicker(false);
      
      Alert.alert('Success', `Profile icon updated to ${selectedCrop.name}!`);
    } catch (error) {
      console.error('Error updating crop icon:', error);
      Alert.alert('Error', 'Failed to update profile icon');
    }
  };



  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={styles.topBorder} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.avatarContainer}>
        <View style={styles.cropIconAvatar}>
          <Text style={styles.cropEmoji}>
            {profile.selectedCropEmoji || '🌱'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.avatarButton} 
          onPress={() => setShowCropIconPicker(true)}
        >
          <Ionicons name="leaf" size={18} color="#fff" />
          <Text style={styles.avatarButtonText}>Change icon</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} tintColor={GREEN} />}>


        <Text style={styles.sectionTitle}>Profile Info</Text>
        
        {/* Change Email Section */}
        <View style={styles.card}>
          <View style={styles.emailChangeHeader}>
            <Ionicons name="mail" size={24} color={GREEN} />
            <Text style={styles.emailChangeTitle}>Change Email Address</Text>
          </View>
          
          {/* Current Email Display */}
          <View style={styles.currentEmailContainer}>
            <Text style={styles.currentEmailLabel}>Current Email:</Text>
            <Text style={styles.currentEmailText}>{user?.email}</Text>
          </View>

          {emailChangeStep === 'input' && (
            <>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>New Email Address</Text>
                <TextInput 
                  value={newEmail} 
                  onChangeText={(text) => {
                    setNewEmail(text);
                    setEmailChangeError('');
                  }}
                  placeholder="Enter new email address" 
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              {emailChangeError && (
                <View style={styles.emailErrorContainer}>
                  <Ionicons name="warning" size={16} color="#ff6b6b" />
                  <Text style={styles.emailErrorText}>{emailChangeError}</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, (!newEmail || isChangingEmail) && styles.actionButtonDisabled]}
                onPress={handleSendVerificationCode}
                disabled={!newEmail || isChangingEmail}
              >
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {isChangingEmail ? "Sending..." : "Send Verification Code"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {emailChangeStep === 'verify' && (
            <>
              <View style={styles.verificationInfo}>
                <Ionicons name="checkmark-circle" size={20} color={GREEN} />
                <Text style={styles.verificationInfoText}>
                  Verification code sent to {newEmail}
                </Text>
              </View>
              
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <TextInput 
                  value={verificationCode} 
                  onChangeText={(text) => {
                    setVerificationCode(text);
                    setEmailChangeError('');
                  }}
                  placeholder="Enter 6-digit code" 
                  style={styles.textInput}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              
              {emailChangeError && (
                <View style={styles.emailErrorContainer}>
                  <Ionicons name="warning" size={16} color="#ff6b6b" />
                  <Text style={styles.emailErrorText}>{emailChangeError}</Text>
                </View>
              )}
              
              <View style={styles.verificationButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.emailSecondaryButton]}
                  onPress={resetEmailChangeForm}
                >
                  <Ionicons name="arrow-back" size={18} color={GREEN} />
                  <Text style={[styles.actionButtonText, { color: GREEN }]}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, (!verificationCode || verificationCode.length !== 6 || isVerifyingCode) && styles.actionButtonDisabled]}
                  onPress={handleVerifyAndChangeEmail}
                  disabled={!verificationCode || verificationCode.length !== 6 || isVerifyingCode}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {isVerifyingCode ? "Verifying..." : "Verify & Change Email"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {emailChangeStep === 'success' && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={48} color={GREEN} />
              <Text style={styles.emailSuccessTitle}>Email Changed Successfully!</Text>
              <Text style={styles.successText}>
                Your email has been updated to {newEmail}
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={resetEmailChangeForm}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Change Another Email</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Spacing between sections */}
        <View style={{ height: 20 }} />
        
        {/* Change Password Section */}
        <View style={styles.card}>
          <View style={styles.passwordChangeHeader}>
            <Ionicons name="lock-closed" size={24} color={GREEN} />
            <Text style={styles.passwordChangeTitle}>Change Password</Text>
          </View>
          
          {/* Current Password */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordChangeInputContainer}>
              <TextInput 
                value={oldPassword} 
                onChangeText={(text) => {
                  setOldPassword(text);
                  setPasswordChangeError('');
                }}
                placeholder="Enter your current password" 
                style={styles.passwordChangeInput}
                secureTextEntry={!showPasswords.old}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordChangeEyeButton}
                onPress={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
              >
                <Ionicons 
                  name={showPasswords.old ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordChangeInputContainer}>
              <TextInput 
                value={newPassword} 
                onChangeText={(text) => {
                  setNewPassword(text);
                  setPasswordChangeError('');
                }}
                placeholder="Enter new password" 
                style={styles.passwordChangeInput}
                secureTextEntry={!showPasswords.new}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordChangeEyeButton}
                onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                <Ionicons 
                  name={showPasswords.new ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordChangeInputContainer}>
              <TextInput 
                value={confirmPassword} 
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setPasswordChangeError('');
                }}
                placeholder="Confirm new password" 
                style={styles.passwordChangeInput}
                secureTextEntry={!showPasswords.confirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordChangeEyeButton}
                onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                <Ionicons 
                  name={showPasswords.confirm ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          
          {passwordChangeError && (
            <View style={styles.passwordErrorContainer}>
              <Ionicons name="warning" size={16} color="#ff6b6b" />
              <Text style={styles.passwordErrorText}>{passwordChangeError}</Text>
            </View>
          )}
          
          {passwordChangeSuccess && (
            <View style={styles.passwordSuccessContainer}>
              <Ionicons name="checkmark-circle" size={20} color={GREEN} />
              <Text style={styles.passwordSuccessText}>Password changed successfully!</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, (!oldPassword || !newPassword || !confirmPassword || isChangingPassword) && styles.actionButtonDisabled]}
            onPress={handleChangePassword}
            disabled={!oldPassword || !newPassword || !confirmPassword || isChangingPassword}
          >
            <Ionicons name={passwordChangeSuccess ? "checkmark" : "lock-closed"} size={18} color="#fff" />
            <Text style={styles.actionButtonText}>
              {isChangingPassword ? "Changing..." : passwordChangeSuccess ? "Changed!" : "Change Password"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Spacing between sections */}
        <View style={{ height: 20 }} />
        
        {/* Username Section */}
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput 
              value={editName} 
              onChangeText={setEditName} 
              placeholder="Enter your username" 
              style={styles.textInput} 
            />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, (!editName || editName === profile.name || updatingUsername) && styles.actionButtonDisabled]}
            onPress={async () => {
              if (!editName || editName === profile.name || updatingUsername) return;
              setUpdatingUsername(true);
              setUsernameSuccess(false);
              try {
                await updateProfile({ name: editName });
                setUsernameSuccess(true);
                setTimeout(() => setUsernameSuccess(false), 3000);
              } catch (error) {
                console.error('Error updating username:', error);
              } finally {
                setUpdatingUsername(false);
              }
            }}
            disabled={!editName || editName === profile.name || updatingUsername}
          >
            <Ionicons name={usernameSuccess ? "checkmark" : "person"} size={18} color="#fff" />
            <Text style={styles.actionButtonText}>
              {updatingUsername ? "Updating..." : usernameSuccess ? "Updated!" : "Update Username"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Phone Number Section */}
        <View style={[styles.card, styles.cardSpacing]}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput 
              value={editPhone} 
              onChangeText={setEditPhone} 
              placeholder="09xx xxx xxxx" 
              style={styles.textInput} 
              keyboardType="phone-pad" 
            />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, (editPhone.length !== 11 || updatingPhone) && styles.actionButtonDisabled]}
            onPress={async () => {
              if (editPhone.length !== 11 || updatingPhone) return;
              setUpdatingPhone(true);
              setPhoneSuccess(false);
              try {
                await updateProfile({ phone: editPhone });
                setPhoneSuccess(true);
                setTimeout(() => setPhoneSuccess(false), 3000);
              } catch (error) {
                console.error('Error updating phone number:', error);
              } finally {
                setUpdatingPhone(false);
              }
            }}
            disabled={editPhone.length !== 11 || updatingPhone}
          >
            <Ionicons name={phoneSuccess ? "checkmark" : "call"} size={18} color="#fff" />
            <Text style={styles.actionButtonText}>
              {updatingPhone ? "Updating..." : phoneSuccess ? "Updated!" : "Update Phone Number"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Security</Text>
        
        {/* Backup Email Section */}
        <View style={[styles.card, styles.cardSpacing]}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Backup Email</Text>
            <TextInput 
              value={backupEmail} 
              onChangeText={setBackupEmail} 
              placeholder="Enter backup email address" 
              style={styles.textInput} 
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, (!backupEmail || backupEmail === profile.backupEmail || updatingBackupEmail) && styles.actionButtonDisabled]}
            onPress={async () => {
              if (!backupEmail || backupEmail === profile.backupEmail || updatingBackupEmail) return;
              setUpdatingBackupEmail(true);
              setBackupEmailSuccess(false);
              try {
                await updateProfile({ backupEmail: backupEmail });
                setBackupEmailSuccess(true);
                setTimeout(() => setBackupEmailSuccess(false), 3000);
              } catch (error) {
                console.error('Error updating backup email:', error);
              } finally {
                setUpdatingBackupEmail(false);
              }
            }}
            disabled={!backupEmail || backupEmail === profile.backupEmail || updatingBackupEmail}
          >
            <Ionicons name={backupEmailSuccess ? "checkmark" : "mail"} size={18} color="#fff" />
            <Text style={styles.actionButtonText}>
              {updatingBackupEmail ? "Updating..." : backupEmailSuccess ? "Updated!" : "Update Backup Email"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.privacyCenterButton}
            onPress={() => {
              // Navigate to Privacy Center (we'll implement this)
              console.log('Navigate to Privacy Center');
            }}
          >
            <Ionicons name="shield-checkmark" size={20} color={GREEN} />
            <View style={styles.privacyCenterContent}>
              <Text style={styles.privacyCenterTitle}>Privacy Center</Text>
              <Text style={styles.privacyCenterDescription}>View your account activity and privacy settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Crop Icon Picker Modal */}
      <Modal
        visible={showCropIconPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCropIconPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Profile Icon</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCropIconPicker(false)}
              >
                <Ionicons name="close" size={24} color={GREEN} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.scrollableGrid}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.cropIconGrid}
            >
              {CROP_ICONS.map((crop) => (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.cropIconItem,
                    selectedCropIcon === crop.id && styles.cropIconItemSelected
                  ]}
                  onPress={() => handleCropIconSelection(crop.id)}
                >
                  <View style={styles.cropIconCircle}>
                    <Text style={styles.cropEmojiSmall}>{crop.emoji}</Text>
                  </View>
                  <Text style={[
                    styles.cropIconLabel,
                    selectedCropIcon === crop.icon && styles.cropIconLabelSelected
                  ]}>
                    {crop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingRow({ icon, label, description, value, onValueChange, borderTop }: { icon: any; label: string; description: string; value: boolean; onValueChange: (v: boolean) => void; borderTop?: boolean; }) {
  return (
    <View style={[styles.row, borderTop && styles.rowBorderTop]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={22} color={GREEN} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowDescription}>{description}</Text>
        </View>
      </View>
      <Switch value={value} onValueChange={onValueChange} thumbColor={value ? GREEN : '#f4f3f4'} trackColor={{ false: '#d1d5db', true: LIGHT_GREEN }} />
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
  container: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginTop: 8,
    marginBottom: 8
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardSpacing: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18
  },
  rowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: 12,
    color: '#555'
  },
  inputRow: {
    paddingVertical: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  readonlyField: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  readonlyText: {
    color: '#374151',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingRight: 45, // Space for eye icon
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  actionButtonSuccess: {
    backgroundColor: GREEN,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  successText: {
    color: '#065f46',
    fontWeight: '700',
  },
  successContainer: {
    backgroundColor: '#f0f9f0',
    borderColor: '#065f46',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  helpText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: 'transparent',
  },
  resendButtonDisabled: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  resendButtonText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  resendButtonTextDisabled: {
    color: '#9ca3af',
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeEmailButtonText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  emailAddress: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  resetButton: {
    marginTop: 16,
    backgroundColor: GREEN,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8
  },
  privacyCenterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  privacyCenterContent: {
    flex: 1,
    marginLeft: 12,
  },
  privacyCenterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  privacyCenterDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 16
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    borderWidth: 3,
    borderColor: '#e0f2e0'
  },
  defaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    borderWidth: 3,
    borderColor: '#e0f2e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarButton: {
    marginTop: 10,
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6
  },
  // Email change styles
  emailChangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  emailChangeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 10,
  },
  currentEmailContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currentEmailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  currentEmailText: {
    fontSize: 16,
    color: GREEN,
    fontWeight: '600',
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  verificationInfoText: {
    fontSize: 14,
    color: GREEN,
    marginLeft: 8,
    fontWeight: '500',
  },
  verificationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  // Password change styles
  passwordChangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  passwordChangeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 10,
  },
  passwordChangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  passwordChangeInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  passwordChangeEyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  // Password change specific styles
  passwordErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffb3b3',
  },
  passwordErrorText: {
    fontSize: 14,
    color: '#d63031',
    marginLeft: 8,
    flex: 1,
  },
  passwordSecondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: GREEN,
    flex: 1,
  },
  passwordSuccessContainer: {
    alignItems: 'center',
    padding: 20,
  },
  passwordSuccessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  passwordSuccessText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  // Email change specific styles
  emailErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffb3b3',
  },
  emailErrorText: {
    fontSize: 14,
    color: '#d63031',
    marginLeft: 8,
    flex: 1,
  },
  emailSecondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: GREEN,
    flex: 1,
  },
  emailSuccessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  // Crop Icon Styles
  cropIconAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 20,
    margin: 0,
    height: '100%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  modalCloseButton: {
    padding: 5,
  },
  scrollableGrid: {
    flex: 1,
  },
  cropIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  cropIconItem: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e9ecef',
    padding: 8,
  },
  cropIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cropEmoji: {
    fontSize: 50,
  },
  cropEmojiSmall: {
    fontSize: 28,
  },
  cropIconItemSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  cropIconLabel: {
    fontSize: 10,
    color: GREEN,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  cropIconLabelSelected: {
    color: '#fff',
  }
});


