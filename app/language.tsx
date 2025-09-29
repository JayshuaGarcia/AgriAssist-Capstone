import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  }
  // More languages can be added here in the future
];

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    // Here you would typically save the language preference
    // For now, we'll just show a success message
    console.log(`Language changed to: ${languageCode}`);
  };

  const handleSave = () => {
    // Save language preference and go back
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Top Green Border */}
      <View style={{ height: 36, width: '100%', backgroundColor: GREEN }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Ionicons name="language" size={60} color={GREEN} />
          <Text style={styles.infoTitle}>Select Language</Text>
          <Text style={styles.infoDescription}>
            Choose your preferred language for the app interface.
          </Text>
        </View>

        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                selectedLanguage === language.code && styles.selectedLanguageItem
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.flag}>{language.flag}</Text>
                <View style={styles.languageText}>
                  <Text style={[
                    styles.languageName,
                    selectedLanguage === language.code && styles.selectedLanguageText
                  ]}>
                    {language.name}
                  </Text>
                  <Text style={[
                    styles.languageNativeName,
                    selectedLanguage === language.code && styles.selectedLanguageSubtext
                  ]}>
                    {language.nativeName}
                  </Text>
                </View>
              </View>
              {selectedLanguage === language.code && (
                <Ionicons name="checkmark-circle" size={24} color={GREEN} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.comingSoonContainer}>
          <Ionicons name="construct" size={40} color={LIGHT_GREEN} />
          <Text style={styles.comingSoonTitle}>More Languages Coming Soon</Text>
          <Text style={styles.comingSoonDescription}>
            We're working on adding more languages to make AgriAssist accessible to farmers worldwide.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  infoContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  infoDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
  languageList: {
    marginBottom: 30,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedLanguageItem: {
    borderColor: GREEN,
    borderWidth: 2,
    backgroundColor: '#f0f8f0',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 15,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 3,
  },
  selectedLanguageText: {
    color: GREEN,
  },
  languageNativeName: {
    fontSize: 14,
    color: '#666',
  },
  selectedLanguageSubtext: {
    color: '#555',
  },
  comingSoonContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
});















