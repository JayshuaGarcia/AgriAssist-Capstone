import { useRouter } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthUser, FirebaseAuthService } from '../services/firebaseAuth';
import { FirestoreService } from '../services/firestoreService';

interface UserProfile {
  name: string;
  role: string;
  location: string;
  profileImage: string;
  approved?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile;
  login: (email: string, password: string, role: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
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

  const login = async (email: string, password: string, role: string) => {
    try {
      setLoading(true);
      await FirebaseAuthService.signIn(email, password);
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (currentUser) {
        const userProfile = await FirestoreService.getUserProfile(currentUser.uid);
        if (!userProfile) throw new Error('User profile not found');
        if (userProfile.role !== role) throw new Error('Role mismatch');
        if (!userProfile.approved) throw new Error('Your account is pending approval');
        setProfile({
          name: userProfile.name,
          role: userProfile.role,
          location: '',
          profileImage: '',
          approved: userProfile.approved
        });
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    try {
      setLoading(true);
      const userCredential = await FirebaseAuthService.signUp(email, password, role);
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (currentUser) {
        const userProfile = await FirestoreService.getUserProfile(currentUser.uid);
        setProfile({
          name: userProfile?.name || name,
          role: userProfile?.role || role,
          location: '',
          profileImage: '',
          approved: userProfile?.approved ?? (role === 'Admin')
        });
      }
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