import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/AuthContext';

const GREEN = '#16543a';
const INFO_COLOR = '#2196f3';
const CARD_WIDTH = 120;
const RECT_HEIGHT = 80;
const RECT_RADIUS = 32;

// Sample 7-day weather data (dates are for example)
const weekWeather = [
  { day: 'Mon', date: 'Jun 3', icon: 'weather-sunny', temp: '31°C', desc: 'Sunny' },
  { day: 'Tue', date: 'Jun 4', icon: 'weather-cloudy', temp: '27°C', desc: 'Cloudy' },
  { day: 'Wed', date: 'Jun 5', icon: 'weather-rainy', temp: '25°C', desc: 'Rainy' },
  { day: 'Thu', date: 'Jun 6', icon: 'weather-partly-cloudy', temp: '28°C', desc: 'Partly Cloudy' },
  { day: 'Fri', date: 'Jun 7', icon: 'weather-rainy', temp: '26°C', desc: 'Heavy Rain' },
  { day: 'Sat', date: 'Jun 8', icon: 'weather-sunny', temp: '30°C', desc: 'Sunny' },
  { day: 'Sun', date: 'Jun 9', icon: 'weather-partly-cloudy', temp: '29°C', desc: 'Partly Cloudy' },
];

const weatherNotes = [
  {
    icon: 'weather-rainy',
    title: 'Heavy Rain Expected',
    desc: 'Heavy rain expected on Friday (Jun 7). Prepare for possible flooding and delays.',
  },
  {
    icon: 'weather-rainy',
    title: 'Rainy Day',
    desc: 'It was rainy on Wednesday (Jun 5). Fields may be muddy.',
  },
  {
    icon: 'weather-sunny',
    title: 'Hot Start',
    desc: 'Sunny and hot start to the week. Stay hydrated and monitor crops for heat stress.',
  },
  {
    icon: 'weather-cloudy',
    title: 'Cloudy Skies',
    desc: 'Cloudy skies on Tuesday (Jun 4). Good for transplanting.',
  },
  {
    icon: 'weather-partly-cloudy',
    title: 'Partly Cloudy Weekend',
    desc: 'Partly cloudy this weekend. Good conditions for field work.',
  },
];

export default function WeatherFeedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" hidden />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Weather Feed</Text>
          <Text style={styles.headerSubtitle}>Stay updated with weather conditions.</Text>
        </View>
        <Image source={{ uri: profile.profileImage }} style={styles.profileImg} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={{ height: 24 }} />
        {/* 7-Day Weather Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow} contentContainerStyle={styles.scrollContent}>
          {weekWeather.map((item, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.dayLabel}>{item.day}</Text>
              <Text style={styles.dateLabel}>{item.date}</Text>
              <MaterialCommunityIcons name={item.icon as any} size={44} color={INFO_COLOR} style={{ marginVertical: 6 }} />
              <Text style={styles.temp}>{item.temp}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          ))}
        </ScrollView>
        {/* Weather Notes - Card Style */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Weather Notes</Text>
          {weatherNotes.map((note, idx) => (
            <View key={idx} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <MaterialCommunityIcons name={note.icon as any} size={28} color={INFO_COLOR} style={{ marginRight: 10 }} />
                <Text style={styles.noteTitle}>{note.title}</Text>
              </View>
              <Text style={styles.noteDesc}>{note.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    justifyContent: 'space-between',
  },
  logo: {
    width: 54,
    height: 54,
    marginRight: 8,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2f1',
    marginTop: 2,
    textAlign: 'center',
  },
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eee',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollRow: { width: '100%' },
  scrollContent: { paddingLeft: 18, paddingRight: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    width: CARD_WIDTH,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dayLabel: { fontSize: 16, fontWeight: 'bold', color: GREEN, marginBottom: 2 },
  dateLabel: { fontSize: 13, color: '#888', marginBottom: 2 },
  temp: { fontSize: 22, fontWeight: 'bold', color: INFO_COLOR, marginBottom: 2 },
  desc: { fontSize: 13, color: '#555', textAlign: 'center' },
  notesSection: { width: '100%', marginTop: 28, paddingHorizontal: 18 },
  notesTitle: { fontSize: 18, fontWeight: 'bold', color: GREEN, marginBottom: 12 },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  noteTitle: { fontSize: 16, fontWeight: 'bold', color: GREEN },
  noteDesc: { fontSize: 14, color: '#555', lineHeight: 20 },
}); 