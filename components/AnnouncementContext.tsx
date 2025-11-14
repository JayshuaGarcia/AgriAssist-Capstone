import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  icon: string;
  date: string;
  timestamp: number;
  createdBy: string;
  createdAt: any;
}

interface AnnouncementContextType {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp' | 'createdAt'>) => Promise<void>;
  loadAnnouncements: () => Promise<void>;
  deleteAnnouncement: (announcementId: string) => Promise<void>;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
};

interface AnnouncementProviderProps {
  children: ReactNode;
}

export const AnnouncementProvider: React.FC<AnnouncementProviderProps> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load announcements from Firebase on component mount
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated (optional for now)
      const currentUser = auth?.currentUser ?? null;
      if (currentUser) {
        console.log('Loading announcements for authenticated user:', currentUser.email);
      } else {
        console.log('Loading announcements for anonymous user');
      }
      
      try {
        // Try to load from Firebase
        const announcementsRef = collection(db, 'announcements');
        const q = query(announcementsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const loadedAnnouncements: Announcement[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          loadedAnnouncements.push({
            id: doc.id,
            title: data.title,
            content: data.content,
            icon: data.icon,
            date: data.date,
            timestamp: data.timestamp,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
          });
        });
        
        setAnnouncements(loadedAnnouncements);
        console.log('Successfully loaded announcements from Firebase');
      } catch (firebaseError) {
        console.warn('Firebase access failed, using local storage:', firebaseError);
        
        // Fallback to AsyncStorage if Firebase fails
        try {
          const localAnnouncements = await AsyncStorage.getItem('announcements');
          if (localAnnouncements) {
            const parsed = JSON.parse(localAnnouncements);
            setAnnouncements(parsed);
            console.log('Loaded announcements from AsyncStorage');
          } else {
            setAnnouncements([]);
            console.log('No local announcements found');
          }
        } catch (storageError) {
          console.warn('AsyncStorage error:', storageError);
          setAnnouncements([]);
        }
      }
    } catch (err) {
      console.error('Error loading announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'timestamp' | 'createdAt'>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated (optional for now)
      const currentUser = auth?.currentUser ?? null;
      if (currentUser) {
        console.log('Creating announcement for authenticated user:', currentUser.email);
      } else {
        console.log('Creating announcement for anonymous user');
      }
      
      const now = new Date();
      const timestamp = now.getTime();
      
      const announcementToAdd = {
        title: announcementData.title,
        content: announcementData.content,
        icon: announcementData.icon,
        date: announcementData.date,
        timestamp: timestamp,
        createdBy: announcementData.createdBy,
        createdAt: now,
      };
      
      try {
        // Try to add to Firebase
        const docRef = await addDoc(collection(db, 'announcements'), announcementToAdd);
        
        // Add to local state immediately for better UX
        const newAnnouncement: Announcement = {
          id: docRef.id,
          ...announcementToAdd,
        };
        
        setAnnouncements(prev => [newAnnouncement, ...prev]);
        console.log('Successfully added announcement to Firebase');
      } catch (firebaseError) {
        console.warn('Firebase access failed, using local storage:', firebaseError);
        
        // Fallback to AsyncStorage
        const newAnnouncement: Announcement = {
          id: `local_${timestamp}`,
          ...announcementToAdd,
        };
        
        // Update local state
        setAnnouncements(prev => [newAnnouncement, ...prev]);
        
        // Save to AsyncStorage
        try {
          const updatedAnnouncements = [newAnnouncement, ...announcements];
          await AsyncStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
          console.log('Added announcement to AsyncStorage');
        } catch (storageError) {
          console.warn('AsyncStorage save error:', storageError);
        }
      }
    } catch (err) {
      console.error('Error adding announcement:', err);
      setError('Failed to create announcement');
      throw err; // Re-throw so the calling component can handle it
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Remove from local state immediately for better UX
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementId));
      
      try {
        // Delete from Firebase
        const announcementRef = doc(db, 'announcements', announcementId);
        await deleteDoc(announcementRef);
        console.log('Announcement deleted from Firebase:', announcementId);
      } catch (firebaseError) {
        console.warn('Firebase deletion failed, updating local storage:', firebaseError);
        
        // Fallback to AsyncStorage if Firebase fails
        try {
          const localAnnouncements = await AsyncStorage.getItem('announcements');
          if (localAnnouncements) {
            const parsed = JSON.parse(localAnnouncements);
            const updatedAnnouncements = parsed.filter((announcement: Announcement) => announcement.id !== announcementId);
            await AsyncStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
            console.log('Announcement deleted from AsyncStorage:', announcementId);
          }
        } catch (storageError) {
          console.warn('AsyncStorage deletion error:', storageError);
          // If both Firebase and AsyncStorage fail, reload to restore state
          loadAnnouncements();
        }
      }
      
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement');
      // Reload announcements to restore state
      loadAnnouncements();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnnouncementContext.Provider value={{ 
      announcements, 
      loading, 
      error, 
      addAnnouncement, 
      loadAnnouncements,
      deleteAnnouncement
    }}>
      {children}
    </AnnouncementContext.Provider>
  );
};
