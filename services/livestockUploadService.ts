import { get, push, ref, remove, set, update } from "firebase/database";
import { database } from "../FirebaseConfig";

// Call this function with a JS object representing your livestock record
// Make sure to include a 'barangay' field for data isolation
export async function uploadLivestockRecord(record: any) {
  if (!record.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, `barangays/${record.barangay}/livestockRecords`));
  await set(newRef, record);
}

// Fetch all livestock records, optionally filter by barangay
export async function fetchLivestockRecords(barangay?: string) {
  if (barangay) {
    // Fetch from specific barangay
    const snapshot = await get(ref(database, `barangays/${barangay}/livestockRecords`));
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
      let allRecords: any[] = [];
      const barangays = snapshot.val();
      
      for (const barangayKey in barangays) {
        if (barangays[barangayKey].livestockRecords) {
          const records = Object.entries(barangays[barangayKey].livestockRecords).map(([id, data]) => {
            if (typeof data === 'object' && data !== null) {
              return { id, ...data };
            } else {
              return { id, value: data };
            }
          });
          allRecords = [...allRecords, ...records];
        }
      }
      return allRecords;
    }
    return [];
  }
}

// Update a livestock record by id (include 'barangay' for isolation)
export async function updateLivestockRecord(id: string, data: any) {
  if (!data.barangay) throw new Error('Barangay is required');
  await update(ref(database, `barangays/${data.barangay}/livestockRecords/${id}`), data);
}

// Delete a livestock record by id
export async function deleteLivestockRecord(id: string) {
  // Note: This would need barangay info to work properly
  // For now, we'll search all barangays
  const snapshot = await get(ref(database, "barangays"));
  if (snapshot.exists()) {
    const barangays = snapshot.val();
    for (const barangayKey in barangays) {
      if (barangays[barangayKey].livestockRecords && barangays[barangayKey].livestockRecords[id]) {
        await remove(ref(database, `barangays/${barangayKey}/livestockRecords/${id}`));
        break;
      }
    }
  }
}

// Delete all livestock records
export async function deleteAllLivestockRecords() {
  await remove(ref(database, "barangays"));
} 