import { get, push, ref, remove, set, update } from "firebase/database";
import { database } from "../FirebaseConfig";

// Call this function with a JS object representing your farmer profile
// Make sure to include a 'barangay' field for data isolation
export async function uploadFarmerProfile(record: any) {
  if (!record.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, `barangays/${record.barangay}/farmerProfiles`));
  await set(newRef, record);
}

// Fetch all farmer profiles, optionally filter by barangay
export async function fetchFarmerProfiles(barangay?: string) {
  if (barangay) {
    // Fetch from specific barangay
    const snapshot = await get(ref(database, `barangays/${barangay}/farmerProfiles`));
    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]) => {
        if (typeof data === 'object' && data !== null) {
          return { id, ...data };
        } else {
          return { id, value: data };
        }
      });
    }
    return [];
  } else {
    // Fetch from all barangays
    const snapshot = await get(ref(database, "barangays"));
    if (snapshot.exists()) {
      let allProfiles: any[] = [];
      const barangays = snapshot.val();
      
      for (const barangayKey in barangays) {
        if (barangays[barangayKey].farmerProfiles) {
          const profiles = Object.entries(barangays[barangayKey].farmerProfiles).map(([id, data]) => {
            if (typeof data === 'object' && data !== null) {
              return { id, ...data };
            } else {
              return { id, value: data };
            }
          });
          allProfiles = [...allProfiles, ...profiles];
        }
      }
      return allProfiles;
    }
    return [];
  }
}

// Update a farmer profile by id (include 'barangay' for isolation)
export async function updateFarmerProfile(id: string, data: any) {
  if (!data.barangay) throw new Error('Barangay is required');
  await update(ref(database, `barangays/${data.barangay}/farmerProfiles/${id}`), data);
}

// Delete a farmer profile by id
export async function deleteFarmerProfile(id: string) {
  // Note: This would need barangay info to work properly
  // For now, we'll search all barangays
  const snapshot = await get(ref(database, "barangays"));
  if (snapshot.exists()) {
    const barangays = snapshot.val();
    for (const barangayKey in barangays) {
      if (barangays[barangayKey].farmerProfiles && barangays[barangayKey].farmerProfiles[id]) {
        await remove(ref(database, `barangays/${barangayKey}/farmerProfiles/${id}`));
        break;
      }
    }
  }
}

// Delete all farmer profiles
export async function deleteAllFarmerProfiles() {
  await remove(ref(database, "barangays"));
} 