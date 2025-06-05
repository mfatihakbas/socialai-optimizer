import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, FlatList,
  Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const getApiBaseUrl = (): string => {
  const apiUrlFromConfig = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof apiUrlFromConfig === 'string' && apiUrlFromConfig) {
    return apiUrlFromConfig;
  }
  console.warn("API_BASE_URL not found in app.json's extra or is undefined. Please check.");
  // GERÇEK API URL'niz ile değiştirin veya app.json'da ayarlayın
  return 'http://YOUR_ACTUAL_API_URL';
};
const API_BASE_URL = getApiBaseUrl();

// account_manager_routes.py'den gelen 'latestPosts' için tip
type LatestPostDetail = {
  id: string; // instagram_post_id
  caption_cleaned: string;
  timestamp: string; // ISO formatında string
  media_type: string;
  like_count: number;
  comments_count: number;
  // Bu endpoint'ten reach, impressions, engagement_rate gelmiyor
};

// account_manager_routes.py'den gelen demografi verileri için tipler
type DemographicDetail = {
  dimension: string;
  value: number;
};

type DemographicsData = {
  topCountries: DemographicDetail[];
  genderDistribution: DemographicDetail[];
  ageGroups: DemographicDetail[];
};

// account_manager_routes.py'nin döndürdüğü payload'a uygun ana veri tipi
type AccountManagerDashboardData = {
  accountName: string;
  totalFollowers: number;
  recentPostsCount: number; // Son 7 gün
  avgLikesPerPost: number;  // Son 7 gün
  avgCommentsPerPost: number; // Son 7 gün
  recentReach: number;      // Son 7 gün
  recentImpressions: number; // Son 7 gün
  latestPosts: LatestPostDetail[]; // Son 5 gönderi
  demographics: DemographicsData;
};

