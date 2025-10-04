import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAnnouncements } from '../../components/AnnouncementContext';
import { useAuth } from '../../components/AuthContext';
import { useNotification } from '../../components/NotificationContext';
import { SlidingAnnouncement } from '../../components/SlidingAnnouncement';
import { COMMODITY_CATEGORIES, COMMODITY_DATA, Commodity } from '../../constants/CommodityData';
import { useNavigationBar } from '../../hooks/useNavigationBar';
import { daPriceService, updateCommodityWithDAPrices } from '../../lib/daPriceService';
import { db } from '../../lib/firebase';

const GREEN = '#16543a';
const LIGHT_GREEN = '#74bfa3';
const OPENWEATHER_API_KEY = 'e05cb613185ce07bcb47465572f69f56';
const { width: screenWidth } = Dimensions.get('window');

interface WeatherData {
  weather: Array<{
    id: number;
    description: string;
  }>;
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
  name: string;
}

interface ForecastWeatherData {
  weather: Array<{
    id: number;
    description: string;
  }>;
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
  dt: number;
}

interface ForecastDay {
  date: Date;
  dayName: string;
  dateString: string;
  weatherData: ForecastWeatherData | null;
  loading: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const { announcements, loading: announcementsLoading, error: announcementsError, loadAnnouncements } = useAnnouncements();
  const { showNotification } = useNotification();
  
  // Configure navigation bar to be hidden (same as admin)
  useNavigationBar('hidden');
  const [activeNav, setActiveNav] = useState('home');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [forecastDays, setForecastDays] = useState<ForecastDay[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [dailyBreakdown, setDailyBreakdown] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [shownAnnouncementIds, setShownAnnouncementIds] = useState<Set<string>>(new Set());
  
  // Price monitoring states
  const [priceRefreshing, setPriceRefreshing] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [commodities, setCommodities] = useState<Commodity[]>(COMMODITY_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showCommodityModal, setShowCommodityModal] = useState(false);
  const [priceSearchQuery, setPriceSearchQuery] = useState('');

 

  // Function to add message (this would be called when user or admin sends a message)
  const addMessage = (message: any) => {
    setUserMessages(prev => [message, ...prev]);
  };

  // Load messages for the current user
  const loadUserMessages = async () => {
    if (!user?.uid) return;
    
    try {
      // First, get the user's document ID from the users collection
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email)
      );
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        console.log('No user document found for current user');
        return;
      }
      
      const userDoc = userSnapshot.docs[0];
      const userDocId = userDoc.id;
      
      console.log('Current user UID:', user.uid);
      console.log('Current user document ID:', userDocId);
      
