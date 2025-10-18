import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GREEN = '#16543a';

export default function ProfileAboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About AgriAssist</Text>
      <Text style={styles.sectionTitle}>App Version</Text>
      <Text style={styles.info}>1.0.0</Text>
      <Text style={styles.sectionTitle}>Developer</Text>
      <Text style={styles.info}>AgriAssist Team</Text>
      <Text style={styles.sectionTitle}>Legal</Text>
      <Text style={styles.info}>This app is for informational purposes only. All data is provided as-is. © 2024 AgriAssist.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: GREEN, marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: GREEN, marginTop: 18, marginBottom: 8 },
  info: { color: '#333', fontSize: 15, marginBottom: 10 },
}); 