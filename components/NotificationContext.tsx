import { Ionicons } from '@expo/vector-icons';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: () => void;
  currentNotification: Notification | null;
  isVisible: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      duration: 0, // No timeout - runs forever
      ...notification,
    };

    setCurrentNotification(newNotification);
    setIsVisible(true);

    // No auto-hide timeout - runs continuously until manually closed
  };

  const hideNotification = () => {
    // Hide the notification
    setIsVisible(false);
    setCurrentNotification(null);
  };

  return (
    <NotificationContext.Provider value={{
      showNotification,
      hideNotification,
      currentNotification,
      isVisible,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

interface NotificationBannerProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification, onClose }) => {
  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success': return '#16543a'; // Green color matching app theme
      case 'info': return '#16543a'; // Green color for info notifications too
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#16543a'; // Default to green
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return 'checkmark-circle';
      case 'info': return 'information-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  return (
    <View style={[styles.notificationBanner, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon() as any} size={20} color="white" />
      </View>
      <Text style={styles.scrollingText}>
        {notification.title} - {notification.message}
      </Text>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon() as any} size={20} color="white" />
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationBanner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 8,
    width: Dimensions.get('window').width + 300, // Wide enough to scroll smoothly
  },
  scrollingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 20,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    marginLeft: 10,
  },
});
