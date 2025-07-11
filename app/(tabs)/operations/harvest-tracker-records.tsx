import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../components/AuthContext';
import { useBarangay } from '../../../components/RoleContext';
import { fetchHarvestRecords } from '../../../services/harvestUploadService';

const GREEN = '#16543a';
const WHITE = '#ffffff';
const RECORDS_PER_PAGE = 20; // Load only 20 records at a time

export default function HarvestTrackerRecordsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { barangay } = useBarangay();
  const [allHarvestData, setAllHarvestData] = useState<any[]>([]);
  const [displayedHarvest, setDisplayedHarvest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRecords();
  }, [barangay]);

  useEffect(() => {
    updateDisplayedRecords();
  }, [allHarvestData, currentPage]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const records = await fetchHarvestRecords(barangay || undefined);
      
      // Filter by barangay for Admins
      let filteredRecords = records || [];
      if (profile.role === 'Admin' && barangay) {
        filteredRecords = records.filter((record: any) => record.barangay === barangay);
      }
      
      setAllHarvestData(filteredRecords);
      setTotalPages(Math.ceil((filteredRecords?.length || 0) / RECORDS_PER_PAGE));
    } catch (error) {
      Alert.alert('Error', 'Failed to load harvest tracker data.');
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayedRecords = () => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    const endIndex = startIndex + RECORDS_PER_PAGE;
    const records = allHarvestData.slice(startIndex, endIndex);
    setDisplayedHarvest(records);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderTableRow = ({ item, index }: { item: any; index: number }) => {
    const globalIndex = (currentPage - 1) * RECORDS_PER_PAGE + index;
    return (
      <View
        style={[
          styles.tableRow,
          { backgroundColor: globalIndex % 2 === 0 ? '#fff' : '#f7f7f7' },
        ]}
      >
        <View style={[styles.tableCell, { width: 60, alignItems: 'center' }]}> 
          <Text style={styles.tableCellText}>{globalIndex + 1}</Text>
        </View>
        <View style={[styles.tableCell, { width: 140 }]}>
          <Text style={styles.tableCellText}>{item.name}</Text>
        </View>
        <View style={[styles.tableCell, { width: 120 }]}>
          <Text style={styles.tableCellText}>{item.cropType}</Text>
        </View>
        <View style={[styles.tableCell, { width: 120 }]}>
          <Text style={styles.tableCellText}>{item.typeVariety}</Text>
        </View>
        <View style={[styles.tableCell, { width: 120 }]}>
          <Text style={styles.tableCellText}>{item.irrigationType}</Text>
        </View>
        <View style={[styles.tableCell, { width: 100 }]}>
          <Text style={styles.tableCellText}>{item.week1}</Text>
        </View>
        <View style={[styles.tableCell, { width: 100 }]}>
          <Text style={styles.tableCellText}>{item.week2}</Text>
        </View>
        <View style={[styles.tableCell, { width: 100 }]}>
          <Text style={styles.tableCellText}>{item.week3}</Text>
        </View>
        <View style={[styles.tableCell, { width: 100 }]}>
          <Text style={styles.tableCellText}>{item.week4}</Text>
        </View>
        <View style={[styles.tableCell, { width: 100 }]}>
          <Text style={styles.tableCellText}>{item.total}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#888', fontStyle: 'italic', fontSize: 16 }}>No harvest records found.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Harvest Tracker</Text>
          <Text style={styles.headerSubtitle}>
            {profile.role === 'Admin' && barangay 
              ? `Viewing records for ${barangay}` 
              : 'View all harvest tracker records'
            }
          </Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading records...</Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  {['No.', 'Name', 'Crop Type', 'Type/Variety', 'Soil Type', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Total'].map((header, hIdx) => (
                    <View
                      key={hIdx}
                      style={[
                        styles.tableHeaderCell,
                        { width: [60, 140, 120, 120, 120, 100, 100, 100, 100, 100][hIdx] },
                      ]}
                    >
                      <Text style={styles.tableHeaderText}>{header}</Text>
                    </View>
                  ))}
                </View>
                {/* Table Rows using FlatList for better performance */}
                <FlatList
                  data={displayedHarvest}
                  renderItem={renderTableRow}
                  keyExtractor={(item, index) => item.id || `row-${(currentPage - 1) * RECORDS_PER_PAGE + index}`}
                  ListEmptyComponent={renderEmptyComponent}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={10}
                  getItemLayout={(data, index) => ({
                    length: 38,
                    offset: 38 * index,
                    index,
                  })}
                />
              </View>
            </ScrollView>
            
            {/* Pagination Controls */}
            {allHarvestData.length > RECORDS_PER_PAGE && (
              <View style={styles.paginationContainer}>
                <Text style={styles.paginationInfo}>
                  Showing {((currentPage - 1) * RECORDS_PER_PAGE) + 1} - {Math.min(currentPage * RECORDS_PER_PAGE, allHarvestData.length)} of {allHarvestData.length} records
                </Text>
                <View style={styles.paginationControls}>
                  <TouchableOpacity 
                    style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]} 
                    onPress={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Previous</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.pageNumbers}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <TouchableOpacity
                          key={pageNum}
                          style={[styles.pageNumber, currentPage === pageNum && styles.currentPageNumber]}
                          onPress={() => goToPage(pageNum)}
                        >
                          <Text style={[styles.pageNumberText, currentPage === pageNum && styles.currentPageNumberText]}>
                            {pageNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]} 
                    onPress={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    marginRight: 16,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  tableContainer: {
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 8,
    minWidth: 900,
    flex: 1,
    backgroundColor: '#fafbfc',
    minHeight: 456,
    borderBottomWidth: 2,
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    height: 38,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    height: 38,
    borderRightWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    textAlign: 'left',
    paddingLeft: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    height: 38,
  },
  tableCell: {
    height: 38,
    borderRightWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  tableCellText: {
    textAlign: 'left',
    paddingLeft: 2,
  },
  paginationContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  paginationButtonTextDisabled: {
    color: '#999',
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 4,
  },
  pageNumber: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: WHITE,
  },
  currentPageNumber: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  pageNumberText: {
    fontSize: 14,
    color: '#333',
  },
  currentPageNumberText: {
    color: WHITE,
    fontWeight: 'bold',
  },
}); 