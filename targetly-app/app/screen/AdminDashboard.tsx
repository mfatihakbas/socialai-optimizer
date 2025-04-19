import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828817.png',
        }}
        style={styles.icon}
      />
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Hoş geldiniz, admin!</Text>
      <Text style={styles.info}>Burada kamp yönetimi, kullanıcı kontrolleri ve analiz panellerine erişebilirsiniz.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f0f4f7',
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    tintColor: '#4C7CFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  info: {
    textAlign: 'center',
    color: '#444',
    fontSize: 14,
  },
});
