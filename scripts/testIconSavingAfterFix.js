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

async function testIconSavingAfterFix() {
  try {
    console.log('🧪 Testing Icon Saving After Firestore Rules Fix...');
    console.log('');
    console.log('ℹ️ This test assumes the Firestore security rules have been updated');
    console.log('ℹ️ If you see permission errors, the rules need to be fixed first');
    console.log('');
    
    // Test with admin account first (should always work)
    const adminEmail = 'agriassistme@gmail.com';
    const adminPassword = 'AAadmin';
    
    console.log('🔐 Step 1: Testing with admin account');
    
    try {
      const adminCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUser = adminCredential.user;
      
      console.log('✅ Admin login successful');
      console.log('🆔 Admin User ID:', adminUser.uid);
      
      // Test admin icon saving
      const adminIconData = {
        selectedCropIcon: 'corn',
        selectedCropEmoji: '🌽',
        selectedCropName: 'Corn'
      };
      
      console.log('📝 Testing admin icon save:', adminIconData);
      
      await setDoc(doc(db, 'users', adminUser.uid), adminIconData, { merge: true });
      console.log('✅ Admin icon save successful');
      
      // Verify the save
      const adminDoc = await getDoc(doc(db, 'users', adminUser.uid));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        console.log('📋 Admin profile after save:');
        console.log('   Selected Crop Icon:', adminData.selectedCropIcon);
        console.log('   Selected Crop Emoji:', adminData.selectedCropEmoji);
        console.log('   Selected Crop Name:', adminData.selectedCropName);
      }
      
    } catch (error) {
      console.log('❌ Admin test failed:', error.message);
    }
    
    console.log('');
    console.log('🔐 Step 2: Testing with regular user account');
    console.log('ℹ️ Note: This will only work if Firestore rules are fixed');
    
    // Test with a regular user (you'll need to provide real credentials)
    const testUserEmail = 'test@example.com';
    const testUserPassword = 'testpass123';
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, testUserEmail, testUserPassword);
      const user = userCredential.user;
      
      console.log('✅ User login successful');
      console.log('🆔 User ID:', user.uid);
      
      // Test user icon saving
      const userIconData = {
        selectedCropIcon: 'tomato',
        selectedCropEmoji: '🍅',
        selectedCropName: 'Tomato'
      };
      
      console.log('📝 Testing user icon save:', userIconData);
      
      await setDoc(doc(db, 'users', user.uid), userIconData, { merge: true });
      console.log('✅ User icon save successful - Firestore rules are working!');
      
      // Verify the save
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📋 User profile after save:');
        console.log('   Selected Crop Icon:', userData.selectedCropIcon);
        console.log('   Selected Crop Emoji:', userData.selectedCropEmoji);
        console.log('   Selected Crop Name:', userData.selectedCropName);
      }
      
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        console.log('❌ User login failed - invalid credentials');
        console.log('ℹ️ This is expected if the test credentials are wrong');
      } else if (error.code === 'permission-denied') {
        console.log('❌ Permission denied - Firestore rules still need to be fixed');
        console.log('🔍 Go to Firebase Console → Firestore → Rules');
        console.log('🔍 Update rules to allow users to write to their own documents');
      } else {
        console.log('❌ User test failed:', error.message);
        console.log('❌ Error code:', error.code);
      }
    }
    
    console.log('');
    console.log('🎉 Icon Saving Test Results:');
    console.log('');
    console.log('📋 What to check:');
    console.log('   ✅ Admin icon saving should work (always)');
    console.log('   ✅ User icon saving should work (if rules are fixed)');
    console.log('   ✅ No permission denied errors');
    console.log('');
    console.log('🔧 If you see permission errors:');
    console.log('   1. Go to Firebase Console');
    console.log('   2. Navigate to Firestore Database → Rules');
    console.log('   3. Update rules to allow users to write to their own documents');
    console.log('   4. See firestoreRulesFix.md for exact rules to use');
    console.log('');
    console.log('🎯 Expected behavior after fix:');
    console.log('   ✅ Users can change their profile icons');
    console.log('   ✅ Icon changes persist after logout/login');
    console.log('   ✅ Icon changes are visible in admin messages');
    console.log('   ✅ No more permission denied errors');
    
  } catch (error) {
    console.error('❌ Icon saving test failed:', error);
  }
}

// Run the test
testIconSavingAfterFix()
  .then(() => {
    console.log('✅ Icon saving test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
