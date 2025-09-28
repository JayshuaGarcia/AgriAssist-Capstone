import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile as fbUpdateProfile, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  name: string;
  role: string;
  location: string;
  profileImage: string;
  phone?: string;
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
  updateProfile: (profileData: Partial<UserProfile>) => void;
  loading: boolean;
  requestEmailChange: (newEmail: string) => Promise<string>; // returns verification code
  confirmEmailChange: (code: string) => Promise<void>;
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
    profileImage: ''
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
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              name: userData.name || 'Farmer',
              role: userData.role || 'Farmer',
              location: userData.location || 'Philippines',
              profileImage: userData.profileImage || '',
              phone: userData.phone,
              approved: userData.approved,
              barangay: userData.barangay
            });
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
          profileImage: ''
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real Firebase authentication
  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    try {
      // Check for special admin credentials
      if (email === 'AAadmin' && password === 'AAadmin') {
        // Create a mock admin user for the special admin login
        const mockAdminUser = {
          uid: 'admin-special',
          email: 'AAadmin',
          displayName: 'Admin'
        };
        
        // Set the user state directly
        setUser({
          uid: mockAdminUser.uid,
          email: mockAdminUser.email,
          displayName: mockAdminUser.displayName
        });
        
        // Set admin profile
        setProfile({
          name: 'Admin',
          role: 'admin',
          location: 'Philippines',
          profileImage: '',
          approved: true
        });
        
        setLoading(false);
        return;
      }
      
      // Regular Firebase authentication for other users
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
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
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
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
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const requestEmailChange = async (newEmail: string) => {
    // Generate a simple 6-digit code and pretend to send it via email service
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingEmail(newEmail);
    setPendingCode(code);
    // In a real app, integrate EmailJS/SMTP here to send code to current user email
    return code;
  };

  const confirmEmailChange = async (code: string) => {
    if (!pendingEmail || !pendingCode) throw new Error('No pending email change.');
    if (code !== pendingCode) throw new Error('Invalid verification code.');
    // Apply the email change to the mock user
    setUser(prev => prev ? { ...prev, email: pendingEmail } : prev);
    setPendingEmail(null);
    setPendingCode(null);
  };

  const changePassword = async (_currentPassword: string, _newPassword: string) => {
    // Mock: accept any values with a small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = (profileData: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...profileData }));
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