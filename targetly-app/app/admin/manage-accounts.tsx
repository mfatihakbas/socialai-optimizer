import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator,
  Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const getApiBaseUrl = (): string => {
  const apiUrlFromConfig = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof apiUrlFromConfig === 'string' && apiUrlFromConfig) {
    return apiUrlFromConfig;
  }
  console.warn("API_BASE_URL not found in app.json's extra or is undefined. Please check.");
  return 'http://YOUR_FALLBACK_URL_OR_THROW_ERROR'; // Güncelleyin!
};
const API_BASE_URL = getApiBaseUrl();

type ManagedInstagramAccount = {
  id: string; // Bu, Instagram'ın User ID'si olmalı
  name: string; // "TCS Yazılım" gibi bir isim
  managerName: string | null;
  creatorName: string | null;
  instagramUserId?: string; // Backend'den bu da gelebilir veya id ile aynı olabilir
};

export default function ManageAccountsScreen() {
  const router = useRouter();
  const [accountInfo, setAccountInfo] = useState<ManagedInstagramAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMainAccountInfo = async () => {
      if (!API_BASE_URL || API_BASE_URL === 'http://YOUR_FALLBACK_URL_OR_THROW_ERROR') {
        Alert.alert('Config Error', "API URL not set.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Backend /api/managed-instagram-accounts endpoint'i tek elemanlı bir liste döndürmeli
        const response = await axios.get(`${API_BASE_URL}/api/managed-instagram-accounts`);
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setAccountInfo(response.data[0]); // Listenin ilk (ve tek) elemanını al
        } else {
          setAccountInfo(null);
          console.log("No account data received or data is not an array:", response.data);
          Alert.alert("Info", "No account information found from server.");
        }
      } catch (error: any) {
        console.error("Error fetching main account info:", error);
        Alert.alert("Error", `Could not fetch account information. ${error.message || ''}`);
        setAccountInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMainAccountInfo();
  }, []);


  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.homeButton} onPress={() => router.canGoBack() ? router.back() : router.push('/screen/AdminDashboard')}>
        <Text style={styles.homeButtonText}>🏠 Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>📱 Managed Instagram Account</Text>

      {accountInfo ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{accountInfo.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.detailLabel}>Instagram User ID:</Text>
            <Text style={styles.cardDetailValue}>{accountInfo.instagramUserId || accountInfo.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.detailLabel}>Assigned Manager:</Text>
            <Text style={styles.cardDetailValue}>{accountInfo.managerName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.detailLabel}>Assigned Content Creator:</Text>
            <Text style={styles.cardDetailValue}>{accountInfo.creatorName || 'N/A'}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.noDataText}>
            No account information to display.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    paddingVertical: 10, // Artırdım
    paddingHorizontal: 15, // Artırdım
    backgroundColor: '#e9ecef',
    borderRadius: 25, // Daha yuvarlak
    zIndex: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  homeButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600', // Biraz daha kalın
  },
  title: {
    fontSize: 26, // Başlığı büyüttüm
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1e293b',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#dee2e6', // Daha yumuşak border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4, }, // Gölgeyi artırdım
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22, // Hesap adı daha büyük
    fontWeight: 'bold',
    color: '#007bff', // Marka rengiyle uyumlu
    marginBottom: 20,
    textAlign: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoRow: { // Her bir bilgi satırı için
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  detailLabel: { // "Manager:", "Content Creator:" gibi etiketler
    fontSize: 16,
    fontWeight: '600',
    color: '#495057', // Biraz daha koyu
  },
  cardDetailValue: { // Asıl değer (isim, ID)
    fontSize: 16,
    color: '#343a40', // Değerler için daha koyu
    textAlign: 'right', // Sağa yaslı
    flexShrink: 1, // Uzunsa sığması için
  },
  noDataText: {
    fontSize: 17, // Biraz daha büyük
    color: '#6c757d',
    textAlign: 'center',
  },
});