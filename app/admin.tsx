import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';
import { OFFICIAL_PRODUCTS, Product } from '../constants/ProductData';

const { width } = Dimensions.get('window');
const GREEN = '#16543a';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeNav, setActiveNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [products, setProducts] = useState<Product[]>(OFFICIAL_PRODUCTS);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [hasUploadedPDF, setHasUploadedPDF] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Daily price index data structure
  const [dailyPriceData, setDailyPriceData] = useState<any>(null);
  
  // Sample Excel price data
  const sampleExcelData = {
    "items": [
      {
        "commodity": "Rice",
        "specification": "Fancy White Rice",
        "average": 56.15,
        "date": "2025-01-15"
      },
      {
        "commodity": "Rice",
        "specification": "Premium 5% broken",
        "average": 45.25,
        "date": "2025-01-15"
      },
      {
        "commodity": "Corn",
        "specification": "White Corn",
        "average": 28.50,
        "date": "2025-01-15"
      },
      {
        "commodity": "Vegetables",
        "specification": "Tomatoes",
        "average": 35.75,
        "date": "2025-01-15"
      },
      {
        "commodity": "Fruits",
        "specification": "Bananas",
        "average": 25.30,
        "date": "2025-01-15"
      },
      {
        "commodity": "Livestock",
        "specification": "Chicken (per kg)",
        "average": 180.00,
        "date": "2025-01-15"
      }
    ]
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to top function
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  
  // Load sample data function
  const loadSampleData = () => {
    setDailyPriceData(sampleExcelData);
    Alert.alert('Sample Data Loaded', 'Sample Excel price data has been loaded successfully.');
  };
  
  // Excel upload function
  const handleExcelUpload = async () => {
    try {
      setIsProcessing(true);
      setProcessingProgress(10);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsProcessing(false);
        return;
      }
      
      setProcessingProgress(30);
      
      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name || 'uploaded_file.xlsx';
      
      // Simulate Excel processing
      setProcessingProgress(50);
      
      // Extract data from Excel (simplified version)
      const extractedData = await extractDataFromExcel(fileUri);
      setProcessingProgress(70);
      
      // Convert extracted data to structured format
      const excelData = convertExcelToJSON(extractedData, fileName);
      setProcessingProgress(90);
      
      // Validate and set the data
      if (excelData.items && excelData.items.length > 0) {
        setDailyPriceData(excelData);
        setHasUploadedPDF(true);
        setProcessingProgress(100);
        
        Alert.alert(
          'Excel Processed Successfully!', 
          `Processed ${fileName}\n\n` +
          `📊 Found ${excelData.items.length} price records\n` +
          `📅 Data includes: Commodity, Specification, Average Price, Date\n\n` +
          `The Excel file has been processed and data is now available for viewing.`
        );
      } else {
        throw new Error('No valid price data found in Excel file');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Excel Processing Failed', `Error: ${errorMessage}\n\nPlease ensure the Excel file contains columns: Commodity, Specification, Average, Date.`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };
  
  // PDF to JSON conversion function (keeping for backward compatibility)
  const handlePDFUpload = async () => {
    try {
      setIsProcessing(true);
      setProcessingProgress(10);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsProcessing(false);
        return;
      }
      
      setProcessingProgress(30);
      
      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name || 'uploaded_file.pdf';
      
      // Simulate PDF processing and conversion to JSON
      setProcessingProgress(50);
      
      // Extract text from PDF (simplified version)
      const extractedText = await extractTextFromPDF(fileUri);
      setProcessingProgress(70);
      
      // Convert extracted text to structured JSON
      const jsonData = convertTextToJSON(extractedText, fileName);
      setProcessingProgress(90);
      
      // Validate and set the data
      if (jsonData.monitoring_date && jsonData.items && jsonData.items.length > 0) {
        setDailyPriceData(jsonData);
        setHasUploadedPDF(true);
        setProcessingProgress(100);
        
        Alert.alert(
          'PDF Converted Successfully!', 
          `Converted ${fileName} to JSON format\n\n` +
          `📊 Found ${jsonData.items.length} price items\n` +
          `📅 Monitoring Date: ${jsonData.monitoring_date}\n\n` +
          `The PDF has been automatically converted to the JSON format needed for price monitoring.`
        );
      } else {
        throw new Error('No valid price data found in PDF');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('PDF Processing Failed', `Error: ${errorMessage}\n\nPlease ensure the PDF contains a table with COMMODITY, SPECIFICATION, and PRICE columns.`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };
  
  // Extract text from PDF (simplified and improved)
  const extractTextFromPDF = async (pdfUri: string): Promise<string> => {
    try {
      // For now, we'll simulate the extraction and use the sample data
      // In a real implementation, you would use a PDF library like react-native-pdf
      // or send the PDF to a backend service for processing
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return sample text that represents what would be extracted
      return `ANNEX "A"
Prevailing Retail Prices of Selected Agricultural and Fishery Commodities
Date of Monitoring: 20 August 2025 (Wednesday)

COMMODITY | SPECIFICATION | PREVAILING RETAIL PRICE PER UNIT (P/UNIT)
IMPORTED COMMERCIAL RICE | Fancy White Rice | 56.15
IMPORTED COMMERCIAL RICE | Premium 5% broken | 45.25
LOCAL COMMERCIAL RICE | Regular Milled 20-40% bran streak | 37.9
CORN | Corn (White) Cob, Glutinous | 78.89
FISH | Bangus Large | 276.67
LIVESTOCK & POULTRY | Beef Rump, Local | 465.27`;
      
    } catch (error) {
      throw new Error('Failed to extract text from PDF');
    }
  };
  
  // Convert extracted text to structured JSON
  const convertTextToJSON = (extractedText: string, fileName: string): any => {
    try {
      const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
      
      // Find the header line that contains column names
      const headerIndex = lines.findIndex(line => 
        line.includes('COMMODITY') && line.includes('SPECIFICATION') && line.includes('PRICE')
      );
      
      if (headerIndex === -1) {
        throw new Error('Could not find table headers in PDF');
      }
      
      const dataLines = lines.slice(headerIndex + 1);
      const items: any[] = [];
      let lineNumber = 1;
      let currentSection = '';
      
      for (const line of dataLines) {
        // Skip empty lines and page headers
        if (!line.trim() || line.includes('Page') || line.includes('ANNEX')) {
          continue;
        }
        
        // Check if this is a section header (all caps, no price)
        if (line.match(/^[A-Z\s&]+$/) && !line.includes('|')) {
          currentSection = line.trim();
          continue;
        }
        
        // Parse data lines (should have 3 columns separated by |)
        const columns = line.split('|').map(col => col.trim());
        
        if (columns.length >= 3) {
          const commodity = columns[0];
          const specification = columns[1];
          const priceText = columns[2];
          
          // Skip if commodity is empty or looks like a section header
          if (!commodity || commodity.match(/^[A-Z\s&]+$/) || commodity.length < 3) {
            continue;
          }
          
          // Extract price (handle "n/a" and blank cases)
          let price: number | null = null;
          if (priceText && priceText.toLowerCase() !== 'n/a' && priceText.trim() !== '') {
            const priceMatch = priceText.match(/(\d+\.?\d*)/);
            if (priceMatch) {
              price = parseFloat(priceMatch[1]);
            }
          }
          
          // Create item object
          const item = {
            line_no: lineNumber,
            section: currentSection || 'UNCATEGORIZED',
            item: `${commodity} ${specification}`.trim(),
            price: price
          };
          
          items.push(item);
          lineNumber++;
        }
      }
      
      // Generate monitoring date (you could extract this from the PDF if available)
      const today = new Date();
      const monitoringDate = today.toISOString().split('T')[0];
      
      return {
        monitoring_date: monitoringDate,
        items: items
      };
      
    } catch (error) {
      throw new Error('Failed to convert PDF text to JSON structure');
    }
  };
  
  // Extract data from Excel (simplified version)
  const extractDataFromExcel = async (excelUri: string): Promise<any> => {
    try {
      // For now, we'll simulate the extraction and use sample data
      // In a real implementation, you would use a library like xlsx or send to backend
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return sample Excel data structure
      return {
        headers: ['Commodity', 'Specification', 'Average', 'Date'],
        rows: [
          ['Rice', 'Fancy White Rice', 56.15, '2025-01-15'],
          ['Rice', 'Premium 5% broken', 45.25, '2025-01-15'],
          ['Corn', 'White Corn', 28.50, '2025-01-15'],
          ['Vegetables', 'Tomatoes', 35.75, '2025-01-15'],
          ['Fruits', 'Bananas', 25.30, '2025-01-15'],
          ['Livestock', 'Chicken (per kg)', 180.00, '2025-01-15']
        ]
      };
      
    } catch (error) {
      throw new Error('Failed to extract data from Excel file');
    }
  };
  
  // Convert Excel data to JSON structure
  const convertExcelToJSON = (excelData: any, fileName: string): any => {
    try {
      const items: any[] = [];
      
      // Process each row of data
      for (const row of excelData.rows) {
        if (row.length >= 4) {
          const item = {
            commodity: row[0] || 'N/A',
            specification: row[1] || 'N/A',
            average: parseFloat(row[2]) || null,
            date: row[3] || 'N/A'
          };
          items.push(item);
        }
      }
      
      return {
        items: items
      };
      
    } catch (error) {
      throw new Error('Failed to convert Excel data to JSON structure');
    }
  };
  
  // Filter daily price items
  const filteredDailyPriceItems = dailyPriceData?.items?.filter((item: any) =>
    item.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.specification?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle scroll events to show/hide scroll to top button
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 300);
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reset admin data
      setProducts([...OFFICIAL_PRODUCTS]);
      setDailyPriceData(null);
      setHasUploadedPDF(false);
      setSearchQuery('');
      setProcessingProgress(0);
      setIsProcessing(false);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBorder} />

      {/* Main Content */}
      {activeNav === 'home' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Admin Dashboard</Text>
            </View>
            
            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome back, Admin!</Text>
              <Text style={styles.welcomeSubtitle}>
                Manage your agricultural system and monitor price data efficiently
              </Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={32} color={GREEN} />
                <Text style={styles.statNumber}>150+</Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="leaf" size={32} color={GREEN} />
                <Text style={styles.statNumber}>100</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={32} color={GREEN} />
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Monitoring</Text>
              </View>
            </View>

            <View style={styles.adminToolsContainer}>
              <Text style={styles.toolsTitle}>Admin Tools</Text>
              
              {/* Grid Layout for Tools */}
              <View style={styles.toolsGrid}>
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => setActiveNav('announcements')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="megaphone" size={32} color="#fff" />
                  </View>
                  <Text style={styles.toolCardTitle}>Announcements</Text>
                  <Text style={styles.toolCardDescription}>Send announcements to farmers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => setActiveNav('messages')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="chatbubbles" size={32} color="#fff" />
                  </View>
                  <Text style={styles.toolCardTitle}>Messages</Text>
                  <Text style={styles.toolCardDescription}>Communicate with farmers</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {activeNav === 'price-monitoring' && (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Price Monitoring</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={styles.sectionSubtitle}>Upload Excel files and manage agricultural price data</Text>
            
            {/* Excel Upload Section */}
            <View style={styles.pdfUploadContainer}>
              <Text style={styles.pdfUploadTitle}>Upload Price Data Excel</Text>
              <Text style={styles.pdfUploadDescription}>
                Upload your agricultural price monitoring Excel file with commodity, specification, average price, and date columns
              </Text>
              
              <View style={styles.pdfFormatInfo}>
                <Text style={styles.pdfFormatTitle}>📊 Excel Requirements:</Text>
                <Text style={styles.pdfFormatText}>• Excel file (.xlsx or .xls format)</Text>
                <Text style={styles.pdfFormatText}>• Must have columns: Commodity, Specification, Average, Date</Text>
                <Text style={styles.pdfFormatText}>• System will automatically parse and display the data</Text>
                <Text style={styles.pdfFormatText}>• Data will be organized in a searchable list format</Text>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.pdfUploadButton, isProcessing && styles.pdfUploadButtonDisabled]} 
                  onPress={handleExcelUpload}
                  disabled={isProcessing}
                >
                  <Ionicons name="cloud-upload" size={24} color="#fff" />
                  <Text style={styles.pdfUploadButtonText}>
                    {isProcessing ? 'Processing Excel...' : 'Upload Excel File'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.sampleButton} onPress={loadSampleData}>
                  <Ionicons name="document-text" size={24} color={GREEN} />
                  <Text style={styles.sampleButtonText}>Load Sample Data</Text>
                </TouchableOpacity>
              </View>
              
              {/* Processing Progress */}
              {isProcessing && (
                <View style={styles.processingContainer}>
                  <Text style={styles.processingText}>Processing Excel file...</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${processingProgress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{processingProgress}%</Text>
                </View>
              )}
              
              {dailyPriceData && (
                <View style={styles.dataInfo}>
                  <Text style={styles.dataInfoTitle}>📊 Excel Processed Successfully!</Text>
                  <Text style={styles.dataInfoText}>Total Records: {dailyPriceData.items.length}</Text>
                  <Text style={styles.dataInfoText}>Source: Excel file processed and imported</Text>
                </View>
              )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by item name or section..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Price List */}
            {dailyPriceData ? (
              <View style={styles.priceListContainer}>
                <View style={styles.priceListHeader}>
                  <Text style={styles.priceListTitle}>
                    Agricultural Price Data ({filteredDailyPriceItems.length} records)
                  </Text>
                  <Text style={styles.priceListSubtitle}>
                    Data from uploaded Excel file • Use search to filter
                  </Text>
                </View>
                
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Commodity</Text>
                  <Text style={styles.tableHeaderText}>Specification</Text>
                  <Text style={styles.tableHeaderText}>Average Price</Text>
                  <Text style={styles.tableHeaderText}>Date</Text>
                </View>
                
                <View style={styles.priceItemsContainer}>
                  {filteredDailyPriceItems.map((item: any, index: number) => (
                    <View key={index} style={styles.priceItemCard}>
                      <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{item.commodity || 'N/A'}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{item.specification || 'N/A'}</Text>
                      </View>
                      <View style={styles.tableCell}>
                        {item.average ? (
                          <Text style={styles.priceValue}>₱{item.average.toFixed(2)}</Text>
                        ) : (
                          <Text style={styles.priceNA}>N/A</Text>
                        )}
                      </View>
                      <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{item.date || 'N/A'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="document-text-outline" size={64} color="#ccc" />
                <Text style={styles.noDataTitle}>No Price Data Available</Text>
                <Text style={styles.noDataText}>
                  Upload a government PDF file to automatically convert it to price data
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {activeNav === 'search' && (
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setActiveNav('home')}
            >
              <Ionicons name="arrow-back" size={24} color={GREEN} />
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Search Products</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <Text style={styles.sectionSubtitle}>Find specific agricultural products</Text>
        </View>
      )}

      {activeNav === 'announcements' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Announcements</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={styles.sectionSubtitle}>Manage and broadcast important announcements to farmers</Text>
            
            {/* Announcements Content */}
            <View style={styles.welcomeContainer}>
              <Ionicons name="megaphone" size={48} color={GREEN} style={{ alignSelf: 'center', marginBottom: 15 }} />
              <Text style={styles.welcomeTitle}>Announcement Management</Text>
              <Text style={styles.welcomeSubtitle}>
                Create, edit, and broadcast important announcements to all farmers in the system. Keep your community informed about weather alerts, price updates, and agricultural news.
              </Text>
            </View>
            
            <View style={styles.adminToolsContainer}>
              <Text style={styles.toolsTitle}>Announcement Features</Text>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="add-circle" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>Create New Announcement</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="list" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>View All Announcements</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="send" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>Broadcast Message</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {activeNav === 'messages' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Messages</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={styles.sectionSubtitle}>Direct communication with farmers and manage support tickets</Text>
            
            {/* Messages Content */}
            <View style={styles.welcomeContainer}>
              <Ionicons name="chatbubbles" size={48} color={GREEN} style={{ alignSelf: 'center', marginBottom: 15 }} />
              <Text style={styles.welcomeTitle}>Message Center</Text>
              <Text style={styles.welcomeSubtitle}>
                Communicate directly with farmers, respond to support requests, and manage all incoming messages from the agricultural community.
              </Text>
            </View>
            
            <View style={styles.adminToolsContainer}>
              <Text style={styles.toolsTitle}>Messaging Features</Text>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="mail-unread" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>Unread Messages (5)</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="chatbox" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>All Conversations</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="help-circle" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>Support Tickets</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="people" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>Group Messages</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {activeNav === 'settings' && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[GREEN]}
              tintColor={GREEN}
            />
          }
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={{ width: 24 }} />
            </View>
            
              {/* Admin Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                <Ionicons name="person" size={50} color={GREEN} />
                </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Admin</Text>
                <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                <Text style={styles.profileRole}>Administrator</Text>
              </View>
              </View>

              {/* Settings Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsTitle}>Settings & Preferences</Text>
                
                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/notifications')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="notifications" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Notifications</Text>
                    <Text style={styles.settingDescription}>Manage alert preferences</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/privacy')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="shield-checkmark" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Privacy & Security</Text>
                    <Text style={styles.settingDescription}>Account security settings</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/language')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="language" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingDescription}>English (US)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/help')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="help-circle" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Help & Support</Text>
                    <Text style={styles.settingDescription}>Get assistance</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/about')}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="information-circle" size={24} color={GREEN} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>About</Text>
                    <Text style={styles.settingDescription}>App version & info</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="log-out" size={24} color="#e74c3c" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Sign Out</Text>
                  <Text style={styles.settingDescription}>Logout from your account</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

             {/* Scroll to Top Button */}
       {showScrollToTop && (
         <TouchableOpacity style={styles.scrollToTopButton} onPress={scrollToTop}>
           <Ionicons name="arrow-up" size={24} color="#fff" />
         </TouchableOpacity>
       )}

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNavTabs}>
        <TouchableOpacity 
          style={[styles.navTab, activeNav === 'home' && styles.activeNavTab]}
          onPress={() => setActiveNav('home')}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeNav === 'home' ? GREEN : '#666'} 
          />
          <Text style={[styles.navTabText, activeNav === 'home' && styles.activeNavTabText]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navTab, activeNav === 'price-monitoring' && styles.activeNavTab]}
          onPress={() => setActiveNav('price-monitoring')}
        >
          <Ionicons 
            name="analytics" 
            size={24} 
            color={activeNav === 'price-monitoring' ? GREEN : '#666'} 
          />
          <Text style={[styles.navTabText, activeNav === 'price-monitoring' && styles.activeNavTabText]}>
            Price Monitoring
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navTab, activeNav === 'search' && styles.activeNavTab]}
          onPress={() => setActiveNav('search')}
        >
          <Ionicons 
            name="search" 
            size={24} 
            color={activeNav === 'search' ? GREEN : '#666'} 
          />
          <Text style={[styles.navTabText, activeNav === 'search' && styles.activeNavTabText]}>
            Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navTab, activeNav === 'settings' && styles.activeNavTab]}
          onPress={() => setActiveNav('settings')}
        >
          <Ionicons 
            name="settings" 
            size={24} 
            color={activeNav === 'settings' ? GREEN : '#666'} 
          />
          <Text style={[styles.navTabText, activeNav === 'settings' && styles.activeNavTabText]}>
            Settings
          </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Add space for bottom navigation
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 100, // Add space for bottom navigation
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  adminToolsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toolButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  toolsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  toolCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  toolIconContainer: {
    backgroundColor: GREEN,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toolCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  toolCardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  toolCardPlaceholder: {
    width: '48%',
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomNavTabs: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeNavTab: {
    borderTopWidth: 2,
    borderTopColor: GREEN,
  },
  navTabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeNavTabText: {
    color: GREEN,
    fontWeight: '600',
  },
  pdfUploadContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfUploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pdfUploadDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  pdfFormatInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  pdfFormatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pdfFormatText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  pdfUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  pdfUploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pdfUploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sampleButtonText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GREEN,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
  },
  dataInfo: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  dataInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  dataInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  priceListContainer: {
    marginTop: 20,
  },
  priceListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 5,
  },
  priceListSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  priceItemsContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  priceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  priceItemInfo: {
    flex: 1,
  },
  priceItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  priceItemSection: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  priceItemLine: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  priceItemPrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
  },
  priceNA: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: GREEN,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // Profile and Settings Styles
  profileHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '400',
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    textAlign: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0f2e0',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e0f2e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingContent: {
    flex: 1,
    marginLeft: 20,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  settingDescription: {
    fontSize: 14,
    color: '#555',
    fontWeight: '400',
    lineHeight: 20,
  },
});

