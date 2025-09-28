import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { useAnnouncements } from './AnnouncementContext';

interface SlidingAnnouncementProps {
  style?: any;
}

export const SlidingAnnouncement: React.FC<SlidingAnnouncementProps> = ({ style }) => {
  const { announcements } = useAnnouncements();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  
  // Get only the latest announcement
  const latestAnnouncement = announcements.length > 0 ? announcements[0] : {
    id: 'fallback',
    title: 'Welcome to AgriAssist',
    content: 'Your agricultural management system is ready to help you!',
    icon: 'megaphone',
    date: new Date().toISOString(),
    timestamp: Date.now(),
    createdBy: 'system',
    createdAt: new Date()
  };

  useEffect(() => {
    const screenWidth = Dimensions.get('window').width;
    
    // Simple sliding animation from right to left
    const startAnimation = () => {
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -screenWidth * 2,
          duration: 18000,
          useNativeDriver: true,
        })
      ).start();
    };
    
    scrollAnim.setValue(screenWidth);
    startAnimation();
    
    return () => {
      scrollAnim.stopAnimation();
    };
  }, [scrollAnim]);

  if (!latestAnnouncement) {
    return null;
  }

  return (
    <View style={[{
      height: 50,
      overflow: 'hidden',
      backgroundColor: '#16543a',
      width: '100%',
      marginBottom: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    }, style]}>
      {/* Fixed icon on the left */}
      <View style={{
        paddingLeft: 15,
        paddingRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Ionicons 
          name={latestAnnouncement.icon as any || "megaphone"} 
          size={20} 
          color="white" 
        />
      </View>
      
      {/* Sliding text area */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View
          style={{
            transform: [{ translateX: scrollAnim }],
            flexDirection: 'row',
            alignItems: 'center',
            height: '100%',
            paddingRight: 20,
            minWidth: '200%',
          }}
        >
          <Text 
            style={{
              color: 'white',
              fontSize: 12,
              fontWeight: 'bold',
              flexShrink: 0,
            }}
            numberOfLines={1}
          >
            {latestAnnouncement.content}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};