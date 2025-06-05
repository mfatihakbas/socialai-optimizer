// src/screens/AccountManagerDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FaUserShield, FaSignOutAlt, FaUsers, FaThumbsUp, FaComments, FaChartBar, 
  FaRegFileAlt, FaEye, FaBullseye, FaGlobeAmericas, FaVenusMars, FaBirthdayCake,
  FaSpinner, FaInfoCircle, FaChevronDown, FaTimes
} from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const USER_ID_KEY = 'userId'; 

const AccountManagerDashboard = ({ onLogout }) => {
  const [managedAccounts, setManagedAccounts] = useState([]);
  const [selectedManagedAccountId, setSelectedManagedAccountId] = useState('');
  const [selectedManagedAccountName, setSelectedManagedAccountName] = useState(''); // Doğru state adı

  const [dashboardData, setDashboardData] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [dashboardDataLoading, setDashboardDataLoading] = useState(false);

  const fetchManagedAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setDashboardData(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reporting/accounts`); // Veya AM'ye özel endpoint
      const fetchedAccounts = response.data;
      setManagedAccounts(fetchedAccounts && Array.isArray(fetchedAccounts) ? fetchedAccounts : []);
      if (fetchedAccounts && fetchedAccounts.length > 0) {
        setSelectedManagedAccountId(fetchedAccounts[0].id); 
        setSelectedManagedAccountName(fetchedAccounts[0].name);
      } else {
        setSelectedManagedAccountId('');
        setSelectedManagedAccountName('');
      }
    } catch (error) {
      console.error("[AM Dashboard] Yönetilen hesapları çekerken hata:", error);
      setManagedAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagedAccounts();
  }, [fetchManagedAccounts]);

  const fetchDashboardDetails = useCallback(async (accountId) => {
    if (!accountId) {
      setDashboardData(null);
      setDashboardDataLoading(false);
      return;
    }
    setDashboardDataLoading(true);
    setDashboardData(null); 
    try {
      const response = await axios.get(`${API_BASE_URL}/api/account-manager/dashboard-data/${accountId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error(`[AM Dashboard] Dashboard detay verilerini çekerken hata (Hesap ID: ${accountId}):`, error);
      setDashboardData(null);
    } finally {
      setDashboardDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedManagedAccountId) {
      fetchDashboardDetails(selectedManagedAccountId);
    } else {
      setDashboardData(null);
    }
  }, [selectedManagedAccountId, fetchDashboardDetails]);

  const handleAccountChange = (event) => {
    const accountId = event.target.value;
    const account = managedAccounts.find(a => a.id === accountId);
    setSelectedManagedAccountId(accountId);
    setSelectedManagedAccountName(account ? account.name : '');
  };
  
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem(USER_ID_KEY);
      window.location.href = '/login';
    }
  };

  const renderPostItem = (post) => (
    <div key={post.id} className="bg-white p-4 rounded-lg shadow-md min-w-[280px] max-w-[320px] flex-shrink-0 mr-4 border border-slate-200 flex flex-col">
      <p className="text-xs text-slate-500 mb-1.5">
        {new Date(post.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
      <p className="text-sm text-slate-700 font-medium mb-2 h-16 overflow-hidden leading-tight" title={post.caption_cleaned}>
        {post.caption_cleaned || "No caption"}
      </p>
      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-start gap-4 text-xs text-slate-600">
        <span className="flex items-center"><FaThumbsUp className="mr-1 text-blue-500"/> {post.like_count.toLocaleString()}</span>
        <span className="flex items-center"><FaComments className="mr-1 text-green-500"/> {post.comments_count.toLocaleString()}</span>
      </div>
    </div>
  );

  const renderDemographicPill = (item, index, type) => (
    <div key={`${type}-${item.dimension}-${index}`} className="bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full">
      {item.dimension}: {item.value.toLocaleString()}
    </div>
  );

  if (accountsLoading) {
    return (
      <div className="p-6 md:p-8 bg-slate-100 min-h-full flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
        <p className="text-xl text-slate-700">Loading Managed Accounts...</p>
      </div>
    );
  }
  
  if (!accountsLoading && managedAccounts.length === 0) {
    return (
        <div className="p-6 md:p-8 bg-slate-100 min-h-full flex flex-col items-center justify-center text-center">
            <FaInfoCircle size={56} className="text-slate-400 mb-5" />
            <p className="text-2xl text-slate-700 font-semibold">No Managed Accounts Found</p>
            <p className="text-base text-slate-500 mt-2">
                You are not currently managing any Instagram accounts. Please contact an administrator.
            </p>
            <button 
                onClick={handleLogoutClick}
                className="mt-8 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow flex items-center gap-2"
            >
                <FaSignOutAlt /> Logout
            </button>
        </div>
    );
  }
  
  return (
    <div className="bg-slate-100 min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FaUserShield className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-xs text-slate-500">Welcome Back</p>
                <h1 className="text-xl font-bold text-slate-800">{dashboardData?.accountName || selectedManagedAccountName || 'Account Manager'}</h1>
              </div>
            </div>
            {managedAccounts.length > 1 && (
                <div className="relative min-w-[200px] sm:min-w-[250px] ml-auto mr-4">
                    <select
                        value={selectedManagedAccountId}
                        onChange={handleAccountChange}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-8 text-slate-700 text-sm"
                    >
                        {managedAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            )}
            <button
              onClick={handleLogoutClick}
              title="Logout"
              className="p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-100 transition-colors"
            >
              <FaSignOutAlt size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          {!selectedManagedAccountId && !accountsLoading && managedAccounts.length > 0 && (
             <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl shadow-xl max-w-lg mx-auto">
                <FaInfoCircle size={48} className="text-slate-400 mb-4" />
                <p className="text-xl text-slate-600">Please select a managed account to view its dashboard.</p>
            </div>
          )}

          {selectedManagedAccountId && (
            <>
              {dashboardDataLoading ? (
                <div className="flex flex-col justify-center items-center my-10 h-96">
                    <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
                    {/* DÜZELTME: selectedAccountName -> selectedManagedAccountName */}
                    <p className="text-lg text-slate-600">Loading dashboard for <span className="font-semibold">{selectedManagedAccountName}</span>...</p>
                </div>
              ) : dashboardData ? (
                <div className="space-y-10">
                  <section>
                    <h2 className="text-2xl font-semibold text-slate-700 mb-6 flex items-center gap-2">
                        <FaChartBar className="text-indigo-500"/> Key Metrics (Last 7 Days)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                      {[
                        { label: 'Total Followers', value: dashboardData.totalFollowers?.toLocaleString(), icon: <FaUsers/> },
                        { label: 'Recent Posts', value: dashboardData.recentPostsCount, icon: <FaRegFileAlt/> },
                        { label: 'Avg. Likes/Post', value: dashboardData.avgLikesPerPost?.toFixed(1), icon: <FaThumbsUp/> },
                        { label: 'Avg. Comments/Post', value: dashboardData.avgCommentsPerPost?.toFixed(1), icon: <FaComments/> },
                        { label: 'Reach', value: dashboardData.recentReach?.toLocaleString(), icon: <FaEye/> },
                        { label: 'Impressions', value: dashboardData.recentImpressions?.toLocaleString(), icon: <FaBullseye/> },
                      ].map(metric => (
                        <div key={metric.label} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <div className="flex items-center text-indigo-500 mb-3">
                            {React.cloneElement(metric.icon, { size: 20, className: "mr-3" })}
                            <h3 className="text-sm font-medium text-slate-500">{metric.label}</h3>
                          </div>
                          <p className="text-3xl lg:text-4xl font-bold text-slate-800">{metric.value ?? 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {dashboardData.latestPosts && dashboardData.latestPosts.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-semibold text-slate-700 mb-6">🗓️ Recent Posts</h2>
                      <div className="flex overflow-x-auto space-x-4 pb-4 custom-scrollbar">
                        {dashboardData.latestPosts.map(renderPostItem)}
                      </div>
                    </section>
                  )}

                  {dashboardData.demographics && (
                    <section>
                      <h2 className="text-2xl font-semibold text-slate-700 mb-6">🌍 Follower Demographics</h2>
                      <div className="bg-white p-6 rounded-xl shadow-lg">
                        {dashboardData.demographics.topCountries && dashboardData.demographics.topCountries.length > 0 && (
                          <div className="mb-6 pb-4 border-b border-slate-200 last:border-b-0 last:pb-0">
                            <h3 className="text-lg font-medium text-slate-600 mb-3 flex items-center"><FaGlobeAmericas className="mr-2 text-blue-500"/>Top Countries</h3>
                            <div className="flex flex-wrap gap-2">
                              {dashboardData.demographics.topCountries.slice(0,5).map((item, i) => renderDemographicPill(item, i, 'country'))}
                            </div>
                          </div>
                        )}
                        {dashboardData.demographics.genderDistribution && dashboardData.demographics.genderDistribution.length > 0 && (
                          <div className="mb-6 pb-4 border-b border-slate-200 last:border-b-0 last:pb-0">
                            <h3 className="text-lg font-medium text-slate-600 mb-3 flex items-center"><FaVenusMars className="mr-2 text-pink-500"/>Gender Distribution</h3>
                            <div className="flex flex-wrap gap-2">
                              {dashboardData.demographics.genderDistribution.map((item, i) => renderDemographicPill(item, i, 'gender'))}
                            </div>
                          </div>
                        )}
                        {dashboardData.demographics.ageGroups && dashboardData.demographics.ageGroups.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium text-slate-600 mb-3 flex items-center"><FaBirthdayCake className="mr-2 text-green-500"/>Age Groups</h3>
                            <div className="flex flex-wrap gap-2">
                              {dashboardData.demographics.ageGroups.slice(0,5).map((item, i) => renderDemographicPill(item, i, 'age'))}
                            </div>
                          </div>
                        )}
                         {(!dashboardData.demographics?.topCountries || dashboardData.demographics.topCountries.length === 0) &&
                          (!dashboardData.demographics?.genderDistribution || dashboardData.demographics.genderDistribution.length === 0) &&
                          (!dashboardData.demographics?.ageGroups || dashboardData.demographics.ageGroups.length === 0) &&
                           <p className="text-sm text-slate-500 italic text-center py-4">No demographic data available.</p>
                         }
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                 !dashboardDataLoading &&
                 <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-xl shadow-xl max-w-lg mx-auto">
                    <FaInfoCircle size={48} className="text-red-400 mb-4" />
                    {/* DÜZELTME: selectedAccountName -> selectedManagedAccountName */}
                    <p className="text-xl text-slate-600">Data could not be loaded for <span className="font-semibold">{selectedManagedAccountName}</span>.</p>
                    <p className="text-sm text-slate-500 mt-2">Please try again or check if the account is properly configured.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AccountManagerDashboard;