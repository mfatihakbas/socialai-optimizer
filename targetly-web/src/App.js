import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import AdminDashboard from './AdminDashboard.tsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Giriş ekranı */}
        <Route path="/" element={<Login />} />

        {/* Admin paneli ve tüm alt sayfaları tek komponent içinde */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-dashboard/manage-users" element={<AdminDashboard />} />
        <Route path="/admin-dashboard/manage-camps" element={<AdminDashboard />} />
        <Route path="/admin-dashboard/reports" element={<AdminDashboard />} />
        <Route path="/admin-dashboard/settings" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
