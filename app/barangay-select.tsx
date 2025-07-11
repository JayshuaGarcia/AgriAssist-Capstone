import { useRouter } from 'expo-router';
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Barangay, useBarangay } from '../components/RoleContext';

const GREEN = '#16543a';
const BUTTON_GREEN = '#39796b';
const BUTTON_RADIUS = 32;
const { width } = Dimensions.get('window');

const BARANGAYS: Barangay[] = [
  'Poblacion',
  'Rizal',
  'Tabugon',
  'San Lorenzo',
  'San Pedro',
  'Pulongguit-guit',
  'Basiad',
  'Plaridel',
  'Don Tomas',
  'Maulawin',
  'Patag Ibaba',
  'Patag Ilaya',
  'Bulala',
  'Guitol',
  'Kagtalaba',
];

export default function BarangaySelectScreen() {
  const router = useRouter();
  const { setBarangay } = useBarangay();

  const handleSelectBarangay = (barangay: Barangay) => {
    setBarangay(barangay);
    router.push('/login');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Green top bar always visible */}
      <View style={styles.topGreen} />
      <View style={styles.fixedTop}>
        <Image source={require('../assets/images/Logo 2.png')} style={styles.logoImg} resizeMode="contain" />
        <Text style={styles.title}>Select Your Barangay</Text>
        <Text style={styles.subtitle}>
          Please select your barangay to continue. This helps us personalize your experience.
        </Text>
      </View>
      {/* Card-like scrollable area with border */}
      <View style={styles.scrollCardWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {BARANGAYS.map((barangay) => (
            <TouchableOpacity
              key={barangay}
              style={styles.button}
              onPress={() => handleSelectBarangay(barangay)}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>{barangay}</Text>
            </TouchableOpacity>
          ))}
          {/* Minimal extra space at the bottom so last button is visible */}
          <View style={{ height: 2 }} />
        </ScrollView>
      </View>
      <View style={styles.bottomGreen} />
    </KeyboardAvoidingView>
  );
}

const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;
const FIXED_TOP_HEIGHT = 320;

const styles = StyleSheet.create({
  fixedTop: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 18, // Reduce padding below header
    backgroundColor: '#fff',
    zIndex: 20,
    minHeight: FIXED_TOP_HEIGHT,
  },
  logoImg: {
    width: 120,
    height: 120,
    marginBottom: 18,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    marginBottom: 0,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    paddingBottom: 6, // Reduce padding below subtitle
    paddingTop: 2,
  },
  scrollCardWrapper: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 32,
    marginTop: 4, // Move card closer to subtitle
    marginBottom: 8, // Add small space so border is visible above green bar
    paddingTop: 0,
    zIndex: 5,
    minHeight: 0,
    borderWidth: 1.5,
    borderColor: '#d0d7d4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    height: 400, // Increased height for better visibility
    justifyContent: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 16,
    paddingHorizontal: 0,
    minHeight: 200,
  },
  button: {
    width: width * 0.7,
    backgroundColor: BUTTON_GREEN,
    borderRadius: BUTTON_RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  topGreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RECT_HEIGHT,
    backgroundColor: GREEN,
    borderBottomLeftRadius: RECT_RADIUS,
    borderBottomRightRadius: RECT_RADIUS,
    zIndex: 30,
  },
  bottomGreen: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: RECT_HEIGHT,
    backgroundColor: GREEN,
    borderTopLeftRadius: RECT_RADIUS,
    borderTopRightRadius: RECT_RADIUS,
    zIndex: 10,
  },
}); 