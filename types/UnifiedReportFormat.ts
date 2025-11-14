// Unified Report Format for both Planting and Harvest Reports
export interface UnifiedReportFormat {
  // Document ID
  id: string;
  
  // User Information
  userId: string;
  farmerName: string;
  farmerEmail: string;
  userBarangay?: string;
  
  // Crop Information
  crop: string;
  variety?: string;
  
  // Planting Information
  plantingDate: string;
  plantCount: number;
  areaPlanted: number;
  areaType: string; // 'hectares', 'square meters', etc.
  soilType?: string;
  irrigation?: string;
  fertilizer?: string;
  notes?: string;
  
  // Expected Harvest Information
  expectedHarvestDate: string;
  expectedYield: number; // in kg
  expectedDurationDays?: number | null;
  expectedYieldPerPlant?: number | null;
  
  // Actual Harvest Information (filled when harvested)
  harvestDate?: string;
  actualHarvest?: number; // in kg
  harvestWeight?: number; // in kg (same as actualHarvest)
  isHarvested?: boolean;
  actualDurationDays?: number | null;
  actualYieldPerPlant?: number | null;
  declineReason?: string;
  
  // Status and Metadata
  status: 'pending' | 'harvested' | 'completed';
  submittedAt: any; // Firestore timestamp
  createdAt: any; // Firestore timestamp
  updatedAt?: string;
  
  // Month/Year for filtering
  plantingMonth: number; // 1-12
  plantingYear: number;
  harvestMonth?: number; // 1-12
  harvestYear?: number;
  monthYear: string; // YYYY-MM format
  
  // Legacy compatibility fields (for backward compatibility)
  amount?: number; // same as actualHarvest
  amountType?: string; // 'kg'
  plantingReportId?: string; // for linking planting to harvest
}

const parseNumber = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object' && typeof (value as any).toNumber === 'function') {
    const num = (value as any).toNumber();
    return Number.isFinite(num) ? num : null;
  }
  return null;
};

const calculateDurationDays = (startDate?: string, endDate?: string): number | null => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Number.isFinite(diff) ? diff : null;
};

const calculateYieldPerPlant = (yieldKg: number | null, plantCount: number | null): number | null => {
  if (!yieldKg || !plantCount || plantCount <= 0) return null;
  return yieldKg / plantCount;
};

