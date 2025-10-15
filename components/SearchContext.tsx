import { createContext, ReactNode, useContext, useState } from 'react';

export interface SearchableItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  screen: string;
  keywords: string[];
  action: () => void;
}

interface SearchContextType {
  searchableItems: SearchableItem[];
  addSearchableItem: (item: SearchableItem) => void;
  removeSearchableItem: (id: string) => void;
  searchItems: (query: string) => SearchableItem[];
  clearSearchableItems: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchableItems, setSearchableItems] = useState<SearchableItem[]>([]);

  const addSearchableItem = (item: SearchableItem) => {
    setSearchableItems(prev => {
      const exists = prev.some(existingItem => existingItem.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeSearchableItem = (id: string) => {
    setSearchableItems(prev => prev.filter(item => item.id !== id));
  };

  const searchItems = (query: string): SearchableItem[] => {
    if (!query.trim()) return [];
    
    const lowercaseQuery = query.toLowerCase();
    
    return searchableItems.filter(item => {
      const searchText = `${item.title} ${item.description} ${item.category} ${item.keywords.join(' ')}`.toLowerCase();
      return searchText.includes(lowercaseQuery);
    });
  };

  const clearSearchableItems = () => {
    setSearchableItems([]);
  };

  const value: SearchContextType = {
    searchableItems,
    addSearchableItem,
    removeSearchableItem,
    searchItems,
    clearSearchableItems
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