// Ekranın adı ContentCreatorDashboardScreen kalsa da, içeriği artık Account Manager'a göre.
// İdealde bu dosyanın adı AccountManagerDashboardScreen.tsx olmalı.
export default function ContentCreatorDashboardScreen() {
  const router = useRouter();
  // State tipini AccountManagerDashboardData olarak güncelledik
  const [dashboardData, setDashboardData] = useState<AccountManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  // Bu ID hala yönetilen Instagram hesabının ID'si olacak
  const [managedAccountId, setManagedAccountId] = useState<string | null>(null);

  useEffect(() => {
    const accountIdFromConfig = Constants.expoConfig?.extra?.mainInstagramAccountId as string | undefined;
    if (accountIdFromConfig) {
      setManagedAccountId(accountIdFromConfig);
      console.log("Dashboard için IG Hesap ID:", accountIdFromConfig);
    } else {
      Alert.alert("Config Error", "mainInstagramAccountId app.json'da bulunamadı veya geçerli değil!");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!managedAccountId) {
      return;
    }
    if (!API_BASE_URL || API_BASE_URL === 'http://YOUR_ACTUAL_API_URL' || API_BASE_URL.includes('YOUR_FALLBACK_URL')) {
        Alert.alert('Config Error', "API URL is not configured correctly. Please check your setup.");
        setLoading(false);
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // API ENDPOINT YOLUNU GÜNCELLEDİK
        const endpoint = `${API_BASE_URL}/api/account-manager/dashboard-data/${managedAccountId}`;
        console.log("Fetching Account Manager data from:", endpoint);
        // Yanıt tipini AccountManagerDashboardData olarak güncelledik
        const response = await axios.get<AccountManagerDashboardData>(endpoint);
        
        console.log("Backend response data (Account Manager):", JSON.stringify(response.data, null, 2));
        setDashboardData(response.data);

      } catch (error: any) {
        console.error(`Error fetching AM dashboard data for account ${managedAccountId}:`, error.response?.data || error.message || error);
        Alert.alert(
          "Fetch Error",
          `Could not fetch dashboard data. ${error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error'}`
        );
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [managedAccountId]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?",
      [{ text: "Cancel", style: "cancel" },
       { text: "Logout", style: "destructive", onPress: () => router.replace('/screen/LoginScreen') }]
    );
  };

  // renderPostCard'ı LatestPostDetail tipine göre güncelledik
  const renderPostCard = ({ item }: { item: LatestPostDetail }) => (
    <View style={styles.postCard}>
      <Text style={styles.postDate} numberOfLines={1}>
        {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {item.media_type?.replace('_', ' ').toUpperCase()}
      </Text>
      <Text style={styles.postCaption} numberOfLines={3}>{item.caption_cleaned || "No caption"}</Text>
      <View style={styles.postMetrics}>
        <View style={styles.metricItem}><MaterialCommunityIcons name="heart-outline" size={16} color="#F44336" /><Text style={styles.metricText}>{item.like_count?.toLocaleString() ?? 'N/A'}</Text></View>
        <View style={styles.metricItem}><MaterialCommunityIcons name="comment-outline" size={16} color="#2196F3" /><Text style={styles.metricText}>{item.comments_count?.toLocaleString() ?? 'N/A'}</Text></View>
        {/* Bu endpoint'ten reach ve engagement gelmiyor, o yüzden o kısımlar kaldırıldı */}
      </View>
    </View>
  );

  const renderDemographicItem = (item: DemographicDetail, index: number, type: string) => (
    <View key={`${type}-${index}`} style={styles.demographicItem}>
        <Text style={styles.demographicDimension}>{item.dimension}: </Text>
        <Text style={styles.demographicValue}>{item.value?.toLocaleString()}{type !== 'ageGroups' ? '%' : ''}</Text>
    </View>
  );


  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
        <Text style={styles.loadingText}>
          {managedAccountId ? "Loading Dashboard..." : "Configuring Account..."}
        </Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons name="server-network-off" size={60} color="#FF6B6B" style={{marginBottom:15}} />
        <Text style={styles.errorText}>Could not load dashboard data. Please check your connection or try again later.</Text>
        <TouchableOpacity onPress={handleLogout} style={[styles.simpleButton, {backgroundColor: '#FF6B6B'}]}>
            <Text style={[styles.simpleButtonText, {color: '#FFFFFF'}]}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // EKRAN İÇERİĞİNİ YENİ VERİ YAPISINA GÖRE GÜNCELLEDİK
  return (
    <View style={styles.outerContainer}>
      <View style={styles.header}>
        <View>
          {/* Başlığı Hesap Yöneticisi Paneli gibi değiştirebiliriz */}
          <Text style={styles.welcomeText}>Account Manager Dashboard</Text>
          <Text style={styles.accountNameHeader}>{dashboardData.accountName || 'Managed Account'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButtonHeader}>
          <Ionicons name="log-out-outline" size={28} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>📊 Account Overview (Last 7 Days)</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.totalFollowers?.toLocaleString() ?? 'N/A'}</Text>
            <Text style={styles.statLabel}>Total Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.recentPostsCount ?? 'N/A'}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.avgLikesPerPost?.toFixed(1) ?? 'N/A'}</Text>
            <Text style={styles.statLabel}>Avg. Likes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData.avgCommentsPerPost?.toFixed(1) ?? 'N/A'}</Text>
            <Text style={styles.statLabel}>Avg. Comments</Text>
          </View>
          <View style={styles.statCardWide}>
            <MaterialCommunityIcons name="eye-outline" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{dashboardData.recentReach?.toLocaleString() ?? 'N/A'}</Text>
            <Text style={styles.statLabel}>Reach (7d)</Text>
          </View>
           <View style={styles.statCardWide}>
            <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{dashboardData.recentImpressions?.toLocaleString() ?? 'N/A'}</Text>
            <Text style={styles.statLabel}>Impressions (7d)</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>🕒 Latest Posts (Last 5)</Text>
        {dashboardData.latestPosts && dashboardData.latestPosts.length > 0 ? (
          <View>
            {dashboardData.latestPosts.map(post => renderPostCard({ item: post, key: post.id }))}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <MaterialCommunityIcons name="post-outline" size={50} color="#B0BEC5" />
            <Text style={styles.noDataText}>No recent posts to display.</Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>👥 Audience Demographics</Text>
        <View style={styles.demographicsContainer}>
            {dashboardData.demographics?.topCountries?.length > 0 && (
                <View style={styles.demographicSection}>
                    <Text style={styles.demographicTitle}>Top Countries</Text>
                    {dashboardData.demographics.topCountries.map((item, index) => renderDemographicItem(item, index, 'country'))}
                </View>
            )}
            {dashboardData.demographics?.genderDistribution?.length > 0 && (
                 <View style={styles.demographicSection}>
                    <Text style={styles.demographicTitle}>Gender Distribution</Text>
                    {dashboardData.demographics.genderDistribution.map((item, index) => renderDemographicItem(item, index, 'gender'))}
                </View>
            )}
            {dashboardData.demographics?.ageGroups?.length > 0 && (
                <View style={styles.demographicSection}>
                    <Text style={styles.demographicTitle}>Age Groups</Text>
                    {dashboardData.demographics.ageGroups.map((item, index) => renderDemographicItem(item, index, 'age'))}
                </View>
            )}
            {(!dashboardData.demographics?.topCountries?.length &&
              !dashboardData.demographics?.genderDistribution?.length &&
              !dashboardData.demographics?.ageGroups?.length) && (
                <View style={styles.noDataContainer}>
                    <MaterialCommunityIcons name="account-group-outline" size={50} color="#B0BEC5" />
                    <Text style={styles.noDataText}>No demographic data available.</Text>
                </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F0F2F5' },
  scrollContentContainer: { paddingBottom: 30, paddingHorizontal: 15 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F0F2F5' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#5A6A7D' },
  errorText: { fontSize: 16, color: '#D32F2F', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  simpleButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, backgroundColor: '#E0E0E0', borderRadius: 8 },
  simpleButtonText: { fontSize: 16, fontWeight: '500', color: '#333333'},
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#DDE2E7'},
  welcomeText: { fontSize: 14, color: '#5A6A7D' },
  accountNameHeader: { fontSize: 20, fontWeight: 'bold', color: '#2C3A4B' },
  logoutButtonHeader: { padding: 8 },
  sectionHeader: { fontSize: 18, fontWeight: '600', color: '#2C3A4B', marginTop: 25, marginBottom: 15, },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10, },
  statCard: { backgroundColor: '#FFFFFF', width: width / 2 - 25, paddingVertical: 20, paddingHorizontal:10, borderRadius: 10, marginBottom: 15, alignItems: 'center', shadowColor: "#405B85", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 4, },
  statCardWide: { // Reach ve Impressions için daha geniş kart
    backgroundColor: '#FFFFFF', width: width / 2 - 25, // Veya '100%' yaparak tam genişlikte 2 kart yan yana
    paddingVertical: 20, paddingHorizontal:10, borderRadius: 10, marginBottom: 15, 
    alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
    shadowColor: "#405B85", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 4,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#6A5ACD', marginBottom: 4, marginTop: 5 },
  statLabel: { fontSize: 12, color: '#5A6A7D', textAlign: 'center' },
  postCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E0E6ED', shadowColor: "#405B85", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3, },
  postDate: { fontSize: 12, color: '#5A6A7D', marginBottom: 5, fontWeight: '500' },
  postCaption: { fontSize: 14, color: '#2C3A4B', lineHeight: 20, marginBottom: 10 },
  postMetrics: { flexDirection: 'row', justifyContent: 'flex-start', gap: 20, borderTopWidth: 1, borderTopColor: '#F0F2F5', paddingTop: 10, marginTop: 5},
  metricItem: { flexDirection: 'row', alignItems: 'center'},
  metricText: { fontSize: 13, color: '#5A6A7D', marginLeft: 5 },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E6ED'
  },
  noDataText: { textAlign: 'center', fontSize: 15, color: '#6C7A89', marginTop: 10, fontStyle: 'italic' },
  demographicsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#405B85", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E6ED'
  },
  demographicSection: {
    marginBottom: 15,
  },
  demographicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 5,
  },
  demographicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  demographicDimension: {
    fontSize: 14,
    color: '#475569',
  },
  demographicValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
});