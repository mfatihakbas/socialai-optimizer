import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserDashboard = () => {
    return (
        <View style={styles.container}>
            <Text>User Dashboard</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default UserDashboard;  // DİKKAT: export default eklenmeli
