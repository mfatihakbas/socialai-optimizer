import React from 'react';

const Reports = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Reports</h2>
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-xl shadow-md">
          <p className="text-sm text-gray-500">Total Users: <span className="font-bold text-black">1200</span></p>
          <p className="text-sm text-gray-500">Total Camps: <span className="font-bold text-black">48</span></p>
          <p className="text-sm text-gray-500">Weekly Signups: <span className="text-green-500 font-bold">+15%</span></p>
          <p className="text-sm text-gray-500">Active Users: <span className="font-bold text-black">860</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-md text-gray-400 text-center">
          <div className="h-40 flex items-center justify-center border rounded">[Graph Placeholder]</div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