      // Query both sent and received messages
      const sentMessagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', userDocId)
      );
      
      const receivedMessagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', userDocId)
      );
      
      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentMessagesQuery),
        getDocs(receivedMessagesQuery)
      ]);
      
      const sentMessages = sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const receivedMessages = receivedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combine all messages
      const allMessages = [...sentMessages, ...receivedMessages];
      
      // Group messages by contact (sender or receiver)
      const contactMap = new Map();
      
      allMessages.forEach(message => {
        let contactId, contactName, contactEmail;
        
        if (message.senderId === userDocId) {
          // User sent this message
          contactId = message.receiverId;
          contactName = message.receiverName || 'Admin';
          contactEmail = message.receiverEmail || 'admin@agriassist.com';
        } else {
          // User received this message
          contactId = message.senderId;
          contactName = message.senderName || 'Admin';
          contactEmail = message.senderEmail || 'admin@agriassist.com';
        }
        
        if (!contactMap.has(contactId)) {
          contactMap.set(contactId, {
            contactId,
            contactName,
            contactEmail,
            lastMessage: message,
            unreadCount: 0,
            messages: []
          });
        }
        
        const contact = contactMap.get(contactId);
        contact.messages.push(message);
        
        // Update last message if this one is newer
        if (message.timestamp > contact.lastMessage.timestamp) {
          contact.lastMessage = message;
        }
        
        // Count unread messages (only for received messages)
        if (message.receiverId === userDocId && !message.isRead) {
          contact.unreadCount++;
        }
      });
      
      // Convert map to array and sort by last message timestamp
      const contacts = Array.from(contactMap.values())
        .sort((a, b) => (b.lastMessage.timestamp || 0) - (a.lastMessage.timestamp || 0));
      
      setUserMessages(contacts);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };


  // Searchable features data
  const searchableFeatures = [
    {
      id: 'forecast',
      title: 'Forecast Tool',
      description: 'Weather forecast and agricultural planning',
      icon: 'partly-sunny',
      hasPage: true,
      action: () => setActiveNav('forecast')
    },
    {
      id: 'price-monitoring',
      title: 'Price Monitoring',
      description: 'Track agricultural commodity prices',
      icon: 'trending-up',
      hasPage: true,
      action: () => router.push('/price-monitoring')
    },
    {
      id: 'planting-report',
      title: 'Planting Report',
      description: 'Record and track planting activities',
      icon: 'leaf',
      hasPage: true,
      action: () => router.push('/planting-report')
    },
    {
      id: 'harvest-report',
      title: 'Harvest Report',
      description: 'Document harvest data and yields',
      icon: 'basket',
      hasPage: true,
      action: () => router.push('/harvest-report')
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your account and settings',
      icon: 'person',
      hasPage: true,
      action: () => setActiveNav('profile')
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage alert preferences',
      icon: 'notifications',
      hasPage: true,
      action: () => router.push('/notifications')
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Farm updates and news',
      icon: 'megaphone',
      hasPage: true,
      action: () => setActiveNav('announcements')
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Support and communication',
      icon: 'chatbubbles',
      hasPage: true,
      action: () => setActiveNav('messages')
    },
    {
      id: 'privacy-security',
      title: 'Privacy & Security',
      description: 'Account security settings',
      icon: 'shield-checkmark',
      hasPage: true,
      action: () => router.push('/privacy')
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Change app language',
      icon: 'language',
      hasPage: true,
      action: () => router.push('/language')
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      description: 'Get assistance and support',
      icon: 'help-circle',
      hasPage: true,
      action: () => router.push('/help')
    },
    {
      id: 'about',
      title: 'About',
      description: 'App version and information',
      icon: 'information-circle',
      hasPage: true,
      action: () => router.push('/about')
    }
  ];

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = searchableFeatures.filter(feature =>
        feature.title.toLowerCase().includes(query.toLowerCase()) ||
        feature.description.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeNav === 'forecast') {
        await fetchWeatherData();
      }
      // Add any other data reloads if needed (e.g., products/profile)
    } finally {
      setRefreshing(false);
    }
  };

  const fetchWeatherData = async (city = 'Manila') => {
    setLoading(true);
    try {
      console.log('Fetching weather data for:', city);
      console.log('API Key being used:', OPENWEATHER_API_KEY);
      
      // Try different city formats
      const cityFormats = [
        city,
        `${city},PH`,
        `${city},Philippines`
      ];
      
      let data: any = null;
      let successfulCity: string | null = null;
      
      for (const cityFormat of cityFormats) {
        try {
          console.log('Trying city format:', cityFormat);
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityFormat}&appid=${OPENWEATHER_API_KEY}&units=metric`
          );
          
          console.log('Response status for', cityFormat, ':', response.status);
          const responseData = await response.json();
          console.log('Weather data response for', cityFormat, ':', responseData);
          
          if (responseData.cod === 200 || responseData.cod === "200") {
            data = responseData;
            successfulCity = cityFormat;
            break;
          }
        } catch (formatError) {
          console.log('Error with city format', cityFormat, ':', formatError);
          continue;
        }
      }
      
      if (data && (data.cod === 200 || data.cod === "200")) {
        setWeatherData(data);
        console.log('Weather data set successfully for city:', successfulCity);
        
        // Also fetch forecast data for daily breakdown
        if (successfulCity) {
          try {
            console.log('Fetching forecast data for daily breakdown...');
            const forecastResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/forecast?q=${successfulCity}&appid=${OPENWEATHER_API_KEY}&units=metric`
            );
            console.log('Forecast response status:', forecastResponse.status);
            const forecastData = await forecastResponse.json();
            console.log('Forecast data received:', forecastData);
            
            if (forecastData.cod === 200 || forecastData.cod === "200") {
              const today = new Date();
              const breakdown = generateDailyBreakdown(forecastData, today);
              setDailyBreakdown(breakdown);
              console.log('Daily breakdown generated:', breakdown);
            } else {
              console.error('Forecast API error:', forecastData);
            }
          } catch (forecastError) {
            console.error('Error fetching forecast for breakdown:', forecastError);
          }
        }
      } else if (data) {
        console.error('API Error:', data);
        if (data.cod === 401) {
          Alert.alert(
            'API Key Error', 
            'Invalid API key. Please check:\n\n1. API key is correct\n2. API key is activated\n3. No extra spaces\n\nCurrent key: ' + OPENWEATHER_API_KEY
          );
        } else if (data.cod === 404) {
          Alert.alert('Location Error', `City "${city}" not found. Please try a different city.`);
        } else {
          Alert.alert('API Error', `Error ${data.cod}: ${data.message || 'Failed to fetch weather data'}`);
        }
      } else {
        Alert.alert('Error', 'Failed to fetch weather data from all city formats');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Network Error', 'Unable to connect to weather service. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecastData = async (city = 'Manila') => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Forecast fetch error:', error);
      return null;
    }
  };

  const generateForecastDays = () => {
    const days: ForecastDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 365 * 3; i++) { // 3 years (until 2027)
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateString = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      days.push({
        date,
        dayName,
        dateString,
        weatherData: null,
        loading: false
      });
    }
    
    setForecastDays(days);
  };

  const fetchWeatherForDate = async (date: Date, city = 'Manila'): Promise<ForecastWeatherData | null> => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isFuture = daysDiff > 0;
    
    console.log('Fetching weather for date:', dateString);
    console.log('Days difference:', daysDiff);
    console.log('Is future:', isFuture);
    
    try {
      if (isFuture && daysDiff <= 10) {
        // For future dates up to 10 days, use the 5-day forecast API
        console.log('Fetching forecast data for day:', daysDiff);
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();
        
        if (data.cod === 200 || data.cod === "200") {
          console.log('Forecast API successful, data points:', data.list.length);
          
          if (daysDiff <= 5) {
            // For days 1-5, use real forecast data
            console.log('Using real forecast data for day:', daysDiff);
            return findClosestForecast(data.list, date);
          } else {
            // For days 6-10, create extended forecast
            console.log('Creating extended forecast for day:', daysDiff);
            const lastForecast = data.list[data.list.length - 1];
            return createExtendedForecast(lastForecast, daysDiff, date);
          }
        } else {
          console.log('Forecast API failed:', data);
        }
      } else if (daysDiff === 0) {
        // For today, use current weather API
        console.log('Fetching current weather for today');
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();
        
        if (data.cod === 200 || data.cod === "200") {
          console.log('Current weather API successful');
          return {
            weather: data.weather,
            main: data.main,
            wind: data.wind,
            dt: data.dt
          };
        } else {
          console.log('Current weather API failed:', data);
        }
      } else if (daysDiff < 0) {
        console.log('Past date, no historical data available');
      } else {
        console.log('Date beyond 10 days, no forecast available');
      }
      
      console.log('No weather data available for date:', dateString);
      return null;
    } catch (error) {
      console.error('Weather fetch error for date:', dateString, error);
      return null;
    }
  };

  const createExtendedForecast = (lastForecast: any, daysDiff: number, targetDate: Date): ForecastWeatherData => {
    // Create a reasonable forecast based on the last available data and seasonal patterns
    const month = targetDate.getMonth();
    const isRainySeason = month >= 5 && month <= 10; // June to November in Philippines
    const isSummer = month >= 2 && month <= 5; // March to June
    
    // Base temperature with seasonal adjustment
    let baseTemp = lastForecast.main.temp;
    let tempVariation = 0;
    
    if (isRainySeason) {
      tempVariation = (Math.random() - 0.5) * 4; // ±2°C variation
    } else if (isSummer) {
      tempVariation = (Math.random() - 0.3) * 3; // +0.5 to +2°C variation
    } else {
      tempVariation = (Math.random() - 0.5) * 3; // ±1.5°C variation
    }
    
    const adjustedTemp = baseTemp + tempVariation;
    
    // Weather conditions based on season and last forecast
    let weatherId = lastForecast.weather[0].id;
    let description = lastForecast.weather[0].description;
    
    // Add some seasonal variation to weather
    if (isRainySeason && Math.random() > 0.7) {
      weatherId = Math.random() > 0.8 ? 200 : 300; // Thunderstorm or drizzle
      description = Math.random() > 0.8 ? 'thunderstorm' : 'light rain';
    } else if (isSummer && Math.random() > 0.8) {
      weatherId = 800; // Clear sky
      description = 'clear sky';
    }
    
    return {
      weather: [{ id: weatherId, description }],
      main: {
        temp: adjustedTemp,
        humidity: Math.max(50, Math.min(95, lastForecast.main.humidity + (Math.random() - 0.5) * 20)),
        pressure: lastForecast.main.pressure + Math.floor((Math.random() - 0.5) * 10)
      },
      wind: {
        speed: Math.max(1, lastForecast.wind.speed + (Math.random() - 0.5) * 4)
      },
      dt: Math.floor(targetDate.getTime() / 1000)
    };
  };

  const findClosestForecast = (forecastList: any[], targetDate: Date): ForecastWeatherData | null => {
    const targetDateNoon = new Date(targetDate);
    targetDateNoon.setHours(12, 0, 0, 0); // Set to noon for better matching
    
    let closestForecast: any = null;
    let minTimeDiff = Infinity;
    
    forecastList.forEach((forecast: any) => {
      const forecastDate = new Date(forecast.dt * 1000);
      const timeDiff = Math.abs(forecastDate.getTime() - targetDateNoon.getTime());
      
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestForecast = forecast;
      }
    });
    
    if (closestForecast) {
      return {
        weather: closestForecast.weather,
        main: closestForecast.main,
        wind: closestForecast.wind,
        dt: closestForecast.dt
      };
    }
    
    return null;
  };

  const generateSeasonalWeather = (date: Date) => {
    // This function is no longer used - we only show real API data
    return null;
  };

  const generateDailyBreakdown = (forecastData: any, targetDate: Date) => {
    console.log('Generating daily breakdown for:', targetDate.toISOString().split('T')[0]);
    console.log('Available forecast data points:', forecastData.list?.length || 0);
    
    // Find forecasts for morning (6-12), afternoon (12-18), and evening (18-24)
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    let morningData: any = null;
    let afternoonData: any = null;
    let eveningData: any = null;
    
    if (forecastData.list) {
      forecastData.list.forEach((forecast: any) => {
        const forecastDate = new Date(forecast.dt * 1000);
        const forecastDateStr = forecastDate.toISOString().split('T')[0];
        const hour = forecastDate.getHours();
        
        console.log(`Forecast: ${forecastDateStr} ${hour}:00 - Weather: ${forecast.weather[0].main} (${forecast.weather[0].id}) - Temp: ${forecast.main.temp}°C`);
        
        if (forecastDateStr === targetDateStr) {
          if (hour >= 6 && hour < 12 && !morningData) {
            morningData = forecast;
            console.log('Found morning data:', morningData.weather[0].main, morningData.main.temp);
          } else if (hour >= 12 && hour < 18 && !afternoonData) {
            afternoonData = forecast;
            console.log('Found afternoon data:', afternoonData.weather[0].main, afternoonData.main.temp);
          } else if (hour >= 18 && hour < 24 && !eveningData) {
            eveningData = forecast;
            console.log('Found evening data:', eveningData.weather[0].main, eveningData.main.temp);
          }
        }
      });
    }
    
    console.log('Data found - Morning:', !!morningData, 'Afternoon:', !!afternoonData, 'Evening:', !!eveningData);
    
    // Generate realistic breakdowns based on available data
    const getWeatherDescription = (weatherId: number) => {
      // Thunderstorm
      if (weatherId >= 200 && weatherId < 300) return 'Thunderstorm';
      
      // Drizzle
      if (weatherId >= 300 && weatherId < 400) return 'Drizzle';
      
      // Rain
      if (weatherId >= 500 && weatherId < 600) return 'Rain';
      
      // Snow
      if (weatherId >= 600 && weatherId < 700) return 'Snow';
      
      // Atmospheric conditions
      if (weatherId >= 700 && weatherId < 800) return 'Foggy';
      
      // Clear sky
      if (weatherId === 800) return 'Sunny';
      
      // Cloud conditions
      if (weatherId === 801) return 'Few Clouds';
      if (weatherId === 802) return 'Partly Cloudy';
      if (weatherId === 803) return 'Mostly Cloudy';
      if (weatherId === 804) return 'Overcast';
      
      return 'Clear';
    };
    
    const getWeatherIcon = (weatherId: number) => {
      // Thunderstorm
      if (weatherId >= 200 && weatherId < 300) return 'thunderstorm';
      
      // Drizzle
      if (weatherId >= 300 && weatherId < 400) return 'rainy';
      
      // Rain
      if (weatherId >= 500 && weatherId < 600) return 'rainy';
      
      // Snow
      if (weatherId >= 600 && weatherId < 700) return 'snow';
      
      // Atmospheric conditions (fog, mist, etc.)
      if (weatherId >= 700 && weatherId < 800) return 'cloudy';
      
      // Clear sky
      if (weatherId === 800) return 'sunny';
      
      // Cloud conditions
      if (weatherId === 801) return 'partly-sunny'; // Few clouds (11-25%)
      if (weatherId === 802) return 'partly-sunny'; // Scattered clouds (25-50%)
      if (weatherId === 803) return 'cloudy'; // Broken clouds (51-84%)
      if (weatherId === 804) return 'cloud'; // Overcast clouds (85-100%)
      
      return 'sunny';
    };
    
    // Use actual data when available, fallback to reasonable defaults
    const result = {
      morning: {
        temp: morningData ? Math.round(morningData.main.temp) : 28,
        weather: morningData ? getWeatherDescription(morningData.weather[0].id) : 'Sunny',
        icon: morningData ? getWeatherIcon(morningData.weather[0].id) : 'sunny',
        humidity: morningData ? morningData.main.humidity : 70,
        pressure: morningData ? morningData.main.pressure : 1010,
        wind: morningData ? morningData.wind.speed : 5,
        isRealData: !!morningData
      },
      afternoon: {
        temp: afternoonData ? Math.round(afternoonData.main.temp) : 30,
        weather: afternoonData ? getWeatherDescription(afternoonData.weather[0].id) : 'Partly Cloudy',
        icon: afternoonData ? getWeatherIcon(afternoonData.weather[0].id) : 'partly-sunny',
        humidity: afternoonData ? afternoonData.main.humidity : 65,
        pressure: afternoonData ? afternoonData.main.pressure : 1008,
        wind: afternoonData ? afternoonData.wind.speed : 6,
        isRealData: !!afternoonData
      },
      evening: {
        temp: eveningData ? Math.round(eveningData.main.temp) : 26,
        weather: eveningData ? getWeatherDescription(eveningData.weather[0].id) : 'Cloudy',
        icon: eveningData ? getWeatherIcon(eveningData.weather[0].id) : 'cloudy',
        humidity: eveningData ? eveningData.main.humidity : 80,
        pressure: eveningData ? eveningData.main.pressure : 1012,
        wind: eveningData ? eveningData.wind.speed : 4,
        isRealData: !!eveningData
      }
    };
    
    console.log('Final breakdown result:', result);
    return result;
  };

  useEffect(() => {
    if (activeNav === 'forecast') {
      fetchWeatherData();
      generateForecastDays();
    }
  }, [activeNav]);

  // Show the latest announcement as sliding notification
  useEffect(() => {
    if (announcements.length > 0) {
      const latestAnnouncement = announcements[0]; // First announcement is the latest
      
      // Always show the latest announcement as sliding notification
      showNotification({
        title: latestAnnouncement.title,
        message: latestAnnouncement.content,
        type: 'info',
      });
    }
  }, [announcements]);

  // Load messages when user navigates to messages section
  useEffect(() => {
    if (activeNav === 'messages' && user?.uid) {
      loadUserMessages();
    }
  }, [activeNav, user?.uid]);

  // Load price data when price monitoring tab is active
  useEffect(() => {
    if (activeNav === 'tutorial') {
      fetchPriceData();
    }
  }, [activeNav]);

  useEffect(() => {
    if (forecastDays.length > 0 && selectedDateIndex < forecastDays.length) {
      const selectedDay = forecastDays[selectedDateIndex];
      if (!selectedDay.weatherData && !selectedDay.loading) {
        // Fetch weather for selected date
        const updatedDays = [...forecastDays];
        updatedDays[selectedDateIndex].loading = true;
        setForecastDays(updatedDays);
        
        fetchWeatherForDate(selectedDay.date).then(weatherData => {
          const updatedDays = [...forecastDays];
          updatedDays[selectedDateIndex].weatherData = weatherData;
          updatedDays[selectedDateIndex].loading = false;
          setForecastDays(updatedDays);
          
          // Generate daily breakdown for the selected date
          if (weatherData) {
            // Get forecast data for daily breakdown
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Manila&appid=${OPENWEATHER_API_KEY}&units=metric`)
              .then(response => response.json())
              .then(forecastData => {
                if (forecastData.cod === 200 || forecastData.cod === "200") {
                  const breakdown = generateDailyBreakdown(forecastData, selectedDay.date);
                  setDailyBreakdown(breakdown);
                  console.log('Daily breakdown for selected date:', breakdown);
                }
              })
              .catch(error => {
                console.log('Error fetching forecast for breakdown:', error);
              });
          }
        });
      } else if (selectedDay.weatherData) {
        // Date already has weather data, generate breakdown
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Manila&appid=${OPENWEATHER_API_KEY}&units=metric`)
          .then(response => response.json())
          .then(forecastData => {
            if (forecastData.cod === 200 || forecastData.cod === "200") {
              const breakdown = generateDailyBreakdown(forecastData, selectedDay.date);
              setDailyBreakdown(breakdown);
              console.log('Daily breakdown for existing date:', breakdown);
            }
          })
          .catch(error => {
            console.log('Error fetching forecast for breakdown:', error);
          });
      }
    }
  }, [selectedDateIndex, forecastDays]);

  const getWeatherIcon = (weatherCode: number) => {
    // Map OpenWeatherMap weather codes to Ionicons
    // Thunderstorm
    if (weatherCode >= 200 && weatherCode < 300) return 'thunderstorm';
    
    // Drizzle
    if (weatherCode >= 300 && weatherCode < 400) return 'rainy';
    
    // Rain
    if (weatherCode >= 500 && weatherCode < 600) return 'rainy';
    
    // Snow
    if (weatherCode >= 600 && weatherCode < 700) return 'snow';
    
    // Atmospheric conditions (fog, mist, etc.)
    if (weatherCode >= 700 && weatherCode < 800) return 'cloudy';
    
    // Clear sky
    if (weatherCode === 800) return 'sunny';
    
    // Cloud conditions
    if (weatherCode === 801) return 'partly-sunny'; // Few clouds (11-25%)
    if (weatherCode === 802) return 'partly-sunny'; // Scattered clouds (25-50%)
    if (weatherCode === 803) return 'cloudy'; // Broken clouds (51-84%)
    if (weatherCode === 804) return 'cloud'; // Overcast clouds (85-100%)
    
    return 'sunny';
  };

  const getWeatherIconColor = (weatherCode: number) => {
    // Thunderstorm - Dark blue
    if (weatherCode >= 200 && weatherCode < 300) return '#2C3E50';
    
    // Drizzle and Rain - Blue
    if (weatherCode >= 300 && weatherCode < 600) return '#4A90E2';
    
    // Snow - Light gray
    if (weatherCode >= 600 && weatherCode < 700) return '#9B9B9B';
    
    // Atmospheric conditions - Gray
    if (weatherCode >= 700 && weatherCode < 800) return '#7F8C8D';
    
    // Clear sky - Gold
    if (weatherCode === 800) return '#FFD700';
    
    // Cloud conditions
    if (weatherCode === 801) return '#F39C12'; // Orange for few clouds
    if (weatherCode === 802) return '#E67E22'; // Darker orange for scattered clouds
    if (weatherCode === 803) return '#95A5A6'; // Gray for broken clouds
    if (weatherCode === 804) return '#7F8C8D'; // Dark gray for overcast
    
    return '#FFD700'; // Default gold
  };

  const handleNavigation = (screen: string) => {
    setActiveNav(screen);
    // No need to navigate to separate pages anymore
  };

  // Price monitoring functions
  const fetchPriceData = async () => {
    setPriceLoading(true);
    setPriceError(null);

    try {
      console.log('🌾 Fetching DA Philippines daily retail prices...');
      
      // Fetch current prices from DA service
      const priceData = await daPriceService.getCurrentPrices(COMMODITY_DATA);
      
      // Fetch forecasts from DA service
      const forecastData = await daPriceService.getPriceForecasts(COMMODITY_DATA);
      
      console.log('📊 DA price data received:', priceData.length, 'items');
      console.log('🔮 DA forecast data received:', forecastData.length, 'items');
      
      // Update commodities with DA price data
      const updatedCommodities = commodities.map(commodity => {
        const price = priceData.find(p => p.commodityId === commodity.id);
        const forecast = forecastData.find(f => f.commodityId === commodity.id);
        
        if (price) {
          return updateCommodityWithDAPrices(commodity, price, forecast);
        }
        return commodity;
      });

      console.log('📊 Updated commodities sample:', {
        count: updatedCommodities.length,
        withPrices: updatedCommodities.filter(c => c.currentPrice).length,
        firstCommodity: updatedCommodities[0] ? {
          name: updatedCommodities[0].name,
          category: updatedCommodities[0].category,
          currentPrice: updatedCommodities[0].currentPrice,
          hasPrice: !!updatedCommodities[0].currentPrice
        } : null
      });
      
      setCommodities(updatedCommodities);
      setLastUpdated(new Date().toLocaleTimeString());
      console.log('✅ Successfully updated', updatedCommodities.length, 'commodities with DA data');
    } catch (error: any) {
      setPriceError(error.message || 'Failed to fetch DA price data');
      console.error('Error fetching DA price data:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const onPriceRefresh = async () => {
    setPriceRefreshing(true);
    await fetchPriceData();
    setPriceRefreshing(false);
  };

  const filteredCommodities = React.useMemo(() => {
    let filtered = commodities;
    
    // Filter by category first
    if (selectedCategory) {
      filtered = filtered.filter(commodity => commodity.category === selectedCategory);
    }
    
    // Filter by search query
    if (priceSearchQuery.trim()) {
      filtered = filtered.filter(commodity => 
        commodity.name.toLowerCase().includes(priceSearchQuery.toLowerCase().trim())
      );
    }
    
    return filtered;
  }, [selectedCategory, priceSearchQuery, commodities]);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  // Price monitoring render functions
  const renderCommodityItem = ({ item }: { item: Commodity }) => (
    <View style={styles.priceCommodityCard}>
      <View style={styles.priceCommodityHeader}>
        <View style={styles.priceCommodityInfo}>
          <Text style={styles.priceCommodityName}>{item.name}</Text>
          <Text style={styles.priceCommodityCategory}>{item.category}</Text>
        </View>
        <View style={styles.priceContainer}>
          {item.currentPrice ? (
            <>
              <Text style={styles.priceCurrentPrice}>₱{item.currentPrice.toFixed(2)}</Text>
              <Text style={styles.priceUnit}>/{item.unit}</Text>
            </>
          ) : (
            <Text style={styles.priceNoPriceText}>No data</Text>
          )}
        </View>
      </View>
      
      {item.priceChange !== undefined && (
        <View style={styles.priceChangeContainer}>
          <View style={[
            styles.priceChangeBadge,
            item.priceChange >= 0 ? styles.priceIncrease : styles.priceDecrease
          ]}>
            <Ionicons 
              name={item.priceChange >= 0 ? "trending-up" : "trending-down"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.priceChangeText}>
              {item.priceChange >= 0 ? '+' : ''}₱{Math.abs(item.priceChange).toFixed(2)} 
              ({item.priceChangePercent !== undefined && item.priceChangePercent >= 0 ? '+' : ''}{item.priceChangePercent?.toFixed(1) || '0.0'}%)
            </Text>
          </View>
        </View>
      )}

      {item.forecast && (
        <View style={styles.priceForecastContainer}>
          <Text style={styles.priceForecastTitle}>📈 Forecast</Text>
          <View style={styles.priceForecastGrid}>
            <View style={styles.priceForecastItem}>
              <Text style={styles.priceForecastLabel}>Next Week</Text>
              <Text style={styles.priceForecastPrice}>₱{item.forecast?.nextWeek?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.priceForecastItem}>
              <Text style={styles.priceForecastLabel}>Next Month</Text>
              <Text style={styles.priceForecastPrice}>₱{item.forecast?.nextMonth?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
          <View style={[
            styles.priceTrendBadge,
            item.forecast.trend === 'up' ? styles.priceTrendUp : 
            item.forecast.trend === 'down' ? styles.priceTrendDown : styles.priceTrendStable
          ]}>
            <Ionicons 
              name={
                item.forecast.trend === 'up' ? 'arrow-up' :
                item.forecast.trend === 'down' ? 'arrow-down' : 'remove'
              } 
              size={12} 
              color="#fff" 
            />
            <Text style={styles.priceTrendText}>
              {item.forecast.trend.toUpperCase()} TREND ({item.forecast.confidence}%)
            </Text>
          </View>
          
          {item.forecast.factors && item.forecast.factors.length > 0 && (
            <View style={styles.priceFactorsContainer}>
              <Text style={styles.priceFactorsTitle}>Key Factors:</Text>
              {item.forecast.factors.slice(0, 3).map((factor, index) => (
                <Text key={index} style={styles.priceFactorText}>• {factor}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {item.lastUpdated && (
        <Text style={styles.priceLastUpdated}>Updated: {item.lastUpdated}</Text>
      )}
    </View>
  );

  const renderCommodityModal = () => (
    <Modal
      visible={showCommodityModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCommodityModal(false)}
    >
      <View style={styles.priceModalOverlay}>
        <View style={styles.priceModalContent}>
          <View style={styles.priceModalHeader}>
            <Text style={styles.priceModalTitle}>Select Commodity</Text>
            <TouchableOpacity
              style={styles.priceModalCloseButton}
              onPress={() => setShowCommodityModal(false)}
            >
              <Ionicons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.priceModalScrollView}>
            {Object.values(COMMODITY_CATEGORIES).map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.priceModalItem,
                  selectedCategory === category && styles.priceModalItemActive
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCommodityModal(false);
                }}
              >
                <Ionicons 
                  name={
                    category === 'KADIWA RICE-FOR-ALL' ? 'leaf' :
                    category === 'IMPORTED COMMERCIAL RICE' ? 'leaf' :
                    category === 'LOCAL COMMERCIAL RICE' ? 'leaf' :
                    category === 'CORN' ? 'flower' :
                    category === 'FISH' ? 'fish' :
                    category === 'LIVESTOCK & POULTRY PRODUCTS' ? 'restaurant' :
                    category === 'LOWLAND VEGETABLES' ? 'nutrition' :
                    category === 'HIGHLAND VEGETABLES' ? 'nutrition' :
                    category === 'SPICES' ? 'flame' :
                    category === 'FRUITS' ? 'happy' : 'basket'
                  }
                  size={20} 
                  color={selectedCategory === category ? "#fff" : GREEN} 
                />
                <Text style={[
                  styles.priceModalItemText,
                  selectedCategory === category && styles.priceModalItemTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Top Green Border */}
      <View style={{ height: 36, width: '100%', backgroundColor: '#16543a', shadowColor: 'transparent', elevation: 0 }} />
      
      {/* Main Content */}
      {activeNav === 'home' && (
        <>
          {/* Fixed Sliding Announcement - Only on Home */}
          <SlidingAnnouncement />
        </>
      )}
      
      {activeNav === 'tutorial' ? (
        // Price Monitoring - Use FlatList directly without ScrollView wrapper
        <View style={[styles.priceMonitoringContainer, { paddingTop: 10 }]}>
          {/* Header */}
          <View style={styles.priceHeader}>
            <Text style={styles.priceHeaderTitle}>Price Monitoring</Text>
          </View>

          {/* Last Updated Info */}
          {lastUpdated && (
            <View style={styles.priceUpdateInfo}>
              <Ionicons name="time" size={16} color={LIGHT_GREEN} />
              <Text style={styles.priceUpdateText}>Last updated: {lastUpdated}</Text>
            </View>
          )}
          
          {/* Data Source Info */}
          <View style={styles.priceDataSourceInfo}>
            <Ionicons name="library" size={16} color={LIGHT_GREEN} />
            <Text style={styles.priceDataSourceText}>Data Source: DA Philippines Weekly Average Retail Prices (Seasonal Forecasts)</Text>
          </View>

          {/* Error Display */}
          {priceError && (
            <View style={styles.priceErrorContainer}>
              <Ionicons name="warning" size={20} color="#ff6b6b" />
              <Text style={styles.priceErrorText}>{priceError}</Text>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.priceSearchContainer}>
            <View style={styles.priceSearchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.priceSearchIcon} />
              <TextInput
                style={styles.priceSearchInput}
                placeholder="Search for a product..."
                placeholderTextColor="#999"
                value={priceSearchQuery}
                onChangeText={setPriceSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {priceSearchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.priceClearButton}
                  onPress={() => setPriceSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Buttons */}
          <View style={styles.priceFilterButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.priceFilterButton,
                selectedCategory === null && styles.priceFilterButtonActive
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Ionicons 
                name="apps" 
                size={20} 
                color={selectedCategory === null ? "#fff" : GREEN} 
              />
              <Text style={[
                styles.priceFilterButtonText,
                selectedCategory === null && styles.priceFilterButtonTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.priceFilterButton,
                selectedCategory !== null && styles.priceFilterButtonActive
              ]}
              onPress={() => setShowCommodityModal(true)}
            >
              <Ionicons 
                name="basket" 
                size={20} 
                color={selectedCategory !== null ? "#fff" : GREEN} 
              />
              <Text style={[
                styles.priceFilterButtonText,
                selectedCategory !== null && styles.priceFilterButtonTextActive
              ]}>
                {selectedCategory || 'Commodities'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Commodity List */}
          {priceLoading ? (
            <View style={styles.priceLoadingContainer}>
              <ActivityIndicator size="large" color={GREEN} />
              <Text style={styles.priceLoadingText}>Fetching latest prices...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCommodities}
              renderItem={renderCommodityItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.priceCommodityList, { paddingBottom: 100 }]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={priceRefreshing}
                  onRefresh={onPriceRefresh}
                  colors={[GREEN]}
                  tintColor={GREEN}
                />
              }
              ListEmptyComponent={
                <View style={styles.priceEmptyState}>
                  <Ionicons name="search" size={60} color={LIGHT_GREEN} />
                  <Text style={styles.priceEmptyTitle}>No commodities found</Text>
                  <Text style={styles.priceEmptySubtitle}>
                    {priceSearchQuery.trim() 
                      ? `No products found matching "${priceSearchQuery}"`
                      : selectedCategory 
                        ? `No commodities found in ${selectedCategory} category`
                        : 'Try selecting a different category or check your internet connection.'
                    }
                  </Text>
                </View>
              }
            />
          )}
          
          {/* Commodity Selection Modal */}
          {renderCommodityModal()}
        </View>
      ) : (
        // Home content - Use ScrollView
        <ScrollView style={[styles.content, { paddingTop: activeNav === 'home' ? 60 : 0 }]} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} tintColor={GREEN} />}>
        {/* Home Navigation Buttons */}
        {activeNav === 'home' && (
          <>
          <View style={styles.homeContainer}>

            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Welcome to</Text>
                
                {/* Centered Icon/Logo */}
                <View style={styles.centeredIconContainer}>
                  <View style={styles.centeredIcon}>
                    <Image source={require('../../assets/images/Logo.png')} style={styles.logoImage} />
                  </View>
                </View>
              </View>
            </View>
            
            <Text style={styles.heroDescription}>
              Access your agricultural tools and manage your farm efficiently
            </Text>
      
            {/* Agricultural Tools Section */}
            <View style={styles.toolsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Agricultural Tools</Text>
                <Text style={styles.sectionSubtitle}>Professional farming solutions</Text>
              </View>
              
              {/* Top Row - Tools & Communication */}
              <View style={styles.toolsRow}>
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => setActiveNav('forecast')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="trending-up" size={28} color={GREEN} />
          </View>
                  <Text style={styles.toolTitle}>Forecast Tool</Text>
                  <Text style={styles.toolDescription}>Weather & crop predictions</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => setActiveNav('announcements')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="megaphone" size={28} color={GREEN} />
                  </View>
                  <Text style={[styles.toolTitle, { fontSize: 14 }]}>Announcements</Text>
                  <Text style={[styles.toolDescription, { fontSize: 12 }]}>Farm updates & news</Text>
                </TouchableOpacity>
              </View>
              
              {/* Bottom Row - Reports */}
              <View style={styles.toolsRow}>
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/harvest-report')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="basket" size={28} color={GREEN} />
                  </View>
                  <Text style={styles.toolTitle}>Harvest Report</Text>
                  <Text style={styles.toolDescription}>Yield analysis & reports</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/planting-report')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="leaf" size={28} color={GREEN} />
                  </View>
                  <Text style={styles.toolTitle}>Planting Report</Text>
                  <Text style={styles.toolDescription}>Crop planning & tracking</Text>
                </TouchableOpacity>
              </View>
              
              {/* Messages - Centered */}
              <View style={styles.messagesContainer}>
                <TouchableOpacity 
                  style={[styles.toolCard, styles.centeredToolCard]}
                  onPress={() => setActiveNav('messages')}
                >
                  <View style={styles.toolIconContainer}>
                    <Ionicons name="chatbubbles" size={28} color={GREEN} />
                  </View>
                  <Text style={styles.toolTitle}>Messages</Text>
                  <Text style={styles.toolDescription}>Support & communication</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Requirements Section */}
            <View style={styles.quickAccessSection}>
              <Text style={styles.quickAccessTitle}>Requirements</Text>
                    <TouchableOpacity
                style={styles.quickAccessButton}
                onPress={() => router.push('/farmers')}
              >
                <Ionicons name="document-text" size={24} color={GREEN} />
                <Text style={styles.quickAccessText}>Complete Farmers Form</Text>
                <Ionicons name="chevron-forward" size={20} color={GREEN} />
              </TouchableOpacity>
            </View>
          </View>
          </>
        )}

        {/* Weather Forecast Section */}
        {activeNav === 'forecast' && (
          <View style={styles.forecastContainer}>
            <View style={styles.forecastHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveNav('home')}
              >
                <Ionicons name="arrow-back" size={24} color={GREEN} />
              </TouchableOpacity>
              <Text style={styles.forecastTitle}>Weather Forecast</Text>
              <TouchableOpacity 
                style={styles.weatherRefreshButton}
                onPress={() => fetchWeatherData()}
                disabled={loading}
              >
                <Ionicons 
                  name="refresh" 
                  size={24} 
                  color={loading ? '#ccc' : GREEN} 
                      />
                    </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="cloud-download" size={60} color={GREEN} />
                <Text style={styles.loadingText}>Loading weather data...</Text>
            </View>
            ) : weatherData ? (
              <View style={styles.weatherCard}>
                <View style={styles.currentWeather}>
                  <View style={styles.weatherIconContainer}>
                    <Ionicons 
                      name={getWeatherIcon(weatherData.weather[0].id)} 
                      size={60} 
                      color={getWeatherIconColor(weatherData.weather[0].id)} 
                    />
                  </View>
                  <View style={styles.weatherInfo}>
                    <Text style={styles.temperature}>
                      {Math.round(weatherData.main.temp)}°C
                    </Text>
                    <Text style={styles.weatherDescription}>
                      {weatherData.weather[0].description}
                    </Text>
                    <Text style={styles.location}>
                      {weatherData.name}, Philippines
                    </Text>
                  </View>
                </View>
                
                {/* Daily Weather Breakdown */}
                <View style={styles.dailyBreakdown}>
                  <Text style={styles.breakdownTitle}>Today's Weather</Text>
                  <View style={styles.breakdownContainer}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownTime}>Morning</Text>
                      <View style={styles.breakdownWeather}>
                        <Ionicons 
                          name={dailyBreakdown ? dailyBreakdown.morning.icon : 'sunny'} 
                          size={20} 
                          color={dailyBreakdown ? getWeatherIconColor(dailyBreakdown.morning.icon) : '#FFD700'} 
                        />
                        <Text style={styles.breakdownText}>
                          {dailyBreakdown ? dailyBreakdown.morning.weather : 'Sunny'}
                          {dailyBreakdown && !dailyBreakdown.morning.isRealData && ' (Est.)'}
                        </Text>
                      </View>
                      <Text style={styles.breakdownTemp}>
                        {dailyBreakdown ? dailyBreakdown.morning.temp : '28'}°C
                      </Text>
                    </View>
                    
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownTime}>Afternoon</Text>
                      <View style={styles.breakdownWeather}>
                        <Ionicons 
                          name={dailyBreakdown ? dailyBreakdown.afternoon.icon : 'partly-sunny'} 
                          size={20} 
                          color={dailyBreakdown ? getWeatherIconColor(dailyBreakdown.afternoon.icon) : '#FFD700'} 
                        />
                        <Text style={styles.breakdownText}>
                          {dailyBreakdown ? dailyBreakdown.afternoon.weather : 'Partly Cloudy'}
                          {dailyBreakdown && !dailyBreakdown.afternoon.isRealData && ' (Est.)'}
                        </Text>
                      </View>
                      <Text style={styles.breakdownTemp}>
                        {dailyBreakdown ? dailyBreakdown.afternoon.temp : '30'}°C
                      </Text>
                    </View>
                    
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownTime}>Evening</Text>
                      <View style={styles.breakdownWeather}>
                        <Ionicons 
                          name={dailyBreakdown ? dailyBreakdown.evening.icon : 'cloudy'} 
                          size={20} 
                          color={dailyBreakdown ? getWeatherIconColor(dailyBreakdown.evening.icon) : '#9B9B9B'} 
                        />
                        <Text style={styles.breakdownText}>
                          {dailyBreakdown ? dailyBreakdown.evening.weather : 'Cloudy'}
                          {dailyBreakdown && !dailyBreakdown.evening.isRealData && ' (Est.)'}
                        </Text>
                      </View>
                      <Text style={styles.breakdownTemp}>
                        {dailyBreakdown ? dailyBreakdown.evening.temp : '26'}°C
                      </Text>
                    </View>
                  </View>
                </View>
                

              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="cloud-offline" size={60} color="#e74c3c" />
                <Text style={styles.errorTitle}>Weather Data Unavailable</Text>
                <Text style={styles.errorMessage}>
                  Unable to fetch weather information. Please check your connection and try again.
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchWeatherData()}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {weatherData && (
              <>
                <View style={styles.forecastSection}>
                  <Text style={styles.forecastSectionTitle}>Weather Forecast</Text>
                  <Text style={styles.forecastSubtitle}>Slide through dates</Text>
                  
                  {/* Date Selector */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.dateSelector}
                    contentContainerStyle={styles.dateSelectorContent}
                  >
                    {forecastDays.slice(0, 30).map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dateButton,
                          selectedDateIndex === index && styles.selectedDateButton
                        ]}
                        onPress={() => setSelectedDateIndex(index)}
                      >
                        <Text style={[
                          styles.dateButtonText,
                          selectedDateIndex === index && styles.selectedDateButtonText
                        ]}>
                          {day.dayName}
                        </Text>
                        <Text style={[
                          styles.dateButtonDate,
                          selectedDateIndex === index && styles.selectedDateButtonText
                        ]}>
                          {day.dateString}
                        </Text>
                        {/* Show forecast availability indicator */}
                        <View style={[
                          styles.forecastIndicator,
                          index <= 5 ? styles.forecastAvailable : 
                          index <= 10 ? styles.forecastExtended : 
                          styles.forecastUnavailable
                        ]}>
                          <Text style={styles.forecastIndicatorText}>
                            {index <= 5 ? '✓' : index <= 10 ? '~' : '?'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Selected Date Weather */}
                  {forecastDays[selectedDateIndex] && (
                    <View style={styles.selectedDateWeather}>
                      <Text style={styles.selectedDateTitle}>
                        {forecastDays[selectedDateIndex].dateString}
                      </Text>
                      
                      {/* Date separator line */}
                      <View style={styles.dateSeparator} />
                      
                      {forecastDays[selectedDateIndex].loading ? (
                        <View style={styles.loadingWeather}>
                          <Ionicons name="cloud-download" size={40} color={GREEN} />
                          <Text style={styles.loadingWeatherText}>Loading weather...</Text>
        </View>
                      ) : forecastDays[selectedDateIndex].weatherData ? (
                        <>
                          {/* Weather Info */}
                          <View style={styles.forecastWeatherInfo}>
                            <View style={styles.forecastWeatherIcon}>
                              <Ionicons 
                                name={getWeatherIcon(forecastDays[selectedDateIndex].weatherData!.weather[0].id)} 
                                size={60} 
                                color={getWeatherIconColor(forecastDays[selectedDateIndex].weatherData!.weather[0].id)} 
                              />
                            </View>
                            <View style={styles.forecastWeatherText}>
                              <Text style={styles.forecastTemperature}>
                                {Math.round(forecastDays[selectedDateIndex].weatherData!.main.temp)}°C
                              </Text>
                              <Text style={styles.forecastDescription}>
                                {forecastDays[selectedDateIndex].weatherData!.weather[0].description}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Daily Weather Breakdown for Forecast */}
                          <View style={styles.forecastBreakdown}>
                            <Text style={styles.breakdownTitle}>Daily Breakdown</Text>
                            <View style={styles.breakdownContainer}>
                              <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownTime}>Morning</Text>
                                <View style={styles.breakdownWeather}>
                                  <Ionicons 
                                    name={dailyBreakdown ? dailyBreakdown.morning.icon : 'sunny'} 
                                    size={20} 
                                    color={dailyBreakdown ? getWeatherIconColor(dailyBreakdown.morning.icon) : '#FFD700'} 
                                  />
                                  <Text style={styles.breakdownText}>
                                    {dailyBreakdown ? dailyBreakdown.morning.weather : 'Sunny'}
                                    {dailyBreakdown && !dailyBreakdown.morning.isRealData && ' (Est.)'}
                                  </Text>
                                </View>
                                <Text style={styles.breakdownTemp}>
                                  {dailyBreakdown ? dailyBreakdown.morning.temp : '28'}°C
                                </Text>
                              </View>
                              
                              <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownTime}>Afternoon</Text>
                                <View style={styles.breakdownWeather}>
                                  <Ionicons 
                                    name={dailyBreakdown ? dailyBreakdown.afternoon.icon : 'partly-sunny'} 
                                    size={20} 
                                    color={dailyBreakdown ? getWeatherIconColor(dailyBreakdown.afternoon.icon) : '#FFD700'} 
                                  />
                                  <Text style={styles.breakdownText}>
                                    {dailyBreakdown ? dailyBreakdown.afternoon.weather : 'Partly Cloudy'}
                                    {dailyBreakdown && !dailyBreakdown.afternoon.isRealData && ' (Est.)'}
                                  </Text>
                                </View>
                                <Text style={styles.breakdownTemp}>
                                  {dailyBreakdown ? dailyBreakdown.afternoon.temp : '30'}°C
                                </Text>
                              </View>
                              
                              <View style={styles.breakdownItem}>
                                <Text style={styles.breakdownTime}>Evening</Text>
                                <View style={styles.breakdownWeather}>
                                  <Ionicons 
                                    name={dailyBreakdown ? dailyBreakdown.evening.icon : 'cloudy'} 
                                    size={20} 
                                    color={dailyBreakdown ? getWeatherIconColor(dailyBreakdown.evening.icon) : '#9B9B9B'} 
                                  />
                                  <Text style={styles.breakdownText}>
                                    {dailyBreakdown ? dailyBreakdown.evening.weather : 'Cloudy'}
                                    {dailyBreakdown && !dailyBreakdown.evening.isRealData && ' (Est.)'}
                                  </Text>
                                </View>
                                <Text style={styles.breakdownTemp}>
                                  {dailyBreakdown ? dailyBreakdown.evening.temp : '26'}°C
                                </Text>
                              </View>
                            </View>
                          </View>
                          

                        </>
                      ) : (
                        <View style={styles.noWeatherData}>
                          <Ionicons name="cloud-offline" size={40} color="#ccc" />
                          <Text style={styles.noWeatherDataText}>Weather data not available for this date</Text>
                          <Text style={styles.noWeatherDataSubtext}>
                            OpenWeatherMap provides forecasts up to 5 days ahead with extended estimates for days 6-10
                          </Text>
                          <View style={styles.forecastLimits}>
                            <Text style={styles.forecastLimitsTitle}>Forecast Availability:</Text>
                            <Text style={styles.forecastLimitsText}>• Days 1-5: Real-time API forecasts ✓</Text>
                            <Text style={styles.forecastLimitsText}>• Days 6-10: Extended estimates ~</Text>
                            <Text style={styles.forecastLimitsText}>• Beyond 10 days: No data available ?</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.agriculturalAdvice}>
                  <Text style={styles.adviceTitle}>Agricultural Advice</Text>
                  <View style={styles.adviceCard}>
                    <Ionicons name="leaf" size={24} color={GREEN} />
                    <Text style={styles.adviceText}>
                      Current weather conditions are favorable for outdoor farming activities. 
                      Consider planting drought-resistant crops and ensure proper irrigation.
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Search Section */}
        {activeNav === 'search' && (
          <View style={styles.searchContainer}>
            {/* Search Header */}
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Search Features</Text>
              <Text style={styles.searchSubtitle}>Find and access app features quickly</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search features..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearch('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search Results */}
            {searchQuery.length > 0 ? (
              <View style={styles.searchResultsContainer}>
                {searchResults.length > 0 ? (
                  <>
                    <Text style={styles.resultsTitle}>
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </Text>
                    {searchResults.map((feature, index) => (
                      <TouchableOpacity
                        key={feature.id}
                        style={styles.searchResultItem}
                        onPress={feature.action}
                        activeOpacity={0.7}
                      >
                        <View style={styles.resultIconContainer}>
                          <Ionicons name={feature.icon as any} size={24} color={GREEN} />
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultTitle}>{feature.title}</Text>
                          <Text style={styles.resultDescription}>{feature.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search" size={48} color="#ccc" />
                    <Text style={styles.noResultsTitle}>No results found</Text>
                    <Text style={styles.noResultsText}>
                      Try searching for "forecast", "profile", "notifications", or other features
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.allFeaturesContainer}>
                <Text style={styles.allFeaturesTitle}>All Features</Text>
                {searchableFeatures.map((feature, index) => (
                  <TouchableOpacity
                    key={feature.id}
                    style={styles.featureItem}
                    onPress={feature.action}
                    activeOpacity={0.7}
                  >
                    <View style={styles.featureIconContainer}>
                      <Ionicons name={feature.icon as any} size={24} color={GREEN} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Announcements Section */}
        {activeNav === 'announcements' && (
          <View style={styles.profileContainer}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="megaphone" size={50} color={GREEN} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Announcements</Text>
                <Text style={styles.profileEmail}>Stay updated with latest news</Text>
                <Text style={styles.profileRole}>Important Updates</Text>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsTitle}>Admin Announcements</Text>
              
              {announcementsLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={40} color={GREEN} />
                  <Text style={styles.loadingText}>Loading announcements...</Text>
                </View>
              ) : announcementsError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={40} color="#e74c3c" />
                  <Text style={styles.errorTitle}>Error Loading Announcements</Text>
                  <Text style={styles.errorMessage}>{announcementsError}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={loadAnnouncements}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : announcements.length > 0 ? (
                announcements.map((announcement, index) => (
                  <View key={index} style={styles.announcementCard}>
                    <View style={styles.announcementHeader}>
                      <Ionicons name={announcement.icon || "megaphone"} size={20} color={GREEN} />
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      <Text style={styles.announcementDate}>{announcement.date}</Text>
                    </View>
                    <Text style={styles.announcementContent}>
                      {announcement.content}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.noAnnouncementsContainer}>
                  <Ionicons name="megaphone-outline" size={64} color="#ccc" />
                  <Text style={styles.noAnnouncementsTitle}>No Announcements Yet</Text>
                  <Text style={styles.noAnnouncementsText}>
                    When the admin sends announcements, they will appear here. Check back later for important updates and news.
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={loadAnnouncements}
                  >
                    <Ionicons name="refresh" size={20} color={GREEN} />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Messages Section */}
        {activeNav === 'messages' && (
          <View style={styles.profileContainer}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="chatbubbles" size={50} color={GREEN} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Messages</Text>
                <Text style={styles.profileEmail}>Communicate with support</Text>
                <Text style={styles.profileRole}>Support Center</Text>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsTitle}>Messages</Text>
              
              {userMessages.length > 0 ? (
                userMessages.map((contact) => (
                  <TouchableOpacity 
                    key={contact.contactId} 
                    style={styles.messageCard}
                    onPress={() => router.push(`/user-chat?contactId=${contact.contactId}&contactName=${encodeURIComponent(contact.contactName)}&contactEmail=${encodeURIComponent(contact.contactEmail)}`)}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.messageAvatar}>
                        <Ionicons name="person" size={20} color="#fff" />
                      </View>
                      <View style={styles.messageInfo}>
                        <Text style={styles.messageSender}>{contact.contactName}</Text>
                        <Text style={styles.messageTime}>
                          {contact.lastMessage.createdAt ? new Date(contact.lastMessage.createdAt).toLocaleDateString() : 'Unknown'}
                        </Text>
                      </View>
                      {contact.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{contact.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.messagePreview}>
                      {contact.lastMessage.content}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noMessagesContainer}>
                  <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                  <Text style={styles.noMessagesTitle}>No Messages Yet</Text>
                  <Text style={styles.noMessagesText}>
                    When you or the admin send messages, they will appear here. Start a conversation by sending a message.
                  </Text>
                  
                </View>
              )}

              <TouchableOpacity style={styles.newMessageButton}>
                <Ionicons name="add-circle" size={24} color={GREEN} />
                <Text style={styles.newMessageText}>Send New Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile Section */}
        {activeNav === 'profile' && (
          <View style={styles.profileContainer}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                {profile.profileImage ? (
                  <Image source={{ uri: profile.profileImage }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                ) : (
                  <Ionicons name="person" size={50} color={GREEN} />
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile?.name || user?.displayName || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                <Text style={styles.profileRole}> Farmer </Text>
              </View>
            </View>

            {/* Settings Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsTitle}>Settings & Preferences</Text>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/notifications')}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="notifications" size={24} color={GREEN} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingDescription}>Manage alert preferences</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>


              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/privacy')}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color={GREEN} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Privacy & Security</Text>
                  <Text style={styles.settingDescription}>Account security settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/language')}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="language" size={24} color={GREEN} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingDescription}>English (US)</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/help')}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="help-circle" size={24} color={GREEN} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Help & Support</Text>
                  <Text style={styles.settingDescription}>Get assistance</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/about')}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="information-circle" size={24} color={GREEN} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>About</Text>
                  <Text style={styles.settingDescription}>App version & info</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="log-out" size={24} color="#e74c3c" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Sign Out</Text>
                  <Text style={styles.settingDescription}>Logout from your account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Commodity Selection Modal */}
        {renderCommodityModal()}
        </ScrollView>
      )}
      
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
          <TouchableOpacity
          style={[styles.navItem, activeNav === 'home' && styles.activeNavItem]} 
          onPress={() => handleNavigation('home')}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeNav === 'home' ? GREEN : '#666'} 
          />
          <Text style={[
            styles.navText, 
            activeNav === 'home' && styles.activeNavText
          ]}>
            Home
          </Text>
          </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeNav === 'tutorial' && styles.activeNavItem]} 
          onPress={() => handleNavigation('tutorial')}
        >
          <Ionicons 
            name="trending-up" 
            size={24} 
            color={activeNav === 'tutorial' ? GREEN : '#666'} 
          />
          <Text style={[
            styles.navText, 
            activeNav === 'tutorial' && styles.activeNavText
          ]}>
            Price Monitoring
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeNav === 'search' && styles.activeNavItem]} 
          onPress={() => handleNavigation('search')}
        >
          <Ionicons 
            name="search" 
            size={24} 
            color={activeNav === 'search' ? GREEN : '#666'} 
          />
          <Text style={[
            styles.navText, 
            activeNav === 'search' && styles.activeNavText
          ]}>
            Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeNav === 'profile' && styles.activeNavItem]} 
          onPress={() => handleNavigation('profile')}
        >
          <Ionicons 
            name="person" 
            size={24} 
            color={activeNav === 'profile' ? GREEN : '#666'} 
          />
          <Text style={[
            styles.navText, 
            activeNav === 'profile' && styles.activeNavText
          ]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBorder: {
    height: 12,
    width: '100%',
    backgroundColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  homeContainer: {
    marginTop: 20,
    paddingBottom: 120, // Increased padding to ensure Requirements section is fully visible above bottom navigation
  },
  heroSection: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  heroContent: {
    flex: 1,
    marginRight: 0,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: LIGHT_GREEN,
    marginBottom: 15,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
  },
  heroIconContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#e0f2e0',
  },
  heroIcon: {
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  centeredIcon: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  toolsSection: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  messagesContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 140,
  },
  centeredToolCard: {
    alignSelf: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  toolIconContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 35,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#d0e8d0',
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  toolDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  quickAccessSection: {
    backgroundColor: '#fff',
    padding: 25,
    paddingBottom: 30, // Extra bottom padding for better visibility
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 20, // Additional margin to separate from bottom navigation
  },
  quickAccessTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f8f0',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0f2e0',
  },
  quickAccessText: {
    fontSize: 17,
    fontWeight: '600',
    color: GREEN,
    marginLeft: 15,
    flex: 1,
  },
  profileContainer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: LIGHT_GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 14,
    color: LIGHT_GREEN,
    fontWeight: '600',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  searchContainer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  searchHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  searchSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  searchBarContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 15,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#e0f2e0',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  allFeaturesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  allFeaturesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#e0f2e0',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e0f2e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingContent: {
    flex: 1,
    marginLeft: 20,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  settingDescription: {
    fontSize: 14,
    color: '#555',
    fontWeight: '400',
    lineHeight: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 12,
    paddingBottom: 20, // Extra bottom padding for safe area
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    // Active state styling
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  activeNavText: {
    color: GREEN,
    fontWeight: '600',
  },
  forecastContainer: {
    marginTop: 20,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
  },
  forecastTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    flex: 1,
  },
  weatherRefreshButton: {
    padding: 10,
  },
  weatherCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weatherIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  weatherInfo: {
    marginLeft: 20,
    flex: 1,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 8,
  },
  weatherDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_GREEN,
    marginBottom: 8,
    textAlign: 'center',
  },
  location: {
    fontSize: 16,
    color: '#555',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  weatherDetail: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  forecastSection: {
    marginBottom: 25,
  },
  forecastSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  forecastSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateSelector: {
    height: 100,
    marginBottom: 20,
  },
  dateSelectorContent: {
    alignItems: 'center',
  },
  dateButton: {
    backgroundColor: '#f0f8f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: '#e0f2e0',
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    marginBottom: 5,
  },
  selectedDateButtonText: {
    color: '#fff',
  },
  dateButtonDate: {
    fontSize: 14,
    color: '#555',
  },
  selectedDateWeather: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedDateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  loadingWeather: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingWeatherText: {
    fontSize: 18,
    color: GREEN,
    marginTop: 15,
  },
  noWeatherData: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noWeatherDataText: {
    fontSize: 18,
    color: '#555',
    marginTop: 15,
  },
  noWeatherDataSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  agriculturalAdvice: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  adviceTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0f2e0',
  },
  adviceText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 15,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 18,
    color: GREEN,
    marginTop: 15,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  errorMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: GREEN,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  forecastIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  forecastAvailable: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  forecastExtended: {
    backgroundColor: '#FFD700', // Gold for extended forecast
    borderColor: '#FFD700',
  },
  forecastUnavailable: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  forecastIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  forecastLimits: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f8f0',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0f2e0',
    alignSelf: 'center',
  },
  forecastLimitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  forecastLimitsText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    lineHeight: 20,
  },
  dailyBreakdown: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  breakdownItem: {
    alignItems: 'center',
    width: '32%',
    paddingHorizontal: 5,
  },
  breakdownTime: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  breakdownWeather: {
    alignItems: 'center',
    marginBottom: 5,
  },
  breakdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: LIGHT_GREEN,
    textAlign: 'center',
    marginTop: 3,
    width: '100%',
  },
  breakdownTemp: {
    fontSize: 18,
    fontWeight: '800',
    color: GREEN,
  },
  forecastWeatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  forecastWeatherIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#e0f2e0',
  },
  forecastWeatherText: {
    marginLeft: 20,
    flex: 1,
  },
  forecastTemperature: {
    fontSize: 48,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 8,
  },
  forecastDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_GREEN,
    textAlign: 'center',
    marginTop: 5,
  },
  forecastBreakdown: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastWeatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  dateSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  // Announcement styles
  announcementCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN,
    marginLeft: 8,
    flex: 1,
  },
  announcementDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  announcementContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Message styles
  messageCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageSender: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GREEN,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  newMessageText: {
    fontSize: 16,
    color: GREEN,
    fontWeight: '600',
    marginLeft: 8,
  },
  // No announcements styles
  noAnnouncementsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noAnnouncementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  noAnnouncementsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // No messages styles
  noMessagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noMessagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  noMessagesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GREEN,
    marginTop: 20,
  },
  refreshButtonText: {
    fontSize: 14,
    color: GREEN,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Price monitoring styles
  priceMonitoringContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  priceHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  priceHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
  },
  priceUpdateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#f0f8f0',
  },
  priceUpdateText: {
    fontSize: 12,
    color: LIGHT_GREEN,
    marginLeft: 6,
    fontWeight: '500',
  },
  priceDataSourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f0f8f0',
  },
  priceDataSourceText: {
    fontSize: 11,
    color: GREEN,
    marginLeft: 4,
    fontWeight: '500',
  },
  priceErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffb3b3',
  },
  priceErrorText: {
    fontSize: 14,
    color: '#d63031',
    marginLeft: 8,
    flex: 1,
  },
  priceSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  priceSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priceSearchIcon: {
    marginRight: 10,
  },
  priceSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  priceClearButton: {
    padding: 5,
    marginLeft: 10,
  },
  priceFilterButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'space-between',
  },
  priceFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIGHT_GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 0.48,
    justifyContent: 'center',
  },
  priceFilterButtonActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  priceFilterButtonText: {
    fontSize: 16,
    color: GREEN,
    marginLeft: 8,
    fontWeight: '600',
  },
  priceFilterButtonTextActive: {
    color: '#fff',
  },
  priceLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  priceLoadingText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
  },
  priceCommodityList: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
    flexGrow: 1,
  },
  priceCommodityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  priceCommodityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceCommodityInfo: {
    flex: 1,
  },
  priceCommodityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f3d2a',
    marginBottom: 4,
  },
  priceCommodityCategory: {
    fontSize: 14,
    color: LIGHT_GREEN,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceCurrentPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: GREEN,
  },
  priceUnit: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceNoPriceText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  priceChangeContainer: {
    marginBottom: 12,
  },
  priceChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priceIncrease: {
    backgroundColor: '#e8f5e8',
  },
  priceDecrease: {
    backgroundColor: '#ffeaea',
  },
  priceChangeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: GREEN,
  },
  priceForecastContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  priceForecastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f3d2a',
    marginBottom: 12,
  },
  priceForecastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceForecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceForecastLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  priceForecastPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  priceTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  priceTrendUp: {
    backgroundColor: '#4caf50',
  },
  priceTrendDown: {
    backgroundColor: '#f44336',
  },
  priceTrendStable: {
    backgroundColor: '#ff9800',
  },
  priceTrendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  priceFactorsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceFactorsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f3d2a',
    marginBottom: 4,
  },
  priceFactorText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    lineHeight: 16,
  },
  priceLastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
  priceEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  priceEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f3d2a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  priceEmptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  priceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  priceModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  priceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  priceModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  priceModalCloseButton: {
    padding: 5,
  },
  priceModalScrollView: {
    maxHeight: 400,
  },
  priceModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceModalItemActive: {
    backgroundColor: '#f0f8f0',
  },
  priceModalItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  priceModalItemTextActive: {
    color: GREEN,
    fontWeight: '600',
  },

});
