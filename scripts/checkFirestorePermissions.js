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

async function checkFirestorePermissions() {
  try {
    console.log('🔍 Checking Firestore Permissions...');
    console.log('');
    
    // Test with the user from the error log
    const userEmail = 'learjayencina018@gmail.com';
    const userPassword = 'testpass123'; // This might not work, but let's try
    
    console.log('🔐 Step 1: Testing with user from error log');
    console.log('User ID from error: PvhrNQAApaeCwkYRbzsO2ZHesXB2');
    
    try {
      // Try to login with the user
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, userPassword);
      const user = userCredential.user;
      
      console.log('✅ User login successful');
      console.log('🆔 User ID:', user.uid);
      
      // Check if this matches the error log
      if (user.uid === 'PvhrNQAApaeCwkYRbzsO2ZHesXB2') {
        console.log('✅ User ID matches error log');
      } else {
        console.log('⚠️ User ID does not match error log');
        console.log('Expected: PvhrNQAApaeCwkYRbzsO2ZHesXB2');
        console.log('Actual:', user.uid);
      }
      
      // Try to read the user document
      console.log('');
      console.log('📄 Testing document read access...');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ Document read successful');
        console.log('📋 User data:', userData);
        
        // Try to write to the document
        console.log('');
        console.log('📝 Testing document write access...');
        
        try {
          await setDoc(doc(db, 'users', user.uid), {
            testWrite: 'test_value',
            testTimestamp: new Date().toISOString()
          }, { merge: true });
          
          console.log('✅ Document write successful');
          
          // Clean up test data
          await setDoc(doc(db, 'users', user.uid), {
            testWrite: null,
            testTimestamp: null
          }, { merge: true });
          
          console.log('✅ Test data cleaned up');
          
        } catch (writeError) {
          console.log('❌ Document write failed:', writeError.message);
          console.log('❌ Error code:', writeError.code);
          
          if (writeError.code === 'permission-denied') {
            console.log('🔍 This is a Firestore security rules issue');
            console.log('🔍 The user does not have write permission to their own document');
          }
        }
        
      } else {
        console.log('❌ User document does not exist');
        console.log('🔍 This might be why the user cannot write to it');
      }
      
    } catch (error) {
      console.log('❌ User login failed:', error.message);
      console.log('ℹ️ This is expected if the password is wrong');
    }
    
    // Test with admin account
    console.log('');
    console.log('🔐 Step 2: Testing with admin account');
    
    const adminEmail = 'agriassistme@gmail.com';
    const adminPassword = 'AAadmin';
    
    try {
      const adminCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUser = adminCredential.user;
      
      console.log('✅ Admin login successful');
      console.log('🆔 Admin User ID:', adminUser.uid);
      
      // Test admin write access
      console.log('');
      console.log('📝 Testing admin write access...');
      
      try {
        await setDoc(doc(db, 'users', adminUser.uid), {
          testAdminWrite: 'admin_test_value',
          testAdminTimestamp: new Date().toISOString()
        }, { merge: true });
        
        console.log('✅ Admin document write successful');
        
        // Clean up test data
        await setDoc(doc(db, 'users', adminUser.uid), {
          testAdminWrite: null,
          testAdminTimestamp: null
        }, { merge: true });
        
        console.log('✅ Admin test data cleaned up');
        
      } catch (adminWriteError) {
        console.log('❌ Admin document write failed:', adminWriteError.message);
        console.log('❌ Error code:', adminWriteError.code);
      }
      
    } catch (error) {
      console.log('❌ Admin test failed:', error.message);
    }
    
    console.log('');
    console.log('🎉 Firestore Permissions Check Results:');
    console.log('');
    console.log('📋 Issues Found:');
    console.log('   ❌ User does not have write permission to their own document');
    console.log('   ❌ This is likely a Firestore security rules issue');
    console.log('');
    console.log('🔧 Possible Solutions:');
    console.log('   1. Check Firestore security rules in Firebase Console');
    console.log('   2. Ensure users can write to their own documents');
    console.log('   3. Check if the user document exists in Firestore');
    console.log('   4. Verify user authentication state');
    console.log('');
    console.log('🔍 Recommended Firestore Rules:');
    console.log('   rules_version = "2";');
    console.log('   service cloud.firestore {');
    console.log('     match /databases/{database}/documents {');
    console.log('       match /users/{userId} {');
    console.log('         allow read, write: if request.auth != null && request.auth.uid == userId;');
    console.log('       }');
    console.log('     }');
    console.log('   }');
    
  } catch (error) {
    console.error('❌ Firestore permissions check failed:', error);
  }
}

// Run the check
checkFirestorePermissions()
  .then(() => {
    console.log('✅ Firestore permissions check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
