# AsyncStorage Clearing Guide

This guide explains how to clear all data from AsyncStorage in the AgriAssist application.

## What Gets Cleared

The AsyncStorage clearing functionality will remove ALL locally stored data, including:

- **Farmer Form Data** (`farmerFormData_${userId}`) - All farmer profile and form submissions
- **Password Reset Data** (`password_reset_${userId}`) - Temporary password reset tokens
- **Changed Password Data** (`changed_password_${userId}`) - Password change tokens
- **Price Records** (`local_price_records_v1`) - Local price monitoring data
- **Announcements** (`announcements`) - Local announcement cache
- **Firebase Auth Data** - Authentication persistence data
- **Any Other Stored Data** - All other keys in AsyncStorage

## How to Clear AsyncStorage

### Method 1: Admin Panel (Recommended)

1. Open the AgriAssist app
2. Log in as an admin user
3. Navigate to the Admin panel
4. On the home screen, you'll see two new storage management tools:
   - **Storage Info** - View details about what's stored locally
   - **Clear Storage** - Remove all local data (with confirmation dialog)
5. Tap "Clear Storage" and confirm the action

### Method 2: Programmatic Usage

Import and use the utility functions in your code:

```typescript
import { 
  clearAllAsyncStorageData, 
  clearAsyncStorageWithConfirmation, 
  getAsyncStorageInfo 
} from '../lib/storageUtils';

// Clear all data with confirmation and logging
await clearAsyncStorageWithConfirmation();

// Clear all data directly
await clearAllAsyncStorageData();

// Get information about stored data
const info = await getAsyncStorageInfo();
console.log('Storage info:', info);
```

### Method 3: Standalone Script (Development)

For development and testing purposes, you can run the standalone script:

```bash
node scripts/clearAsyncStorage.js
```

## Important Notes

⚠️ **Warning**: Clearing AsyncStorage will remove ALL locally stored data. This action cannot be undone.

- Users will need to log in again after clearing
- All form data will be lost
- Local cache will be cleared
- The app will behave as if it's being used for the first time

## When to Use

Use AsyncStorage clearing when:

- **Development/Testing**: Reset the app to a clean state
- **Debugging**: Clear corrupted or problematic data
- **User Support**: Help users experiencing storage-related issues
- **Data Privacy**: Ensure no local data remains on the device
- **App Reset**: Allow users to start fresh with the application

## Storage Information

The `getAsyncStorageInfo()` function provides detailed information about what's stored:

```typescript
{
  totalKeys: 15,
  keys: ['farmerFormData_user123', 'announcements', ...],
  dataTypes: {
    farmerFormData: 5,
    passwordReset: 2,
    priceRecords: 1,
    announcements: 1,
    firebase: 3,
    other: 3
  }
}
```

## Files Modified

- `lib/storageUtils.ts` - Main utility functions
- `app/admin.tsx` - Admin UI integration
- `scripts/clearAsyncStorage.js` - Standalone script

## Safety Features

- Confirmation dialog before clearing
- Detailed logging of what's being cleared
- Verification that storage is actually cleared
- Error handling for failed operations
- Non-destructive info viewing option
