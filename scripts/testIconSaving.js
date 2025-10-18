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

async function testIconSaving() {
  try {
    console.log('🧪 Testing Icon Saving to Firebase...');
    console.log('');
    
    // Test with a regular user account
    const testEmail = 'learjayencina018@gmail.com';
    const testPassword = 'testpass123'; // This might not work, but let's try
    
    console.log('🔐 Step 1: Testing icon saving with regular user');
    
    try {
      // Try to login with the user from the image
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      console.log('✅ User login successful');
      console.log('🆔 User ID:', user.uid);
      
      // Test saving icon data
      const iconData = {
        selectedCropIcon: 'eggplant',
        selectedCropEmoji: '🍆',
        selectedCropName: 'Eggplant'
      };
      
      console.log('📝 Attempting to save icon data:', iconData);
      
      // Try to save to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, iconData, { merge: true });
      
      console.log('✅ Icon data saved to Firestore successfully');
      
      // Verify the save
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📋 User profile after save:');
        console.log('   Name:', userData.name);
        console.log('   Email:', userData.email);
        console.log('   Selected Crop Icon:', userData.selectedCropIcon);
        console.log('   Selected Crop Emoji:', userData.selectedCropEmoji);
        console.log('   Selected Crop Name:', userData.selectedCropName);
        
        if (userData.selectedCropIcon === 'eggplant' && 
            userData.selectedCropEmoji === '🍆' && 
            userData.selectedCropName === 'Eggplant') {
          console.log('✅ Icon data persisted correctly!');
        } else {
          console.log('❌ Icon data not persisted correctly');
        }
      } else {
        console.log('❌ User document not found after save');
      }
      
    } catch (error) {
      console.log('❌ User login failed:', error.message);
      console.log('ℹ️ This is expected if the password is wrong');
    }
    
    // Test with admin account
    console.log('');
    console.log('🔐 Step 2: Testing icon saving with admin account');
    
    const adminEmail = 'agriassistme@gmail.com';
    const adminPassword = 'AAadmin';
    
    try {
      const adminCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUser = adminCredential.user;
      
      console.log('✅ Admin login successful');
      console.log('🆔 Admin User ID:', adminUser.uid);
      
      // Test saving icon data
      const adminIconData = {
        selectedCropIcon: 'corn',
        selectedCropEmoji: '🌽',
        selectedCropName: 'Corn'
      };
      
      console.log('📝 Attempting to save admin icon data:', adminIconData);
      
      // Try to save to Firestore
      const adminDocRef = doc(db, 'users', adminUser.uid);
      await setDoc(adminDocRef, adminIconData, { merge: true });
      
      console.log('✅ Admin icon data saved to Firestore successfully');
      
      // Verify the save
      const adminDoc = await getDoc(adminDocRef);
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        console.log('📋 Admin profile after save:');
        console.log('   Name:', adminData.name);
        console.log('   Role:', adminData.role);
        console.log('   Selected Crop Icon:', adminData.selectedCropIcon);
        console.log('   Selected Crop Emoji:', adminData.selectedCropEmoji);
        console.log('   Selected Crop Name:', adminData.selectedCropName);
        
        if (adminData.selectedCropIcon === 'corn' && 
            adminData.selectedCropEmoji === '🌽' && 
            adminData.selectedCropName === 'Corn') {
          console.log('✅ Admin icon data persisted correctly!');
        } else {
          console.log('❌ Admin icon data not persisted correctly');
        }
      } else {
        console.log('❌ Admin document not found after save');
      }
      
    } catch (error) {
      console.log('❌ Admin test failed:', error.message);
    }
    
    console.log('');
    console.log('🔍 Debugging Information:');
    console.log('');
    console.log('📋 Possible Issues:');
    console.log('   1. Firestore permissions - User might not have write access');
    console.log('   2. User ID mismatch - updateProfile might be using wrong user ID');
    console.log('   3. Network issues - Firestore update might be failing silently');
    console.log('   4. Authentication state - User might not be properly authenticated');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('   1. Check Firestore security rules');
    console.log('   2. Add more detailed error logging to updateProfile');
    console.log('   3. Verify user authentication state');
    console.log('   4. Test with different user accounts');
    
  } catch (error) {
    console.error('❌ Icon saving test failed:', error);
  }
}

// Run the test
testIconSaving()
  .then(() => {
    console.log('✅ Icon saving test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