// Function to convert old format to unified format
export const convertToUnifiedFormat = (oldReport: any): UnifiedReportFormat => {
  const plantingDate = oldReport.plantingDate || oldReport.plantedDate || '';
  const expectedHarvestDate = oldReport.expectedHarvestDate || oldReport.expectedDate || '';
  const harvestDate = oldReport.harvestDate;

  const plantCount = parseNumber(
    oldReport.plantCount ||
      oldReport.plantNumber ||
      oldReport.numberOfPlants ||
      oldReport.plants
  ) || 0;

  const expectedYield = parseNumber(
    oldReport.expectedYield ||
      oldReport.expectedHarvest ||
      oldReport.expectedWeight
  ) || 0;

  const actualHarvest = parseNumber(
    oldReport.actualHarvest ||
      oldReport.amount ||
      oldReport.harvestWeight
  );

  const expectedDurationDays = calculateDurationDays(plantingDate, expectedHarvestDate);
  const actualDurationDays = calculateDurationDays(plantingDate, harvestDate);

  return {
    id: oldReport.id,
    userId: oldReport.userId || '',
    farmerName: oldReport.farmerName || oldReport.userName || '',
    farmerEmail: oldReport.farmerEmail || oldReport.userEmail || '',
    userBarangay: oldReport.userBarangay || '',
    crop: oldReport.crop || '',
    variety: oldReport.variety,
    plantingDate: oldReport.plantingDate || oldReport.plantedDate || '',
    plantCount: oldReport.plantCount || oldReport.plantNumber || oldReport.numberOfPlants || 0,
    areaPlanted: oldReport.areaPlanted || oldReport.area || oldReport.landArea || 0,
    areaType: oldReport.areaType || 'hectares',
    soilType: oldReport.soilType,
    irrigation: oldReport.irrigation,
    fertilizer: oldReport.fertilizer,
    notes: oldReport.notes,
    expectedHarvestDate,
    expectedYield,
    expectedDurationDays,
    expectedYieldPerPlant: calculateYieldPerPlant(expectedYield, plantCount),
    harvestDate: oldReport.harvestDate,
    actualHarvest: actualHarvest ?? undefined,
    harvestWeight: actualHarvest ?? undefined,
    isHarvested: oldReport.isHarvested || oldReport.status === 'harvested' || oldReport.status === 'completed',
    actualDurationDays,
    actualYieldPerPlant: calculateYieldPerPlant(actualHarvest ?? null, plantCount),
    declineReason: oldReport.declineReason,
    status: oldReport.status || 'pending',
    submittedAt: oldReport.submittedAt,
    createdAt: oldReport.createdAt,
    updatedAt: oldReport.updatedAt,
    plantingMonth: oldReport.plantingMonth || (oldReport.plantingDate ? new Date(oldReport.plantingDate).getMonth() + 1 : 0),
    plantingYear: oldReport.plantingYear || (oldReport.plantingDate ? new Date(oldReport.plantingDate).getFullYear() : 0),
    harvestMonth: oldReport.harvestMonth || (oldReport.harvestDate ? new Date(oldReport.harvestDate).getMonth() + 1 : undefined),
    harvestYear: oldReport.harvestYear || (oldReport.harvestDate ? new Date(oldReport.harvestDate).getFullYear() : undefined),
    monthYear: oldReport.monthYear || (oldReport.plantingDate ? `${new Date(oldReport.plantingDate).getFullYear()}-${String(new Date(oldReport.plantingDate).getMonth() + 1).padStart(2, '0')}` : ''),
    amount: actualHarvest ?? undefined,
    amountType: oldReport.amountType || 'kg',
    plantingReportId: oldReport.plantingReportId
  };
};

// Function to create unified planting data
export const createUnifiedPlantingData = (data: {
  userId: string;
  farmerName: string;
  farmerEmail: string;
  userBarangay?: string;
  crop: string;
  variety?: string;
  plantingDate: string;
  plantCount: number;
  areaPlanted: number;
  areaType: string;
  soilType?: string;
  irrigation?: string;
  fertilizer?: string;
  notes?: string;
  expectedHarvestDate: string;
  expectedYield: number;
  submittedAt: any;
  createdAt: any;
}): UnifiedReportFormat => {
  const plantingDateObj = new Date(data.plantingDate);
  const expectedDurationDays = calculateDurationDays(data.plantingDate, data.expectedHarvestDate);
  const expectedYieldPerPlant = calculateYieldPerPlant(data.expectedYield, data.plantCount);
  
  return {
    id: '',
    userId: data.userId,
    farmerName: data.farmerName,
    farmerEmail: data.farmerEmail,
    userBarangay: data.userBarangay,
    crop: data.crop,
    variety: data.variety,
    plantingDate: data.plantingDate,
    plantCount: data.plantCount,
    areaPlanted: data.areaPlanted,
    areaType: data.areaType,
    soilType: data.soilType,
    irrigation: data.irrigation,
    fertilizer: data.fertilizer,
    notes: data.notes,
    expectedHarvestDate: data.expectedHarvestDate,
    expectedYield: data.expectedYield,
    expectedDurationDays,
    expectedYieldPerPlant,
    status: 'pending',
    submittedAt: data.submittedAt,
    createdAt: data.createdAt,
    plantingMonth: plantingDateObj.getMonth() + 1,
    plantingYear: plantingDateObj.getFullYear(),
    monthYear: `${plantingDateObj.getFullYear()}-${String(plantingDateObj.getMonth() + 1).padStart(2, '0')}`,
    amountType: 'kg'
  };
};








