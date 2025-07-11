import { get, push, ref, remove, set } from "firebase/database";
import { database } from "../FirebaseConfig";

// Upload a commodity entry (must include 'barangay')
export async function uploadCommodityEntry(entry: any) {
  if (!entry.barangay) throw new Error('Barangay is required');
  const newRef = push(ref(database, "commodityMap"));
  await set(newRef, entry);
}

// Fetch all commodity entries, optionally filter by barangay
export async function fetchCommodityEntries(barangay?: string) {
  const snapshot = await get(ref(database, "commodityMap"));
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

// Delete a commodity entry by id
export async function deleteCommodityEntry(id: string) {
  await remove(ref(database, `commodityMap/${id}`));
} 