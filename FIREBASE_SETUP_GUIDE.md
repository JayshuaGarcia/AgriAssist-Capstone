# Firebase Setup Guide for AgriAssist App

## Overview
This guide provides step-by-step instructions for setting up Firebase with your React Native/Expo app for agricultural data management.

## Prerequisites
- Firebase project created and configured
- Email/password authentication enabled in Firebase Console
- Firestore Database created
- Firebase Storage enabled (optional)

## Step 1: Firebase Configuration

### 1.1 FirebaseConfig.ts
Your `FirebaseConfig.ts` file is already configured with:
- Firebase App initialization
- Authentication with AsyncStorage persistence
- Firestore Database
- Firebase Storage

### 1.2 Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `database-agriassist`
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
4. Set up Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (for development)
   - Set security rules for production later

## Step 2: Database Structure

### Collections Created:
1. **farmers** - Farmer profiles and information
2. **crops** - Crop data and yields
3. **livestock** - Livestock inventory and health
4. **monitoring** - Field monitoring and observations

### Data Models:

#### Farmer
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  farmSize: number;
  crops: string[];
  livestock?: string[];
  registrationDate: Date;
  status: 'active' | 'inactive';
}
```

#### Crop Data
```typescript
{
  id: string;
  farmerId: string;
  cropName: string;
  plantingDate: Date;
  harvestDate?: Date;
  yield: number;
  area: number;
  status: 'planted' | 'growing' | 'harvested';
  notes?: string;
}
```

#### Livestock Data
```typescript
{
  id: string;
  farmerId: string;
  animalType: string;
  quantity: number;
  healthStatus: 'healthy' | 'sick' | 'vaccinated';
  lastVaccination?: Date;
  notes?: string;
}
```

## Step 3: XL Data Import Process

### 3.1 Supported File Formats
- Excel files (.xlsx, .xls)
- CSV files
- Files should be converted to CSV for processing

### 3.2 Expected Column Headers

#### Farmers File:
- `name` or `farmer_name` or `full_name`
- `email`
- `phone` or `contact` or `mobile`
- `location` or `address` or `area`
- `farm_size` or `area_hectares`
- `crops` or `crop_types`
- `livestock` or `animals`
- `registration_date` or `date_registered`

#### Crops File:
- `crop_name` or `crop` or `crop_type`
- `planting_date` or `date_planted`
- `harvest_date`
- `yield` or `production`
- `area` or `hectares`
- `status` or `crop_status`
- `notes` or `remarks`

#### Livestock File:
- `animal_type` or `livestock` or `animal`
- `quantity` or `count`
- `health_status` or `status`
- `last_vaccination`
- `notes` or `remarks`

### 3.3 Import Process
1. Navigate to "Import Data" tab in the app
2. Select your XL files (farmers, crops, livestock)
3. Click "Start Import"
4. Monitor the import progress and results
5. Check for any validation errors

## Step 4: Authentication Flow

### 4.1 User Registration
- Users can sign up with email and password
- Password must be at least 6 characters
- Email validation is handled by Firebase

### 4.2 User Login
- Users log in with email and password
- Authentication state is persisted using AsyncStorage
- Automatic redirect to main app after successful login

### 4.3 User Profile
- User profile information is stored locally
- Can be extended to store in Firestore

## Step 5: Data Management

### 5.1 Adding Data
```typescript
// Add a new farmer
const farmerId = await FirestoreService.addFarmer({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  location: 'Manila',
  farmSize: 5.0,
  crops: ['Rice', 'Corn'],
  status: 'active'
});

// Add crop data
await FirestoreService.addCropData({
  farmerId: farmerId,
  cropName: 'Rice',
  plantingDate: new Date(),
  yield: 2500,
  area: 2.0,
  status: 'growing'
});
```

### 5.2 Retrieving Data
```typescript
// Get all farmers
const farmers = await FirestoreService.getAllFarmers();

// Get crops by farmer
const crops = await FirestoreService.getCropsByFarmer(farmerId);

// Get farmers by location
const localFarmers = await FirestoreService.getFarmersByLocation('Manila');
```

### 5.3 Analytics
```typescript
// Get crop statistics
const stats = await FirestoreService.getCropStatistics();
console.log(`Total crops: ${stats.totalCrops}`);
console.log(`Total yield: ${stats.totalYield}`);
```

## Step 6: Testing

### 6.1 Sample Data
Use the `SampleDataService` to populate your database with test data:

```typescript
import { SampleDataService } from './services/sampleDataService';

// Populate with sample data
const result = await SampleDataService.populateSampleData();
console.log(`Added ${result.farmersAdded} farmers, ${result.cropsAdded} crops, ${result.livestockAdded} livestock`);
```

### 6.2 Testing Authentication
1. Create a test account using the signup screen
2. Test login with the created credentials
3. Verify authentication state persistence
4. Test logout functionality

## Step 7: Security Rules (Production)

### 7.1 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /farmers/{farmerId} {
      allow read, write: if request.auth != null && request.auth.uid == farmerId;
    }
    
    match /crops/{cropId} {
      allow read, write: if request.auth != null;
    }
    
    match /livestock/{livestockId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7.2 Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 8: Troubleshooting

### 8.1 Common Issues

#### Authentication Errors
- Verify email/password authentication is enabled in Firebase Console
- Check if user exists in Firebase Authentication
- Ensure password meets minimum requirements

#### Import Errors
- Verify file format (CSV recommended)
- Check column headers match expected format
- Ensure data validation passes
- Check Firebase connection and permissions

#### Database Errors
- Verify Firestore is enabled in Firebase Console
- Check security rules allow read/write operations
- Ensure proper data types (dates, numbers)

### 8.2 Debug Mode
Enable debug logging by adding to your app:

```typescript
// In development only
if (__DEV__) {
  console.log('Firebase Debug Mode Enabled');
}
```

## Step 9: Production Deployment

### 9.1 Environment Variables
- Store Firebase config in environment variables
- Use different Firebase projects for dev/staging/prod
- Implement proper error handling and logging

### 9.2 Performance Optimization
- Implement pagination for large datasets
- Use Firebase offline persistence
- Optimize queries with proper indexing
- Implement data caching strategies

### 9.3 Monitoring
- Set up Firebase Analytics
- Monitor Firestore usage and costs
- Implement error tracking
- Set up alerts for critical issues

## Step 10: Next Steps

### 10.1 Features to Add
- Real-time data synchronization
- Offline data support
- Advanced analytics and reporting
- Image upload for field monitoring
- Push notifications for alerts

### 10.2 Integration Opportunities
- Weather API integration
- Market price APIs
- Government agricultural databases
- IoT sensor data integration

## Support

For issues or questions:
1. Check Firebase documentation
2. Review error logs in Firebase Console
3. Test with sample data first
4. Verify network connectivity
5. Check Firebase project settings

---

**Note**: This setup is configured for development. Remember to update security rules and implement proper error handling before production deployment. 