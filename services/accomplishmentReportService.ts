import { get, push, ref, remove, set } from "firebase/database";
import { database } from "../FirebaseConfig";

// Upload an accomplishment report (must include 'barangay')
export async function uploadAccomplishmentReport(report: any) {
  if (!report.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, `barangays/${report.barangay}/accomplishmentReports`));
  await set(newRef, report);
}

// Fetch all accomplishment reports, optionally filter by barangay
export async function fetchAccomplishmentReports(barangay?: string) {
  if (barangay) {
    // Fetch from specific barangay
    const snapshot = await get(ref(database, `barangays/${barangay}/accomplishmentReports`));
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
      let allReports: any[] = [];
      const barangays = snapshot.val();
      
      for (const barangayKey in barangays) {
        if (barangays[barangayKey].accomplishmentReports) {
          const reports = Object.entries(barangays[barangayKey].accomplishmentReports).map(([id, data]) => {
            if (typeof data === 'object' && data !== null) {
              return { id, ...data };
            } else {
              return { id, value: data };
            }
          });
          allReports = [...allReports, ...reports];
        }
      }
      return allReports;
    }
    return [];
  }
}

// Delete an accomplishment report by id
export async function deleteAccomplishmentReport(id: string) {
  // Note: This would need barangay info to work properly
  // For now, we'll search all barangays
  const snapshot = await get(ref(database, "barangays"));
  if (snapshot.exists()) {
    const barangays = snapshot.val();
    for (const barangayKey in barangays) {
      if (barangays[barangayKey].accomplishmentReports && barangays[barangayKey].accomplishmentReports[id]) {
        await remove(ref(database, `barangays/${barangayKey}/accomplishmentReports/${id}`));
        break;
      }
    }
  }
} 