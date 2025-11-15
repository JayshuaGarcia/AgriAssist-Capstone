import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { useAuth } from '../components/AuthContext';

const GREEN = '#16543a';
const BUTTON_GREEN = '#39796b';
const BUTTON_RADIUS = 32;
const { width } = Dimensions.get('window');

const REMEMBER_ME_KEY = '@agriassist/rememberMe';

export default function LandingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    let isMounted = true;

    const decideNavigation = async () => {
      try {
        const remember = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        if (!isMounted) return;

        if (remember === 'true' && user) {
          // If the user is already authenticated and chose Remember Me,
          // send them directly to the main app.
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      } catch (e) {
        console.log('Error deciding initial navigation:', e);
        router.replace('/login');
      }
    };

    // Small delay to ensure router & context are ready
    const timer = setTimeout(() => {
      decideNavigation();
    }, 150);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [router, user]);

  // Return a minimal loading view instead of null
  return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
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