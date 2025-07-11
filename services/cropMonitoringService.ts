import { get, push, ref, remove, set } from "firebase/database";
import { database } from "../FirebaseConfig";

// Upload a crop monitoring report (must include 'barangay')
export async function uploadCropMonitoringReport(report: any) {
  if (!report.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, `barangays/${report.barangay}/cropMonitoringReports`));
  await set(newRef, report);
}

// Fetch all crop monitoring reports, optionally filter by barangay
export async function fetchCropMonitoringReports(barangay?: string) {
  if (barangay) {
    // Fetch from specific barangay
    const snapshot = await get(ref(database, `barangays/${barangay}/cropMonitoringReports`));
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
        if (barangays[barangayKey].cropMonitoringReports) {
          const reports = Object.entries(barangays[barangayKey].cropMonitoringReports).map(([id, data]) => {
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

// Delete a crop monitoring report by id
export async function deleteCropMonitoringReport(id: string) {
  // Note: This would need barangay info to work properly
  // For now, we'll search all barangays
  const snapshot = await get(ref(database, "barangays"));
  if (snapshot.exists()) {
    const barangays = snapshot.val();
    for (const barangayKey in barangays) {
      if (barangays[barangayKey].cropMonitoringReports && barangays[barangayKey].cropMonitoringReports[id]) {
        await remove(ref(database, `barangays/${barangayKey}/cropMonitoringReports/${id}`));
        break;
      }
    }
  }
} 