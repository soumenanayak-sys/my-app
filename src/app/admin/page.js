"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import io from "socket.io-client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";

import {
  Users,
  FolderKanban,
  Activity,
  TrendingUp,
  Video,
  Clock,
  History,
  CheckSquare,
  Target,
  BarChart3,
  Timer,
  Zap,
  Award,
  TrendingDown,
  Wifi,
  UserCheck,
} from "lucide-react";

import { FaGithub } from "react-icons/fa";

// Cache for API responses (5 minutes TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  const [meetings, setMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    description: "",
    meeting_date: "",
    start_time: "",
    end_time: "",
    meeting_link: "",
    participants: [],
  });
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [postMeetingAction, setPostMeetingAction] = useState("");
  
  const [userJourneyData, setUserJourneyData] = useState({
    featureUsage: [],
    sessionData: [],
    dropOffPoints: [],
  });
  const [userEngagement, setUserEngagement] = useState({
    avgSessionDuration: "Calculating...",
    totalActiveUsers: 0,
    engagementRate: 0,
    retentionRate: 0,
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  
  const [socket, setSocket] = useState(null);
  const [realTimeActiveUsers, setRealTimeActiveUsers] = useState(0);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [sessionDataMap] = useState(new Map());

  // Function to fetch user journey analytics from backend with DEBUG logs
  const fetchUserJourneyAnalytics = useCallback(async (token) => {
    try {
      console.log("📊 Fetching user engagement metrics...");
      const response = await axios.get(
        "http://localhost:5000/user-engagement-metrics",
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
      
      console.log("📊 Backend Metrics Response:", response.data);
      
      if (response.data.success) {
        const { metrics } = response.data;
        console.log("📊 Metrics Data:", {
          totalActiveUsers: metrics.totalActiveUsers,
          engagementRate: metrics.engagementRate,
          retentionRate: metrics.retentionRate,
          avgSessionDuration: metrics.avgSessionDuration,
          featureUsage: metrics.featureUsage,
          sessionDataPoints: metrics.sessionData?.length,
          dropOffPoints: metrics.dropOffPoints
        });
        
        setUserEngagement({
          avgSessionDuration: metrics.avgSessionDuration || "0m",
          totalActiveUsers: metrics.totalActiveUsers || 0,
          engagementRate: metrics.engagementRate || 0,
          retentionRate: metrics.retentionRate || 0,
        });
        
        setUserJourneyData({
          featureUsage: metrics.featureUsage || [],
          sessionData: metrics.sessionData || [],
          dropOffPoints: metrics.dropOffPoints || [],
        });
      } else {
        console.error("📊 Backend returned success: false", response.data);
      }
    } catch (error) {
      console.error("❌ Failed to fetch user journey analytics:", error);
      
      setUserEngagement({
        avgSessionDuration: "0m",
        totalActiveUsers: 0,
        engagementRate: 0,
        retentionRate: 0,
      });
    }
  }, []);

  // Quick localStorage data loader - runs immediately
  const loadLocalData = useCallback(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
      
      setUserEngagement({
        avgSessionDuration: "Calculating...",
        totalActiveUsers: 0,
        engagementRate: 0,
        retentionRate: 0,
      });
      
      setUserJourneyData({
        featureUsage: [],
        sessionData: [],
        dropOffPoints: [],
      });
      
    } catch (err) {
      console.error("Error loading local data:", err);
    }
  }, []);

  // Load local data immediately on mount
  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  // Socket connection with real-time active users tracking
  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
    });
    setSocket(newSocket);
    
    // Listen for active users updates
    newSocket.on("activeUsersUpdate", (data) => {
      console.log("👥 Active users update:", data);
      setRealTimeActiveUsers(data.count);
      setActiveUsersList(data.users || []);
    });
    
    // Register current user with socket
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    
    if (currentUser.id && token) {
      setTimeout(() => {
        newSocket.emit("registerUser", currentUser.id);
        console.log("📡 Registered user:", currentUser.id);
        
        newSocket.emit("pageChange", {
          userId: currentUser.id,
          page: "admin-dashboard"
        });
      }, 500);
    }
    
    // Track page changes when user navigates
    const handleRouteChange = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id && newSocket) {
        newSocket.emit("pageChange", {
          userId: user.id,
          page: window.location.pathname
        });
      }
    };
    
    // Handle beforeunload to notify server user is leaving
    const handleBeforeUnload = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id && newSocket) {
        newSocket.emit("userLeaving", { userId: user.id });
      }
    };
    
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      newSocket.disconnect();
    };
  }, []);

  // Parallel API fetching
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    
    const fetchAllData = async () => {
      try {
        const cachedStats = getCached('dashboard-stats');
        const cachedMeetings = getCached('meetings');
        
        const promises = [];
        
        if (cachedStats) {
          setStats(cachedStats.stats);
          setWeeklyData(cachedStats.weeklyData);
          setRecentActivity(cachedStats.recentActivity);
        } else {
          promises.push(
            axios.get("http://localhost:5000/dashboard-stats", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }).then(res => {
              setStats(res.data.stats);
              setWeeklyData(res.data.weeklyData);
              setRecentActivity(res.data.recentActivity);
              setCached('dashboard-stats', res.data);
            }).catch(() => {
              const pageViews = JSON.parse(localStorage.getItem("pageViews") || "[]");
              setStats({ totalProjects: 0, totalUsers: 1, marketReports: 0, completionRate: 0 });
              setWeeklyData([
                { day: "Mon", value: 0 }, { day: "Tue", value: 0 }, { day: "Wed", value: 0 },
                { day: "Thu", value: 0 }, { day: "Fri", value: 0 }, { day: "Sat", value: 0 },
                { day: "Sun", value: 0 },
              ]);
              setRecentActivity(pageViews.slice(-5).map(view => ({
                title: "Page View",
                subtitle: `Viewed ${view.page}`,
                time: view.timestamp,
              })));
            })
          );
        }
        
        if (cachedMeetings) {
          setMeetings(cachedMeetings);
          const now = new Date();
          const upcoming = cachedMeetings.filter(m => new Date(m.meeting_date) >= now)
            .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));
          setUpcomingMeetings(upcoming.slice(0, 5));
        } else {
          promises.push(
            axios.get("http://localhost:5000/meetings", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }).then(res => {
              setMeetings(res.data || []);
              const now = new Date();
              const upcoming = (res.data || []).filter(m => new Date(m.meeting_date) >= now)
                .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));
              setUpcomingMeetings(upcoming.slice(0, 5));
              setCached('meetings', res.data);
            }).catch(() => {
              setMeetings([]);
              setUpcomingMeetings([]);
            })
          );
        }
        
        await Promise.allSettled(promises);
        await fetchUserJourneyAnalytics(token);
        
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
    
    const sessionStart = localStorage.getItem("sessionStart");
    if (!sessionStart) {
      localStorage.setItem("sessionStart", new Date().toISOString());
      localStorage.setItem("sessionUserId", parsedUser.id);
    }
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [router, fetchUserJourneyAnalytics]);

  const createMeeting = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      await axios.post("http://localhost:5000/create-meeting", meetingForm, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      
      setShowCreateMeeting(false);
      setMeetingForm({
        title: "",
        description: "",
        meeting_date: "",
        start_time: "",
        end_time: "",
        meeting_link: "",
        participants: [],
      });
      
      const res = await axios.get("http://localhost:5000/meetings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(res.data || []);
      const now = new Date();
      const upcoming = (res.data || []).filter(m => new Date(m.meeting_date) >= now)
        .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));
      setUpcomingMeetings(upcoming.slice(0, 5));
      
      alert("Meeting created successfully!");
    } catch (error) {
      console.error("Failed to create meeting:", error);
      alert("Failed to create meeting");
    }
  };

  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, "_blank");
  };

  const markAttendance = async (meetingId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(`http://localhost:5000/join-meeting/${meetingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      alert("Attendance marked!");
    } catch (error) {
      console.error("Failed to mark attendance:", error);
    }
  };

  const addPostMeetingAction = (meetingId) => {
    if (postMeetingAction.trim()) {
      const actions = JSON.parse(localStorage.getItem(`meeting_actions_${meetingId}`) || "[]");
      actions.push({
        action: postMeetingAction,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(`meeting_actions_${meetingId}`, JSON.stringify(actions));
      setPostMeetingAction("");
      alert("Action item added!");
    }
  };

  // Sparkline Chart Component - memoized
  const SparklineChart = useMemo(() => ({ data, gradient, height = 48, width = 140 }) => {
    const maxValue = Math.max(...data, 1);
    const minValue = Math.min(...data, 0);
    const range = maxValue - minValue || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * (height - 6);
      return `${x},${y}`;
    }).join(" ");
    
    let fromColor = "#8B5CF6", toColor = "#3B82F6";
    if (gradient.includes("purple")) { fromColor = "#8B5CF6"; toColor = "#3B82F6"; }
    else if (gradient.includes("blue")) { fromColor = "#3B82F6"; toColor = "#06B6D4"; }
    else if (gradient.includes("cyan")) { fromColor = "#06B6D4"; toColor = "#22C55E"; }
    else if (gradient.includes("green")) { fromColor = "#22C55E"; toColor = "#10B981"; }
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`sparkline-${gradient.replace(/\s/g, '')}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={fromColor} stopOpacity={1} />
            <stop offset="100%" stopColor={toColor} stopOpacity={1} />
          </linearGradient>
          <linearGradient id={`fill-${gradient.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={toColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={`url(#sparkline-${gradient.replace(/\s/g, '')})`}
          strokeWidth="2"
          points={points}
          className="animate-draw"
        />
        <polygon
          fill={`url(#fill-${gradient.replace(/\s/g, '')})`}
          points={`${points} ${width},${height} 0,${height}`}
        />
      </svg>
    );
  }, []);

  // Show loading spinner only on initial load
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-5"></div>
          <p className="text-[#64748B] text-sm tracking-wider font-light">LOADING DASHBOARD</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const cards = [
    {
      title: "Total Projects",
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      border: "border-purple-500",
      gradient: "from-purple-500 to-blue-500",
      trendData: [12, 14, 16, 18, 21, 24, 26, 28, 32, 35, 38, 42],
      trend: "+28%",
      label: "Active Projects",
    },
    {
      title: "Active Users",
      value: realTimeActiveUsers || userEngagement.totalActiveUsers || stats?.totalUsers || 1,
      icon: Users,
      border: "border-blue-500",
      gradient: "from-blue-500 to-cyan-500",
      trendData: [24, 26, 29, 32, 36, 40, 44, 48, 52, 56, 60, 65],
      trend: "+15%",
      label: "Active This Week",
    },
    {
      title: "Engagement Rate",
      value: `${userEngagement.engagementRate}%`,
      icon: Target,
      border: "border-cyan-500",
      gradient: "from-cyan-500 to-green-500",
      trendData: [45, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, userEngagement.engagementRate || 0],
      trend: userEngagement.engagementRate > 50 ? "+12%" : "+5%",
      label: "User Activity",
    },
    {
      title: "Completion Rate",
      value: `${stats?.completionRate || 0}%`,
      icon: Activity,
      border: "border-green-500",
      gradient: "from-green-500 to-emerald-500",
      trendData: [45, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, stats?.completionRate || 0],
      trend: "+8%",
      label: "Success Rate",
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#050816] text-white flex">
      {/* Sidebar - Fixed independent scrolling */}
      <div className="h-screen sticky top-0 flex-shrink-0 overflow-y-auto border-r border-[#1E293B] bg-[#081020]/80 backdrop-blur-sm">
        <Sidebar user={user} />
      </div>

      {/* Main Content - Independent scrolling */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-full">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Executive Overview
                </h1>
                <p className="text-[#94A3B8] mt-2">
                  Welcome back, {user.name}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateMeeting(true)}
                  className="bg-[#111827] border border-[#26324A] px-6 py-3 rounded-2xl flex items-center gap-2 hover:border-purple-500 transition"
                >
                  <Video size={18} />
                  Schedule Meeting
                </button>
                <div className="bg-[#111827] border border-[#26324A] px-6 py-3 rounded-2xl flex items-center gap-3">
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors"
                  >
                    <FaGithub size={18} />
                    <span className="text-sm">GitHub</span>
                  </a>
                  <div className="w-px h-6 bg-[#26324A]" />
                  <span>Dashboard</span>
                </div>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className={`group relative overflow-hidden bg-[#111827]/70 backdrop-blur-xl border rounded-[30px] p-5 ${card.border} shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-1`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-700`} />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[#94A3B8] text-xs tracking-wide">{card.title}</p>
                          <p className="text-[#64748B]/40 text-[9px] mt-0.5">{card.label}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Icon size="18" className="text-white/70" />
                          <div className="flex items-center gap-0.5 text-[#22C55E]">
                            <TrendingUp size="10" />
                            <span className="text-[9px] font-medium">{card.trend}</span>
                          </div>
                        </div>
                      </div>

                      <h2 className="text-4xl font-bold mt-2 text-white tracking-tight">
                        {card.value}
                      </h2>

                      <div className="mt-4 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                        <SparklineChart 
                          data={card.trendData} 
                          gradient={card.gradient}
                        />
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] text-[#64748B]/50">Last 12 months</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                {/* Weekly Progress Chart */}
                <div className="bg-[#111827]/70 backdrop-blur-xl border border-[#26324A] rounded-[35px] p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                        Weekly Progress
                      </h2>
                      <p className="text-[#94A3B8] text-sm mt-1">Project activity tracking</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-[#64748B]">LIVE</span>
                    </div>
                  </div>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData}>
                        <defs>
                          <linearGradient id="premium" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#9333EA" />
                            <stop offset="40%" stopColor="#3B82F6" />
                            <stop offset="70%" stopColor="#06B6D4" />
                            <stop offset="100%" stopColor="#22C55E" />
                          </linearGradient>
                          <linearGradient id="premiumFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" stroke="#64748B" axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748B" axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #06B6D4/30', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="value" stroke="url(#premium)" fill="url(#premiumFill)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Feature Usage */}
                <div className="bg-[#111827]/70 backdrop-blur-xl border border-[#26324A] rounded-[35px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                      <BarChart3 size={18} />
                      Feature Usage
                    </h3>
                  </div>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userJourneyData.featureUsage}>
                        <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px' }} />
                        <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]}>
                          {userJourneyData.featureUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Session Tracking */}
                <div className="bg-[#111827]/70 backdrop-blur-xl border border-[#26324A] rounded-[35px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-green-500 bg-clip-text text-transparent flex items-center gap-2">
                      <Timer size={18} />
                      Session Activity
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#64748B]">Avg: </span>
                      <span className="text-green-400 font-bold">{userEngagement.avgSessionDuration}</span>
                    </div>
                  </div>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userJourneyData.sessionData}>
                        <defs>
                          <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                        <XAxis dataKey="hour" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="users" stroke="#06B6D4" fill="url(#sessionGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                
                {/* Upcoming Meetings */}
                <div className="bg-[#111827]/70 backdrop-blur-xl border border-[#26324A] rounded-[35px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                      <Video size={18} />
                      Upcoming Meetings
                    </h3>
                    <button 
                      onClick={() => setShowCreateMeeting(true)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                    >
                      + Schedule
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {upcomingMeetings.length > 0 ? (
                      upcomingMeetings.map((meeting) => (
                        <div key={meeting.id} className="p-4 rounded-xl bg-[#0A1023] border border-[#26324A] hover:border-cyan-500/50 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{meeting.title}</h4>
                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                              {new Date(meeting.meeting_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-[#94A3B8] mb-3 line-clamp-2">{meeting.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-[#64748B]">
                              <Clock size={12} />
                              {meeting.start_time} - {meeting.end_time}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => joinMeeting(meeting.meeting_link)}
                                className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-xs"
                              >
                                Join
                              </button>
                              <button 
                                onClick={() => markAttendance(meeting.id)}
                                className="px-3 py-1 rounded-lg bg-[#1A1A24] border border-[#26324A] text-xs hover:border-cyan-500 transition"
                              >
                                Mark
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[#64748B]">
                        No upcoming meetings
                        <button 
                          onClick={() => setShowCreateMeeting(true)}
                          className="block mx-auto mt-3 text-cyan-400 text-sm"
                        >
                          Schedule one →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Engagement Metrics - Enhanced with Live Active Users */}
                <div className="bg-[#111827]/70 backdrop-blur-xl border border-[#26324A] rounded-[35px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-green-500 bg-clip-text text-transparent flex items-center gap-2">
                      <Wifi size={18} />
                      Live Engagement Metrics
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-[#64748B]">REAL-TIME</span>
                    </div>
                  </div>
                  
                  {/* Active Users Count - Large Display */}
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-green-400 mb-2">
                      {realTimeActiveUsers || userEngagement.totalActiveUsers || 0}
                    </div>
                    <p className="text-[#64748B] text-sm">Users Currently Online</p>
                  </div>
                  
                  {/* Active Users List */}
                  {activeUsersList.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto mb-6">
                      <p className="text-[#64748B] text-xs mb-2">Currently Active:</p>
                      {activeUsersList.map((activeUser) => (
                        <div key={activeUser.userId} className="flex items-center gap-3 p-2 rounded-xl bg-[#0A1023] border border-[#26324A]">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{activeUser.name || `User ${activeUser.userId}`}</p>
                            <p className="text-[10px] text-[#64748B]">Viewing: {activeUser.currentPage || "dashboard"}</p>
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            {activeUser.lastActive ? new Date(activeUser.lastActive).toLocaleTimeString() : "Just now"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#26324A]">
                    <div className="text-center p-3 rounded-xl bg-[#0A1023] border border-[#26324A] hover:border-cyan-500 transition">
                      <Target size={18} className="mx-auto text-cyan-400 mb-1" />
                      <p className="text-lg font-bold">{userEngagement.engagementRate}%</p>
                      <p className="text-[9px] text-[#64748B]">Engagement</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[#0A1023] border border-[#26324A] hover:border-green-500 transition">
                      <Award size={18} className="mx-auto text-green-400 mb-1" />
                      <p className="text-lg font-bold">{userEngagement.retentionRate}%</p>
                      <p className="text-[9px] text-[#64748B]">Retention</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[#0A1023] border border-[#26324A] hover:border-yellow-500 transition">
                      <Clock size={18} className="mx-auto text-yellow-400 mb-1" />
                      <p className="text-lg font-bold">{userEngagement.avgSessionDuration}</p>
                      <p className="text-[9px] text-[#64748B]">Avg Session</p>
                    </div>
                  </div>
                </div>

                {/* Drop-off Analysis */}
                <div className="bg-[#111827]/70 backdrop-blur-xl border border-[#26324A] rounded-[35px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                      <TrendingDown size={18} />
                      User Journey
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {userJourneyData.dropOffPoints.length > 0 ? (
                      userJourneyData.dropOffPoints.map((point, idx) => (
                        <div key={idx} className="relative group">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="group-hover:text-white transition">{point.stage}</span>
                            <span className="text-[#64748B]">{point.retention}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#0A1023] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all"
                              style={{ width: `${point.retention}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[#64748B]">
                        No data available yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#111827]/70 backdrop-blur-xl border border-[#26324A] rounded-[35px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                      <History size={18} />
                      Recent Activity
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {recentActivity.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-[#0A1023] border border-[#26324A] hover:border-cyan-500/50 transition">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Activity size={14} className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-[#64748B]">{item.subtitle}</p>
                        </div>
                        {item.time && (
                          <span className="text-xs text-[#64748B]">
                            {new Date(item.time).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <div className="text-center py-8 text-[#64748B]">
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Meeting Modal */}
      {showCreateMeeting && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0F1119] to-[#0A0D14] border border-[#26324A] rounded-[32px] max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="relative p-6 border-b border-[#26324A]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] rounded-t-[32px]" />
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
                    Schedule Meeting
                  </h2>
                  <p className="text-[#94A3B8] text-sm mt-1">Set up a new team meeting</p>
                </div>
                <button onClick={() => setShowCreateMeeting(false)} className="p-2 hover:bg-white/10 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={createMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  placeholder="Weekly Team Sync"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Description</label>
                <textarea
                  rows="3"
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  placeholder="Meeting agenda..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={meetingForm.meeting_date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-2">Start Time</label>
                  <input
                    type="time"
                    required
                    value={meetingForm.start_time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, start_time: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">End Time</label>
                <input
                  type="time"
                  required
                  value={meetingForm.end_time}
                  onChange={(e) => setMeetingForm({ ...meetingForm, end_time: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Meeting Link</label>
                <input
                  type="url"
                  required
                  value={meetingForm.meeting_link}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500"
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-semibold hover:scale-[1.02] transition"
                >
                  Create Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateMeeting(false)}
                  className="flex-1 py-3 rounded-xl bg-[#0A1023] border border-[#26324A] font-semibold hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes draw {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
        
        .animate-draw {
          animation: draw 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}