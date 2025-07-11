import { ReactNode } from 'react';
import { Image, Platform, StyleSheet, TextInput, View } from 'react-native';

interface CategoryLayoutProps {
  children: ReactNode;
}

export default function CategoryLayout({ children }: CategoryLayoutProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image source={require('../assets/images/react-logo.png')} style={styles.logo} accessibilityLabel="App Logo" />
        <TextInput
          style={styles.search}
          placeholder="Search here..."
          placeholderTextColor="#35523c"
          accessibilityLabel="Search"
          returnKeyType="search"
        />
        <Image
          source={{ uri: 'https://placekitten.com/60/60' }}
          style={styles.profile}
          accessibilityLabel="User Profile"
        />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    padding: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 12,
  },
  search: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    fontSize: 16,
    marginRight: 12,
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
}); 