const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
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

async function addAdminAccount() {
  try {
    console.log('🚀 Starting admin account creation...');
    
    const adminEmail = 'agriassistme@gmail.com';
    const adminPassword = 'AAadmin';
    
    // Check if admin account already exists
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('✅ Admin account already exists and is accessible');
      return;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('📝 Admin account does not exist, creating new one...');
      } else if (error.code === 'auth/wrong-password') {
        console.log('⚠️ Admin account exists but password is different');
        return;
      } else {
        console.log('🔍 Checking if account exists...', error.message);
      }
    }
    
    // Create the admin account
    console.log('👤 Creating admin account with email:', adminEmail);
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('✅ Admin account created successfully!');
    console.log('🆔 User ID:', user.uid);
    console.log('📧 Email:', user.email);
    
    // Create admin profile in Firestore
    console.log('📝 Creating admin profile in Firestore...');
    await setDoc(doc(db, 'users', user.uid), {
      name: 'Admin',
      role: 'admin',
      location: 'Philippines',
      profileImage: '',
      email: adminEmail,
      approved: true,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      adminCreated: true
    });
    
    console.log('✅ Admin profile created in Firestore!');
    console.log('🎉 Admin account setup complete!');
    console.log('');
    console.log('📋 Admin Login Credentials:');
    console.log('   Email: agriassistme@gmail.com');
    console.log('   Password: AAadmin');
    console.log('   Username: AAadmin (also works)');
    console.log('');
    console.log('🔐 The admin can now login using either:');
    console.log('   1. Email: agriassistme@gmail.com');
    console.log('   2. Username: AAadmin');
    console.log('   Both with password: AAadmin');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin account already exists in Firebase Auth');
      console.log('🔍 Checking if profile exists in Firestore...');
      
      try {
        // Try to sign in to get the user ID
        const signInResult = await signInWithEmailAndPassword(auth, 'agriassistme@gmail.com', 'AAadmin');
        const existingUser = signInResult.user;
        
        // Check if profile exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', existingUser.uid));
        if (!userDoc.exists()) {
          console.log('📝 Creating missing admin profile in Firestore...');
          await setDoc(doc(db, 'users', existingUser.uid), {
            name: 'Admin',
            role: 'admin',
            location: 'Philippines',
            profileImage: '',
            email: 'agriassistme@gmail.com',
            approved: true,
            isAdmin: true,
            createdAt: new Date().toISOString(),
            adminCreated: true
          });
          console.log('✅ Admin profile created in Firestore!');
        } else {
          console.log('✅ Admin profile already exists in Firestore');
        }
        
        console.log('🎉 Admin account is ready to use!');
        
      } catch (signInError) {
        console.error('❌ Could not access existing admin account:', signInError.message);
      }
    }
  }
}

// Run the script
addAdminAccount()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
