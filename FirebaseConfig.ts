// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from 'react-native';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyADEKzk_kDQ1vpfqh1m2AySD8W5PMNYnMA",
  authDomain: "database-agriassist.firebaseapp.com",
  projectId: "database-agriassist",
  storageBucket: "database-agriassist.firebasestorage.app",
  messagingSenderId: "674451705550",
  appId: "1:674451705550:web:5c552038c82aceca580a9f",
  measurementId: "G-MYX7KTKYKV"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Add this line to initialize and export the Realtime Database
export const database = getDatabase(app);

let auth;
if (
  Platform.OS !== 'web' &&
  typeof global !== 'undefined' &&
  !global.nativeCallSyncHook // Not Expo Go
) {
  // Dynamically require only in supported environments
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  // Expo Go or web
  auth = getAuth(app);
}

export { auth };

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export default app; 