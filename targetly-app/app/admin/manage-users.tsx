import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

const roles = ['all', 'admin', 'account_manager', 'content_creator'];

type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

export default function ManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const url =
          selectedRole === 'all'
            ? 'http://10.196.219.159:5000/users' // 🔁 Buraya kendi IP'n gelecek
            : `http://10.196.219.159:5000/users?role=${selectedRole}`;
        const res = await axios.get(url);
        setUsers(res.data);
      } catch (error) {
        console.error('❌ Kullanıcılar alınamadı:', error);
      }
    };

    fetchUsers();
  }, [selectedRole]);

  const filteredUsers = users.filter(user =>
    (user.full_name || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/screen/AdminDashboard')}>
        <Text style={styles.homeButtonText}>🏠 Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>👥 Manage Users</Text>

      <TouchableOpacity style={styles.picker} onPress={() => setModalVisible(true)}>
        <Text style={{ fontSize: 16 }}>🎯 Role: {selectedRole}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalBox}>
            {roles.map(role => (
              <TouchableOpacity key={role} style={styles.option} onPress={() => {
                setSelectedRole(role);
                setModalVisible(false);
              }}>
                <Text style={styles.optionText}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search users..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>➕ Add New User</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.full_name}</Text>
            <Text style={styles.cardSubtitle}>{item.email}</Text>
            <Text style={styles.cardRole}>👤 Role: {item.role}</Text>
            <View style={styles.cardActions}>
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 80, backgroundColor: '#fff' },
  homeButton: { position: 'absolute', top: 40, left: 20, padding: 10, backgroundColor: '#eee', borderRadius: 8 },
  homeButtonText: { fontSize: 16, color: '#333' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  picker: { marginBottom: 10, backgroundColor: '#e2e8f0', borderRadius: 10, padding: 12 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 10 },
  addButton: { backgroundColor: '#4C7CFF', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#f9f9f9', padding: 15, marginBottom: 12, borderRadius: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#555', marginTop: 2 },
  cardRole: { fontSize: 14, marginTop: 5, fontWeight: '500', color: '#333' },
  cardActions: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  editButton: { backgroundColor: '#eee', padding: 8, borderRadius: 6 },
  deleteButton: { backgroundColor: '#ffcccc', padding: 8, borderRadius: 6 },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 30 },
  modalBox: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  option: { paddingVertical: 12 },
  optionText: { fontSize: 16, color: '#000' },
});
