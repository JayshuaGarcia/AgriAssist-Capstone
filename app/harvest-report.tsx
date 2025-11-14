import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';

const GREEN = '#16543a';

type CropTimelineStats = {
  crop: string;
  averageExpectedDurationDays: number | null;
  averageActualDurationDays: number | null;
  expectedSampleSize: number;
  actualSampleSize: number;
  totalReportCount: number;
  dateDifferenceDays: number | null;
  averageExpectedYieldPerPlant: number | null;
  averageActualYieldPerPlant: number | null;
  expectedYieldPerPlantSampleSize: number;
  actualYieldPerPlantSampleSize: number;
  yieldDifference: number | null;
};

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const coerceNumber = (value: any): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (cleaned.length === 0) {
      return null;
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object') {
    if (typeof value.toNumber === 'function') {
      const num = value.toNumber();
      return Number.isFinite(num) ? num : null;
    }
  }
  return null;
};

const firstValidNumber = (values: any[]): number | null => {
  for (const value of values) {
    const parsed = coerceNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

const toTimestamp = (value: any): number | null => {
  if (!value && value !== 0) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    if ('seconds' in value && typeof value.seconds === 'number') {
      const milliseconds = value.seconds * 1000 + (value.nanoseconds || 0) / 1_000_000;
      return milliseconds;
    }
  }
  return null;
};

const extractDateFromFields = (record: any, fields: string[]): number | null => {
  for (const field of fields) {
    if (field in record) {
      const timestamp = toTimestamp(record[field]);
      if (timestamp !== null) {
        return timestamp;
      }
    }
  }
  return null;
};

const extractExpectedHarvestDateMs = (report: any): number | null => {
  return extractDateFromFields(report, [
    'expectedHarvestDate',
    'expectedDate',
    'expectedHarvestTime',
    'expectedHarvestSchedule',
  ]);
};

const extractActualHarvestDateMs = (report: any): number | null => {
  return extractDateFromFields(report, [
    'actualHarvestDate',
    'harvestDate',
    'dateHarvested',
    'actualDate',
    'completedAt',
  ]);
};

const extractExpectedYieldKg = (report: any): number | null => {
  return firstValidNumber([
    report.expectedYield,
    report.expectedHarvest,
    report.expectedWeight,
    report.expectedHarvestKg,
  ]);
};

const extractActualHarvestKg = (report: any): number | null => {
  const candidates = [
    report.actualHarvestAmount,
    report.actualHarvest,
    report.harvestWeight,
    report.actualYield,
    report.amount,
    report.totalHarvest,
  ]
    .map(coerceNumber)
    .filter(value => value !== null) as number[];

  const positive = candidates.find(value => value > 0);
  if (positive !== undefined) {
    return positive;
  }
  if (candidates.length > 0) {
    return candidates[0];
  }
  return null;
};

const extractPlantCount = (report: any): number | null => {
  return coerceNumber(
    report?.plantCount ??
      report?.plantNumber ??
      report?.numberOfPlants ??
      report?.plants ??
      report?.plantingCount
  );
};

const average = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
};

