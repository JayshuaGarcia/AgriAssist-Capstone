export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  lastUpdated: string;
  originalPrice?: string;
  specification?: string;
}

export const OFFICIAL_PRODUCTS: Product[] = [
  // I. IMPORTED COMMERCIAL RICE
  { id: 1, name: 'Rice Fancy (Imported)', category: 'Imported Rice', price: '', lastUpdated: '', specification: 'White Rice' },
  { id: 2, name: 'Rice Premium (Imported)', category: 'Imported Rice', price: '', lastUpdated: '', specification: '5% per strain' },
  { id: 3, name: 'Rice Well Milled (Imported)', category: 'Imported Rice', price: '', lastUpdated: '', specification: '15% per strain' },
  { id: 4, name: 'Rice Regular Milled (Imported)', category: 'Imported Rice', price: '', lastUpdated: '', specification: '25-50% back stock' },

  // II. LOCAL COMMERCIAL RICE
  { id: 5, name: 'Rice Fancy (Local)', category: 'Local Rice', price: '', lastUpdated: '', specification: 'White Rice' },
  { id: 6, name: 'Rice Premium (Local)', category: 'Local Rice', price: '', lastUpdated: '', specification: '5% per strain' },
  { id: 7, name: 'Rice Well Milled (Local)', category: 'Local Rice', price: '', lastUpdated: '', specification: '15% per strain' },
  { id: 8, name: 'Rice Regular Milled (Local)', category: 'Local Rice', price: '', lastUpdated: '', specification: '25-50% back stock' },

  // III. CORN
  { id: 9, name: 'Corn White', category: 'Corn', price: '', lastUpdated: '', specification: 'Cob, Dried/Fresh' },
  { id: 10, name: 'Corn Yellow', category: 'Corn', price: '', lastUpdated: '', specification: 'Cob, Dried/Fresh' },
  { id: 11, name: 'Corn Grits White', category: 'Corn', price: '', lastUpdated: '', specification: 'Food Grade' },
  { id: 12, name: 'Corn Grits Yellow', category: 'Corn', price: '', lastUpdated: '', specification: 'Food Grade' },
  { id: 13, name: 'Corn Grains Yellow', category: 'Corn', price: '', lastUpdated: '', specification: 'Food Grade' },
  { id: 14, name: 'Corn Grains Feed Grade', category: 'Corn', price: '', lastUpdated: '', specification: 'Feed Grade' },

  // IV. FISH
  { id: 15, name: 'Bangus', category: 'Fish', price: '', lastUpdated: '', specification: 'Large' },
  { id: 16, name: 'Tilapia', category: 'Fish', price: '', lastUpdated: '', specification: 'Medium' },
  { id: 17, name: 'Galunggong Local', category: 'Fish', price: '', lastUpdated: '', specification: 'Medium' },
  { id: 18, name: 'Galunggong Imported', category: 'Fish', price: '', lastUpdated: '', specification: 'Medium' },
  { id: 19, name: 'Alumahan', category: 'Fish', price: '', lastUpdated: '', specification: 'Medium' },
  { id: 20, name: 'Dalang Bukid Local', category: 'Fish', price: '', lastUpdated: '', specification: 'Local' },
  { id: 21, name: 'Dalang Bukid Imported', category: 'Fish', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 22, name: 'Dilis Local', category: 'Fish', price: '', lastUpdated: '', specification: 'Local' },
  { id: 23, name: 'Dilis Imported', category: 'Fish', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 24, name: 'Pusit Fresh', category: 'Fish', price: '', lastUpdated: '', specification: 'Fresh' },
  { id: 25, name: 'Squid Fresh/Frozen', category: 'Fish', price: '', lastUpdated: '', specification: 'Fresh/Frozen' },

  // V. LIVESTOCK & POULTRY PRODUCTS
  { id: 26, name: 'Carabeef Lean Meat', category: 'Carabeef', price: '', lastUpdated: '', specification: 'Boneless' },
  { id: 27, name: 'Carabeef Brisket', category: 'Carabeef', price: '', lastUpdated: '', specification: 'Boneless' },
  { id: 28, name: 'Beef Rump Imported', category: 'Beef', price: '', lastUpdated: '', specification: 'Boneless' },
  { id: 29, name: 'Beef Brisket Imported', category: 'Beef', price: '', lastUpdated: '', specification: 'Boneless' },
  { id: 30, name: 'Beef Sirloin Imported', category: 'Beef', price: '', lastUpdated: '', specification: 'Boneless' },
  { id: 31, name: 'Beef Tenderloin Imported', category: 'Beef', price: '', lastUpdated: '', specification: 'Boneless' },

  { id: 32, name: 'Pork Ham Local', category: 'Pork', price: '', lastUpdated: '', specification: 'Ham' },
  { id: 33, name: 'Pork Ham Imported', category: 'Pork', price: '', lastUpdated: '', specification: 'Ham' },
  { id: 34, name: 'Pork Loin Local', category: 'Pork', price: '', lastUpdated: '', specification: 'Loin' },
  { id: 35, name: 'Pork Loin Imported', category: 'Pork', price: '', lastUpdated: '', specification: 'Loin' },
  { id: 36, name: 'Pork Belly Local', category: 'Pork', price: '', lastUpdated: '', specification: 'Belly' },
  { id: 37, name: 'Pork Belly Imported', category: 'Pork', price: '', lastUpdated: '', specification: 'Belly' },

  { id: 38, name: 'Chicken Whole Local', category: 'Chicken', price: '', lastUpdated: '', specification: 'Whole' },
  { id: 39, name: 'Chicken Whole Imported', category: 'Chicken', price: '', lastUpdated: '', specification: 'Whole' },
  { id: 40, name: 'Chicken Breast Local', category: 'Chicken', price: '', lastUpdated: '', specification: 'Breast' },
  { id: 41, name: 'Chicken Breast Imported', category: 'Chicken', price: '', lastUpdated: '', specification: 'Breast' },
  { id: 42, name: 'Chicken Thigh Local', category: 'Chicken', price: '', lastUpdated: '', specification: 'Thigh' },
  { id: 43, name: 'Chicken Thigh Imported', category: 'Chicken', price: '', lastUpdated: '', specification: 'Thigh' },
  { id: 44, name: 'Chicken Wing Local', category: 'Chicken', price: '', lastUpdated: '', specification: 'Wing' },
  { id: 45, name: 'Chicken Wing Imported', category: 'Chicken', price: '', lastUpdated: '', specification: 'Wing' },

  { id: 46, name: 'Chicken Eggs Medium', category: 'Eggs', price: '', lastUpdated: '', specification: 'Medium' },
  { id: 47, name: 'Chicken Eggs Large', category: 'Eggs', price: '', lastUpdated: '', specification: 'Large' },
  { id: 48, name: 'Chicken Eggs Extra Large', category: 'Eggs', price: '', lastUpdated: '', specification: 'Extra Large' },

  // VI. PROCESSED MEAT PRODUCTS
  { id: 49, name: 'Hotdog Regular', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Regular' },
  { id: 50, name: 'Hotdog Jumbo', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Jumbo' },
  { id: 51, name: 'Longganisa Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 52, name: 'Longganisa Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 53, name: 'Tocino Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 54, name: 'Tocino Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 55, name: 'Tapa Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 56, name: 'Tapa Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 57, name: 'Ham Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 58, name: 'Ham Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 59, name: 'Bacon Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 60, name: 'Bacon Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 61, name: 'Sausage Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 62, name: 'Sausage Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 63, name: 'Corned Beef Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 64, name: 'Corned Beef Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 65, name: 'Luncheon Meat Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 66, name: 'Luncheon Meat Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },
  { id: 67, name: 'Pork and Beans Local', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Local' },
  { id: 68, name: 'Pork and Beans Imported', category: 'Processed Meat', price: '', lastUpdated: '', specification: 'Imported' },

  // VII. VEGETABLES
  { id: 69, name: 'Ampalaya', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Ampalaya' },
  { id: 70, name: 'Baguio Beans', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Baguio Beans' },
  { id: 71, name: 'Squash', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Squash' },
  { id: 72, name: 'Eggplant', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Eggplant' },
  { id: 73, name: 'Tomato', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Tomato' },
  { id: 74, name: 'Onion Red', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Red' },
  { id: 75, name: 'Onion White', category: 'Vegetables', price: '', lastUpdated: '', specification: 'White' },
  { id: 76, name: 'Garlic', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Garlic' },
  { id: 77, name: 'Ginger', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Ginger' },
  { id: 78, name: 'Chili', category: 'Vegetables', price: '', lastUpdated: '', specification: 'Chili' },

  // VIII. FRUITS
  { id: 79, name: 'Apple Fuji', category: 'Fruits', price: '', lastUpdated: '', specification: 'Fuji' },
  { id: 80, name: 'Apple Granny Smith', category: 'Fruits', price: '', lastUpdated: '', specification: 'Granny Smith' },
  { id: 81, name: 'Banana Lakatan', category: 'Fruits', price: '', lastUpdated: '', specification: 'Lakatan' },
  { id: 82, name: 'Banana Latundan', category: 'Fruits', price: '', lastUpdated: '', specification: 'Latundan' },
  { id: 83, name: 'Banana Saba', category: 'Fruits', price: '', lastUpdated: '', specification: 'Saba' },
  { id: 84, name: 'Mango Carabao', category: 'Fruits', price: '', lastUpdated: '', specification: 'Carabao' },
  { id: 85, name: 'Mango Indian', category: 'Fruits', price: '', lastUpdated: '', specification: 'Indian' },
  { id: 86, name: 'Mango Pico', category: 'Fruits', price: '', lastUpdated: '', specification: 'Pico' },
  { id: 87, name: 'Papaya', category: 'Fruits', price: '', lastUpdated: '', specification: 'Papaya' },
  { id: 88, name: 'Pineapple', category: 'Fruits', price: '', lastUpdated: '', specification: 'Pineapple' },
  { id: 89, name: 'Watermelon', category: 'Fruits', price: '', lastUpdated: '', specification: 'Watermelon' },
  { id: 90, name: 'Melon', category: 'Fruits', price: '', lastUpdated: '', specification: 'Melon' },
  { id: 91, name: 'Pomelo', category: 'Fruits', price: '', lastUpdated: '', specification: 'Pomelo' },
  { id: 92, name: 'Avocado', category: 'Fruits', price: '', lastUpdated: '', specification: 'Avocado' },

  // IX. OTHER BASIC COMMODITIES
  { id: 93, name: 'Sugar Brown', category: 'Basic Commodities', price: '', lastUpdated: '', specification: 'Brown' },
  { id: 94, name: 'Sugar White', category: 'Basic Commodities', price: '', lastUpdated: '', specification: 'White' },
  { id: 95, name: 'Sugar Refined', category: 'Basic Commodities', price: '', lastUpdated: '', specification: 'Refined' },
  { id: 96, name: 'Sugar Washed', category: 'Basic Commodities', price: '', lastUpdated: '', specification: 'Washed' },
  { id: 97, name: 'Salt', category: 'Basic Commodities', price: '', lastUpdated: '', specification: 'Salt' },
  { id: 98, name: 'Cooking Oil Palm', category: 'Basic Commodities', price: '', lastUpdated: '', specification: 'Palm' },
  { id: 99, name: 'Cooking Oil Coconut', category: 'Basic Commodities', price: '', lastUpdated: '', specification: 'Coconut' },
  { id: 100, name: 'Cooking Oil Canola', category: 'Basic Commodities', price: '', lastUpdated: '', specification: 'Canola' },
];
