import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function Reports() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Home Button */}
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/screen/AdminDashboard')}>
        <Text style={styles.homeButtonText}>🏠 Home</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Reports</Text>

      {/* Stats Cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Users: 1200</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Camps: 48</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Signups: +15%</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Users: 860</Text>
      </View>

      {/* Dummy Graph Section */}
      <View style={styles.graph}>
        <Text style={{ color: '#999' }}>📊 [Graph Placeholder]</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    backgroundColor: '#fff',
    alignItems: 'center',
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
  card: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  graph: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
    borderRadius: 12,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