const formatDateForDisplay = (timestamp: number | null): string => {
  if (timestamp === null) {
    return 'N/A';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isReportHarvested = (report: any): boolean => {
  if (!report) return false;
  if (report.isHarvested === true) return true;
  const status = typeof report.status === 'string' ? report.status.toLowerCase() : '';
  if (status === 'harvested' || status === 'completed') return true;
  if (report.harvestDate || report.actualHarvestDate) return true;
  const harvest = extractActualHarvestKg(report);
  return harvest !== null && harvest > 0;
};

// Function to get crop icon
const getCropIcon = (cropName: string) => {
  const cropIcons: { [key: string]: string } = {
    'Rice': '🌾',
    'Corn': '🌽',
    'Wheat': '🌾',
    'Soybean': '🫘',
    'Tomato': '🍅',
    'Potato': '🥔',
    'Onion': '🧅',
    'Carrot': '🥕',
    'Cabbage': '🥬',
    'Lettuce': '🥬',
    'Spinach': '🥬',
    'Pepper': '🌶️',
    'Eggplant': '🍆',
    'Cucumber': '🥒',
    'Squash': '🎃',
    'Beans': '🫘',
    'Peas': '🫘',
    'Okra': '🥬',
    'Sweet Potato': '🍠',
    'Cassava': '🥔',
    'Banana': '🍌',
    'Mango': '🥭',
    'Papaya': '🍈',
    'Coconut': '🥥',
    'Coffee': '☕',
    'Cacao': '🍫',
    'Sugarcane': '🎋',
    'Cotton': '🌾',
    'Tobacco': '🌿',
    'Sunflower': '🌻',
    'Peanut': '🥜',
    'Sesame': '🌾',
    'Herbs': '🌿',
    'Chili': '🌶️',
    'Ampalaya': '🥒',
    'Upo': '🥒',
    'Patola': '🥒',
    'Sayote': '🥒',
    'Kangkong': '🥬',
    'Pechay': '🥬',
    'Mustasa': '🥬',
    'Radish': '🥕',
    'Ginger': '🫚',
    'Garlic': '🧄',
    'Turmeric': '🫚',
    'Lemongrass': '🌿',
    'Basil': '🌿',
    'Mint': '🌿',
    'Singkamas': '🥕',
    'Sigarilyas': '🫘',
    'Bataw': '🫘',
    'Garbanzos': '🫘',
    'Sitaw': '🫘',
    'Flowers': '🌸',
    'Ornamental Plants': '🌺'
  };
  
  return cropIcons[cropName] || '🌱'; // Default plant icon
};

// Function to get crop Tagalog name
const getCropTagalogName = (cropName: string) => {
  const cropTagalogNames: { [key: string]: string } = {
    'Rice': 'Palay',
    'Corn': 'Mais',
    'Wheat': 'Trigo',
    'Soybean': 'Soybean',
    'Tomato': 'Kamatis',
    'Potato': 'Patatas',
    'Onion': 'Sibuyas',
    'Carrot': 'Karot',
    'Cabbage': 'Repolyo',
    'Lettuce': 'Litsugas',
    'Spinach': 'Spinach',
    'Pepper': 'Paminta',
    'Eggplant': 'Talong',
    'Cucumber': 'Pipino',
    'Squash': 'Kalabasa',
    'Beans': 'Patani',
    'Peas': 'Gisantes',
    'Okra': 'Okra',
    'Sweet Potato': 'Kamote',
    'Cassava': 'Kamoteng Kahoy',
    'Banana': 'Saging',
    'Mango': 'Mangga',
    'Papaya': 'Papaya',
    'Coconut': 'Niyog',
    'Coffee': 'Kape',
    'Cacao': 'Kakaw',
    'Sugarcane': 'Tubo',
    'Cotton': 'Bulak',
    'Tobacco': 'Tabako',
    'Sunflower': 'Mirasol',
    'Peanut': 'Mani',
    'Sesame': 'Linga',
    'Herbs': 'Mga Halamang Gamot',
    'Chili': 'Sili',
    'Ampalaya': 'Ampalaya',
    'Upo': 'Upo',
    'Patola': 'Patola',
    'Sayote': 'Sayote',
    'Kangkong': 'Kangkong',
    'Pechay': 'Pechay',
    'Mustasa': 'Mustasa',
    'Radish': 'Labanos',
    'Ginger': 'Luya',
    'Garlic': 'Bawang',
    'Turmeric': 'Luyang Dilaw',
    'Lemongrass': 'Tanglad',
    'Basil': 'Balanoy',
    'Mint': 'Mentha',
    'Singkamas': 'Singkamas',
    'Sigarilyas': 'Sigarilyas',
    'Bataw': 'Bataw',
    'Garbanzos': 'Garbanzos',
    'Sitaw': 'Sitaw',
    'Flowers': 'Mga Bulaklak',
    'Ornamental Plants': 'Mga Halamang Palamuti'
  };
  
  return cropTagalogNames[cropName] || cropName; // Return original name if no Tagalog translation
};

const getCropColor = (crop: string) => {
  const colors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E8'];
  const index = crop.length % colors.length;
  return colors[index];
};

export default function HarvestReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalHarvested: 0,
    totalReports: 0,
    mostHarvestedCrop: '',
    harvestDistribution: [] as { crop: string; count: number; totalHarvest: number; percentage: number }[],
  });

  // Global analytics data
  const [globalAnalytics, setGlobalAnalytics] = useState({
    totalHarvested: 0,
    totalUsers: 0,
    mostPopularCrop: '',
    harvestDistribution: [] as { crop: string; count: number; userCount: number; totalHarvest: number; percentage: number; color: string }[],
    cropTimeline: [] as CropTimelineStats[],
  });

  // Date picker for global trends
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [globalLoading, setGlobalLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Reset to current month on refresh
    const currentDate = new Date();
    setSelectedMonth(currentDate);
    Promise.all([
      loadHarvestAnalytics(),
      loadGlobalHarvestAnalytics(currentDate)
    ]).finally(() => {
    setTimeout(() => setRefreshing(false), 1000);
    });
  }, []);

  useEffect(() => {
    loadHarvestAnalytics();
    loadGlobalHarvestAnalytics(selectedMonth);
  }, []);

  // Add focus listener to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHarvestAnalytics();
      loadGlobalHarvestAnalytics(selectedMonth);
    }, [selectedMonth])
  );

  const enrichHarvestReports = async (reports: any[]) => {
    return Promise.all(
      reports.map(async (report: any) => {
        const mergedReport: any = { ...report };

        if (mergedReport.plantingReportId) {
          try {
            const plantingDoc = await getDoc(doc(db, 'plantingReports', mergedReport.plantingReportId));
            if (plantingDoc.exists()) {
              const plantingData = plantingDoc.data();
              if (!mergedReport.expectedHarvestDate) {
                let plantingExpectedDate =
                  extractDateFromFields(plantingData, [
                    'expectedHarvestDate',
                    'expectedDate',
                    'expectedHarvestTime',
                  ]);

                if (plantingExpectedDate === null || plantingExpectedDate === undefined) {
                  plantingExpectedDate = plantingData.expectedHarvestDate || plantingData.expectedDate;
                }

                if (plantingExpectedDate !== undefined && plantingExpectedDate !== null) {
                  const expectedTimestamp = toTimestamp(plantingExpectedDate);
                  if (expectedTimestamp !== null) {
                    mergedReport.expectedHarvestDate = new Date(expectedTimestamp).toISOString();
                  } else {
                    mergedReport.expectedHarvestDate = plantingExpectedDate;
                  }
                }
              }

              if (mergedReport.expectedYield === undefined || mergedReport.expectedYield === null) {
                const expectedFromPlanting = extractExpectedYieldKg(plantingData);
                if (expectedFromPlanting !== null) {
                  mergedReport.expectedYield = expectedFromPlanting;
                }
              }

              if (mergedReport.expectedHarvest === undefined && plantingData.expectedHarvest !== undefined) {
                mergedReport.expectedHarvest = plantingData.expectedHarvest;
              }

              if (mergedReport.expectedWeight === undefined && plantingData.expectedWeight !== undefined) {
                mergedReport.expectedWeight = plantingData.expectedWeight;
              }
            }
          } catch (fetchError) {
            console.warn('⚠️ Failed to enrich harvest report with planting data:', fetchError);
          }
        }

        const expectedFromReport = extractExpectedYieldKg(mergedReport);
        if (expectedFromReport !== null) {
          mergedReport.expectedYield = expectedFromReport;
        }

        const actualHarvestAmount = extractActualHarvestKg(mergedReport);
        if (actualHarvestAmount !== null) {
          mergedReport.actualHarvestAmount = actualHarvestAmount;
        }

        if (!mergedReport.actualHarvestDate) {
          const actualDateMs = extractActualHarvestDateMs(mergedReport);
          if (actualDateMs !== null) {
            mergedReport.actualHarvestDate = new Date(actualDateMs).toISOString();
          }
        }

        return mergedReport;
      })
    );
  };

  const buildCropTimeline = (plantingReports: any[], harvestedReports: any[]): CropTimelineStats[] => {
    if (plantingReports.length === 0) {
      return [];
    }

    const expectedMap = new Map<
      string,
      {
        expectedDurations: number[];
        expectedYieldPerPlant: number[];
      }
    >();

    const actualMap = new Map<
      string,
      {
        actualDurations: number[];
        actualYieldPerPlant: number[];
      }
    >();
    const totalCounts = new Map<string, number>();

    const ensureExpectedEntry = (crop: string) => {
      if (!expectedMap.has(crop)) {
        expectedMap.set(crop, {
          expectedDurations: [],
          expectedYieldPerPlant: [],
        });
      }
      return expectedMap.get(crop)!;
    };

    const ensureActualEntry = (crop: string) => {
      if (!actualMap.has(crop)) {
        actualMap.set(crop, {
          actualDurations: [],
          actualYieldPerPlant: [],
        });
      }
      return actualMap.get(crop)!;
    };

    plantingReports.forEach(report => {
      const crop = report.crop || 'Unspecified Crop';
      const expectedEntry = ensureExpectedEntry(crop);
      totalCounts.set(crop, (totalCounts.get(crop) || 0) + 1);

      const expectedDateMs = extractExpectedHarvestDateMs(report);
      const plantingDateMs = toTimestamp(report.plantingDate || report.plantedDate);
      if (expectedDateMs !== null && plantingDateMs !== null) {
        const durationDays = (expectedDateMs - plantingDateMs) / ONE_DAY_IN_MS;
        if (Number.isFinite(durationDays)) {
          expectedEntry.expectedDurations.push(durationDays);
        }
      }

      const expectedYield = extractExpectedYieldKg(report);
      if (expectedYield !== null) {
        const plantCount = extractPlantCount(report);
        if (plantCount && plantCount > 0) {
          expectedEntry.expectedYieldPerPlant.push(expectedYield / plantCount);
        }
      }
    });

    harvestedReports.forEach(report => {
      const crop = report.crop || 'Unspecified Crop';
      const actualEntry = ensureActualEntry(crop);

      const actualDateMs = extractActualHarvestDateMs(report);
      const plantingDateMs = toTimestamp(report.plantingDate || report.plantedDate);
      if (actualDateMs !== null && plantingDateMs !== null) {
        const durationDays = (actualDateMs - plantingDateMs) / ONE_DAY_IN_MS;
        if (Number.isFinite(durationDays)) {
          actualEntry.actualDurations.push(durationDays);
        }
      }

      const actualYield = extractActualHarvestKg(report);
      if (actualYield !== null) {
        const plantCount = extractPlantCount(report);
        if (plantCount && plantCount > 0) {
          actualEntry.actualYieldPerPlant.push(actualYield / plantCount);
        }
      }

    });

    const crops = new Set<string>([
      ...Array.from(expectedMap.keys()),
      ...Array.from(actualMap.keys()),
    ]);

    return Array.from(crops)
      .map(crop => {
        const expectedEntry = expectedMap.get(crop);
        const actualEntry = actualMap.get(crop);

        if (!expectedEntry || expectedEntry.expectedDurations.length === 0) {
          return null;
        }

        const avgExpectedDuration = average(expectedEntry.expectedDurations);
        const avgActualDuration = actualEntry ? average(actualEntry.actualDurations) : null;
        const avgExpectedYieldPerPlant = average(expectedEntry.expectedYieldPerPlant);
        const avgActualYieldPerPlant = actualEntry ? average(actualEntry.actualYieldPerPlant) : null;

        const dateDifferenceDays =
          avgExpectedDuration !== null && avgActualDuration !== null
            ? avgActualDuration - avgExpectedDuration
            : null;
        const yieldDifference =
          avgExpectedYieldPerPlant !== null && avgActualYieldPerPlant !== null
            ? avgActualYieldPerPlant - avgExpectedYieldPerPlant
            : null;

        const expectedSampleSize = expectedEntry.expectedDurations.length;

        const actualSampleSize = actualEntry ? actualEntry.actualDurations.length : 0;

        const expectedYieldPerPlantSampleSize = expectedEntry.expectedYieldPerPlant.length;
        const actualYieldPerPlantSampleSize = actualEntry
          ? actualEntry.actualYieldPerPlant.length
          : 0;

        return {
          crop,
          averageExpectedDurationDays: avgExpectedDuration,
          averageActualDurationDays: avgActualDuration,
          expectedSampleSize,
          actualSampleSize,
          totalReportCount: totalCounts.get(crop) || 0,
          dateDifferenceDays,
          averageExpectedYieldPerPlant: avgExpectedYieldPerPlant,
          averageActualYieldPerPlant: avgActualYieldPerPlant,
          expectedYieldPerPlantSampleSize,
          actualYieldPerPlantSampleSize,
          yieldDifference,
        } as CropTimelineStats;
      })
      .filter((item): item is CropTimelineStats => item !== null)
      .filter(item => item.expectedSampleSize > 0)
      .sort((a, b) => {
        const aScore =
          (a.actualSampleSize || 0) +
          (a.expectedSampleSize || 0) +
          (a.expectedYieldPerPlantSampleSize || 0) +
          (a.actualYieldPerPlantSampleSize || 0);
        const bScore =
          (b.actualSampleSize || 0) +
          (b.expectedSampleSize || 0) +
          (b.expectedYieldPerPlantSampleSize || 0) +
          (b.actualYieldPerPlantSampleSize || 0);
        return bScore - aScore;
      });
  };

  const loadHarvestAnalytics = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Get user's harvest reports (accept both old and new formats)
      const harvestQueryNew = query(
        collection(db, 'harvestReports'),
        where('userEmail', '==', user.email)
      );
      const harvestQueryOld = query(
        collection(db, 'harvestReports'),
        where('farmerEmail', '==', user.email)
      );
      const [snapNew, snapOld] = await Promise.all([
        getDocs(harvestQueryNew),
        getDocs(harvestQueryOld)
      ]);
      const harvestReports = [
        ...snapNew.docs.map(d => {
          const data = d.data();
          return { ...data, id: d.id };
        }),
        ...snapOld.docs.map(d => {
          const data = d.data();
          return { ...data, id: d.id };
        }),
      ].filter((r, idx, arr) => idx === arr.findIndex(x => x.id === r.id));

      const enrichedReports = await enrichHarvestReports(harvestReports);

      // Debug: Log harvest analytics data
      console.log('📊 Harvest analytics for user:', user.email);
      console.log('📊 Current user object:', { uid: user.uid, email: user.email, displayName: user.displayName });
      console.log('📊 Harvest reports found for analytics:', enrichedReports.length);
      enrichedReports.forEach((report, index) => {
        console.log(`📊 Harvest report ${index + 1} for analytics:`, {
          id: report.id,
          farmerEmail: report.farmerEmail,
          crop: report.crop,
          status: report.status,
          amount: report.amount,
          amountType: report.amountType
        });
      });
      
      // Debug: Log which reports are being counted as harvested (both formats)
      const harvestedReports = enrichedReports.filter(report => 
        report.isHarvested === true || report.harvestDate || report.status === 'harvested' || report.status === 'completed'
      );
      const pendingReports = enrichedReports.filter(report => 
        !(report.isHarvested === true || report.harvestDate || report.status === 'harvested' || report.status === 'completed')
      );
      
      console.log('📊 Reports counted as harvested:', harvestedReports.length);
      console.log('📊 Reports still pending:', pendingReports.length);
      
      // Calculate total harvested weight for debugging (both formats)
      const totalHarvestedWeight = harvestedReports.reduce((sum, report) => {
        const harvest = extractActualHarvestKg(report) || 0;
        return sum + harvest;
      }, 0);
      
      console.log('📊 Total harvested weight calculated:', totalHarvestedWeight, 'kg');
      
      harvestedReports.forEach(report => {
        const harvestAmount = extractActualHarvestKg(report) || 0;
        console.log(`📊 Harvested report: ${report.crop} - ${harvestAmount}kg (status: ${report.status})`);
      });
      pendingReports.forEach(report => {
        const harvestAmount = extractActualHarvestKg(report) || 0;
        console.log(`📊 Pending report: ${report.crop} - ${harvestAmount}kg (status: ${report.status}) - not counted`);
      });
      
      // Calculate analytics
      calculateHarvestAnalytics(enrichedReports);
      
      // Animate the analytics
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      console.log('✅ Loaded harvest analytics:', enrichedReports.length);
    } catch (error) {
      console.error('Error loading harvest analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHarvestAnalytics = (reports: any[]) => {
    const harvestedReports = reports.filter(isReportHarvested);

    if (harvestedReports.length === 0) {
      setAnalyticsData({
        totalHarvested: 0,
        totalReports: 0,
        mostHarvestedCrop: '',
        harvestDistribution: [],
      });
      return;
    }

    const cropHarvestMap = new Map<string, { count: number; totalHarvest: number }>();
    let totalHarvested = 0;

    harvestedReports.forEach(report => {
      const actualHarvestKg = extractActualHarvestKg(report);
      const harvestAmount = actualHarvestKg ?? 0;
      totalHarvested += harvestAmount;

      const crop = report.crop || 'Unspecified Crop';
      if (cropHarvestMap.has(crop)) {
        const existing = cropHarvestMap.get(crop)!;
        cropHarvestMap.set(crop, {
          count: existing.count + 1,
          totalHarvest: existing.totalHarvest + harvestAmount,
        });
      } else {
        cropHarvestMap.set(crop, {
          count: 1,
          totalHarvest: harvestAmount,
        });
      }
    });

    const harvestDistribution = Array.from(cropHarvestMap.entries())
      .map(([crop, data]) => ({
        crop,
        count: data.count,
        totalHarvest: data.totalHarvest,
        percentage: totalHarvested > 0 ? (data.totalHarvest / totalHarvested) * 100 : 0,
      }))
      .sort((a, b) => b.totalHarvest - a.totalHarvest);

    const mostHarvestedCrop = harvestDistribution.length > 0 ? harvestDistribution[0].crop : '';

    setAnalyticsData({
      totalHarvested,
      totalReports: harvestedReports.length,
      mostHarvestedCrop,
      harvestDistribution,
    });
  };

  const loadGlobalHarvestAnalytics = async (month: Date) => {
    setGlobalLoading(true);
    try {
      const harvestQuery = query(collection(db, 'harvestReports'));
      const harvestSnapshot = await getDocs(harvestQuery);
      const allHarvestReports = harvestSnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: doc.id };
      });

      const plantingSnapshot = await getDocs(collection(db, 'plantingReports'));
      const allPlantingReports = plantingSnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: doc.id };
      });

      const enrichedAllReports = await enrichHarvestReports(allHarvestReports);
      const harvestedReports = enrichedAllReports.filter(isReportHarvested);

      const targetMonth = month.getMonth();
      const targetYear = month.getFullYear();

      const filteredReports = harvestedReports.filter(report => {
        const actualDateMs = extractActualHarvestDateMs(report);
        if (actualDateMs === null) return false;
        const actualDate = new Date(actualDateMs);
        return actualDate.getMonth() === targetMonth && actualDate.getFullYear() === targetYear;
      });

      const globalSummary = calculateGlobalHarvestAnalytics(filteredReports);
      const cropTimeline = buildCropTimeline(allPlantingReports, enrichedAllReports.filter(isReportHarvested));

      setGlobalAnalytics({
        totalHarvested: globalSummary.totalHarvested,
        totalUsers: globalSummary.totalUsers,
        mostPopularCrop: globalSummary.mostPopularCrop,
        harvestDistribution: globalSummary.harvestDistribution,
        cropTimeline,
      });

      console.log(
        '✅ Loaded global harvest analytics for',
        month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        ':',
        filteredReports.length,
        'records. Global timeline crops:',
        cropTimeline.length
      );
    } catch (error) {
      console.error('Error loading global harvest analytics:', error);
    } finally {
      setGlobalLoading(false);
    }
  };

  const calculateGlobalHarvestAnalytics = (reports: any[]) => {
    if (reports.length === 0) {
      return {
        totalHarvested: 0,
        totalUsers: 0,
        mostPopularCrop: '',
        harvestDistribution: [] as {
          crop: string;
          count: number;
          userCount: number;
          totalHarvest: number;
          percentage: number;
          color: string;
        }[],
      };
    }

    let totalHarvested = 0;
    const uniqueUsers = new Set<string>();
    const cropHarvestMap = new Map<
      string,
      { count: number; totalHarvest: number; users: Set<string> }
    >();

    reports.forEach(report => {
      const crop = report.crop || 'Unspecified Crop';
      const harvest = extractActualHarvestKg(report) || 0;
      const userEmail = report.userEmail || report.farmerEmail || 'unknown';

      totalHarvested += harvest;
      uniqueUsers.add(userEmail);

      if (!cropHarvestMap.has(crop)) {
        cropHarvestMap.set(crop, {
          count: 0,
          totalHarvest: 0,
          users: new Set<string>(),
        });
      }

      const entry = cropHarvestMap.get(crop)!;
      entry.count += 1;
      entry.totalHarvest += harvest;
      entry.users.add(userEmail);
    });

    const harvestDistribution = Array.from(cropHarvestMap.entries())
      .map(([crop, data]) => ({
        crop,
        count: data.count,
        userCount: data.users.size,
        totalHarvest: data.totalHarvest,
        percentage: totalHarvested > 0 ? (data.totalHarvest / totalHarvested) * 100 : 0,
        color: getCropColor(crop),
      }))
      .sort((a, b) => b.totalHarvest - a.totalHarvest);

    const mostPopularCrop = harvestDistribution.length > 0 ? harvestDistribution[0].crop : '';

    return {
      totalHarvested,
      totalUsers: uniqueUsers.size,
      mostPopularCrop,
      harvestDistribution,
    };
  };

  const hasDataForMonth = (month: Date) => {
    return globalAnalytics.harvestDistribution.length > 0;
  };

  const formatPerPlantDisplay = (value: number | null, blankIfMissing = false) => {
    if (value === null || Number.isNaN(value)) {
      return blankIfMissing ? '' : 'N/A';
    }
    return `${value.toFixed(2)} kg/plant`;
  };

  const formatDurationLabel = (daysValue: number) => {
    const rounded = Math.round(daysValue);
    const months = Math.floor(rounded / 30);
    const days = Math.max(0, rounded - months * 30);
    const parts: string[] = [];
    if (months > 0) {
      parts.push(`${months} month${months === 1 ? '' : 's'}`);
    }
    if (days > 0 || parts.length === 0) {
      parts.push(`${days} day${days === 1 ? '' : 's'}`);
    }
    return parts.join(' ');
  };

  const formatDurationDays = (value: number | null, blankIfMissing = false) => {
    if (value === null || Number.isNaN(value)) {
      return blankIfMissing ? '' : 'N/A';
    }
    return formatDurationLabel(value);
  };

  const formatDateDifference = (value: number | null) => {
    if (value === null) {
      return '';
    }
    if (Math.abs(value) < 1) {
      return 'On schedule';
    }
    const durationText = formatDurationLabel(Math.abs(value));
    return value > 0 ? `${durationText} later than expected` : `${durationText} earlier than expected`;
  };

  const formatYieldDifference = (value: number | null) => {
    if (value === null) {
      return '';
    }
    if (Math.abs(value) < 0.1) {
      return 'Yield on target';
    }
    const formatted = `${value > 0 ? '+' : ''}${value.toFixed(2)} kg/plant`;
    return value > 0 ? `${formatted} above expected` : `${formatted} below expected`;
  };

  return (
    <>
      <View style={styles.container}>
        {/* Top Green Border */}
        <View style={styles.topBorder} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleCard}>
          <Text style={styles.headerTitle}>Harvest Report</Text>
              <Text style={styles.headerSubtitle}>Manage your harvest reports</Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[GREEN]}
            tintColor={GREEN}
          />
        }
      >
          {/* View Reports Button */}
          <View style={styles.viewReportsContainer}>
                <TouchableOpacity 
              style={styles.viewReportsButton}
              onPress={() => router.push('/harvest-view-reports')}
            >
              <View style={styles.viewReportsIconContainer}>
                <Ionicons name="list" size={32} color={GREEN} />
                  </View>
              <Text style={styles.viewReportsTitle}>View Reports</Text>
              <Text style={styles.viewReportsDescription}>View your submitted planting reports</Text>
                </TouchableOpacity>
            </View>

          {/* Harvest Analytics Dashboard */}
          <Animated.View 
            style={[
              styles.analyticsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.dashboardHeader}>
              <Text style={styles.dashboardTitle}>🌾 Harvest Analytics Overview</Text>
              <Text style={styles.dashboardSubtitle}>See your harvest progress and global crop trends</Text>
            </View>

            {/* Personal Summary Card */}
            <View style={styles.personalSummaryCard}>
              <View style={styles.personalSummaryHeader}>
                <Ionicons name="person" size={24} color={GREEN} />
                <Text style={styles.personalSummaryTitle}>Your Harvest Summary</Text>
                </View>

              <View style={styles.personalSummaryStats}>
                <View style={styles.personalStatItem}>
                  <Text style={styles.personalStatValue}>{analyticsData.totalHarvested.toFixed(1)}</Text>
                  <Text style={styles.personalStatLabel}>Total Harvested (kg)</Text>
                </View>
                <View style={styles.personalStatItem}>
                  <Text style={styles.personalStatValue}>{analyticsData.totalReports}</Text>
                  <Text style={styles.personalStatLabel}>Harvest Reports</Text>
                </View>
                <View style={styles.personalStatItem}>
                  <Text style={styles.personalStatValue}>{analyticsData.mostHarvestedCrop || 'None'}</Text>
                  <Text style={styles.personalStatLabel}>Most Harvested</Text>
                </View>
              </View>
            </View>

            {/* Global Trends Section */}
            <View style={styles.globalTrendsCard}>
              <View style={styles.globalTrendsHeader}>
                <Text style={styles.globalTrendsTitle}>🌍 Lopez Harvest Trends</Text>
              </View>

              {/* Loading State */}
              {globalLoading ? (
                <View style={styles.analyticsLoadingContainer}>
                  <ActivityIndicator size="large" color={GREEN} />
                  <Text style={styles.analyticsLoadingText}>Loading global trends...</Text>
                </View>
              ) : (
                <>
                  {/* Horizontal Bar Chart with Rankings */}
                  <View style={styles.barChartContainer}>
                    <Text style={styles.barChartTitle}>Lopez Harvest Distribution</Text>
                    
                    {/* Month Navigation */}
                    <View style={styles.monthNavigationContainer}>
                  <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={async () => {
                          const newDate = new Date(selectedMonth);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setSelectedMonth(newDate);
                          await loadGlobalHarvestAnalytics(newDate);
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={GREEN} />
                  </TouchableOpacity>
                      
                      <Text style={styles.monthDisplay}>
                        {selectedMonth.toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </Text>
                  
                  <TouchableOpacity
                        style={styles.monthNavButton}
                        onPress={async () => {
                          const newDate = new Date(selectedMonth);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setSelectedMonth(newDate);
                          await loadGlobalHarvestAnalytics(newDate);
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={GREEN} />
                      </TouchableOpacity>
                    </View>
                    
                    {hasDataForMonth(selectedMonth) ? (
                      <>
                        <View style={styles.horizontalBarChartWrapper}>
                          {globalAnalytics.harvestDistribution.map((item, index) => {
                            const rank = index + 1;
                            const maxValue = Math.max(...globalAnalytics.harvestDistribution.map(crop => crop.totalHarvest));
                            const barWidth = (item.totalHarvest / maxValue) * 100; // Percentage width
                            
                            return (
                              <View key={item.crop} style={[
                                styles.horizontalBarItem,
                                rank === 1 && styles.horizontalBarItemFirst,
                                rank === 2 && styles.horizontalBarItemSecond,
                                rank === 3 && styles.horizontalBarItemThird
                              ]}>
                                <View style={styles.horizontalBarSideNumber}>
                                  <Text style={[
                                    styles.horizontalBarSideNumberText,
                                    rank === 1 && styles.horizontalBarSideNumberFirst,
                                    rank === 2 && styles.horizontalBarSideNumberSecond,
                                    rank === 3 && styles.horizontalBarSideNumberThird
                                  ]}>
                                    {rank}
                                  </Text>
                                </View>
                                <View style={styles.horizontalBarLabelContainer}>
                                  <View style={styles.rankContainer}>
                                    <Text style={[
                                      styles.horizontalBarRank,
                                      rank === 1 && styles.horizontalBarRankFirst,
                                      rank === 2 && styles.horizontalBarRankSecond,
                                      rank === 3 && styles.horizontalBarRankThird
                                    ]}>
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                    </Text>
                                  </View>
                                  <View style={styles.cropInfoContainer}>
                                    <View style={styles.cropNameRow}>
                                      <Text style={styles.cropIcon}>{getCropIcon(item.crop)}</Text>
                                      <Text style={styles.horizontalBarCropName}>{item.crop}</Text>
                                      <Text style={styles.cropTagalogName}> / {getCropTagalogName(item.crop)}</Text>
                                    </View>
                                  </View>
                                  <View style={styles.percentageContainer}>
                                    <Text style={styles.horizontalBarPercentageText}>
                                      {item.percentage.toFixed(1)}%
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.horizontalBarContainer}>
                                  <View style={styles.horizontalBar}>
                                    <View 
                                      style={[
                                        styles.horizontalBarFill,
                                        { 
                                          width: `${barWidth}%`,
                                          backgroundColor: '#81C784'
                                        }
                                      ]}
                                    />
                                    <View style={styles.horizontalBarValue}>
                                      <Text style={styles.horizontalBarValueText}>
                                        {item.totalHarvest.toFixed(1)} kg
                    </Text>
                </View>
              </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                        
                        {/* Notes */}
                        <View style={styles.notesContainer}>
                          <Text style={styles.notesText}>Total: {globalAnalytics.totalHarvested.toFixed(1)} kg harvested across all farmers</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Ionicons name="leaf-outline" size={48} color="#ccc" />
                        <Text style={styles.noDataText}>No harvest data for {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                        <Text style={styles.noDataSubtext}>Try selecting a different month</Text>
                      </View>
                    )}
                  </View>

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerButton}>
                      <Text style={styles.dividerText}>Analytics Breakdown</Text>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Farmers Growing Each Crop */}
                  <View style={styles.farmersGrowingCard}>
                    <Text style={styles.farmersGrowingTitle}>Farmers Harvesting Each Crop</Text>
                    
                    {globalAnalytics.harvestDistribution.length > 0 ? (
                      <View style={styles.horizontalBarChartWrapper}>
                        {globalAnalytics.harvestDistribution
                          .sort((a, b) => b.userCount - a.userCount)
                          .map((item, index) => {
                            const rank = index + 1;
                            const maxValue = Math.max(...globalAnalytics.harvestDistribution.map(crop => crop.userCount));
                            const barWidth = (item.userCount / maxValue) * 100;
                            
                            return (
                              <View key={item.crop} style={[
                                styles.horizontalBarItem,
                                rank === 1 && styles.horizontalBarItemFirst,
                                rank === 2 && styles.horizontalBarItemSecond,
                                rank === 3 && styles.horizontalBarItemThird
                              ]}>
                                <View style={styles.horizontalBarSideNumber}>
                                  <Text style={[
                                    styles.horizontalBarSideNumberText,
                                    rank === 1 && styles.horizontalBarSideNumberFirst,
                                    rank === 2 && styles.horizontalBarSideNumberSecond,
                                    rank === 3 && styles.horizontalBarSideNumberThird
                                  ]}>
                                    {rank}
                                  </Text>
                                </View>
                                <View style={styles.horizontalBarLabelContainer}>
                                  <View style={styles.rankContainer}>
                                    <Text style={[
                                      styles.horizontalBarRank,
                                      rank === 1 && styles.horizontalBarRankFirst,
                                      rank === 2 && styles.horizontalBarRankSecond,
                                      rank === 3 && styles.horizontalBarRankThird
                                    ]}>
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                    </Text>
                                  </View>
                                  <View style={styles.cropInfoContainer}>
                                    <View style={styles.cropNameRow}>
                                      <Text style={styles.cropIcon}>{getCropIcon(item.crop)}</Text>
                                      <Text style={styles.horizontalBarCropName}>{item.crop}</Text>
                                      <Text style={styles.cropTagalogName}> / {getCropTagalogName(item.crop)}</Text>
                                    </View>
                                  </View>
                                  <View style={styles.farmerCountContainer}>
                                    <Text style={styles.farmerCountText}>
                                      {item.userCount} farmers
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.horizontalBarContainer}>
                                  <View style={styles.horizontalBar}>
                                    <View 
                                      style={[
                                        styles.horizontalBarFill,
                                        { 
                                          width: `${barWidth}%`,
                                          backgroundColor: '#81C784'
                                        }
                                      ]}
                                    />
                                    <View style={styles.horizontalBarValue}>
                                      <Text style={styles.horizontalBarValueText}>
                                        {item.userCount}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                      </View>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Ionicons name="people-outline" size={48} color="#ccc" />
                        <Text style={styles.noDataText}>No farmer data available</Text>
                        <Text style={styles.noDataSubtext}>Start harvesting to see farmer trends</Text>
                      </View>
                    )}
                    
                    {/* Notes */}
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>Number of different farmers harvesting each crop type</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Crop Timeline Analysis */}
            <View style={styles.cropTimelineCard}>
              <Text style={styles.cropTimelineTitle}>📈 Expected and Actual Harvest</Text>
              <Text style={styles.cropTimelineSubtitle}>
                Compare planned harvest timelines and yields for each crop
              </Text>

              {globalAnalytics.cropTimeline.length > 0 ? (
                globalAnalytics.cropTimeline.map((item, index) => {
                  const dateDifferenceText = formatDateDifference(item.dateDifferenceDays);
                  const yieldDifferenceText = formatYieldDifference(item.yieldDifference);

                  return (
                    <View
                      key={item.crop}
                      style={[
                        styles.cropTimelineItem,
                        index === globalAnalytics.cropTimeline.length - 1 && styles.cropTimelineItemLast,
                      ]}
                    >
                      <View style={styles.cropTimelineHeader}>
                        <View style={styles.cropTimelineName}>
                          <Text style={styles.cropTimelineIcon}>{getCropIcon(item.crop)}</Text>
                          <Text style={styles.cropTimelineCrop}>{item.crop}</Text>
                          <Text style={styles.cropTimelineTagalog}> / {getCropTagalogName(item.crop)}</Text>
                        </View>
                        <Text style={styles.cropTimelineSamples}>
                          {item.totalReportCount} reports
                        </Text>
                      </View>

                      <View style={styles.cropTimelineRow}>
                        <Text style={styles.cropTimelineLabel}>Expected</Text>
                        <View style={styles.cropTimelineValues}>
                          <View style={styles.cropTimelineStatGroup}>
                            <Text style={styles.cropTimelineStatLabel}>Avg duration</Text>
                            <Text style={styles.cropTimelineValue}>
                              {formatDurationDays(item.averageExpectedDurationDays)}
                            </Text>
                          </View>
                          <View style={styles.cropTimelineStatGroupRight}>
                            <Text style={styles.cropTimelineStatLabel}>Yield / plant</Text>
                            <Text style={styles.cropTimelinePerPlant}>
                              {formatPerPlantDisplay(item.averageExpectedYieldPerPlant)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cropTimelineRow}>
                        <Text style={styles.cropTimelineLabel}>Actual</Text>
                        <View style={styles.cropTimelineValues}>
                          <View style={styles.cropTimelineStatGroup}>
                            <Text style={styles.cropTimelineStatLabel}>Avg duration</Text>
                            <Text style={styles.cropTimelineValue}>
                              {formatDurationDays(item.averageActualDurationDays, true)}
                            </Text>
                          </View>
                          <View style={styles.cropTimelineStatGroupRight}>
                            <Text style={styles.cropTimelineStatLabel}>Yield / plant</Text>
                            <Text style={styles.cropTimelinePerPlant}>
                              {formatPerPlantDisplay(item.averageActualYieldPerPlant, true)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {(dateDifferenceText || yieldDifferenceText) && (
                        <View style={styles.cropTimelineDeltaRow}>
                          {dateDifferenceText ? (
                            <Text
                              style={[
                                styles.cropTimelineDeltaText,
                                item.dateDifferenceDays !== null && Math.abs(item.dateDifferenceDays) < 1
                                  ? styles.cropTimelineOnTime
                                  : item.dateDifferenceDays !== null && item.dateDifferenceDays > 0
                                  ? styles.cropTimelineDelay
                                  : styles.cropTimelineAhead,
                              ]}
                            >
                              {dateDifferenceText}
                            </Text>
                          ) : null}
                          {yieldDifferenceText ? (
                            <Text
                              style={[
                                styles.cropTimelineDeltaText,
                                item.yieldDifference !== null && Math.abs(item.yieldDifference) < 0.1
                                  ? styles.cropTimelineYieldEven
                                  : item.yieldDifference !== null && item.yieldDifference > 0
                                  ? styles.cropTimelineYieldGain
                                  : styles.cropTimelineYieldDrop,
                              ]}
                            >
                              {yieldDifferenceText}
                            </Text>
                          ) : null}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.cropTimelineEmptyState}>
                  <Ionicons name="analytics-outline" size={40} color="#9E9E9E" />
                  <Text style={styles.cropTimelineEmptyTitle}>No comparisons yet</Text>
                  <Text style={styles.cropTimelineEmptySubtitle}>
                    Submit both planting and harvest reports to unlock crop averages.
                  </Text>
                </View>
              )}
            </View>

            {/* Highlights */}
            <View style={styles.highlightsContainer}>
              <View style={styles.highlightCard}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.highlightTitle}>Most Harvested</Text>
                <Text style={styles.highlightValue}>{analyticsData.mostHarvestedCrop || 'None'}</Text>
              </View>
              <View style={styles.highlightCard}>
                <Ionicons name="basket" size={24} color="#4CAF50" />
                <Text style={styles.highlightTitle}>Total Harvest</Text>
                <Text style={styles.highlightValue}>{analyticsData.totalHarvested.toFixed(1)} kg</Text>
              </View>
              <View style={styles.highlightCard}>
                <Ionicons name="document-text" size={24} color="#2196F3" />
                <Text style={styles.highlightTitle}>Reports</Text>
                <Text style={styles.highlightValue}>{analyticsData.totalReports}</Text>
              </View>
            </View>
          </Animated.View>
      </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBorder: {
    height: 36,
    width: '100%',
    backgroundColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.03)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  viewReportsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  viewReportsButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderLeftColor: '#2E7D32',
    borderRightColor: '#2E7D32',
  },
  viewReportsIconContainer: {
    marginBottom: 12,
  },
  viewReportsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 4,
  },
  viewReportsDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dashboardHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  personalSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E8F5E8',
  },
  personalSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  personalSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 12,
  },
  personalSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  personalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  personalStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 4,
  },
  personalStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  globalTrendsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E8F5E8',
  },
  globalTrendsHeader: {
    marginBottom: 20,
  },
  globalTrendsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
  },
  analyticsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  analyticsLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  barChartContainer: {
    marginBottom: 20,
  },
  barChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 16,
    textAlign: 'center',
  },
  monthNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  monthDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginHorizontal: 20,
    minWidth: 120,
    textAlign: 'center',
  },
  horizontalBarChartWrapper: {
    gap: 12,
  },
  horizontalBarItem: {
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  horizontalBarItemFirst: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  horizontalBarItemSecond: {
    backgroundColor: '#F5F5F5',
    borderColor: '#C0C0C0',
    borderWidth: 2,
  },
  horizontalBarItemThird: {
    backgroundColor: '#FDF5E6',
    borderColor: '#CD7F32',
    borderWidth: 2,
  },
  horizontalBarSideNumber: {
    position: 'absolute',
    left: -15,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  horizontalBarSideNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  horizontalBarSideNumberFirst: {
    color: '#FFD700',
    borderColor: '#FFD700',
  },
  horizontalBarSideNumberSecond: {
    color: '#C0C0C0',
    borderColor: '#C0C0C0',
  },
  horizontalBarSideNumberThird: {
    color: '#CD7F32',
    borderColor: '#CD7F32',
  },
  horizontalBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 12,
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: 0,
  },
  horizontalBarRankWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  horizontalBarRank: {
    fontSize: 16,
    marginRight: 8,
  },
  rankContainer: {
    width: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  horizontalBarRankFirst: {
    fontSize: 18,
  },
  horizontalBarRankSecond: {
    fontSize: 18,
  },
  horizontalBarRankThird: {
    fontSize: 18,
  },
  horizontalBarCropName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  cropInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cropNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cropIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cropTagalogName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  percentageContainer: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  farmerCountContainer: {
    width: 80,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  farmerCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  horizontalBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 8,
  },
  horizontalBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  horizontalBarValue: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalBarValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  horizontalBarPercentage: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  horizontalBarPercentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  farmersGrowingCard: {
    marginBottom: 20,
  },
  farmersGrowingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 16,
    textAlign: 'center',
  },
  cropTimelineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0F2E9',
  },
  cropTimelineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 4,
  },
  cropTimelineSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 18,
  },
  cropTimelineItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cropTimelineItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  cropTimelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cropTimelineName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  cropTimelineIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cropTimelineCrop: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  cropTimelineTagalog: {
    fontSize: 13,
    color: '#777',
    marginLeft: 6,
  },
  cropTimelineSamples: {
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  cropTimelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cropTimelineLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    width: 80,
  },
  cropTimelineValues: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropTimelineStatGroup: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cropTimelineStatGroupRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cropTimelineStatLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  cropTimelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cropTimelineSecondary: {
    fontSize: 13,
    color: '#555',
  },
  cropTimelinePerPlant: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  cropTimelineDeltaRow: {
    marginTop: 10,
  },
  cropTimelineDeltaText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  cropTimelineOnTime: {
    color: '#2E7D32',
  },
  cropTimelineDelay: {
    color: '#C62828',
  },
  cropTimelineAhead: {
    color: '#1B5E20',
  },
  cropTimelineYieldEven: {
    color: '#2E7D32',
  },
  cropTimelineYieldGain: {
    color: '#1B5E20',
  },
  cropTimelineYieldDrop: {
    color: '#C62828',
  },
  cropTimelineEmptyState: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  cropTimelineEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  cropTimelineEmptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  highlightsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  highlightTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
    marginTop: 4,
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d0d0d0',
  },
  dividerButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  dividerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});