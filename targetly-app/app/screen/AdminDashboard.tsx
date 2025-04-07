import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AdminDashboard = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f7',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default AdminDashboard;
