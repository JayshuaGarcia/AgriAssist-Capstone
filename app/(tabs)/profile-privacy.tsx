import { useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';

const GREEN = '#16543a';

export default function ProfilePrivacyScreen() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentEmail, setCurrentEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy & Security</Text>
      
      <Text style={styles.sectionTitle}>Change Email</Text>
      <TextInput 
        style={[styles.input, styles.readOnlyInput]} 
        value={currentEmail} 
        onChangeText={setCurrentEmail} 
        placeholder="Current Email" 
        keyboardType="email-address" 
        autoCapitalize="none" 
        editable={false}
      />
      <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="New Email" keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} value={confirmEmail} onChangeText={setConfirmEmail} placeholder="Confirm New Email" keyboardType="email-address" autoCapitalize="none" />
      <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveText}>Change Email</Text></TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Change Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Current Password" secureTextEntry />
      <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New Password" secureTextEntry />
      <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" secureTextEntry />
      <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveText}>Change Password</Text></TouchableOpacity>
      
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
  privacyLink: { marginTop: 24, alignItems: 'center' },
  privacyText: { color: GREEN, textDecorationLine: 'underline', fontWeight: 'bold' },
  readOnlyInput: {
    backgroundColor: '#f0f0f0', // A slightly different background for read-only
    color: '#888', // A slightly different color for read-only
  },
}); 