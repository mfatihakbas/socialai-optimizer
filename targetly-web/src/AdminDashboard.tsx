import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaUserFriends,
  FaCampground,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';

import ManageUsers from './ManageUsers';
import ManageCamps from './ManageCamps';
import Reports from './Reports';
import Settings from './Settings';

const AdminDashboard = () => {
  const location = useLocation();

  const renderContent = () => {
    switch (location.pathname) {
      case '/admin-dashboard/manage-users':
        return <ManageUsers />;
      case '/admin-dashboard/manage-camps':
        return <ManageCamps />;
      case '/admin-dashboard/reports':
        return <Reports />;
      case '/admin-dashboard/settings':
        return <Settings />;
      default:
        return (
          <>
            <h2 className="text-3xl font-bold mb-6">Welcome back, Admin!</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Users', value: '120' },
                { label: 'Total Camps', value: '35' },
                { label: 'Weekly Growth', value: '+8%', color: 'text-green-500' },
                { label: 'System Health', value: 'Good ✅', color: 'text-green-600' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-lg">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color || ''}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">📅 Content Calendar</h3>
                <p className="text-gray-500">Coming Soon...</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">📈 Campaign Performance</h3>
                <p className="text-gray-500">Coming Soon...</p>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-100 to-blue-200 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-600 mb-10 flex items-center gap-2">
            🎯 StyleAI
          </h1>
          <nav className="space-y-3">
            <Link
              to="/admin-dashboard"
              className={`flex items-center w-full gap-3 px-4 py-2 rounded-md ${
                location.pathname === '/admin-dashboard'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaTachometerAlt />
              Dashboard
            </Link>
            <Link
              to="/admin-dashboard/manage-users"
              className={`flex items-center w-full gap-3 px-4 py-2 rounded-md ${
                location.pathname === '/admin-dashboard/manage-users'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaUserFriends />
              Manage Users
            </Link>
            <Link
              to="/admin-dashboard/manage-camps"
              className={`flex items-center w-full gap-3 px-4 py-2 rounded-md ${
                location.pathname === '/admin-dashboard/manage-camps'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaCampground />
              Manage Camps
            </Link>
            <Link
              to="/admin-dashboard/reports"
              className={`flex items-center w-full gap-3 px-4 py-2 rounded-md ${
                location.pathname === '/admin-dashboard/reports'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaChartBar />
              Reports
            </Link>
            <Link
              to="/admin-dashboard/settings"
              className={`flex items-center w-full gap-3 px-4 py-2 rounded-md ${
                location.pathname === '/admin-dashboard/settings'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaCog />
              Settings
            </Link>
          </nav>
        </div>
        <button className="flex items-center gap-2 text-red-600 hover:text-red-800">
          <FaSignOutAlt />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;
