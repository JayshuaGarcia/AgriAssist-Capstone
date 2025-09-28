import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const avatarUri = profile.profileImage ? { uri: profile.profileImage } : require('../assets/images/Logo 2.png');
  const [emailStep, setEmailStep] = React.useState<'idle' | 'code_sent' | 'done'>('idle');
  const [newEmail, setNewEmail] = React.useState('');
  const [inputCode, setInputCode] = React.useState('');
  const [pwCurrent, setPwCurrent] = React.useState('');
  const [pwNew, setPwNew] = React.useState('');
  const [pwConfirm, setPwConfirm] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

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
        <Image source={avatarUri} style={styles.avatar} />
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
              updateProfileImage(asset.uri);
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
                  if (!newEmail) return;
                  setSubmitting(true);
                  try {
                    await requestEmailChange(newEmail);
                    setEmailStep('code_sent');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!newEmail || submitting}
              >
                <Ionicons name="paper-plane" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Send verification code</Text>
              </TouchableOpacity>
            </>
          )}
          {emailStep === 'code_sent' && (
            <>
              <View style={[styles.inputRow, styles.rowBorderTop]}>
                <Text style={styles.inputLabel}>Verification code</Text>
                <TextInput
                  value={inputCode}
                  onChangeText={setInputCode}
                  placeholder="Enter 6-digit code"
                  style={styles.textInput}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                style={[styles.actionButton, (inputCode.length !== 6 || submitting) && styles.actionButtonDisabled]}
                onPress={async () => {
                  if (inputCode.length !== 6) return;
                  setSubmitting(true);
                  try {
                    await confirmEmailChange(inputCode);
                    setEmailStep('done');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={inputCode.length !== 6 || submitting}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Confirm email change</Text>
              </TouchableOpacity>
            </>
          )}
          {emailStep === 'done' && (
            <View style={[styles.inputRow, styles.rowBorderTop]}>
              <Text style={styles.successText}>Email updated successfully.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Change Password</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Current password</Text>
            <TextInput value={pwCurrent} onChangeText={setPwCurrent} placeholder="••••••••" style={styles.textInput} secureTextEntry />
          </View>
          <View style={[styles.inputRow, styles.rowBorderTop]}>
            <Text style={styles.inputLabel}>New password</Text>
            <TextInput value={pwNew} onChangeText={setPwNew} placeholder="At least 8 characters" style={styles.textInput} secureTextEntry />
          </View>
          <View style={[styles.inputRow, styles.rowBorderTop]}>
            <Text style={styles.inputLabel}>Confirm new password</Text>
            <TextInput value={pwConfirm} onChangeText={setPwConfirm} placeholder="Repeat new password" style={styles.textInput} secureTextEntry />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, (pwNew.length < 8 || pwNew !== pwConfirm || submitting) && styles.actionButtonDisabled]}
            onPress={async () => {
              if (pwNew.length < 8 || pwNew !== pwConfirm) return;
              setSubmitting(true);
              try {
                await changePassword(pwCurrent, pwNew);
                setPwCurrent('');
                setPwNew('');
                setPwConfirm('');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={pwNew.length < 8 || pwNew !== pwConfirm || submitting}
          >
            <Ionicons name="lock-closed" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Update password</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Profile Info</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Name/Username</Text>
            <TextInput value={editName} onChangeText={setEditName} placeholder="Your name" style={styles.textInput} />
          </View>
          <View style={[styles.inputRow, styles.rowBorderTop]}>
            <Text style={styles.inputLabel}>Phone number</Text>
            <TextInput value={editPhone} onChangeText={setEditPhone} placeholder="09xx xxx xxxx" style={styles.textInput} keyboardType="phone-pad" />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, (!editName || editPhone.length < 7) && styles.actionButtonDisabled]}
            onPress={() => updateProfile({ name: editName, phone: editPhone })}
            disabled={!editName || editPhone.length < 7}
          >
            <Ionicons name="save" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Save profile</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          <SettingRow
            icon="finger-print"
            label="Biometric unlock"
            description="Use fingerprint/face to unlock"
            value={settings.biometricUnlockEnabled}
            onValueChange={(v) => updateSettings({ biometricUnlockEnabled: v })}
          />
          <SettingRow
            icon="shield-checkmark"
            label="Two-factor authentication"
            description="Extra verification on login"
            value={settings.twoFactorEnabled}
            onValueChange={(v) => updateSettings({ twoFactorEnabled: v })}
            borderTop
          />
          <SettingRow
            icon="phone-portrait"
            label="Remember this device"
            description="Skip verification on this device"
            value={settings.rememberDeviceEnabled}
            onValueChange={(v) => updateSettings({ rememberDeviceEnabled: v })}
            borderTop
          />
        </View>

        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <SettingRow
            icon="analytics"
            label="Share analytics"
            description="Help improve the app anonymously"
            value={settings.shareAnalyticsEnabled}
            onValueChange={(v) => updateSettings({ shareAnalyticsEnabled: v })}
          />
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.resetText}>Reset to defaults</Text>
        </TouchableOpacity>
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
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  successText: {
    color: '#065f46',
    fontWeight: '700',
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
  }
  ,
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


