import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { usePrivacySettings } from '../components/PrivacySettingsContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, resetToDefaults } = usePrivacySettings();
  const [refreshing, setRefreshing] = React.useState(false);
  const { user, profile, updateProfile, requestEmailChange, confirmEmailChange, changePassword, updateProfileImage } = useAuth();
  const [editName, setEditName] = React.useState(profile.name || '');
  const [editPhone, setEditPhone] = React.useState(profile.phone || '');
  const [backupEmail, setBackupEmail] = React.useState(profile.backupEmail || '');
  const avatarUri = profile.profileImage ? { uri: profile.profileImage } : null;
  const [emailStep, setEmailStep] = React.useState<'idle' | 'code_sent' | 'done'>('idle');
  const [newEmail, setNewEmail] = React.useState('');
  const [inputCode, setInputCode] = React.useState('');
  const [pwCurrent, setPwCurrent] = React.useState('');
  const [pwNew, setPwNew] = React.useState('');
  const [pwConfirm, setPwConfirm] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [showAllPasswords, setShowAllPasswords] = React.useState(false);
  const [updatingUsername, setUpdatingUsername] = React.useState(false);
  const [updatingPhone, setUpdatingPhone] = React.useState(false);
  const [updatingBackupEmail, setUpdatingBackupEmail] = React.useState(false);
  const [usernameSuccess, setUsernameSuccess] = React.useState(false);
  const [phoneSuccess, setPhoneSuccess] = React.useState(false);
  const [backupEmailSuccess, setBackupEmailSuccess] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  const [emailSuccess, setEmailSuccess] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resending, setResending] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState('');
  
  // Password state management
  const [passwordMismatchError, setPasswordMismatchError] = React.useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // Handle resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Remove real-time validation to prevent persistent errors
  // Errors will only show when user submits the form

  // Resend verification code function
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending || !newEmail) return;
    
    setResending(true);
    setEmailError('');
    setEmailSuccess(false);
    
    try {
      const code = await requestEmailChange(newEmail);
      setEmailSuccess(true);
      setResendCooldown(60); // 60 second cooldown
      console.log('Verification code resent! Demo code:', code);
    } catch (error) {
      console.error('Error resending verification:', error);
      setEmailError(error instanceof Error ? error.message : 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  // Reset cooldown when going back to email input
  const resetEmailFlow = () => {
    setEmailStep('idle');
    setNewEmail('');
    setInputCode('');
    setEmailError('');
    setEmailSuccess(false);
    setResendCooldown(0);
    setResending(false);
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
        {avatarUri ? (
          <Image source={avatarUri} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Ionicons name="person" size={60} color={GREEN} />
          </View>
        )}
        <TouchableOpacity style={styles.avatarButton} onPress={async () => {
          try {
            const res: any = await DocumentPicker.getDocumentAsync({
              type: ['image/*'],
              multiple: false,
              copyToCacheDirectory: true
            });
            const didSelect = (res.canceled === false) || (res.type === 'success');
            const asset = res.assets && res.assets[0];
            if (didSelect && asset && asset.uri) {
              // Show confirmation dialog before changing photo
              Alert.alert(
                'Change Profile Photo',
                'Are you sure you want to change your profile photo?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Change Photo',
                    style: 'default',
                    onPress: () => {
                      updateProfileImage(asset.uri);
                    },
                  },
                ],
                { cancelable: true }
              );
            }
          } catch (e) {
            // ignore picker cancel/errors
          }
        }}>
          <Ionicons name="camera" size={18} color="#fff" />
          <Text style={styles.avatarButtonText}>Change photo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} tintColor={GREEN} />}>
        <Text style={styles.sectionTitle}>Account Email</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Current email</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyText}>{user?.email || '—'}</Text>
            </View>
          </View>
          {emailStep === 'idle' && (
            <>
              <View style={[styles.inputRow, styles.rowBorderTop]}>
                <Text style={styles.inputLabel}>New email</Text>
                <TextInput
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="name@example.com"
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity
                style={[styles.actionButton, (!newEmail || submitting) && styles.actionButtonDisabled]}
                onPress={async () => {
                  if (!newEmail || submitting) return;
                  setSubmitting(true);
                  setEmailError('');
                  setEmailSuccess(false);
                  try {
                    const code = await requestEmailChange(newEmail);
                    setEmailStep('code_sent');
                    setEmailSuccess(true);
                    setResendCooldown(60); // 60 second cooldown
                    console.log('Verification code sent! Demo code:', code);
                  } catch (error) {
                    console.error('Error sending verification:', error);
                    setEmailError(error instanceof Error ? error.message : 'Failed to send verification code');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!newEmail || submitting}
              >
                <Ionicons name={emailSuccess ? "checkmark" : "paper-plane"} size={18} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {submitting ? "Sending..." : emailSuccess ? "Code Sent!" : "Send verification code"}
                </Text>
              </TouchableOpacity>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </>
          )}
          {emailStep === 'code_sent' && (
            <>
              <View style={[styles.inputRow, styles.rowBorderTop]}>
                <Text style={styles.inputLabel}>Verification code sent to your current email</Text>
                <Text style={styles.emailAddress}>Changing to: {newEmail}</Text>
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Enter 6-digit code</Text>
                <TextInput
                  value={inputCode}
                  onChangeText={setInputCode}
                  placeholder="Enter 6-digit code"
                  style={styles.textInput}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Current password (required for email change)</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    value={pwCurrent}
                    onChangeText={setPwCurrent}
                    placeholder="Enter your current password"
                    style={styles.passwordInput}
                    secureTextEntry={!showCurrentPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Ionicons
                      name={showCurrentPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.helpText}>
                A verification code has been sent to your current email address. Enter the code and your current password to confirm the email change.
              </Text>
              
              {/* Change Email Button */}
              <TouchableOpacity
                style={styles.changeEmailButton}
                onPress={resetEmailFlow}
              >
                <Ionicons name="mail-outline" size={16} color="#6b7280" />
                <Text style={styles.changeEmailButtonText}>Change Email Address</Text>
              </TouchableOpacity>
              
              {/* Resend Button */}
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (resendCooldown > 0 || resending) && styles.resendButtonDisabled
                ]}
                onPress={handleResendCode}
                disabled={resendCooldown > 0 || resending}
              >
                <Ionicons 
                  name={resending ? "refresh" : "refresh-outline"} 
                  size={16} 
                  color={resendCooldown > 0 ? "#9ca3af" : GREEN} 
                />
                <Text style={[
                  styles.resendButtonText,
                  resendCooldown > 0 && styles.resendButtonTextDisabled
                ]}>
                  {resending 
                    ? "Resending..." 
                    : resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s` 
                      : "Resend Code"
                  }
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, (inputCode.length !== 6 || !pwCurrent || submitting) && styles.actionButtonDisabled]}
                onPress={async () => {
                  if (inputCode.length !== 6 || !pwCurrent || submitting) return;
                  setSubmitting(true);
                  setEmailError('');
                  try {
                    await confirmEmailChange(inputCode, pwCurrent);
                    setEmailStep('done');
                    setEmailSuccess(true);
                    setNewEmail('');
                    setInputCode('');
                    setPwCurrent('');
                  } catch (error) {
                    console.error('Error confirming email change:', error);
                    setEmailError(error instanceof Error ? error.message : 'Failed to confirm email change');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={inputCode.length !== 6 || !pwCurrent || submitting}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {submitting ? "Confirming..." : "Confirm email change"}
                </Text>
              </TouchableOpacity>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </>
          )}
          {emailStep === 'done' && (
            <View style={[styles.inputRow, styles.rowBorderTop]}>
              <Text style={styles.successText}>Email change completed!</Text>
              <Text style={styles.helpText}>
                Your account has been completely transferred to the new email address. You can now login using your new email address: {newEmail}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Change Password</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Current password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput 
                value={pwCurrent} 
                onChangeText={(text) => {
                  setPwCurrent(text);
                  // Clear password error when user starts typing
                  if (passwordError) {
                    setPasswordError('');
                  }
                  // Reset submit attempt flag
                  setHasAttemptedSubmit(false);
                }}
                placeholder="••••••••" 
                style={styles.passwordInput} 
                secureTextEntry={!showAllPasswords} 
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowAllPasswords(!showAllPasswords)}
              >
                <Ionicons 
                  name={showAllPasswords ? "eye-off" : "eye"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.inputRow, styles.rowBorderTop]}>
            <Text style={styles.inputLabel}>New password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput 
                value={pwNew} 
                onChangeText={(text) => {
                  setPwNew(text);
                  // Clear password error when user starts typing
                  if (passwordError) {
                    setPasswordError('');
                  }
                  // Reset submit attempt flag
                  setHasAttemptedSubmit(false);
                }}
                placeholder="At least 8 characters" 
                style={styles.passwordInput} 
                secureTextEntry={!showAllPasswords} 
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowAllPasswords(!showAllPasswords)}
              >
                <Ionicons 
                  name={showAllPasswords ? "eye-off" : "eye"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.inputRow, styles.rowBorderTop]}>
            <Text style={styles.inputLabel}>Confirm new password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput 
                value={pwConfirm} 
                onChangeText={(text) => {
                  setPwConfirm(text);
                  // Clear password error when user starts typing
                  if (passwordError) {
                    setPasswordError('');
                  }
                  // Reset submit attempt flag
                  setHasAttemptedSubmit(false);
                }}
                placeholder="Repeat new password" 
                style={styles.passwordInput} 
                secureTextEntry={!showAllPasswords} 
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowAllPasswords(!showAllPasswords)}
              >
                <Ionicons 
                  name={showAllPasswords ? "eye-off" : "eye"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Password Mismatch Error */}
          {passwordMismatchError ? (
            <View style={[styles.inputRow, styles.rowBorderTop]}>
              <Text style={styles.errorText}>{passwordMismatchError}</Text>
            </View>
          ) : null}
          
          {/* Password Change Error */}
          {passwordError ? (
            <View style={[styles.inputRow, styles.rowBorderTop]}>
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          ) : null}
          

          <TouchableOpacity
            style={[
              styles.actionButton, 
              passwordSuccess && styles.actionButtonSuccess,
              !passwordSuccess && (pwCurrent.length < 1 || pwNew.length < 8 || pwNew !== pwConfirm || submitting) && styles.actionButtonDisabled
            ]}
            onPress={async () => {
              // Mark that user has attempted to submit
              setHasAttemptedSubmit(true);
              
              // Clear previous errors and success messages
              setPasswordError('');
              setPasswordMismatchError('');
              setPasswordSuccess(false);
              
              // Validate password match first
              if (pwNew !== pwConfirm) {
                setPasswordMismatchError('❌ New password and confirm password do not match');
                return;
              }
              
              // Validate required fields
              if (pwCurrent.length < 1) {
                setPasswordError('❌ Please enter your current password');
                return;
              }
              
              if (pwNew.length < 8) {
                setPasswordError('❌ New password must be at least 8 characters');
                return;
              }
              
              setSubmitting(true);
              try {
                await changePassword(pwCurrent, pwNew);
                // Clear all fields on success
                setPwCurrent('');
                setPwNew('');
                setPwConfirm('');
                setPasswordSuccess(true);
                setHasAttemptedSubmit(false);
                // Clear success message after 4 seconds
                setTimeout(() => {
                  setPasswordSuccess(false);
                }, 4000);
              } catch (error: any) {
                // Show specific error message for wrong password
                if (error.message && (error.message.includes('incorrect') || error.message.includes('Current password'))) {
                  const errorMsg = '❌ Incorrect or invalid password. Please check and try again.';
                  setPasswordError(errorMsg);
                } else {
                  const errorMsg = '❌ Failed to change password. Please try again.';
                  setPasswordError(errorMsg);
                }
                // Clear error message after 6 seconds
                setTimeout(() => {
                  setPasswordError('');
                }, 6000);
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!passwordSuccess && (pwCurrent.length < 1 || pwNew.length < 8 || pwNew !== pwConfirm || submitting)}
          >
            <Ionicons name={passwordSuccess ? "checkmark" : "lock-closed"} size={18} color="#fff" />
            <Text style={styles.actionButtonText}>{passwordSuccess ? 'Updated' : 'Update password'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Profile Info</Text>
        
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
  }
});


