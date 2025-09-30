import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { useNavigationBar } from '../hooks/useNavigationBar';

const GREEN = '#16543a';
const BUTTON_GREEN = '#39796b';
const INPUT_GREEN = '#74bfa3';
const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;
const BUTTON_RADIUS = 32;

type ForgotPasswordStep = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const [step, setStep] = React.useState<ForgotPasswordStep>('email');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const { forgotPassword, resetPasswordWithCode, verifyPasswordResetCode, loading: authLoading } = useAuth();
  
  // Hide the Android navigation bar
  useNavigationBar();
  const router = useRouter();

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await forgotPassword(email);
      setSuccess('Verification code sent to your email!');
      setStep('code');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verify the code without resetting the password yet
      await verifyPasswordResetCode(email, code);
      setSuccess('Code verified! Please enter your new password.');
      setStep('password');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resetPasswordWithCode(email, code, newPassword);
      setSuccess('Password reset successfully! You can now login with your new password.');
      
      // Show success alert and navigate back to login
      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await forgotPassword(email);
      setSuccess('New verification code sent to your email!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.stepTitle}>Enter Your Email</Text>
      <Text style={styles.stepDescription}>
        Enter the email address associated with your account. We'll send you a verification code.
      </Text>
      
      <TextInput
        style={[styles.input, { textAlign: 'center' }]}
        placeholder="Email Address"
        placeholderTextColor={GREEN}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoFocus
      />

      <TouchableOpacity 
        style={[styles.button, (loading || authLoading) && styles.buttonDisabled]} 
        onPress={handleSendCode} 
        activeOpacity={0.85}
        disabled={loading || authLoading}
      >
        <Text style={styles.buttonText}>
          {loading || authLoading ? 'Sending...' : 'Send Verification Code'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderCodeStep = () => (
    <>
      <Text style={styles.stepTitle}>Enter Verification Code</Text>
      <Text style={styles.stepDescription}>
        We've sent a 6-digit verification code to {email}. Please enter it below. The code will expire in 30 minutes.
      </Text>
      
      <TextInput
        style={[styles.input, { textAlign: 'center' }]}
        placeholder="000000"
        placeholderTextColor={GREEN}
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        maxLength={6}
        autoFocus
      />

      <TouchableOpacity 
        style={[styles.button, (loading || authLoading) && styles.buttonDisabled]} 
        onPress={handleVerifyCode} 
        activeOpacity={0.85}
        disabled={loading || authLoading}
      >
        <Text style={styles.buttonText}>
          {loading || authLoading ? 'Verifying...' : 'Verify Code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.resendButton}
        onPress={handleResendCode}
        disabled={loading || authLoading}
      >
        <Text style={styles.resendButtonText}>Resend Code</Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <Text style={styles.stepTitle}>Set New Password</Text>
      <Text style={styles.stepDescription}>
        Enter your new password. Make sure it's at least 6 characters long.
      </Text>
      
      <View style={{width: '100%'}}>
        <TextInput
          style={[styles.input, styles.passwordInput, { textAlign: 'center' }]}
          placeholder="New Password"
          placeholderTextColor={GREEN}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          autoFocus
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowNewPassword(!showNewPassword)}
        >
          <Ionicons
            name={showNewPassword ? 'eye-off' : 'eye'}
            size={24}
            color={GREEN}
          />
        </TouchableOpacity>
      </View>

      <View style={{width: '100%'}}>
        <TextInput
          style={[styles.input, styles.passwordInput, { textAlign: 'center' }]}
          placeholder="Confirm New Password"
          placeholderTextColor={GREEN}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? 'eye-off' : 'eye'}
            size={24}
            color={GREEN}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, (loading || authLoading) && styles.buttonDisabled]} 
        onPress={handleResetPassword} 
        activeOpacity={0.85}
        disabled={loading || authLoading}
      >
        <Text style={styles.buttonText}>
          {loading || authLoading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const getStepIndicator = () => {
    const steps = ['Email', 'Code', 'Password'];
    const currentStepIndex = steps.findIndex(s => s.toLowerCase() === step);
    
    return (
      <View style={styles.stepIndicator}>
        {steps.map((stepName, index) => (
          <View key={stepName} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= currentStepIndex ? styles.stepCircleActive : styles.stepCircleInactive
            ]}>
              <Text style={[
                styles.stepNumber,
                index <= currentStepIndex ? styles.stepNumberActive : styles.stepNumberInactive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              index <= currentStepIndex ? styles.stepLabelActive : styles.stepLabelInactive
            ]}>
              {stepName}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 80}
    >
      {/* Top green rounded rectangle */}
      <View style={styles.topGreen} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Image source={require('../assets/images/Logo.png')} style={styles.logoImg} resizeMode="contain" />
          <Text style={styles.header}>Reset Password</Text>
          <Text style={styles.subHeader}>Follow the steps to reset your password</Text>
          
          {getStepIndicator()}

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {success ? (
            <Text style={styles.successText}>{success}</Text>
          ) : null}

          {step === 'email' && renderEmailStep()}
          {step === 'code' && renderCodeStep()}
          {step === 'password' && renderPasswordStep()}

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Bottom green rounded rectangle */}
      <View style={styles.bottomGreen} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  logoImg: {
    width: 100,
    height: 100,
    marginBottom: 10,
    marginTop: 16,
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: BUTTON_GREEN,
  },
  stepCircleInactive: {
    backgroundColor: '#e0e0e0',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepNumberInactive: {
    color: '#999',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: GREEN,
    fontWeight: '600',
  },
  stepLabelInactive: {
    color: '#999',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
  passwordInput: {
    paddingLeft: 30,
    paddingRight: 48,
    textAlign: 'center',
  },
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
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  resendButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    color: '#4caf50',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
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
