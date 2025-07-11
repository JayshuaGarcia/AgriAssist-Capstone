import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';

const GREEN = '#16543a';

interface SearchBarProps {
  placeholder?: string;
  data: Array<{ id: string; title: string; icon?: string }>;
  onSearch: (query: string) => void;
  onSelect: (item: { id: string; title: string; icon?: string }) => void;
  style?: ViewStyle;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search here...',
  data,
  onSearch,
  onSelect,
  style,
}) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState(data);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (query.trim() === '') {
      setFiltered(data);
      setShowDropdown(false);
    } else {
      const q = query.toLowerCase();
      setFiltered(
        data.filter(item => item.title.toLowerCase().includes(q))
      );
      setShowDropdown(true);
    }
  }, [query, data]);

  // Hide dropdown on outside press
  useEffect(() => {
    const hide = Keyboard.addListener('keyboardDidHide', () => setShowDropdown(false));
    return () => hide.remove();
  }, []);

  const handleSearch = () => {
    setShowDropdown(false);
    onSearch(query);
    Keyboard.dismiss();
  };

  const handleSelect = (item: { id: string; title: string; icon?: string }) => {
    setQuery(item.title);
    setShowDropdown(false);
    onSelect(item);
    Keyboard.dismiss();
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return <Ionicons name="search" size={20} color={GREEN} />;
    // Use MaterialCommunityIcons for feature icons
    return <MaterialCommunityIcons name={iconName as any} size={20} color={GREEN} />;
  };

  return (
    <View style={[styles.wrapper, style]}>  
      <View style={styles.barContainer}>
        <Ionicons name="search" size={22} color={GREEN} style={{ marginLeft: 10 }} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#444"
          value={query}
          onChangeText={setQuery}
          onFocus={() => query.length > 0 && setShowDropdown(true)}
          onSubmitEditing={handleSearch}
          accessibilityLabel={placeholder}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setShowDropdown(false); }} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} accessibilityLabel="Search">
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {showDropdown && (
        <View style={styles.dropdown}>
          {filtered.length === 0 ? (
            <Text style={styles.noResults}>No results found</Text>
          ) : (
            <FlatList
              data={filtered.slice(0, 6)}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelect(item)}>
                  <View style={styles.suggestionIcon}>{getIcon(item.icon)}</View>
                  <Text style={styles.suggestionText}>{item.title}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    // width: '100%', // Remove this line to allow parent to control width
    alignItems: 'flex-start',
    zIndex: 20,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    height: 48,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 24,
    paddingHorizontal: 12,
    fontSize: 16,
    color: GREEN,
    height: 48,
  },
  clearButton: {
    padding: 4,
    marginRight: 2,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 15,
    color: '#222',
  },
  noResults: {
    padding: 16,
    color: '#888',
    textAlign: 'center',
    fontSize: 15,
  },
});

export default SearchBar; 