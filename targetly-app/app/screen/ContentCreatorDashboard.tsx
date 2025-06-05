// src/screens/ContentCreatorDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FaUserEdit, FaSignOutAlt, FaUsers, FaThumbsUp, FaComments, 
  FaRegFileAlt, FaEye, FaBullseye, FaSpinner, FaInfoCircle, FaStar,
  FaChartBar, FaChartLine, FaGlobeAmericas, FaVenusMars, FaBirthdayCake
} from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const USER_ID_KEY = 'userId'; // Login olan Content Creator'ın kendi ID'si
const MANAGED_IG_ACCOUNT_ID_KEY = 'managedIgUserId'; // Content Creator'ın yönettiği IG hesabının ID'si (localStorage'da)

const ContentCreatorDashboard = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [managedIgUserId, setManagedIgUserId] = useState(null); // Yönetilen IG hesabının ID'si

  // 1. Yönetilen Instagram Hesabının ID'sini Al
  useEffect(() => {
    // Önce localStorage'dan yönetilen IG hesap ID'sini okumayı dene (Login sırasında kaydedilmiş olabilir)
    let igUserId = localStorage.getItem(MANAGED_IG_ACCOUNT_ID_KEY);
    console.log('[CC Dashboard] Mount - localStorage\'dan okunan managedIgUserId:', igUserId);

    if (igUserId) {
      setManagedIgUserId(igUserId);
    } else {
      // Eğer localStorage'da yoksa, Content Creator'ın kendi userId'si ile backend'den çekmeyi dene
      const contentCreatorUserId = localStorage.getItem(USER_ID_KEY);
      if (contentCreatorUserId) {
        console.log('[CC Dashboard] managedIgUserId localStorage\'da yok, backend\'den çekilecek. CC User ID:', contentCreatorUserId);
        // BU ENDPOINT SİZİN BACKEND YAPINIZA GÖRE DEĞİŞMELİDİR!
        // Bu endpoint, contentCreatorUserId'ye atanmış olan instagram hesabının ig_user_id'sini döndürmeli.
        axios.get(`${API_BASE_URL}/api/content-creator/get-managed-account-id/${contentCreatorUserId}`)
          .then(response => {
            if (response.data && response.data.ig_user_id) {
              const fetchedIgUserId = response.data.ig_user_id.toString();
              console.log('[CC Dashboard] Backend\'den yönetilen IG Hesap ID\'si alındı:', fetchedIgUserId);
              localStorage.setItem(MANAGED_IG_ACCOUNT_ID_KEY, fetchedIgUserId); // Gelecek sefer için kaydet
              setManagedIgUserId(fetchedIgUserId);
            } else {
              console.error('[CC Dashboard] Backend\'den yönetilen IG Hesap ID\'si alınamadı veya format yanlış.');
              window.alert("Yönettiğiniz Instagram hesabı bilgisi alınamadı.");
              setLoading(false);
            }
          })
          .catch(error => {
            console.error("[CC Dashboard] Yönetilen IG Hesap ID'sini çekerken hata:", error);
            window.alert("Hesap bilgileri çekilirken bir sorun oluştu.");
            setLoading(false);
          });
      } else {
        console.error("[CC Dashboard] Content Creator kullanıcı ID'si localStorage'da bulunamadı.");
        window.alert("Kimlik hatası: Lütfen tekrar giriş yapın.");
        setLoading(false);
        // if (onLogout) onLogout(); // Otomatik logout yapılabilir
      }
    }
  }, []); // Sadece component mount olduğunda çalışır

  // 2. Dashboard Verilerini Çekme Fonksiyonu
  const fetchDashboardData = useCallback(async (igAccountId) => {
    console.log(`[CC Dashboard] fetchDashboardData ÇAĞRILIYOR. IG Hesap ID: ${igAccountId}`);
    if (!igAccountId) {
      console.log('[CC Dashboard] fetchDashboardData - igAccountId eksik.');
      setDashboardData(null);
      setLoading(false); // Eğer ID yoksa yüklemeyi durdur
      return;
    }
    setLoading(true);
    setDashboardData(null); 
    try {
      const response = await axios.get(`${API_BASE_URL}/api/content-creator/dashboard-data/${igAccountId}`);
      setDashboardData(response.data);
      console.log("[CC Dashboard] Dashboard verisi başarıyla çekildi:", response.data);
    } catch (error) {
      console.error(`[CC Dashboard] Dashboard verilerini çekerken hata (IG ID: ${igAccountId}):`, error);
      // ... (hata yönetimi)
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, []); 

  // 3. managedIgUserId Değiştiğinde Dashboard Verilerini Çek
  useEffect(() => {
    console.log('[CC Dashboard] useEffect[managedIgUserId] tetiklendi. IG ID:', managedIgUserId);
    if (managedIgUserId) {
      fetchDashboardData(managedIgUserId);
    }
    // managedIgUserId null ise veya boşsa, veri çekilmez. Render kısmı bunu handle etmeli.
  }, [managedIgUserId, fetchDashboardData]);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(MANAGED_IG_ACCOUNT_ID_KEY); // Bunu da temizle
      // ... diğer localStorage temizlikleri ...
      window.location.href = '/login';
    }
  };
  
  // renderPostCard ve renderDemographicPill fonksiyonları öncekiyle aynı...

  // --- RENDER KISMI ---
  // managedIgUserId henüz set edilmemişken veya veri çekilirken loading göster
  if (loading) { 
    return (
      <div className="p-6 md:p-8 bg-slate-100 min-h-full flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
        <p className="text-xl text-slate-700">
          {managedIgUserId ? "Loading Your Dashboard..." : "Initializing Account..."}
        </p>
      </div>
    );
  }

  if (!dashboardData) { 
    return (
      <div className="p-6 md:p-8 bg-slate-100 min-h-full flex flex-col items-center justify-center text-center">
        <FaInfoCircle size={56} className="text-red-400 mb-5" />
        <p className="text-2xl text-slate-700 font-semibold">Could Not Load Dashboard Data</p>
        <p className="text-base text-slate-500 mt-2 mb-6">
          {managedIgUserId ? 
            "There was an issue fetching data for your account. Please ensure your account is correctly linked and try again." :
            "Could not determine the Instagram account to display. Please ensure you are logged in correctly or contact support."
          }
        </p>
        <button 
            onClick={handleLogoutClick}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow flex items-center gap-2"
        >
            <FaSignOutAlt /> Logout
        </button>
      </div>
    );
  }
  
  // ... (Dashboard'u render eden JSX kısmı öncekiyle aynı kalabilir)
  // Sadece header'daki hesap adı kısmını dashboardData.accountName veya managedIgUserId'ye göre ayarlayın.
  return (
    <div className="bg-slate-100 min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FaUserEdit className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-xs text-slate-500">Hello, Content Creator!</p>
                <h1 className="text-xl font-bold text-slate-800">{dashboardData.accountName || `Account ID: ${managedIgUserId}` || 'Your Account'}</h1>
              </div>
            </div>
            <button onClick={handleLogoutClick} title="Logout" className="p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-100 transition-colors">
              <FaSignOutAlt size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto space-y-10">
          {/* Overall Performance */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <FaChartBar className="text-indigo-500"/> Overall Performance (Last 30 Days)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Followers', value: dashboardData.totalFollowers?.toLocaleString(), icon: <FaUsers/> },
                { label: 'Posts (Last 30d)', value: dashboardData.overallStats?.totalPostsLast30Days, icon: <FaRegFileAlt/> },
                { label: 'Avg. Likes/Post', value: dashboardData.overallStats?.avgLikesPerPost?.toFixed(1), icon: <FaThumbsUp/> },
                { label: 'Avg. Comments/Post', value: dashboardData.overallStats?.avgCommentsPerPost?.toFixed(1), icon: <FaComments/> },
              ].map(metric => (
                <div key={metric.label} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center text-indigo-500 mb-3">
                    {React.cloneElement(metric.icon, { size: 20, className: "mr-3" })}
                    <h3 className="text-sm font-medium text-slate-500">{metric.label}</h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-800">{metric.value ?? 'N/A'}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Top Performing Post */}
          {dashboardData.topPerformingPost && (
            <section>
              <h2 className="text-2xl font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <FaStar className="text-yellow-400"/> Top Performing Post
              </h2>
              {renderPostCard(dashboardData.topPerformingPost)}
            </section>
          )}

          {/* All Posts Performance */}
          {dashboardData.allPosts && dashboardData.allPosts.length > 0 ? (
            <section>
              <h2 className="text-2xl font-semibold text-slate-700 mb-6">🚀 All Posts Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.allPosts.map(renderPostCard)}
              </div>
            </section>
          ) : (
            !loading && // Sadece yükleme bittiyse ve post yoksa göster
            <div className="text-center py-10 bg-white rounded-xl shadow">
                <FaInfoCircle className="text-3xl text-slate-400 mx-auto mb-3"/>
                <p className="text-slate-500 italic">No posts to display.</p>
            </div>
          )}

          {/* Follower Demographics */}
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
      </main>
    </div>
  );
};

export default ContentCreatorDashboard;