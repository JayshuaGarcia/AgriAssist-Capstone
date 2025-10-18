const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function debugSpecificUser() {
  try {
    console.log('🔍 Debugging Specific User Issue...');
    console.log('');
    console.log('📋 From your error log:');
    console.log('   User ID: PvhrNQAApaeCwkYRbzsO2ZHesXB2');
    console.log('   Error: Missing or insufficient permissions');
    console.log('');
    
    // Check if the user document exists
    console.log('🔍 Step 1: Checking if user document exists');
    
    const userId = 'PvhrNQAApaeCwkYRbzsO2ZHesXB2';
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User document exists');
      console.log('📋 User data:', userData);
      console.log('📧 Email:', userData.email);
      console.log('👤 Name:', userData.name);
      console.log('🔑 Role:', userData.role);
    } else {
      console.log('❌ User document does not exist');
      console.log('🔍 This might be why the user cannot write to it');
      console.log('🔍 The user needs to have a document in Firestore first');
    }
    
    console.log('');
    console.log('🔍 Step 2: Testing write access with admin account');
    
    // Test if admin can write to this user's document
    try {
      const adminEmail = 'agriassistme@gmail.com';
      const adminPassword = 'AAadmin';
      
      const adminCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUser = adminCredential.user;
      
      console.log('✅ Admin login successful');
      console.log('🆔 Admin User ID:', adminUser.uid);
      
      // Try to write to the specific user's document as admin
      console.log('📝 Testing admin write to user document...');
      
      await setDoc(doc(db, 'users', userId), {
        testAdminWrite: 'admin_test_value',
        testAdminTimestamp: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Admin can write to user document');
      
      // Clean up
      await setDoc(doc(db, 'users', userId), {
        testAdminWrite: null,
        testAdminTimestamp: null
      }, { merge: true });
      
    } catch (error) {
      console.log('❌ Admin write test failed:', error.message);
    }
    
    console.log('');
    console.log('🎯 Analysis and Recommendations:');
    console.log('');
    
    if (userDoc.exists()) {
      console.log('✅ User document exists - rules should work');
      console.log('🔍 The permission error might be due to:');
      console.log('   1. User not being properly authenticated in the app');
      console.log('   2. User ID mismatch between auth and Firestore');
      console.log('   3. App-specific authentication issues');
      console.log('');
      console.log('🔧 Recommended fixes:');
      console.log('   1. Check if user is properly logged in when changing icon');
      console.log('   2. Verify user.uid matches the document ID');
      console.log('   3. Add more logging to see the exact user state');
    } else {
      console.log('❌ User document does not exist');
      console.log('🔍 This is likely the root cause of the permission error');
      console.log('');
      console.log('🔧 Recommended fixes:');
      console.log('   1. Create the user document in Firestore');
      console.log('   2. Ensure user signup creates a Firestore document');
      console.log('   3. Check if user registration is working properly');
    }
    
    console.log('');
    console.log('📋 Your Firestore rules are correct and should work');
    console.log('   The issue is likely with user document existence or authentication state');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugSpecificUser()
  .then(() => {
    console.log('✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
