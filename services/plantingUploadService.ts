import { get, push, ref, remove, set, update } from "firebase/database";
import { database } from "../FirebaseConfig";

// Call this function with a JS object representing your planting record
// Make sure to include a 'barangay' field for data isolation
export async function uploadPlantingRecord(record: any) {
  if (!record.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, `barangays/${record.barangay}/plantingRecords`));
  await set(newRef, record);
}

// Fetch all planting records, optionally filter by barangay
export async function fetchPlantingRecords(barangay?: string) {
  if (barangay) {
    // Fetch from specific barangay
    const snapshot = await get(ref(database, `barangays/${barangay}/plantingRecords`));
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
        if (barangays[barangayKey].plantingRecords) {
          const records = Object.entries(barangays[barangayKey].plantingRecords).map(([id, data]) => {
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

// Update a planting record by id (include 'barangay' for isolation)
export async function updatePlantingRecord(id: string, data: any) {
  if (!data.barangay) throw new Error('Barangay is required');
  await update(ref(database, `barangays/${data.barangay}/plantingRecords/${id}`), data);
}

// Delete a planting record by id
export async function deletePlantingRecord(id: string) {
  // Note: This would need barangay info to work properly
  // For now, we'll search all barangays
  const snapshot = await get(ref(database, "barangays"));
  if (snapshot.exists()) {
    const barangays = snapshot.val();
    for (const barangayKey in barangays) {
      if (barangays[barangayKey].plantingRecords && barangays[barangayKey].plantingRecords[id]) {
        await remove(ref(database, `barangays/${barangayKey}/plantingRecords/${id}`));
        break;
      }
    }
  }
}

// Delete all planting records
export async function deleteAllPlantingRecords() {
  await remove(ref(database, "barangays"));
} 