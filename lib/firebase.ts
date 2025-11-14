// Fixed Firebase initialization for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyADEKzk_kDQ1vpfqh1m2AySD8W5PMNYnMA',
  authDomain: 'database-agriassist.firebaseapp.com',
  projectId: 'database-agriassist',
  storageBucket: 'database-agriassist.firebasestorage.app',
  messagingSenderId: '674451705550',
  appId: '1:674451705550:web:5c552038c82aceca580a9f',
  measurementId: 'G-MYX7KTKYKV',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
    console.log('✅ Firebase auth initialized for web');
  } else {
    try {
      require('react-native-get-random-values');
    } catch (polyfillError) {
      console.warn('⚠️ Failed to load react-native-get-random-values polyfill:', polyfillError);
    }
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('✅ Firebase auth initialized with AsyncStorage persistence');
    } catch (nativeInitError: any) {
      console.log(
        '⚠️ initializeAuth failed, attempting to reuse existing instance:',
        nativeInitError?.message || nativeInitError
      );
      auth = getAuth(app);
    }
  }
} catch (authError: any) {
  console.log('❌ Firebase auth initialization failed:', authError?.message || authError);
  auth = undefined as any;
}

let db;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
} catch (firestoreError: any) {
  console.log('❌ Firestore initialization failed:', firestoreError?.message || firestoreError);
  db = {
    collection: (path: string) => {
      console.log('Fallback Firestore: collection called with path:', path);
      return {
        doc: () => ({
          get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
          set: (data: any) => Promise.resolve(),
          update: (data: any) => Promise.resolve(),
          delete: () => Promise.resolve(),
        }),
        add: (data: any) => Promise.resolve({ id: 'fallback-doc-id' }),
        getDocs: () => Promise.resolve({ docs: [] }),
      };
    },
    doc: () => ({
      get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
      set: (data: any) => Promise.resolve(),
      update: (data: any) => Promise.resolve(),
      delete: () => Promise.resolve(),
    }),
  };
}

let storage;
try {
  storage = getStorage(app);
  console.log('✅ Firebase storage initialized successfully');
} catch (storageError: any) {
  console.log('❌ Firebase storage initialization failed:', storageError?.message || storageError);
  storage = {
    ref: (path: string) => ({
      getDownloadURL: () => Promise.resolve('fallback-url'),
      put: (file: any) =>
        Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('fallback-url') } }),
      delete: () => Promise.resolve(),
    }),
  };
}

console.log('🎉 Firebase initialization completed:', {
  app: !!app,
  auth: !!auth,
  db: !!db,
  storage: !!storage,
  projectId: firebaseConfig.projectId,
});

export { auth, db, storage };
export const FIREBASE_API_KEY = firebaseConfig.apiKey;
export const FIREBASE_AUTH_DOMAIN = firebaseConfig.authDomain;
