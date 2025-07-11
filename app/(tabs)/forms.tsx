import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, Image as RNImage, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';
import SearchBar from '../../components/SearchBar';

const formsFeatures = [
  {
    label: 'Farmer Profile Form',
    icon: 'file-account-outline',
    route: '/forms/farmer-profile-form',
  },
  {
    label: 'Annex E – Farm Suitability',
    icon: 'file-certificate-outline',
    route: '/forms/annex-e',
  },
  {
    label: 'Requisition and Issue Slips',
    icon: 'file-document-outline',
    route: '/forms/requisition-issue',
  },
];

const CARD_GAP = 28;
const CARD_SIZE = (Dimensions.get('window').width - CARD_GAP * 4) / 2;
const GREEN = '#16543a';

const formsImages: { [key: string]: any } = {
  'Farmer Profile Form': require('../../assets/images/Farmer Profile Form.png'),
  'Annex E – Farm Suitability': require('../../assets/images/Annex E – Farm Suitability.png'),
  'Requisition and Issue Slips': require('../../assets/images/Requisition and Issue Slips.png'),
};

export default function FormsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();

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
        router.replace('../explore');
        break;
      case 'serach':
        router.replace('../search');
        break;
      case 'profile':
        router.replace('../profile');
        break;
      default:
        break;
    }
  };

  const handlePress = (item: typeof formsFeatures[0]) => {
    router.push(item.route as any);
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
            data={formsFeatures.map(f => ({ id: f.route, title: f.label, icon: f.icon }))}
            onSearch={query => {
              const match = formsFeatures.find(f => f.label.toLowerCase() === query.toLowerCase());
              if (match) router.push(match.route);
            }}
            onSelect={item => {
              const match = formsFeatures.find(f => f.label === item.title);
              if (match) router.push(match.route);
            }}
          />
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>
      {/* Forms Title */}
      <View style={styles.categoryRow}>
        <Text style={[styles.categoryTitle, { color: '#111' }]}>Forms & Templates</Text>
      </View>
      {/* Forms Grid */}
      <View style={styles.grid}>
        {formsFeatures.map((item, idx) => (
          <View key={idx} style={styles.catCol}>
            <TouchableOpacity
              style={styles.catBtn}
              activeOpacity={0.85}
              onPress={() => handlePress(item)}
            >
              <RNImage
                source={formsImages[item.label]}
                style={styles.catImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.catLabel} numberOfLines={2} ellipsizeMode="tail">{item.label}</Text>
          </View>
        ))}
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