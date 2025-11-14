import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigationBar } from '../hooks/useNavigationBar';
import { FirebaseAuthService } from '../services/firebaseAuth';

const GREEN = '#16543a';
const BUTTON_GREEN = '#39796b';
const INPUT_GREEN = '#74bfa3';
const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;
const BUTTON_RADIUS = 32;

export default function ResetPasswordScreen() {
  const router = useRouter();
  useNavigationBar();
  const params = useLocalSearchParams<{ mode?: string; oobCode?: string }>();
  const { mode, oobCode } = params;

  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (mode !== 'resetPassword' || !oobCode) {
        setError('Invalid reset link. Please request a new one.');
        return;
      }
      try {
        setLoading(true);
        const linkedEmail = await FirebaseAuthService.verifyResetCode(String(oobCode));
        setEmail(linkedEmail);
      } catch (e: any) {
        setError(e.message || 'Invalid or expired reset link.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [mode, oobCode]);

  const handleConfirmReset = async () => {
    if (!oobCode) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await FirebaseAuthService.confirmResetPassword(String(oobCode), newPassword);
      setSuccess('Password reset successful. You can now log in.');
      Alert.alert('Success', 'Your password has been reset.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (e: any) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 80}
    >
      <View style={styles.topGreen} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.header}>Set New Password</Text>
          {email ? <Text style={styles.subHeader}>For {email}</Text> : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <View style={{ width: '100%' }}>
            <TextInput
              style={[styles.input, styles.passwordInput, { textAlign: 'center', paddingLeft: 24, paddingRight: 48, includeFontPadding: false, textAlignVertical: 'center' }]}
              placeholder="New Password"
              placeholderTextColor={GREEN}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              selectionColor="#16543a"
              cursorColor={newPassword ? "#16543a" : "transparent"}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={24} color={GREEN} />
            </TouchableOpacity>
          </View>

          <View style={{ width: '100%' }}>
            <TextInput
              style={[styles.input, styles.passwordInput, { textAlign: 'center', paddingLeft: 24, paddingRight: 48, includeFontPadding: false, textAlignVertical: 'center' }]}
              placeholder="Confirm New Password"
              placeholderTextColor={GREEN}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              selectionColor="#16543a"
              cursorColor={confirmPassword ? "#16543a" : "transparent"}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color={GREEN} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleConfirmReset}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save New Password'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')}>
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.bottomGreen} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: GREEN,
    marginBottom: 22,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: INPUT_GREEN,
    borderRadius: BUTTON_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 22,
    fontSize: 17,
    color: GREEN,
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  passwordInput: { paddingLeft: 30, paddingRight: 48, textAlign: 'center' },
  eyeIcon: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 2,
    marginTop: -10,
  },
  button: {
    width: '100%',
    backgroundColor: BUTTON_GREEN,
    borderRadius: BUTTON_RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  buttonDisabled: { backgroundColor: '#ccc' },
  backButton: { marginTop: 20, paddingVertical: 8, paddingHorizontal: 16 },
  backButtonText: { color: GREEN, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline', textAlign: 'center' },
  errorText: { color: '#f44336', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  successText: { color: '#4caf50', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  topGreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RECT_HEIGHT,
    backgroundColor: GREEN,
    borderBottomLeftRadius: RECT_RADIUS,
    borderBottomRightRadius: RECT_RADIUS,
    zIndex: 10,
  },
  bottomGreen: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: RECT_HEIGHT,
    backgroundColor: GREEN,
    borderTopLeftRadius: RECT_RADIUS,
    borderTopRightRadius: RECT_RADIUS,
    zIndex: 10,
  },
});



