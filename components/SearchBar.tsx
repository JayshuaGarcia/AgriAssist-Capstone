import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const INPUT_GREEN = '#f0f8f0';

interface SearchBarProps {
  onSearchPress: () => void;
  placeholder?: string;
  style?: any;
}

export default function SearchBar({ onSearchPress, placeholder = "Search features, forms, and tools...", style }: SearchBarProps) {
  const [searchText, setSearchText] = useState('');

  const handleSearchPress = () => {
    onSearchPress();
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handleSearchPress}
      activeOpacity={0.7}
    >
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={GREEN} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleTextChange}
          editable={false}
          pointerEvents="none"
        />
        <Ionicons name="mic" size={18} color={GREEN} style={styles.micIcon} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_GREEN,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0f2e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: GREEN,
    paddingVertical: 0,
  },
  micIcon: {
    marginLeft: 10,
  },
});

