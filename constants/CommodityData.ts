export interface Commodity {
  id: string;
  name: string;
  category: COMMODITY_CATEGORIES;
  unit: string; // e.g., "kg", "piece", "liter"
  currentPrice?: number;
  priceChange?: number; // absolute change
  priceChangePercent?: number; // percentage change
  lastUpdated?: string; // Date string
  priceDate?: string; // Date when price was recorded
  priceSpecification?: string; // Price specification details
  priceSource?: string; // Source of price data
  forecast?: {
    nextWeek: number;
    nextMonth: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number; // 0-100
    factors: string[]; // e.g., "seasonal demand", "supply shortage"
  };
}

export enum COMMODITY_CATEGORIES {
  KADIWA_RICE = 'KADIWA RICE-FOR-ALL',
  IMPORTED_RICE = 'IMPORTED COMMERCIAL RICE',
  LOCAL_RICE = 'LOCAL COMMERCIAL RICE',
  CORN = 'CORN',
  FISH = 'FISH',
  LIVESTOCK_POULTRY = 'LIVESTOCK & POULTRY PRODUCTS',
  LOWLAND_VEGETABLES = 'LOWLAND VEGETABLES',
  HIGHLAND_VEGETABLES = 'HIGHLAND VEGETABLES',
  SPICES = 'SPICES',
  FRUITS = 'FRUITS',
  OTHER = 'OTHER COMMODITIES',
}

