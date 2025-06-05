// src/screens/AdminDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import {
  FaTachometerAlt, FaUsers, FaFileContract, FaChartBar, FaCog, FaSignOutAlt,
  FaCalendarAlt, FaLightbulb, FaExclamationTriangle, FaCheckCircle,
  FaCrosshairs, FaSpinner, FaThumbsUp, FaCommentDots,
  FaRegFileAlt,
  FaInfoCircle
} from 'react-icons/fa';

// Backend API URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Instagram Graph API için sabitler ve .env'den okuma
const IG_ACCESS_TOKEN = process.env.REACT_APP_IG_ACCESS_TOKEN;
const IG_ACCOUNT_ID = process.env.REACT_APP_IG_ACCOUNT_ID; // Admin panelinin izleyeceği ana hesap ID'si
const GRAPH_API_VERSION = process.env.REACT_APP_GRAPH_API_VERSION || "v20.0";
const GRAPH_API_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;


const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingSummary, setLoadingSummary] = useState(true); // Genel summary yüklemesi için
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  
  const [summaryDataFromBackend, setSummaryDataFromBackend] = useState(null); // Backend'den gelen diğer özetler
  const [instagramAccountInfo, setInstagramAccountInfo] = useState(null); // Graph API'den gelen takipçi/post
  
  const [calendarPosts, setCalendarPosts] = useState([]);
  const [insightData, setInsightData] = useState(null);
  const [fetchError, setFetchError] = useState('');

  const fetchDataForMainDashboard = useCallback(async () => {
    if (!API_BASE_URL) {
        console.warn("[AdminDashboard.jsx] API_BASE_URL tanımsız. .env dosyanızı kontrol edin.");
        setFetchError("API URL is not configured. Please check your environment settings.");
        setLoadingSummary(false);
        setLoadingCalendar(false);
        setLoadingInsights(false);
        return;
    }
    if (!IG_ACCESS_TOKEN || !IG_ACCOUNT_ID) {
        console.warn("[AdminDashboard.jsx] Instagram Token veya Account ID tanımsız. .env dosyanızı kontrol edin.");
        // Hata mesajı ayarlanabilir ama temel metrikler için Graph API çağrısı yapılmayacak.
    }

    setLoadingSummary(true); // Hem backend hem IG verisi için genel loading
    setLoadingCalendar(true);
    setLoadingInsights(true);
    setFetchError('');

    const backendSummaryPromise = axios.get(`${API_BASE_URL}/api/dashboard/summary`)
      .then(res => setSummaryDataFromBackend(res.data))
      .catch(err => {
        console.error("[AdminDashboard.jsx] Backend summary verisi çekilirken hata:", err);
        setFetchError(prev => prev + " Backend summary data could not be loaded. ");
        setSummaryDataFromBackend(null); // Hata durumunda veriyi temizle
      });

    let instagramDataPromise = Promise.resolve(); // Başlangıçta çözülmüş bir promise
    if (IG_ACCESS_TOKEN && IG_ACCOUNT_ID) {
      const fields = 'followers_count,media_count,username';
      const url = `${GRAPH_API_BASE_URL}/${IG_ACCOUNT_ID}?fields=${fields}&access_token=${IG_ACCESS_TOKEN}`;
      instagramDataPromise = axios.get(url)
        .then(res => setInstagramAccountInfo(res.data))
        .catch(err => {
          console.error("[AdminDashboard.jsx] Instagram Graph API verisi çekilirken hata:", err.response?.data || err.message);
          setFetchError(prev => prev + " Instagram account data could not be loaded (check token/ID). ");
          setInstagramAccountInfo({ followers_count: 0, media_count: 0 }); // Hata durumunda varsayılan
        });
    } else {
        // IG Token veya ID yoksa, Graph API çağrısı yapılmaz, state null kalır veya varsayılan ayarlanır
        setInstagramAccountInfo({ followers_count: 0, media_count: 0 });
        console.warn("[AdminDashboard.jsx] Instagram token or ID missing, skipping Graph API call for summary.");
    }

    const calendarPromise = axios.get(`${API_BASE_URL}/api/dashboard/content-calendar`)
      .then(res => setCalendarPosts(res.data && Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        console.error("[AdminDashboard.jsx] Content calendar verisi çekilirken hata:", err);
        setFetchError(prev => prev + " Content calendar data could not be loaded. ");
        setCalendarPosts([]);
      });

    const insightsPromise = axios.get(`${API_BASE_URL}/api/dashboard/insights-overview`)
      .then(res => setInsightData(res.data))
      .catch(err => {
        console.error("[AdminDashboard.jsx] Insights overview verisi çekilirken hata:", err);
        setFetchError(prev => prev + " Insights overview data could not be loaded. ");
        setInsightData(null);
      });

    try {
      await Promise.all([backendSummaryPromise, instagramDataPromise, calendarPromise, insightsPromise]);
    } catch (error) {
      // Promise.all içindeki hatalar zaten kendi catch bloklarında ele alınıyor.
      // Bu genel catch, Promise.all'un kendisiyle ilgili beklenmedik bir durum için.
      console.error("[AdminDashboard.jsx] Veri çekme operasyonları sırasında genel bir hata:", error);
      // setFetchError zaten ayarlanmış olacak
    } finally {
      setLoadingSummary(false);
      setLoadingCalendar(false);
      setLoadingInsights(false);
    }
  }, []); 

  useEffect(() => {
    if (location.pathname === '/admin-dashboard') {
      fetchDataForMainDashboard();
    }
  }, [location.pathname, fetchDataForMainDashboard]);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('userId'); 
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userToken');
      navigate('/login'); 
    }
  };

  const menuItems = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: <FaTachometerAlt size={20} /> },
    { path: 'manage-users', label: 'Manage Users', icon: <FaUsers size={20} /> },
    { path: 'manage-accounts', label: 'Manage Accounts', icon: <FaFileContract size={20} /> },
    { path: 'reports', label: 'View Reports', icon: <FaChartBar size={20} /> },
    { path: 'settings', label: 'Settings', icon: <FaCog size={20} /> },
  ];

  const MainDashboardContent = () => (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-10">
        Welcome back, Admin {instagramAccountInfo?.username ? `(@${instagramAccountInfo.username})` : ''}!
      </h1>
      
      {fetchError && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          <span className="font-medium">Error!</span> {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {renderKpiCard("Total Accounts", summaryDataFromBackend?.totalAccounts, loadingSummary, <FaUsers className="text-blue-500" />)}
        {renderKpiCard("Total Posts (IG)", instagramAccountInfo?.media_count, loadingSummary, <FaRegFileAlt className="text-green-500" />)}
        {renderKpiCard("Total Followers (IG)", instagramAccountInfo?.followers_count?.toLocaleString(), loadingSummary, <FaUsers className="text-purple-500" />)}
        {renderKpiCard(
          "System Health", 
          summaryDataFromBackend?.systemStatus, 
          loadingSummary, 
          summaryDataFromBackend?.systemStatus === 'Good ✅' || summaryDataFromBackend?.systemStatus === 'Good' ? <FaCheckCircle className="text-green-600"/> : <FaExclamationTriangle className="text-red-600"/>,
          summaryDataFromBackend?.systemStatus === 'Good ✅' || summaryDataFromBackend?.systemStatus === 'Good' ? "text-green-600" : "text-red-600"
        )}
      </div>
      {/* Diğer bölümler (Content Calendar, Insights Overview) aynı kalıyor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-slate-700 mb-5 flex items-center gap-2">
            <FaCalendarAlt className="text-purple-600" /> Content Calendar
          </h2>
          {loadingCalendar ? (
            <div className="flex justify-center items-center h-60"><FaSpinner className="animate-spin text-3xl text-indigo-600" /></div>
          ) : calendarPosts.length > 0 ? (
            <div className="flex overflow-x-auto items-stretch space-x-4 pb-4 -mx-1 px-1 custom-scrollbar" style={{minHeight: '300px', height: 'auto'}}> 
              {calendarPosts.map(renderCalendarItem)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-slate-500">
              <FaInfoCircle className="text-3xl mb-2 text-slate-400"/>
              <p className="italic">No posts to display in calendar.</p>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-slate-700 mb-5 flex items-center gap-2">
            <FaLightbulb className="text-yellow-500" /> Insights Overview
          </h2>
          {renderInsightItem()}
        </div>
      </div>
    </>
  );

  // renderKpiCard, renderCalendarItem, renderInsightItem fonksiyonları aynı kalıyor
  const renderKpiCard = (title, value, isLoading, icon, valueColor = "text-slate-800") => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex-1 min-w-[200px] hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        {icon && <div className="p-2 bg-slate-100 rounded-full">{React.cloneElement(icon, {size: 20})}</div>}
      </div>
      {isLoading ? (
        <div className="h-10 flex items-center"><FaSpinner className="animate-spin text-2xl text-indigo-600" /></div>
      ) : (
        <p className={`text-4xl font-bold ${valueColor}`}>{value ?? 'N/A'}</p>
      )}
    </div>
  );

  const renderCalendarItem = (post) => (
    <div 
      key={post.id || post.instagram_post_id} 
      className="bg-slate-50 p-4 rounded-lg shadow-md w-[300px] max-w-[340px] flex-shrink-0 border border-slate-200 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-indigo-400 transform hover:-translate-y-1"
    >
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
          <span>{new Date(post.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span className="font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{post.media_type ? post.media_type.replace('_', ' ').toUpperCase() : 'N/A'}</span>
        </div>
        <p className="text-sm text-slate-800 font-medium mb-2 leading-relaxed whitespace-pre-wrap min-h-[60px]" title={post.caption_cleaned}>
          {post.caption_cleaned || "No Caption"}
        </p>
      </div>
      <div className="mt-auto pt-3 border-t border-slate-200">
        <p className="text-xs text-indigo-600 font-medium mb-1.5">Account: {post.instagram_user_id}</p>
        <div className="flex justify-start items-center text-xs text-slate-600 gap-4">
          <span className="flex items-center gap-1"><FaThumbsUp className="text-blue-500"/> {post.like_count?.toLocaleString() ?? 0}</span>
          <span className="flex items-center gap-1"><FaCommentDots className="text-green-500"/> {post.comments_count?.toLocaleString() ?? 0}</span>
        </div>
      </div>
    </div>
  );
  
  const renderInsightItem = () => {
    if (loadingInsights) return <div className="flex justify-center items-center h-60"><FaSpinner className="animate-spin text-3xl text-indigo-600" /></div>;
    if (!insightData || Object.keys(insightData).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-60 text-slate-500">
          <FaInfoCircle className="text-3xl mb-2 text-slate-400"/>
          <p className="italic">No insights data available.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {insightData.recentReach !== undefined && ( <div className="flex justify-between items-center p-4 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"> <p className="text-sm text-sky-700 font-medium">Recent Reach (7d):</p> <p className="text-lg text-sky-800 font-semibold">{insightData.recentReach.toLocaleString()}</p> </div> )}
        {insightData.totalImpressionsLast7Days !== undefined && ( <div className="flex justify-between items-center p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"> <p className="text-sm text-teal-700 font-medium">Impressions (7d):</p> <p className="text-lg text-teal-800 font-semibold">{insightData.totalImpressionsLast7Days.toLocaleString()}</p> </div> )}
        {insightData.averageEngagementRate !== undefined && ( <div className="flex justify-between items-center p-4 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"> <p className="text-sm text-violet-700 font-medium">Avg. Engagement Rate:</p> <p className="text-lg text-violet-800 font-semibold">{insightData.averageEngagementRate.toFixed(2)}%</p> </div> )}
        {insightData.topPostByLikes && ( <div className="p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"> <p className="text-sm text-pink-700 font-medium">Top Post (by Likes):</p> <p className="text-sm text-pink-800 truncate mt-1" title={insightData.topPostByLikes.caption_cleaned}> {insightData.topPostByLikes.caption_cleaned || "No Caption"} </p> <p className="text-base text-pink-800 font-semibold">Likes: {insightData.topPostByLikes.like_count.toLocaleString()}</p> </div> )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <aside className="w-64 bg-white shadow-2xl p-6 flex flex-col justify-between">
        <div>
          <Link to="/admin-dashboard" className="flex items-center gap-3 mb-12 text-3xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            <FaCrosshairs className="text-indigo-500" />
            Targetly
          </Link>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const fullPath = item.path === '/admin-dashboard' ? item.path : `/admin-dashboard/${item.path}`;
              const isActive = (item.path === '/admin-dashboard' && location.pathname === '/admin-dashboard') || 
                               (item.path !== '/admin-dashboard' && location.pathname.startsWith(fullPath) && fullPath.length > '/admin-dashboard'.length);
              return ( <Link key={item.label} to={fullPath} className={`flex items-center w-full gap-3.5 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out group ${isActive ? 'bg-indigo-600 text-white shadow-lg transform scale-105' : 'text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 hover:shadow-md hover:translate-x-1'}`}> <span className="text-xl group-hover:animate-pulse">{item.icon}</span> <span className="font-medium">{item.label}</span> </Link> );
            })}
          </nav>
        </div>
        <button onClick={handleLogoutClick} className="flex items-center w-full gap-3.5 px-4 py-3 mt-8 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 font-medium transition-colors group"> <FaSignOutAlt className="text-xl group-hover:animate-ping"/> Logout </button>
      </aside>
      <main className="flex-1 p-8 md:p-10 overflow-y-auto">
        {location.pathname === '/admin-dashboard' ? ( <MainDashboardContent /> ) : ( <Outlet />  )}
      </main>
    </div>
  );
};

export default AdminDashboard;