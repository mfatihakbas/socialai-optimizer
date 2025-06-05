// src/screens/ContentCreatorDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FaTachometerAlt, FaMagic, FaPlusSquare, FaClock, FaSignOutAlt, FaUserEdit,
  FaUsers, FaThumbsUp, FaComments, FaRegFileAlt, FaEye, FaBullseye,
  FaSpinner, FaInfoCircle, FaStar, FaChartBar, FaChartLine,
  FaGlobeAmericas, FaVenusMars, FaBirthdayCake,
  FaAlignLeft, FaHashtag, FaUpload, FaPaperPlane, FaCheckCircle
} from 'react-icons/fa';

const IG_ACCESS_TOKEN = process.env.REACT_APP_IG_ACCESS_TOKEN;
const IG_ACCOUNT_ID_FROM_ENV = process.env.REACT_APP_IG_ACCOUNT_ID;
const GRAPH_API_VERSION = process.env.REACT_APP_GRAPH_API_VERSION || "v20.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// --- OptimalInsightsView Bileşeni ---
const OptimalInsightsView = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchOptimalPostingInfo = useCallback(async () => { setLoading(true); setError(''); try { const response = await axios.get(`${API_BASE_URL}/api/optimal-posting-info`); setInsights(response.data); } catch (err) { setError("Optimal gönderi bilgileri yüklenirken bir sorun oluştu."); console.error("Error fetching optimal insights:", err); setInsights(null); } finally { setLoading(false); }}, []);
  useEffect(() => { fetchOptimalPostingInfo(); }, [fetchOptimalPostingInfo]);
  if (loading) return <div className="p-10 flex justify-center items-center h-full"><FaSpinner className="animate-spin text-4xl text-indigo-600" /></div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!insights) return <div className="p-10 text-center text-slate-500">No optimal insights data found.</div>;
  return ( <div className="p-6 md:p-10"> <div className="flex items-center gap-3 mb-10"><FaMagic size={36} className="text-indigo-600" /><h1 className="text-4xl font-bold text-slate-800">Optimal Posting Insights</h1></div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"> {insights.best_time_prediction && (<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"><h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center"><FaClock className="mr-2 text-green-500" /> Best Posting Time</h2><p className="text-3xl font-bold text-green-600">{insights.best_time_prediction.day_name}, ~{insights.best_time_prediction.hour}:00</p><p className="text-sm text-slate-500 mt-1">Est. Likes: {insights.best_time_prediction.estimated_likes?.toFixed(0)}</p></div>)} {insights.best_caption_length_prediction && (<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"><h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center"><FaAlignLeft className="mr-2 text-blue-500" /> Ideal Caption Length</h2><p className="text-3xl font-bold text-blue-600">~{insights.best_caption_length_prediction.length} chars</p><p className="text-sm text-slate-500 mt-1">Est. Likes: {insights.best_caption_length_prediction.estimated_likes_at_best_time?.toFixed(0)}</p></div>)} {insights.ideal_hashtag_count && (<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"><h2 className="text-xl font-semibold text-slate-700 mb-3 flex items-center"><FaHashtag className="mr-2 text-purple-500" /> Ideal Hashtag Count</h2><p className="text-3xl font-bold text-purple-600">{insights.ideal_hashtag_count.count}</p>{insights.ideal_hashtag_count.note && (<p className="text-xs text-slate-400 mt-1 italic">{insights.ideal_hashtag_count.note}</p>)}</div>)} </div> {insights.most_important_features && insights.most_important_features.length > 0 && (<div className="mt-12 bg-white p-6 rounded-xl shadow-lg"><h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center"><FaChartBar className="mr-2 text-orange-500" /> Key Factors for Engagement</h2><ul className="space-y-3">{insights.most_important_features.map((f, i) => (<li key={i} className="p-3 bg-slate-50 rounded-md"><div className="flex justify-between items-center text-sm mb-1"><span className="text-slate-700 font-medium capitalize">{f.feature.replace(/_/g, ' ')}</span><span className="font-semibold text-orange-600">{(f.importance * 100).toFixed(1)}%</span></div><div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${(f.importance * 100).toFixed(1)}%` }}></div></div></li>))}</ul></div>)} </div> );
};

// --- CreatePostView Bileşeni ---
const CreatePostView = () => {
  const [postSubject, setPostSubject] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('');

  const [captionSuggestions, setCaptionSuggestions] = useState([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  
  const [selectedCaption, setSelectedCaption] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState('');
  
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTimeInput, setScheduleTimeInput] = useState('');
  
  const [useOptimalTime, setUseOptimalTime] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [optimalTimeSuggestion, setOptimalTimeSuggestion] = useState("Click checkbox to load AI suggested time");
  const [isFetchingOptimalTime, setIsFetchingOptimalTime] = useState(false);
  const [aiSuggestedHour, setAiSuggestedHour] = useState(null);


  const fetchAndSetOptimalTime = useCallback(async () => {
    setIsFetchingOptimalTime(true);
    setOptimalTimeSuggestion("Loading optimal time...");
    setAiSuggestedHour(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/optimal-posting-info`);
      if (response.data && response.data.best_time_prediction) {
        const { hour } = response.data.best_time_prediction;
        setOptimalTimeSuggestion(`AI Suggests: Around ${String(hour).padStart(2, '0')}:00 for the hour`);
        setAiSuggestedHour(hour);
      } else {
        setOptimalTimeSuggestion("Could not fetch optimal time.");
      }
    } catch (err) {
      console.error("Error fetching optimal time for CreatePostView:", err);
      setOptimalTimeSuggestion("Error fetching optimal time.");
    } finally {
      setIsFetchingOptimalTime(false);
    }
  }, []);

  useEffect(() => {
    if (useOptimalTime) {
      fetchAndSetOptimalTime();
    } else {
      setOptimalTimeSuggestion("Click checkbox to load AI suggested time");
      setAiSuggestedHour(null);
    }
  }, [useOptimalTime, fetchAndSetOptimalTime]);

  const handleMediaChange = (event) => {
    const file = event.target.files[0];
    setFormSuccess(''); setFormError('');
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'unknown');
      const reader = new FileReader();
      reader.onloadend = () => { setMediaPreview(reader.result); };
      reader.readAsDataURL(file);
    } else {
      setMediaFile(null); setMediaPreview(null); setMediaType('');
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!postSubject.trim() && !mediaFile) {
        setFormError("Please provide a post subject or upload media to generate suggestions.");
        return;
      }
      setIsGenerating(true); setFormError(''); setFormSuccess('');
      setCaptionSuggestions([]); setHashtagSuggestions([]);
  
      try {
        const payload = { subject: postSubject.trim(), media_type: mediaType || (postSubject.trim() ? 'text' : 'unknown'), };
        const response = await axios.post(`${API_BASE_URL}/api/generate-post-suggestions`, payload);
        if (response.data && Array.isArray(response.data.captions) && Array.isArray(response.data.hashtags)) {
          setCaptionSuggestions(response.data.captions);
          setHashtagSuggestions(response.data.hashtags);
          if (response.data.captions.length > 0) setSelectedCaption(response.data.captions[0]); else setSelectedCaption('');
          if (response.data.hashtags.length > 0) {
            const initialHashtags = response.data.hashtags.slice(0, Math.min(7, response.data.hashtags.length)).map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
            setSelectedHashtags(initialHashtags);
          } else setSelectedHashtags('');
          setFormSuccess("AI suggestions generated successfully!");
        } else {
          setFormError("Received an unexpected format for suggestions from the server.");
        }
      } catch (err) {
        console.error("[CreatePostView] Suggestion generation error:", err);
        if (err.response && err.response.data && err.response.data.error) {
          let detailedError = `Error: ${err.response.data.error}. ${err.response.data.details || ''}`;
          setFormError(detailedError);
        } else if (err.request) setFormError("No response from server. Check backend.");
        else setFormError(`Error: ${err.message}.`);
      } finally {
        setIsGenerating(false);
      }
  };

  const handleSchedulePost = async () => {
    setFormError(''); setFormSuccess('');
    if (!mediaFile) { setFormError("Please upload an image for the post."); return; }
    if (mediaFile.type && !mediaFile.type.startsWith('image/')) {
        setFormError("Only image files can be scheduled at this time.");
        return;
    }
    if (!selectedCaption.trim()) { setFormError("Caption cannot be empty."); return; }
    if (!scheduleDate.trim()) { setFormError("Please select a date for scheduling."); return; }
    if (!useOptimalTime && !scheduleTimeInput.trim()) {setFormError("Please set a schedule time or use AI optimized time for the hour."); return; }
    if (!IG_ACCOUNT_ID_FROM_ENV) { setFormError("Instagram Account ID is not configured in the frontend environment."); return;}
    
    setIsScheduling(true);
    
    let finalScheduleTimestamp;
    const [year, month, day] = scheduleDate.split('-').map(Number);
    let hour, minute;

    if (useOptimalTime && aiSuggestedHour !== null) {
        hour = aiSuggestedHour;
        minute = 0;
    } else if (!useOptimalTime && scheduleTimeInput) {
        [hour, minute] = scheduleTimeInput.split(':').map(Number);
    } else {
        setFormError("Invalid time selection for scheduling.");
        setIsScheduling(false);
        return;
    }
    
    const scheduleDateTime = new Date(Date.UTC(year, month - 1, day, hour, minute));
    finalScheduleTimestamp = Math.floor(scheduleDateTime.getTime() / 1000);

    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 10 * 60 * 1000); 
    const maxScheduleTime = new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000);

    if (scheduleDateTime < minScheduleTime) {
        setFormError(`Schedule time must be at least 10 minutes from now. Suggested: ${minScheduleTime.toLocaleString()}`);
        setIsScheduling(false);
        return;
    }
    if (scheduleDateTime > maxScheduleTime) {
        setFormError(`Schedule time cannot be more than 75 days from now. Max: ${maxScheduleTime.toLocaleString()}`);
        setIsScheduling(false);
        return;
    }
    
    const formData = new FormData();
    formData.append('media', mediaFile);
    formData.append('caption', selectedCaption.trim()); 
    formData.append('hashtags', selectedHashtags.trim()); 
    formData.append('ig_account_id', IG_ACCOUNT_ID_FROM_ENV);
    formData.append('scheduled_publish_time', finalScheduleTimestamp.toString());
    if (useOptimalTime) {
      formData.append('use_optimal_hour', 'true');
    }

    console.log("[CreatePostView] Sending data to /api/schedule-ig-post:", {
        caption: selectedCaption.trim(),
        hashtags: selectedHashtags.trim(),
        ig_account_id: IG_ACCOUNT_ID_FROM_ENV,
        scheduled_publish_time: finalScheduleTimestamp.toString(),
        use_optimal_hour: useOptimalTime ? 'true' : 'false',
        media_filename: mediaFile.name 
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/schedule-ig-post`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Schedule response from backend:", response.data);
      setFormSuccess(response.data.message || "Post successfully scheduled! Check Instagram Creator Studio.");
      
      setPostSubject(''); setMediaFile(null); setMediaPreview(null); setMediaType('');
      setCaptionSuggestions([]); setHashtagSuggestions([]);
      setSelectedCaption(''); setSelectedHashtags('');
      setScheduleDate(''); setScheduleTimeInput(''); setUseOptimalTime(false);
      setOptimalTimeSuggestion("Click checkbox to load AI suggested time"); setAiSuggestedHour(null);

    } catch (err) {
      console.error("[CreatePostView] Scheduling error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        let detailedError = `Error: ${err.response.data.error}.`;
        if (err.response.data.details) {
            const detailsString = typeof err.response.data.details === 'object' 
                                ? JSON.stringify(err.response.data.details) 
                                : err.response.data.details;
            detailedError += ` Details: ${detailsString}`;
        }
        setFormError(detailedError);
      } else if (err.request) {
        setFormError("No response from server. Please check if the backend is running and accessible.");
      } else {
        setFormError(`Could not schedule post. Error: ${err.message}`);
      }
    } finally {
      setIsScheduling(false);
    }
  };
  
  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-full">
      <div className="flex items-center gap-3 mb-10"> <FaPlusSquare size={36} className="text-indigo-600" /> <h1 className="text-4xl font-bold text-slate-800">Create New Post</h1> </div>
      {formError && <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300 flex items-center gap-2" role="alert"><FaInfoCircle className="inline mr-1.5"/>{formError}</div>}
      {formSuccess && <div className="mb-6 p-4 text-sm text-green-700 bg-green-100 rounded-lg border border-green-300 flex items-center gap-2" role="alert"><FaCheckCircle className="inline mr-1.5"/>{formSuccess}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-slate-700 mb-1">1. Upload Media & Describe Your Post</h2>
            <p className="text-xs text-slate-500 mb-4">Select an image, and provide a subject for AI suggestions.</p>
            <div className="mb-4"> <label htmlFor="mediaFile" className="block text-sm font-medium text-slate-700 mb-1">Upload Image <span className="text-red-500">*</span></label> <input type="file" id="mediaFile" accept="image/*" onChange={handleMediaChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition"/> </div>
            {mediaPreview && mediaType === 'image' && ( <div className="mt-3 mb-4 border rounded-lg overflow-hidden max-w-md mx-auto bg-slate-50 p-2"> <img src={mediaPreview} alt="Preview" className="max-h-72 w-auto mx-auto rounded" /> </div> )}
            <div> <label htmlFor="postSubject" className="block text-sm font-medium text-slate-700 mb-1">Post Subject / Theme <span className="text-red-500">*</span></label> <textarea id="postSubject" rows="3" value={postSubject} onChange={(e) => setPostSubject(e.target.value)} placeholder="e.g., New product launch..." className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"/> </div>
            <button onClick={handleGenerateSuggestions} disabled={isGenerating || (!postSubject.trim() && !mediaFile)} className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"> {isGenerating ? <FaSpinner className="animate-spin" /> : <FaMagic />} Generate AI Suggestions </button>
          </div>
          {(captionSuggestions.length > 0 || hashtagSuggestions.length > 0) && ( <div className="bg-white p-6 rounded-xl shadow-lg"> <h2 className="text-xl font-semibold text-slate-700 mb-4">2. AI Generated Suggestions</h2> {captionSuggestions.length > 0 && ( <div className="mb-5"> <h3 className="text-md font-semibold text-slate-600 mb-2">Caption Ideas (click to select):</h3> <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar-thin p-1 border rounded-md bg-slate-50"> {captionSuggestions.map((cap, index) => ( <button key={`cap-${index}`} onClick={() => setSelectedCaption(cap)} className={`w-full text-left p-2.5 text-sm rounded-md border transition-all ${selectedCaption === cap ? 'bg-indigo-500 text-white border-indigo-500 ring-2 ring-indigo-300' : 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'}`}> {cap} </button> ))} </div> </div> )} {hashtagSuggestions.length > 0 && ( <div> <h3 className="text-md font-semibold text-slate-600 mb-2">Hashtag Ideas (click to add/remove):</h3> <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-slate-50"> {hashtagSuggestions.map((tag, index) => { const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`; const isSelected = selectedHashtags.split(' ').filter(Boolean).includes(normalizedTag); return ( <button key={`tag-${index}`} onClick={() => { const currentTagsArray = selectedHashtags.split(' ').filter(Boolean); if (isSelected) { setSelectedHashtags(currentTagsArray.filter(t => t !== normalizedTag).join(' ')); } else { setSelectedHashtags([...currentTagsArray, normalizedTag].join(' ')); } }} className={`px-3 py-1.5 text-xs rounded-full border-2 transition-colors ${isSelected ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-indigo-600 border-indigo-400 hover:bg-indigo-100'}`}> {normalizedTag} </button> ); })} </div> </div> )} </div> )}
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg sticky top-10">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">3. Finalize & Schedule</h2>
            <div className="mb-4"> <label htmlFor="finalCaption" className="block text-sm font-medium text-slate-700 mb-1">Final Caption <span className="text-red-500">*</span></label> <textarea id="finalCaption" rows="6" value={selectedCaption} onChange={(e) => setSelectedCaption(e.target.value)} placeholder="Your final caption will appear here..." className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"/> </div>
            <div className="mb-5"> <label htmlFor="finalHashtags" className="block text-sm font-medium text-slate-700 mb-1">Final Hashtags</label> <input id="finalHashtags" type="text" value={selectedHashtags} onChange={(e) => setSelectedHashtags(e.target.value)} placeholder="#your #selected #hashtags" className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"/> </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Schedule Date & Time <span className="text-red-500">*</span></label>
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 mb-3" min={new Date(new Date().getTime() + 10 * 60 * 1000).toISOString().split('T')[0]} />
              {!useOptimalTime && ( <input type="time" value={scheduleTimeInput} onChange={(e) => setScheduleTimeInput(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500" /> )}
              <div className="flex items-center mt-3 mb-1"> <input type="checkbox" id="useOptimalTime" checked={useOptimalTime} onChange={(e) => { setUseOptimalTime(e.target.checked); if (!e.target.checked) { setOptimalTimeSuggestion("Click checkbox to load AI suggested time"); setAiSuggestedHour(null); }}} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/> <label htmlFor="useOptimalTime" className="ml-2 text-sm text-slate-600">Use AI Optimized Time (for hour)</label> </div>
              {useOptimalTime && ( <p className={`text-xs italic ${isFetchingOptimalTime ? 'text-slate-500' : 'text-indigo-600'}`}> {isFetchingOptimalTime ? <FaSpinner className="animate-spin inline mr-1" /> : null} {optimalTimeSuggestion} </p> )}
            </div>
            <button onClick={handleSchedulePost} disabled={isScheduling || !mediaFile || !selectedCaption.trim() || !scheduleDate.trim() || (!useOptimalTime && !scheduleTimeInput.trim()) } className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"> {isScheduling ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />} Schedule Post </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- CreatePostView Bileşeni SONU ---

// --- ScheduledPostsView Bileşeni ---
const ScheduledPostsView = () => (
  <div className="p-6 md:p-10">
    <div className="flex items-center gap-3 mb-8">
      <FaClock size={32} className="text-indigo-600" />
      <h1 className="text-3xl font-bold text-slate-800">Scheduled Posts</h1>
    </div>
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <p className="text-slate-700">
        View and manage your scheduled posts (Coming Soon)...
      </p>
    </div>
  </div>
);

// --- Ana ContentCreatorDashboard Bileşeni ---
const ContentCreatorDashboard = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingMainData, setLoadingMainData] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');

  const fetchGraphAPIDataForMainView = useCallback(async () => {
    if (!IG_ACCESS_TOKEN || !IG_ACCOUNT_ID_FROM_ENV) {
      console.error("[CCDB] .env variables missing for Graph API!"); setLoadingMainData(false); setDashboardData(null); return;
    }
    setLoadingMainData(true); setDashboardData(null);
    try {
      const accountInfoUrl = `${GRAPH_URL}/${IG_ACCOUNT_ID_FROM_ENV}?fields=name,username,followers_count,media_count&access_token=${IG_ACCESS_TOKEN}`;
      const postsUrl = `${GRAPH_URL}/${IG_ACCOUNT_ID_FROM_ENV}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,permalink&limit=20&access_token=${IG_ACCESS_TOKEN}`;
      const [accountInfoRes, postsRes] = await Promise.all([axios.get(accountInfoUrl), axios.get(postsUrl)]);
      const accountData = accountInfoRes.data;
      let fetchedPosts = postsRes.data.data || [];
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const postsLast30Days = fetchedPosts.filter(post => new Date(post.timestamp) > thirtyDaysAgo);
      const totalLikesLast30Days = postsLast30Days.reduce((sum, post) => sum + (post.like_count || 0), 0);
      const totalCommentsLast30Days = postsLast30Days.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const overallStats = {
        totalPostsLast30Days: postsLast30Days.length,
        avgLikesPerPost: postsLast30Days.length > 0 ? parseFloat((totalLikesLast30Days / postsLast30Days.length).toFixed(1)) : 0.0,
        avgCommentsPerPost: postsLast30Days.length > 0 ? parseFloat((totalCommentsLast30Days / postsLast30Days.length).toFixed(1)) : 0.0,
      };
      let topPerformingPost = fetchedPosts.length > 0 ? [...fetchedPosts].sort((a, b) => (b.like_count || 0) - (a.like_count || 0))[0] : null;
      setDashboardData({
        accountName: accountData.username || accountData.name,
        totalFollowers: accountData.followers_count,
        allPosts: fetchedPosts.map(post => ({ ...post, caption_cleaned: post.caption || "No caption" })),
        overallStats: overallStats,
        topPerformingPost: topPerformingPost ? { ...topPerformingPost, caption_cleaned: topPerformingPost.caption || "No Caption" } : null,
        demographics: { topCountries: [], genderDistribution: [], ageGroups: [] }, 
      });
    } catch (error) { 
      console.error("[CCDB] Graph API error:", error.response ? error.response.data : error.message); 
      setDashboardData(null); 
    }
    finally { setLoadingMainData(false); }
  }, []);

  useEffect(() => {
    if (activeView === 'dashboard') {
        if (IG_ACCOUNT_ID_FROM_ENV && IG_ACCESS_TOKEN) {
            fetchGraphAPIDataForMainView();
        } else {
            console.warn("[CCDB] Instagram Account ID or Access Token is missing. Dashboard data will not be loaded.");
            setLoadingMainData(false); 
        }
    }
  }, [activeView, fetchGraphAPIDataForMainView]);

  const handleLogoutClick = () => { if (onLogout) onLogout(); else { localStorage.clear(); window.location.href = '/login'; }};
  const menuItems = [
    { id: 'dashboard', label: 'My Dashboard', icon: <FaTachometerAlt size={18} /> },
    { id: 'optimal-insights', label: 'Optimal Insights', icon: <FaMagic size={18} /> },
    { id: 'create-post', label: 'Create New Post', icon: <FaPlusSquare size={18} /> },
    { id: 'scheduled-posts', label: 'Scheduled Posts', icon: <FaClock size={18} /> },
  ];

  const renderPostCard = (post) => (
    <div key={post.id} className="bg-white p-5 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs text-slate-500">{new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{post.media_type?.replace(/_/g, ' ').toUpperCase()}</span>
      </div>
      <p className="text-sm text-slate-700 mb-3 flex-grow min-h-[4.5rem] max-h-20 overflow-y-auto custom-scrollbar-thin leading-snug" title={post.caption_cleaned}>{post.caption_cleaned || "No caption"}</p>
      <div className="mt-auto pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center text-slate-600"><FaThumbsUp className="mr-1.5 text-red-500"/> {post.like_count?.toLocaleString() ?? '0'}</div>
        <div className="flex items-center text-slate-600"><FaComments className="mr-1.5 text-blue-500"/> {post.comments_count?.toLocaleString() ?? '0'}</div>
      </div>
    </div>
  );

  const MainDashboardView = () => {
    if (loadingMainData) return <div className="p-10 flex-1 flex justify-center items-center"><FaSpinner className="animate-spin text-5xl text-indigo-600" /></div>;
    if (!IG_ACCOUNT_ID_FROM_ENV || !IG_ACCESS_TOKEN) {
        return <div className="p-10 text-center"><FaInfoCircle size={40} className="mx-auto mb-3 text-orange-500" /><p className="text-xl">Instagram credentials not configured.</p><p className="text-sm text-slate-600">Please set REACT_APP_IG_ACCESS_TOKEN and REACT_APP_IG_ACCOUNT_ID in your .env file.</p></div>;
    }
    if (!dashboardData) return <div className="p-10 text-center"><FaInfoCircle size={40} className="mx-auto mb-3 text-red-500" /><p className="text-xl">Could not load dashboard data.</p><p className="text-sm text-slate-600">Check console for API errors or if account has posts. Ensure the access token is valid and has necessary permissions.</p></div>;
    
    return ( <div className="p-6 md:p-10"><div className="max-w-full mx-auto space-y-10"><section><h2 className="text-3xl font-bold text-slate-800 mb-2">Overall Performance</h2><p className="text-sm text-slate-500 mb-6">Key metrics for your account.</p><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">{[{ label: 'Total Followers', value: dashboardData.totalFollowers?.toLocaleString(), icon: <FaUsers/> }, { label: 'Posts (Last 30d)', value: dashboardData.overallStats?.totalPostsLast30Days, icon: <FaRegFileAlt/> }, { label: 'Avg. Likes/Post', value: dashboardData.overallStats?.avgLikesPerPost, icon: <FaThumbsUp/> }, { label: 'Avg. Comments/Post', value: dashboardData.overallStats?.avgCommentsPerPost, icon: <FaComments/> }, ].map(metric => ( <div key={metric.label} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"> <div className="flex items-center text-indigo-500 mb-3"> {React.cloneElement(metric.icon, { size: 22, className: "mr-3 opacity-70" })} <h3 className="text-base font-semibold text-slate-600">{metric.label}</h3> </div> <p className="text-4xl font-extrabold text-slate-800">{metric.value ?? 'N/A'}</p> </div> ))}</div></section>{dashboardData.topPerformingPost && (<section><h2 className="text-2xl font-semibold text-slate-700 mb-6 flex items-center gap-2"><FaStar className="text-yellow-400"/> Top Performing Post</h2>{renderPostCard(dashboardData.topPerformingPost)}</section>)}{dashboardData.allPosts && dashboardData.allPosts.length > 0 ? (<section><h2 className="text-2xl font-semibold text-slate-700 mb-6">🚀 All Posts</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{dashboardData.allPosts.map(renderPostCard)}</div></section>) : (!loadingMainData && <div className="text-center py-16 bg-white rounded-xl shadow-lg"><FaInfoCircle className="text-4xl text-slate-400 mx-auto mb-4"/><p className="text-slate-500 text-lg italic">No posts to display.</p></div>)}</div></div> );
  };

  let currentViewContent;
  switch (activeView) {
    case 'optimal-insights': currentViewContent = <OptimalInsightsView />; break;
    case 'create-post':      currentViewContent = <CreatePostView />;      break;
    case 'scheduled-posts':  currentViewContent = <ScheduledPostsView />;  break;
    case 'dashboard': default: currentViewContent = <MainDashboardView />; break;
  }

  const userName = localStorage.getItem('userName') || 'Content Creator';
  const accountIdDisplay = IG_ACCOUNT_ID_FROM_ENV;

  return ( <div className="flex h-screen bg-slate-100 text-slate-800"><aside className="w-72 bg-white shadow-2xl p-6 flex flex-col justify-between"><div><div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-5"><div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">{userName.charAt(0).toUpperCase()}</div><div><h1 className="text-lg font-semibold text-slate-800">{userName}</h1>{accountIdDisplay && <p className="text-xs text-slate-500">Account ID: {accountIdDisplay.length > 7 ? accountIdDisplay.slice(0,3) + '...' + accountIdDisplay.slice(-3) : accountIdDisplay}</p>}</div></div><h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">MENU</h2><nav className="space-y-1">{menuItems.map((item) => ( <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex items-center w-full gap-3.5 px-4 py-2.5 rounded-lg transition-all duration-200 ease-in-out group text-sm ${activeView === item.id ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}><span className="w-5 flex justify-center">{item.icon}</span><span className="flex-1 text-left">{item.label}</span></button> ))} </nav></div><button onClick={handleLogoutClick} className="flex items-center w-full gap-3.5 px-4 py-2.5 mt-8 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 font-medium transition-colors group"><FaSignOutAlt className="text-lg"/><span className="font-medium text-sm">Logout</span></button></aside><main className="flex-1 overflow-y-auto">{currentViewContent}</main></div> );
};

export default ContentCreatorDashboard;