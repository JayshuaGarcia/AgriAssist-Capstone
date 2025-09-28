import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../components/AuthContext';
// import { ErrorBoundary } from '../components/ErrorBoundary';
import { NotificationSettingsProvider } from '../components/NotificationSettingsContext';
import { PrivacySettingsProvider } from '../components/PrivacySettingsContext';
import { SearchProvider } from '../components/SearchContext';

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
    <AuthProvider>
      <SearchProvider>
        <NotificationSettingsProvider>
          <PrivacySettingsProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="help" options={{ headerShown: false }} />
              <Stack.Screen name="privacy" options={{ headerShown: false }} />
              <Stack.Screen name="about" options={{ headerShown: false }} />
              <Stack.Screen name="language" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="feature-placeholder" options={{ headerShown: false }} />
              <Stack.Screen name="price-monitoring" options={{ headerShown: false }} />
              <Stack.Screen name="planting-report" options={{ headerShown: false }} />
              <Stack.Screen name="harvest-report" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
          </PrivacySettingsProvider>
        </NotificationSettingsProvider>
      </SearchProvider>
    </AuthProvider>
  );
}
