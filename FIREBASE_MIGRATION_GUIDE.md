# Firebase Migration Guide

This guide explains how to migrate from static commodity data to Firebase Firestore for real-time price monitoring.

## Overview

The application has been updated to use Firebase Firestore instead of static data and local storage. This provides:

- **Real-time updates**: Prices update automatically across all devices
- **Centralized data management**: All commodity and price data stored in Firebase
- **Scalable architecture**: Easy to add new commodities and manage large datasets
- **Admin management**: Admins can add/update prices directly through Firebase

## Firebase Schema

### Collections

#### 1. `commodities`
Stores all commodity information:
```typescript
{
  id: string;
  name: string;
  category: string;
  unit: string;
  type?: string;
  specification?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

#### 2. `prices`
Stores price history and current prices:
```typescript
{
  id: string;
  commodityId: string;
  commodityName: string;
  category: string;
  price: number;
  unit: string;
  type?: string;
  specification?: string;
  source: string; // 'admin', 'api', 'manual'
  date: Timestamp;
  location?: string;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
}
```

#### 3. `categories`
Stores category information with emojis:
```typescript
{
  id: string;
  name: string;
  emoji: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Migration Steps

### 1. Run the Migration Script

```bash
# Make sure you have your Firebase config in .env
node scripts/runMigration.mjs
```

### 2. Verify Migration

Check your Firebase console to ensure:
- All commodities are imported
- Categories are created with proper emojis
- Sample prices are added

### 3. Update Firebase Rules

Update your Firestore rules to allow read/write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all users
    match /{document=**} {
      allow read: if true;
    }
    
    // Allow write access only to authenticated users
    match /commodities/{document} {
      allow write: if request.auth != null;
    }
    
    match /prices/{document} {
      allow write: if request.auth != null;
    }
    
    match /categories/{document} {
      allow write: if request.auth != null;
    }
  }
}
```

## New Features

### Real-time Updates
- Prices update automatically when changed in Firebase
- No need to manually refresh the app
- Changes appear instantly across all devices

### Admin Management
- Admins can add new commodities through the interface
- Price updates are stored with source tracking
- Full audit trail of all changes

### Enhanced Data Structure
- Better categorization with emojis
- Detailed product specifications
- Price history tracking
- Source attribution for all prices

## API Usage

### Hooks Available

```typescript
// Get commodities with latest prices (real-time)
const { data, loading, error } = useRealtimeCommoditiesWithPrices();

// Get categories
const { categories } = useCategories();

// Manage commodities (admin)
const { addCommodity, updateCommodity, deleteCommodity } = useCommodityManagement();

// Manage prices (admin)
const { addPrice, bulkImportPrices } = usePriceManagement();
```

### Service Functions

```typescript
// Add new commodity
await FirebaseCommodityService.addCommodity({
  name: 'New Product',
  category: 'FRUITS',
  unit: 'kg',
  isActive: true,
  createdBy: 'admin-user-id'
});

// Add new price
await FirebasePriceService.addPrice({
  commodityId: 'commodity-id',
  commodityName: 'Product Name',
  category: 'FRUITS',
  price: 50.00,
  unit: 'kg',
  source: 'admin',
  date: Timestamp.now(),
  createdBy: 'admin-user-id'
});
```

## Troubleshooting

### Common Issues

1. **Migration fails**: Check Firebase config and permissions
2. **Real-time updates not working**: Verify Firestore rules allow read access
3. **Admin functions not working**: Check authentication and write permissions

### Debug Steps

1. Check Firebase console for data
2. Verify environment variables
3. Check network connectivity
4. Review Firestore rules

## Benefits

- **Performance**: Faster loading with optimized queries
- **Reliability**: Data backed up in Firebase
- **Scalability**: Easy to add new features
- **Maintenance**: Centralized data management
- **Analytics**: Built-in Firebase analytics

## Next Steps

1. Set up Firebase Analytics for usage tracking
2. Implement push notifications for price alerts
3. Add data export functionality
4. Create admin dashboard for bulk operations
5. Implement price forecasting with historical data

