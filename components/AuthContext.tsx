import { useRouter } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthUser, FirebaseAuthService } from '../services/firebaseAuth';
import { FirestoreService } from '../services/firestoreService';
import { useBarangay } from './RoleContext';

interface UserProfile {
  name: string;
  role: string;
  location: string;
  profileImage: string;
  approved?: boolean;
  barangay?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile;
  login: (email: string, password: string, role: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string, barangay: string) => Promise<void>;
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
  const { barangay } = useBarangay();

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const authUser = FirebaseAuthService.convertToAuthUser(firebaseUser);
        setUser(authUser);
        
        // Get user profile from Firestore
        try {
          const userProfile = await FirestoreService.getUserProfile(firebaseUser.uid);
          if (userProfile) {
            setProfile({
              name: userProfile.name,
              role: userProfile.role,
              location: '',
              profileImage: firebaseUser.photoURL || '',
              approved: userProfile.approved,
              barangay: userProfile.barangay
            });

            // Check if user is approved, if not redirect to pending approval
            if (!userProfile.approved && userProfile.role !== 'Admin') {
              router.replace('/pending-approval');
            }
          } else {
            // Update profile with user info if no Firestore profile
            setProfile(prev => ({
              ...prev,
              name: firebaseUser.displayName || authUser.email?.split('@')[0] || 'User',
              profileImage: firebaseUser.photoURL || prev.profileImage
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Update profile with user info if error
          setProfile(prev => ({
            ...prev,
            name: firebaseUser.displayName || authUser.email?.split('@')[0] || 'User',
            profileImage: firebaseUser.photoURL || prev.profileImage
          }));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [router]);

  const login = async (email: string, password: string, role: string) => {
    try {
      setLoading(true);
      
      // First, attempt Firebase authentication
      await FirebaseAuthService.signIn(email, password);
      
      // If authentication succeeds, get the current user
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Authentication failed');
      }
      
      // Then fetch user profile from Firestore
        const userProfile = await FirestoreService.getUserProfile(currentUser.uid);
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      // Check role mismatch
      if (userProfile.role !== role) {
        throw new Error('Role mismatch');
      }
      
      // Check if user is approved
      if (!userProfile.approved) {
        throw new Error('Your account is pending approval');
      }
      
      // Check barangay access - only BAEWs and Viewers are restricted to their assigned barangay
      console.log('Login validation:', {
        userRole: userProfile.role,
        userBarangay: userProfile.barangay,
        selectedBarangay: barangay,
        isAdmin: userProfile.role === 'Admin'
      });
      
      if (userProfile.role !== 'Admin' && userProfile.barangay && barangay && userProfile.barangay !== barangay) {
        throw new Error(`You can only access ${userProfile.barangay} barangay. Please select the correct barangay.`);
      }
      
      // Set profile and navigate
        setProfile({
          name: userProfile.name,
          role: userProfile.role,
          location: '',
          profileImage: '',
        approved: userProfile.approved,
        barangay: userProfile.barangay
        });
      
      router.replace('/(tabs)');
    } catch (error: any) {
      // Re-throw the error as-is to preserve the original error message
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: string, barangay: string) => {
    try {
      setLoading(true);
      const userCredential = await FirebaseAuthService.signUp(email, password, role, barangay);
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (currentUser) {
        const userProfile = await FirestoreService.getUserProfile(currentUser.uid);
        const isApproved = userProfile?.approved ?? (role === 'Admin');
        
        setProfile({
          name: userProfile?.name || name,
          role: userProfile?.role || role,
          location: '',
          profileImage: '',
          approved: isApproved,
          barangay: userProfile?.barangay || barangay
        });

        // Check if user is approved
        if (!isApproved) {
          // Navigate to pending approval screen for non-admin users
          router.replace('/pending-approval');
        } else {
          // Navigate to main app for approved users (Admin)
          router.replace('/(tabs)');
        }
      }
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
      // Navigate directly to login page
      router.replace('/login');
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