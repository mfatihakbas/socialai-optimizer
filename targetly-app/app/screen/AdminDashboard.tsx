import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Profil Resmi Yorumda */}
        {/* 
        <Image
          source={require('../../assets/images/profile-placeholder.png')}
          style={styles.profileImage}
        /> 
        */}
        <Text style={styles.greeting}>👋 Welcome back, Admin!</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}><Text style={styles.kpiTitle}>Total Users</Text><Text style={styles.kpiValue}>120</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiTitle}>Total Camps</Text><Text style={styles.kpiValue}>35</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiTitle}>Weekly Growth</Text><Text style={styles.kpiValue}>+8%</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiTitle}>System Health</Text><Text style={styles.kpiValue}>Good ✅</Text></View>
        </View>

        {/* Content Calendar */}
        <Text style={styles.sectionTitle}>📅 Content Calendar</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>Content Calendar (Coming soon)</Text>
        </View>

        {/* Campaign Performance */}
        <Text style={styles.sectionTitle}>📈 Campaign Performance</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>Graphs and Analytics (Coming soon)</Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/manage-users')}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionLabel}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/manage-camps')}>
            <Text style={styles.actionIcon}>🏕</Text>
            <Text style={styles.actionLabel}>Manage Camps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/reports')}>
             <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>View Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/settings')}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

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
  profileImage: { width: 45, height: 45, borderRadius: 22, marginRight: 12, backgroundColor: '#ccc' },
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
});
