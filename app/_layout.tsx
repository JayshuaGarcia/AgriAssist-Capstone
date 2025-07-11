import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../components/AuthContext';
import { RecordTypeProvider } from '../components/RecordTypeContext';
import { BarangayProvider, RoleProvider } from '../components/RoleContext';
import '../FirebaseConfig'; // Initialize Firebase

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <RoleProvider>
      <BarangayProvider>
        <RecordTypeProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="role-select" options={{ headerShown: false }} />
                <Stack.Screen name="barangay-select" options={{ headerShown: false }} />
                <Stack.Screen name="barangay-select-records" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </AuthProvider>
        </RecordTypeProvider>
      </BarangayProvider>
    </RoleProvider>
  );
}
