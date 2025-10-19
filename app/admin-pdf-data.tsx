import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../components/AuthContext';
import { SlidingAnnouncement } from '../components/SlidingAnnouncement';
import { ForecastingCalendar } from '../components/ForecastingCalendar';
import { useNavigationBar } from '../hooks/useNavigationBar';

const { width } = Dimensions.get('window');

interface PDFDataItem {
  id: string;
  commodity: string;
  specification: string;
  price: number;
  unit: string;
  region: string;
  date: string;
}

export default function AdminPDFDataScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [pdfData, setPdfData] = useState<PDFDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PDFDataItem | null>(null);
  
  // Forecasting calendar states
  const [forecastModalVisible, setForecastModalVisible] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<{
    name: string;
    specification: string;
    price: number;
    unit: string;
  } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    commodity: '',
    specification: '',
    price: '',
    unit: 'kg',
    region: 'NCR',
    date: new Date().toISOString().split('T')[0]
  });

  useNavigationBar();

  useEffect(() => {
    loadPDFData();
  }, []);

  const loadPDFData = async () => {
    setLoading(true);
    try {
      // Try to load from extracted JSON file first (automated data)
      let allPDFData: PDFDataItem[] = [];
      
      try {
        // This would be the automated extracted data
        const extractedData = require('../data/extracted_pdf_data.json');
        allPDFData = extractedData.map((item: any, index: number) => ({
          id: (index + 1).toString(),
          commodity: item.commodity || 'Unknown',
          specification: item.specification || 'Not specified',
          price: item.price || 0,
          unit: item.unit || 'kg',
          region: item.region || 'NCR',
          date: item.date || '2025-10-18'
        }));
        console.log(`✅ Loaded ${allPDFData.length} commodities from automated extraction`);
      } catch (error) {
        console.log('⚠️ No automated data found, using fallback data');
        // Fallback to hardcoded data if automated extraction not available
        allPDFData = [
        // Rice products
        { id: '1', commodity: 'Special Rice', specification: 'White Rice', price: 56.89, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '2', commodity: 'Premium', specification: '5% broken', price: 47.35, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '3', commodity: 'Well Milled', specification: '1-19% bran streak', price: 42.75, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '4', commodity: 'Regular Milled', specification: '20-40% bran streak', price: 39.12, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '5', commodity: 'Special Rice', specification: 'White Rice', price: 57.2, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '6', commodity: 'Premium', specification: '5% broken', price: 49.7, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '7', commodity: 'Well Milled', specification: '1-19% bran streak', price: 43.44, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '8', commodity: 'Regular Milled', specification: '20-40% bran streak', price: 37.55, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Corn products
        { id: '9', commodity: 'Corn (White)', specification: 'Cob, Glutinous', price: 91.25, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '10', commodity: 'Corn (Yellow)', specification: 'Cob, Sweet Corn', price: 77.69, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '11', commodity: 'Corn Grits (White, Food Grade)', specification: 'Not specified', price: 120.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '12', commodity: 'Corn Grits (Yellow, Food Grade)', specification: 'Not specified', price: 95.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '13', commodity: 'Corn Cracked (Yellow, Feed Grade)', specification: 'Not specified', price: 50.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '14', commodity: 'Corn Grits (Feed Grade)', specification: 'Not specified', price: 47.5, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Fish products
        { id: '15', commodity: 'Alumahan (Indian Mackerel)', specification: 'Medium (4-6 pcs/kg)', price: 348.42, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '16', commodity: 'Bangus, Large', specification: 'Large (1-2 pcs)', price: 280.05, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '17', commodity: 'Bangus, Medium', specification: 'Medium (3-4 pcs/kg)', price: 241.7, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '18', commodity: 'Galunggong, Local', specification: 'Male, Medium (12-14 pcs/kg)', price: 338.59, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '19', commodity: 'Pampano, Local', specification: 'Not specified', price: 456.67, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '20', commodity: 'Pampano, Imported', specification: 'Not specified', price: 406.94, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '21', commodity: 'Salmon Belly, Imported', specification: 'Not specified', price: 418.52, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '22', commodity: 'Salmon Head, Imported', specification: 'Not specified', price: 227.27, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '23', commodity: 'Sardines (Tamban)', specification: 'Not specified', price: 119.47, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '24', commodity: 'Squid (Pusit Bisaya), Local', specification: 'Medium', price: 447.07, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '25', commodity: 'Squid, Imported', specification: 'Not specified', price: 210.67, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '26', commodity: 'Tambakol (Yellow-Fin Tuna), Local', specification: 'Medium, Fresh or Chilled', price: 271.54, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '27', commodity: 'Tambakol (Yellow-Fin Tuna), Imported', specification: 'Medium, Frozen', price: 300.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '28', commodity: 'Tilapia', specification: 'Medium (5-6 pcs/kg)', price: 153.03, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Beef products
        { id: '29', commodity: 'Beef Brisket, Local', specification: 'Meat with Bones', price: 414.23, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '30', commodity: 'Beef Brisket, Imported', specification: 'Not specified', price: 370.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '31', commodity: 'Beef Chuck, Local', specification: 'Not specified', price: 399.7, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '32', commodity: 'Beef Forequarter, Local', specification: 'Not specified', price: 480.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '33', commodity: 'Beef Fore Limb, Local', specification: 'Not specified', price: 457.86, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '34', commodity: 'Beef Flank, Local', specification: 'Not specified', price: 425.88, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '35', commodity: 'Beef Flank, Imported', specification: 'Not specified', price: 376.67, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '36', commodity: 'Beef Loin, Local', specification: 'Not specified', price: 476.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '37', commodity: 'Beef Plate, Local', specification: 'Not specified', price: 398.46, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '38', commodity: 'Beef Rib Eye, Local', specification: 'Not specified', price: 433.85, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '39', commodity: 'Beef Rib Set, Local', specification: 'Not specified', price: 411.48, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '40', commodity: 'Beef Rump, Local', specification: 'Lean Meat/ Tapadera', price: 474.94, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '41', commodity: 'Beef Short Ribs, Local', specification: 'Not specified', price: 418.95, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '42', commodity: 'Beef Sirloin, Local', specification: 'Not specified', price: 470.38, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '43', commodity: 'Beef Striploin, Local', specification: 'Not specified', price: 472.4, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '44', commodity: 'Beef Tenderloin, Local', specification: 'Not specified', price: 655.6, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '45', commodity: 'Beef Tenderloin, Imported', specification: 'Not specified', price: 660.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '46', commodity: 'Beef Tongue, Local', specification: 'Not specified', price: 482.5, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Pork products
        { id: '47', commodity: 'Pork Belly (Liempo), Local', specification: 'Not specified', price: 404.36, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '48', commodity: 'Pork Belly (Liempo), Imported', specification: 'Not specified', price: 318.24, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '49', commodity: 'Pork Boston Shoulder, Local', specification: 'Not specified', price: 358.25, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '50', commodity: 'Pork Chop, Local', specification: 'Not specified', price: 352.5, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '51', commodity: 'Pork Chop, Imported', specification: 'Not specified', price: 260.42, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '52', commodity: 'Pork Fore Shank, Local', specification: 'Not specified', price: 330.57, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '53', commodity: 'Pork Fore Shank, Imported', specification: 'Not specified', price: 203.33, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '54', commodity: 'Pork Head, Local', specification: 'Not specified', price: 254.12, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '55', commodity: 'Pork Head, Imported', specification: 'Not specified', price: 200.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '56', commodity: 'Pork Hind Leg (Pigue), Local', specification: 'Not specified', price: 351.17, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '57', commodity: 'Pork Hind Leg (Pigue), Imported', specification: 'Not specified', price: 257.94, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '58', commodity: 'Pork Hind Shank, Local', specification: 'Not specified', price: 331.59, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '59', commodity: 'Pork Hind Shank, Imported', specification: 'Not specified', price: 210.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '60', commodity: 'Pork Loin, Local', specification: 'Not specified', price: 395.33, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '61', commodity: 'Pork Loin, Imported', specification: 'Not specified', price: 262.14, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '62', commodity: 'Pork Offals, Local', specification: 'Not specified', price: 264.29, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '63', commodity: 'Pork Offals, Imported', specification: 'Not specified', price: 138.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '64', commodity: 'Pork Picnic Shoulder (Kasim), Local', specification: 'Not specified', price: 351.72, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '65', commodity: 'Pork Picnic Shoulder (Kasim), Imported', specification: 'Not specified', price: 258.18, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '66', commodity: 'Pork Rind/Skin, Local', specification: 'Not specified', price: 107.27, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '67', commodity: 'Pork Spare Ribs, Local', specification: 'Not specified', price: 341.33, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '68', commodity: 'Pork Spare Ribs, Imported', specification: 'Not specified', price: 242.73, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Carabeef products
        { id: '69', commodity: 'Carabeef Forequarter, Local', specification: 'Not specified', price: 320.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '70', commodity: 'Carabeef Meat, Local', specification: 'Not specified', price: 350.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '71', commodity: 'Carabeef Rump Steak, Local', specification: 'Not specified', price: 380.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '72', commodity: 'Carabeef Trimmings, Local', specification: 'Not specified', price: 340.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Chicken products
        { id: '73', commodity: 'Chicken Breast, Local', specification: 'Magnolia', price: 219.18, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '74', commodity: 'Chicken Breast, Local', specification: 'Bounty Fresh', price: 220.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '75', commodity: 'Chicken Breast, Local', specification: 'Unbranded, Fresh', price: 209.26, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '76', commodity: 'Chicken Drumstick, Local', specification: 'Magnolia', price: 225.2, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '77', commodity: 'Chicken Drumstick, Local', specification: 'Bounty Fresh', price: 230.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '78', commodity: 'Chicken Drumstick, Local', specification: 'Unbranded, Fresh', price: 217.5, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '79', commodity: 'Chicken Feet, Local', specification: 'Not specified', price: 145.54, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '80', commodity: 'Chicken Leg Quarter', specification: 'Magnolia', price: 220.2, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '81', commodity: 'Chicken Leg Quarter', specification: 'Bounty Fresh', price: 220.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '82', commodity: 'Chicken Leg Quarter', specification: 'Unbranded, Fresh', price: 209.36, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '83', commodity: 'Chicken Leg Quarter, Imported', specification: 'Not specified', price: 167.22, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '84', commodity: 'Chicken Liver, Local', specification: 'Not specified', price: 234.94, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '85', commodity: 'Chicken Neck, Local', specification: 'Not specified', price: 145.76, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '86', commodity: 'Chicken Rind/Skin, Local', specification: 'Not specified', price: 150.4, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '87', commodity: 'Chicken Thigh, Local', specification: 'Not specified', price: 216.52, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '88', commodity: 'Chicken Wing, Local', specification: 'Magnolia', price: 223.04, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '89', commodity: 'Chicken Wing, Local', specification: 'Bounty Fresh', price: 230.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '90', commodity: 'Chicken Wing, Local', specification: 'Unbranded, Fresh', price: 218.14, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '91', commodity: 'Whole Chicken, Local', specification: 'Magnolia', price: 208.11, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '92', commodity: 'Whole Chicken, Local', specification: 'Bounty Fresh', price: 200.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '93', commodity: 'Whole Chicken, Local', specification: 'Fully Dressed', price: 195.77, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '94', commodity: 'Chicken Egg (White, Medium)', specification: '56-60 grams/pc', price: 8.32, unit: 'piece', region: 'NCR', date: '2025-10-18' },
        
        // Vegetables
        { id: '95', commodity: 'Ampalaya', specification: '4-5 pcs/kg', price: 134.88, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '96', commodity: 'Chilli (Green), Local', specification: 'Haba/Panigang', price: 168.3, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '97', commodity: 'Eggplant', specification: '3-4 Small Bundles', price: 129.22, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '98', commodity: 'Native Pechay', specification: '3-4 Small Bundles', price: 119.13, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '99', commodity: 'Pole Sitao', specification: '3-4 Small Bundles', price: 110.4, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '100', commodity: 'Squash', specification: 'Suprema Variety', price: 76.34, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '101', commodity: 'Tomato', specification: '15-18 pcs/kg', price: 134.42, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '102', commodity: 'Bell Pepper (Green), Local', specification: 'Medium (151-250gm/pc)', price: 276.91, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '103', commodity: 'Bell Pepper (Red), Local', specification: 'Medium (151-250gm/pc)', price: 253.73, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '104', commodity: 'Broccoli, Local', specification: 'Medium (8-10 cm diameter/bunch hd)', price: 214.44, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '105', commodity: 'Broccoli, Imported', specification: 'Not specified', price: 261.75, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '106', commodity: 'Cauliflower, Local', specification: 'Medium (8-10 cm diameter/bunch hd)', price: 253.66, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '107', commodity: 'Cabbage (Rare Ball)', specification: '510 gm - 1 kg/head', price: 97.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '108', commodity: 'Cabbage (Scorpio)', specification: '750 gm - 1 kg/head', price: 100.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '109', commodity: 'Cabbage (Wonder Ball)', specification: '510 gm - 1 kg/head', price: 99.38, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '110', commodity: 'Carrots, Local', specification: '8-10 pcs/kg', price: 184.83, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '111', commodity: 'Celery', specification: 'Medium (501-800 g)', price: 183.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '112', commodity: 'Chayote', specification: 'Medium (301-400 g)', price: 76.56, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '113', commodity: 'Habichuelas/Baguio Beans, Local', specification: 'Not specified', price: 141.09, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '114', commodity: 'Pechay Baguio', specification: 'Not specified', price: 78.22, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '115', commodity: 'Lettuce (Green Ice)', specification: 'Not specified', price: 190.5, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '116', commodity: 'Lettuce (Iceberg)', specification: 'Medium (301-450 cm diameter/bunch hd)', price: 210.98, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '117', commodity: 'Lettuce (Romaine)', specification: 'Not specified', price: 188.52, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '118', commodity: 'White Potato, Local', specification: '10-12 pcs/kg', price: 134.22, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Spices
        { id: '119', commodity: 'Chilli (Red), Local', specification: 'Tingala', price: 273.08, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '120', commodity: 'Garlic, Native/Local', specification: 'Not specified', price: 400.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '121', commodity: 'Garlic, Imported', specification: 'Not specified', price: 149.73, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '122', commodity: 'Ginger, Local', specification: 'Fairly well-matured, Medium (150-300 gm)', price: 195.82, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '123', commodity: 'Ginger, Imported', specification: 'Fairly well-matured, Medium (150-300 gm)', price: 145.12, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '124', commodity: 'Red Onion, Local', specification: '13-15 pcs/kg', price: 153.67, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '125', commodity: 'Red Onion, Imported', specification: 'Not specified', price: 120.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '126', commodity: 'White Onion, Imported', specification: 'Medium', price: 125.71, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '127', commodity: 'White Onion, Imported', specification: 'Large', price: 108.39, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Fruits
        { id: '128', commodity: 'Avocado', specification: 'Not specified', price: 450.0, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '129', commodity: 'Banana (Lakatan)', specification: '8-10 pcs/kg', price: 97.94, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '130', commodity: 'Banana (Latundan)', specification: '10-12 pcs/kg', price: 73.99, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '131', commodity: 'Banana (Saba)', specification: 'Not specified', price: 52.13, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '132', commodity: 'Calamansi', specification: 'Not specified', price: 83.24, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '133', commodity: 'Mango (Carabao)', specification: 'Ripe, 3-4 pcs/kg', price: 201.43, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '134', commodity: 'Melon', specification: 'Not specified', price: 105.61, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '135', commodity: 'Papaya', specification: 'Solo, Ripe, 2-3 pcs/kg', price: 69.66, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '136', commodity: 'Pomelo', specification: 'Not specified', price: 189.56, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '137', commodity: 'Watermelon', specification: 'Not specified', price: 76.2, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        
        // Other commodities
        { id: '138', commodity: 'Salt (Rock)', specification: 'Not specified', price: 20.79, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '139', commodity: 'Salt (Iodized)', specification: 'Not specified', price: 40.12, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '140', commodity: 'Sugar (Refined)', specification: 'Not specified', price: 82.55, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '141', commodity: 'Sugar (Washed)', specification: 'Not specified', price: 76.41, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '142', commodity: 'Sugar (Brown)', specification: 'Not specified', price: 74.12, unit: 'kg', region: 'NCR', date: '2025-10-18' },
        { id: '143', commodity: 'Cooking Oil (Palm)', specification: '350 ml/bottle', price: 36.87, unit: 'bottle', region: 'NCR', date: '2025-10-18' },
        { id: '144', commodity: 'Cooking Oil (Palm)', specification: '1 Liter/bottle', price: 91.38, unit: 'bottle', region: 'NCR', date: '2025-10-18' },
        { id: '145', commodity: 'Cooking Oil (Coconut)', specification: '350 ml/bottle', price: 60.68, unit: 'bottle', region: 'NCR', date: '2025-10-18' },
        { id: '146', commodity: 'Cooking Oil (Coconut)', specification: '1 Liter/bottle', price: 162.09, unit: 'bottle', region: 'NCR', date: '2025-10-18' },
        { id: '147', commodity: 'Cooking Oil (Spring)', specification: '500 ml/bottle', price: 75.0, unit: 'bottle', region: 'NCR', date: '2025-10-18' },
        { id: '148', commodity: 'Cooking Oil (Spring)', specification: '1,000 ml/bottle', price: 154.17, unit: 'bottle', region: 'NCR', date: '2025-10-18' },
        { id: '149', commodity: 'Cooking Oil (Palm Olein, Jolly Brand)', specification: '1,000 ml/bottle', price: 148.0, unit: 'bottle', region: 'NCR', date: '2025-10-18' }
        ];
      }
      
      setPdfData(allPDFData);
      console.log(`✅ Loaded ${allPDFData.length} commodities from DA Philippines PDF`);
      console.log('📊 Data source: Automated extraction + fallback');
    } catch (error) {
      console.error('❌ Error loading PDF data:', error);
      Alert.alert('Error', 'Failed to load PDF data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = () => {
    if (!formData.commodity.trim() || !formData.specification.trim() || !formData.price.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const newItem: PDFDataItem = {
      id: editingItem?.id || Date.now().toString(),
      commodity: formData.commodity.trim(),
      specification: formData.specification.trim(),
      price: price,
      unit: formData.unit,
      region: formData.region,
      date: formData.date
    };

    if (editingItem) {
      // Update existing item
      setPdfData(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
      Alert.alert('Success', 'PDF data updated successfully');
    } else {
      // Add new item
      setPdfData(prev => [...prev, newItem]);
      Alert.alert('Success', 'PDF data added successfully');
    }

    // Reset form
    setFormData({
      commodity: '',
      specification: '',
      price: '',
      unit: 'kg',
      region: 'NCR',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item: PDFDataItem) => {
    setEditingItem(item);
    setFormData({
      commodity: item.commodity,
      specification: item.specification,
      price: item.price.toString(),
      unit: item.unit,
      region: item.region,
      date: item.date
    });
    setShowAddModal(true);
  };

  const handleDelete = (item: PDFDataItem) => {
    Alert.alert(
      'Delete PDF Data',
      `Are you sure you want to delete "${item.commodity}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPdfData(prev => prev.filter(i => i.id !== item.id));
            Alert.alert('Success', 'PDF data deleted successfully');
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 ADMIN PDF DATA: Starting automatic refresh - checking DA website for new PDFs...');
      
      // Show loading message
      Alert.alert(
        'Checking for Updates',
        '🌐 Automatically checking DA website for new Daily Price Index PDFs...\n\n⏳ Please wait while we check for updates.',
        [],
        { cancelable: false }
      );
      
      // Try multiple connection methods for the automatic PDF service
      let serviceConnected = false;
      const serviceUrls = [
        'https://agriassist-pdf-api.onrender.com/check-pdfs',  // Render deployment (LIVE!)
        'https://your-app.vercel.app/api/check-pdfs',          // Vercel deployment
        'https://your-app.railway.app/check-pdfs',             // Railway deployment
        'http://10.0.2.2:3001/check-pdfs',            // Android emulator (fallback)
        'http://localhost:3001/check-pdfs',            // Local development (fallback)
        'http://127.0.0.1:3001/check-pdfs'            // Alternative local (fallback)
      ];
      
      for (const url of serviceUrls) {
        try {
          console.log(`🌐 Trying to connect to PDF service at: ${url}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const result = await response.json();
          
          if (result.success) {
            serviceConnected = true;
            console.log('✅ Successfully connected to PDF service');
            
            if (result.hasNewData) {
              Alert.alert(
                '✅ New Data Found!', 
                `🎉 ${result.message}\n\n📊 Updated data: ${result.commodityCount} commodities\n\n🔄 Price monitoring has been automatically updated with the latest data.`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                '✅ Check Complete', 
                `🌐 ${result.message}\n\n📊 Current data: ${result.commodityCount} commodities\n\nℹ️ You already have the latest data from DA Philippines.`,
                [{ text: 'OK' }]
              );
            }
            break; // Exit the loop if successful
          }
        } catch (error) {
          console.log(`❌ Failed to connect to ${url}:`, error instanceof Error ? error.message : String(error));
          continue; // Try next URL
        }
      }
      
      // If no service connection worked, try direct script approach
      if (!serviceConnected) {
        console.log('🔄 All service connections failed, trying direct script approach...');
        
        // Try to read result from direct script execution
        try {
          const resultData = require('../pdf_check_result.json');
          if (resultData.success) {
            serviceConnected = true;
            console.log('✅ Found result from direct script execution');
            
            if (resultData.hasNewData) {
              Alert.alert(
                '✅ New Data Found!', 
                `🎉 ${resultData.message}\n\n📊 Updated data: ${resultData.commodityCount} commodities\n\n🔄 Price monitoring has been automatically updated with the latest data.`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                '✅ Check Complete', 
                `🌐 ${resultData.message}\n\n📊 Current data: ${resultData.commodityCount} commodities\n\nℹ️ You already have the latest data from DA Philippines.`,
                [{ text: 'OK' }]
              );
            }
          }
        } catch (error) {
          console.log('⚠️ No direct script result found:', error instanceof Error ? error.message : String(error));
        }
        
        // Final fallback to local check
        if (!serviceConnected) {
          console.log('🔄 Falling back to local data check...');
          
          let currentCount = 0;
          try {
            const extractedData = require('../data/extracted_pdf_data.json');
            currentCount = extractedData.length;
          } catch (error) {
            console.log('⚠️ Could not read current data count');
          }
          
          Alert.alert(
            '✅ Refresh Complete', 
            `📊 Current data: ${currentCount} commodities\n\nℹ️ To check for new PDFs automatically, run: node scripts/directPDFCheck.js`,
            [{ text: 'OK' }]
          );
        }
      }
      
      // Always reload the data
      await loadPDFData();
      
    } catch (error) {
      console.error('❌ ADMIN PDF DATA: Error during refresh:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const renderPDFDataItem = ({ item }: { item: PDFDataItem }) => (
    <TouchableOpacity 
      style={styles.pdfDataCard}
      onPress={() => {
        // Set selected commodity for forecasting
        setSelectedCommodity({
          name: item.commodity,
          specification: item.specification,
          price: item.price,
          unit: item.unit
        });
        
        // Show forecasting calendar
        setForecastModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.pdfDataHeader}>
        <View style={styles.pdfDataTitleContainer}>
          <Text style={styles.pdfDataCommodity}>{item.commodity}</Text>
          <Ionicons name="calendar" size={16} color="#2E7D32" style={styles.forecastIcon} />
        </View>
        <View style={styles.pdfDataActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the card press
              handleEdit(item);
            }}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the card press
              handleDelete(item);
            }}
          >
            <Ionicons name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.pdfDataDetails}>
        <View style={styles.pdfDataRow}>
          <Text style={styles.pdfDataLabel}>Specification:</Text>
          <Text style={styles.pdfDataValue}>{item.specification}</Text>
        </View>
        
        <View style={styles.pdfDataRow}>
          <Text style={styles.pdfDataLabel}>Price:</Text>
          <Text style={styles.pdfDataPrice}>₱{item.price.toFixed(2)}</Text>
        </View>
        
        <View style={styles.pdfDataRow}>
          <Text style={styles.pdfDataLabel}>Unit:</Text>
          <Text style={styles.pdfDataValue}>{item.unit}</Text>
        </View>
        
        <View style={styles.pdfDataRow}>
          <Text style={styles.pdfDataLabel}>Region:</Text>
          <Text style={styles.pdfDataValue}>{item.region}</Text>
        </View>
        
        <View style={styles.pdfDataRow}>
          <Text style={styles.pdfDataLabel}>Date:</Text>
          <Text style={styles.pdfDataValue}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading PDF data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SlidingAnnouncement />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PDF Data Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>PDF Data Summary</Text>
          <Text style={styles.summaryText}>
            {pdfData.length} commodities - ALL DATA from DA Philippines PDF
          </Text>
          <Text style={styles.summarySubtext}>
            Complete extraction using pdfplumber - no filtering, no conditions
          </Text>
        </View>

        <FlatList
          data={pdfData}
          renderItem={renderPDFDataItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2E7D32']}
              title={refreshing ? "Checking DA website for new PDFs..." : "Pull to check for new PDFs from DA website"}
              titleColor="#2E7D32"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit PDF Data' : 'Add PDF Data'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setShowAddModal(false);
                setEditingItem(null);
                setFormData({
                  commodity: '',
                  specification: '',
                  price: '',
                  unit: 'kg',
                  region: 'NCR',
                  date: new Date().toISOString().split('T')[0]
                });
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Commodity *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.commodity}
                onChangeText={(text) => setFormData(prev => ({ ...prev, commodity: text }))}
                placeholder="e.g., Beef Brisket, Local"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Specification *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.specification}
                onChangeText={(text) => setFormData(prev => ({ ...prev, specification: text }))}
                placeholder="e.g., Meat with Bones"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (₱) *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                placeholder="e.g., 414.23"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TextInput
                style={styles.textInput}
                value={formData.unit}
                onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
                placeholder="e.g., kg, piece, liter"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Region</Text>
              <TextInput
                style={styles.textInput}
                value={formData.region}
                onChangeText={(text) => setFormData(prev => ({ ...prev, region: text }))}
                placeholder="e.g., NCR"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.textInput}
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowAddModal(false);
                setEditingItem(null);
                setFormData({
                  commodity: '',
                  specification: '',
                  price: '',
                  unit: 'kg',
                  region: 'NCR',
                  date: new Date().toISOString().split('T')[0]
                });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleAddOrUpdate}
            >
              <Text style={styles.saveButtonText}>
                {editingItem ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Forecasting Calendar Modal */}
      {selectedCommodity && (
        <ForecastingCalendar
          visible={forecastModalVisible}
          onClose={() => {
            setForecastModalVisible(false);
            setSelectedCommodity(null);
          }}
          commodity={selectedCommodity.name}
          specification={selectedCommodity.specification}
          currentPrice={selectedCommodity.price}
          unit={selectedCommodity.unit}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  pdfDataCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfDataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pdfDataCommodity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
  },
  pdfDataActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 6,
    padding: 8,
  },
  pdfDataDetails: {
    gap: 8,
  },
  pdfDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pdfDataLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pdfDataValue: {
    fontSize: 14,
    color: '#333',
  },
  pdfDataPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pdfDataTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  forecastIcon: {
    marginLeft: 8,
  },
});
