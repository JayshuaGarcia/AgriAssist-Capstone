import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Linking } from 'react-native';
import { useRouter } from 'expo-router';

const GREEN = '#16543a';

export default function ProfilePrivacyScreen() {
  const [biometric, setBiometric] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy & Security</Text>
      <Text style={styles.sectionTitle}>Change Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Current Password" secureTextEntry />
      <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New Password" secureTextEntry />
      <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" secureTextEntry />
      <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveText}>Change Password</Text></TouchableOpacity>
      <Text style={styles.sectionTitle}>Biometric Login</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Enable Biometric Login</Text>
        <Switch value={biometric} onValueChange={setBiometric} trackColor={{ false: '#ccc', true: GREEN }} thumbColor={biometric ? GREEN : '#fff'} />
      </View>
      <TouchableOpacity onPress={() => Linking.openURL('https://your-privacy-policy-url.com')} style={styles.privacyLink}>
        <Text style={styles.privacyText}>View Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: GREEN, marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: GREEN, marginTop: 18, marginBottom: 8 },
  input: { width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 14, fontSize: 16, color: GREEN, marginBottom: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  saveBtn: { backgroundColor: GREEN, borderRadius: 18, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  label: { fontSize: 16, color: GREEN },
  privacyLink: { marginTop: 24, alignItems: 'center' },
  privacyText: { color: GREEN, textDecorationLine: 'underline', fontWeight: 'bold' },
}); 