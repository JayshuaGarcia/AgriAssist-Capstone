// Import Firebase functions directly
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADEKzk_kDQ1vpfqh1m2AySD8W5PMNYnMA",
  authDomain: "database-agriassist.firebaseapp.com",
  projectId: "database-agriassist",
  storageBucket: "database-agriassist.firebasestorage.app",
  messagingSenderId: "674451705550",
  appId: "1:674451705550:web:5c552038c82aceca580a9f",
  measurementId: "G-MYX7KTKYKV"
};

// Initialize Firebase with error handling
let app, auth, db, storage;

try {
  // Check if Firebase app is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } else {
    app = getApps()[0];
    console.log('Firebase app already initialized, using existing instance');
  }

  // Initialize Firebase Auth with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Firebase auth initialized successfully');
  } catch (authError: any) {
    console.log('Auth initialization failed, trying getAuth instead:', authError.message);
    try {
      // Try using getAuth instead of initializeAuth
      auth = getAuth(app);
      console.log('Firebase auth initialized with getAuth successfully');
    } catch (getAuthError: any) {
      console.log('getAuth also failed, using fallback auth:', getAuthError.message);
      // Create fallback auth object
      auth = {
        currentUser: null,
        onAuthStateChanged: () => () => {},
        signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase Auth not available')),
        createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase Auth not available')),
        signOut: () => Promise.resolve(),
        updateProfile: () => Promise.resolve(),
        updatePassword: () => Promise.resolve(),
        reauthenticateWithCredential: () => Promise.resolve(),
      };
    }
  }

  // Initialize Firestore - this is critical for database operations
  db = getFirestore(app);
  console.log('Firestore initialized successfully');
  
  // Verify Firestore is properly initialized
  const firestoreCheck = {
    type: typeof db,
    constructor: db?.constructor?.name,
    hasCollection: typeof db?.collection === 'function',
    hasDoc: typeof db?.doc === 'function',
    isFirestore: db?.constructor?.name === 'Firestore'
  };
  
  console.log('Firestore instance details:', firestoreCheck);
  
  // If Firestore is not properly initialized, try alternative approach
  if (!firestoreCheck.isFirestore || !firestoreCheck.hasCollection || !firestoreCheck.hasDoc) {
    console.warn('⚠️ Firestore not properly initialized, trying alternative approach...');
    try {
      // Try to reinitialize Firestore
      db = getFirestore(app);
      console.log('✅ Firestore reinitialized successfully');
    } catch (firestoreError) {
      console.error('❌ Firestore reinitialization failed:', firestoreError);
    }
  }

  // Initialize Firebase Storage
  storage = getStorage(app);
  console.log('Firebase storage initialized successfully');

  // Log Firebase initialization
  console.log('Firebase initialized in lib/firebase.ts:', {
    app: !!app,
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    projectId: firebaseConfig.projectId,
    dbType: typeof db,
    dbConstructor: db?.constructor?.name,
    hasCollection: typeof db?.collection === 'function',
    hasDoc: typeof db?.doc === 'function'
  });

} catch (error) {
  console.error('Firebase initialization failed:', error);

  // Create fallback objects to prevent app crashes
  app = null;
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not available')),
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not available')),
    signOut: () => Promise.resolve(),
    updateProfile: () => Promise.resolve(),
    updatePassword: () => Promise.resolve(),
    reauthenticateWithCredential: () => Promise.resolve(),
  };

  db = {
    collection: () => {
      console.warn('Firebase not available - using fallback');
      return {
        doc: () => ({
          get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
          set: () => Promise.resolve(),
        }),
        getDocs: () => Promise.resolve({ docs: [] }),
      };
    },
    doc: () => ({
      get: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
      set: () => Promise.resolve(),
    }),
  };

  storage = {
    ref: () => ({
      get: () => Promise.resolve({ exists: () => false, val: () => null }),
      set: () => Promise.resolve(),
    }),
  };
}

export { auth, db, storage };


