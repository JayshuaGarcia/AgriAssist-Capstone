import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { useNavigationBar } from '../hooks/useNavigationBar';

const GREEN = '#16543a';
const BUTTON_GREEN = '#39796b';
const INPUT_GREEN = '#74bfa3';
const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;
const BUTTON_RADIUS = 32;
const REMEMBER_ME_KEY = '@agriassist/rememberMe';
const REMEMBERED_EMAIL_KEY = '@agriassist/rememberedEmail';
const REMEMBERED_PASSWORD_KEY = '@agriassist/rememberedPassword';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, forgotPassword, loading } = useAuth();
  
  // Load remembered credentials on mount
  useEffect(() => {
    let isMounted = true;
    const loadRemembered = async () => {
      try {
        const [remember, storedEmail, storedPassword] = await Promise.all([
          AsyncStorage.getItem(REMEMBER_ME_KEY),
          AsyncStorage.getItem(REMEMBERED_EMAIL_KEY),
          AsyncStorage.getItem(REMEMBERED_PASSWORD_KEY),
        ]);

        if (!isMounted) return;

        if (remember === 'true') {
          setRememberMe(true);
          if (storedEmail) {
            setEmail(storedEmail);
          }
          if (storedPassword) {
            setPassword(storedPassword);
          }
        }
      } catch (e) {
        console.log('Failed to load remembered login info', e);
      }
    };

    loadRemembered();

    return () => {
      isMounted = false;
    };
  }, []);

  // Debug logging
  console.log('Login screen - loading state:', loading);
  
  // Hide the Android navigation bar
  useNavigationBar();
  const router = useRouter();

  const handleLogin = async () => {
    console.log('handleLogin called');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Normalize inputs in state to avoid accidental whitespace re-entry
    if (trimmedEmail !== email) setEmail(trimmedEmail);
    if (trimmedPassword !== password) setPassword(trimmedPassword);

    setError('');

    try {
      console.log('Attempting login with:', trimmedEmail, '********');
      // Check for admin credentials
      if ((trimmedEmail === 'AAadmin' || trimmedEmail === 'agriassistme@gmail.com') && trimmedPassword === 'AAadmin') {
        console.log('Admin login detected');
        // Call login to set admin user state - AuthContext will handle navigation
        await login(trimmedEmail, trimmedPassword, 'admin');
        return;
      }

      console.log('Regular user login');
      await login(trimmedEmail, trimmedPassword, 'Farmer');

      // Handle Remember Me preference and credentials
      try {
        if (rememberMe) {
          await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
          await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
          await AsyncStorage.setItem(REMEMBERED_PASSWORD_KEY, trimmedPassword);
        } else {
          await AsyncStorage.removeItem(REMEMBER_ME_KEY);
          await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
          await AsyncStorage.removeItem(REMEMBERED_PASSWORD_KEY);
        }
      } catch (storageErr) {
        console.log('Error saving remember-me preference:', storageErr);
      }

      // After login, check if user already accepted terms
      try {
        const emailKey = trimmedEmail.toLowerCase();
        const termsKey = `termsAccepted_${emailKey}`;
        const formsKey = `farmerFormsCompleted_${emailKey}`;

        const [accepted, formsCompleted] = await Promise.all([
          AsyncStorage.getItem(termsKey),
          AsyncStorage.getItem(formsKey),
        ]);

        if (accepted === 'true') {
          // If forms are already completed, go straight to main tabs (home)
          if (formsCompleted === 'true') {
            router.replace('/(tabs)');
          } else {
            // Terms accepted but forms not finished yet → go to farmer form
            router.replace('/farmers');
          }
        } else {
          // Show terms and conditions first
          router.replace(
            `/terms-and-conditions?email=${encodeURIComponent(emailKey)}`
          );
        }
      } catch (storageError) {
        console.log('Error checking terms/forms completion:', storageError);
        // If anything goes wrong, still allow user to proceed to farmer form
        router.replace('/farmers');
      }
    } catch (error: any) {
      console.log('Login error:', error);
      setError(error?.message || 'Something went wrong while logging in.');
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
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
          <Text style={styles.header}>Login</Text>
          <Text style={styles.subHeader}>Sign in to continue</Text>
          
          {/* Remove barangay selection for all users */}
          <TextInput
            style={[styles.input, { 
              textAlign: 'center', 
              paddingLeft: 24, 
              paddingRight: 24,
              includeFontPadding: false,
              textAlignVertical: 'center'
            }]}
            placeholder="Email"
            placeholderTextColor={GREEN}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor="#16543a"
            cursorColor={email ? "#16543a" : "transparent"}
          />
          <View style={{width: '100%'}}>
            <TextInput
              style={[styles.input, styles.passwordInput, { 
                textAlign: 'center', 
                paddingLeft: 48, 
                paddingRight: 48,
                includeFontPadding: false,
                textAlignVertical: 'center'
              }]}
              placeholder="Password"
              placeholderTextColor={GREEN}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              selectionColor="#16543a"
              cursorColor={password ? "#16543a" : "transparent"}
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
          
          {/* Remember Me */}
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={rememberMe ? 'checkbox' : 'square-outline'}
              size={22}
              color={GREEN}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.rememberMeText}>Remember me</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin} 
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging In...' : 'Log In'}
            </Text>
          </TouchableOpacity>
          
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't Have an Account yet? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupLink}>Sign Up Here.</Text>
            </TouchableOpacity>
          </View>

          {/* PUP Branding at the bottom of the screen content */}
          <View style={styles.pupBrandingContainer}>
            <Image
              source={require('../assets/images/PUP LOGO.png')}
              style={styles.pupLogo}
              resizeMode="contain"
            />
            <Text style={styles.pupBrandingText}>
              This project is made by BSIT 4 PUP Lopez Students
            </Text>
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
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginLeft: 8,
  },
  rememberMeText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '500',
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
    width: 120,
    height: 120,
    marginBottom: 10,
    marginTop: 16,
  },
  pupBrandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  pupLogo: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  pupBrandingText: {
    fontSize: 12,
    color: GREEN,
    textAlign: 'center',
  },
  header: {
    fontSize: 32,
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
    textAlignVertical: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: INPUT_GREEN,
    borderRadius: BUTTON_RADIUS,
    marginBottom: 18,
  },
  passwordInput: {
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotPasswordText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '400',
    textDecorationLine: 'underline',
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
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signupText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '400',
  },
  signupLink: {
    color: GREEN,
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  adminLink: {
    marginTop: 20,
    marginBottom: -40,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  adminText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  adminLinkBottom: {
    position: 'absolute',
    bottom: RECT_HEIGHT + 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  adminTextBottom: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  barangayIndicator: {
    backgroundColor: INPUT_GREEN,
    borderRadius: BUTTON_RADIUS,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 18,
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 3,
  },
  barangayText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  changeBarangayButton: {
    backgroundColor: BUTTON_GREEN,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  changeBarangayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
