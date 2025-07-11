import { get, push, ref, remove, set } from "firebase/database";
import { database } from "../FirebaseConfig";

// Upload a fertilizer log (must include 'barangay')
export async function uploadFertilizerLog(log: any) {
  if (!log.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, `barangays/${log.barangay}/fertilizerLogs`));
  await set(newRef, log);
}

// Fetch all fertilizer logs, optionally filter by barangay
export async function fetchFertilizerLogs(barangay?: string) {
  if (barangay) {
    // Fetch from specific barangay
    const snapshot = await get(ref(database, `barangays/${barangay}/fertilizerLogs`));
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
      let allLogs: any[] = [];
      const barangays = snapshot.val();
      
      for (const barangayKey in barangays) {
        if (barangays[barangayKey].fertilizerLogs) {
          const logs = Object.entries(barangays[barangayKey].fertilizerLogs).map(([id, data]) => {
            if (typeof data === 'object' && data !== null) {
              return { id, ...data };
            } else {
              return { id, value: data };
            }
          });
          allLogs = [...allLogs, ...logs];
        }
      }
      return allLogs;
    }
    return [];
  }
}

// Delete a fertilizer log by id
export async function deleteFertilizerLog(id: string) {
  // Note: This would need barangay info to work properly
  // For now, we'll search all barangays
  const snapshot = await get(ref(database, "barangays"));
  if (snapshot.exists()) {
    const barangays = snapshot.val();
    for (const barangayKey in barangays) {
      if (barangays[barangayKey].fertilizerLogs && barangays[barangayKey].fertilizerLogs[id]) {
        await remove(ref(database, `barangays/${barangayKey}/fertilizerLogs/${id}`));
        break;
      }
    }
  }
} 