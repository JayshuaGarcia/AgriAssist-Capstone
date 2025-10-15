import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { useAnnouncements } from './AnnouncementContext';

interface SlidingAnnouncementProps {
  style?: any;
}

export const SlidingAnnouncement: React.FC<SlidingAnnouncementProps> = ({ style }) => {
  const { announcements } = useAnnouncements();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  
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
    if (textWidth === 0) return; // Wait for text width to be measured
    
    const screenWidth = Dimensions.get('window').width;
    
    // Use actual measured text width
    const animationRange = textWidth + screenWidth; // Full screen width gap to ensure complete text
    
    // Simple sliding animation from right to left
    const startAnimation = () => {
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -animationRange,
          duration: Math.max(15000, textWidth * 4), // Even slower duration for better readability
          useNativeDriver: true,
        })
      ).start();
    };
    
    scrollAnim.setValue(screenWidth * 1);
    startAnimation();
    
    return () => {
      scrollAnim.stopAnimation();
    };
  }, [scrollAnim, textWidth]);

  if (!latestAnnouncement) {
    return null;
  }

  return (
    <View style={[{
      position: 'absolute',
      top: 50, // More space from the green top border
      left: 20,
      right: 20,
      height: 45,
      overflow: 'hidden',
      backgroundColor: '#ffffff',
      width: 'auto',
      marginBottom: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 2,
      borderColor: '#16543a',
      zIndex: 1000, // Ensure it stays on top
    }, style]}>
      {/* Fixed icon on the left with a simple cut/indent */}
      <View style={{
        paddingLeft: 15,
        paddingRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        height: '100%',
        borderTopLeftRadius: 11,
        borderBottomLeftRadius: 11,
        marginRight: 8, // Create a cut/indent effect
      }}>
        <Ionicons 
          name={latestAnnouncement.icon as any || "megaphone"} 
          size={18} 
          color="#16543a" 
        />
      </View>
      
      {/* Sliding text area */}
      <View style={{ flex: 1, overflow: 'hidden', paddingRight: 20 }}>
        <Animated.View
          style={{
            transform: [{ translateX: scrollAnim }],
            flexDirection: 'row',
            alignItems: 'center',
            height: '100%',
            minWidth: Math.max(2000, textWidth || 2000),
          }}
        >
          <Text 
            style={{
              color: '#16543a',
              fontSize: 13,
              fontWeight: '600',
              flexShrink: 0,
              letterSpacing: 0.3,
            }}
            numberOfLines={1}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              console.log('Text width measured:', width, 'for text length:', latestAnnouncement.content.length);
              setTextWidth(width);
            }}
          >
            {latestAnnouncement.content}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};