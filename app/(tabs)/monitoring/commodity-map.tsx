import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../components/AuthContext';
import { useBarangay } from '../../../components/RoleContext';
import { fetchCommodityEntries, uploadCommodityEntry } from '../../../services/commodityMapService';

const GREEN = '#16543a';

export default function CommodityMapScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();
  const { barangay } = useBarangay();
  const [entries, setEntries] = useState<any[]>([]);
  const [commodity, setCommodity] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadEntries();
  }, [barangay]);

  const loadEntries = async () => {
    try {
      const data = await fetchCommodityEntries(barangay || undefined);
      setEntries(data);
    } catch (error) {
      // Optionally handle error
    }
  };

  const handleAddCommodity = async () => {
    if (!commodity.trim() || !quantity.trim()) return;
    if (!barangay) return;
    try {
      await uploadCommodityEntry({
        commodity,
        quantity,
        barangay,
        timestamp: Date.now(),
      });
      setCommodity('');
      setQuantity('');
      loadEntries();
    } catch (error) {
      // Optionally handle error
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Barangay Commodity Map</Text>
          <Text style={styles.headerSubtitle}>View commodity distribution by barangay.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Simple form to add a commodity */}
          <View style={{ marginBottom: 20, width: '100%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Add Commodity</Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 13, color: '#555' }}>Commodity</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fff' }}
                  value={commodity}
                  onChangeText={setCommodity}
                  placeholder="e.g. Rice"
                />
              </View>
              <View style={{ width: 80 }}>
                <Text style={{ fontSize: 13, color: '#555' }}>Qty</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fff' }}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity onPress={handleAddCommodity} style={{ marginLeft: 8, backgroundColor: GREEN, borderRadius: 8, padding: 12, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {/* List of commodities for this barangay */}
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Barangay Commodities</Text>
          {entries.length === 0 ? (
            <Text>No commodities found for your barangay.</Text>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={{ borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8, width: '100%' }}>
                <Text style={{ fontWeight: 'bold' }}>{entry.commodity}</Text>
                <Text>Quantity: {entry.quantity}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
  },
  logo: {
    width: 54,
    height: 54,
    marginRight: 8,
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
    color: '#e0f2f1',
    marginTop: 2,
    textAlign: 'center',
  },
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eee',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#555',
  },
}); 