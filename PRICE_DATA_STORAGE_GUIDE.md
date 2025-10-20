# Price Data Storage Guide

This guide explains how to store and manage the provided JSON price data in AsyncStorage for the AgriAssist application.

## Overview

The price data storage system allows you to store, retrieve, and manage agricultural commodity price data in AsyncStorage. The system includes comprehensive price information for various commodities including rice, corn, livestock, fish, vegetables, fruits, spices, and other commodities.

## Data Structure

The stored price data follows this structure:

```typescript
{
  metadata: {
    storedAt: string,        // ISO timestamp when data was stored
    dataSource: string,      // Source of the data (e.g., 'provided_json_data')
    recordCount: number,     // Number of price records
    version: string          // Data version
  },
  data: [
    {
      Commodity: string,     // Commodity category (e.g., "KADIWA RICE-FOR-ALL")
      Type: string,          // Specific type (e.g., "Premium (RFA5)")
      Specification: string | null, // Additional specifications
      Amount: number,        // Price amount
      Date: string          // ISO date string
    }
  ]
}
```

## How to Store the Price Data

### Method 1: Admin Panel (Recommended)

1. Open the AgriAssist app
2. Log in as an admin user
3. Navigate to the Admin panel
4. On the home screen, you'll see the new price data management tools:
   - **Store Price Data** - Save the JSON data to AsyncStorage
   - **View Price Data** - Check what price data is currently stored
5. Tap "Store Price Data" and confirm the action

### Method 2: Programmatic Usage

```typescript
import { 
  storeProvidedPriceData, 
  storeCustomPriceData, 
  getPriceData,
  storePriceData 
} from '../lib/storageUtils';

// Store the provided JSON data
await storeProvidedPriceData();

// Store custom price data
const customData = [
  {
    "Commodity": "CUSTOM RICE",
    "Type": "Premium",
    "Specification": null,
    "Amount": 50.0,
    "Date": "2025-01-01T00:00:00"
  }
];
await storeCustomPriceData(customData, 'custom_source');

// Retrieve stored data
const storedData = await getPriceData();
if (storedData) {
  console.log(`Found ${storedData.data.length} records`);
  console.log(`Stored on: ${storedData.metadata.storedAt}`);
}
```

### Method 3: Standalone Script

Run the standalone script to store data directly:

```bash
node scripts/storePriceData.js
```

## Available Functions

### `storeProvidedPriceData()`
Stores the complete JSON price data from the data file.

### `storeCustomPriceData(priceData, dataSource)`
Stores custom price data with a specified source.

### `storePriceData(priceData, dataSource)`
Low-level function to store any price data array.

### `getPriceData()`
Retrieves stored price data with metadata.

## Data Categories Included

The stored data includes prices for:

- **Rice Products**: KADIWA RICE-FOR-ALL, IMPORTED COMMERCIAL RICE, LOCAL COMMERCIAL RICE
- **Corn Products**: White corn, Yellow sweet corn, Corn grits, etc.
- **Livestock & Poultry**: Beef, pork, chicken, eggs (various sizes)
- **Fish Products**: Milkfish, tilapia, galunggong, sardines, squid
- **Highland Vegetables**: Bell peppers, broccoli, cabbage, carrots, etc.
- **Lowland Vegetables**: Ampalaya, string beans, eggplant, tomatoes, etc.
- **Fruits**: Calamansi, bananas, mangoes, avocados, melons, etc.
- **Spices**: Onions, garlic, ginger, chili
- **Other Commodities**: Sugar, palm oil, coconut oil

## Storage Key

The price data is stored under the key: `price_data_v1`

## Usage Examples

### Check if Price Data Exists

```typescript
import { getPriceData } from '../lib/storageUtils';

const checkPriceData = async () => {
  const priceData = await getPriceData();
  if (priceData) {
    console.log(`✅ Price data found: ${priceData.data.length} records`);
    console.log(`📅 Stored: ${priceData.metadata.storedAt}`);
  } else {
    console.log('❌ No price data found');
  }
};
```

### Filter Data by Commodity

```typescript
const getRicePrices = async () => {
  const priceData = await getPriceData();
  if (priceData) {
    const ricePrices = priceData.data.filter(
      item => item.Commodity.includes('RICE')
    );
    console.log(`Found ${ricePrices.length} rice price records`);
  }
};
```

### Get Latest Prices by Date

```typescript
const getLatestPrices = async () => {
  const priceData = await getPriceData();
  if (priceData) {
    // Group by commodity and get latest price for each
    const latestPrices = {};
    priceData.data.forEach(item => {
      const key = `${item.Commodity}-${item.Type}`;
      if (!latestPrices[key] || new Date(item.Date) > new Date(latestPrices[key].Date)) {
        latestPrices[key] = item;
      }
    });
    return Object.values(latestPrices);
  }
  return [];
};
```

## Integration with Existing Systems

The price data can be integrated with:

- **Price Monitoring**: Display current prices from stored data
- **Analytics**: Analyze price trends over time
- **Reporting**: Generate price reports for farmers
- **Forecasting**: Use historical data for price predictions

## Error Handling

All functions include comprehensive error handling:

```typescript
try {
  await storeProvidedPriceData();
  console.log('✅ Data stored successfully');
} catch (error) {
  console.error('❌ Error storing data:', error);
  // Handle error appropriately
}
```

## Performance Considerations

- The complete dataset contains hundreds of price records
- Storage operations are asynchronous and non-blocking
- Data is stored as JSON string in AsyncStorage
- Consider data size limits on older devices

## Troubleshooting

### Common Issues

1. **Data not storing**: Check AsyncStorage permissions and available space
2. **Import errors**: Ensure the data file path is correct
3. **Memory issues**: Large datasets may cause memory issues on older devices

### Debug Information

Use the storage info function to debug:

```typescript
import { getAsyncStorageInfo } from '../lib/storageUtils';

const debugStorage = async () => {
  const info = await getAsyncStorageInfo();
  console.log('Storage info:', info);
};
```

## Files Modified

- `lib/storageUtils.ts` - Core storage functions
- `app/admin.tsx` - Admin UI integration
- `data/priceData.json` - Price data file
- `scripts/storePriceData.js` - Standalone storage script

## Next Steps

1. Store the price data using one of the methods above
2. Integrate the data with your price monitoring features
3. Create analytics and reporting features using the stored data
4. Consider implementing data updates and synchronization









