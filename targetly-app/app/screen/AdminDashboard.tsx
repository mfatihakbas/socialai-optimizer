import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, FlatList,
  Alert,
  Platform // Platform buraya import edildi
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

type DashboardSummary = {
  totalAccounts: number;
  totalPosts: number;
  totalFollowers: number;
  systemStatus: string;
};

type CalendarPost = {
  id: number;
  instagram_post_id: string;
  caption_cleaned: string;
  timestamp: string;
  instagram_user_id: string;
  media_type: string;
  like_count: number;
  comments_count: number;
};

type InsightOverview = {
  recentReach?: number;
  topPostByLikes?: { caption_cleaned: string; like_count: number } | null;
  totalImpressionsLast7Days?: number;
  averageEngagementRate?: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>([]);
  const [insightData, setInsightData] = useState<InsightOverview | null>(null);

  const fetchData = async () => {
    if (!API_BASE_URL || API_BASE_URL === 'http://YOUR_FALLBACK_URL_OR_THROW_ERROR') {
      Alert.alert('Configuration Error', "API URL is not set. Please check your app.json.");
      setLoadingSummary(false); setLoadingCalendar(false); setLoadingInsights(false);
      return;
    }
    setLoadingSummary(true);
    try {
      const summaryRes = await axios.get(`${API_BASE_URL}/api/dashboard/summary`);
      setSummaryData(summaryRes.data);
    } catch (error: any) {
      console.error("Error fetching summary data:", error);
      Alert.alert("Fetch Error", `Could not fetch dashboard summary. ${error.message || ''}`);
    } finally {
      setLoadingSummary(false);
    }
    setLoadingCalendar(true);
    try {
      const calendarRes = await axios.get(`${API_BASE_URL}/api/dashboard/content-calendar`);
      setCalendarPosts(calendarRes.data);
    } catch (error: any) {
      console.error("Error fetching content calendar data:", error);
      Alert.alert("Fetch Error", `Could not fetch content calendar. ${error.message || ''}`);
    } finally {
      setLoadingCalendar(false);
    }
    setLoadingInsights(true);
    try {
      const insightsRes = await axios.get(`${API_BASE_URL}/api/dashboard/insights-overview`);
      setInsightData(insightsRes.data);
    } catch (error: any) {
      console.error("Error fetching insights overview data:", error);
      Alert.alert("Fetch Error", `Could not fetch insights overview. ${error.message || ''}`);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    router.replace('/screen/LoginScreen');
  };

  const renderCalendarItem = ({ item }: { item: CalendarPost }) => (
    <View style={styles.calendarItem}>
      <Text style={styles.calendarItemDate}>
        {new Date(item.timestamp).toLocaleDateString()} - {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={styles.calendarItemCaption} numberOfLines={2}>{item.caption_cleaned || "No caption"}</Text>
      <Text style={styles.calendarItemAccount}>Acc: {item.instagram_user_id}</Text>
      <View style={styles.calendarItemStats}>
        <Text style={styles.statText}>👍 {item.like_count}</Text>
        <Text style={styles.statText}>💬 {item.comments_count}</Text>
      </View>
    </View>
  );

  const renderInsightItem = () => {
    if (loadingInsights) return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#007bff"/>;
    if (!insightData || Object.keys(insightData).length === 0) return <Text style={styles.placeholderText}>No insights data available to display.</Text>;
    return (
      <View style={styles.insightsContent}>
        {insightData.recentReach !== undefined && (
            <View style={styles.insightDetailCard}><Text style={styles.insightLabel}>Recent Reach:</Text><Text style={styles.insightValue}>{insightData.recentReach.toLocaleString()}</Text></View>
        )}
        {insightData.totalImpressionsLast7Days !== undefined && (
            <View style={styles.insightDetailCard}><Text style={styles.insightLabel}>Impressions (7d):</Text><Text style={styles.insightValue}>{insightData.totalImpressionsLast7Days.toLocaleString()}</Text></View>
        )}
        {insightData.averageEngagementRate !== undefined && (
            <View style={styles.insightDetailCard}><Text style={styles.insightLabel}>Avg. Engagement:</Text><Text style={styles.insightValue}>{insightData.averageEngagementRate.toFixed(2)}%</Text></View>
        )}
        {insightData.topPostByLikes && (
          <View style={[styles.insightDetailCard, { flexDirection: 'column', alignItems: 'flex-start'}]}>
            <Text style={styles.insightLabel}>Top Post (Likes):</Text>
            <Text style={styles.insightCaption} numberOfLines={2}>{insightData.topPostByLikes.caption_cleaned || "No Caption"}</Text>
            <Text style={styles.insightValue}>Likes: {insightData.topPostByLikes.like_count.toLocaleString()}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>👋 Welcome back, Admin!</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Total Accounts</Text>
            {loadingSummary ? <ActivityIndicator color="#007bff"/> : <Text style={styles.kpiValue}>{summaryData?.totalAccounts ?? 'N/A'}</Text>}
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Total Posts</Text>
            {loadingSummary ? <ActivityIndicator color="#007bff"/> : <Text style={styles.kpiValue}>{summaryData?.totalPosts ?? 'N/A'}</Text>}
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Total Followers</Text>
            {loadingSummary ? <ActivityIndicator color="#007bff"/> : <Text style={styles.kpiValue}>{summaryData?.totalFollowers?.toLocaleString() ?? 'N/A'}</Text>}
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>System Status</Text>
            {loadingSummary ? <ActivityIndicator color="#007bff"/> : <Text style={[styles.kpiValue, summaryData?.systemStatus === 'Good ✅' ? styles.statusGood : styles.statusIssue]}>{summaryData?.systemStatus ?? 'Checking...'}</Text>}
          </View>
        </View>

        <Text style={styles.sectionTitle}>🗓️ Content Calendar</Text>
        <View style={styles.scrollableSection}>
          {loadingCalendar ? (
            <ActivityIndicator size="large" style={{ marginVertical: 40 }} color="#007bff"/>
          ) : calendarPosts.length > 0 ? (
            <FlatList
              horizontal
              data={calendarPosts}
              renderItem={renderCalendarItem}
              keyExtractor={(item) => item.instagram_post_id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 5 }}
            />
          ) : (
            <View style={[styles.placeholderBox, {height: styles.scrollableSection.height - 20}]}>
              <Text style={styles.placeholderText}>No posts to display in calendar.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>📊 Insights Overview</Text>
        <View style={styles.scrollableSectionInsights}>
          {renderInsightItem()}
        </View>

        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/manage-users')}>
            <Text style={styles.actionIcon}>👥</Text><Text style={styles.actionLabel}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/manage-accounts')}>
             <Text style={styles.actionIcon}>📱</Text><Text style={styles.actionLabel}>Manage Accounts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/reports')}>
            <Text style={styles.actionIcon}>📈</Text><Text style={styles.actionLabel}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/settings')}>
            <Text style={styles.actionIcon}>⚙️</Text><Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🔓 Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.agentButton}>
        <Text style={styles.agentIcon}>🧠</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  kpiCard: { backgroundColor: '#fff', width: width * 0.5 - 28, minHeight: 90, borderRadius: 12, marginBottom: 15, padding: 15, justifyContent: 'center', shadowColor: '#94a3b8', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5 },
  kpiTitle: { color: '#64748b', fontSize: 13, fontWeight:'500', marginBottom: 6 },
  kpiValue: { color: '#0f172a', fontSize: 20, fontWeight: 'bold' },
  statusGood: { color: '#10b981'},
  statusIssue: { color: '#ef4444'},
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#334155', marginVertical: 15, marginTop: 25 },
  placeholderBox: { backgroundColor: '#e2e8f0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 20 },
  placeholderText: { color: '#64748b', fontSize: 14 },
  scrollableSection: { height: 170, marginBottom: 20 },
  calendarItem: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginRight: 12, width: width * 0.75, height: '100%', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0' },
  calendarItemDate: { fontSize: 12, color: '#475569', marginBottom: 5, fontWeight: '500' },
  calendarItemCaption: { fontSize: 14, fontWeight: 'normal', color: '#334155', marginBottom: 8, lineHeight: 20 },
  calendarItemAccount: { fontSize: 12, color: '#0ea5e9', fontStyle: 'italic' },
  calendarItemStats: { flexDirection: 'row', justifyContent: 'flex-start', gap: 15, marginTop: 8 },
  statText: { fontSize: 13, color: '#475569'},
  scrollableSectionInsights: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#94a3b8', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 3 }, shadowRadius: 7, elevation: 4 },
  insightsContent: {},
  insightDetailCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  insightLabel: { fontSize: 15, color: '#475569', fontWeight: '500' },
  insightValue: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  insightCaption: { fontSize: 14, color: '#334155', fontStyle: 'italic', marginTop: 4 },
  quickActionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { backgroundColor: '#fff', width: width * 0.5 - 28, height: 110, borderRadius: 12, marginBottom: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#94a3b8', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5 },
  actionIcon: { fontSize: 28, marginBottom: 10, color: '#007bff' },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#334155', textAlign: 'center' },
  agentButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#007bff', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 8 },
  agentIcon: { fontSize: 28, color: '#fff' },
  logoutButton: { marginTop: 30, marginBottom: 40, alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 35, borderRadius: 30, backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6 },
  logoutText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
});