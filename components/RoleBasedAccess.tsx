import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from './AuthContext';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showViewerMessage?: boolean;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  fallback,
  showViewerMessage = false
}) => {
  const { profile } = useAuth();
  const isViewer = profile.role === 'Viewer';

  if (isViewer) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showViewerMessage) {
      return (
        <View style={styles.viewerMessage}>
          <Text style={styles.viewerText}>
            This feature is read-only for Viewer accounts.
          </Text>
        </View>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

export const ViewerOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const isViewer = profile.role === 'Viewer';

  if (!isViewer) {
    return null;
  }

  return <>{children}</>;
};

export const NonViewerOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const isViewer = profile.role === 'Viewer';

  if (isViewer) {
    return null;
  }

  return <>{children}</>;
};

export const useRoleAccess = () => {
  const { profile } = useAuth();
  
  return {
    isViewer: profile.role === 'Viewer',
    isBAEW: profile.role === 'BAEWs',
    isAdmin: profile.role === 'Admin',
    canEdit: profile.role !== 'Viewer',
    canDelete: profile.role === 'Admin',
    canApprove: profile.role === 'Admin' || profile.role === 'BAEWs',
  };
};

const styles = StyleSheet.create({
  viewerMessage: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  viewerText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
}); 