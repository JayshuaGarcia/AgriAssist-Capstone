# Firestore Rules Setup Guide

## Problem
The admin is getting "Missing or insufficient permissions" errors when trying to access planting and harvest reports.

## Solution
You need to update your Firestore security rules to allow admins to read the reports collections.

## Method 1: Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `database-agriassist`

2. **Navigate to Firestore**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab

3. **Update the Rules**
   - Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow admins to read all user documents
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow users to read and write their own planting reports
    match /plantingReports/{reportId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Allow admins to read all planting reports
    match /plantingReports/{reportId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow users to read and write their own harvest reports
    match /harvestReports/{reportId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Allow admins to read all harvest reports
    match /harvestReports/{reportId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read announcements
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow users to read and write their own messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || resource.data.receiverId == request.auth.uid);
      allow create: if request.auth != null && 
        (request.resource.data.senderId == request.auth.uid || request.resource.data.receiverId == request.auth.uid);
    }
    
    // Allow admins to read all messages
    match /messages/{messageId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow users to read and write their own userEmails
    match /userEmails/{emailId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Allow admins to read all userEmails
    match /userEmails/{emailId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

4. **Publish the Rules**
   - Click "Publish" button
   - Wait for the rules to be deployed

## Method 2: Firebase CLI (Alternative)

If you have Firebase CLI installed:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## What These Rules Do

### For Users:
- Can read/write their own user document
- Can create and read their own planting/harvest reports
- Can read announcements
- Can send/receive messages

### For Admins:
- Can read all user documents
- Can read all planting reports from all users
- Can read all harvest reports from all users
- Can read all messages
- Can create announcements
- Can read all userEmails

## Testing

After updating the rules:

1. **Test as Admin**:
   - Login as an admin user
   - Try accessing the Planting Records and Harvest Records tools
   - Should now work without permission errors

2. **Test as Regular User**:
   - Login as a regular farmer
   - Should still be able to submit reports
   - Should only see their own data

## Troubleshooting

If you still get permission errors:

1. **Check Admin Role**: Make sure your admin user has `role: 'admin'` in their user document
2. **Check Authentication**: Make sure the user is properly authenticated
3. **Check Rules Deployment**: Make sure the rules were successfully published
4. **Check Collection Names**: Make sure the collection names match exactly (`plantingReports`, `harvestReports`)

## Security Note

These rules ensure that:
- Users can only access their own data
- Admins can access all data for management purposes
- All operations require authentication
- Data is properly isolated between users

