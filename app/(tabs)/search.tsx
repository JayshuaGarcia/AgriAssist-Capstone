import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuth } from '../../components/AuthContext';

const GREEN = '#16543a';

export default function SearchScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

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
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search"
            returnKeyType="search"
          />
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      {/* Search Content */}
      <View style={styles.content}>
        <View style={styles.searchHeader}>
          <MaterialCommunityIcons name="search-web" size={48} color={GREEN} />
          <Text style={styles.searchTitle}>Search</Text>
          <Text style={styles.searchSubtitle}>Find farmers, crops, and agricultural data</Text>
        </View>

        <View style={styles.searchSuggestions}>
          <Text style={styles.suggestionsTitle}>Popular Searches</Text>
          <View style={styles.suggestionChips}>
            <TouchableOpacity style={styles.chip} onPress={() => setSearchQuery('Rice Farmers')}>
              <Text style={styles.chipText}>Rice Farmers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => setSearchQuery('Corn Production')}>
              <Text style={styles.chipText}>Corn Production</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => setSearchQuery('Fertilizer')}>
              <Text style={styles.chipText}>Fertilizer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => setSearchQuery('Harvest Data')}>
              <Text style={styles.chipText}>Harvest Data</Text>
            </TouchableOpacity>
          </View>
        </View>
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
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress('serach')} activeOpacity={0.7}>
          <Ionicons name="search-circle" size={32} color={activeTab === 'serach' ? '#111' : '#fff'} />
          <Text style={[styles.tabLabel, { color: activeTab === 'serach' ? '#111' : '#fff' }]}>Serach</Text>
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
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  searchTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 16,
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  searchSuggestions: {
    width: '100%',
    maxWidth: 400,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '500',
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