import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/screen/LoginScreen');;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>👋 Welcome back, Admin!</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Total Accounts</Text>
            <Text style={styles.kpiValue}>120</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Total Posts</Text>
            <Text style={styles.kpiValue}>35</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Avg. Engagement</Text>
            <Text style={styles.kpiValue}>4.2%</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>System Status</Text>
            <Text style={styles.kpiValue}>Good ✅</Text>
          </View>
        </View>

        {/* Content Calendar */}
        <Text style={styles.sectionTitle}>🗓️ Content Calendar</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>Content Calendar (Coming soon)</Text>
        </View>

        {/* Insights & Analytics */}
        <Text style={styles.sectionTitle}>📊 Insights & Analytics</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>Graphs and Analytics (Coming soon)</Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/manage-users')}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionLabel}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/reports')}>
            <Text style={styles.actionIcon}>📱</Text>
            <Text style={styles.actionLabel}>Manage Accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/reports')}>
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionLabel}>View Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/settings')}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Log out */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🔓 Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* AI Assistant Floating Button */}
      <TouchableOpacity style={styles.agentButton}>
        <Text style={styles.agentIcon}>🧠</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 22, fontWeight: '600', color: '#333' },
  kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  kpiCard: { backgroundColor: '#fff', width: width * 0.44, height: 90, borderRadius: 12, marginBottom: 15, padding: 10, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  kpiTitle: { color: '#555', fontSize: 13, marginBottom: 5 },
  kpiValue: { color: '#000', fontSize: 22, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginVertical: 10 },
  placeholderBox: { backgroundColor: '#e2e8f0', height: 120, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  placeholderText: { color: '#666', fontSize: 14 },
  quickActionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { backgroundColor: '#fff', width: width * 0.44, height: 100, borderRadius: 12, marginBottom: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  actionIcon: { fontSize: 26, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  agentButton: { position: 'absolute', bottom: 25, right: 25, backgroundColor: '#4C7CFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 5 },
  agentIcon: { fontSize: 30, color: '#fff' },
  logoutButton: {
    marginTop: 30,
    marginBottom: 50,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  logoutText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },
});
