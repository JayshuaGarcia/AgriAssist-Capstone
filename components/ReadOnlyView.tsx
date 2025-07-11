import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from './AuthContext';

interface ReadOnlyViewProps {
  children: React.ReactNode;
  showViewerMessage?: boolean;
}

export const ReadOnlyView: React.FC<ReadOnlyViewProps> = ({ 
  children, 
  showViewerMessage = true 
}) => {
  const { profile } = useAuth();
  const isViewer = profile.role === 'Viewer';

  if (isViewer && showViewerMessage) {
    return (
      <View style={styles.container}>
        <View style={styles.viewerBanner}>
          <Text style={styles.viewerBannerText}>📖 READ-ONLY MODE - VIEWER ACCOUNT</Text>
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

export const DisableForViewer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const isViewer = profile.role === 'Viewer';

  if (isViewer) {
    return (
      <View style={styles.disabledContainer}>
        <Text style={styles.disabledText}>This feature is not available for Viewer accounts</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewerBanner: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  viewerBannerText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  disabledContainer: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  disabledText: {
    color: '#6c757d',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 