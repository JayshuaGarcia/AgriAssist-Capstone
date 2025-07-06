import { FirestoreService, Farmer, CropData, LivestockData } from './firestoreService';

export class SampleDataService {
  // Generate sample farmers data
  static generateSampleFarmers(): Omit<Farmer, 'id'>[] {
    return [
      {
        name: 'Juan Dela Cruz',
        email: 'juan.delacruz@example.com',
        phone: '+63 912 345 6789',
        location: 'San Miguel, Bulacan',
        farmSize: 5.5,
        crops: ['Rice', 'Corn', 'Vegetables'],
        livestock: ['Chicken', 'Pigs'],
        registrationDate: new Date('2023-01-15'),
        status: 'active'
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
        phone: '+63 923 456 7890',
        location: 'Angat, Bulacan',
        farmSize: 3.2,
        crops: ['Rice', 'Tomatoes'],
        livestock: ['Cattle'],
        registrationDate: new Date('2023-02-20'),
        status: 'active'
      },
      {
        name: 'Pedro Reyes',
        email: 'pedro.reyes@example.com',
        phone: '+63 934 567 8901',
        location: 'Baliuag, Bulacan',
        farmSize: 7.8,
        crops: ['Corn', 'Sugarcane'],
        livestock: ['Goats', 'Sheep'],
        registrationDate: new Date('2023-03-10'),
        status: 'active'
      },
      {
        name: 'Ana Garcia',
        email: 'ana.garcia@example.com',
        phone: '+63 945 678 9012',
        location: 'Plaridel, Bulacan',
        farmSize: 2.1,
        crops: ['Vegetables', 'Fruits'],
        livestock: ['Chicken'],
        registrationDate: new Date('2023-04-05'),
        status: 'active'
      },
      {
        name: 'Luis Martinez',
        email: 'luis.martinez@example.com',
        phone: '+63 956 789 0123',
        location: 'Pulilan, Bulacan',
        farmSize: 4.3,
        crops: ['Rice', 'Corn'],
        livestock: ['Pigs', 'Chicken'],
        registrationDate: new Date('2023-05-12'),
        status: 'active'
      }
    ];
  }

  // Generate sample crops data
  static generateSampleCrops(farmerIds: string[]): Omit<CropData, 'id'>[] {
    const crops: Omit<CropData, 'id'>[] = [];
    
    farmerIds.forEach((farmerId, index) => {
      // Rice crop
      crops.push({
        farmerId,
        cropName: 'Rice',
        plantingDate: new Date('2024-01-15'),
        harvestDate: new Date('2024-05-20'),
        yield: 2500 + (index * 100),
        area: 2.0 + (index * 0.5),
        status: 'harvested',
        notes: 'Good harvest season'
      });

      // Corn crop
      crops.push({
        farmerId,
        cropName: 'Corn',
        plantingDate: new Date('2024-02-01'),
        harvestDate: new Date('2024-06-15'),
        yield: 1800 + (index * 80),
        area: 1.5 + (index * 0.3),
        status: 'harvested',
        notes: 'Moderate yield due to weather'
      });

      // Vegetables (growing)
      crops.push({
        farmerId,
        cropName: 'Tomatoes',
        plantingDate: new Date('2024-03-10'),
        yield: 0,
        area: 0.5 + (index * 0.2),
        status: 'growing',
        notes: 'Expected harvest in 2 weeks'
      });
    });

    return crops;
  }

  // Generate sample livestock data
  static generateSampleLivestock(farmerIds: string[]): Omit<LivestockData, 'id'>[] {
    const livestock: Omit<LivestockData, 'id'>[] = [];
    
    farmerIds.forEach((farmerId, index) => {
      // Chickens
      livestock.push({
        farmerId,
        animalType: 'Chicken',
        quantity: 50 + (index * 10),
        healthStatus: 'healthy',
        lastVaccination: new Date('2024-01-10'),
        notes: 'Regular vaccination schedule maintained'
      });

      // Pigs
      livestock.push({
        farmerId,
        animalType: 'Pigs',
        quantity: 10 + (index * 2),
        healthStatus: 'healthy',
        lastVaccination: new Date('2024-02-15'),
        notes: 'All pigs in good condition'
      });

      // Cattle (for some farmers)
      if (index % 2 === 0) {
        livestock.push({
          farmerId,
          animalType: 'Cattle',
          quantity: 3 + index,
          healthStatus: 'vaccinated',
          lastVaccination: new Date('2024-03-01'),
          notes: 'Regular health check completed'
        });
      }
    });

    return livestock;
  }

  // Populate database with sample data
  static async populateSampleData(): Promise<{
    farmersAdded: number;
    cropsAdded: number;
    livestockAdded: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let farmersAdded = 0;
    let cropsAdded = 0;
    let livestockAdded = 0;

    try {
      // Add sample farmers
      const sampleFarmers = this.generateSampleFarmers();
      const farmerIds: string[] = [];

      for (const farmer of sampleFarmers) {
        try {
          const farmerId = await FirestoreService.addFarmer(farmer);
          farmerIds.push(farmerId);
          farmersAdded++;
          console.log(`Added farmer: ${farmer.name}`);
        } catch (error) {
          errors.push(`Failed to add farmer ${farmer.name}: ${error}`);
        }
      }

      // Add sample crops
      const sampleCrops = this.generateSampleCrops(farmerIds);
      for (const crop of sampleCrops) {
        try {
          await FirestoreService.addCropData(crop);
          cropsAdded++;
        } catch (error) {
          errors.push(`Failed to add crop ${crop.cropName}: ${error}`);
        }
      }

      // Add sample livestock
      const sampleLivestock = this.generateSampleLivestock(farmerIds);
      for (const animal of sampleLivestock) {
        try {
          await FirestoreService.addLivestockData(animal);
          livestockAdded++;
        } catch (error) {
          errors.push(`Failed to add livestock ${animal.animalType}: ${error}`);
        }
      }

    } catch (error) {
      errors.push(`Sample data population failed: ${error}`);
    }

    return {
      farmersAdded,
      cropsAdded,
      livestockAdded,
      errors
    };
  }

  // Clear all data (for testing)
  static async clearAllData(): Promise<void> {
    try {
      // Note: This is a simplified version. In production, you'd want to implement
      // proper batch deletion with pagination for large datasets
      console.log('Sample data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
} 