import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

const GREEN = '#16543a';

export const useNavigationBar = (size: 'hidden' | 'minimal' | 'normal' = 'hidden') => {
  useEffect(() => {
    const configureNavigationBar = async () => {
      if (Platform.OS !== 'android') return;
      
      try {
        // Hide status bar first
        StatusBar.setHidden(true, 'fade');
        
        switch (size) {
          case 'hidden':
            // Completely hide the navigation bar and make it transparent
            await NavigationBar.setVisibilityAsync('hidden');
            break;
          case 'minimal':
            // Minimal navigation bar
            await NavigationBar.setVisibilityAsync('visible');
            break;
          case 'normal':
            // Normal navigation bar
            await NavigationBar.setVisibilityAsync('visible');
            break;
        }
        
        // Set system UI background to transparent
        await SystemUI.setBackgroundColorAsync('transparent');
        
        // Additional attempts to ensure it's hidden
        setTimeout(async () => {
          try {
            await NavigationBar.setVisibilityAsync('hidden');
          } catch (e) {
            console.log('Secondary hide attempt failed');
          }
        }, 500);
        
      } catch (error) {
        console.log('Navigation bar configuration not supported on this device');
        // Fallback: Try to set transparent background
        try {
          await SystemUI.setBackgroundColorAsync('transparent');
        } catch (fallbackError) {
          console.log('SystemUI configuration also not supported');
        }
      }
    };

    configureNavigationBar();
  }, [size]);
};

export const hideNavigationBar = async () => {
  try {
    await NavigationBar.setVisibilityAsync('hidden');
    await SystemUI.setBackgroundColorAsync('transparent');
  } catch (error) {
    console.log('Navigation bar configuration failed:', error);
  }
};

// Force hide navigation bar completely
export const forceHideNavigationBar = async () => {
  try {
    // Hide status bar
    StatusBar.setHidden(true, 'fade');
    
    // Multiple attempts to ensure it's hidden
    await NavigationBar.setVisibilityAsync('hidden');
    
    // Set system UI to transparent
    await SystemUI.setBackgroundColorAsync('transparent');
    
    // Multiple delayed attempts to ensure it stays hidden
    setTimeout(async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
        StatusBar.setHidden(true, 'fade');
      } catch (e) {
        console.log('Secondary navigation bar hide attempt failed');
      }
    }, 100);
    
    setTimeout(async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
        StatusBar.setHidden(true, 'fade');
      } catch (e) {
        console.log('Tertiary navigation bar hide attempt failed');
      }
    }, 1000);
    
  } catch (error) {
    console.log('Force hide navigation bar failed:', error);
  }
};
