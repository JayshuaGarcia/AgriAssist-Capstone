import { useNotificationSettings } from '@/components/NotificationSettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, resetToDefaults } = useNotificationSettings();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate a short refresh. In a real app, you'd re-fetch any remote settings.
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={styles.topBorder} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} tintColor={GREEN} />
      }>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.card}>
          <SettingRow
            icon="notifications"
            label="Notification"
            description="Receive notifications for messages and new announcements"
            value={settings.pushEnabled}
            onValueChange={(v) => updateSettings({ pushEnabled: v })}
          />
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.resetText}>Reset to defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, label, description, value, onValueChange, borderTop }: { icon: any; label: string; description: string; value: boolean; onValueChange: (v: boolean) => void; borderTop?: boolean; }) {
  return (
    <View style={[styles.row, borderTop && styles.rowBorderTop]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={GREEN} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? GREEN : '#f4f3f4'}
        trackColor={{ false: '#d1d5db', true: LIGHT_GREEN }}
        style={{ marginLeft: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBorder: {
    height: 36,
    width: '100%',
    backgroundColor: GREEN,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: GREEN
  },
  container: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginTop: 8,
    marginBottom: 8
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 4
  },
  rowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: 11,
    color: '#555',
    lineHeight: 14
  },
  resetButton: {
    marginTop: 16,
    backgroundColor: GREEN,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8
  }
});


