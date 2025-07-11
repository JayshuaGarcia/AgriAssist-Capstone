import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';
import SearchBar from '../../components/SearchBar';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [pendingRequests, setPendingRequests] = useState(0);

  const profileFeatures = [
    { label: 'Edit Profile', icon: 'account-edit', route: './profile-edit' },
    { label: 'Notifications', icon: 'bell-outline', route: './profile-notifications' },
    { label: 'Privacy & Security', icon: 'shield-check-outline', route: './profile-privacy' },
    { label: 'Help & Support', icon: 'help-circle-outline', route: './profile-help' },
    { label: 'About', icon: 'information-outline', route: './profile-about' },
    { label: 'BAEW & Viewer Requests', icon: 'account-clock', route: './account-requests' },
    { label: 'Viewer Requests', icon: 'account-eye', route: './viewer-requests' },
  ];

  const loadPendingRequestsCount = async () => {
    try {
      const { FirestoreService } = await import('../../services/firestoreService');
      let pendingRequests;
      if (profile.role === 'Admin') {
        pendingRequests = await FirestoreService.getPendingUserRequests();
      } else if (profile.role === 'BAEWs') {
        pendingRequests = await FirestoreService.getPendingViewerRequests();
      } else {
        pendingRequests = [];
      }
      setPendingRequests(pendingRequests.length);
    } catch (error) {
      console.error('Error loading pending requests count:', error);
    }
  };

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    
    // Load pending requests count for admin and BAEWs
    if (profile.role === 'Admin' || profile.role === 'BAEWs') {
      loadPendingRequestsCount();
    }
  }, [profile.role]);

  // Refresh pending requests count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (profile.role === 'Admin' || profile.role === 'BAEWs') {
        loadPendingRequestsCount();
      }
    }, [profile.role])
  );

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        router.replace('/');
        break;
      case 'explore':
        router.replace('./explore');
        break;
      case 'search':
        router.replace('./search');
        break;
      case 'profile':
        router.replace('./profile');
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // The logout function in AuthContext will navigate to login page
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1, marginLeft: 8, marginRight: 8 }}>
          <SearchBar
            placeholder="Search here..."
            data={profileFeatures.map(f => ({ id: f.route, title: f.label, icon: f.icon }))}
            onSearch={query => {
              const match = profileFeatures.find(f => f.label.toLowerCase() === query.toLowerCase());
              if (match) router.push(match.route);
            }}
            onSelect={item => {
              const match = profileFeatures.find(f => f.label === item.title);
              if (match) router.push(match.route);
            }}
          />
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileRole}>{profile.role}</Text>
          <Text style={styles.profileLocation}>{profile.location}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./profile-edit')}>
            <MaterialCommunityIcons name="account-edit" size={24} color={GREEN} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./profile-notifications')}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={GREEN} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./profile-privacy')}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color={GREEN} />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./profile-help')}>
            <MaterialCommunityIcons name="help-circle-outline" size={24} color={GREEN} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./profile-about')}>
            <MaterialCommunityIcons name="information-outline" size={24} color={GREEN} />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Admin menu item for account requests */}
          {profile.role === 'Admin' && (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./account-requests')}>
              <MaterialCommunityIcons name="account-clock" size={24} color={GREEN} />
              <Text style={styles.menuText}>BAEW & Viewer Requests</Text>
              {pendingRequests > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}

          {/* BAEW menu item for viewer requests */}
          {profile.role === 'BAEWs' && (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./viewer-requests')}>
              <MaterialCommunityIcons name="account-eye" size={24} color={GREEN} />
              <Text style={styles.menuText}>Viewer Requests</Text>
              {pendingRequests > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#ff4444" />
            <Text style={[styles.menuText, { color: '#ff4444' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Custom bottom bar */}
      <View style={styles.customTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('home')} activeOpacity={0.7}>
          <Ionicons name="home" size={28} color={activeTab === 'home' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'home' ? '#111' : '#fff' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('explore')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="map-search" size={28} color={activeTab === 'explore' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'explore' ? '#111' : '#fff' }]}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('search')} activeOpacity={0.7}>
          <Ionicons name="search-circle" size={32} color={activeTab === 'search' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'search' ? '#111' : '#fff' }]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('profile')} activeOpacity={0.7}>
          <Ionicons name="person" size={28} color={activeTab === 'profile' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'profile' ? '#111' : '#fff' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: 'space-between',
  },
  logo: {
    width: 54,
    height: 54,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    marginHorizontal: 8,
    height: 40,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: '#111',
    fontSize: 16,
    paddingHorizontal: 12,
  },
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eee',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: WHITE,
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: GREEN,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: GREEN,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    backgroundColor: WHITE,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 100, // Space for tab bar
  },
  tabLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  customTabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: GREEN,
    height: 64,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 0,
    zIndex: 100,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 