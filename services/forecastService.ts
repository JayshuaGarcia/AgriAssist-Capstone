import { get, push, ref, remove, set } from "firebase/database";
import { database } from "../FirebaseConfig";

// Upload a forecast entry (must include 'barangay')
export async function uploadForecastEntry(entry: any) {
  if (!entry.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, "forecastData"));
  await set(newRef, entry);
}

// Fetch all forecast entries, optionally filter by barangay
export async function fetchForecastEntries(barangay?: string) {
  const snapshot = await get(ref(database, "forecastData"));
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

// Delete a forecast entry by id
export async function deleteForecastEntry(id: string) {
  await remove(ref(database, `forecastData/${id}`));
} 