import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Top Green Border */}
      <View style={{ height: 36, width: '100%', backgroundColor: GREEN }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={80} color={GREEN} />
        </View>
        
        <Text style={styles.appName}>AgriAssist</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.description}>
            AgriAssist is a comprehensive agricultural management application designed to help farmers 
            manage their farming activities, track weather conditions, monitor crops, and access 
            agricultural tools and resources.
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureTitle}>Key Features:</Text>
            <Text style={styles.featureItem}>• Weather forecasting and agricultural advice</Text>
            <Text style={styles.featureItem}>• Farmer profile and registration management</Text>
            <Text style={styles.featureItem}>• Crop monitoring and tracking tools</Text>
            <Text style={styles.featureItem}>• Price monitoring and market analytics</Text>
            <Text style={styles.featureItem}>• Comprehensive search functionality</Text>
            <Text style={styles.featureItem}>• Settings and preferences management</Text>
          </View>
          
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Contact Information:</Text>
            <Text style={styles.contactItem}>Email: support@agriassist.com</Text>
            <Text style={styles.contactItem}>Phone: +63 (0) 123 456 7890</Text>
            <Text style={styles.contactItem}>Website: www.agriassist.com</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0f2e0',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 5,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  version: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    width: '100%',
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 25,
    textAlign: 'center',
  },
  featureList: {
    marginBottom: 25,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 10,
    textAlign: 'center',
  },
  featureItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    lineHeight: 20,
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 10,
    textAlign: 'center',
  },
  contactItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    textAlign: 'center',
  },
});














