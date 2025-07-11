import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/AuthContext';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/images/Logo 2.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headerTitle}>Account Pending Approval</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="account-clock" size={120} color={LIGHT_GREEN} />
        </View>
        
        <Text style={styles.title}>Your Account is Pending Approval</Text>
        
        <Text style={styles.description}>
          Thank you for signing up! Your account as a {profile.role} is currently being reviewed by our administrators.
        </Text>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color={GREEN} />
          <Text style={styles.infoText}>
            You will be able to access the app once your account has been approved. This usually takes 24-48 hours.
          </Text>
        </View>

        <View style={styles.roleInfo}>
          <MaterialCommunityIcons 
            name={profile.role === 'BAEWs' ? 'account-hard-hat' : 'account-eye'} 
            size={32} 
            color={GREEN} 
          />
          <Text style={styles.roleText}>Role: {profile.role}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={GREEN} />
          <Text style={styles.logoutButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: GREEN,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    lineHeight: 20,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 32,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginLeft: 8,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginLeft: 8,
  },
}); 