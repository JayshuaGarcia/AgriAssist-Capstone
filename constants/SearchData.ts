import { SearchableItem } from '../components/SearchContext';

// Search data for actual app features only
export const searchableItems: SearchableItem[] = [
  // Agricultural Tools
  {
    id: 'forecast-tool',
    title: 'Forecast Tool',
    description: 'Weather & crop predictions',
    category: 'Agricultural Tools',
    icon: 'trending-up',
    screen: 'forecast',
    keywords: ['weather', 'forecast', 'climate', 'temperature', 'rain', 'sunny', 'cloudy', 'agricultural advice'],
    action: () => {}
  },
  {
    id: 'price-monitoring',
    title: 'Price Monitoring',
    description: 'Market price tracking',
    category: 'Agricultural Tools',
    icon: 'analytics',
    screen: 'price-monitoring',
    keywords: ['price', 'market', 'monitoring', 'analytics', 'crop prices', 'commodity prices'],
    action: () => {}
  },
  {
    id: 'planting-report',
    title: 'Planting Report',
    description: 'Crop planning & tracking',
    category: 'Agricultural Tools',
    icon: 'leaf',
    screen: 'planting-report',
    keywords: ['planting', 'crop', 'planning', 'seeds', 'sowing', 'agriculture'],
    action: () => {}
  },
  {
    id: 'harvest-report',
    title: 'Harvest Report',
    description: 'Yield analysis & reports',
    category: 'Agricultural Tools',
    icon: 'basket',
    screen: 'harvest-report',
    keywords: ['harvest', 'yield', 'production', 'crop output', 'farming results'],
    action: () => {}
  },

  // Requirements
  {
    id: 'farmers-form',
    title: 'Complete Farmers Form',
    description: 'Farmer profile and registration form',
    category: 'Requirements',
    icon: 'document-text',
    screen: 'farmers',
    keywords: ['farmer', 'form', 'profile', 'registration', 'demographics', 'farming profile'],
    action: () => {}
  },

  // Tutorial
  {
    id: 'tutorial',
    title: 'Tutorial',
    description: 'Learn how to use the app',
    category: 'Help',
    icon: 'school',
    screen: 'tutorial',
    keywords: ['tutorial', 'learn', 'guide', 'how to', 'instructions', 'help'],
    action: () => {}
  },

  // Settings & Preferences
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage alert preferences',
    category: 'Settings & Preferences',
    icon: 'notifications',
    screen: 'notifications',
    keywords: ['notifications', 'alerts', 'reminders', 'settings', 'preferences'],
    action: () => {}
  },
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    description: 'Account security settings',
    category: 'Settings & Preferences',
    icon: 'shield-checkmark',
    screen: 'privacy',
    keywords: ['privacy', 'security', 'settings', 'protection', 'data', 'confidentiality'],
    action: () => {}
  },
  {
    id: 'language',
    title: 'Language',
    description: 'Change app language',
    category: 'Settings & Preferences',
    icon: 'language',
    screen: 'language',
    keywords: ['language', 'locale', 'translation', 'english', 'settings'],
    action: () => {}
  },
  {
    id: 'help-support',
    title: 'Help & Support',
    description: 'Get assistance',
    category: 'Settings & Preferences',
    icon: 'help-circle',
    screen: 'help',
    keywords: ['help', 'support', 'assistance', 'faq', 'contact', 'guidance'],
    action: () => {}
  },
  {
    id: 'about',
    title: 'About',
    description: 'App version & info',
    category: 'Settings & Preferences',
    icon: 'information-circle',
    screen: 'about',
    keywords: ['about', 'version', 'info', 'app', 'details'],
    action: () => {}
  }
];

// Helper function to get items by category
export const getItemsByCategory = (category: string): SearchableItem[] => {
  return searchableItems.filter(item => item.category === category);
};

// Helper function to get all categories
export const getAllCategories = (): string[] => {
  const categories = new Set(searchableItems.map(item => item.category));
  return Array.from(categories).sort();
};

// Helper function to search items with fuzzy matching
export const searchItems = (query: string): SearchableItem[] => {
  if (!query.trim()) return [];
  
  const lowercaseQuery = query.toLowerCase();
  
  return searchableItems.filter(item => {
    const searchText = `${item.title} ${item.description} ${item.category} ${item.keywords.join(' ')}`.toLowerCase();
    return searchText.includes(lowercaseQuery);
  });
};

// Helper function to get popular/recent items
export const getPopularItems = (): SearchableItem[] => {
  // Return most commonly used features
  return searchableItems.filter(item => 
    ['home', 'weather-forecast', 'farmers-form', 'crop-monitoring', 'harvest-tracker'].includes(item.id)
  );
};
