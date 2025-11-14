import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { FirebaseAuthService } from '../services/firebaseAuth';

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
  logout: () => void;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
  requestEmailChange: (newEmail: string) => Promise<string>; // returns verification code
  confirmEmailChange: (code: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfileImage: (uri: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
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

  // Observe Firebase auth state
  useEffect(() => {
    setLoading(true);
    const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (fbUser) => {
      try {
        if (fbUser) {
          const authUser: AuthUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || null,
          };
          setUser(authUser);
          // Load profile for signed-in user
          if (fbUser.email) {
            const userProfile = await loadUserProfile(fbUser.email, profile.role || 'Farmer');
            setProfile(userProfile);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });
    
    // Set loading to false after a short delay to ensure auth state is checked
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Load user profile from Firebase
  const loadUserProfile = async (email: string, role: string) => {
    try {
      console.log('🔍 Loading user profile for email:', email);
      
      // Query users collection by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        console.log('⚠️ No user found with email:', email);
        // Return default profile if user not found
        return {
          name: email.split('@')[0], // Use email prefix as name
          role: role,
          location: 'Philippines',
          profileImage: '',
          selectedCropIcon: 'rice',
          selectedCropEmoji: '🌱',
          selectedCropName: 'Seedling'
        };
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('✅ User profile loaded:', {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        selectedCropEmoji: userData.selectedCropEmoji
      });
      
      return {
        name: userData.name || email.split('@')[0],
        role: userData.role || role,
        location: userData.location || 'Philippines',
        profileImage: userData.profileImage || '',
        selectedCropIcon: userData.selectedCropIcon || 'rice',
        selectedCropEmoji: userData.selectedCropEmoji || '🌱',
        selectedCropName: userData.selectedCropName || 'Seedling',
        phone: userData.phone || '',
        backupEmail: userData.backupEmail || '',
        approved: userData.approved || false,
        barangay: userData.barangay || ''
      };
    } catch (error: any) {
      console.error('❌ Error loading user profile:', error);
      // Return default profile on error
      return {
        name: email.split('@')[0],
        role: role,
        location: 'Philippines',
        profileImage: '',
        selectedCropIcon: 'rice',
        selectedCropEmoji: '🌱',
        selectedCropName: 'Seedling'
      };
    }
  };

  // Password verification and storage functions
  const hashPassword = (password: string): string => {
    // Simple hash function - in production, use bcrypt or similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  const verifyPassword = async (email: string, password: string): Promise<boolean> => {
    try {
      // Query users collection by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        return false; // User not found
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const storedPasswordHash = userData.passwordHash;
      
      if (!storedPasswordHash) {
        return false; // No password stored
      }
      
      const inputPasswordHash = hashPassword(password);
      return storedPasswordHash === inputPasswordHash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  const storePassword = async (email: string, password: string): Promise<void> => {
    try {
      const passwordHash = hashPassword(password);
      
      // Query users collection by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const userSnapshot = await getDocs(usersQuery);
      
      if (!userSnapshot.empty) {
        // Update existing user with password
        const userDoc = userSnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          passwordHash: passwordHash
        });
      } else {
        // Create new user with password
        await addDoc(collection(db, 'users'), {
          email: email,
          passwordHash: passwordHash,
          name: email.split('@')[0],
          role: 'Farmer',
          location: 'Philippines',
          profileImage: '',
          selectedCropIcon: 'rice',
          selectedCropEmoji: '🌱',
          selectedCropName: 'Seedling',
          phone: '',
          backupEmail: '',
          approved: false,
          barangay: '',
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Password storage error:', error);
      throw error;
    }
  };

  // Real authentication functions
  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    try {
      // Admin backdoor (no Firebase sign-in)
      if ((email === 'AAadmin' || email === 'agriassistme@gmail.com') && password === 'AAadmin') {
        const userProfile = await loadUserProfile('agriassistme@gmail.com', 'admin');
        setUser({ uid: 'admin-user-id', email: 'agriassistme@gmail.com', displayName: 'Admin' });
        setProfile({ ...userProfile, name: 'Admin', role: 'admin' });
        router.replace('/admin');
        return;
      }

      // Use Firebase Auth for regular users
      const cred = await FirebaseAuthService.signIn(email, password);
      const userProfile = await loadUserProfile(email, role);
      setUser({ uid: cred.user.uid, email: cred.user.email, displayName: userProfile.name || email.split('@')[0] });
      setProfile(userProfile);
      
      if (role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: string, barangay: string) => {
    setLoading(true);
    try {
      // Create Firebase Auth account
      const cred = await FirebaseAuthService.signUp(email, password);
      setUser({ uid: cred.user.uid, email: cred.user.email, displayName: name });
      const userProfile = await loadUserProfile(email, role);
      setProfile({ ...userProfile, name, role, barangay });
      
      // Navigate to the appropriate screen after signup
      if (role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      console.log('🔐 Sending Firebase password reset email for:', email);
      await FirebaseAuthService.resetPassword(email);
      console.log('✅ Firebase password reset email triggered');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
      // Find user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        throw new Error('User not found');
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check if reset code exists and is valid
      if (!userData.resetCode || !userData.resetCodeExpiry) {
        throw new Error('No valid reset code found. Please request a new code.');
      }
      
      // Check if code matches
      if (userData.resetCode !== code) {
        throw new Error('Invalid verification code');
      }
      
      // Check if code has expired
      const now = new Date();
      const expiry = userData.resetCodeExpiry.toDate();
      if (now > expiry) {
        throw new Error('Verification code has expired. Please request a new code.');
      }
      
      // Hash the new password
      const newPasswordHash = hashPassword(newPassword);
      
      // Update password and clear reset code
      await updateDoc(doc(db, 'users', userDoc.id), {
        passwordHash: newPasswordHash,
        resetCode: null,
        resetCodeExpiry: null
      });
      
      console.log('✅ Password reset successful');
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const verifyPasswordResetCode = async (email: string, code: string) => {
    try {
      // Find user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        throw new Error('User not found');
      }
      
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check if reset code exists and is valid
      if (!userData.resetCode || !userData.resetCodeExpiry) {
        throw new Error('No valid reset code found. Please request a new code.');
      }
      
      // Check if code matches
      if (userData.resetCode !== code) {
        throw new Error('Invalid verification code');
      }
      
      // Check if code has expired
      const now = new Date();
      const expiry = userData.resetCodeExpiry.toDate();
      if (now > expiry) {
        throw new Error('Verification code has expired. Please request a new code.');
      }
      
      console.log('✅ Verification code is valid');
    } catch (error: any) {
      console.error('Verify code error:', error);
      throw error;
    }
  };

  const requestEmailChange = async (newEmail: string) => {
    try {
      // Mock request email change - always succeeds
      console.log('✅ Mock request email change successful');
      return 'mock-code';
    } catch (error) {
      throw new Error('Mock request email change failed');
    }
  };

  const confirmEmailChange = async (code: string, currentPassword: string) => {
    try {
      // Mock confirm email change - always succeeds
      console.log('✅ Mock confirm email change successful');
    } catch (error) {
      throw new Error('Mock confirm email change failed');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await FirebaseAuthService.changePassword(currentPassword, newPassword);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await FirebaseAuthService.signOut();
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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const logActivity = async (activityType: string, details: any) => {
    try {
      // Mock log activity - always succeeds
      console.log('✅ Mock log activity successful');
    } catch (error) {
      console.log('Mock activity logging failed:', error);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      console.log('🔄 Updating profile with data:', profileData);
      
      // Update local state first
      setProfile(prev => ({ ...prev, ...profileData }));
      
      // Save to Firebase if user is logged in
      if (user?.email) {
        try {
          console.log('💾 Saving profile to Firebase for user:', user.email);
          
          // Query users collection by email
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', user.email)
          );
          
          const userSnapshot = await getDocs(usersQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userRef = doc(db, 'users', userDoc.id);
            
            // Update the document with new profile data
            await updateDoc(userRef, {
              ...profileData,
              updatedAt: new Date().toISOString()
            });
            
            console.log('✅ Profile saved to Firebase successfully');
          } else {
            console.log('⚠️ No user document found to update');
          }
        } catch (firebaseError) {
          console.error('❌ Error saving to Firebase:', firebaseError);
          // Don't throw error - local state is still updated
        }
      } else {
        console.log('⚠️ No user logged in, only updating local state');
      }
      
      console.log('✅ Profile update successful');
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  };

  const updateProfileImage = async (uri: string) => {
    try {
      console.log('🖼️ Updating profile image:', uri);
      
      // Update local state first
      setProfile(prev => ({ ...prev, profileImage: uri }));
      
      // Save to Firebase if user is logged in
      if (user?.email) {
        try {
          console.log('💾 Saving profile image to Firebase for user:', user.email);
          
          // Query users collection by email
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', user.email)
          );
          
          const userSnapshot = await getDocs(usersQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userRef = doc(db, 'users', userDoc.id);
            
            // Update the document with new profile image
            await updateDoc(userRef, {
              profileImage: uri,
              updatedAt: new Date().toISOString()
            });
            
            console.log('✅ Profile image saved to Firebase successfully');
          } else {
            console.log('⚠️ No user document found to update');
          }
        } catch (firebaseError) {
          console.error('❌ Error saving profile image to Firebase:', firebaseError);
          // Don't throw error - local state is still updated
        }
      } else {
        console.log('⚠️ No user logged in, only updating local state');
      }
      
      console.log('✅ Profile image update successful');
    } catch (error) {
      console.error('❌ Profile image update error:', error);
    }
  };


  const value: AuthContextType = {
    user,
    profile,
    login,
    signup,
    forgotPassword,
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