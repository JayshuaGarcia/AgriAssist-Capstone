import React from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Dimensions, Text } from 'react-native';
import { useRouter } from 'expo-router';

const GREEN = '#16543a';
const BUTTON_GREEN = '#39796b';
const BUTTON_RADIUS = 32;
const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top green rounded rectangle */}
      <View style={styles.topGreen} />
      <View style={styles.container}>
        <Image source={require('../assets/images/Logo 2.png')} style={styles.logoImg} resizeMode="contain" />
        <View style={{ height: 32 }} />
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { marginTop: 24 }]} 
          onPress={() => router.push('/signup')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      {/* Bottom green rounded rectangle */}
      <View style={styles.bottomGreen} />
    </KeyboardAvoidingView>
  );
}

const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  logoImg: {
    width: 220,
    height: 220,
    marginBottom: 0,
  },
  button: {
    width: '100%',
    backgroundColor: BUTTON_GREEN,
    borderRadius: BUTTON_RADIUS,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 0,
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