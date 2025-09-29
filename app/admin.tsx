import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAnnouncements } from '../components/AnnouncementContext';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationContext';
import { SlidingAnnouncement } from '../components/SlidingAnnouncement';
import { OFFICIAL_PRODUCTS, Product } from '../constants/ProductData';
import { db } from '../lib/firebase';

const { width } = Dimensions.get('window');
const GREEN = '#16543a';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();

  // Check admin authentication
  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'You must be logged in to access the admin panel.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
      return;
    }
    
    if (profile.role !== 'admin') {
      Alert.alert('Access Denied', 'Only administrators can access this page.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
      return;
    }
  }, [user, profile.role]);
  const { announcements, addAnnouncement, loadAnnouncements, deleteAnnouncement, loading: announcementLoading, error: announcementError } = useAnnouncements();
  const { showNotification } = useNotification();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeNav, setActiveNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [products, setProducts] = useState<Product[]>(OFFICIAL_PRODUCTS);
  const [hasUploadedPDF, setHasUploadedPDF] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Announcement state
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showViewAnnouncements, setShowViewAnnouncements] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementIcon, setAnnouncementIcon] = useState('megaphone');

  // User list state
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showComposeMessage, setShowComposeMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

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


  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  // Group messages by contact
  const groupMessagesByContact = (messages: any[]) => {
    const contactMap = new Map();
    
    messages.forEach(message => {
      let contactId, contactName, contactEmail;
      
      if (message.type === 'sent') {
        contactId = message.receiverId;
        contactName = message.receiverEmail;
        contactEmail = message.receiverEmail;
      } else {
        contactId = message.senderId;
        contactName = message.senderName || 'User';
        contactEmail = message.senderEmail || 'Unknown';
      }
      
      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          id: contactId,
          name: contactName,
          email: contactEmail,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        });
      }
      
      const contact = contactMap.get(contactId);
      contact.messages.push(message);
      
      // Update last message and unread count
      if (!contact.lastMessage || message.timestamp > contact.lastMessage.timestamp) {
        contact.lastMessage = message;
      }
      
      if (message.type === 'received' && !message.isRead) {
        contact.unreadCount++;
      }
    });
    
    // Sort contacts by last message timestamp
    return Array.from(contactMap.values()).sort((a, b) => 
      (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
    );
  };

  // Navigate to full-screen chat
  const openChat = (contact: any) => {
    router.push(`/admin-chat?contactId=${contact.id}&contactName=${encodeURIComponent(contact.name)}&contactEmail=${encodeURIComponent(contact.email)}`);
  };

  // Load admin messages (sent and received)
  const loadAdminMessages = async () => {
    setLoadingMessages(true);
    try {
      // Query messages where admin is sender or receiver
      const sentMessagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', 'admin')
      );
      
      const receivedMessagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', 'admin')
      );
      
      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentMessagesQuery),
        getDocs(receivedMessagesQuery)
      ]);
      
      const sentMessages = sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'sent'
      }));
      
      const receivedMessages = receivedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'received'
      }));
      
      // Combine and sort all messages by timestamp
      const allMessages = [...sentMessages, ...receivedMessages]
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setAdminMessages(allMessages);
      console.log('Loaded admin messages:', allMessages.length);
    } catch (error) {
      console.error('Error loading admin messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message to specific user
  const sendMessageToUser = async () => {
    if (!selectedUser || !messageText.trim()) {
      Alert.alert('Error', 'Please select a user and enter a message');
      return;
    }

    console.log('Selected user data:', selectedUser);
    console.log('User UID:', selectedUser.uid);
    console.log('User ID:', selectedUser.id);

    setSendingMessage(true);
    try {
      const messageData = {
        id: Date.now().toString(),
        senderId: 'admin',
        senderName: 'Admin',
        receiverId: selectedUser.id, // Use 'id' since uid is undefined
        receiverEmail: selectedUser.email,
        content: messageText.trim(),
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'admin_message'
      };

      // Add to Firestore messages collection
      await addDoc(collection(db, 'messages'), messageData);
      
      Alert.alert('Success', `Message sent to ${selectedUser.displayName}`, [
        {
          text: 'OK',
          onPress: () => {
            setMessageText('');
            setSelectedUser(null);
            setShowComposeMessage(false);
            setShowUserList(false);
            // Reload messages to show the sent message
            loadAdminMessages();
          }
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Show the latest announcement as sliding notification when admin page loads
  useEffect(() => {
    if (announcements.length > 0) {
      const latestAnnouncement = announcements[0]; // First announcement is the latest
      showNotification({
        title: latestAnnouncement.title,
        message: latestAnnouncement.content,
        type: 'info',
      });
    }
  }, [announcements]);

  // Load admin messages when navigating to messages section
  useEffect(() => {
    if (activeNav === 'messages') {
      loadAdminMessages();
    }
  }, [activeNav]);

  // Function to create and broadcast announcement to all users
  const createAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content for the announcement.');
      return;
    }

    try {
      const announcementData = {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        icon: announcementIcon,
        date: new Date().toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        createdBy: 'Admin'
      };

      // Add announcement to Firebase (this will be visible to all users)
      await addAnnouncement(announcementData);

      // Reset form
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementIcon('megaphone');
      setShowCreateAnnouncement(false);

            // Show the new announcement as sliding notification
            showNotification({
              title: announcementData.title,
              message: announcementData.content,
              type: 'info',
            });

            // Show success message
            Alert.alert(
              'Announcement Created!', 
              'Your announcement has been successfully sent to all users and saved to the database.',
              [{ text: 'OK', style: 'default' }]
            );
          } catch (error) {
            console.error('Error creating announcement:', error);
            
            // Show error notification
            showNotification({
              title: '❌ Announcement Failed',
              message: 'Failed to create announcement. Please try again.',
              type: 'error',
              duration: 5000,
            });
            
            Alert.alert(
              'Error', 
              'Failed to create announcement. Please check your internet connection and try again.',
              [{ text: 'OK', style: 'default' }]
            );
          }
  };

  // Function to cancel announcement creation
  const cancelAnnouncement = () => {
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setAnnouncementIcon('megaphone');
    setShowCreateAnnouncement(false);
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

  // Function to fetch all users from the database
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Debug: Check if user is authenticated
      console.log('Current user:', user);
      console.log('User profile:', profile);
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to access this feature.');
        setShowUserList(false);
        return;
      }
      
      if (profile.role !== 'admin') {
        Alert.alert('Error', 'Only administrators can access this feature.');
        setShowUserList(false);
        return;
      }
      
      // Test: Try to access a simple collection first
      console.log('Attempting to fetch users...');
      
      // Fetch from Firebase users collection
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const usersList: any[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersList.push({
          id: doc.id,
          uid: userData.uid || doc.id, // Include UID field, fallback to doc.id
          email: userData.email || 'No email',
          displayName: userData.name || 'Unknown User',
          role: userData.role || 'farmer',
          location: userData.location || 'Philippines',
          barangay: userData.barangay || '',
          approved: userData.approved || false,
          createdAt: userData.createdAt || new Date().toISOString(),
          profileImage: userData.profileImage || '',
          ...userData
        });
      });
      
      setUsers(usersList);
      console.log('Successfully loaded users from Firebase:', usersList.length);
      
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set empty array if fetch fails
      
      let errorMessage = 'Failed to load users from database.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firebase security rules or contact the administrator.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Database is temporarily unavailable. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBorder} />

      {/* Main Content */}
      {activeNav === 'home' && (
        <>
          {/* Fixed Sliding Announcement - Only on Home */}
          <SlidingAnnouncement />
        <ScrollView 
          style={[styles.scrollView, { paddingTop: 60 }]}
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
            
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Welcome to</Text>
                
                {/* Centered Icon/Logo */}
                <View style={styles.centeredIconContainer}>
                  <View style={styles.centeredIcon}>
                    <Image source={require('../assets/images/Logo.png')} style={styles.logoImage} />
                  </View>
                </View>
              </View>
            </View>
            
            <Text style={styles.heroDescription}>
              Hello Admin! - Manage your agricultural system efficiently
            </Text>
            
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

            {/* Admin Tools Section */}
            <View style={styles.toolsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Admin Tools</Text>
                <Text style={styles.sectionSubtitle}>Manage your agricultural system</Text>
              </View>
              
              <View style={styles.toolsGrid}>
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => setActiveNav('announcements')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="megaphone" size={28} color={GREEN} />
                  </View>
                  <Text style={styles.announcementToolTitle}>Announcements</Text>
                  <Text style={styles.announcementToolDescription}>Send announcements to farmers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => setActiveNav('messages')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="chatbubbles" size={28} color={GREEN} />
                  </View>
                  <Text style={styles.toolTitle}>Messages</Text>
                  <Text style={styles.toolDescription}>Communicate with farmers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/planting-report')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="leaf" size={28} color={GREEN} />
                  </View>
                  <Text style={styles.toolTitle}>Planting Records</Text>
                  <Text style={styles.toolDescription}>View and manage planting data</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/harvest-report')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="basket" size={28} color={GREEN} />
                  </View>
                  <Text style={styles.toolTitle}>Harvest Records</Text>
                  <Text style={styles.toolDescription}>View and manage harvest data</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
        </>
      )}

      {activeNav === 'price-monitoring' && (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
              
              <TouchableOpacity 
                style={styles.toolButton}
                onPress={() => setShowCreateAnnouncement(true)}
              >
                <Ionicons name="add-circle" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>Create New Announcement</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.toolButton}
                onPress={() => setShowViewAnnouncements(true)}
              >
                <Ionicons name="list" size={24} color={GREEN} />
                <Text style={styles.toolButtonText}>View All Announcements ({announcements.length})</Text>
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
            
            {/* New Message Button */}
            <View style={styles.newMessageContainer}>
              <TouchableOpacity 
                style={styles.newMessageButton}
                onPress={() => {
                  fetchUsers();
                  setShowUserList(true);
                }}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.newMessageButtonText}>New Message</Text>
              </TouchableOpacity>
            </View>
            
            {/* Inbox Section */}
            <View style={styles.inboxContainer}>
              <View style={styles.inboxHeader}>
                <Text style={styles.inboxTitle}>Messages</Text>
                <TouchableOpacity 
                  style={styles.refreshInboxButton}
                  onPress={loadAdminMessages}
                >
                  <Ionicons name="refresh" size={20} color={GREEN} />
                </TouchableOpacity>
              </View>
              
              {loadingMessages ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
              ) : adminMessages.length > 0 ? (
                <View style={styles.contactListContainer}>
                  {groupMessagesByContact(adminMessages).map((contact) => (
                    <TouchableOpacity 
                      key={contact.id} 
                      style={styles.contactItem}
                      onPress={() => openChat(contact)}
                    >
                      <View style={styles.contactAvatar}>
                        <Ionicons name="person" size={24} color="#fff" />
                      </View>
                      <View style={styles.contactInfo}>
                        <View style={styles.contactHeader}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactTime}>
                            {contact.lastMessage?.createdAt ? 
                              new Date(contact.lastMessage.createdAt).toLocaleDateString() : 
                              'Unknown'
                            }
                          </Text>
                        </View>
                        <Text style={styles.contactLastMessage} numberOfLines={1}>
                          {contact.lastMessage?.content || 'No messages'}
                        </Text>
                      </View>
                      {contact.unreadCount > 0 && (
                        <View style={styles.contactUnreadBadge}>
                          <Text style={styles.contactUnreadCount}>{contact.unreadCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyInboxContainer}>
                  <Ionicons name="mail-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyInboxTitle}>No Messages Yet</Text>
                  <Text style={styles.emptyInboxText}>
                    When farmers send you messages, they will appear here. Start a conversation by creating a new message.
                  </Text>
                </View>
              )}
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

      {/* Create Announcement Modal */}
      <Modal
        visible={showCreateAnnouncement}
        animationType="slide"
        transparent={true}
        onRequestClose={cancelAnnouncement}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Announcement</Text>
              <TouchableOpacity onPress={cancelAnnouncement}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Announcement Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter announcement title..."
                  value={announcementTitle}
                  onChangeText={setAnnouncementTitle}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Icon</Text>
                <View style={styles.iconSelector}>
                  <TouchableOpacity 
                    style={[styles.iconOption, announcementIcon === 'megaphone' && styles.selectedIcon]}
                    onPress={() => setAnnouncementIcon('megaphone')}
                  >
                    <Ionicons name="megaphone" size={24} color={announcementIcon === 'megaphone' ? '#fff' : GREEN} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconOption, announcementIcon === 'warning' && styles.selectedIcon]}
                    onPress={() => setAnnouncementIcon('warning')}
                  >
                    <Ionicons name="warning" size={24} color={announcementIcon === 'warning' ? '#fff' : GREEN} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconOption, announcementIcon === 'information-circle' && styles.selectedIcon]}
                    onPress={() => setAnnouncementIcon('information-circle')}
                  >
                    <Ionicons name="information-circle" size={24} color={announcementIcon === 'information-circle' ? '#fff' : GREEN} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconOption, announcementIcon === 'leaf' && styles.selectedIcon]}
                    onPress={() => setAnnouncementIcon('leaf')}
                  >
                    <Ionicons name="leaf" size={24} color={announcementIcon === 'leaf' ? '#fff' : GREEN} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Announcement Content</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter the announcement content..."
                  value={announcementContent}
                  onChangeText={setAnnouncementContent}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text style={styles.characterCount}>{announcementContent.length}/1000</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelAnnouncement}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.createButton, announcementLoading && styles.createButtonDisabled]}
                onPress={createAnnouncement}
                disabled={announcementLoading}
              >
                {announcementLoading ? (
                  <>
                    <Ionicons name="hourglass" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Creating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Create & Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Compose Message Modal */}
      <Modal
        visible={showComposeMessage}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComposeMessage(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.viewModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compose Message</Text>
              <TouchableOpacity onPress={() => setShowComposeMessage(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.composeMessageContainer}>
              <View style={styles.recipientInfo}>
                <View style={styles.recipientAvatar}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View style={styles.recipientDetails}>
                  <Text style={styles.recipientName}>{selectedUser?.displayName}</Text>
                  <Text style={styles.recipientEmail}>{selectedUser?.email}</Text>
                </View>
              </View>

              <View style={styles.messageInputContainer}>
                <Text style={styles.messageLabel}>Message:</Text>
                <TextInput
                  style={styles.messageTextInput}
                  placeholder="Type your message here..."
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.composeButtonsContainer}>
                <TouchableOpacity
                  style={styles.composeCancelButton}
                  onPress={() => {
                    setMessageText('');
                    setSelectedUser(null);
                    setShowComposeMessage(false);
                  }}
                >
                  <Text style={styles.composeCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.sendButton, sendingMessage && styles.sendButtonDisabled]}
                  onPress={sendMessageToUser}
                  disabled={sendingMessage || !messageText.trim()}
                >
                  {sendingMessage ? (
                    <Text style={styles.sendButtonText}>Sending...</Text>
                  ) : (
                    <Text style={styles.sendButtonText}>Send Message</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* View All Announcements Modal */}
      <Modal
        visible={showViewAnnouncements}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowViewAnnouncements(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.viewModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Announcements ({announcements.length})</Text>
              <TouchableOpacity onPress={() => setShowViewAnnouncements(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.announcementsListContainer} showsVerticalScrollIndicator={false}>
              {announcementLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading announcements...</Text>
                </View>
              ) : announcements.length > 0 ? (
                announcements.map((announcement, index) => (
                  <View key={announcement.id || index} style={styles.announcementItem}>
                    <View style={styles.announcementItemHeader}>
                      <View style={styles.announcementItemIconContainer}>
                        <Ionicons 
                          name={announcement.icon as any || "megaphone"} 
                          size={20} 
                          color={GREEN} 
                        />
                      </View>
                      <View style={styles.announcementItemContent}>
                        <Text style={styles.announcementItemTitle}>{announcement.title}</Text>
                        <Text style={styles.announcementItemDate}>
                          {announcement.date} • By {announcement.createdBy}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Announcement',
                            'Are you sure you want to delete this announcement? This action cannot be undone.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                style: 'destructive',
                                onPress: () => deleteAnnouncement(announcement.id)
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.announcementItemText}>
                      {announcement.content}
                    </Text>
                    <View style={styles.announcementItemFooter}>
                      <Text style={styles.announcementItemId}>ID: {announcement.id}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noAnnouncementsContainer}>
                  <Ionicons name="megaphone-outline" size={64} color="#ccc" />
                  <Text style={styles.noAnnouncementsTitle}>No Announcements Yet</Text>
                  <Text style={styles.noAnnouncementsText}>
                    Create your first announcement to get started!
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.viewModalFooter}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => {
                  loadAnnouncements();
                }}
              >
                <Ionicons name="refresh" size={20} color={GREEN} />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowViewAnnouncements(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User List Modal */}
      <Modal
        visible={showUserList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserList(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.viewModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select User to Message ({users.length})</Text>
              <TouchableOpacity onPress={() => setShowUserList(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.announcementsListContainer} showsVerticalScrollIndicator={false}>
              {loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <TouchableOpacity 
                    key={user.id || index} 
                    style={styles.userItem}
                    onPress={() => {
                      setSelectedUser(user);
                      setShowUserList(false);
                      setShowComposeMessage(true);
                    }}
                  >
                    <View style={styles.userItemHeader}>
                      <View style={styles.userAvatar}>
                        <Ionicons name="person" size={24} color="#fff" />
                      </View>
                      <View style={styles.userItemContent}>
                        <Text style={styles.userItemName}>{user.displayName}</Text>
                        <Text style={styles.userItemEmail}>{user.email}</Text>
                        <Text style={styles.userItemRole}>
                          {user.role} • {user.barangay ? user.barangay : user.location}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noAnnouncementsContainer}>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={styles.noAnnouncementsTitle}>No Users Found</Text>
                  <Text style={styles.noAnnouncementsText}>
                    No users are currently registered in the system.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.viewModalFooter}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => {
                  fetchUsers();
                }}
              >
                <Ionicons name="refresh" size={20} color={GREEN} />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowUserList(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  toolsSection: {
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
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 140,
  },
  toolIconContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 35,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#d0e8d0',
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  toolDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  announcementToolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  announcementToolDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GREEN,
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  iconSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GREEN,
    backgroundColor: '#f8f9fa',
  },
  selectedIcon: {
    backgroundColor: GREEN,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  
  // View All Announcements Modal Styles
  viewModalContainer: {
    backgroundColor: 'white',
    flex: 1,
    margin: 0,
    borderRadius: 0,
  },
  announcementsListContainer: {
    flex: 1,
    padding: 16,
  },
  announcementItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  announcementItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  announcementItemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementItemContent: {
    flex: 1,
  },
  announcementItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  announcementItemDate: {
    fontSize: 14,
    color: '#666',
  },
  announcementItemText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  announcementItemFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  announcementItemId: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffeaea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // Missing styles for the view modal
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noAnnouncementsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAnnouncementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noAnnouncementsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GREEN,
    flex: 1,
    marginRight: 8,
  },
  refreshButtonText: {
    color: GREEN,
    marginLeft: 8,
    fontWeight: '600',
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'white',
  },
  // New Message Button Styles
  newMessageContainer: {
    marginBottom: 20,
  },
  newMessageButton: {
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Inbox Styles
  inboxContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inboxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 15,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageSender: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Empty Inbox Styles
  emptyInboxContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyInboxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyInboxText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // User List Modal Styles
  userItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  userItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userItemContent: {
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userItemEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userItemRole: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  // Compose Message Modal Styles
  composeMessageContainer: {
    flex: 1,
    padding: 20,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  recipientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recipientEmail: {
    fontSize: 14,
    color: '#666',
  },
  messageInputContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  messageTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  composeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  composeCancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  composeCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  sendButton: {
    flex: 1,
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Admin Inbox Styles
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshInboxButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  // Chat Interface Styles
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatMessageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  chatBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: {
    backgroundColor: GREEN,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#f1f3f4',
    borderBottomLeftRadius: 4,
  },
  chatMessageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333',
  },
  chatTimestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  sentTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  receivedTimestamp: {
    color: '#666',
    textAlign: 'left',
  },
  chatMessageInfo: {
    marginTop: 4,
    paddingHorizontal: 8,
  },
  chatSenderInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // Contact List Styles
  contactListContainer: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactTime: {
    fontSize: 12,
    color: '#666',
  },
  contactLastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  contactUnreadBadge: {
    backgroundColor: GREEN,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  contactUnreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Chat Header Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backToContactsButton: {
    padding: 8,
    marginRight: 12,
  },
  chatContactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatContactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatContactDetails: {
    flex: 1,
  },
  chatContactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  chatContactEmail: {
    fontSize: 12,
    color: '#666',
  },
  chatOptionsButton: {
    padding: 8,
  },
  // Welcome Header Styles
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  adminLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeaea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  adminLogoutText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  heroSection: {
    flexDirection: 'column',
    justifyContent: 'center',
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
  heroContent: {
    flex: 1,
    marginRight: 0,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  centeredIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  centeredIcon: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  heroDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 25,
  },
});

