import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function PlantingReportScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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
          <Text style={styles.headerTitle}>Planting Report</Text>
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
        <View style={styles.contentContainer}>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="leaf" size={80} color={LIGHT_GREEN} />
            </View>
            
            <Text style={styles.title}>Planting Report Coming Soon</Text>
            <Text style={styles.subtitle}>
              Record and track your planting activities, crop varieties, and planting schedules. This feature will help you maintain detailed records of your farming operations.
            </Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={20} color={GREEN} />
                <Text style={styles.infoText}>Planting schedule tracking</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="seedling" size={20} color={GREEN} />
                <Text style={styles.infoText}>Crop variety management</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="location" size={20} color={GREEN} />
                <Text style={styles.infoText}>Field location mapping</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="document-text" size={20} color={GREEN} />
                <Text style={styles.infoText}>Detailed planting records</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.backToHomeButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Ionicons name="home" size={20} color="#fff" />
              <Text style={styles.backToHomeText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    flex: 1,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: LIGHT_GREEN,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    width: '100%',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  backToHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backToHomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
