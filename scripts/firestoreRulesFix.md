# Firestore Security Rules Fix

## Problem
Users are getting "Missing or insufficient permissions" errors when trying to update their profile data, including icon changes.

## Root Cause
The Firestore security rules are not allowing users to write to their own documents in the `users` collection.

## Solution
Update the Firestore security rules in the Firebase Console to allow users to read and write their own documents.

## Steps to Fix

### 1. Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `database-agriassist`
3. Go to **Firestore Database** → **Rules**

### 2. Update Security Rules
Replace the current rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read and write their own messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.receiverId);
    }
    
    // Allow users to read and write their own activities
    match /users/{userId}/activities/{activityId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow admin to read all documents
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 3. Publish Rules
1. Click **Publish** to save the new rules
2. Wait for the rules to be deployed (usually takes a few seconds)

### 4. Test the Fix
After updating the rules, test icon changes in the app:
1. Login with a regular user account
2. Go to Privacy & Security
3. Change the profile icon
4. Check the console logs - should see "✅ Profile updated successfully in Firestore database"

## Alternative Rules (More Restrictive)
If you want more restrictive rules, use this version:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write messages they sent or received
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.receiverId);
    }
    
    // Users can read/write their own activities
    match /users/{userId}/activities/{activityId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Verification
After updating the rules, you can verify they work by:

1. **Test with regular user:**
   - Login with a regular user account
   - Try to change profile icon
   - Should see success message in console

2. **Test with admin:**
   - Login with admin account
   - Should be able to read all user documents
   - Should be able to write to any document

## Current Error
The current error shows:
```
ERROR ❌ Firestore update failed: [FirebaseError: Missing or insufficient permissions.]
```

This will be resolved once the security rules are updated to allow users to write to their own documents.

## Notes
- The rules use `request.auth.uid == userId` to ensure users can only access their own data
- Admin users can access all documents through the wildcard rule
- The rules are version 2 for better performance
- All rules require authentication (`request.auth != null`)
