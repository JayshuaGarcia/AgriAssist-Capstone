import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const WHITE = '#ffffff';

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile, logout } = useAuth();

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        router.replace('/');
        break;
      case 'explore':
        router.replace('./explore');
        break;
      case 'serach':
        router.replace('./search');
        break;
      case 'profile':
        router.replace('./profile');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#111" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search here..."
            placeholderTextColor="#111"
            accessibilityLabel="Search"
            returnKeyType="search"
          />
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.profileIconContainer}>
          <Text style={styles.profileIcon}>{profile.selectedCropEmoji || '🌱'}</Text>
        </View>
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

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./profile-information')}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color={GREEN} />
          <Text style={styles.menuText}>Profile Information</Text>
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

        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={24} color="#ff4444" />
          <Text style={[styles.menuText, { color: '#ff4444' }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

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
  profileIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: GREEN,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 48,
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 10,
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
  logoutItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
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