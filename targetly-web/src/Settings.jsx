import React from 'react';

const Settings = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <div>
          <p className="font-semibold">Name: Admin User</p>
          <p className="text-sm text-gray-500">Email: admin@example.com</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Change Password</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Notification Preferences</button>
        <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Logout</button>
      </div>
    </div>
  );
};

export default Settings;
