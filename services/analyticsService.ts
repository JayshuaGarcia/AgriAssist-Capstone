import { get, push, ref, remove, set } from "firebase/database";
import { database } from "../FirebaseConfig";

// Upload an analytics entry (must include 'barangay')
export async function uploadAnalyticsEntry(entry: any) {
  if (!entry.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, "analyticsData"));
  await set(newRef, entry);
}

// Fetch all analytics entries, optionally filter by barangay
export async function fetchAnalyticsEntries(barangay?: string) {
  const snapshot = await get(ref(database, "analyticsData"));
  if (snapshot.exists()) {
    let entries = Object.entries(snapshot.val()).map(([id, data]) => {
      if (typeof data === 'object' && data !== null) {
        return { id, ...data };
      } else {
        return { id, value: data };
      }
    });
    if (barangay) {
      entries = entries.filter(entry => typeof entry === 'object' && entry !== null && 'barangay' in entry && entry.barangay === barangay);
    }
    return entries;
  }
  return [];
}

// Delete an analytics entry by id
export async function deleteAnalyticsEntry(id: string) {
  await remove(ref(database, `analyticsData/${id}`));
} 