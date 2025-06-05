import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Gelecekte kullanıcı ID'si için

// API_BASE_URL'yi almak için helper fonksiyonu
const getApiBaseUrl = (): string => {
  const apiUrlFromConfig = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof apiUrlFromConfig === 'string' && apiUrlFromConfig) {
    return apiUrlFromConfig;
  }
  console.warn("API_BASE_URL not found in app.json's extra or is undefined. Please check.");
  return 'http://YOUR_FALLBACK_URL_OR_THROW_ERROR'; // Güncelleyin!
};
const API_BASE_URL = getApiBaseUrl();

type UserProfile = {
  full_name: string;
  email: string;
};

export default function SettingsScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); // Giriş yapmış kullanıcı ID'si

  useEffect(() => {
    const initializeScreen = async () => {
      // GERÇEK UYGULAMADA: Giriş yapmış kullanıcının ID'sini AsyncStorage veya Context'ten al
      // Örnek:
      // const storedUserId = await AsyncStorage.getItem('loggedInUserId');
      // const storedUserFullName = await AsyncStorage.getItem('loggedInUserFullName');
      // const storedUserEmail = await AsyncStorage.getItem('loggedInUserEmail');

      // if (storedUserId && storedUserFullName && storedUserEmail) {
      //   const userId = parseInt(storedUserId, 10);
      //   setCurrentUserId(userId);
      //   // Eğer profil bilgileri zaten AsyncStorage'de varsa, API çağrısı yapmadan kullanabilirsiniz.
      //   // Veya her seferinde API'den çekmek isteyebilirsiniz.
      //   setProfile({ full_name: storedUserFullName, email: storedUserEmail });
      //   setLoadingProfile(false); 
      //   // fetchUserProfile(userId); // Ya da her seferinde API'den çek
      // } else {
      //   Alert.alert("Authentication Error", "User not logged in. Redirecting to login.");
      //   router.replace('/screen/LoginScreen');
      //   setLoadingProfile(false);
      // }

      // ŞİMDİLİK TEST İÇİN SABİT KULLANICI ID'Sİ (Admin kullanıcısı için ID 1)
      // VE LOGIN'DEN GELEN BİLGİLERİ KULLANDIĞIMIZI VARSAYALIM
      // Login sonrası bu bilgiler (id, full_name, email) AsyncStorage'e kaydedilmeli.
      // Ve burada okunmalı.
      const testUserId = 1; // Bu, login'den gelen ID olmalı
      setCurrentUserId(testUserId);
      // Profil bilgilerini de login'den gelen bilgilerle doğrudan set edebiliriz
      // VEYA /api/profile/user/:id endpoint'inden çekebiliriz.
      // Şimdilik login'den geldiğini varsayalım (bu daha az API çağrısı demek)
      // setProfile({ full_name: 'Fatih Akbaş (from Login)', email: 'admin@targetly.ai (from Login)' });
      // setLoadingProfile(false);
      // VEYA API'den çekelim:
      fetchUserProfile(testUserId);
    };

    initializeScreen();
  }, []);

  const fetchUserProfile = async (userIdToFetch: number) => {
    if (!API_BASE_URL || API_BASE_URL === 'http://YOUR_FALLBACK_URL_OR_THROW_ERROR') {
      Alert.alert('Config Error', "API URL not set.");
      setLoadingProfile(false);
      return;
    }
    if (!userIdToFetch) {
        Alert.alert('Error', "User ID is missing for profile fetch.");
        setLoadingProfile(false);
        return;
    }

    setLoadingProfile(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profile/user/${userIdToFetch}`);
      setProfile(response.data);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      let errorMessage = "Could not fetch profile information.";
      if (error.response) {
        errorMessage += ` (Server: ${error.response.data?.error || error.response.data?.message || error.message})`;
      } else {
        errorMessage += ` (${error.message || 'Network error'})`;
      }
      Alert.alert("Error", errorMessage);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    // Gerçek uygulamada token/session ve AsyncStorage'deki kullanıcı bilgileri temizlenir.
    // await AsyncStorage.multiRemove(['loggedInUserId', 'userToken', 'userFullName', 'userEmail', 'userRole']);
    router.replace('/screen/LoginScreen');
    Alert.alert("Logged Out", "You have been successfully logged out.");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.canGoBack() ? router.back() : router.push('/screen/AdminDashboard')}>
          <Text style={styles.homeButtonText}>🏠 Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.title}>⚙️ My Settings</Text>

        {/* My Account Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>My Profile</Text>
          {loadingProfile ? (
            <ActivityIndicator size="small" color="#007bff" style={{ marginVertical: 20 }}/>
          ) : profile ? (
            <>
              <View style={styles.profileInfoRow}>
                <Text style={styles.profileLabel}>Name:</Text>
                <Text style={styles.profileValue}>{profile.full_name}</Text>
              </View>
              <View style={styles.profileInfoRow}>
                <Text style={styles.profileLabel}>Email:</Text>
                <Text style={styles.profileValue}>{profile.email}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.profileValue}>Could not load profile information. Please try again later.</Text>
          )}
          {/* Edit Profile ve Change Password butonları şimdilik placeholder */}
          <TouchableOpacity style={styles.linkButton} onPress={() => Alert.alert("Edit Profile", "Profile editing functionality to be implemented.")}>
            <Text style={styles.linkButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => Alert.alert("Change Password", "Password change functionality to be implemented.")}>
            <Text style={styles.linkButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences ve About & Support bölümleri kaldırıldı */}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🔓 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f0f4f8',
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
  },
  homeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    zIndex: 1,
  },
  homeButtonText: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#1a202c',
    textAlign: 'center',
  },
  sectionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#4a5568",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  profileLabel: {
    fontSize: 16,
    color: '#718096',
  },
  profileValue: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
  },
  linkButton: {
    paddingVertical: 12,
    // Son link butonu için borderBottom olmasın diye kontrol edilebilir veya hepsi için kaldırılabilir
    // borderBottomWidth: 1, 
    // borderBottomColor: '#f7fafc',
    marginTop: 5, // Butonlar arası boşluk
  },
  linkButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  // Preferences ve About & Support ile ilgili stiller (preferenceRow, appInfoRow, appInfoText) kaldırıldı.
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#e53e3e',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25, // Diğer kartla arasında boşluk
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});