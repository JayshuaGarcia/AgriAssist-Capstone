import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

const GREEN = '#16543a';

const recentNotifications = [
  { id: '1', text: 'Your report was approved.' },
  { id: '2', text: 'Reminder: Training session tomorrow.' },
  { id: '3', text: 'New farmer profile added.' },
];

export default function ProfileNotificationsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Push Notifications</Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: '#ccc', true: GREEN }} thumbColor={pushEnabled ? GREEN : '#fff'} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Email Notifications</Text>
        <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: '#ccc', true: GREEN }} thumbColor={emailEnabled ? GREEN : '#fff'} />
      </View>
      <Text style={styles.subtitle}>Recent Notifications</Text>
      <FlatList
        data={recentNotifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Text style={styles.notification}>{item.text}</Text>}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: GREEN, marginBottom: 18 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  label: { fontSize: 16, color: GREEN },
  subtitle: { fontSize: 17, fontWeight: 'bold', color: GREEN, marginTop: 24, marginBottom: 10 },
  list: { backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  notification: { fontSize: 15, color: '#333', marginBottom: 8 },
}); 