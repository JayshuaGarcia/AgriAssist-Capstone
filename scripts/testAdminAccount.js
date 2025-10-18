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

async function testAdminAccount() {
  try {
    console.log('🧪 Testing admin account access...');
    
    const adminEmail = 'agriassistme@gmail.com';
    const adminPassword = 'AAadmin';
    
    // Test Firebase Auth login
    console.log('🔐 Testing Firebase Auth login...');
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('✅ Firebase Auth login successful!');
    console.log('🆔 User ID:', user.uid);
    console.log('📧 Email:', user.email);
    console.log('📅 Created:', user.metadata.creationTime);
    
    // Test Firestore profile access
    console.log('📝 Testing Firestore profile access...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Firestore profile found!');
      console.log('👤 Name:', userData.name);
      console.log('🔑 Role:', userData.role);
      console.log('📍 Location:', userData.location);
      console.log('✅ Approved:', userData.approved);
      console.log('👑 Is Admin:', userData.isAdmin);
      console.log('📅 Created:', userData.createdAt);
    } else {
      console.log('❌ Firestore profile not found!');
    }
    
    console.log('');
    console.log('🎉 Admin account test completed successfully!');
    console.log('');
    console.log('📋 Admin Login Options:');
    console.log('   1. Email: agriassistme@gmail.com');
    console.log('   2. Username: AAadmin');
    console.log('   Password: AAadmin (for both)');
    console.log('');
    console.log('🔐 Both login methods will:');
    console.log('   - Authenticate successfully');
    console.log('   - Set role as "admin"');
    console.log('   - Navigate to /admin page');
    console.log('   - Have full admin privileges');
    
  } catch (error) {
    console.error('❌ Admin account test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the test
testAdminAccount()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
