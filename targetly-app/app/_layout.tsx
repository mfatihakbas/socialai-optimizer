// app/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';

const Layout = () => {
    return (
        <Stack initialRouteName="LoginScreen">
            <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
            <Stack.Screen name="AdminDashboard" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="UserDashboard" options={{ title: 'User Dashboard' }} />
            <Stack.Screen name="CampOwnerDashboard" options={{ title: 'Camp Owner Dashboard' }} />
        </Stack>
    );
};

export default Layout;
