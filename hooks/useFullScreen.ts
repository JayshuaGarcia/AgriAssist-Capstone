import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

export const useFullScreen = () => {
  useEffect(() => {
    const enableFullScreen = async () => {
      if (Platform.OS !== 'android') return;
      
      try {
        // Hide status bar
        StatusBar.setHidden(true, 'fade');
        
        // Hide navigation bar completely
        await NavigationBar.setVisibilityAsync('hidden');
        
        // Set system UI to transparent
        await SystemUI.setBackgroundColorAsync('transparent');
        
        // Force hide with multiple attempts
        const hideNavigationBar = async () => {
          try {
            await NavigationBar.setVisibilityAsync('hidden');
            StatusBar.setHidden(true, 'fade');
          } catch (error) {
            console.log('Navigation bar hide attempt failed:', error);
          }
        };
        
        // Multiple attempts with different delays
        setTimeout(hideNavigationBar, 100);
        setTimeout(hideNavigationBar, 500);
        setTimeout(hideNavigationBar, 1000);
        setTimeout(hideNavigationBar, 2000);
        
      } catch (error) {
        console.log('Full screen configuration failed:', error);
      }
    };

    enableFullScreen();
  }, []);
};

export const forceFullScreen = async () => {
  if (Platform.OS !== 'android') return;
  
  try {
    // Hide status bar
    StatusBar.setHidden(true, 'fade');
    
    // Hide navigation bar
    await NavigationBar.setVisibilityAsync('hidden');
    
    // Set system UI to transparent
    await SystemUI.setBackgroundColorAsync('transparent');
    
    // Multiple attempts
    for (let i = 0; i < 5; i++) {
      setTimeout(async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          StatusBar.setHidden(true, 'fade');
        } catch (error) {
          console.log(`Hide attempt ${i + 1} failed:`, error);
        }
      }, i * 200);
    }
    
  } catch (error) {
    console.log('Force full screen failed:', error);
  }
};
