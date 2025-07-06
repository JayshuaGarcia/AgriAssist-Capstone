import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { FirebaseAuthService, AuthUser } from '../services/firebaseAuth';

interface UserProfile {
  name: string;
  role: string;
  location: string;
  profileImage: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<UserProfile>) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Sarah Johnson',
    role: 'Agricultural Officer',
    location: 'Manila, Philippines',
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg'
  });
  const router = useRouter();

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const authUser = FirebaseAuthService.convertToAuthUser(firebaseUser);
        setUser(authUser);
        
        // Update profile with user info
        setProfile(prev => ({
          ...prev,
          name: firebaseUser.displayName || authUser.email?.split('@')[0] || 'User',
          profileImage: firebaseUser.photoURL || prev.profileImage
        }));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await FirebaseAuthService.signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const userCredential = await FirebaseAuthService.signUp(email, password);
      
      // Update profile with the new user's name
      setProfile(prev => ({
        ...prev,
        name: name
      }));
      
      router.replace('/(tabs)');
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await FirebaseAuthService.signOut();
      setUser(null);
      router.replace('/');
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (profileData: Partial<UserProfile>) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      ...profileData
    }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      login, 
      signup, 
      logout, 
      updateProfile,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}; 