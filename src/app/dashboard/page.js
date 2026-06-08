"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import Sidebar from "@/components/Sidebar";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
} from "recharts";

import {
  FolderKanban,
  CheckCircle,
  Clock,
  Target,
  Trophy,
  Users,
  Award,
  Rocket,
  Sparkles,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  TrendingUp as TrendingUpIcon,
  Crown,
  Star,
  Navigation,
  Zap,
  Gauge,
  Orbit,
  Satellite,
  Compass,
  Cpu,
  Code,
  Brain,
  Globe,
  Shield,
  ZapIcon,
  ChevronRight,
  Activity,
  BarChart3,
  Layers,
  MessageSquare,
  Share2,
} from "lucide-react";

let socket;

export default function UserDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myProjects, setMyProjects] = useState([]);
  const [allUsersProgress, setAllUsersProgress] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [avgProgress, setAvgProgress] = useState(0);
  
  const [hoveredShip, setHoveredShip] = useState(null);
  const [hoveredCommander, setHoveredCommander] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [projectsTrend] = useState([2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6]);
  const [completedTrend] = useState([0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4]);
  const [progressTrend] = useState([1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
  const [completionTrend] = useState([15, 18, 22, 28, 32, 38, 42, 48, 52, 58, 62, 68]);
  const [rankTrend] = useState([8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2]);

  const [monthlyData] = useState([
    { month: "JAN", completion: 42, target: 50 },
    { month: "FEB", completion: 48, target: 55 },
    { month: "MAR", completion: 55, target: 60 },
    { month: "APR", completion: 63, target: 65 },
    { month: "MAY", completion: 71, target: 70 },
    { month: "JUN", completion: 78, target: 75 },
    { month: "JUL", completion: 85, target: 80 },
    { month: "AUG", completion: 88, target: 85 },
    { month: "SEP", completion: 92, target: 88 },
    { month: "OCT", completion: 94, target: 90 },
    { month: "NOV", completion: 97, target: 95 },
    { month: "DEC", completion: 100, target: 100 },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchMyProjects(token) {
    try {
      const res = await axios.get("http://localhost:5000/my-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyProjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log("Fetch projects error:", error);
    }
  }

  async function fetchAllUsersProgress(token) {
    try {
      const res = await axios.get("http://localhost:5000/all-users-progress", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersWithProgress = Array.isArray(res.data) ? res.data : [];
      setAllUsersProgress(usersWithProgress);
      setLeaderboard(usersWithProgress);
      
      const currentUserData = usersWithProgress.find((u) => u.id === user?.id);
      if (currentUserData) {
        setAvgProgress(currentUserData.avgProgress);
      }
      return usersWithProgress;
    } catch (error) {
      console.log("Fetch all users progress error:", error);
      return [];
    }
  }

  async function fetchUser(token) {
    try {
      const res = await axios.get("http://localhost:5000/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch (error) {
      console.log(error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }

  async function updateProjectStatus(projectId, newStatus, token) {
    try {
      await axios.put(`http://localhost:5000/update-project/${projectId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchMyProjects(token);
      await fetchAllUsersProgress(token);
    } catch (error) {
      console.log("Update error:", error);
    }
  }

  async function updateProjectProgress(projectId, progress, token) {
    try {
      await axios.put(`http://localhost:5000/update-project-progress/${projectId}`, { progress }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchMyProjects(token);
      await fetchAllUsersProgress(token);
      
      if (socket && user) {
        socket.emit("progressUpdated", {
          userId: user?.id,
          progress: progress,
        });
      }
    } catch (error) {
      console.log("Update progress error:", error);
    }
  }

  const getSpaceshipPosition = (progress, isCurrentUser = false, index = 0) => {
    const duration = "1.5s cubic-bezier(0.2, 0.9, 0.4, 1.1)";
    const startX = -8;
    const endX = 94;
    const currentX = startX + (progress / 100) * (endX - startX);
    const startY = 75;
    const endY = 20;
    const baseY = startY - (progress / 100) * (startY - endY);
    const waveOffset = Math.sin((progress + index * 40) * Math.PI / 25) * 4;
    const floatOffset = Math.sin(Date.now() / 1500 + index) * 2;
    const finalY = baseY + waveOffset + floatOffset;
    const bankAngle = -5 - (progress / 100) * 12;

    return {
      left: `${currentX}%`,
      top: `${finalY}%`,
      transition: `left ${duration}, top ${duration}`,
      transform: `rotate(${bankAngle}deg)`,
      zIndex: isCurrentUser ? 60 : 30 + index,
    };
  };

  const getThrustIntensity = (progress, isCurrentUser) => {
    if (!isCurrentUser) return 0.4;
    if (progress >= 80) return 1.3;
    if (progress >= 50) return 1.0;
    if (progress >= 25) return 0.75;
    return 0.55;
  };

  useEffect(() => {
    socket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
    });

    if (user?.id) {
      socket.emit("registerUser", user.id);
      socket.emit("userActivity", {
        userId: user.id,
        page: "user-dashboard"
      });
    }

    socket.on("userProgressUpdated", () => {
      const token = localStorage.getItem("token");
      fetchAllUsersProgress(token);
    });

    return () => {
      if (socket) {
        socket.off("userProgressUpdated");
        socket.disconnect();
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser) {
        localStorage.clear();
        router.push("/login");
        return;
      }
      if (parsedUser.role === "admin") {
        router.push("/admin");
        return;
      }
      async function loadData() {
        try {
          setLoading(true);
          await fetchUser(token);
          await fetchMyProjects(token);
          await fetchAllUsersProgress(token);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      }
      loadData();
    } catch (err) {
      console.error("User parse error:", err);
      localStorage.clear();
      router.push("/login");
    }
  }, [router]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A]/95 backdrop-blur-xl border border-[#06B6D4]/30 rounded-xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <p className="text-[#64748B] text-xs font-medium tracking-wide">{label}</p>
          <p className="text-[#06B6D4] text-xl font-bold mt-1">{payload[0].value}%</p>
          <p className="text-[#64748B] text-[10px] mt-1">Completion Rate</p>
        </div>
      );
    }
    return null;
  };

  // Get project icon based on title
  const getProjectIcon = (title) => {
    const lowerTitle = title?.toLowerCase() || "";
    if (lowerTitle.includes("robot") || lowerTitle.includes("ai")) return <Brain size={22} />;
    if (lowerTitle.includes("code") || lowerTitle.includes("dev")) return <Code size={22} />;
    if (lowerTitle.includes("web") || lowerTitle.includes("site")) return <Globe size={22} />;
    if (lowerTitle.includes("security")) return <Shield size={22} />;
    return <Cpu size={22} />;
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-5"></div>
          <p className="text-[#64748B] text-sm tracking-wider font-light">INITIALIZING BRIDGE</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalProjects = myProjects.length;
  const completedProjects = myProjects.filter((p) => p.status === "completed").length;
  const inProgressProjects = myProjects.filter((p) => p.status === "in progress").length;
  const completionRate = totalProjects === 0 ? 0 : Math.round((completedProjects / totalProjects) * 100);
  const currentUserRank = leaderboard.findIndex((u) => u.id === user?.id) + 1;
  const topPerformers = leaderboard.slice(0, 3);

  const projectsGrowth = totalProjects > 0 ? `+${Math.round((totalProjects / 6) * 100)}` : "+0";
  const completedGrowth = completedProjects > 0 ? `+${Math.round((completedProjects / 3) * 100)}` : "+0";
  const progressGrowth = inProgressProjects > 0 ? `+${Math.round((inProgressProjects / 3) * 100)}` : "+0";
  const completionGrowth = completionRate > 0 ? `+${Math.round(completionRate / 2)}` : "+0";
  const rankImprovement = currentUserRank > 0 ? `${Math.round((8 - currentUserRank) * 12.5)}` : "0";

  const cards = [
    { 
      title: "PROJECTS", 
      value: totalProjects, 
      icon: FolderKanban, 
      gradient: "from-purple-500 to-blue-500",
      data: projectsTrend,
      trend: `${projectsGrowth}%`,
      trendUp: totalProjects > 0,
      label: "Total Active",
    },
    { 
      title: "COMPLETED", 
      value: completedProjects, 
      icon: CheckCircle, 
      gradient: "from-green-500 to-emerald-500",
      data: completedTrend,
      trend: `${completedGrowth}%`,
      trendUp: completedProjects > 0,
      label: "Successfully Delivered",
    },
    { 
      title: "IN PROGRESS", 
      value: inProgressProjects, 
      icon: Clock, 
      gradient: "from-blue-500 to-cyan-500",
      data: progressTrend,
      trend: `${progressGrowth}%`,
      trendUp: inProgressProjects > 0,
      label: "Currently Working",
    },
    { 
      title: "COMPLETION", 
      value: `${completionRate}%`, 
      icon: Target, 
      gradient: "from-purple-500 to-cyan-500",
      data: completionTrend,
      trend: `${completionGrowth}%`,
      trendUp: completionRate > 0,
      label: "Overall Progress",
    },
    { 
      title: "RANK", 
      value: `#${currentUserRank}`, 
      icon: Trophy, 
      gradient: "from-amber-500 to-orange-500",
      data: rankTrend,
      trend: `${rankImprovement}%`,
      trendUp: currentUserRank < 8,
      label: `Among ${leaderboard.length} Users`,
    },
  ];

  const planets = [
    { name: "Jupiter", size: 95, left: "-40px", bottom: "-30px", color: "from-amber-400/30 to-orange-500/25", glow: "orange", hasRing: false },
    { name: "Saturn", size: 65, right: "2%", top: "5%", color: "from-yellow-300/25 to-amber-500/20", glow: "yellow", hasRing: true },
    { name: "Neptune", size: 38, right: "10%", bottom: "15%", color: "from-cyan-400/25 to-blue-500/20", glow: "cyan", hasRing: false },
    { name: "Mars", size: 28, left: "5%", top: "30%", color: "from-red-400/20 to-rose-500/15", glow: "red", hasRing: false },
    { name: "Earth", size: 22, left: "45%", top: "8%", color: "from-blue-400/25 to-green-500/20", glow: "blue", hasRing: false },
  ];

  const SparklineChart = ({ data, gradient, height = 42, width = 120 }) => {
    const maxValue = Math.max(...data, 1);
    const minValue = Math.min(...data, 0);
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / (maxValue - minValue)) * (height - 6);
      return `${x},${y}`;
    }).join(" ");
    
    const fromColor = gradient.split(" ")[1]?.replace("from-", "") || "#8B5CF6";
    const toColor = gradient.split(" ")[2]?.replace("to-", "") || "#3B82F6";
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`sparkline-${fromColor}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={fromColor} stopOpacity={1} />
            <stop offset="100%" stopColor={toColor} stopOpacity={1} />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={`url(#sparkline-${fromColor})`}
          strokeWidth="2"
          points={points}
          className="animate-draw"
        />
        <polygon
          fill={`url(#sparkline-${fromColor})`}
          fillOpacity="0.15"
          points={`${points} ${width},${height} 0,${height}`}
        />
      </svg>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#050816] via-[#0a0f1f] to-[#030617] text-[#F8FAFC] flex">
      <div className="h-screen sticky top-0 flex-shrink-0 overflow-y-auto border-r border-[#1E293B] bg-[#081020]/80 backdrop-blur-sm">
        <Sidebar user={user} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#8B5CF6]/20 flex items-center justify-center border border-[#06B6D4]/30">
                  <Zap size="20" className="text-[#06B6D4]" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                  Celestial Command
                </h1>
              </div>
              <p className="text-[#64748B] text-sm ml-13 tracking-wide">
                Welcome back, Commander <span className="text-[#06B6D4] font-medium">{user.name || user.email?.split("@")[0]}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="border border-[#06B6D4]/20 px-5 py-2.5 rounded-full flex items-center gap-2 bg-[#06B6D4]/5 backdrop-blur-sm">
                <Trophy size="16" className="text-[#FBBF24]" />
                <span className="text-[#FBBF24] text-sm font-semibold tracking-wide">RANK #{currentUserRank}</span>
              </div>
              <div className="border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-2 bg-white/5">
                <Gauge size="16" className="text-[#64748B]" />
                <span className="text-[#64748B] text-sm">{avgProgress}% Complete</span>
              </div>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
            {cards.map((card, index) => {
              const Icon = card.icon;
              const trendColor = card.trend === "+0%" ? "text-[#475569]" : (card.trendUp ? "text-[#22C55E]" : "text-[#475569]");
              const displayTrend = card.trend === "+0%" ? "0%" : card.trend;
              
              return (
                <div 
                  key={index} 
                  className="group relative overflow-hidden bg-gradient-to-br from-[#0F172A]/90 to-[#0a0f1f]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-[#06B6D4]/30"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-700 rounded-2xl`} />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[#64748B] text-[11px] tracking-wider font-semibold">{card.title}</p>
                        <p className="text-[#475569] text-[8px] mt-0.5 uppercase">{card.label}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <Icon size="16" className="text-[#8B5CF6]" />
                        </div>
                        <div className={`flex items-center gap-0.5 ${trendColor} bg-white/5 px-1.5 py-0.5 rounded-full`}>
                          {card.trend !== "+0%" && (card.trendUp ? <TrendingUpIcon size="10" /> : null)}
                          <span className="text-[9px] font-bold">{displayTrend}</span>
                        </div>
                      </div>
                    </div>

                    <h2 className="text-3xl font-bold mt-2 text-white tracking-tight">{card.value}</h2>

                    <div className="mt-4 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                      <SparklineChart 
                        data={card.data} 
                        gradient={card.gradient}
                        height={40}
                        width={110}
                      />
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[7px] text-[#475569] font-medium">LAST 12 MONTHS</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EXECUTIVE OVERVIEW */}
          <div className="mb-10">
            <div className="bg-gradient-to-br from-[#0F172A]/80 to-[#0a0f1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#06B6D4]/20 to-[#8B5CF6]/20 rounded-xl border border-[#06B6D4]/20">
                    <TrendingUp size="22" className="text-[#06B6D4]" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-bold tracking-wide">Executive Overview</h2>
                    <p className="text-[#64748B] text-sm mt-0.5">Monthly progress analytics & performance tracking</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]"></div>
                    <span className="text-xs text-[#64748B] font-medium">Completion Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#06B6D4]/60 border border-[#06B6D4]/30"></div>
                    <span className="text-xs text-[#64748B] font-medium">Monthly Target</span>
                  </div>
                  <div className="bg-gradient-to-r from-[#22C55E]/20 to-[#22C55E]/5 px-4 py-1.5 rounded-full border border-[#22C55E]/30">
                    <span className="text-[#22C55E] text-xs font-bold">+138% ↑</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorCompletion" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                        <stop offset="35%" stopColor="#3B82F6" stopOpacity={1} />
                        <stop offset="65%" stopColor="#06B6D4" stopOpacity={1} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="fillCompletion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.1} />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 110]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(6,182,212,0.2)', strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="completion"
                      stroke="url(#colorCompletion)"
                      strokeWidth={3.5}
                      fill="url(#fillCompletion)"
                      dot={{ fill: '#06B6D4', stroke: '#06B6D4', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
                      filter="url(#glow)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="url(#colorTarget)"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center flex-wrap gap-3">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size="14" className="text-[#22C55E]" />
                    <span className="text-xs text-[#64748B]">Peak performance: +138% growth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size="14" className="text-[#06B6D4]" />
                    <span className="text-xs text-[#64748B]">Consistent monthly improvement</span>
                  </div>
                </div>
                <div className="text-xs text-[#64748B] bg-white/5 px-3 py-1 rounded-full">
                  Annual Target: <span className="text-[#22C55E] font-bold">100% completion</span>
                </div>
              </div>
            </div>
          </div>

          {/* COMMANDER'S CIRCLE */}
          <div className="mb-10">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A]/80 to-[#0a0f1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#06B6D4]/8 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#06B6D4]/40 rounded-full blur-md animate-pulse"></div>
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#06B6D4]/20 to-[#8B5CF6]/20 flex items-center justify-center border border-[#06B6D4]/30">
                      <Crown size="22" className="text-[#FBBF24]" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] bg-clip-text text-transparent tracking-wide">
                      COMMANDER'S CIRCLE
                    </h2>
                    <p className="text-[#64748B] text-xs mt-0.5">Top fleet commanders leading the galaxy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <Navigation size="12" className="text-[#06B6D4]" />
                  <span className="text-[10px] text-[#64748B] font-medium">Elite Squadron</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                {topPerformers.map((commander, idx) => {
                  const isFirst = idx === 0;
                  const progressValue = commander.avgProgress || 0;
                  const avatarColors = [
                    "from-[#06B6D4] to-[#3B82F6]",
                    "from-[#3B82F6] to-[#8B5CF6]",
                    "from-[#8B5CF6] to-[#A855F7]",
                  ];
                  const rankLabels = ["PRIME COMMANDER", "SENIOR COMMANDER", "FLEET COMMANDER"];
                  const rankMedals = ["🥇", "🥈", "🥉"];
                  const rankColors = ["text-yellow-400", "text-gray-400", "text-amber-600"];
                  
                  const commanderName = commander.name || commander.email?.split("@")[0];
                  const commanderInitial = commanderName?.charAt(0).toUpperCase() || "U";
                  const commanderProjects = commander.totalProjects || 0;
                  const commanderCompleted = commander.completedProjects || 0;
                  const commanderProgress = Math.round(commander.avgProgress || 0);
                  
                  return (
                    <div
                      key={commander.id}
                      className={`relative group overflow-hidden bg-[#0F172A]/60 border border-white/10 rounded-xl p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[#06B6D4]/40 hover:shadow-xl`}
                      onMouseEnter={() => setHoveredCommander(commander.id)}
                      onMouseLeave={() => setHoveredCommander(null)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      
                      {isFirst && (
                        <div className="absolute inset-0 pointer-events-none">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-1 h-1 bg-[#06B6D4]/50 rounded-full"
                              style={{
                                top: `${20 + Math.random() * 60}%`,
                                left: `${10 + Math.random() * 80}%`,
                                animation: `floatParticle ${2 + i}s ease-in-out infinite`,
                                animationDelay: `${i * 0.5}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative">
                            <div className="text-3xl drop-shadow-lg">{rankMedals[idx]}</div>
                            {isFirst && (
                              <div className="absolute -inset-1 bg-[#06B6D4]/30 rounded-full blur-sm animate-ping" style={{ animationDuration: '2s' }} />
                            )}
                          </div>
                          
                          <div className="relative">
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${avatarColors[idx]} rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className={`relative w-14 h-14 rounded-full bg-gradient-to-r ${avatarColors[idx]} flex items-center justify-center text-xl font-bold border border-white/30`}>
                              {commanderInitial}
                            </div>
                            {isFirst && (
                              <div className="absolute -top-1 -right-1 w-5 h-5">
                                <div className="absolute inset-0 bg-[#06B6D4] rounded-full animate-pulse" />
                                <Star size="12" className="absolute text-white" style={{ top: '2.5px', left: '2.5px' }} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <h3 className="text-white font-bold text-lg tracking-wide">
                            {commanderName}
                          </h3>
                          <p className={`text-[10px] font-mono mt-0.5 tracking-wider font-bold ${rankColors[idx]}`}>
                            {rankLabels[idx]}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-[#64748B] text-[9px] tracking-wide font-semibold">MISSIONS</p>
                            <p className="text-white text-base font-bold">
                              {commanderCompleted}/{commanderProjects}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#64748B] text-[9px] tracking-wide font-semibold">SUCCESS RATE</p>
                            <p className="text-base font-bold text-[#06B6D4]">
                              {commanderProgress}%
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-700 relative"
                              style={{ 
                                width: `${commanderProgress}%`,
                                background: `linear-gradient(90deg, #06B6D4, #3B82F6, #8B5CF6)`,
                              }}
                            />
                          </div>
                          <div 
                            className="absolute top-0 h-full w-1 bg-white/50 blur-sm animate-shimmer"
                            style={{ left: `${commanderProgress}%` }}
                          />
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <Award size="10" className="text-[#8B5CF6]" />
                            <span className="text-[8px] text-[#64748B] font-medium">{commanderProgress}% Complete</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Rocket size="10" className="text-[#06B6D4]" />
                            <span className="text-[8px] text-[#64748B] font-medium">{commanderCompleted} Delivered</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]" />
                    <span className="text-[10px] text-[#64748B] font-medium">Elite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]" />
                    <span className="text-[10px] text-[#64748B] font-medium">Veteran</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
                    <span className="text-[10px] text-[#64748B] font-medium">Rising</span>
                  </div>
                </div>
                <div className="text-[10px] text-[#64748B] font-medium bg-white/5 px-3 py-1 rounded-full">
                  Fleet Total: <span className="text-[#06B6D4] font-bold">{leaderboard.length} Active Commanders</span>
                </div>
              </div>
            </div>
          </div>

          {/* GALACTIC TRANSIT SECTION */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
            <div className="xl:col-span-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#050816] to-[#000000]">
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-[80px] animate-pulse-slow delay-2000" />
                  </div>
                  
                  {[...Array(400)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-white"
                      style={{
                        width: `${Math.random() * 2 + 0.5}px`,
                        height: `${Math.random() * 2 + 0.5}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.6 + 0.2,
                        animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                      }}
                    />
                  ))}
                  
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`shooting-${i}`}
                      className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent rounded-full"
                      style={{
                        width: `${80 + Math.random() * 60}px`,
                        top: `${Math.random() * 60}%`,
                        left: `${Math.random() * 80}%`,
                        opacity: 0,
                        animation: `shootingStar ${8 + Math.random() * 7}s linear infinite`,
                        animationDelay: `${Math.random() * 15}s`,
                        transform: `rotate(${-30 + Math.random() * 20}deg)`,
                      }}
                    />
                  ))}
                </div>

                {planets.map((planet, idx) => (
                  <div key={idx} className="absolute z-0" style={{ left: planet.left, right: planet.right, bottom: planet.bottom, top: planet.top }}>
                    <div className="relative">
                      <div className={`absolute rounded-full bg-${planet.glow}-500/30 blur-xl`} style={{ width: `${planet.size + 20}px`, height: `${planet.size + 20}px`, left: '-10px', top: '-10px' }} />
                      <div className={`relative rounded-full bg-gradient-to-br ${planet.color} shadow-2xl`} style={{ width: `${planet.size}px`, height: `${planet.size}px` }}>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/40 to-transparent" />
                        {planet.hasRing && (
                          <div className="absolute rounded-full border-2 border-amber-300/30" style={{ width: `${planet.size + 16}px`, height: `${planet.size + 8}px`, left: '-8px', top: '-4px', transform: 'rotate(-25deg)', borderTopColor: 'transparent', borderBottomColor: 'rgba(245,158,11,0.2)' }} />
                        )}
                        <div className="absolute inset-[-4px] rounded-full border border-white/10" />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="absolute inset-0 pointer-events-none">
                  <svg className="absolute w-full h-full" style={{ opacity: 0.15 }}>
                    <ellipse cx="50%" cy="55%" rx="35%" ry="12%" fill="none" stroke="#06B6D4" strokeWidth="0.5" strokeDasharray="4 8" />
                    <ellipse cx="50%" cy="50%" rx="50%" ry="18%" fill="none" stroke="#8B5CF6" strokeWidth="0.5" strokeDasharray="3 10" />
                    <ellipse cx="50%" cy="60%" rx="25%" ry="8%" fill="none" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2 6" />
                  </svg>
                </div>

                <div className="relative z-10 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#06B6D4]/30 rounded-full blur-md animate-pulse" />
                        <div className="relative p-2 rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#8B5CF6]/20 border border-[#06B6D4]/30">
                          <Orbit size="20" className="text-[#06B6D4]" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] bg-clip-text text-transparent">
                          Galactic Transit
                        </h2>
                        <p className="text-[#64748B] text-xs mt-0.5 flex items-center gap-2">
                          <Compass size="10" className="text-[#06B6D4]" />
                          Real-time fleet progress across the sector
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500/40 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
                        <div className="relative w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]" />
                      </div>
                      <div className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-sm">
                        LIVE TRACKING
                      </div>
                      <div className="px-3 py-1.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-[#64748B]">
                        MISSION TIME: {currentTime.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="relative h-[420px] mt-4">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/30 to-transparent" style={{ top: '45%' }} />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent" style={{ top: '55%' }} />
                    
                    <div className="absolute bottom-8 left-4 right-4 flex justify-between text-[8px] text-[#475569] font-mono">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>

                    {[25, 50, 75].map((waypoint) => (
                      <div
                        key={waypoint}
                        className="absolute bottom-6 w-px h-3 bg-[#06B6D4]/30"
                        style={{ left: `${waypoint}%` }}
                      />
                    ))}

                    {allUsersProgress.map((teamMember, idx) => {
                      const isCurrentUser = teamMember.id === user?.id;
                      const thrustIntensity = getThrustIntensity(teamMember.avgProgress, isCurrentUser);
                      const shipPos = getSpaceshipPosition(teamMember.avgProgress, isCurrentUser, idx);
                      
                      return (
                        <div key={teamMember.id} className="absolute group" style={shipPos}>
                          <div className={`absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300 ${hoveredShip === teamMember.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <div className={`text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md font-bold shadow-lg ${isCurrentUser ? 'bg-[#06B6D4]/30 text-[#06B6D4] border border-[#06B6D4]/40' : 'bg-black/80 text-[#64748B] border border-white/15'}`}>
                              🚀 {teamMember.name || teamMember.email?.split("@")[0]} · {teamMember.avgProgress}% Complete
                            </div>
                          </div>

                          <div className="relative flex items-center">
                            <div className="absolute top-1/2 -translate-y-1/2 -left-12 flex items-center">
                              <div 
                                className="rounded-full bg-gradient-to-r from-orange-500/40 via-red-500/30 to-transparent blur-md"
                                style={{
                                  width: `${45 * thrustIntensity}px`,
                                  height: `${18 * thrustIntensity}px`,
                                  opacity: 0.6 * thrustIntensity,
                                }}
                              />
                              <div 
                                className="rounded-full bg-gradient-to-r from-yellow-400/60 via-orange-400/40 to-transparent blur-sm"
                                style={{
                                  width: `${30 * thrustIntensity}px`,
                                  height: `${12 * thrustIntensity}px`,
                                  opacity: 0.8 * thrustIntensity,
                                  marginLeft: `-${10 * thrustIntensity}px`,
                                  animation: `enginePulse ${0.12}s ease-in-out infinite alternate`,
                                }}
                              />
                              <div 
                                className="rounded-full bg-white/90 blur-[1px]"
                                style={{
                                  width: `${10 * thrustIntensity}px`,
                                  height: `${5 * thrustIntensity}px`,
                                  opacity: 1 * thrustIntensity,
                                  marginLeft: `-${15 * thrustIntensity}px`,
                                  animation: `engineCore ${0.08}s ease-in-out infinite alternate`,
                                }}
                              />
                            </div>

                            <img 
                              src="/space craft 1.png" 
                              alt={teamMember.name} 
                              className={`transition-all duration-300 ${hoveredShip === teamMember.id ? 'scale-110 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]' : ''}`} 
                              style={{
                                width: `${isCurrentUser ? 56 : 48}px`,
                                height: `${isCurrentUser ? 56 : 48}px`,
                                filter: isCurrentUser 
                                  ? 'drop-shadow(0 0 15px rgba(6,182,212,0.6)) brightness(1.1)' 
                                  : 'drop-shadow(0 0 5px rgba(255,255,255,0.2)) brightness(0.95)',
                              }}
                            />
                            
                            {isCurrentUser && (
                              <>
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="absolute rounded-full bg-[#06B6D4]"
                                    style={{
                                      width: `${2 + i}px`,
                                      height: `${2 + i}px`,
                                      left: `${-15 - i * 5}px`,
                                      top: `${50 - i * 2}%`,
                                      opacity: 0.6 - i * 0.1,
                                      animation: `trailParticle ${0.5}s ease-out infinite`,
                                      animationDelay: `${i * 0.1}s`,
                                    }}
                                  />
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="absolute bottom-10 left-4 right-4">
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#06B6D4] rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                          style={{ width: `${avgProgress}%` }}
                        />
                        <div 
                          className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                          style={{ left: `${avgProgress - 10}%` }}
                        />
                      </div>
                    </div>

                    <div className="absolute bottom-8 right-4 flex flex-col items-center">
                      <div className="text-[8px] text-[#06B6D4] font-mono font-bold">DESTINATION</div>
                      <div className="w-px h-6 bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]" />
                      <div className="text-[6px] text-[#64748B]">✓</div>
                    </div>

                    <div className="absolute bottom-8 left-4 flex flex-col items-center">
                      <div className="text-[8px] text-[#64748B] font-mono">ORIGIN</div>
                      <div className="w-px h-6 bg-[#64748B]" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#06B6D4] shadow-[0_0_6px_#06B6D4]" />
                        <span className="text-[9px] text-[#64748B]">Active Vessels: {allUsersProgress.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Satellite size="10" className="text-[#8B5CF6]" />
                        <span className="text-[9px] text-[#64748B]">Fleet Commanders Online</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[9px] text-[#64748B] bg-white/5 px-2 py-1 rounded-full">
                        Lead Ship: <span className="text-[#06B6D4] font-bold">{avgProgress}% to Target</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050816] to-transparent pointer-events-none" />
              </div>
            </div>

            {/* RIGHT PANEL - Without Chat, Only WhatsApp Invite */}
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-[#0F172A]/80 to-[#0a0f1f]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#64748B] text-xs tracking-wider font-bold">FLEET RANKING</h3>
                  <Users size="14" className="text-[#64748B]/40" />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {leaderboard.map((competitor, idx) => {
                    const avatarColors = ["from-cyan-400 to-blue-500", "from-blue-500 to-purple-500", "from-purple-500 to-violet-500"];
                    return (
                      <div key={competitor.id} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${competitor.id === user?.id ? 'bg-[#06B6D4]/15 border border-[#06B6D4]/30' : 'hover:bg-[#0F172A]/50'}`}>
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-r ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-xs font-bold`}>{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">
                            {competitor.name || competitor.email?.split("@")[0]}
                            {competitor.id === user?.id && <span className="ml-1.5 text-[8px] text-[#06B6D4] font-bold">(You)</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div className="h-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]" style={{ width: `${competitor.avgProgress}%` }} />
                            </div>
                            <span className="text-[9px] text-[#64748B] font-mono font-bold">{competitor.avgProgress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp Community Invitation */}
              <div className="bg-gradient-to-br from-[#0F172A]/80 to-[#0a0f1f]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-green-500/20 border border-green-500/30">
                    <MessageSquare size="18" className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-[#F8FAFC] text-sm font-bold">Community Hub</h3>
                    <p className="text-[#64748B] text-[10px]">Join fellow commanders</p>
                  </div>
                </div>
                <a
                  href="https://chat.whatsapp.com/IeD43fBRQEWCkrIFjBDTJY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-600/30 hover:scale-[1.02] transition-all duration-300"
                >
                  <Share2 size={16} />
                  Join WhatsApp Community
                </a>
                <p className="text-[9px] text-[#64748B] text-center mt-3">Connect, collaborate, and conquer together</p>
              </div>

              <div className="bg-gradient-to-br from-[#0F172A]/80 to-[#0a0f1f]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-[#64748B] text-xs tracking-wider font-bold mb-3">COMMANDS</h3>
                <div className="space-y-2">
                  <button onClick={() => { const p = prompt("Progress (0-100):"); if (p && myProjects[0]) updateProjectProgress(myProjects[0].id, parseInt(p), localStorage.getItem("token")); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#06B6D4]/20 to-[#3B82F6]/20 border border-[#06B6D4]/30 text-white text-sm font-medium hover:scale-[1.02] transition-all">Update Progress</button>
                  <button onClick={() => router.push("/user/ideas")} className="w-full py-2.5 rounded-xl bg-[#0F172A]/60 border border-white/10 text-[#64748B] text-sm font-medium hover:bg-[#0F172A]/80 transition-all">New Idea</button>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE MISSIONS SECTION */}
          <div className="mt-8 pb-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/80 to-[#0a0f1f]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#06B6D4]/10 to-[#8B5CF6]/5 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#8B5CF6]/10 to-[#06B6D4]/5 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#06B6D4]/5 rounded-full blur-[80px]" />
              </div>

              <div className="relative z-10 p-6 border-b border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-2xl blur-lg opacity-50 animate-pulse" />
                      <div className="relative p-3 rounded-2xl bg-gradient-to-br from-[#06B6D4]/20 to-[#8B5CF6]/20 border border-white/20 backdrop-blur-sm">
                        <Layers size="24" className="text-[#06B6D4]" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] bg-clip-text text-transparent">
                        Active Missions
                      </h2>
                      <p className="text-[#64748B] text-xs mt-1 flex items-center gap-2">
                        <Activity size="10" className="text-[#06B6D4]" />
                        Track and manage your intergalactic projects
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-white/5 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                    <div className="text-center">
                      <p className="text-[#64748B] text-[9px] font-medium uppercase tracking-wider">Completion</p>
                      <div className="relative w-10 h-10 mx-auto mt-1">
                        <svg className="w-10 h-10 transform -rotate-90">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="url(#completionGradient)"
                            strokeWidth="3"
                            strokeDasharray={`${2 * Math.PI * 16}`}
                            strokeDashoffset={`${2 * Math.PI * 16 * (1 - completionRate / 100)}`}
                            className="transition-all duration-700"
                          />
                          <defs>
                            <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#06B6D4" />
                              <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">{completionRate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center border-l border-white/10 pl-4">
                      <p className="text-[#64748B] text-[9px] font-medium uppercase tracking-wider">Projects</p>
                      <p className="text-2xl font-bold text-white">{totalProjects}</p>
                      <p className="text-[8px] text-[#22C55E]">{completedProjects} completed</p>
                    </div>
                    <div className="text-center border-l border-white/10 pl-4">
                      <p className="text-[#64748B] text-[9px] font-medium uppercase tracking-wider">Active</p>
                      <p className="text-2xl font-bold text-[#06B6D4]">{inProgressProjects}</p>
                      <p className="text-[8px] text-[#64748B]">in progress</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 p-6">
                {myProjects.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-full blur-xl opacity-30 animate-pulse" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center border border-white/10">
                        <FolderKanban size="40" className="text-[#64748B]" />
                      </div>
                    </div>
                    <p className="text-[#64748B] text-base font-medium">No Active Missions</p>
                    <p className="text-[#64748B]/50 text-sm mt-2">Begin your journey by creating a new project</p>
                    <button 
                      onClick={() => router.push("/user/ideas")}
                      className="mt-6 px-6 py-2 bg-gradient-to-r from-[#06B6D4]/20 to-[#8B5CF6]/20 border border-[#06B6D4]/30 rounded-xl text-[#06B6D4] text-sm font-medium hover:scale-105 transition-all"
                    >
                      Create Mission →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {myProjects.map((project, idx) => {
                      const progress = project.progress || 0;
                      const ProjectIcon = getProjectIcon(project.title);
                      const statusColors = {
                        completed: { bg: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-emerald-500/20", icon: "✓" },
                        "in progress": { bg: "from-cyan-500/20 to-blue-500/10", border: "border-cyan-500/30", text: "text-cyan-400", glow: "shadow-cyan-500/20", icon: "⚡" },
                        pending: { bg: "from-purple-500/20 to-pink-500/10", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-purple-500/20", icon: "○" }
                      };
                      const status = project.status || "pending";
                      const statusStyle = statusColors[status];
                      
                      return (
                        <div
                          key={project.id}
                          className={`group relative overflow-hidden bg-gradient-to-br ${statusStyle.bg} backdrop-blur-sm border ${statusStyle.border} rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${statusStyle.glow}`}
                          onMouseEnter={() => setHoveredProject(project.id)}
                          onMouseLeave={() => setHoveredProject(null)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          
                          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold ${statusStyle.text} bg-black/30 backdrop-blur-sm border ${statusStyle.border} z-10`}>
                            {statusStyle.icon} {status.toUpperCase()}
                          </div>

                          <div className="p-5">
                            <div className="flex items-start gap-4 mb-4">
                              <div className={`relative p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg`}>
                                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${status === "in progress" ? "from-cyan-500/30 to-blue-500/30" : status === "completed" ? "from-emerald-500/30 to-green-500/30" : "from-purple-500/30 to-pink-500/30"} blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                {ProjectIcon}
                              </div>
                              <div className="flex-1">
                                <h3 className={`text-white font-bold text-lg tracking-wide group-hover:${statusStyle.text} transition-colors duration-300`}>
                                  {project.title}
                                </h3>
                                {project.description && (
                                  <p className="text-[#64748B] text-xs mt-1 line-clamp-2">{project.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4 text-[10px] bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit border border-white/10">
                              <Users size="12" className="text-[#06B6D4]" />
                              <span className="text-[#64748B]">Assigned to:</span>
                              <span className="text-white/80 font-medium">{project.assigned_to || user?.name || "Unknown"}</span>
                            </div>

                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">Progress</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{progress}%</span>
                                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] rounded-full" style={{ width: `${progress}%` }} />
                                  </div>
                                </div>
                              </div>
                              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="absolute h-full rounded-full transition-all duration-700"
                                  style={{ 
                                    width: `${progress}%`,
                                    background: `linear-gradient(90deg, #06B6D4, #3B82F6, #8B5CF6)`,
                                    boxShadow: `0 0 12px ${progress >= 80 ? '#22C55E' : '#06B6D4'}`
                                  }}
                                />
                                <div 
                                  className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                                  style={{ left: `${progress - 6}%` }}
                                />
                              </div>
                              <div className="flex justify-between mt-1 px-1">
                                {[0, 25, 50, 75, 100].map((marker) => (
                                  <div
                                    key={marker}
                                    className={`h-1.5 w-0.5 rounded-full transition-all duration-300 ${
                                      progress >= marker ? 'bg-[#06B6D4] shadow-[0_0_4px_#06B6D4]' : 'bg-white/20'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                              <select 
                                value={project.status} 
                                onChange={(e) => updateProjectStatus(project.id, e.target.value, localStorage.getItem("token"))} 
                                className="px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg text-white text-[11px] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 cursor-pointer hover:border-[#06B6D4]/30 transition-all"
                              >
                                <option value="pending">📋 Pending</option>
                                <option value="in progress">⚡ In Progress</option>
                                <option value="completed">✅ Completed</option>
                              </select>
                              {status !== "completed" && (
                                <button 
                                  onClick={() => { 
                                    const p = prompt("Enter progress (0-100):", project.progress || 0); 
                                    if (p !== null) {
                                      const newProgress = Math.min(100, Math.max(0, parseInt(p)));
                                      updateProjectProgress(project.id, newProgress, localStorage.getItem("token"));
                                    }
                                  }} 
                                  className="px-4 py-1.5 bg-gradient-to-r from-[#06B6D4]/20 to-[#3B82F6]/20 border border-[#06B6D4]/30 rounded-lg text-[#06B6D4] text-[11px] font-medium hover:from-[#06B6D4]/30 hover:to-[#3B82F6]/30 transition-all flex items-center gap-1.5 group/btn"
                                >
                                  <ZapIcon size="12" className="group-hover/btn:rotate-12 transition-transform" />
                                  Update
                                </button>
                              )}
                            </div>
                          </div>

                          <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${status === "in progress" ? "from-cyan-500 to-blue-500" : status === "completed" ? "from-emerald-500 to-green-500" : "from-purple-500 to-pink-500"} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {myProjects.length > 0 && (
                <div className="relative z-10 p-5 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#06B6D4] shadow-[0_0_6px_#06B6D4]" />
                        <span className="text-[10px] text-[#64748B]">Avg Progress: <span className="text-white font-bold">{Math.round(myProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / myProjects.length)}%</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Rocket size="12" className="text-[#8B5CF6]" />
                        <span className="text-[10px] text-[#64748B]">Active Missions: <span className="text-white font-bold">{inProgressProjects}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size="12" className="text-emerald-500" />
                        <span className="text-[10px] text-[#64748B]">Completed: <span className="text-white font-bold">{completedProjects}</span></span>
                      </div>
                    </div>
                    <button 
                      onClick={() => router.push("/user/ideas")}
                      className="text-[10px] text-[#06B6D4] hover:text-white transition-all flex items-center gap-1.5 bg-white/10 hover:bg-[#06B6D4]/20 px-3 py-1.5 rounded-full border border-white/10 hover:border-[#06B6D4]/30"
                    >
                      <Sparkles size="12" />
                      Launch New Mission
                      <ChevronRight size="10" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes shootingStar {
          0% {
            opacity: 0;
            transform: translateX(0) translateY(0) rotate(-30deg);
          }
          10% {
            opacity: 1;
          }
          20% {
            opacity: 0;
          }
          100% {
            opacity: 0;
            transform: translateX(-200px) translateY(100px) rotate(-30deg);
          }
        }
        @keyframes enginePulse {
          0% { opacity: 0.5; transform: scaleX(0.9); }
          100% { opacity: 1; transform: scaleX(1.2); }
        }
        @keyframes engineCore {
          0% { opacity: 0.7; transform: scaleX(0.85); }
          100% { opacity: 1; transform: scaleX(1.15); }
        }
        @keyframes trailParticle {
          0% {
            opacity: 0.8;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-30px) scale(0.5);
          }
        }
        @keyframes draw {
          0% { stroke-dasharray: 0 1000; }
          100% { stroke-dasharray: 1000 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.05); opacity: 0.35; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          50% { transform: translateY(-15px) translateX(10px); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-draw { animation: draw 1.2s ease-out forwards; }
        .animate-pulse-slow { animation: pulse-slow 12s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}