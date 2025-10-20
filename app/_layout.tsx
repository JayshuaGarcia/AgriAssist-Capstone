import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
// import 'react-native-reanimated'; // Temporarily disabled to avoid Worklets version mismatch

import { useColorScheme } from '@/hooks/useColorScheme';
import { forceFullScreen, useFullScreen } from '@/hooks/useFullScreen';
import { forceHideNavigationBar, useNavigationBar } from '@/hooks/useNavigationBar';
import { AnnouncementProvider } from '../components/AnnouncementContext';
import { AuthProvider } from '../components/AuthContext';
import { NotificationProvider } from '../components/NotificationContext';
// import { ErrorBoundary } from '../components/ErrorBoundary';
import { NotificationSettingsProvider } from '../components/NotificationSettingsContext';
import { PrivacySettingsProvider } from '../components/PrivacySettingsContext';
import { SearchProvider } from '../components/SearchContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Hide the Android navigation bar completely
  useNavigationBar('hidden');
  useFullScreen();
  
  // Force hide navigation bar on app start
  useEffect(() => {
    forceHideNavigationBar();
    forceFullScreen();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <AnnouncementProvider>
          <SearchProvider>
            <NotificationSettingsProvider>
              <PrivacySettingsProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="help" options={{ headerShown: false }} />
                <Stack.Screen name="privacy" options={{ headerShown: false }} />
                <Stack.Screen name="about" options={{ headerShown: false }} />
                <Stack.Screen name="language" options={{ headerShown: false }} />
                <Stack.Screen name="admin" options={{ headerShown: false }} />
                <Stack.Screen name="admin-chat" options={{ headerShown: false }} />
                <Stack.Screen name="admin-pdf-data" options={{ headerShown: false }} />
                <Stack.Screen name="user-chat" options={{ headerShown: false }} />
                <Stack.Screen name="feature-placeholder" options={{ headerShown: false }} />
                <Stack.Screen name="planting-report" options={{ headerShown: false }} />
                <Stack.Screen name="harvest-report" options={{ headerShown: false }} />
                <Stack.Screen name="harvest-view-reports" options={{ headerShown: false }} />
                <Stack.Screen name="commodity-analytics" options={{ headerShown: false }} />
                <Stack.Screen name="ml-predictions" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
              </ThemeProvider>
            </PrivacySettingsProvider>
          </NotificationSettingsProvider>
        </SearchProvider>
      </AnnouncementProvider>
    </NotificationProvider>
  </AuthProvider>
  );
}
