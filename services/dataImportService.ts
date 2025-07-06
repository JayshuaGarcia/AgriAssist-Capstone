import { FirestoreService, Farmer, CropData, LivestockData } from './firestoreService';

export interface XLRowData {
  [key: string]: any;
}

export class DataImportService {
  // Import farmers from XL data
  static async importFarmersFromXL(xlData: XLRowData[]): Promise<string[]> {
    const farmerIds: string[] = [];
    
    for (const row of xlData) {
      try {
        const farmer: Omit<Farmer, 'id'> = {
          name: row.name || row.farmer_name || row.full_name || 'Unknown',
          email: row.email || `${row.name?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: row.phone || row.contact || row.mobile || '',
          location: row.location || row.address || row.area || 'Unknown',
          farmSize: parseFloat(row.farm_size) || parseFloat(row.area_hectares) || 0,
          crops: this.parseCrops(row.crops || row.crop_types || ''),
          livestock: this.parseLivestock(row.livestock || row.animals || ''),
          registrationDate: new Date(row.registration_date || row.date_registered || Date.now()),
          status: 'active'
        };

        const farmerId = await FirestoreService.addFarmer(farmer);
        farmerIds.push(farmerId);
        
        console.log(`Imported farmer: ${farmer.name} with ID: ${farmerId}`);
      } catch (error) {
        console.error(`Failed to import farmer from row:`, row, error);
      }
    }
    
    return farmerIds;
  }

  // Import crop data from XL
  static async importCropsFromXL(xlData: XLRowData[], farmerId: string): Promise<string[]> {
    const cropIds: string[] = [];
    
    for (const row of xlData) {
      try {
        const cropData: Omit<CropData, 'id'> = {
          farmerId: farmerId,
          cropName: row.crop_name || row.crop || row.crop_type || 'Unknown',
          plantingDate: new Date(row.planting_date || row.date_planted || Date.now()),
          harvestDate: row.harvest_date ? new Date(row.harvest_date) : undefined,
          yield: parseFloat(row.yield) || parseFloat(row.production) || 0,
          area: parseFloat(row.area) || parseFloat(row.hectares) || 0,
          status: this.determineCropStatus(row.status || row.crop_status || 'planted'),
          notes: row.notes || row.remarks || ''
        };

        const cropId = await FirestoreService.addCropData(cropData);
        cropIds.push(cropId);
        
        console.log(`Imported crop: ${cropData.cropName} with ID: ${cropId}`);
      } catch (error) {
        console.error(`Failed to import crop from row:`, row, error);
      }
    }
    
    return cropIds;
  }

  // Import livestock data from XL
  static async importLivestockFromXL(xlData: XLRowData[], farmerId: string): Promise<string[]> {
    const livestockIds: string[] = [];
    
    for (const row of xlData) {
      try {
        const livestockData: Omit<LivestockData, 'id'> = {
          farmerId: farmerId,
          animalType: row.animal_type || row.livestock || row.animal || 'Unknown',
          quantity: parseInt(row.quantity) || parseInt(row.count) || 0,
          healthStatus: this.determineHealthStatus(row.health_status || row.status || 'healthy'),
          lastVaccination: row.last_vaccination ? new Date(row.last_vaccination) : undefined,
          notes: row.notes || row.remarks || ''
        };

        const livestockId = await FirestoreService.addLivestockData(livestockData);
        livestockIds.push(livestockId);
        
        console.log(`Imported livestock: ${livestockData.animalType} with ID: ${livestockId}`);
      } catch (error) {
        console.error(`Failed to import livestock from row:`, row, error);
      }
    }
    
    return livestockIds;
  }

  // Parse crops string into array
  private static parseCrops(cropsString: string): string[] {
    if (!cropsString) return [];
    
    return cropsString
      .split(/[,;|]/)
      .map(crop => crop.trim())
      .filter(crop => crop.length > 0);
  }

  // Parse livestock string into array
  private static parseLivestock(livestockString: string): string[] {
    if (!livestockString) return [];
    
    return livestockString
      .split(/[,;|]/)
      .map(animal => animal.trim())
      .filter(animal => animal.length > 0);
  }

  // Determine crop status
  private static determineCropStatus(status: string): 'planted' | 'growing' | 'harvested' {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('harvest') || lowerStatus.includes('complete')) {
      return 'harvested';
    } else if (lowerStatus.includes('grow') || lowerStatus.includes('develop')) {
      return 'growing';
    } else {
      return 'planted';
    }
  }

  // Determine health status
  private static determineHealthStatus(status: string): 'healthy' | 'sick' | 'vaccinated' {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('sick') || lowerStatus.includes('disease')) {
      return 'sick';
    } else if (lowerStatus.includes('vaccin') || lowerStatus.includes('immune')) {
      return 'vaccinated';
    } else {
      return 'healthy';
    }
  }

  // Bulk import function for complete XL dataset
  static async importCompleteDataset(
    farmersData: XLRowData[],
    cropsData: XLRowData[],
    livestockData: XLRowData[]
  ): Promise<{
    farmersImported: number;
    cropsImported: number;
    livestockImported: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let farmersImported = 0;
    let cropsImported = 0;
    let livestockImported = 0;

    try {
      // Import farmers first
      const farmerIds = await this.importFarmersFromXL(farmersData);
      farmersImported = farmerIds.length;

      // Import crops for each farmer
      for (const farmerId of farmerIds) {
        try {
          const cropIds = await this.importCropsFromXL(cropsData, farmerId);
          cropsImported += cropIds.length;
        } catch (error) {
          errors.push(`Failed to import crops for farmer ${farmerId}: ${error}`);
        }
      }

      // Import livestock for each farmer
      for (const farmerId of farmerIds) {
        try {
          const livestockIds = await this.importLivestockFromXL(livestockData, farmerId);
          livestockImported += livestockIds.length;
        } catch (error) {
          errors.push(`Failed to import livestock for farmer ${farmerId}: ${error}`);
        }
      }

    } catch (error) {
      errors.push(`Bulk import failed: ${error}`);
    }

    return {
      farmersImported,
      cropsImported,
      livestockImported,
      errors
    };
  }

  // Validate XL data structure
  static validateXLData(data: XLRowData[], requiredFields: string[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || data.length === 0) {
      errors.push('No data provided');
      return { isValid: false, errors, warnings };
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      // Check required fields
      for (const field of requiredFields) {
        if (!row[field] && row[field] !== 0) {
          errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
        }
      }

      // Check for empty rows
      const hasData = Object.values(row).some(value => value !== null && value !== undefined && value !== '');
      if (!hasData) {
        warnings.push(`Row ${rowNumber}: Empty row detected`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
} 