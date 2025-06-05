// src/screens/Reports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FaChartLine, FaUsers, FaVenusMars, FaGlobeAmericas, FaBirthdayCake, 
  FaSpinner, FaInfoCircle, FaChevronDown, FaTimes 
} from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'; 

const Reports = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState('');

  const [reportSummary, setReportSummary] = useState(null);
  const [demographics, setDemographics] = useState(null);

  const [accountsLoading, setAccountsLoading] = useState(true);
  const [reportDataLoading, setReportDataLoading] = useState(false);
  
  const [demographicsDetailModalVisible, setDemographicsDetailModalVisible] = useState(false);
  const [selectedModalDemographics, setSelectedModalDemographics] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setReportSummary(null); 
    setDemographics(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reporting/accounts`);
      const fetchedAccounts = response.data;
      setAccounts(fetchedAccounts && Array.isArray(fetchedAccounts) ? fetchedAccounts : []);
      if (fetchedAccounts && fetchedAccounts.length > 0) {
        setSelectedAccountId(fetchedAccounts[0].id); 
        setSelectedAccountName(fetchedAccounts[0].name);
      } else {
        setSelectedAccountId('');
        setSelectedAccountName('');
      }
    } catch (error) {
      console.error("[Reports.jsx] Error fetching accounts:", error);
      setAccounts([]); 
    } finally {
      setAccountsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const fetchReportData = useCallback(async (accountId) => {
    if (!accountId) {
      setReportSummary(null);
      setDemographics(null);
      setReportDataLoading(false);
      return;
    }
    setReportDataLoading(true);
    setReportSummary(null); 
    setDemographics(null);  
    try {
      const [summaryRes, demoRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/reporting/account-summary/${accountId}`),
        axios.get(`${API_BASE_URL}/api/reporting/follower-demographics/${accountId}`)
      ]);
      setReportSummary(summaryRes.data);
      setDemographics(demoRes.data);
    } catch (error) {
      console.error(`[Reports.jsx] Error fetching report data for account ID ${accountId}:`, error);
    } finally {
      setReportDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchReportData(selectedAccountId);
    } else {
      setReportSummary(null);
      setDemographics(null);
    }
  }, [selectedAccountId, fetchReportData]);

  const handleAccountChange = (event) => {
    const accountId = event.target.value;
    const account = accounts.find(a => a.id === accountId);
    setSelectedAccountId(accountId);
    setSelectedAccountName(account ? account.name : '');
  };
  
  const openDemographicsDetailModal = (title, data) => {
    if (data && data.length > 0) {
      setSelectedModalDemographics({ title, data });
      setDemographicsDetailModalVisible(true);
    } else {
      window.alert(`No detailed ${title.toLowerCase()} data available to display.`);
    }
  };

  const renderDemographicIcon = (dataKey) => {
    if (dataKey === 'country') return <FaGlobeAmericas className="mr-2 text-blue-500 text-lg" />;
    if (dataKey === 'gender') return <FaVenusMars className="mr-2 text-pink-500 text-lg" />;
    if (dataKey === 'age') return <FaBirthdayCake className="mr-2 text-green-500 text-lg" />;
    return null;
  };

  const renderDemographicSection = (title, dataKey) => {
    const currentData = demographics && demographics[dataKey] ? demographics[dataKey] : [];

    if (reportDataLoading && (!demographics || !demographics[dataKey])) {
        return <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-48"><FaSpinner className="animate-spin text-indigo-500 text-3xl" /><p className="mt-2 text-sm text-slate-500">Loading...</p></div>;
    }
    // Yükleme bitti ve veri yoksa veya boşsa mesaj göster
    if (!reportDataLoading && (!currentData || currentData.length === 0)) {
      return <div className="bg-white p-6 rounded-xl shadow-lg text-sm text-slate-500 italic h-48 flex flex-col items-center justify-center"><FaInfoCircle className="text-2xl text-slate-400 mb-2"/><p>No {title.toLowerCase()} data available.</p></div>;
    }
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <button 
            onClick={() => openDemographicsDetailModal(title, currentData)}
            className="w-full text-left mb-4 pb-3 border-b border-slate-200 group"
        >
          <h3 className="text-xl font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors flex items-center">
            {renderDemographicIcon(dataKey)}
            {title} 
            <FaChevronDown size={14} className="ml-auto opacity-70 group-hover:opacity-100 transition-opacity"/>
          </h3>
        </button>
        <ul className="space-y-2">
          {currentData.slice(0, 3).map((item, index) => (
            <li key={`${dataKey}-${item.dimension}-${index}`} className="flex justify-between items-center text-sm py-1.5">
              <span className="text-slate-600">{item.dimension}:</span>
              <span className="font-medium text-slate-800">{item.value?.toLocaleString() ?? 'N/A'}</span>
            </li>
          ))}
        </ul>
        {currentData.length > 3 && (
          <button 
            onClick={() => openDemographicsDetailModal(title, currentData)} 
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-4 pt-2 border-t border-slate-100 block text-right w-full"
          >
            ...and {currentData.length - 3} more (View All)
          </button>
        )}
      </div>
    );
  };

  if (accountsLoading) {
    return (
      <div className="p-6 md:p-8 bg-slate-100 min-h-full flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
        <p className="text-xl text-slate-700">Loading Accounts...</p>
      </div>
    );
  }
  
  if (!accountsLoading && accounts.length === 0) {
    return (
        <div className="p-6 md:p-8 bg-slate-100 min-h-full flex flex-col items-center justify-center text-center">
            <FaInfoCircle size={56} className="text-slate-400 mb-5" />
            <p className="text-2xl text-slate-700 font-semibold">No Accounts Found</p>
            <p className="text-base text-slate-500 mt-2">
                Please add accounts to the system to view reports.
            </p>
        </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-100 min-h-full">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-4 lg:gap-6">
        <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3 whitespace-nowrap">
            <FaChartLine size={36} className="text-indigo-600"/>
            Account Reports
        </h1>
        {accounts.length > 0 && (
            <div className="relative w-full lg:w-auto lg:min-w-[320px]">
                <select
                    value={selectedAccountId}
                    onChange={handleAccountChange}
                    className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white pr-10 text-slate-700 text-base"
                >
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        )}
      </div>

      {!selectedAccountId && !accountsLoading && accounts.length > 0 && (
         <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl shadow-xl max-w-lg mx-auto">
            <FaInfoCircle size={48} className="text-slate-400 mb-4" />
            <p className="text-xl text-slate-600">Please select an account to view its report.</p>
        </div>
      )}
      
      {selectedAccountId && (
        <>
          {reportDataLoading ? (
            <div className="flex flex-col justify-center items-center my-10 h-96">
                <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
                <p className="text-lg text-slate-600">Loading report data for <span className="font-semibold">{selectedAccountName}</span>...</p>
            </div>
          ) : (
            <div className="space-y-10"> {/* Ana içerik için space-y eklendi */}
              {reportSummary ? (
                <div> {/* reportSummary için sarmalayıcı div */}
                    <h2 className="text-2xl font-semibold text-slate-700 mb-6">Key Metrics for <span className="text-indigo-600 font-bold">{selectedAccountName}</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center"><FaUsers className="mr-2 text-indigo-400"/>Total Followers</h3>
                            <p className="text-4xl font-bold text-slate-800">{reportSummary.totalFollowers?.toLocaleString() ?? 'N/A'}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center"><FaChartLine className="mr-2 text-green-400"/>Engagement Rate (Weekly)</h3>
                            <p className="text-4xl font-bold text-slate-800">{reportSummary.weeklyEngagementRate ?? 'N/A'}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center"><FaUsers className="mr-2 text-purple-400"/>Active Followers (Est.)</h3>
                            <p className="text-4xl font-bold text-slate-800">{reportSummary.activeFollowersEstimate?.toLocaleString() ?? 'N/A'}</p>
                        </div>
                    </div>
                </div> // reportSummary için sarmalayıcı div kapanışı
              ) : ( 
                 !reportDataLoading && 
                 <div className="text-center p-10 bg-white rounded-xl shadow-md">
                    <FaInfoCircle className="text-3xl text-slate-400 mx-auto mb-3"/>
                    <p className="text-slate-500 italic">Summary data is not available for this account.</p>
                </div>
              )}

              {demographics ? (
                <div> {/* demographics için sarmalayıcı div */}
                    <h2 className="text-2xl font-semibold text-slate-700 mb-6">Follower Demographics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderDemographicSection("Top Countries", "country")}
                        {renderDemographicSection("Gender Distribution", "gender")}
                        {renderDemographicSection("Age Groups", "age")}
                    </div>
                </div> // demographics için sarmalayıcı div kapanışı
              ) : ( 
                 !reportDataLoading && ( // KOŞUL DOĞRU ŞEKİLDE GRUPLANDI
                    <div className="text-center p-10 bg-white rounded-xl shadow-md">
                        <FaInfoCircle className="text-3xl text-slate-400 mx-auto mb-3"/>
                        <p className="text-slate-500 italic">Demographics data is not available for this account.</p>
                    </div>
                 )
              )}
            </div> // "space-y-10" div'inin kapanışı
          )} 
        </> // selectedAccountId && (...) fragment'ının kapanışı
      )}

      {/* Demographics Detay Modalı */}
      {demographicsDetailModalVisible && selectedModalDemographics && (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
            onClick={() => setDemographicsDetailModalVisible(false)}
        >
            <div 
                className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-indigo-700">{selectedModalDemographics.title} - Full List</h3>
                    <button 
                        onClick={() => setDemographicsDetailModalVisible(false)} 
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label="Close modal"
                    >
                        <FaTimes size={22}/>
                    </button>
                </div>
                <ul className="overflow-y-auto flex-grow space-y-1 pr-3 -mr-3 custom-scrollbar-thin">
                    {selectedModalDemographics.data.map((item, index) => (
                        <li key={`${selectedModalDemographics.title}-${item.dimension}-${index}`} className="flex justify-between items-center py-3 px-3 hover:bg-slate-50 rounded-md">
                            <span className="text-base text-slate-700">{item.dimension}</span>
                            <span className="text-base font-medium text-slate-800">{item.value.toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => setDemographicsDetailModalVisible(false)}
                    className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                    Close
                </button>
            </div>
        </div>
      )}
    </div> // Ana return div'inin kapanışı
  );
}; // const Reports = () => { ... } fonksiyonunun kapanışı

export default Reports;