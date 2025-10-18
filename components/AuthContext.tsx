import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, EmailAuthProvider, updateProfile as fbUpdateProfile, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { clearAllTemporaryPasswords, clearVerifiedCode, generateVerificationCode, getChangedPasswordPersistent, getPasswordReset, getPasswordResetPersistent, isCodeVerified, sendPasswordResetEmailViaAPI, sendVerificationCodeViaAPI, storePasswordReset, storePasswordResetPersistent, storeProfileData, storeVerificationCode, verifyCode } from '../lib/emailService';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  name: string;
  role: string;
  location: string;
  profileImage: string;
  selectedCropIcon?: string;
  selectedCropEmoji?: string;
  selectedCropName?: string;
  phone?: string;
  backupEmail?: string;
  approved?: boolean;
  barangay?: string;
}

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile;
  login: (email: string, password: string, role: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string, barangay: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
  requestEmailChange: (newEmail: string) => Promise<string>; // returns verification code
  confirmEmailChange: (code: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfileImage: (uri: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Farmer',
    role: 'Farmer',
    location: 'Philippines',
    profileImage: '',
    selectedCropIcon: 'rice',
    selectedCropEmoji: '🌱',
    selectedCropName: 'Seedling'
  });
  const router = useRouter();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        };
        setUser(authUser);
        
        // Load user profile from Firestore
        try {
          console.log('📄 Loading user profile from Firestore...');
          console.log('🆔 User UID:', firebaseUser.uid);
          
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('📋 User data from Firestore:', userData);
            console.log('🌱 Icon data from Firestore:');
            console.log('   selectedCropIcon:', userData.selectedCropIcon);
            console.log('   selectedCropEmoji:', userData.selectedCropEmoji);
            console.log('   selectedCropName:', userData.selectedCropName);
            
            setProfile({
              name: userData.name || 'Farmer',
              role: userData.role || 'Farmer',
              location: userData.location || 'Philippines',
              profileImage: userData.profileImage || '',
              selectedCropIcon: userData.selectedCropIcon || 'rice',
              selectedCropEmoji: userData.selectedCropEmoji || '🌱',
              selectedCropName: userData.selectedCropName || 'Seedling',
              phone: userData.phone,
              approved: userData.approved,
              barangay: userData.barangay
            });
            
            console.log('✅ Profile loaded from Firestore successfully');
            
            // Update user email from Firestore if it's different from Firebase Auth
            if (userData.email && userData.email !== firebaseUser.email) {
              setUser(prev => prev ? { ...prev, email: userData.email } : prev);
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUser(null);
        setProfile({
          name: 'Farmer',
          role: 'Farmer',
          location: 'Philippines',
          profileImage: '',
          selectedCropIcon: 'rice',
          selectedCropEmoji: '🌱',
          selectedCropName: 'Seedling'
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real Firebase authentication
  const login = async (email: string, password: string, role: string) => {
    console.log('🚀 LOGIN STARTED with email:', email, 'role:', role);
    setLoading(true);
    try {
      // Debug: Check current database state
      console.log('🔍 DEBUG: Checking database state...');
      try {
        const usersQuery = await getDocs(collection(db, 'users'));
        console.log('📊 Total users:', usersQuery.docs.length);
        for (const userDoc of usersQuery.docs) {
          const userData = userDoc.data();
          console.log('👤 User:', userDoc.id, userData);
        }
      } catch (debugError: any) {
        console.log('⚠️ Could not access users collection:', debugError?.message || debugError);
      }
      // Check for special admin credentials - both email and username are the same admin account
      if ((email === 'AAadmin' || email === 'agriassistme@gmail.com')) {
        // Check if admin has changed their password
        let adminPassword = 'AAadmin'; // Default password
        
        // Try to get the updated password from Firestore
        try {
          const adminDoc = await getDoc(doc(db, 'users', 'UIcMju8YbdX3VfYAjEbCem39bNe2')); // Admin user ID
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            if (adminData.newPassword) {
              adminPassword = adminData.newPassword;
              console.log('🔐 Using updated admin password from Firestore');
            }
          }
        } catch (error) {
          console.log('⚠️ Could not check for updated admin password, using default');
        }
        
        // Check if the provided password matches (either default or updated)
        if (password === adminPassword) {
          console.log('🔐 Admin login detected:', email);
          
          // For both login methods, use the same admin account logic
          // Try Firebase Auth first for the email login
          if (email === 'agriassistme@gmail.com') {
            try {
              console.log('🔐 Attempting Firebase Auth login for admin email...');
              const adminCredential = await signInWithEmailAndPassword(auth, email, password);
              const adminUser = adminCredential.user;
              
              console.log('✅ Firebase Auth login successful for admin');
              
              // Load admin profile from Firestore
              const adminDoc = await getDoc(doc(db, 'users', adminUser.uid));
              if (adminDoc.exists()) {
                const adminData = adminDoc.data();
                setUser({
                  uid: adminUser.uid,
                  email: adminUser.email,
                  displayName: adminUser.displayName
                });
                
                setProfile({
                  name: adminData.name || 'Admin',
                  role: 'admin', // Force admin role
                  location: adminData.location || 'Philippines',
                  profileImage: adminData.profileImage || '',
                  selectedCropIcon: adminData.selectedCropIcon || 'rice',
                  selectedCropEmoji: adminData.selectedCropEmoji || '🌱',
                  selectedCropName: adminData.selectedCropName || 'Seedling',
                  approved: true, // Force approved for admin
                  isAdmin: true // Mark as admin-only account
                });
              } else {
                // Fallback to default admin profile
                setUser({
                  uid: adminUser.uid,
                  email: adminUser.email,
                  displayName: 'Admin'
                });
                
                setProfile({
                  name: 'Admin',
                  role: 'admin', // Force admin role
                  location: 'Philippines',
                  profileImage: '',
                  selectedCropIcon: 'rice',
                  selectedCropEmoji: '🌱',
                  selectedCropName: 'Seedling',
                  approved: true, // Force approved for admin
                  isAdmin: true // Mark as admin-only account
                });
              }
              
              console.log('✅ Admin user state set successfully');
              setLoading(false);
              return;
            } catch (adminError: any) {
              console.log('⚠️ Firebase Auth login failed for admin email, falling back to mock admin');
              console.log('Admin error:', adminError.message);
            }
          }
          
          // For username login (AAadmin), we need to use the same Firebase Auth user ID
          // as the email login to ensure they share the same profile data
          try {
            // Try to get the Firebase Auth user ID for the email login
            const emailCredential = await signInWithEmailAndPassword(auth, 'agriassistme@gmail.com', password);
            const emailUser = emailCredential.user;
            
            console.log('✅ Using Firebase Auth user ID for unified admin:', emailUser.uid);
            
            // Load the admin profile from Firestore using the Firebase Auth user ID
            const adminDoc = await getDoc(doc(db, 'users', emailUser.uid));
            if (adminDoc.exists()) {
              const adminData = adminDoc.data();
              
              // Set the user state with the Firebase Auth user ID
              setUser({
                uid: emailUser.uid,
                email: email, // Use the actual email/username used for login
                displayName: 'Admin'
              });
              
              // Set admin profile with data from Firestore
              setProfile({
                name: adminData.name || 'Admin',
                role: 'admin', // Force admin role
                location: adminData.location || 'Philippines',
                profileImage: adminData.profileImage || '',
                selectedCropIcon: adminData.selectedCropIcon || 'rice',
                selectedCropEmoji: adminData.selectedCropEmoji || '🌱',
                selectedCropName: adminData.selectedCropName || 'Seedling',
                approved: true, // Force approved for admin
                isAdmin: true // Mark as admin-only account
              });
            } else {
              // Fallback if no profile exists
              setUser({
                uid: emailUser.uid,
                email: email,
                displayName: 'Admin'
              });
              
              setProfile({
                name: 'Admin',
                role: 'admin',
                location: 'Philippines',
                profileImage: '',
                selectedCropIcon: 'rice',
                selectedCropEmoji: '🌱',
                selectedCropName: 'Seedling',
                approved: true,
                isAdmin: true
              });
            }
          } catch (unifiedError: any) {
            console.log('⚠️ Could not unify admin accounts, using fallback');
            console.log('Unified error:', unifiedError.message);
            
            // Fallback to mock admin if unification fails
            const adminUserId = 'admin-unified';
            const adminUser = {
              uid: adminUserId,
              email: email,
              displayName: 'Admin'
            };
            
            setUser({
              uid: adminUser.uid,
              email: adminUser.email,
              displayName: adminUser.displayName
            });
            
            setProfile({
              name: 'Admin',
              role: 'admin',
              location: 'Philippines',
              profileImage: '',
              selectedCropIcon: 'rice',
              selectedCropEmoji: '🌱',
              selectedCropName: 'Seedling',
              approved: true,
              isAdmin: true
            });
          }
          
          console.log('✅ Admin user state set successfully (unified)');
          setLoading(false);
          return;
        } else {
          // Wrong password for admin
          throw new Error('Incorrect password for admin account.');
        }
      }
      
      // Regular Firebase authentication for other users
      let userCredential;
      let firebaseUser;
      
      try {
        // First, check if this user has a new password stored in Firestore
        let userFound = false;
        let userUid = null;
        let userData = null;
        
        try {
          console.log('🔍 Looking for user with email:', email);
          const usersQuery = await getDocs(collection(db, 'users'));
          for (const userDoc of usersQuery.docs) {
            const data = userDoc.data();
            console.log('🔍 Checking user:', userDoc.id, 'email:', data.email, 'loginEmail:', data.loginEmail, 'previousEmail:', data.previousEmail);
            
            // Check multiple email fields to find the user
            if (data.email === email || 
                data.loginEmail === email || 
                data.previousEmail === email ||
                data.originalFirebaseEmail === email ||
                data.backupEmail === email) {
              userFound = true;
              userUid = userDoc.id;
              userData = data;
              console.log('✅ Found user:', userDoc.id, 'passwordResetCompleted:', data.passwordResetCompleted);
              console.log('✅ User email fields - email:', data.email, 'loginEmail:', data.loginEmail, 'previousEmail:', data.previousEmail);
              break;
            }
          }
          if (!userFound) {
            console.log('❌ No user found with email:', email);
          }
        } catch (firestoreError: any) {
          console.log('⚠️ Could not check users collection:', firestoreError?.message || firestoreError);
        }
        
        // If user has reset their password, ONLY allow the new password
        if (userFound && userData && (userData as any).passwordResetCompleted) {
          console.log('🔍 User has reset password - checking ONLY new password');
          console.log('🔍 User data:', userData);
          console.log('🔍 Password reset completed:', (userData as any).passwordResetCompleted);
          
          // ONLY check the new password - no Firebase Auth attempts
          let passwordMatch = false;
          
          // Check Firestore password first
          if ((userData as any).newPassword && (userData as any).newPassword === password) {
            console.log('✅ New password matches (Firestore), creating user session');
            passwordMatch = true;
          }
          
          // Check memory password if Firestore doesn't match
          if (!passwordMatch && userUid) {
            const memoryPassword = getPasswordReset(userUid);
            if (memoryPassword.valid && memoryPassword.password === password) {
              console.log('✅ New password matches (memory), creating user session');
              passwordMatch = true;
            }
          }
          
          // Check persistent storage if memory doesn't match
          if (!passwordMatch && userUid) {
            const persistentPassword = await getPasswordResetPersistent(userUid);
            if (persistentPassword.valid && persistentPassword.password === password) {
              console.log('✅ New password matches (persistent), creating user session');
              passwordMatch = true;
            }
          }
          
          // Check changed password storage if persistent doesn't match
          if (!passwordMatch && userUid) {
            const changedPassword = await getChangedPasswordPersistent(userUid);
            if (changedPassword.valid && changedPassword.password === password) {
              console.log('✅ Changed password matches (persistent), creating user session');
              passwordMatch = true;
            }
          }
          
          
          if (passwordMatch && userUid) {
            // Create a mock user session since we can't use Firebase Auth
            const mockUser = {
              uid: userUid,
              email: email,
              displayName: (userData as any).name || 'User'
            };
            
            setUser(mockUser);
            
            console.log('📄 Loading user profile from Firestore (fallback login)...');
            console.log('📋 User data from Firestore:', userData);
            console.log('🌱 Icon data from Firestore:');
            console.log('   selectedCropIcon:', (userData as any).selectedCropIcon);
            console.log('   selectedCropEmoji:', (userData as any).selectedCropEmoji);
            console.log('   selectedCropName:', (userData as any).selectedCropName);
            
            setProfile({
              name: (userData as any).name || 'User',
              role: (userData as any).role || 'Farmer',
              location: (userData as any).location || 'Philippines',
              profileImage: (userData as any).profileImage || '',
              selectedCropIcon: (userData as any).selectedCropIcon || 'rice',
              selectedCropEmoji: (userData as any).selectedCropEmoji || '🌱',
              selectedCropName: (userData as any).selectedCropName || 'Seedling',
              phone: (userData as any).phone,
              approved: (userData as any).approved,
              barangay: (userData as any).barangay
            });
            
            console.log('✅ Profile loaded from Firestore successfully (fallback login)');
            console.log('🎉 Login successful with new password, redirecting to app');
            router.replace('/(tabs)');
            return; // Exit early since we've successfully logged in
          } else {
            console.log('❌ Password does not match new password - blocking login');
            throw new Error('Incorrect password. Please use your new password.');
          }
        }
        
        // This check is now handled above - no need for duplicate
        
        // Debug: Show what we found
        if (userFound) {
          console.log('🔍 User found but no password reset:', userData);
        } else {
          console.log('🔍 No user found in Firestore, proceeding with normal login');
        }
        
        // First try to login with the provided email
        console.log('🔐 Attempting login with email:', email);
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          firebaseUser = userCredential.user;
          console.log('✅ Direct login successful with email:', email);
        } catch (loginError: any) {
          console.log('❌ Login failed with provided email:', email);
          console.log('🔍 Login error:', loginError?.message || loginError);
          console.log('🔍 Login error code:', loginError?.code || 'unknown');
          throw loginError;
        }
        
        // If Firebase Auth login succeeded, we need to check if this email is the current active email
        // by looking at the user's Firestore document
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📧 User document found:', userData);
          
          // Check if the email they logged in with is different from their current email
          if (userData.email && userData.email !== email) {
            // They logged in with an old email, but their current email is different
            console.log('❌ User logged in with old email, but current email is:', userData.email);
            await signOut(auth);
            throw new Error('Your email has been updated. Please use your new email address.');
          }
        }
        
      } catch (loginError: any) {
        console.log('🔍 Login failed with provided email:', email);
        console.log('🔍 Login error:', loginError.message);
        console.log('🔍 Login error code:', loginError.code);
        
        // Check if this email was replaced by looking in Firestore first
        let foundUser = null;
        let isReplacedEmail = false;
        
        try {
          const usersQuery = await getDocs(collection(db, 'users'));
          for (const userDoc of usersQuery.docs) {
            const userData = userDoc.data();
            
            // Check if this email was replaced (is in previousEmail with replaced status)
            if (userData.previousEmail === email && userData.oldEmailStatus === 'replaced') {
              isReplacedEmail = true;
              foundUser = { id: userDoc.id, ...userData };
              console.log('❌ Email was replaced:', email, '→', userData.email);
              break;
            }
            
            // Check if this is the current active email
            if (userData.loginEmail === email || userData.email === email) {
              foundUser = { id: userDoc.id, ...userData };
              console.log('✅ Found current active email:', email);
            }
          }
        } catch (firestoreError: any) {
          console.log('⚠️ Could not check Firestore for email status:', firestoreError?.message || firestoreError);
        }
        
        // If this is a replaced email, block it immediately
        if (isReplacedEmail) {
          throw new Error('Your email has been updated. Please use your new email address.');
        }
        
        // If we found a user but they have reset their password, they must use the new password
        if (foundUser && (foundUser as any).passwordResetCompleted) {
          throw new Error('Your password has been reset. Please use your new password to login.');
        }
        
        // If we didn't find a user or they don't have a previousEmail, throw the original login error
        console.log('🔍 No valid user found for email:', email);
        throw loginError;
      }
      
      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        // Create user profile if it doesn't exist
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: firebaseUser.displayName || 'Farmer',
          role: role,
          location: 'Philippines',
          profileImage: '',
          email: email,
          createdAt: new Date().toISOString()
        });
      }
      
      // Get the current email from Firestore (which has the updated email)
      const currentUserDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let currentEmail = firebaseUser.email;
      
      if (currentUserDoc.exists()) {
        const userData = currentUserDoc.data();
        if (userData.email && userData.email !== firebaseUser.email) {
          currentEmail = userData.email; // Use the updated email from Firestore
          console.log('📧 Using updated email from Firestore:', currentEmail);
        }
      }
      
      console.log('🎉 LOGIN SUCCESS - Setting user state');
      setUser({
        uid: firebaseUser.uid,
        email: currentEmail, // Use the current email (from Firestore if updated)
        displayName: firebaseUser.displayName
      });
      
      console.log('🎉 LOGIN SUCCESS - Redirecting to app');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.log('❌ LOGIN ERROR CAUGHT:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error code:', error.code);
      
      // Check if this is an old email that was replaced
      try {
        const usersQuery = await getDocs(collection(db, 'users'));
        for (const userDoc of usersQuery.docs) {
          const userData = userDoc.data();
          if (userData.previousEmail === email && userData.oldEmailStatus === 'replaced') {
            throw new Error('Your email has been updated. Please use your new email address.');
          }
        }
      } catch (firestoreError: any) {
        // If we can't check Firestore, continue with normal error handling
        console.log('⚠️ Could not check if email was replaced in final catch:', firestoreError?.message || firestoreError);
      }
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Unable to access account information. Please try again.';
      }
      
      console.log('❌ Final error message:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: string, barangay: string) => {
    setLoading(true);
    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update the user's display name
      await fbUpdateProfile(firebaseUser, {
        displayName: name
      });
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: name,
        role: role,
        location: 'Philippines',
        profileImage: '',
        email: email,
        barangay: barangay,
        approved: false, // New users need approval
        createdAt: new Date().toISOString()
      });
    } catch (error: any) {
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      // First, check if the email exists in our system
      let userFound = false;
      let userUid = null;
      
      try {
        const usersQuery = await getDocs(collection(db, 'users'));
        for (const userDoc of usersQuery.docs) {
          const userData = userDoc.data();
          if (userData.email === email || userData.loginEmail === email || userData.backupEmail === email) {
            userFound = true;
            userUid = userDoc.id;
            break;
          }
        }
      } catch (firestoreError: any) {
        console.log('⚠️ Could not check users collection:', firestoreError?.message || firestoreError);
      }
      
      if (!userFound) {
        throw new Error('No account found with this email.');
      }
      
      // Generate a secure verification code for password reset
      const code = generateVerificationCode();
      
      // Store the code in our temporary storage
      if (userUid) {
        storeVerificationCode(userUid, email, code);
      }
      
      // Send the verification code via our email service
      await sendPasswordResetEmailViaAPI(email, code);
      
      console.log('Password reset verification code sent to:', email);
      console.log('Verification code:', code);
      
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email.';
      
      if (error.message === 'No account found with this email.') {
        errorMessage = 'No account found with this email.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
      // First, check if the email exists in our system
      let userFound = false;
      let userUid = null;
      let userData = null;
      
      try {
        const usersQuery = await getDocs(collection(db, 'users'));
        for (const userDoc of usersQuery.docs) {
          const data = userDoc.data();
          if (data.email === email || data.loginEmail === email || data.backupEmail === email) {
            userFound = true;
            userUid = userDoc.id;
            userData = data;
            break;
          }
        }
      } catch (firestoreError: any) {
        console.log('⚠️ Could not check users collection:', firestoreError?.message || firestoreError);
      }
      
      if (!userFound) {
        throw new Error('No account found with this email.');
      }
      
      // Check if the code was previously verified
      if (!userUid) {
        throw new Error('User not found. Please try again.');
      }
      
      const verification = isCodeVerified(userUid);
      if (!verification.verified) {
        throw new Error('Invalid or expired verification code. Please verify your code again.');
      }
      
      // Get the Firebase Auth email (the one that's actually in Firebase Auth)
      const firebaseAuthEmail = (userData as any).previousEmail || (userData as any).email;
      
      if (!firebaseAuthEmail) {
        throw new Error('Unable to reset password. Please contact support.');
      }
      
      // We need to update the Firebase Auth password directly
      // Since we can't update password without current password, we'll use a workaround
      // We'll temporarily sign in the user and then update their password
      
      // Check if user already has a new Firebase Auth user (passwordResetCompleted = true)
      if ((userData as any).passwordResetCompleted) {
        console.log('🔄 User already has new Firebase Auth user, storing new password in Firestore');
        
        try {
          // Clear all temporary password storage first
          if (userUid) {
            await clearAllTemporaryPasswords(userUid);
          }
          
          // Store the new password in Firestore as the primary password
          await setDoc(doc(db, 'users', userUid), {
            newPassword: newPassword,
            passwordResetCompleted: true,
            passwordResetDate: new Date().toISOString(),
            originalFirebaseEmail: firebaseAuthEmail,
            passwordUpdated: true
          }, { merge: true });
          
          if (userUid) {
            clearVerifiedCode(userUid);
          }
          
          console.log('✅ Password reset completed - new password stored in Firestore');
          console.log('🔐 User can now login with their new password');
          console.log('📝 Note: Using Firestore authentication for password reset users');
          
        } catch (firestoreError: any) {
          console.log('⚠️ Firestore write not available, using persistent storage method');
          
          // If Firestore write fails due to permissions, use persistent storage
          if (firestoreError.code === 'permission-denied') {
            console.log('🔄 Using persistent storage for password reset');
            
            try {
              // Clear all temporary password storage first
              if (userUid) {
                await clearAllTemporaryPasswords(userUid);
                
                // Store new password in persistent storage as fallback
                await storePasswordResetPersistent(userUid, newPassword);
                clearVerifiedCode(userUid);
              }
              
              console.log('✅ Password reset completed - new password stored persistently');
              console.log('🔐 User can now login with their new password');
              console.log('📝 Note: Using persistent authentication for password reset users');
              
              // Don't throw error - fallback succeeded
              return;
            } catch (fallbackError: any) {
              console.error('❌ Persistent storage also failed:', fallbackError);
              throw new Error('Failed to store new password. Please try again.');
            }
          } else {
            throw new Error('Failed to store new password. Please try again.');
          }
        }
        
      } else {
        // First time password reset - create new Firebase Auth user
        try {
          console.log('🔄 First time password reset - creating new Firebase Auth user');
          
          // Create a new Firebase Auth user with the new password
          // Use the current email (not the original Firebase Auth email)
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, newPassword);
          const newFirebaseUser = newUserCredential.user;
          
          // Update the user's display name if available
          if ((userData as any).name) {
            await fbUpdateProfile(newFirebaseUser, {
              displayName: (userData as any).name
            });
          }
          
          // Update the Firestore document to point to the new Firebase Auth user
          await setDoc(doc(db, 'users', newFirebaseUser.uid), {
            ...(userData as any),
            passwordResetCompleted: true,
            passwordResetDate: new Date().toISOString(),
            originalFirebaseEmail: firebaseAuthEmail
          });
          
          // Delete the old user document
          if (userUid) {
            await setDoc(doc(db, 'users', userUid), {
              deleted: true,
              deletedAt: new Date().toISOString(),
              newUserId: newFirebaseUser.uid
            });
            
            // Clear the verified code since it's been used
            clearVerifiedCode(userUid);
          }
          
          // Sign out the new user so they can login normally
          await signOut(auth);
          
          // Log the password reset activity
          if (userUid) {
            await logActivity('password_reset', {
              email: email,
              timestamp: new Date().toISOString(),
              method: 'forgot_password'
            });
          }
          
          console.log('✅ Password reset completed successfully!');
          console.log('📧 New Firebase Auth user created with new password');
          console.log('🔐 User can now login with their new password');
          
        } catch (updateError: any) {
          console.log('⚠️ Firebase Auth user creation not available, using alternative method');
          
          // If the email is already in use, fall back to memory storage
          if (updateError.code === 'auth/email-already-in-use') {
            console.log('🔄 Using memory storage for password reset');
            
            try {
              // Clear all temporary password storage first
              if (userUid) {
                await clearAllTemporaryPasswords(userUid);
                
                // Store the new password in memory for authentication
                storePasswordReset(userUid, newPassword);
                clearVerifiedCode(userUid);
              }
              
              // Log the password reset activity
              if (userUid) {
                await logActivity('password_reset', {
                  email: email,
                  timestamp: new Date().toISOString(),
                  method: 'forgot_password_fallback'
                });
              }
              
              console.log('✅ Password reset completed - new password stored in memory');
              console.log('🔐 User can now login with their new password');
              console.log('📝 Note: Using memory authentication for password reset users');
              
              // Don't throw error - fallback succeeded
              return;
            } catch (fallbackError: any) {
              console.error('❌ Fallback storage also failed:', fallbackError);
              throw new Error('Failed to update password. Please try again.');
            }
          } else {
            throw new Error('Failed to update password. Please try again.');
          }
        }
      }
      
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      
      let errorMessage = 'Failed to reset password.';
      
      if (error.message === 'No account found with this email.') {
        errorMessage = 'No account found with this email.';
      } else if (error.message === 'Invalid or expired verification code.') {
        errorMessage = 'Invalid or expired verification code.';
      } else if (error.message.includes('Unable to reset password')) {
        errorMessage = 'Unable to reset password. Please contact support.';
      } else if (error.message.includes('Failed to store new password')) {
        errorMessage = 'Failed to store new password. Please try again.';
      } else if (error.message.includes('Failed to update password')) {
        errorMessage = 'Failed to update password. Please try again.';
      }
      
      console.error('❌ Final error message:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyPasswordResetCode = async (email: string, code: string) => {
    try {
      // First, check if the email exists in our system
      let userFound = false;
      let userUid = null;
      
      try {
        const usersQuery = await getDocs(collection(db, 'users'));
        for (const userDoc of usersQuery.docs) {
          const data = userDoc.data();
          if (data.email === email || data.loginEmail === email || data.backupEmail === email) {
            userFound = true;
            userUid = userDoc.id;
            break;
          }
        }
      } catch (firestoreError: any) {
        console.log('⚠️ Could not check users collection:', firestoreError?.message || firestoreError);
      }
      
      if (!userFound) {
        throw new Error('No account found with this email.');
      }
      
      // Verify the code (this will store it as verified if valid)
      if (!userUid) {
        throw new Error('User not found. Please try again.');
      }
      
      const verification = verifyCode(userUid, code);
      if (!verification.valid) {
        throw new Error('Invalid or expired verification code.');
      }
      
      console.log('Password reset code verified successfully');
      
    } catch (error: any) {
      let errorMessage = 'Failed to verify code.';
      
      if (error.message === 'No account found with this email.') {
        errorMessage = 'No account found with this email.';
      } else if (error.message === 'Invalid or expired verification code.') {
        errorMessage = 'Invalid or expired verification code.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const requestEmailChange = async (newEmail: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }

      // Generate a secure verification code
      const code = generateVerificationCode();
      
      // Store the new email and code for later verification
    setPendingEmail(newEmail);
    setPendingCode(code);
      
      // Store the code in our temporary storage with the new email
      storeVerificationCode(auth.currentUser.uid, newEmail, code);
      
      // Send verification email to the CURRENT email address (more secure)
      const currentEmail = auth.currentUser.email;
      if (!currentEmail) {
        throw new Error('No current email address found');
      }
      
      await sendVerificationCodeViaAPI(currentEmail, code);
      
      console.log('Verification email sent to current email:', currentEmail);
      console.log('Verification code for changing to:', newEmail, 'is:', code);
      
    return code;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email. Please try again.');
    }
  };

  const confirmEmailChange = async (code: string, currentPassword: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }

      // Verify the code using our email service
      const verification = verifyCode(auth.currentUser.uid, code);
      
      if (!verification.valid) {
        throw new Error('Invalid or expired verification code.');
      }

      const newEmail = verification.email;
      if (!newEmail) {
        throw new Error('No email found for verification.');
      }

      const currentUser = auth.currentUser;
      const firebaseAuthEmail = currentUser.email; // This is always the Firebase Auth email

      // Step 1: Get current user data from Firestore to understand the current state
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const currentUserData = userDoc.exists() ? userDoc.data() : {};
      
      // Determine the current email being used (from Firestore if available, otherwise Firebase Auth)
      const currentEmail = currentUserData.email || firebaseAuthEmail;
      const currentLoginEmail = currentUserData.loginEmail || currentEmail;
      
      console.log('📧 Current email in Firestore:', currentEmail);
      console.log('📧 Current login email:', currentLoginEmail);
      console.log('📧 Firebase Auth email:', firebaseAuthEmail);
      console.log('📧 New email to change to:', newEmail);

      // Step 2: Re-authenticate the user with their current password
      // Use the Firebase Auth email for re-authentication (this is what Firebase Auth knows)
      try {
        const credential = EmailAuthProvider.credential(firebaseAuthEmail!, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        console.log('✅ User re-authenticated successfully');
      } catch (reauthError: any) {
        console.error('❌ Re-authentication failed:', reauthError);
        throw new Error('Current password is incorrect. Please try again.');
      }

      // Step 3: Update Firestore with the new email as the primary email
      // The key is to set the new email as the loginEmail and mark the current email as previous
      await setDoc(userDocRef, { 
        email: newEmail, // Set as the primary email
        loginEmail: newEmail, // This is what we check for login
        emailVerified: true, // Mark as verified since user confirmed with code
        emailChangeDate: new Date().toISOString(), // Track when email was changed
        previousEmail: currentLoginEmail, // The email that was being used before this change
        oldEmailStatus: 'replaced' // Mark the previous email as replaced
      }, { merge: true });

      // Step 4: Create/update userEmails document for the new email
      const newEmailDocRef = doc(db, 'userEmails', newEmail);
      await setDoc(newEmailDocRef, {
        userId: currentUser.uid,
        email: newEmail,
        createdAt: new Date().toISOString(),
        isActive: true,
        isUsable: true
      }, { merge: true });

      // Step 5: Mark the current email as completely unusable
      if (currentLoginEmail) {
        const currentEmailDocRef = doc(db, 'userEmails', currentLoginEmail);
        await setDoc(currentEmailDocRef, {
          userId: currentUser.uid,
          email: currentLoginEmail,
          isActive: false,
          isUsable: false, // Completely block this email from being used
          replacedBy: newEmail,
          replacedAt: new Date().toISOString(),
          status: 'replaced' // Clear status
        }, { merge: true });
        
        // The user document is already updated above with oldEmailStatus: 'replaced'
      }
      
      // Step 6: Update the user state to reflect the new email immediately
      setUser(prev => prev ? { ...prev, email: newEmail } : prev);
      
      // Log the email change activity
      await logActivity('email_change', {
        previousEmail: currentLoginEmail,
        newEmail: newEmail,
        timestamp: new Date().toISOString(),
        method: 'verification_code'
      });

      console.log('✅ Email completely replaced!');
      console.log('📧 Previous email:', currentLoginEmail, '(no longer usable for login)');
      console.log('📧 New email:', newEmail, '(now the only login email)');
      console.log('🔄 Account now uses only the new email address');
      
      // Clear pending data
    setPendingEmail(null);
    setPendingCode(null);
    } catch (error) {
      console.error('❌ Error confirming email change:', error);
      throw new Error('Failed to update email. Please try again.');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // Check if user is logged in (works for both Firebase Auth and custom auth)
      const currentUser = auth.currentUser;
      const contextUser = user;
      
      if (!currentUser && !contextUser?.uid) {
        throw new Error('No user logged in. Please log in first.');
      }
      
      // Use the most reliable user ID source
      const userId = contextUser?.uid || currentUser?.uid;
      if (!userId) {
        throw new Error('Unable to identify user. Please log in again.');
      }

      // Special handling for admin accounts
      if (profile.role === 'admin' || contextUser?.email === 'AAadmin' || contextUser?.email === 'agriassistme@gmail.com') {
        console.log('🔐 Admin password change detected');
        
        // For admin accounts, we need to update both login methods
        // First, verify the current password
        if (currentPassword !== 'AAadmin') {
          throw new Error('Current password is incorrect.');
        }
        
        // Update the Firebase Auth password for the email login
        try {
          if (currentUser && currentUser.email === 'agriassistme@gmail.com') {
            // Update Firebase Auth password
            await currentUser.updatePassword(newPassword);
            console.log('✅ Firebase Auth password updated for admin email');
          }
        } catch (firebaseError: any) {
          console.log('⚠️ Could not update Firebase Auth password:', firebaseError.message);
        }
        
        // Update the admin account in Firestore to store the new password
        try {
          const adminDocRef = doc(db, 'users', userId);
          await setDoc(adminDocRef, {
            newPassword: newPassword,
            passwordUpdated: true,
            passwordChangeDate: new Date().toISOString(),
            adminPasswordChanged: true
          }, { merge: true });
          console.log('✅ Admin password updated in Firestore');
        } catch (firestoreError: any) {
          console.log('⚠️ Could not update Firestore password:', firestoreError.message);
        }
        
        console.log('✅ Admin password changed successfully for both login methods');
        return;
      }

      // Password change process started
      
      // First, verify the current password using the same logic as login
      let passwordVerified = false;
      
      if (currentUser) {
        // If we have a Firebase Auth user, verify with Firebase Auth
        try {
          await signInWithEmailAndPassword(auth, currentUser.email || '', currentPassword);
          passwordVerified = true;
        } catch (loginError: any) {
          // Firebase Auth verification failed, try custom password verification
        }
      }
      
      // If Firebase Auth verification failed or no Firebase Auth user, try all password storage locations
      if (!passwordVerified) {
        // Check Firestore first (unified system)
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if ((userData as any).newPassword && (userData as any).newPassword === currentPassword) {
              passwordVerified = true;
            }
          }
        } catch (firestoreError: any) {
          // Could not check Firestore password
        }
        
        // If Firestore check failed, try all temporary storage locations
        if (!passwordVerified) {
          // Check memory storage
          const memoryPassword = getPasswordReset(userId);
          if (memoryPassword.valid && memoryPassword.password === currentPassword) {
            passwordVerified = true;
          }
          
          // Check persistent storage (password reset)
          if (!passwordVerified) {
            const persistentPassword = await getPasswordResetPersistent(userId);
            if (persistentPassword.valid && persistentPassword.password === currentPassword) {
              passwordVerified = true;
            }
          }
          
          // Check changed password storage
          if (!passwordVerified) {
            const changedPassword = await getChangedPasswordPersistent(userId);
            if (changedPassword.valid && changedPassword.password === currentPassword) {
              passwordVerified = true;
            }
          }
          
          // If still not verified, throw error
          if (!passwordVerified) {
            throw new Error('Current password is incorrect. Please check your password and try again.');
          }
        }
      }

      // Log the password change activity
      await logActivity('password_change', {
        timestamp: new Date().toISOString(),
        method: 'privacy_settings'
      });

      // If we get here, the current password is correct
      // Now update the password using the SAME logic as resetPasswordWithCode
      
      try {
        // Get user data to check if they already have passwordResetCompleted
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }
        
        const userData = userDoc.data();
        
        // Check if user already has a new Firebase Auth user (passwordResetCompleted = true)
        if ((userData as any).passwordResetCompleted) {
          try {
            // Clear all temporary password storage first
            await clearAllTemporaryPasswords(userId);
            
            // Store the new password in Firestore as the primary password
            await setDoc(doc(db, 'users', userId), {
              newPassword: newPassword,
              passwordResetCompleted: true,
              passwordChangeDate: new Date().toISOString(),
              passwordUpdated: true
            }, { merge: true });
            
          } catch (firestoreError: any) {
            // If Firestore write fails due to permissions, use persistent storage
            if (firestoreError.code === 'permission-denied') {
              try {
                // Clear all temporary password storage first
                await clearAllTemporaryPasswords(userId);
                
                // Store new password in persistent storage as fallback
                await storePasswordResetPersistent(userId, newPassword);
              } catch (fallbackError: any) {
                throw new Error('Failed to store new password. Please try again.');
              }
              
              // Don't throw error - fallback succeeded
              return;
            } else {
              throw new Error('Failed to store new password. Please try again.');
            }
          }
          
        } else {
          // First time password change - create new Firebase Auth user (same as first time reset)
          try {
            // Create a new Firebase Auth user with the new password
            const newUserCredential = await createUserWithEmailAndPassword(auth, contextUser?.email || currentUser?.email || '', newPassword);
            const newFirebaseUser = newUserCredential.user;
            
            // Update the user's display name if available
            if ((userData as any).name) {
              await fbUpdateProfile(newFirebaseUser, {
                displayName: (userData as any).name
              });
            }
            
            // Update the Firestore document to point to the new Firebase Auth user
            await setDoc(doc(db, 'users', newFirebaseUser.uid), {
              ...(userData as any),
              passwordResetCompleted: true,
              passwordChangeDate: new Date().toISOString(),
              originalFirebaseEmail: currentUser?.email || contextUser?.email
            });
            
            // Delete the old user document
            await setDoc(doc(db, 'users', userId), {
              deleted: true,
              deletedAt: new Date().toISOString(),
              newUserId: newFirebaseUser.uid
            });
            
            // Sign out the new user so they can login normally
            await signOut(auth);
            
          } catch (updateError: any) {
            // If the email is already in use, fall back to memory storage
            if (updateError.code === 'auth/email-already-in-use') {
              try {
                // Clear all temporary password storage first
                await clearAllTemporaryPasswords(userId);
                
                // Store the new password in memory for authentication
                storePasswordReset(userId, newPassword);
              } catch (fallbackError: any) {
                throw new Error('Failed to update password. Please try again.');
              }
              
              // Don't throw error - fallback succeeded
              return;
            } else {
              throw new Error('Failed to update password. Please try again.');
            }
          }
        }
        
      } catch (error: any) {
        throw error;
      }

    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const logActivity = async (activityType: string, details: any) => {
    try {
      if (!user?.uid) return;
      
      const activity = {
        type: activityType,
        details: details,
        timestamp: new Date().toISOString(),
        userAgent: 'AgriAssist Mobile App'
      };
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          activities: {
            [Date.now().toString()]: activity
          }
        }, { merge: true });
      } catch (error) {
        console.log('Could not log activity to database:', error);
      }
    } catch (error) {
      console.log('Activity logging failed:', error);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      console.log('🔄 updateProfile called with data:', profileData);
      console.log('👤 Current user:', user);
      console.log('🆔 User UID:', user?.uid);
      
      if (!user?.uid) {
        console.error('❌ No user logged in - cannot update profile');
        throw new Error('No user logged in. Please log in first.');
      }

      // Log the activity
      const changes = Object.keys(profileData).map(key => `${key}: ${profileData[key as keyof UserProfile]}`);
      console.log('📝 Profile changes:', changes);
      
      try {
        // Filter out undefined values from previousValues to prevent Firestore errors
        const cleanPreviousValues = Object.keys(profile).reduce((acc, key) => {
          const value = profile[key as keyof UserProfile];
          if (value !== undefined && value !== null) {
            acc[key] = value;
          }
          return acc;
        }, {} as any);
        
        await logActivity('profile_update', {
          changes: changes,
          previousValues: cleanPreviousValues
        });
      } catch (activityError) {
        console.log('⚠️ Activity logging failed:', activityError);
      }

      // Update local state first
      console.log('🔄 Updating local state...');
      setProfile(prev => ({ ...prev, ...profileData }));
      console.log('✅ Local state updated');

      // Try to update in Firestore
      try {
        console.log('🔥 Attempting Firestore update...');
        console.log('📄 Document path: users/' + user.uid);
        console.log('📝 Data to save:', profileData);
        
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, profileData, { merge: true });
        
        console.log('✅ Profile updated successfully in Firestore database');
        
        // Verify the update
        const verifyDoc = await getDoc(userDocRef);
        if (verifyDoc.exists()) {
          const savedData = verifyDoc.data();
          console.log('✅ Verification - saved data:', savedData);
        } else {
          console.log('❌ Verification failed - document not found');
        }
        
      } catch (firestoreError: any) {
        console.error('❌ Firestore update failed:', firestoreError);
        console.error('❌ Error code:', firestoreError.code);
        console.error('❌ Error message:', firestoreError.message);
        
        if (firestoreError.code === 'permission-denied') {
          console.log('🔍 Permission denied error detected');
          console.log('🔍 This is likely a Firestore security rules issue');
          console.log('🔍 User does not have write permission to their own document');
          console.log('🔍 Using local storage as fallback...');
        } else {
          console.log('⚠️ Firestore update not available, using local storage only');
        }
        
        // Store profile data in local storage as fallback
        try {
          console.log('💾 Attempting local storage fallback...');
          // Use already imported function
          storeProfileData(user.uid, profileData);
          console.log('✅ Profile updated successfully in local storage');
          console.log('ℹ️ Note: Changes are saved locally but may not persist across devices');
          console.log('ℹ️ Contact admin to fix Firestore permissions for full persistence');
        } catch (localError: any) {
          console.error('❌ Local storage also failed:', localError);
          throw new Error('Failed to update profile. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      // Revert local state on error
      setProfile(prev => ({ ...prev }));
      throw error;
    }
  };

  const updateProfileImage = (uri: string) => {
    setProfile(prev => ({ ...prev, profileImage: uri }));
  };


  const value: AuthContextType = {
    user,
    profile,
    login,
    signup,
    forgotPassword,
    resetPasswordWithCode,
    verifyPasswordResetCode,
    logout,
    updateProfile,
    loading,
    requestEmailChange,
    confirmEmailChange,
    changePassword,
    updateProfileImage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 