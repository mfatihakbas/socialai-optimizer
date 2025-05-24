import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

const dummyAccounts = [
  { id: '1', name: 'Everest Media', followers: 12000, engagement: '14%', active: 8500 },
  { id: '2', name: 'Beach Vibes', followers: 8700, engagement: '9%', active: 6200 },
  { id: '3', name: 'UrbanLife Hub', followers: 5100, engagement: '5%', active: 3200 },
];

export default function Reports() {
  const router = useRouter();
  const [selectedAccount, setSelectedAccount] = useState(dummyAccounts[0]);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Geri Dön Butonu */}
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/screen/AdminDashboard')}>
        <Text style={styles.homeButtonText}>🏠 Back to Dashboard</Text>
      </TouchableOpacity>

      {/* Hesap Seçim Dropdown'u */}
      <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
        <Text style={styles.dropdownText}>📂 {selectedAccount.name}</Text>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={dummyAccounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedAccount(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Başlık */}
      <Text style={styles.title}>📊 Report for: {selectedAccount.name}</Text>

      {/* Kartlar */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👥 Total Followers</Text>
        <Text style={styles.cardValue}>{selectedAccount.followers}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 Weekly Engagement</Text>
        <Text style={styles.cardValue}>{selectedAccount.engagement}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔥 Active Followers</Text>
        <Text style={styles.cardValue}>{selectedAccount.active}</Text>
      </View>

      {/* Grafik Placeholder */}
      <View style={styles.graph}>
        <Text style={{ color: '#999' }}>📉 Engagement Graph (Coming soon)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  homeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  homeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdown: {
    width: '100%',
    padding: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginBottom: 25,
    marginTop: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#222',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    marginHorizontal: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#555',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  graph: {
    width: '100%',
    height: 200,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
