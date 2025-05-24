import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const dummyAccounts = [
  { id: '1', name: 'Everest Media', manager: 'John Doe', followers: 15000 },
  { id: '2', name: 'Beach Vibes', manager: 'Jane Smith', followers: 8700 },
];

export default function ManageAccounts() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Geri Dön Butonu */}
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/screen/AdminDashboard')}>
        <Text style={styles.homeButtonText}>🏠 Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>📱 Manage Accounts</Text>

      {/* Arama Kutusu */}
      <TextInput style={styles.searchInput} placeholder="🔍 Search accounts..." />

      {/* Yeni Hesap Ekle */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>➕ Add New Account</Text>
      </TouchableOpacity>

      {/* Hesap Listesi */}
      <FlatList
        data={dummyAccounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>Manager: {item.manager}</Text>
            <Text style={styles.cardFollowers}>Followers: {item.followers}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editButton}>
                <Text>📄 Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton}>
                <Text>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton}>
                <Text>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    backgroundColor: '#fff',
  },
  homeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  homeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#4C7CFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  cardFollowers: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
    color: '#333',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#ffcccc',
    padding: 8,
    borderRadius: 6,
  },
});
