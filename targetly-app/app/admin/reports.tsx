import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, Dimensions, ActivityIndicator,
  Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

const getApiBaseUrl = (): string => {
  const apiUrlFromConfig = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof apiUrlFromConfig === 'string' && apiUrlFromConfig) {
    return apiUrlFromConfig;
  }
  console.warn("API_BASE_URL not found in app.json's extra or is undefined. Please check.");
  return 'http://YOUR_FALLBACK_URL_OR_THROW_ERROR'; // Güncelleyin!
};
const API_BASE_URL = getApiBaseUrl();

type Account = {
  id: string;
  name: string;
};

type AccountReportSummary = {
  totalFollowers: number;
  weeklyEngagementRate: string;
  activeFollowersEstimate: number;
};

type DemographicDetail = { dimension: string; value: number };

type FollowerDemographics = {
  country?: DemographicDetail[];
  gender?: DemographicDetail[];
  age?: DemographicDetail[];
};

type ModalDemographicData = {
  title: string;
  data: DemographicDetail[];
};

export default function ReportsScreen() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [reportSummary, setReportSummary] = useState<AccountReportSummary | null>(null);
  const [demographics, setDemographics] = useState<FollowerDemographics | null>(null);

  const [accountsLoading, setAccountsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [demographicsLoading, setDemographicsLoading] = useState(false);
  
  const [accountSelectModalVisible, setAccountSelectModalVisible] = useState(false);
  const [demographicsDetailModalVisible, setDemographicsDetailModalVisible] = useState(false);
  const [selectedModalDemographics, setSelectedModalDemographics] = useState<ModalDemographicData | null>(null);


  useEffect(() => {
    const fetchAccounts = async () => {
      if (!API_BASE_URL || API_BASE_URL === 'http://YOUR_FALLBACK_URL_OR_THROW_ERROR') {
        Alert.alert('Config Error', "API URL not set."); setAccountsLoading(false); return;
      }
      setAccountsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/reporting/accounts`);
        const fetchedAccounts: Account[] = response.data;
        setAccounts(fetchedAccounts);
        if (fetchedAccounts.length > 0) {
          setSelectedAccount(fetchedAccounts[0]);
        } else {
          setSelectedAccount(null);
        }
      } catch (error: any) {
        console.error("Error fetching accounts:", error);
        Alert.alert("Error", `Could not fetch accounts. ${error.message || ''}`);
      } finally {
        setAccountsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!selectedAccount || !API_BASE_URL || API_BASE_URL === 'http://YOUR_FALLBACK_URL_OR_THROW_ERROR') {
      setReportSummary(null);
      setDemographics(null);
      return;
    }

    const fetchReportData = async () => {
      setSummaryLoading(true);
      setDemographicsLoading(true);
      setReportSummary(null);
      setDemographics(null);
      try {
        const [summaryRes, demoRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/reporting/account-summary/${selectedAccount.id}`),
          axios.get(`${API_BASE_URL}/api/reporting/follower-demographics/${selectedAccount.id}`)
        ]);
        setReportSummary(summaryRes.data);
        setDemographics(demoRes.data);
      } catch (error: any) {
        console.error(`Error fetching report data for ${selectedAccount.name}:`, error);
        Alert.alert("Error", `Could not fetch report data for ${selectedAccount.name}. ${error.message || ''}`);
      } finally {
        setSummaryLoading(false);
        setDemographicsLoading(false);
      }
    };

    fetchReportData();
  }, [selectedAccount]);


  const renderAccountSelectItem = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedAccount(item);
        setAccountSelectModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const openDemographicsDetailModal = (title: string, data?: DemographicDetail[]) => {
    if (data && data.length > 0) {
      setSelectedModalDemographics({ title, data });
      setDemographicsDetailModalVisible(true);
    } else {
      Alert.alert("No Data", `No detailed ${title.toLowerCase()} data available to display.`);
    }
  };

  const renderDemographicSection = (title: string, dataKey: keyof FollowerDemographics) => {
    const currentData = demographics ? demographics[dataKey] : undefined;
    if (demographicsLoading && !currentData) return <ActivityIndicator style={styles.demographicPlaceholder} color="#007bff"/>;
    if (!currentData || currentData.length === 0) {
      return <Text style={styles.demographicPlaceholder}>No {title.toLowerCase()} data.</Text>;
    }
    return (
      <View style={styles.demographicSection}>
        <TouchableOpacity onPress={() => openDemographicsDetailModal(title, currentData)}>
          <Text style={styles.demographicTitleClickable}>{title} 📊</Text>
        </TouchableOpacity>
        {currentData.slice(0, 3).map((item, index) => (
          <View key={index} style={styles.demographicItem}>
            <Text style={styles.demographicDimension}>{item.dimension}:</Text>
            <Text style={styles.demographicValue}>{item.value?.toLocaleString() ?? 'N/A'}</Text>
          </View>
        ))}
        {currentData.length > 3 && (
          <TouchableOpacity onPress={() => openDemographicsDetailModal(title, currentData)}>
            <Text style={styles.seeMoreDemographics}>...and {currentData.length - 3} more (Tap to see all)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (accountsLoading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <TouchableOpacity style={styles.homeButton} onPress={() => router.canGoBack() ? router.back() : router.push('/screen/AdminDashboard')}>
        <Text style={styles.homeButtonText}>🏠 Back</Text>
      </TouchableOpacity>

      {accounts.length > 0 && selectedAccount ? (
        <>
          <TouchableOpacity style={styles.dropdown} onPress={() => setAccountSelectModalVisible(true)}>
            <Text style={styles.dropdownText}>📂 {selectedAccount.name}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          <Modal visible={accountSelectModalVisible} transparent animationType="fade" onRequestClose={() => setAccountSelectModalVisible(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAccountSelectModalVisible(false)}>
              <View style={styles.modalContent}>
                <FlatList data={accounts} keyExtractor={(item) => item.id} renderItem={renderAccountSelectItem}/>
              </View>
            </TouchableOpacity>
          </Modal>

          <Text style={styles.title}>📊 Report for: {selectedAccount.name}</Text>

          {summaryLoading ? <ActivityIndicator size="large" color="#007bff" style={{marginVertical: 20}}/> : reportSummary ? (
            <>
              <View style={styles.kpiRow}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>👥 Total Followers</Text>
                  <Text style={styles.cardValue}>{reportSummary.totalFollowers?.toLocaleString() ?? 'N/A'}</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>📈 Engagement Rate</Text>
                  <Text style={styles.cardValue}>{reportSummary.weeklyEngagementRate ?? 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.cardFullWidth}>
                <Text style={styles.cardTitle}>🔥 Active Followers</Text>
                <Text style={styles.cardValue}>{reportSummary.activeFollowersEstimate?.toLocaleString() ?? 'N/A'}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.dataInfoText}>Summary data is loading or not available.</Text>
          )}

          <Text style={styles.sectionTitle}>🌍 Follower Demographics</Text>
          {demographicsLoading ? <ActivityIndicator size="large" color="#007bff" style={{marginVertical: 20}}/> : demographics ? (
            <View style={styles.demographicsContainer}>
              {renderDemographicSection("Top Countries", "country")}
              {renderDemographicSection("Gender Distribution", "gender")}
              {renderDemographicSection("Age Groups", "age")}
            </View>
          ) : (
            <Text style={styles.dataInfoText}>Demographics data is loading or not available.</Text>
          )}

          {/* Engagement Graph Bölümü Kaldırıldı */}
          {/* 
          <Text style={styles.sectionTitle}>📉 Engagement Graph</Text>
          <View style={styles.graphPlaceholder}>
            <Text style={styles.placeholderText}>Engagement Graph (Coming Soon)</Text>
          </View> 
          */}
        </>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.dataInfoText}>
            {accounts.length === 0 && !accountsLoading ? "No accounts found. Please add accounts via backend or check configuration." : "Please select an account to view reports."}
          </Text>
        </View>
      )}

      {selectedModalDemographics && (
        <Modal
          visible={demographicsDetailModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDemographicsDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.demographicsModalContent]}>
              <Text style={styles.modalTitle}>{selectedModalDemographics.title} - Full List</Text>
              <FlatList
                data={selectedModalDemographics.data}
                keyExtractor={(item, index) => `${item.dimension}-${index}`}
                renderItem={({ item }) => (
                  <View style={styles.demographicDetailItem}>
                    <Text style={styles.demographicDetailDimension}>{item.dimension}</Text>
                    <Text style={styles.demographicDetailValue}>{item.value.toLocaleString()}</Text>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              <TouchableOpacity
                style={[styles.modalButtonGlobal, styles.closeButton]}
                onPress={() => setDemographicsDetailModalVisible(false)}
              >
                <Text style={styles.modalButtonTextGlobal}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: 40,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  homeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    zIndex: 10,
    elevation: 3,
  },
  homeButtonText: { fontSize: 16, color: '#495057', fontWeight: '500' },
  dropdown: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 25,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  dropdownText: { fontSize: 17, fontWeight: '500', color: '#334155' },
  dropdownIcon: { fontSize: 16, color: '#64748b' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    marginHorizontal: 30,
    width: width * 0.85,
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
  },
  modalItem: { paddingVertical: 15, paddingHorizontal:15, borderBottomColor: '#f1f5f9', borderBottomWidth: 1, alignItems: 'center' },
  modalItemText: { fontSize: 16, color: '#334155' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1e293b', textAlign: 'center' },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
  card: {
    width: width * 0.5 - 25,
    backgroundColor: '#fff',
    padding: 18,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  cardFullWidth: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 18,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#64748b' },
  cardValue: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#334155', marginTop: 20, marginBottom: 15 },
  demographicsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  demographicSection: { marginBottom: 10 },
  demographicTitleClickable: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  demographicItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal:5 },
  demographicDimension: { fontSize: 14, color: '#475569' },
  demographicValue: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  demographicPlaceholder: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 15},
  seeMoreDemographics: { fontSize: 13, color: '#007bff', textAlign: 'right', marginTop: 8, fontWeight: '500', padding: 5},
  // graphPlaceholder stili kaldırıldı
  placeholderText: { color: '#94a3b8', fontSize: 14 }, // Bu genel placeholderlar için kalabilir
  dataInfoText: { textAlign: 'center', fontSize: 15, color: '#64748b', marginVertical: 20},
  demographicsModalContent: {
    width: '90%',
    maxHeight: height * 0.75,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 0, 
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1e293b',
    paddingHorizontal: 20,
  },
  demographicDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 25,
  },
  demographicDetailDimension: { fontSize: 16, color: '#334155' },
  demographicDetailValue: { fontSize: 16, color: '#1e293b', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#eef2f9', marginHorizontal: 20 },
  modalButtonGlobal: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    marginTop: 15, 
    marginHorizontal:20,
  },
  modalButtonTextGlobal: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#6c757d',
    marginBottom: 10,
  },
});