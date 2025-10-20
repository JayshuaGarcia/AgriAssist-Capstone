import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

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

export default function HarvestViewReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [harvestReports, setHarvestReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Record Harvest Modal state
  const [showRecordHarvestModal, setShowRecordHarvestModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [harvestDate, setHarvestDate] = useState('');
  const [harvestWeight, setHarvestWeight] = useState('');
  const [submittingHarvest, setSubmittingHarvest] = useState(false);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadHarvestReports = async () => {
    if (!user?.email) {
      console.log('⚠️ No user email available for loading harvest reports');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Loading harvest reports for user:', user.email);
      console.log('🔄 Current user object:', { uid: user.uid, email: user.email, displayName: user.displayName });
      
          // Use old format only (farmerEmail field)
          const harvestQuery = query(
            collection(db, 'harvestReports'),
            where('farmerEmail', '==', user.email)
          );
      
      const harvestSnapshot = await getDocs(harvestQuery);
      const harvestReports = harvestSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log('📋 Raw harvest reports found:', harvestReports.length);
      if (harvestReports.length === 0) {
        console.log('⚠️ No harvest reports found for user:', user.email);
        setHarvestReports([]);
        setLoading(false);
        return;
      }
      
      // Debug: Log the actual harvest reports data
      console.log('📋 Harvest reports for user:', user.email);
      harvestReports.forEach((report, index) => {
        console.log(`📋 Harvest report ${index + 1}:`, {
          id: report.id,
          farmerEmail: report.farmerEmail,
          userEmail: report.userEmail,
          crop: report.crop,
          status: report.status,
          amount: report.amount,
          amountType: report.amountType,
          actualHarvest: report.actualHarvest,
          isHarvested: report.isHarvested,
          harvestDate: report.harvestDate,
          plantingReportId: report.plantingReportId
        });
      });
      
      // Debug: Also try to see ALL harvest reports in database (for debugging)
      console.log('🔍 DEBUG: Checking all harvest reports in database...');
      const allHarvestQuery = query(collection(db, 'harvestReports'));
      const allHarvestSnapshot = await getDocs(allHarvestQuery);
      const allHarvestReports = allHarvestSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('🔍 DEBUG: Total harvest reports in database:', allHarvestReports.length);
      
      // Identify new format vs old format records
      const newFormatRecords = allHarvestReports.filter(report => 
        report.isHarvested !== undefined || report.actualHarvest !== undefined || report.userEmail
      );
      const oldFormatRecords = allHarvestReports.filter(report => 
        report.status !== undefined && report.amount !== undefined && report.farmerEmail
      );
      
      console.log('🔍 DEBUG: New format records (to be deleted):', newFormatRecords.length);
      console.log('🔍 DEBUG: Old format records (to keep):', oldFormatRecords.length);
      
      newFormatRecords.forEach((report, index) => {
        console.log(`🗑️ NEW FORMAT RECORD ${index + 1} (DELETE THIS):`, {
          id: report.id,
          userEmail: report.userEmail,
          isHarvested: report.isHarvested,
          actualHarvest: report.actualHarvest,
          harvestDate: report.harvestDate
        });
      });
      
      // Separate harvested vs pending reports (old format only)
      const harvestedReports = allHarvestReports.filter(report => 
        report.status === 'harvested' || report.status === 'completed'
      );
      const pendingReports = allHarvestReports.filter(report => 
        report.status === 'pending' || !report.status
      );
      
      console.log('🔍 DEBUG: Harvested reports in database:', harvestedReports.length);
      console.log('🔍 DEBUG: Pending reports in database:', pendingReports.length);
      
      allHarvestReports.forEach((report, index) => {
        console.log(`🔍 DEBUG: Harvest report ${index + 1}:`, {
          id: report.id,
          farmerEmail: report.farmerEmail,
          crop: report.crop,
          status: report.status,
          amount: report.amount,
          amountType: report.amountType
        });
      });
      
      // Check if there are harvested reports for this user (old format only)
      const userHarvestedReports = allHarvestReports.filter(report => 
        report.farmerEmail === user.email && 
        (report.status === 'harvested' || report.status === 'completed')
      );
      console.log('🔍 DEBUG: Harvested reports for current user:', userHarvestedReports.length);
      userHarvestedReports.forEach((report, index) => {
        console.log(`🔍 DEBUG: User harvested report ${index + 1}:`, {
          id: report.id,
          crop: report.crop,
          amount: report.amount,
          status: report.status
        });
      });
      
      // Fetch planting report data for each harvest report
      const reportsWithPlantingData = await Promise.all(
        harvestReports.map(async (harvestReport) => {
          if (harvestReport.plantingReportId) {
            try {
              console.log('🔍 Fetching planting report for ID:', harvestReport.plantingReportId);
              const plantingDoc = await getDoc(doc(db, 'plantingReports', harvestReport.plantingReportId));
              
                  if (plantingDoc.exists()) {
                    const plantingData = plantingDoc.data();
                    console.log('✅ Found planting report data:', Object.keys(plantingData));
                    console.log('✅ Planting report data values:', plantingData);
                
                // Merge planting report data with harvest report
                return {
                  ...harvestReport,
                  // Expected harvest information from planting report
                  expectedHarvestDate: plantingData.expectedHarvestDate || plantingData.expectedDate,
                  expectedYield: plantingData.expectedHarvest || plantingData.expectedYield || plantingData.expectedWeight,
                  plantingDate: plantingData.plantingDate || plantingData.plantedDate,
                  area: plantingData.areaPlanted || plantingData.arearianted || plantingData.area || plantingData.landArea,
                  plantCount: plantingData.plantCount || plantingData.plantNumber || plantingData.numberOfPlants,
                  // Additional planting report fields
                  variety: plantingData.variety,
                  soilType: plantingData.soilType,
                  irrigation: plantingData.irrigation,
                  fertilizer: plantingData.fertilizer,
                  notes: plantingData.notes,
                  areaType: plantingData.areaType,
                  status: plantingData.status
                };
              } else {
                console.log('⚠️ Planting report not found for ID:', harvestReport.plantingReportId);
                return harvestReport;
              }
            } catch (error) {
              console.error('❌ Error fetching planting report:', error);
              return harvestReport;
            }
          } else {
            console.log('⚠️ No plantingReportId found for harvest report:', harvestReport.id);
            return harvestReport;
          }
        })
      );
      
      // Sort by harvest date (most recent first)
      reportsWithPlantingData.sort((a, b) => {
        const dateA = new Date(a.harvestDate || a.createdAt);
        const dateB = new Date(b.harvestDate || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setHarvestReports(reportsWithPlantingData);
      console.log('✅ Loaded harvest reports with planting data:', reportsWithPlantingData.length);
      console.log('🔄 State updated - harvestReports should now have', reportsWithPlantingData.length, 'reports');
      
          // Debug: Log the first report to see available fields
          if (reportsWithPlantingData.length > 0) {
            console.log('📋 Sample merged report fields:', Object.keys(reportsWithPlantingData[0]));
            console.log('📋 Sample merged report data:', reportsWithPlantingData[0]);
            
            // Show specific field mappings
            const sampleReport = reportsWithPlantingData[0];
            console.log('📋 Field mapping results:');
            console.log('  - area:', sampleReport.area);
            console.log('  - expectedYield:', sampleReport.expectedYield);
            console.log('  - expectedHarvestDate:', sampleReport.expectedHarvestDate);
            console.log('  - plantingDate:', sampleReport.plantingDate);
            console.log('  - plantCount:', sampleReport.plantCount);
          }
    } catch (error) {
      console.error('Error loading harvest reports:', error);
      Alert.alert('Error', 'Failed to load harvest reports');
    } finally {
      setLoading(false);
    }
  };

  const deleteHarvestReport = async (reportId: string, cropName: string) => {
    Alert.alert(
      'Delete Harvest Report',
      `Are you sure you want to delete the harvest report for ${cropName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'harvestReports', reportId));
              setHarvestReports(prev => prev.filter(report => report.id !== reportId));
              Alert.alert('Success', 'Harvest report deleted successfully');
            } catch (error) {
              console.error('Error deleting harvest report:', error);
              Alert.alert('Error', 'Failed to delete harvest report');
            }
          }
        }
      ]
    );
  };

  const openRecordHarvestModal = (report: any) => {
    setSelectedReport(report);
    setHarvestDate('');
    setHarvestWeight('');
    setSelectedDate(new Date());
    setShowRecordHarvestModal(true);
  };

  const closeRecordHarvestModal = () => {
    setShowRecordHarvestModal(false);
    setSelectedReport(null);
    setHarvestDate('');
    setHarvestWeight('');
    setShowDatePicker(false);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      // Format date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setHarvestDate(formattedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const submitHarvestRecord = async () => {
    if (!selectedReport || !harvestDate || !harvestWeight) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(parseFloat(harvestWeight)) || parseFloat(harvestWeight) <= 0) {
      Alert.alert('Error', 'Please enter a valid harvest weight');
      return;
    }

    setSubmittingHarvest(true);
    try {
      const reportRef = doc(db, 'harvestReports', selectedReport.id);
      await updateDoc(reportRef, {
        harvestDate: harvestDate,
        harvestWeight: parseFloat(harvestWeight),
        isHarvested: true,
        // Also update old-format fields so lists and analytics see it as harvested
        status: 'harvested',
        amount: parseFloat(harvestWeight),
        amountType: 'kg',
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setHarvestReports(prev => prev.map(report => 
        report.id === selectedReport.id 
          ? { 
              ...report, 
              harvestDate, 
              harvestWeight: parseFloat(harvestWeight), 
              isHarvested: true,
              status: 'harvested',
              amount: parseFloat(harvestWeight),
              amountType: 'kg'
            }
          : report
      ));

      Alert.alert('Success', 'Harvest recorded successfully!');
      closeRecordHarvestModal();
    } catch (error) {
      console.error('Error recording harvest:', error);
      Alert.alert('Error', 'Failed to record harvest');
    } finally {
      setSubmittingHarvest(false);
    }
  };

  const cleanupNewFormatRecords = async () => {
    try {
      console.log('🧹 Starting cleanup of new format harvest records...');
      
      // Get all harvest reports
      const allHarvestQuery = query(collection(db, 'harvestReports'));
      const allHarvestSnapshot = await getDocs(allHarvestQuery);
      const allHarvestReports = allHarvestSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Identify new format records (those with isHarvested, actualHarvest, or userEmail)
      const newFormatRecords = allHarvestReports.filter(report => 
        report.isHarvested !== undefined || report.actualHarvest !== undefined || report.userEmail
      );
      
      console.log(`🧹 Found ${newFormatRecords.length} new format records to delete`);
      
      if (newFormatRecords.length === 0) {
        Alert.alert('Cleanup Complete', 'No new format records found to delete.');
        return;
      }
      
      // Confirm deletion
      Alert.alert(
        'Confirm Cleanup',
        `Found ${newFormatRecords.length} new format harvest records. Do you want to delete them?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete each new format record
                for (const record of newFormatRecords) {
                  console.log(`🗑️ Deleting new format record: ${record.id}`);
                  await deleteDoc(doc(db, 'harvestReports', record.id));
                }
                
                console.log(`✅ Successfully deleted ${newFormatRecords.length} new format records`);
                Alert.alert('Cleanup Complete', `Successfully deleted ${newFormatRecords.length} new format records.`);
                
                // Reload the reports
                loadHarvestReports();
              } catch (error) {
                console.error('Error during cleanup:', error);
                Alert.alert('Error', 'Failed to delete some records. Please check the console for details.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error during cleanup:', error);
      Alert.alert('Error', 'Failed to perform cleanup. Please try again.');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHarvestReports();
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHarvestReports();
    }, [user])
  );

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Not specified' || dateString === 'N/A') {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'harvested':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (report: any) => {
    // Check both old and new formats like admin does
    if (report.isHarvested === true || report.harvestDate || report.status === 'harvested' || report.status === 'completed') {
      return 'HARVESTED';
    }
    return 'PENDING';
  };

  // Debug: Log current state
  console.log('🎨 Component render - loading:', loading, 'harvestReports.length:', harvestReports.length);

  return (
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
          <Text style={styles.headerTitle}>Harvest Reports</Text>
          <Text style={styles.headerSubtitle}>Your submitted harvest reports</Text>
        </View>
        <TouchableOpacity 
          style={styles.cleanupButton}
          onPress={cleanupNewFormatRecords}
        >
          <Ionicons name="trash-outline" size={20} color="#FF5722" />
        </TouchableOpacity>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            {console.log('🎨 Rendering loading state')}
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={styles.loadingText}>Loading harvest reports...</Text>
          </View>
        ) : harvestReports.length > 0 ? (
          <View style={styles.reportsContainer}>
            {console.log('🎨 About to render', harvestReports.length, 'harvest reports')}
            {harvestReports.map((report) => {
              const status = getStatusText(report);
              const statusColor = getStatusColor(status);
              
              // Debug: Log each report being rendered
              console.log('🎨 Rendering harvest report:', {
                id: report.id,
                crop: report.crop,
                status: status,
                isHarvested: report.isHarvested,
                harvestDate: report.harvestDate,
                oldStatus: report.status,
                amount: report.amount,
                plantingDate: report.plantingDate,
                expectedHarvestDate: report.expectedHarvestDate,
                expectedYield: report.expectedYield,
                area: report.area,
                plantCount: report.plantCount
              });
              
              return (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <View style={styles.cropInfo}>
                      <Text style={styles.cropIcon}>{getCropIcon(report.crop)}</Text>
                      <Text style={styles.cropName}>{report.crop}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Ionicons 
                        name={status === 'HARVESTED' ? 'checkmark' : 'time'} 
                        size={16} 
                        color="white" 
                      />
                      <Text style={styles.statusText}>{status}</Text>
                    </View>
                  </View>

                  <View style={styles.reportDetails}>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Planted:</Text> {formatDate(report.plantingDate || report.plantedDate)}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Expected:</Text> {formatDate(report.expectedHarvestDate || report.expectedDate)}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Area:</Text> {report.area || 'N/A'} hectares • Plants: {report.plantCount || report.plantNumber || 'N/A'}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Expected Yield:</Text> {report.expectedYield || report.expectedWeight || 'N/A'} kg
                    </Text>
                  </View>

                  {status === 'HARVESTED' ? (
                    <View style={styles.harvestedInfo}>
                      <View style={[styles.harvestedBadge, { backgroundColor: '#E8F5E8' }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.harvestedText}>
                          Harvested: {report.actualHarvest || report.amount || report.harvestWeight || 0} kg on {formatDate(report.harvestDate)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.pendingInfo}>
                      <View style={[styles.pendingBadge, { backgroundColor: '#FFF3E0' }]}>
                        <Ionicons name="time" size={16} color="#FF9800" />
                        <Text style={styles.pendingText}>Not harvested yet</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.reportActions}>
                    {status === 'PENDING' ? (
                      <TouchableOpacity 
                        style={styles.recordHarvestButton}
                        onPress={() => openRecordHarvestModal(report)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.recordHarvestButtonText}>RECORD HARVEST</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => {
                            // Navigate to edit harvest report
                            router.push({
                              pathname: '/harvest-report',
                              params: { editId: report.id }
                            });
                          }}
                        >
                          <Ionicons name="pencil" size={16} color={GREEN} />
                          <Text style={styles.editButtonText}>EDIT</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => deleteHarvestReport(report.id, report.crop)}
                        >
                          <Ionicons name="trash" size={16} color="#F44336" />
                          <Text style={styles.deleteButtonText}>DELETE</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            {console.log('🎨 Rendering empty state - harvestReports.length:', harvestReports.length)}
            <Ionicons name="leaf-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Harvest Reports</Text>
            <Text style={styles.emptySubtitle}>
              You haven't submitted any harvest reports yet.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/harvest-report')}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Harvest Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Record Harvest Modal */}
      <Modal
        visible={showRecordHarvestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeRecordHarvestModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Record Harvest</Text>
            {selectedReport && (
              <View style={styles.modalCropContainer}>
                <Text style={styles.modalCropEmoji}>{getCropIcon(selectedReport.crop)}</Text>
                <Text style={styles.modalCropName}>{selectedReport.crop}</Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Harvest Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={showDatePickerModal}
              >
                <Ionicons name="calendar-outline" size={20} color={GREEN} />
                <Text style={[styles.datePickerText, !harvestDate && styles.datePickerPlaceholder]}>
                  {harvestDate || 'Tap to select harvest date'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Harvest Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter harvest weight in kilograms"
                value={harvestWeight}
                onChangeText={setHarvestWeight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={closeRecordHarvestModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, submittingHarvest && styles.submitButtonDisabled]}
                onPress={submitHarvestRecord}
                disabled={submittingHarvest}
              >
                {submittingHarvest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
                <Text style={styles.submitButtonText}>
                  {submittingHarvest ? 'SUBMITTING...' : 'SUBMIT'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBorder: {
    height: 35,
    width: '100%',
    backgroundColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  cleanupButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  reportsContainer: {
    gap: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reportDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  harvestedInfo: {
    marginBottom: 12,
  },
  harvestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  harvestedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  pendingInfo: {
    marginBottom: 12,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pendingText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: 'white',
  },
  editButtonText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    backgroundColor: 'white',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Record Harvest Button
  recordHarvestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: GREEN,
  },
  recordHarvestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalCropContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalCropEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  modalCropName: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  datePickerPlaceholder: {
    color: '#999',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: GREEN,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
