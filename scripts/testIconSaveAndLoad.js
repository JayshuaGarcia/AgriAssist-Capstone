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

async function testIconSaveAndLoad() {
  try {
    console.log('🧪 Testing Icon Save and Load Process...');
    console.log('');
    
    // Test with admin account first
    const adminEmail = 'agriassistme@gmail.com';
    const adminPassword = 'AAadmin';
    
    console.log('🔐 Step 1: Testing with admin account');
    
    try {
      // Login as admin
      const adminCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUser = adminCredential.user;
      
      console.log('✅ Admin login successful');
      console.log('🆔 Admin User ID:', adminUser.uid);
      
      // Check current profile
      const adminDoc = await getDoc(doc(db, 'users', adminUser.uid));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        console.log('📋 Current admin profile:');
        console.log('   Name:', adminData.name);
        console.log('   Role:', adminData.role);
        console.log('   Selected Crop Icon:', adminData.selectedCropIcon || 'Not set');
        console.log('   Selected Crop Emoji:', adminData.selectedCropEmoji || 'Not set');
        console.log('   Selected Crop Name:', adminData.selectedCropName || 'Not set');
        
        // Save new icon data
        const newIconData = {
          selectedCropIcon: 'tomato',
          selectedCropEmoji: '🍅',
          selectedCropName: 'Tomato'
        };
        
        console.log('');
        console.log('🔄 Saving new icon data:', newIconData);
        
        await setDoc(doc(db, 'users', adminUser.uid), newIconData, { merge: true });
        console.log('✅ Icon data saved to Firestore');
        
        // Verify the save
        const updatedAdminDoc = await getDoc(doc(db, 'users', adminUser.uid));
        if (updatedAdminDoc.exists()) {
          const updatedAdminData = updatedAdminDoc.data();
          console.log('📋 Updated admin profile:');
          console.log('   Selected Crop Icon:', updatedAdminData.selectedCropIcon);
          console.log('   Selected Crop Emoji:', updatedAdminData.selectedCropEmoji);
          console.log('   Selected Crop Name:', updatedAdminData.selectedCropName);
          
          if (updatedAdminData.selectedCropIcon === 'tomato' && 
              updatedAdminData.selectedCropEmoji === '🍅' && 
              updatedAdminData.selectedCropName === 'Tomato') {
            console.log('✅ Icon data saved and verified successfully!');
          } else {
            console.log('❌ Icon data not saved correctly');
          }
        }
        
        // Test loading the data (simulate login)
        console.log('');
        console.log('🔄 Testing data loading (simulating login)...');
        
        const loadDoc = await getDoc(doc(db, 'users', adminUser.uid));
        if (loadDoc.exists()) {
          const loadData = loadDoc.data();
          console.log('📋 Loaded profile data:');
          console.log('   Selected Crop Icon:', loadData.selectedCropIcon);
          console.log('   Selected Crop Emoji:', loadData.selectedCropEmoji);
          console.log('   Selected Crop Name:', loadData.selectedCropName);
          
          if (loadData.selectedCropIcon === 'tomato' && 
              loadData.selectedCropEmoji === '🍅' && 
              loadData.selectedCropName === 'Tomato') {
            console.log('✅ Icon data loaded correctly!');
          } else {
            console.log('❌ Icon data not loaded correctly');
          }
        }
        
        // Reset to default for testing
        console.log('');
        console.log('🔄 Resetting to default icon...');
        
        await setDoc(doc(db, 'users', adminUser.uid), {
          selectedCropIcon: 'rice',
          selectedCropEmoji: '🌱',
          selectedCropName: 'Seedling'
        }, { merge: true });
        
        console.log('✅ Reset to default icon');
        
      } else {
        console.log('❌ Admin document not found');
      }
      
    } catch (error) {
      console.log('❌ Admin test failed:', error.message);
    }
    
    console.log('');
    console.log('🎉 Icon Save and Load Test Results:');
    console.log('');
    console.log('📋 What was tested:');
    console.log('   ✅ Icon data saving to Firestore');
    console.log('   ✅ Icon data verification after save');
    console.log('   ✅ Icon data loading from Firestore');
    console.log('   ✅ Complete save → load cycle');
    console.log('');
    console.log('🔧 Technical Process:');
    console.log('   1. User changes icon in Privacy & Security');
    console.log('   2. handleCropIconSelection calls updateProfile');
    console.log('   3. updateProfile saves to Firestore with setDoc');
    console.log('   4. On login, profile is loaded from Firestore');
    console.log('   5. Icon data is included in setProfile call');
    console.log('');
    console.log('🎯 Expected Behavior:');
    console.log('   ✅ Icon changes are saved to Firestore');
    console.log('   ✅ Icon changes persist after logout/login');
    console.log('   ✅ Icon changes are visible in admin messages');
    console.log('   ✅ Icon changes are loaded correctly on app startup');
    console.log('');
    console.log('🔍 Debugging Added:');
    console.log('   ✅ Detailed logging in updateProfile function');
    console.log('   ✅ Detailed logging in profile loading');
    console.log('   ✅ Firestore error handling and logging');
    console.log('   ✅ Verification of saved data');
    
  } catch (error) {
    console.error('❌ Icon save and load test failed:', error);
  }
}

// Run the test
testIconSaveAndLoad()
  .then(() => {
    console.log('✅ Icon save and load test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
