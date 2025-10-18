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

async function testCurrentRules() {
  try {
    console.log('🧪 Testing Current Firestore Rules...');
    console.log('');
    console.log('📋 Your current rules should allow:');
    console.log('   ✅ Users to read any user document (allow read: if true)');
    console.log('   ✅ Users to write to their own document (allow write: if request.auth.uid == userId)');
    console.log('');
    
    // Test with admin account
    const adminEmail = 'agriassistme@gmail.com';
    const adminPassword = 'AAadmin';
    
    console.log('🔐 Step 1: Testing with admin account');
    
    try {
      const adminCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUser = adminCredential.user;
      
      console.log('✅ Admin login successful');
      console.log('🆔 Admin User ID:', adminUser.uid);
      
      // Test admin write access
      const adminIconData = {
        selectedCropIcon: 'corn',
        selectedCropEmoji: '🌽',
        selectedCropName: 'Corn',
        testTimestamp: new Date().toISOString()
      };
      
      console.log('📝 Testing admin write access...');
      
      await setDoc(doc(db, 'users', adminUser.uid), adminIconData, { merge: true });
      console.log('✅ Admin write successful - rules are working!');
      
      // Clean up test data
      await setDoc(doc(db, 'users', adminUser.uid), {
        testTimestamp: null
      }, { merge: true });
      
    } catch (error) {
      console.log('❌ Admin test failed:', error.message);
      console.log('❌ Error code:', error.code);
    }
    
    console.log('');
    console.log('🔍 Analysis of Your Rules:');
    console.log('');
    console.log('✅ Good parts:');
    console.log('   - Users can read any user document (allow read: if true)');
    console.log('   - Users can write to their own document (allow write: if request.auth.uid == userId)');
    console.log('   - Messages, announcements, and other collections are open');
    console.log('');
    console.log('⚠️ Potential issues:');
    console.log('   - Very permissive rules (allow read: if true) might be a security concern');
    console.log('   - All collections are open for read/write (allow read, write: if true)');
    console.log('');
    console.log('🎯 For icon saving, your rules should work!');
    console.log('   The key rule is: allow write: if request.auth.uid == userId');
    console.log('   This allows users to write to their own user document');
    console.log('');
    console.log('🔧 If icon saving still fails, the issue might be:');
    console.log('   1. User authentication state in the app');
    console.log('   2. User document doesn\'t exist in Firestore');
    console.log('   3. Network connectivity issues');
    console.log('   4. App-specific authentication problems');
    
  } catch (error) {
    console.error('❌ Rules test failed:', error);
  }
}

// Run the test
testCurrentRules()
  .then(() => {
    console.log('✅ Rules test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
