import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Image as RNImage } from 'react-native';
import { useAuth } from '../../components/AuthContext';

const categories = [
  { key: 'farmers', label: 'Farmers', icon: 'account-hard-hat' },
  { key: 'monitoring', label: 'Monitoring', icon: 'monitor-dashboard' },
  { key: 'analytics', label: 'Analytics & Forecasting', icon: 'chart-line' },
  { key: 'operations', label: 'Operations', icon: 'cog-sync' },
  { key: 'forms', label: 'Forms & Templates', icon: 'file-document-edit' },
  { key: 'notifications', label: 'Notifications & Calendar', icon: 'bell-alert' },
];

const CARD_GAP = 28;
const CARD_SIZE = (Dimensions.get('window').width - CARD_GAP * 4) / 2;
const GREEN = '#16543a';
const GOLD = '#ffb300';

const categoryImages: { [key: string]: any } = {
  'Farmers': require('../../assets/images/Farmers.png'),
  'Monitoring': require('../../assets/images/Monitoring.png'),
  'Analytics & Forecasting': require('../../assets/images/Analytics & Forecasting.png'),
  'Operations': require('../../assets/images/Operations.png'),
  'Forms & Templates': require('../../assets/images/Forms & Templates.png'),
  'Notifications & Calendar': require('../../assets/images/Notifications & Calendar.png'),
};

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();

  const tabList = [
    { key: 'home', label: 'Home', icon: <Ionicons name="home" size={28} /> },
    { key: 'explore', label: 'Explore', icon: <MaterialCommunityIcons name="map-search" size={28} /> },
    { key: 'search', label: 'Search', icon: <Ionicons name="search-circle" size={32} /> },
    { key: 'profile', label: 'Profile', icon: <Ionicons name="person" size={28} /> },
  ];

  useEffect(() => {
    // Hide Android navigation bar (back, home, recent)
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);

  // Removed pathname sync logic since usePathname is not available in this version

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
            placeholder="Search here ..."
            placeholderTextColor="#111"
            accessibilityLabel="Search"
            returnKeyType="search"
          />
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>
      {/* Category Title Row */}
      <View style={styles.categoryRow}>
        <Text style={[styles.categoryTitle, { color: '#111' }]}>Category</Text>
        <MaterialCommunityIcons name="menu" size={32} color="#111" style={{ marginRight: 8 }} />
      </View>
      {/* Category Grid */}
      <View style={styles.grid}>
        {categories.map((cat) => (
          <View key={cat.key} style={styles.catCol}>
            <TouchableOpacity
              style={styles.catBtn}
              onPress={() => router.push(`../${cat.key}`)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
            >
              <RNImage
                source={categoryImages[cat.label]}
                style={styles.catImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.catLabel} numberOfLines={2} ellipsizeMode="tail">{cat.label}</Text>
          </View>
        ))}
      </View>
      {/* Custom bottom bar */}
      <View style={styles.customTabBar}>
        {tabList.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            {React.cloneElement(tab.icon, { color: activeTab === tab.key ? '#111' : '#fff' })}
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? '#111' : '#fff' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
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
    backgroundColor: 'transparent',
    borderRadius: 22,
    paddingHorizontal: 12,
    fontSize: 16,
    color: GREEN,
    height: 40,
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 18,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    textAlign: 'left',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  catCol: {
    alignItems: 'center',
    margin: CARD_GAP / 2,
    width: CARD_SIZE,
  },
  catBtn: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 5,
  },
  catLabel: {
    color: '#222',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 2,
    width: CARD_SIZE,
    minHeight: 36,
    flexWrap: 'wrap',
    textAlignVertical: 'center',
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
  catImg: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
});

