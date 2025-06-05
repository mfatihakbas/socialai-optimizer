// src/App.js

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Tüm ekran bileşenlerini import edin
import Login from './screens/Login';
import AdminDashboard from './screens/AdminDashboard'; // Bu Admin layout'u ve ana içeriği yönetir
import ManageUsers from './screens/ManageUsers';
import ManageAccounts from './screens/ManageAccounts';
import Reports from './screens/Reports';
import Settings from './screens/Settings';
import AccountManagerDashboard from './screens/AccountManagerDashboard'; 
import ContentCreatorDashboard from './screens/ContentCreatorDashboard'; // Kendi iç navigasyonunu yapan bileşen

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  
  // console.log('[App.js] Initial isAuthenticated state:', isAuthenticated, 'Role:', userRole);

  const handleLoginSuccess = (roleFromLogin) => {
    console.log('[App.js] handleLoginSuccess called. Role from login:', roleFromLogin);
    setIsAuthenticated(true);
    setUserRole(roleFromLogin); 
  };

  const handleLogout = () => {
    console.log('[App.js] handleLogout called.');
    localStorage.clear(); // Basitlik için tüm localStorage'ı temizle
    setIsAuthenticated(false);
    setUserRole(null); 
  };

  const getDashboardPath = (role) => {
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'account_manager') return '/account-manager-dashboard';
    if (role === 'content_creator') return '/content-creator-dashboard';
    // console.warn('[App.js] getDashboardPath: Unknown role, defaulting to /login. Role:', role);
    return '/login'; 
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to={getDashboardPath(userRole)} replace />}
        />

        {/* Admin Dashboard (Outlet kullanan yapı) */}
        <Route
          path="/admin-dashboard"
          element={isAuthenticated && userRole === 'admin' ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          {/* AdminDashboard.jsx, location.pathname === '/admin-dashboard' ise kendi ana içeriğini gösterir,
              diğerlerinde Outlet'e child route render edilir. */}
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="manage-accounts" element={<ManageAccounts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings onLogout={handleLogout}/>} />
          {/* Eğer AdminDashboard ana sayfası için ayrı bir bileşen olsaydı:
          <Route index element={<AdminDashboardMainContent />} /> 
          Ama AdminDashboard.jsx bunu kendi içinde yönetiyor. */}
        </Route>

        {/* Account Manager Dashboard (Tek başına bir sayfa, Outlet kullanmıyor varsayımı) */}
        <Route
          path="/account-manager-dashboard"
          element={isAuthenticated && userRole === 'account_manager' ? <AccountManagerDashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />

        {/* Content Creator Dashboard (Tek başına bir sayfa, kendi iç navigasyonunu yönetiyor, Outlet kullanmıyor) */}
        <Route
          path="/content-creator-dashboard" 
          element={
            isAuthenticated && userRole === 'content_creator' ? (
              <ContentCreatorDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Content Creator için App.js'de child route'lar YOK */}

        <Route
          path="/"
          element={isAuthenticated ? <Navigate to={getDashboardPath(userRole)} replace /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? getDashboardPath(userRole) : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;