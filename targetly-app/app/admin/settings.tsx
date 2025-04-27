import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Settings() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Home Button */}
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/screen/AdminDashboard')}>
        <Text style={styles.homeButtonText}>🏠 Home</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Settings</Text>

      {/* Profile Info */}
      <View style={styles.profileCard}>
        <Text style={styles.profileText}>👤 Name: Admin User</Text>
        <Text style={styles.profileText}>📧 Email: admin@example.com</Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Notification Preferences</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  profileCard: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 10,
  },
  actionButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#4C7CFF',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
