import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';

const GREEN = '#16543a';
const INPUT_GREEN = '#f0f8f0';
const BUTTON_GREEN = '#39796b';
const WHITE = '#ffffff';
const BUTTON_RADIUS = 32;
const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;

export default function SignupScreen() {
  const router = useRouter();
  const { signup, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup(email, password, name, 'Farmer', '');
      router.replace('/farmers'); // Always go to farmer fill up form after signup
    } catch (error: any) {
      setError(error.message);
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
      {/* Top green rounded rectangle */}
      <View style={styles.topGreen} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.logoImgContainer}>
            <View style={styles.logoImgWrapper}>
              <Image source={require('../assets/images/Logo.png')} style={styles.logoImg} resizeMode="contain" />
            </View>
          </View>
          <Text style={styles.header}>Create{"\n"}New Account</Text>
          <TextInput
            style={[styles.input, { textAlign: 'center' }]}
            placeholder="Name"
            placeholderTextColor={GREEN}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={[styles.input, { textAlign: 'center' }]}
            placeholder="Email"
            placeholderTextColor={GREEN}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={{width: '100%'}}>
            <TextInput
              style={[styles.input, styles.passwordInput, { textAlign: 'center' }]}
              placeholder="Password"
              placeholderTextColor={GREEN}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color={GREEN}
              />
            </TouchableOpacity>
          </View>
          
          <View style={{width: '100%'}}>
            <TextInput
              style={[styles.input, styles.passwordInput, { textAlign: 'center' }]}
              placeholder="Confirm Password"
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
          
          {/* Remove barangay selection section */}
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <TouchableOpacity 
            style={[styles.button, (loading || authLoading) && styles.buttonDisabled]} 
            onPress={handleSignup} 
            activeOpacity={0.85}
            disabled={loading || authLoading}
          >
            <Text style={styles.buttonText}>
              {loading || authLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an Account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Login Here.</Text>
            </TouchableOpacity>
          </View>
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
  logoImgContainer: {
    width: 120,
    height: 120,
    marginBottom: 10,
    marginTop: 16,
  },
  logoImgWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 12,
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 36,
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
    paddingRight: 48, // extra space for eye icon
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
    marginTop: -10, // raised higher for better alignment
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
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '400',
  },
  loginLink: {
    color: GREEN,
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  inputText: {
    fontSize: 17,
    color: GREEN,
    textAlign: 'center',
    fontWeight: '500',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 320,
    left: 24,
    right: 24,
    backgroundColor: WHITE,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1,
    borderColor: INPUT_GREEN,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 17,
    color: GREEN,
    textAlign: 'center',
    fontWeight: '500',
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