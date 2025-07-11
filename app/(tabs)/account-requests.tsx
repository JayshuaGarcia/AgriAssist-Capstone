import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';
import { useBarangay, useRole } from '../../components/RoleContext';
import { FirestoreService } from '../../services/firestoreService';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';
const RED = '#ff4444';
const ORANGE = '#ff8800';

interface UserRequest {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt?: Date;
}

export default function AccountRequestsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { role } = useRole();
  const { barangay } = useBarangay();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const isAdmin = role === 'Admin';
      const pendingRequests = await FirestoreService.getPendingUserRequests(barangay || undefined, isAdmin);
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert(
        'Error', 
        'Failed to load account requests. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleApprove = async (uid: string) => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this account request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingRequest(uid);
              await FirestoreService.updateUserApprovalStatus(uid, true);
              Alert.alert('Success', 'Account request approved successfully');
              await loadRequests();
            } catch (error) {
              console.error('Error approving request:', error);
              Alert.alert('Error', 'Failed to approve request');
            } finally {
              setProcessingRequest(null);
            }
          }
        }
      ]
    );
  };

  const handleReject = async (uid: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this account request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingRequest(uid);
              await FirestoreService.updateUserApprovalStatus(uid, false);
              Alert.alert('Success', 'Account request rejected');
              await loadRequests();
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject request');
            } finally {
              setProcessingRequest(null);
            }
          }
        }
      ]
    );
  };

  const renderRequestItem = ({ item }: { item: UserRequest }) => {
    const getRoleIcon = (role: string) => {
      switch (role) {
        case 'BAEWs':
          return 'account-hard-hat';
        case 'Viewer':
          return 'account-eye';
        case 'Admin':
          return 'account-cog';
        default:
          return 'account';
      }
    };

    const getRoleDescription = (role: string) => {
      switch (role) {
        case 'BAEWs':
          return 'Barangay Agricultural Extension Worker';
        case 'Viewer':
          return 'Read-only access to agricultural data';
        case 'Admin':
          return 'Full system administrator access';
        default:
          return 'User account';
      }
    };

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons 
                name={getRoleIcon(item.role)} 
                size={24} 
                color={GREEN} 
              />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <View style={styles.roleContainer}>
                <MaterialCommunityIcons 
                  name={getRoleIcon(item.role)} 
                  size={16} 
                  color={LIGHT_GREEN} 
                />
                <Text style={styles.userRole}>{item.role}</Text>
                <Text style={styles.roleDescription}>
                  {getRoleDescription(item.role)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Pending</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.uid)}
            disabled={processingRequest === item.uid}
          >
            {processingRequest === item.uid ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color={WHITE} />
                <Text style={styles.actionButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.uid)}
            disabled={processingRequest === item.uid}
          >
            {processingRequest === item.uid ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <>
                <Ionicons name="close" size={16} color={WHITE} />
                <Text style={styles.actionButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="account-check" size={64} color={LIGHT_GREEN} />
      <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
      <Text style={styles.emptyStateSubtitle}>
        All account requests have been processed
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Requests</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginRight: 40,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 12,
    color: LIGHT_GREEN,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  roleDescription: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: ORANGE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: WHITE,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: GREEN,
  },
  rejectButton: {
    backgroundColor: RED,
  },
  actionButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
}); 