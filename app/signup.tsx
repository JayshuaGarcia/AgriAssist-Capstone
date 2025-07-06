import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';

const GREEN = '#16543a';
const BUTTON_GREEN = '#39796b';
const INPUT_GREEN = '#74bfa3';
const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;
const BUTTON_RADIUS = 32;

export default function SignupScreen() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { signup, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup(email, password, name);
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
          <Image source={require('../assets/images/Logo 2.png')} style={styles.logoImg} resizeMode="contain" />
          <Text style={styles.header}>Create{"\n"}New Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={GREEN}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={GREEN}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={GREEN}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
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
  logoImg: {
    width: 120,
    height: 120,
    marginBottom: 10,
    marginTop: 16,
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