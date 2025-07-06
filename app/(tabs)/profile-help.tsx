import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const GREEN = '#16543a';
const FAQS = [
  { q: 'How do I reset my password?', a: 'Go to Privacy & Security and use the Change Password form.' },
  { q: 'How do I contact support?', a: 'Tap the Contact Support button below.' },
  { q: 'How do I update my profile?', a: 'Go to Edit Profile and make your changes.' },
];

export default function ProfileHelpScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.sectionTitle}>FAQs</Text>
      {FAQS.map((item, idx) => (
        <View key={idx} style={styles.faqItem}>
          <Text style={styles.faqQ}>{item.q}</Text>
          <Text style={styles.faqA}>{item.a}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('mailto:support@agriassist.com')}>
        <Text style={styles.supportText}>Contact Support</Text>
      </TouchableOpacity>
      <Text style={styles.version}>App Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: GREEN, marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: GREEN, marginTop: 18, marginBottom: 8 },
  faqItem: { marginBottom: 14 },
  faqQ: { fontWeight: 'bold', color: GREEN, fontSize: 15 },
  faqA: { color: '#333', fontSize: 15, marginTop: 2 },
  supportBtn: { backgroundColor: GREEN, borderRadius: 18, paddingVertical: 12, alignItems: 'center', marginTop: 18 },
  supportText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  version: { color: '#888', fontSize: 14, marginTop: 28, textAlign: 'center' },
}); 