export const COMMODITY_DATA: Commodity[] = [
  // KADIWA RICE-FOR-ALL
  {
    id: 'kadiwa-premium',
    name: 'Premium (RFA5)',
    category: COMMODITY_CATEGORIES.KADIWA_RICE,
    unit: 'kg'
  },
  {
    id: 'kadiwa-well-milled',
    name: 'Well Milled (RFA25)',
    category: COMMODITY_CATEGORIES.KADIWA_RICE,
    unit: 'kg'
  },
  {
    id: 'kadiwa-regular-milled',
    name: 'Regular Milled (RFA100)',
    category: COMMODITY_CATEGORIES.KADIWA_RICE,
    unit: 'kg'
  },
  {
    id: 'kadiwa-benteng-bigas',
    name: 'P20 Benteng Bigas Meron Na',
    category: COMMODITY_CATEGORIES.KADIWA_RICE,
    unit: 'kg'
  },

  // IMPORTED COMMERCIAL RICE
  {
    id: 'imported-special',
    name: 'Special (Imported)',
    category: COMMODITY_CATEGORIES.IMPORTED_RICE,
    unit: 'kg'
  },
  {
    id: 'imported-premium',
    name: 'Premium (Imported)',
    category: COMMODITY_CATEGORIES.IMPORTED_RICE,
    unit: 'kg'
  },
  {
    id: 'imported-well-milled',
    name: 'Well Milled (Imported)',
    category: COMMODITY_CATEGORIES.IMPORTED_RICE,
    unit: 'kg'
  },
  {
    id: 'imported-regular-milled',
    name: 'Regular Milled (Imported)',
    category: COMMODITY_CATEGORIES.IMPORTED_RICE,
    unit: 'kg'
  },

  // LOCAL COMMERCIAL RICE
  {
    id: 'local-special',
    name: 'Special (Local)',
    category: COMMODITY_CATEGORIES.LOCAL_RICE,
    unit: 'kg'
  },
  {
    id: 'local-premium',
    name: 'Premium (Local)',
    category: COMMODITY_CATEGORIES.LOCAL_RICE,
    unit: 'kg'
  },
  {
    id: 'local-well-milled',
    name: 'Well Milled (Local)',
    category: COMMODITY_CATEGORIES.LOCAL_RICE,
    unit: 'kg'
  },
  {
    id: 'local-regular-milled',
    name: 'Regular Milled (Local)',
    category: COMMODITY_CATEGORIES.LOCAL_RICE,
    unit: 'kg'
  },

  // CORN
  {
    id: 'corn-white',
    name: 'Corn (White)',
    category: COMMODITY_CATEGORIES.CORN,
    unit: 'kg'
  },
  {
    id: 'corn-yellow',
    name: 'Corn (Yellow)',
    category: COMMODITY_CATEGORIES.CORN,
    unit: 'kg'
  },
  {
    id: 'corn-grits-white',
    name: 'Corn Grits (White, Food Grade)',
    category: COMMODITY_CATEGORIES.CORN,
    unit: 'kg'
  },
  {
    id: 'corn-grits-yellow',
    name: 'Corn Grits (Yellow, Food Grade)',
    category: COMMODITY_CATEGORIES.CORN,
    unit: 'kg'
  },
  {
    id: 'corn-cracked-yellow',
    name: 'Corn Cracked (Yellow, Feed Grade)',
    category: COMMODITY_CATEGORIES.CORN,
    unit: 'kg'
  },
  {
    id: 'corn-grits-feed',
    name: 'Corn Grits (Feed Grade)',
    category: COMMODITY_CATEGORIES.CORN,
    unit: 'kg'
  },

  // FISH
  {
    id: 'fish-bangus',
    name: 'Bangus',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-tilapia',
    name: 'Tilapia',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-galunggong-local',
    name: 'Galunggong (Local)',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-galunggong-imported',
    name: 'Galunggong (Imported)',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-alumahan',
    name: 'Alumahan',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-bonito',
    name: 'Bonito',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-salmon-head',
    name: 'Salmon Head',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-sardines',
    name: 'Sardines (Tamban)',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-squid',
    name: 'Squid (Pusit Bisaya)',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },
  {
    id: 'fish-yellowfin-tuna',
    name: 'Yellow-Fin Tuna (Tambakol)',
    category: COMMODITY_CATEGORIES.FISH,
    unit: 'kg'
  },

  // LIVESTOCK & POULTRY PRODUCTS
  {
    id: 'beef-rump',
    name: 'Beef Rump',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'kg'
  },
  {
    id: 'beef-brisket',
    name: 'Beef Brisket',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'kg'
  },
  {
    id: 'pork-ham',
    name: 'Pork Ham',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'kg'
  },
  {
    id: 'pork-belly',
    name: 'Pork Belly',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'kg'
  },
  {
    id: 'pork-kasim-frozen',
    name: 'Frozen Kasim',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'kg'
  },
  {
    id: 'pork-liempo-frozen',
    name: 'Frozen Liempo',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'kg'
  },
  {
    id: 'chicken-whole',
    name: 'Whole Chicken',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'kg'
  },
  {
    id: 'egg-white-pewee',
    name: 'Chicken Egg (White, Pewee)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-white-extra-small',
    name: 'Chicken Egg (White, Extra Small)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-white-small',
    name: 'Chicken Egg (White, Small)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-white-medium',
    name: 'Chicken Egg (White, Medium)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-white-large',
    name: 'Chicken Egg (White, Large)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-white-extra-large',
    name: 'Chicken Egg (White, Extra Large)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-white-jumbo',
    name: 'Chicken Egg (White, Jumbo)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-brown-medium',
    name: 'Chicken Egg (Brown, Medium)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-brown-large',
    name: 'Chicken Egg (Brown, Large)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },
  {
    id: 'egg-brown-extra-large',
    name: 'Chicken Egg (Brown, Extra Large)',
    category: COMMODITY_CATEGORIES.LIVESTOCK_POULTRY,
    unit: 'piece'
  },

  // LOWLAND VEGETABLES
  {
    id: 'lowland-ampalaya',
    name: 'Ampalaya',
    category: COMMODITY_CATEGORIES.LOWLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'lowland-sitao',
    name: 'Sitao',
    category: COMMODITY_CATEGORIES.LOWLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'lowland-pechay-native',
    name: 'Pechay (Native)',
    category: COMMODITY_CATEGORIES.LOWLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'lowland-squash',
    name: 'Squash',
    category: COMMODITY_CATEGORIES.LOWLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'lowland-eggplant',
    name: 'Eggplant',
    category: COMMODITY_CATEGORIES.LOWLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'lowland-tomato',
    name: 'Tomato',
    category: COMMODITY_CATEGORIES.LOWLAND_VEGETABLES,
    unit: 'kg'
  },

  // HIGHLAND VEGETABLES
  {
    id: 'highland-bell-pepper-green',
    name: 'Bell Pepper (Green)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-bell-pepper-red',
    name: 'Bell Pepper (Red)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-broccoli',
    name: 'Broccoli',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-cabbage-rare-ball',
    name: 'Cabbage (Rare Ball)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-cabbage-scorpio',
    name: 'Cabbage (Scorpio)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-cabbage-wonder-ball',
    name: 'Cabbage (Wonder Ball)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-carrots',
    name: 'Carrots',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-habichuelas',
    name: 'Habichuelas (Baguio Beans)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-white-potato',
    name: 'White Potato',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-pechay-baguio',
    name: 'Pechay (Baguio)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-chayote',
    name: 'Chayote',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-cauliflower',
    name: 'Cauliflower',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-celery',
    name: 'Celery',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-lettuce-green-ice',
    name: 'Lettuce (Green Ice)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-lettuce-iceberg',
    name: 'Lettuce (Iceberg)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },
  {
    id: 'highland-lettuce-romaine',
    name: 'Lettuce (Romaine)',
    category: COMMODITY_CATEGORIES.HIGHLAND_VEGETABLES,
    unit: 'kg'
  },

  // SPICES
  {
    id: 'spice-red-onion',
    name: 'Red Onion',
    category: COMMODITY_CATEGORIES.SPICES,
    unit: 'kg'
  },
  {
    id: 'spice-red-onion-imported',
    name: 'Red Onion (Imported)',
    category: COMMODITY_CATEGORIES.SPICES,
    unit: 'kg'
  },
  {
    id: 'spice-white-onion',
    name: 'White Onion',
    category: COMMODITY_CATEGORIES.SPICES,
    unit: 'kg'
  },
  {
    id: 'spice-white-onion-imported',
    name: 'White Onion (Imported)',
    category: COMMODITY_CATEGORIES.SPICES,
    unit: 'kg'
  },
  {
    id: 'spice-garlic-imported',
    name: 'Garlic (Imported)',
    category: COMMODITY_CATEGORIES.SPICES,
    unit: 'kg'
  },
  {
    id: 'spice-garlic-native',
    name: 'Garlic (Native)',
    category: COMMODITY_CATEGORIES.SPICES,
    unit: 'kg'
  },
  {
    id: 'spice-ginger',
    name: 'Ginger',
    category: COMMODITY_CATEGORIES.SPICES,
    unit: 'kg'
  },
  {
    id: 'spice-chilli-red',
    name: 'Chilli (Red)',
    category: COMMODITY_CATEGORIES.SPICES,
    unit: 'kg'
  },

  // FRUITS
  {
    id: 'fruit-calamansi',
    name: 'Calamansi',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-banana-lakatan',
    name: 'Banana (Lakatan)',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-banana-latundan',
    name: 'Banana (Latundan)',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-banana-saba',
    name: 'Banana (Saba)',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-papaya',
    name: 'Papaya',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-mango-carabao',
    name: 'Mango (Carabao)',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-avocado',
    name: 'Avocado',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-melon',
    name: 'Melon',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-pomelo',
    name: 'Pomelo',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },
  {
    id: 'fruit-watermelon',
    name: 'Watermelon',
    category: COMMODITY_CATEGORIES.FRUITS,
    unit: 'kg'
  },

  // OTHER BASIC COMMODITIES
  {
    id: 'other-sugar-refined',
    name: 'Sugar (Refined)',
    category: COMMODITY_CATEGORIES.OTHER,
    unit: 'kg'
  },
  {
    id: 'other-sugar-washed',
    name: 'Sugar (Washed)',
    category: COMMODITY_CATEGORIES.OTHER,
    unit: 'kg'
  },
  {
    id: 'other-sugar-brown',
    name: 'Sugar (Brown)',
    category: COMMODITY_CATEGORIES.OTHER,
    unit: 'kg'
  },
  {
    id: 'other-cooking-oil-palm',
    name: 'Cooking Oil (Palm)',
    category: COMMODITY_CATEGORIES.OTHER,
    unit: 'L'
  },
  {
    id: 'other-cooking-oil-coconut',
    name: 'Cooking Oil (Coconut)',
    category: COMMODITY_CATEGORIES.OTHER,
    unit: 'L'
  }
];

export const getCommoditiesByCategory = (category: string): Commodity[] => {
  return COMMODITY_DATA.filter(commodity => commodity.category === category);
};

export const getCommodityById = (id: string): Commodity | undefined => {
  return COMMODITY_DATA.find(commodity => commodity.id === id);
};
