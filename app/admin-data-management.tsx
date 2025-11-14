import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../components/AuthContext';
import { useNavigationBar } from '../hooks/useNavigationBar';
// Price data loading removed

const { width } = Dimensions.get('window');
const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

interface ExcelDataItem {
  commodity: string;
  specification?: string;
  price: number; // equals forecast for compatibility
  forecast?: number | null;
  low?: number | null;
  high?: number | null;
  unit: string;
  region: string;
  date: string;
}

export default function AdminDataManagementScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [excelData, setExcelData] = useState<ExcelDataItem[]>([]);
  const [dataSource, setDataSource] = useState<'excel' | 'latest'>('excel');
  const [excelAvailable, setExcelAvailable] = useState<boolean>(false);
  const [fileInfo, setFileInfo] = useState<{
    filename: string;
    date: string;
    recordCount: number;
    filePath: string;
    fileSize?: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<ExcelDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(500);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showCommodityPicker, setShowCommodityPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [metric, setMetric] = useState<'forecast' | 'low' | 'high'>('forecast');

  useNavigationBar('hidden');

  useEffect(() => {
    if (!user || profile.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can access this page.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
      return;
    }
    
    // Auto-download Excel file on load
    initializeExcelFile();
  }, []);

  // Auto-refresh when screen is focused (no pull needed)
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {};
    }, [])
  );

  const initializeExcelFile = async () => {
    // Just load data - it will use Excel-converted JSON automatically
    await loadData();
  };

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = excelData.filter(item => {
      const matchesSearch = !query ||
        item.commodity.toLowerCase().includes(query) ||
        (item.specification && item.specification.toLowerCase().includes(query)) ||
        item.region.toLowerCase().includes(query);

      const matchesCommodity = !selectedCommodity || item.commodity === selectedCommodity;
      const itemYear = (item.date || '').slice(0, 4);
      const matchesYear = !selectedYear || itemYear === selectedYear;
      return matchesSearch && matchesCommodity && matchesYear;
    });
    setFilteredData(filtered);
  }, [searchQuery, excelData, selectedCommodity, selectedYear]);

  // Price data loading removed
  useEffect(() => {
    // Price data auto-upgrade functionality removed
  }, [selectedCommodity]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Price data loading removed - Excel JSON files have been deleted
      const excelJson: any[] = [];

      if (excelJson && Array.isArray(excelJson) && excelJson.length > 0) {
        setExcelAvailable(true);
        setDataSource('excel');
        const convertedData: ExcelDataItem[] = excelJson.map((item: any) => ({
          commodity: item.commodity || item.Commodity || 'Unknown',
          specification: item.specification || item.Specification || '',
          price: (item.price ?? item.forecast ?? item.Price ?? item.Forecast ?? 0),
          forecast: (item.forecast ?? item.Forecast ?? item.price ?? 0),
          low: item.low ?? item.Low ?? null,
          high: item.high ?? item.High ?? null,
          unit: item.unit || item.Unit || 'kg',
          region: item.region || item.Region || 'NCR',
          date: item.date || item.Date || new Date().toISOString().split('T')[0],
        }));
        setExcelData(convertedData);
        setFilteredData(convertedData);
        const usingPreview = excelJson.length <= 2000; // preview has 2k
        setFileInfo({
          filename: usingPreview ? 'Forecast All ETS.xlsx (Excel Preview JSON)' : 'Forecast All ETS.xlsx (Excel JSON - Full)',
          date: convertedData[0]?.date || new Date().toISOString().split('T')[0],
          recordCount: convertedData.length,
          filePath: usingPreview ? 'data/excel_converted_preview.json' : 'data/excel_converted_data.json',
        });
        setVisibleCount(1000);

        // Price data auto-upgrade removed
      } else {
        // 2) Fallback to latest snapshot selector - price data removed
        setExcelAvailable(false);
        setDataSource('latest');
        // Price data loading removed - returning empty array
        const data: any[] = [];
        if (data && data.length > 0) {
          // This branch will never execute with empty data
        } else {
          throw new Error('Price data has been removed from the system.');
        }
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      Alert.alert('Error', `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const importExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const picked = result.assets[0];
      if (!picked.uri) {
        Alert.alert('Import Failed', 'No file URI returned.');
        return;
      }

      const targetDir = `${FileSystem.documentDirectory}Prices`;
      const targetPath = `${targetDir}/Forecast All_FORECASTED_CORRECTED.xlsx`;

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      }

      // Copy file into app storage
      await FileSystem.copyAsync({ from: picked.uri, to: targetPath });

      Alert.alert('Import Complete', 'Excel file imported successfully.');
      await loadData();
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const openFileLocation = () => {
    Alert.alert(
      'File Location',
      `File: ${fileInfo?.filename}\n\nLocation: ${fileInfo?.filePath}\n\n` +
      `To view/edit in Excel:\n` +
      `1. Open file explorer\n` +
      `2. Navigate to: C:\\AgriAssist-Capstone-master\\data\\Prices\\\n` +
      `3. Open: Forecast All_FORECASTED_CORRECTED.xlsx\n\n` +
      `The app displays the data, but Excel editing must be done in Excel application.`,
      [{ text: 'OK' }]
    );
  };

  const renderItem = ({ item }: { item: ExcelDataItem }) => (
    <View style={styles.dataRow}>
      <View style={styles.dataRowHeader}>
        <Text style={styles.commodityName}>{item.commodity}</Text>
        {item.specification && (
          <Text style={styles.specification}>{item.specification}</Text>
        )}
      </View>
      <View style={{ marginTop: 4 }}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Forecast:</Text>
          <Text style={styles.priceValue}>₱{(item.forecast ?? item.price).toFixed(2)}</Text>
          <Text style={styles.unit}>/{item.unit}</Text>
        </View>
        {((item.low ?? 0) !== 0 || ((item.high ?? 0) !== 0)) && (
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <Text style={styles.priceLabel}>Low–High:</Text>
            <Text style={[styles.unit, { fontWeight: '600' }]}>₱{(item.low ?? 0).toFixed(2)} – ₱{(item.high ?? 0).toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.metaContainer, { marginTop: 6, flexDirection: 'row' }]}>
          <Text style={styles.metaText}>📍 {item.region}</Text>
          <Text style={[styles.metaText, { marginLeft: 12 }]}>📅 {item.date}</Text>
        </View>
      </View>
    </View>
  );

  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Very simple monthly series builder for admin price monitoring:
  // - Only includes months where there is REAL data (> 0)
  // - Uses the true monthly average (no fake zeros, no padding)
  // - Does NOT force January if there is no data for that month
  type Series = { labels: string[]; values: number[] };
  const buildMonthlySeries = (data: ExcelDataItem[], metricKey: 'forecast'|'low'|'high'): Series => {
    const perMonth: { [m: number]: number[] } = {};
    data.forEach(d => {
      const month = parseInt((d.date || '').slice(5,7)) - 1;
      if (isNaN(month) || month < 0 || month > 11) return;
      const raw = metricKey === 'forecast' ? (d.forecast ?? d.price) : metricKey === 'low' ? d.low : d.high;
      if (typeof raw === 'number' && isFinite(raw) && raw > 0) {
        if (!perMonth[month]) perMonth[month] = [];
        perMonth[month].push(raw);
      }
    });
    const labels: string[] = [];
    const values: number[] = [];

    // IMPORTANT: Only push months that really have data.
    // If forecast only starts in November, labels will be ['Nov','Dec'] – no Jan–Oct at all.
    for (let m = 0; m < 12; m++) {
      if (perMonth[m] && perMonth[m].length) {
        const avg = perMonth[m].reduce((a,b)=>a+b,0) / perMonth[m].length;
        labels.push(monthLabels[m]);
        values.push(avg);
      }
    }

    return { labels, values };
  };

  type CombinedSeries = { labels: string[]; baseline: number; f: number[]; l: number[]; h: number[] };
  const buildMonthlySeriesAll = (data: ExcelDataItem[]): CombinedSeries => {
    const perMonthF: { [m: number]: number[] } = {};
    const perMonthL: { [m: number]: number[] } = {};
    const perMonthH: { [m: number]: number[] } = {};
    data.forEach(d => {
      const m = parseInt((d.date || '').slice(5,7)) - 1;
      if (isNaN(m) || m < 0 || m > 11) return;
      const f = (d.forecast ?? d.price);
      const l = d.low ?? null;
      const h = d.high ?? null;
      if (typeof f === 'number' && isFinite(f) && f > 0) (perMonthF[m] ||= []).push(f);
      if (typeof l === 'number' && isFinite(l) && l > 0) (perMonthL[m] ||= []).push(l);
      if (typeof h === 'number' && isFinite(h) && h > 0) (perMonthH[m] ||= []).push(h);
    });
    const labels: string[] = [];
    const f: number[] = [];
    const l: number[] = [];
    const h: number[] = [];
    for (let m = 0; m < 12; m++) {
      const hasAny = (perMonthF[m] && perMonthF[m].length) || (perMonthL[m] && perMonthL[m].length) || (perMonthH[m] && perMonthH[m].length);
      if (!hasAny) continue;
      labels.push(monthLabels[m]);
      // Only calculate and push averages if there's actual data for that series
      // Don't push 0 - only push valid calculated averages
      const fVal = perMonthF[m] && perMonthF[m].length > 0 
        ? perMonthF[m].reduce((a,b)=>a+b,0) / perMonthF[m].length 
        : null;
      const lVal = perMonthL[m] && perMonthL[m].length > 0 
        ? perMonthL[m].reduce((a,b)=>a+b,0) / perMonthL[m].length 
        : null;
      const hVal = perMonthH[m] && perMonthH[m].length > 0 
        ? perMonthH[m].reduce((a,b)=>a+b,0) / perMonthH[m].length 
        : null;
      // Push valid values (> 0) or use 0 as placeholder (will be handled in adj function)
      // But only if at least one series has valid data (already checked by hasAny)
      f.push((fVal !== null && fVal > 0) ? fVal : 0);
      l.push((lVal !== null && lVal > 0) ? lVal : 0);
      h.push((hVal !== null && hVal > 0) ? hVal : 0);
    }
    const allVals = [...f, ...l, ...h].filter(v => typeof v === 'number' && isFinite(v) && v > 0);
    const min = allVals.length ? Math.min(...allVals) : 0;
    const max = allVals.length ? Math.max(...allVals) : 0;
    const pad = Math.max(0.5, (max - min) * 0.05);
    const baseline = Math.max(0, min - pad);
    const adj = (arr: number[]) => arr.map(v => (typeof v === 'number' && isFinite(v) && v > 0) ? (v - baseline) : 0);
    return { labels, baseline, f: adj(f), l: adj(l), h: adj(h) };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.topBorder} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </View>
    );
  }

  if (error && excelData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.topBorder} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Error Loading Data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBorder} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Data</Text>
        </View>

        {/* Source Toggle */}
        <View style={[styles.infoCard, { paddingVertical: 12 }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={async () => { setDataSource('excel'); await loadData(); }}
              style={[styles.toggleButton, dataSource === 'excel' ? styles.toggleActive : undefined]}
              disabled={!excelAvailable}
            >
              <Text style={[styles.toggleText, dataSource === 'excel' ? styles.toggleTextActive : undefined]}>
                Excel (Full){excelAvailable ? '' : ' • unavailable'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => { Alert.alert('Info', 'Price data loading has been disabled.'); }}
              style={[styles.toggleButton, dataSource === 'latest' ? styles.toggleActive : undefined]}
            >
              <Text style={[styles.toggleText, dataSource === 'latest' ? styles.toggleTextActive : undefined]}>Latest Snapshot</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* File Info Card */}
        {fileInfo && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="document-text" size={24} color={GREEN} />
              <Text style={styles.infoTitle}>Current Data Source</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>File:</Text>
              <Text style={styles.infoValue}>{fileInfo.filename}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Records:</Text>
              <Text style={styles.infoValue}>{fileInfo.recordCount.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{fileInfo.date}</Text>
            </View>
            {fileInfo.fileSize && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Size:</Text>
                <Text style={styles.infoValue}>
                  {(fileInfo.fileSize / 1024).toFixed(2)} KB
                </Text>
              </View>
            )}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={16} color={GREEN} />
              <Text style={styles.infoNoteTitle}>How to Update:</Text>
              <Text style={styles.infoNoteText}>
                1. Edit Excel file: data/Prices/Forecast ETS fixed.xlsx{'\n'}
                2. Run: node scripts/convertExcelToJson.js{'\n'}
                3. Reopen this screen (auto-refreshes){'\n\n'}
                ✅ No Firebase downloads - uses local JSON (fast!)
              </Text>
            </View>
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={16} color="#666" />
              <Text style={styles.infoNoteText}>
                This screen shows the data from your Excel file. To edit the file, open it in Excel application.
              </Text>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search commodities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={[styles.infoCard, { paddingVertical: 12 }]}> 
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[styles.filterPill, selectedCommodity ? styles.filterPillActive : undefined]}
              onPress={() => { setShowCommodityPicker(!showCommodityPicker); setShowYearPicker(false); }}
            >
              <Text style={[styles.filterPillText, selectedCommodity ? styles.filterPillTextActive : undefined]}>
                {selectedCommodity || 'Commodity'}
              </Text>
              <Ionicons name={showCommodityPicker ? 'chevron-up' : 'chevron-down'} size={16} color={selectedCommodity ? '#fff' : GREEN} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, selectedYear ? styles.filterPillActive : undefined]}
              onPress={() => { setShowYearPicker(!showYearPicker); setShowCommodityPicker(false); }}
            >
              <Text style={[styles.filterPillText, selectedYear ? styles.filterPillTextActive : undefined]}>
                {selectedYear || 'Year'}
              </Text>
              <Ionicons name={showYearPicker ? 'chevron-up' : 'chevron-down'} size={16} color={selectedYear ? '#fff' : GREEN} />
            </TouchableOpacity>
            {(selectedCommodity || selectedYear) && (
              <TouchableOpacity style={[styles.filterPill, { backgroundColor: '#eee' }]} onPress={() => { setSelectedCommodity(null); setSelectedYear(null); }}>
                <Ionicons name="refresh" size={16} color={GREEN} />
                <Text style={[styles.filterPillText, { color: GREEN, marginLeft: 6 }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {showCommodityPicker && (
            <View style={{ marginTop: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array.from(new Set(excelData.map(d => d.commodity))).sort().slice(0, 50).map((c) => (
                  <TouchableOpacity key={c} style={[styles.optionChip, selectedCommodity === c ? styles.optionChipActive : undefined]} onPress={() => { setSelectedCommodity(c); setShowCommodityPicker(false); }}>
                    <Text style={[styles.optionChipText, selectedCommodity === c ? styles.optionChipTextActive : undefined]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {showYearPicker && (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from(new Set(excelData.map(d => (d.date || '').slice(0,4)))).filter(Boolean).sort().map((y) => (
                  <TouchableOpacity key={y} style={[styles.optionChip, selectedYear === y ? styles.optionChipActive : undefined]} onPress={() => { setSelectedYear(y); setShowYearPicker(false); }}>
                    <Text style={[styles.optionChipText, selectedYear === y ? styles.optionChipTextActive : undefined]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Chart View */}
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>Price Movement</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <View style={[styles.optionChip, styles.optionChipActive]}>
              <Text style={[styles.optionChipText, styles.optionChipTextActive]}>FORECAST</Text>
            </View>
          </View>
          {filteredData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No data for selection</Text>
            </View>
          ) : (
            (() => {
              const dataForYear = filteredData.filter(d => !selectedYear || (d.date || '').startsWith(selectedYear!));
              const series = buildMonthlySeries(dataForYear, 'forecast');

              // If there is no data at all, show the empty state above.
              if (series.labels.length === 0 || series.values.length === 0) {
                return null;
              }

              // Chart kit behaves better with at least 2 points; if there's only one
              // real month (e.g., only November), duplicate it so you get a short line.
              const chartLabels =
                series.labels.length === 1 ? [series.labels[0], series.labels[0]] : series.labels;
              const chartValues =
                series.values.length === 1 ? [series.values[0], series.values[0]] : series.values;

              return (
                <LineChart
                  data={{ labels: chartLabels, datasets: [{ data: chartValues }] }}
                  width={width - 40}
                  height={260}
                  withDots
                  withInnerLines
                  formatYLabel={(val) => {
                    const v = Number(val);
                    return isFinite(v) ? v.toFixed(2) : '';
                  }}
                  chartConfig={{
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    color: (opacity = 1) => `rgba(22, 84, 58, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                    propsForDots: { r: '3', strokeWidth: '1', stroke: '#16543a' },
                    decimalPlaces: 2,
                  }}
                  style={{ borderRadius: 12 }}
                  bezier
                />
              );
            })()
          )}
        </View>
      </ScrollView>
      {/* Actions to explicitly load Excel preview/full inside Manage Data */}
      <View style={{ position: 'absolute', right: 16, bottom: 24, flexDirection: 'row' }}>
        <TouchableOpacity
          style={[styles.primaryButton, { marginRight: 8 }]}
          onPress={async () => { Alert.alert('Info', 'Excel preview data has been removed.'); }}
        >
          <Ionicons name="eye" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Preview Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={async () => { Alert.alert('Info', 'Excel data has been removed.'); }}
        >
          <Ionicons name="download" size={18} color={GREEN} />
          <Text style={styles.secondaryButtonText}>Load Full Excel</Text>
        </TouchableOpacity>
      </View>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GREEN,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  openLocationButton: {
    display: 'none'
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f2ee',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoNote: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: '#eef6f2',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: GREEN,
  },
  toggleText: {
    color: GREEN,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef6f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  filterPillActive: {
    backgroundColor: GREEN,
  },
  filterPillText: {
    color: GREEN,
    fontWeight: '600',
    marginRight: 6,
  },
  filterPillTextActive: {
    color: '#fff',
  },
  optionChip: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipActive: {
    backgroundColor: GREEN,
  },
  optionChipText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
  },
  dataContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dataRow: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataRowHeader: {
    marginBottom: 12,
  },
  commodityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  specification: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  dataRowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  unit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  metaContainer: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});

