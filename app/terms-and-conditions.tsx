import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function TermsAndConditionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const emailParam = typeof params.email === 'string' ? params.email : '';

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!agreeTerms || !agreeData || saving) return;
    try {
      setSaving(true);
      if (emailParam) {
        const key = `termsAccepted_${emailParam.toLowerCase()}`;
        await AsyncStorage.setItem(key, 'true');
      }
    } catch (err) {
      console.error('Error saving terms acceptance:', err);
    } finally {
      setSaving(false);
      // After accepting, go to farmer form (main flow for regular users)
      router.replace('/farmers');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top green bar */}
      <View style={styles.topGreen} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to AgriAssist</Text>
          <Text style={styles.subtitle}>
            Please read and agree to these terms before using the app. This is
            required for all farmer accounts.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Purpose of the App</Text>
            <Text style={styles.sectionText}>
              AgriAssist is designed to help farmers record their farming
              information, monitor planting and harvest activities, and receive
              basic analytics and insights. The app is for guidance and
              record-keeping only and does not replace professional agricultural
              advice.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Your Responsibilities</Text>
            <Text style={styles.sectionText}>
              You agree to provide true and accurate information in all forms
              and reports. You are responsible for any decisions you make based
              on the data and analytics shown in the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Use of Your Data</Text>
            <Text style={styles.sectionText}>
              The information you submit (such as demographics, farming
              profile, planting and harvest reports) may be used to:
            </Text>
            <Text style={styles.bullet}>• Generate your personal reports</Text>
            <Text style={styles.bullet}>
              • Produce anonymous summary statistics for admin and research use
            </Text>
            <Text style={styles.bullet}>
              • Improve AgriAssist features and recommendations
            </Text>
            <Text style={styles.sectionText}>
              We will not publicly show your personal identity (such as full
              name or email) together with sensitive details in any shared
              summaries.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Storage and Access</Text>
            <Text style={styles.sectionText}>
              Your data is stored securely in our database. Admin users may
              view farmer records to generate reports, summaries, and inventory
              for the municipality or organization. Only authorized staff and
              system administrators should access this data.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Limitations</Text>
            <Text style={styles.sectionText}>
              AgriAssist provides estimates and analytics based on the data you
              enter. Actual field results may differ due to weather, pests,
              market conditions, and other factors. The app is provided “as is”
              without any guarantee of yield or income.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Changes to These Terms</Text>
            <Text style={styles.sectionText}>
              These terms may change as the app improves. If there are major
              updates, you may be asked to review and accept the updated terms
              again.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Contact</Text>
            <Text style={styles.sectionText}>
              For questions about these terms, you can contact the AgriAssist
              team at agriassistme@gmail.com.
            </Text>
          </View>
        </View>

        {/* Agreements */}
        <View style={styles.card}>
          <Text style={styles.confirmTitle}>Before you continue</Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkbox,
                agreeTerms && styles.checkboxChecked,
              ]}
            >
              {agreeTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read and agree to the Terms and Conditions of AgriAssist.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreeData(!agreeData)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkbox,
                agreeData && styles.checkboxChecked,
              ]}
            >
              {agreeData && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I allow my farming information to be used for reports and summary
              statistics as described above.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.continueButton,
              (!agreeTerms || !agreeData || saving) &&
                styles.continueButtonDisabled,
            ]}
            disabled={!agreeTerms || !agreeData || saving}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>
              {saving ? 'Saving...' : 'Agree and Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f6',
  },
  topGreen: {
    height: 36,
    width: '100%',
    backgroundColor: GREEN,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  placeholder: {
    width: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  bullet: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginLeft: 12,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: GREEN,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  continueButton: {
    marginTop: 12,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#c5d6cf',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});


