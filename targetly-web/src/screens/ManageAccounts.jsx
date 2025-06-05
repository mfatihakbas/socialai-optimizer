// src/screens/ManageAccounts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaInstagram, FaUserTie, FaPaintBrush, FaSpinner, FaInfoCircle } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Fonksiyonu normal şekilde tanımla
const ManageAccounts = () => { 
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMainAccountInfo = useCallback(async () => {
    if (!API_BASE_URL || API_BASE_URL === 'http://localhost:5000') {
        console.warn("API URL is using a fallback or is not set. Ensure REACT_APP_API_BASE_URL is set in your .env file.");
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/managed-instagram-accounts`);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setAccountInfo(response.data[0]); 
      } else {
        setAccountInfo(null);
        console.log("No account data received or data is not an array:", response.data);
      }
    } catch (error) {
      console.error("Error fetching main account info:", error);
      setAccountInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMainAccountInfo();
  }, [fetchMainAccountInfo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
        <p className="text-lg text-slate-700">Loading Account Information...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FaInstagram size={32} className="text-indigo-600"/>
            Managed Instagram Account
        </h1>
      </div>

      {accountInfo ? (
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-6 pb-3 border-b border-slate-200 text-center">
            {accountInfo.name}
          </h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><FaInstagram /> Instagram User ID:</span>
              <span className="text-sm text-slate-700 font-semibold">{accountInfo.instagramUserId || accountInfo.id}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><FaUserTie /> Assigned Manager:</span>
              <span className="text-sm text-slate-700">{accountInfo.managerName || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><FaPaintBrush /> Assigned Content Creator:</span>
              <span className="text-sm text-slate-700">{accountInfo.creatorName || 'N/A'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-xl shadow-lg max-w-md mx-auto">
          <FaInfoCircle size={48} className="text-slate-400 mb-4" />
          <p className="text-lg text-slate-600">
            No account information to display.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Please ensure an account is configured in the system.
          </p>
        </div>
      )}
    </div>
  );
}; // Fonksiyonu burada bitir

export default ManageAccounts; // Ve sonunda default export yap