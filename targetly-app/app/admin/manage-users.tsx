// app/admin/view-user.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'; // useLocalSearchParams to potentially get userId
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// This would ideally come from props or fetched based on a userId
// For now, using placeholder based on your "Data Output" image (e.g., Account Manager A)
const placeholderUserData = {
  id: 2,
  full_name: 'Account Manager A',
  email: 'manager@example.com',
  role: 'account_manager',
  created_at: '2025-05-23T21:50:52.042718Z', // Assuming ISO format for Date constructor
};

// Consistent with ManageUsersScreen.tsx for role display
const roleDisplayNames: { [key: string]: string } = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  content_creator: 'Content Creator',
};

const formatRoleName = (roleKey: string): string => {
  return roleDisplayNames[roleKey] || roleKey.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

// Consistent path
const ADMIN_DASHBOARD_PATH = '/screen/AdminDashboard'; 

export default function ViewUserScreen() {
  const router = useRouter();
  // const { userId } = useLocalSearchParams(); // Example: if you pass userId as a param

  // In a real app, you'd fetch user data based on userId or receive it via props.
  // For this example, we'll use the placeholderUserData.
  const userData = placeholderUserData; 

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push(ADMIN_DASHBOARD_PATH); 
    }
  };

  if (!userData) {
    // Handle case where user data might not be loaded (e.g., if fetching)
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.appHeaderBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>User Details</Text>
        <View style={{width: 28}} /> {/* Spacer for centering title */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.dashboardButton} onPress={() => router.push(ADMIN_DASHBOARD_PATH)}>
          <MaterialCommunityIcons name="home-variant-outline" size={22} color="#6A0DAD" />
          <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.pageTitleContainer}>
          {/* Using a generic user icon, you can change it */}
          <MaterialCommunityIcons name="account-details-outline" size={30} color="#4A0D6A" style={styles.pageTitleIcon} />
          <Text style={styles.pageTitle}>User Information</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.userNameTitle}>{userData.full_name}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <View style={[
                styles.roleBadge, 
                userData.role === 'admin' ? styles.roleBadgeAdmin :
                userData.role === 'account_manager' ? styles.roleBadgeManager :
                styles.roleBadgeCreator
            ]}>
                <Text style={styles.roleBadgeText}>{formatRoleName(userData.role)}</Text>
            </View>
          </View>

          {userData.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>{new Date(userData.created_at).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', 
  },
  centered: { // For loading state or errors
    justifyContent: 'center',
    alignItems: 'center',
  },
  appHeader: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#6A0DAD', 
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  appHeaderBackButton: {
    padding: 5,
  },
  appHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 30, 
  },
  dashboardButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start', 
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E6ED'
  },
  dashboardButtonText: {
    fontSize: 15,
    color: '#6A0DAD', 
    fontWeight: '500',
    marginLeft: 8,
  },
  pageTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 5, 
  },
  pageTitleIcon: {
    marginRight: 10,
  },
  pageTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: '#33334D', 
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    shadowColor: "#404040",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userNameTitle: { // For the user's full name, similar to accountName
    fontSize: 22,
    fontWeight: 'bold',
    color: '#33334D', // Using a standard dark color for user name
    textAlign: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 15,
    color: '#5A6978', 
    fontWeight: '500',
    // flex: 1, // Let it take natural width for label
  },
  infoValue: {
    fontSize: 15,
    color: '#33334D', 
    fontWeight: '500',
    flexShrink: 1, 
    textAlign: 'right', 
    marginLeft: 10, 
  },
  // Role badge styles from ManageUsersScreen.tsx
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 8, // Added to align with the value side
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  roleBadgeAdmin: { backgroundColor: '#DC3545' }, 
  roleBadgeManager: { backgroundColor: '#007BFF' }, 
  roleBadgeCreator: { backgroundColor: '#28A745' },
});