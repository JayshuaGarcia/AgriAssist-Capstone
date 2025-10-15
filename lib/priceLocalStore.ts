import AsyncStorage from '@react-native-async-storage/async-storage';

// Columns per screenshot: Commodity, Type, Specification, Amount, Date
export type PriceRecord = {
  id: string; // unique id
  commodity: string; // e.g., CORN (per kg)
  type: string; // e.g., Corn (White)
  specification: string; // optional spec
  amount: number; // price numeric
  dateISO: string; // ISO datetime string
};

const STORAGE_KEY = 'local_price_records_v1';

export async function getAllPriceRecords(): Promise<PriceRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as PriceRecord[]; } catch { return []; }
}

export async function setAllPriceRecords(records: PriceRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function upsertPriceRecords(newRecords: PriceRecord[]): Promise<void> {
  const existing = await getAllPriceRecords();
  const map = new Map<string, PriceRecord>();
  for (const r of existing) map.set(r.id, r);
  for (const r of newRecords) map.set(r.id, r);
  await setAllPriceRecords(Array.from(map.values()));
}

export function makeRecordId(rec: Omit<PriceRecord, 'id'>): string {
  // Unique per Commodity+Type+Specification+Date
  return [rec.commodity, rec.type, rec.specification || '', rec.dateISO].join('|');
}

export function findLatestByCommodity(records: PriceRecord[], commodity: string): PriceRecord | undefined {
  const filtered = records.filter(r => r.commodity === commodity);
  return filtered.sort((a,b)=> (a.dateISO < b.dateISO ? 1 : -1))[0];
}

// Import helper: accepts an array of plain objects matching the screenshot columns
// [{ Commodity, Type, Specification, Amount, Date }]
export async function importPlainRecords(list: any[]): Promise<number> {
  if (!Array.isArray(list)) return 0;
  const toSave: PriceRecord[] = [];
  for (const item of list) {
    const commodity: string = String(item.Commodity ?? item.commodity ?? '').trim();
    const type: string = String(item.Type ?? item.type ?? '').trim();
    const specificationRaw = item.Specification ?? item.specification;
    const specification = (Number.isNaN(specificationRaw) || specificationRaw === 'NaN') ? '' : String(specificationRaw ?? '').trim();
    const amountNum = Number(item.Amount ?? item.amount);
    const amount = isFinite(amountNum) ? amountNum : NaN;
    const dateStr = String(item.Date ?? item.date ?? '').trim();
    const dateISO = dateStr && !dateStr.includes('T') ? `${dateStr}T00:00:00.000Z` : (dateStr || new Date().toISOString());
    const base = { commodity, type, specification, amount, dateISO };
    const id = makeRecordId(base);
    toSave.push({ id, ...base });
  }
  await upsertPriceRecords(toSave);
  return toSave.length;
}


