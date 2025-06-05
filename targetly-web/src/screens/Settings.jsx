// Settings.jsx (Content Only - to be rendered via <Outlet /> in AdminDashboard.jsx or similar layout)
import React, { useState, useEffect, useCallback } from 'react';
// useNavigate might not be needed if all navigation is handled by parent/sidebar
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaCog, FaUserCircle, FaSpinner
} from 'react-icons/fa';

// Consistent API_BASE_URL handling
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function Settings() {
  // const navigate = useNavigate(); // Only if needed for actions within this component

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(1); // Test User ID, replace with actual auth

  useEffect(() => {
    if (API_BASE_URL === 'http://localhost:5000' && !process.env.REACT_APP_API_BASE_URL) {
      console.warn(
        `[Settings.jsx - Content] API_BASE_URL is using the fallback 'http://localhost:5000'. 
        Ensure REACT_APP_API_BASE_URL is set in your .env file or update the fallback.`
      );
    } else {
      console.log(`[Settings.jsx - Content] Using API_BASE_URL: ${API_BASE_URL}`);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userIdToFetch) => {
    if (!userIdToFetch) {
      window.alert('Error: User ID is missing for profile fetch.');
      setLoadingProfile(false);
      console.error("[Settings.jsx - Content] User ID is missing for profile fetch.");
      return;
    }

    const fullApiUrl = `${API_BASE_URL}/api/profile/user/${userIdToFetch}`;
    console.log("[Settings.jsx - Content] Attempting to fetch profile from URL:", fullApiUrl);

    setLoadingProfile(true);
    try {
      const response = await axios.get(fullApiUrl);
      setProfile(response.data);
    } catch (error) {
      console.error("[Settings.jsx - Content] Error fetching user profile:", error);
      let errorMessage = "Could not fetch profile information.";
      if (error.response) {
        errorMessage += ` (Server: ${error.response.status} - ${error.response.data?.error || error.response.data?.message || 'Unknown server error'})`;
      } else if (error.request) {
        errorMessage += ` (Network Error: No response. Is backend at ${API_BASE_URL} running?)`;
      } else {
        errorMessage += ` (Request Setup Error: ${error.message})`;
      }
      window.alert("Error: " + errorMessage);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    // In a real app, currentUserId should be derived from an auth context
    // const actualUserIdFromAuthContext = auth.userId; // Example
    // if (actualUserIdFromAuthContext) {
    //   setCurrentUserId(actualUserIdFromAuthContext);
    //   fetchUserProfile(actualUserIdFromAuthContext);
    // } else {
    //   console.warn("[Settings.jsx - Content] No authenticated user ID found.");
    //   setLoadingProfile(false);
    // }

    // For current setup with testUserId:
    if (currentUserId) {
      fetchUserProfile(currentUserId);
    } else {
      setLoadingProfile(false);
    }
  }, [currentUserId, fetchUserProfile]);

  return (
    <div className="font-sans"> {/* Add font-sans if not globally set by parent */}
      {/* The redundant "Dashboard" button has been REMOVED from here */}

      <h1 className="text-2xl md:text-3xl font-semibold text-slate-700 mb-8 flex items-center justify-center">
        <FaCog className="mr-3 text-indigo-500" /> My Settings
      </h1>

      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-700 mb-6 pb-3 border-b border-slate-200">
          My Profile
        </h2>

        {loadingProfile ? (
          <div className="flex justify-center items-center py-8">
            <FaSpinner className="animate-spin text-2xl text-indigo-500" />
            <p className="ml-3 text-slate-500">Loading profile...</p>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <p className="w-1/4 text-sm text-slate-500">Name:</p>
              <p className="w-3/4 text-sm text-slate-700 font-medium">{profile.full_name || 'N/A'}</p>
            </div>
            <div className="flex items-center">
              <p className="w-1/4 text-sm text-slate-500">Email:</p>
              <p className="w-3/4 text-sm text-slate-700 font-medium">{profile.email || 'N/A'}</p>
            </div>
            {profile.role && (
               <div className="flex items-center">
                  <p className="w-1/4 text-sm text-slate-500">Role:</p>
                  <p className="w-3/4 text-sm text-slate-700 font-medium capitalize">{profile.role}</p>
                </div>
            )}

            <div className="pt-4 mt-2 space-y-2">
              <button
                onClick={() => window.alert("Edit Profile: Functionality to be implemented.")}
                className="block text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => window.alert("Change Password: Functionality to be implemented.")}
                className="block text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-500">Could not load profile information.</p>
            <p className="text-xs text-slate-400 mt-1">Please try again or contact support.</p>
          </div>
        )}
      </div>
    </div>
  );
}