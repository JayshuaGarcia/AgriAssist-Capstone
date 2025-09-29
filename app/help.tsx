import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function HelpSupportScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={styles.topBorder} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} tintColor={GREEN} />}>
        <Text style={styles.sectionTitle}>Quick FAQs</Text>
        <View style={styles.card}>
          <FAQItem q="How do I change my email?" a="Go to Security and Account then Account Email, request a code, then confirm." />
          <Separator />
          <FAQItem q="How do I update my profile photo?" a="Open Privacy and Security then tap Change photo under your avatar." />
          <Separator />
          <FAQItem q="Where can I manage notifications?" a="Open Notifications in Profile and Settings to toggle alerts." />
        </View>


        <Text style={styles.sectionTitle}>Send Feedback</Text>
        <View style={styles.card}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue or share feedback"
            style={styles.textArea}
            multiline
          />
          <TouchableOpacity style={[styles.submitButton, !message && styles.submitDisabled]} disabled={!message} onPress={() => {
            const subject = encodeURIComponent('App Feedback/Support');
            const body = encodeURIComponent(message);
            const mailto = `mailto:support@agriassist.app?subject=${subject}&body=${body}`;
            Linking.openURL(mailto).catch(() => {});
            setMessage('');
          }}>
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <View style={{ paddingVertical: 12 }}>
      <Text style={styles.faqQ}>{q}</Text>
      <Text style={styles.faqA}>{a}</Text>
    </View>
  );
}

function Separator() {
  return <View style={{ height: 1, backgroundColor: '#eee' }} />;
}

const styles = StyleSheet.create({
  topBorder: { height: 36, width: '100%', backgroundColor: GREEN },
  header: { paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  backButton: { position: 'absolute', left: 16, top: 16, height: 24, width: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { textAlign: 'center', fontSize: 20, fontWeight: '800', color: GREEN },
  container: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: GREEN, marginTop: 8, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  contactText: { flex: 1, marginLeft: 12, color: '#111827', fontWeight: '600' },
  faqQ: { color: GREEN, fontWeight: '700', marginBottom: 4 },
  faqA: { color: '#555' },
  textArea: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 12, paddingHorizontal: 12, minHeight: 100, marginTop: 8 },
  submitButton: { marginTop: 12, backgroundColor: GREEN, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { backgroundColor: '#9ca3af' },
  submitText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
});


