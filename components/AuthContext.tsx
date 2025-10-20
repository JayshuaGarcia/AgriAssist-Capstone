import { useRouter } from 'expo-router';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';

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

  // Mock authentication state - no Firebase dependency
  useEffect(() => {
    // Simulate loading completion
    setLoading(false);
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

  // Mock authentication functions
  const login = async (email: string, password: string, role: string) => {
    console.log('🚀 MOCK LOGIN with email:', email, 'role:', role);
    setLoading(true);
    
    try {
      // Load real user profile from Firebase
      const userProfile = await loadUserProfile(email, role);
      
      // Create mock user with real profile data
      const mockUser: AuthUser = {
        uid: 'mock-user-id',
        email: email,
        displayName: userProfile.name
      };
      
      setUser(mockUser);
      setProfile(userProfile);
      
      console.log('✅ Mock login successful with real profile data');
      
      // Navigate based on role
      if (role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.log('❌ Mock login error:', error);
      throw new Error('Mock login failed');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: string, barangay: string) => {
    setLoading(true);
    try {
      // Mock signup - always succeeds
      console.log('✅ Mock signup successful');
    } catch (error: any) {
      throw new Error('Mock signup failed');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      // Mock forgot password - always succeeds
      console.log('✅ Mock forgot password successful');
    } catch (error: any) {
      throw new Error('Mock forgot password failed');
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
      // Mock reset password - always succeeds
      console.log('✅ Mock reset password successful');
    } catch (error: any) {
      throw new Error('Mock reset password failed');
    }
  };

  const verifyPasswordResetCode = async (email: string, code: string) => {
    try {
      // Mock verify code - always succeeds
      console.log('✅ Mock verify code successful');
    } catch (error: any) {
      throw new Error('Mock verify code failed');
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
      // Mock change password - always succeeds
      console.log('✅ Mock change password successful');
    } catch (error: any) {
      throw new Error('Mock change password failed');
    }
  };

  const logout = async () => {
    try {
      // Mock logout - always succeeds
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
      console.log('✅ Mock logout successful');
    } catch (error) {
      console.error('Mock logout error:', error);
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