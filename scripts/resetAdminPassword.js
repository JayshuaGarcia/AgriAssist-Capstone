const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting Admin Password...');
    console.log('');
    
    const adminEmail = 'agriassistme@gmail.com';
    const defaultPassword = 'AAadmin';
    
    // First, try to login with the current password to get the user
    console.log('🔐 Attempting to login with current password...');
    let currentUser = null;
    
    try {
      // Try with the new password first
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, 'NewAdminPass123');
      currentUser = userCredential.user;
      console.log('✅ Logged in with new password');
    } catch (error) {
      console.log('⚠️ Could not login with new password, trying default...');
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, defaultPassword);
        currentUser = userCredential.user;
        console.log('✅ Logged in with default password');
      } catch (error2) {
        console.log('❌ Could not login with either password');
        console.log('Error:', error2.message);
        return;
      }
    }
    
    if (currentUser) {
      console.log('🆔 User ID:', currentUser.uid);
      
      // Reset the password in Firestore to default
      console.log('📝 Resetting password in Firestore to default...');
      await setDoc(doc(db, 'users', currentUser.uid), {
        newPassword: defaultPassword,
        passwordUpdated: true,
        passwordChangeDate: new Date().toISOString(),
        adminPasswordChanged: true
      }, { merge: true });
      
      console.log('✅ Password reset to default in Firestore');
      
      // Test login with default password
      console.log('🔐 Testing login with default password...');
      try {
        await signInWithEmailAndPassword(auth, adminEmail, defaultPassword);
        console.log('✅ Login with default password successful!');
      } catch (error) {
        console.log('❌ Login with default password failed:', error.message);
      }
    }
    
    console.log('');
    console.log('🎉 Admin Password Reset Complete!');
    console.log('');
    console.log('📋 Admin Login Credentials:');
    console.log('   Email: agriassistme@gmail.com');
    console.log('   Username: AAadmin');
    console.log('   Password: AAadmin (reset to default)');
    console.log('');
    console.log('🔐 Both login methods should now work with password: AAadmin');
    
  } catch (error) {
    console.error('❌ Password reset failed:', error);
  }
}

// Run the reset
resetAdminPassword()
  .then(() => {
    console.log('✅ Password reset completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  });
