// src/screens/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom'; // Artık burada navigate'e gerek yok

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_LOGIN_URL = `${API_BASE_URL}/login`;

const USER_ID_KEY = 'userId';
const USER_ROLE_KEY = 'userRole';
const USER_NAME_KEY = 'userName';
const USER_EMAIL_KEY = 'userEmail';
const USER_TOKEN_KEY = 'userToken';

// onLoginSuccess prop'unu al
const Login = ({ onLoginSuccess }) => { 
  // const navigate = useNavigate(); // Kaldırıldı
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(API_LOGIN_URL, { email, password });
      const data = response.data;
      console.log('✅ Login success:', data);

      if (data.user_id) localStorage.setItem(USER_ID_KEY, data.user_id.toString());
      if (data.role) localStorage.setItem(USER_ROLE_KEY, data.role);
      if (data.full_name) localStorage.setItem(USER_NAME_KEY, data.full_name);
      if (data.email) localStorage.setItem(USER_EMAIL_KEY, data.email);
      if (data.token) localStorage.setItem(USER_TOKEN_KEY, data.token);

      // App.js'deki fonksiyonu çağırarak durumu güncelle ve yönlendirmeyi App.js'e bırak
      if (onLoginSuccess) {
        onLoginSuccess(data.role); // Rol bilgisini App.js'e gönderebiliriz (opsiyonel)
      }
      // Yönlendirme artık App.js tarafından isAuthenticated state'i değişince yapılacak.
      // navigate('/admin-dashboard'); // Bu satır kaldırıldı veya yorumlandı

    } catch (err) {
      console.error('❌ Login error:', err);
      if (err.response) {
        setError(err.response.data.error || 'Invalid credentials or server error.');
      } else if (err.request) {
        setError('Server is not responding. Please check your network connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ... (JSX kısmı aynı kalabilir) ...
  return (
    <div className="min-h-screen flex">
      {/* Sol taraf - info alanı */}
      <div className="w-1/2 bg-gradient-to-br from-[#4C7CFF] to-[#1d3dd6] text-white flex flex-col justify-center px-16">
        <h1 className="text-4xl font-extrabold mb-4">Welcome Back to</h1>
        <h2 className="text-5xl font-black tracking-tight">TARGETLY</h2>
        <p className="mt-6 text-sm text-white/80 leading-relaxed">
          Social Media Intelligence platform with real-time tracking, trend prediction and brand monitoring.
        </p>
      </div>

      {/* Sağ taraf - login formu */}
      <div className="w-1/2 bg-white flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Login to your account</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C7CFF]"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 sr-only">
                Password
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm pr-20 focus:outline-none focus:ring-2 focus:ring-[#4C7CFF]"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                disabled={loading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 text-center py-1 bg-red-100 rounded-md">{error}</p>
            )}

            <button
              type="submit"
              className={`w-full bg-[#4C7CFF] hover:bg-[#3a5fc9] text-white font-semibold py-3 rounded-md transition-colors duration-150 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="text-[#4C7CFF] hover:underline">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;