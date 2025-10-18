const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

async function debugAdminLogin() {
  try {
    console.log('🔍 Debugging Admin Login Issue...');
    console.log('');
    
    const adminEmail = 'agriassistme@gmail.com';
    const adminPassword = 'AAadmin';
    
    // Test 1: Check if admin account exists in Firebase Auth
    console.log('🔐 Test 1: Checking Firebase Auth login...');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      console.log('✅ Firebase Auth login successful!');
      console.log('🆔 User ID:', user.uid);
      console.log('📧 Email:', user.email);
      console.log('📅 Created:', user.metadata.creationTime);
      console.log('📅 Last Sign In:', user.metadata.lastSignInTime);
      
    } catch (error) {
      console.log('❌ Firebase Auth login failed!');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      if (error.code === 'auth/user-not-found') {
        console.log('🔍 Issue: Admin account does not exist in Firebase Auth');
      } else if (error.code === 'auth/wrong-password') {
        console.log('🔍 Issue: Wrong password for admin account');
      } else if (error.code === 'auth/invalid-email') {
        console.log('🔍 Issue: Invalid email format');
      } else if (error.code === 'auth/too-many-requests') {
        console.log('🔍 Issue: Too many failed login attempts');
      } else {
        console.log('🔍 Issue: Unknown authentication error');
      }
    }
    
    console.log('');
    console.log('🔐 Test 2: Checking Firestore admin profile...');
    
    // Check if admin profile exists in Firestore
    try {
      const adminDoc = await getDoc(doc(db, 'users', 'UIcMju8YbdX3VfYAjEbCem39bNe2'));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        console.log('✅ Admin profile found in Firestore!');
        console.log('👤 Name:', adminData.name);
        console.log('🔑 Role:', adminData.role);
        console.log('👑 Is Admin:', adminData.isAdmin);
        console.log('📧 Email:', adminData.email);
        console.log('✅ Approved:', adminData.approved);
        console.log('🔐 New Password:', adminData.newPassword ? 'Set' : 'Not set');
      } else {
        console.log('❌ Admin profile not found in Firestore!');
      }
    } catch (error) {
      console.log('❌ Error checking Firestore:', error.message);
    }
    
    console.log('');
    console.log('🔐 Test 3: Checking all users in Firestore...');
    
    // Check all users to see if admin account exists
    try {
      const { getDocs, collection } = require('firebase/firestore');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log('📊 Total users in Firestore:', usersSnapshot.docs.length);
      
      let adminFound = false;
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.email === adminEmail || userData.role === 'admin') {
          console.log('👤 Found admin user:', doc.id, userData);
          adminFound = true;
        }
      });
      
      if (!adminFound) {
        console.log('❌ No admin user found in Firestore users collection');
      }
      
    } catch (error) {
      console.log('❌ Error checking users collection:', error.message);
    }
    
    console.log('');
    console.log('🔍 Debug Summary:');
    console.log('1. Check if Firebase Auth login works');
    console.log('2. Check if Firestore profile exists');
    console.log('3. Check if admin account is properly configured');
    console.log('4. Identify the specific error causing login failure');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugAdminLogin()
  .then(() => {
    console.log('✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
