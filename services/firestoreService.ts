import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';

// Define interfaces for your agricultural data
export interface Farmer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  farmSize: number;
  crops: string[];
  livestock?: string[];
  registrationDate: Date;
  status: 'active' | 'inactive';
}

export interface CropData {
  id?: string;
  farmerId: string;
  cropName: string;
  plantingDate: Date;
  harvestDate?: Date;
  yield: number;
  area: number;
  status: 'planted' | 'growing' | 'harvested';
  notes?: string;
}

export interface LivestockData {
  id?: string;
  farmerId: string;
  animalType: string;
  quantity: number;
  healthStatus: 'healthy' | 'sick' | 'vaccinated';
  lastVaccination?: Date;
  notes?: string;
}

export interface MonitoringData {
  id?: string;
  farmerId: string;
  date: Date;
  cropName?: string;
  livestockType?: string;
  observation: string;
  actionTaken?: string;
  nextVisit?: Date;
}

export class FirestoreService {
  // Collection names
  private static COLLECTIONS = {
    FARMERS: 'farmers',
    CROPS: 'crops',
    LIVESTOCK: 'livestock',
    MONITORING: 'monitoring',
    USERS: 'users'
  };

  // ===== FARMER OPERATIONS =====
  
  // Add a new farmer
  static async addFarmer(farmer: Omit<Farmer, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.FARMERS), {
        ...farmer,
        registrationDate: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to add farmer');
    }
  }

  // Get all farmers
  static async getAllFarmers(): Promise<Farmer[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTIONS.FARMERS));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Farmer[];
    } catch (error) {
      throw new Error('Failed to fetch farmers');
    }
  }

  // Get farmer by ID
  static async getFarmerById(farmerId: string): Promise<Farmer | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.FARMERS, farmerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Farmer;
      }
      return null;
    } catch (error) {
      throw new Error('Failed to fetch farmer');
    }
  }

  // Update farmer
  static async updateFarmer(farmerId: string, updates: Partial<Farmer>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.FARMERS, farmerId);
      await updateDoc(docRef, updates);
    } catch (error) {
      throw new Error('Failed to update farmer');
    }
  }

  // Delete farmer
  static async deleteFarmer(farmerId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.FARMERS, farmerId);
      await deleteDoc(docRef);
    } catch (error) {
      throw new Error('Failed to delete farmer');
    }
  }

  // ===== CROP OPERATIONS =====

  // Add crop data
  static async addCropData(cropData: Omit<CropData, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.CROPS), cropData);
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to add crop data');
    }
  }

  // Get crops by farmer
  static async getCropsByFarmer(farmerId: string): Promise<CropData[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.CROPS),
        where('farmerId', '==', farmerId),
        orderBy('plantingDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CropData[];
    } catch (error) {
      throw new Error('Failed to fetch crop data');
    }
  }

  // ===== LIVESTOCK OPERATIONS =====

  // Add livestock data
  static async addLivestockData(livestockData: Omit<LivestockData, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.LIVESTOCK), livestockData);
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to add livestock data');
    }
  }

  // Get livestock by farmer
  static async getLivestockByFarmer(farmerId: string): Promise<LivestockData[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.LIVESTOCK),
        where('farmerId', '==', farmerId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LivestockData[];
    } catch (error) {
      throw new Error('Failed to fetch livestock data');
    }
  }

  // ===== MONITORING OPERATIONS =====

  // Add monitoring data
  static async addMonitoringData(monitoringData: Omit<MonitoringData, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.MONITORING), {
        ...monitoringData,
        date: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to add monitoring data');
    }
  }

  // Get monitoring data by farmer
  static async getMonitoringByFarmer(farmerId: string): Promise<MonitoringData[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.MONITORING),
        where('farmerId', '==', farmerId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MonitoringData[];
    } catch (error) {
      throw new Error('Failed to fetch monitoring data');
    }
  }

  // ===== ANALYTICS & REPORTING =====

  // Get farmers by location
  static async getFarmersByLocation(location: string): Promise<Farmer[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.FARMERS),
        where('location', '==', location),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Farmer[];
    } catch (error) {
      throw new Error('Failed to fetch farmers by location');
    }
  }

  // Get crop statistics
  static async getCropStatistics(): Promise<any> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTIONS.CROPS));
      const crops = querySnapshot.docs.map(doc => doc.data());
      
      // Calculate statistics
      const totalCrops = crops.length;
      const totalYield = crops.reduce((sum, crop) => sum + (crop.yield || 0), 0);
      const totalArea = crops.reduce((sum, crop) => sum + (crop.area || 0), 0);
      
      return {
        totalCrops,
        totalYield,
        totalArea,
        averageYield: totalCrops > 0 ? totalYield / totalCrops : 0
      };
    } catch (error) {
      throw new Error('Failed to fetch crop statistics');
    }
  }

  // ===== USER PROFILE OPERATIONS =====
  static async createUserProfile(uid: string, profile: { name: string; email: string; role: string; approved: boolean }): Promise<void> {
    try {
      await addDoc(collection(db, this.COLLECTIONS.USERS), {
        uid,
        ...profile
      });
    } catch (error) {
      throw new Error('Failed to create user profile');
    }
  }

  static async getUserProfile(uid: string): Promise<any> {
    try {
      const q = query(collection(db, this.COLLECTIONS.USERS), where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
      return null;
    } catch (error) {
      throw new Error('Failed to fetch user profile');
    }
  }

  static async updateUserProfile(uid: string, updates: Partial<{ name: string; email: string; role: string; approved: boolean }>): Promise<void> {
    try {
      const q = query(collection(db, this.COLLECTIONS.USERS), where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, this.COLLECTIONS.USERS, docId);
        await updateDoc(docRef, updates);
      }
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  }
} 