"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Zap,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Brain,
  Target,
  ArrowRight,
  BarChart3,
  Globe,
  Users,
  DollarSign,
  PieChart,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Building,
  Link2,
  CheckCircle,
  XCircle,
  Activity,
  Compass
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

// ✅ FIX: Add API_URL constant for production
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my-app-2lpp.onrender.com";

export default function CompanyMarketAnalysisPage() {
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const analyzeCompany = async () => {
    if (!url.trim()) {
      setError("Please enter a company URL");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const token = localStorage.getItem("token");
      // ✅ FIX: Use API_URL instead of localhost
      const res = await axios.post(
        `${API_URL}/analyze-company-url`,
        { 
          url: url,
          gemini_api_key: geminiKey || null
        },
        { headers: { Authorization: "Bearer " + token } }
      );
      
      if (res.data.success) {
        setAnalysis(res.data);
      } else {
        setError(res.data.error || "Failed to analyze company");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error.response?.data?.error || "Failed to analyze company. Make sure the URL is accessible.");
    }
    setLoading(false);
  };

  // Sample data for charts (will be replaced with real data when available)
  const getTrendData = () => {
    return [
      { month: "Jan", score: 45 },
      { month: "Feb", score: 52 },
      { month: "Mar", score: 48 },
      { month: "Apr", score: 55 },
      { month: "May", score: 62 },
      { month: "Jun", score: analysis?.trend_score || 58 },
    ];
  };

  const getSentimentData = () => {
    return [
      { name: "Positive", value: analysis?.market_analysis?.positive_sentiment || 65, color: "#22C55E" },
      { name: "Neutral", value: analysis?.market_analysis?.neutral_sentiment || 15, color: "#EAB308" },
      { name: "Negative", value: analysis?.market_analysis?.negative_sentiment || 20, color: "#EF4444" },
    ];
  };

  const getCompetitorData = () => {
    return [
      { subject: "Product Quality", value: 85, fullMark: 100 },
      { subject: "Market Share", value: 65, fullMark: 100 },
      { subject: "Brand Recognition", value: 55, fullMark: 100 },
      { subject: "Innovation", value: 80, fullMark: 100 },
      { subject: "Customer Support", value: 70, fullMark: 100 },
      { subject: "Pricing", value: 75, fullMark: 100 },
    ];
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-[#050816] text-white flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-[280px] h-screen overflow-y-auto border-r border-[#1E293B] bg-[#081020] flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#050816] via-[#09111F] to-[#050816]">
        <div className="px-8 py-6 lg:px-10 lg:py-8">
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#94A3B8] mb-4">
                  <Sparkles size={16} />
                  AI-Powered Company Intelligence
                </div>
                <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
                  URL to Market Analysis
                </h1>
                <p className="text-[#94A3B8] text-sm mt-2">
                  Enter any company website to get instant market intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="relative mb-8">
            <div className="relative bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1 relative">
                  <Link2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyPress={(e) => e.key === "Enter" && analyzeCompany()}
                    placeholder="Enter company URL: https://enabot.com, https://living.ai/emo/ ..."
                    className="w-full bg-[#050816] border border-[#1E293B] rounded-xl pl-12 pr-4 py-4 outline-none text-white placeholder-[#94A3B8] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <div className="flex-1 relative">
                  <Brain className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Gemini API Key (optional, for deeper analysis)"
                    className="w-full bg-[#050816] border border-[#1E293B] rounded-xl pl-12 pr-4 py-4 outline-none text-white placeholder-[#94A3B8] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <button
                  onClick={analyzeCompany}
                  disabled={loading}
                  className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 shadow-lg bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#06B6D4]"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Company...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Analyze Company URL
                      </>
                    )}
                  </span>
                </button>
              </div>
              
              {error && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}

              <div className="mt-4 text-xs text-[#94A3B8]/60 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>AI scrapes website, analyzes market position, competitors, trends, and generates insights</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {analysis && !loading && (
            <div className="space-y-6">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-6 h-6 text-blue-400" />
                      <h2 className="text-2xl font-bold text-white">{analysis.company?.name || "Company Analysis"}</h2>
                    </div>
                    <p className="text-[#94A3B8] text-sm max-w-2xl">{analysis.company?.description || "No description available"}</p>
                    {analysis.company?.url && (
                      <a 
                        href={analysis.company?.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        {analysis.company?.url}
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">{analysis.trend_score || 58}%</div>
                    <div className="text-xs text-[#94A3B8]">Market Interest Score</div>
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs uppercase">Market Size</span>
                  </div>
                  <div className="text-lg font-bold text-white">{analysis.market_analysis?.market_size || "Analyzing..."}</div>
                </div>
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs uppercase">Growth Rate</span>
                  </div>
                  <div className="text-lg font-bold text-green-400">{analysis.market_analysis?.market_growth || "10%"}</div>
                </div>
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs uppercase">Target Audience</span>
                  </div>
                  <div className="text-sm text-white">{analysis.market_analysis?.target_audience?.length || 0} segments</div>
                </div>
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs uppercase">USP Score</span>
                  </div>
                  <div className="text-lg font-bold text-cyan-400">85/100</div>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Market Interest Trend (6 Months)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getTrendData()}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0B1220", border: "1px solid #1E293B" }}
                      labelStyle={{ color: "#94A3B8" }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#3B82F6" fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Sentiment & Radar Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-400" />
                    Market Sentiment
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={getSentimentData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {getSentimentData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Competitive Analysis
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getCompetitorData()}>
                      <PolarGrid stroke="#1E293B" />
                      <PolarAngleAxis dataKey="subject" stroke="#94A3B8" />
                      <PolarRadiusAxis stroke="#94A3B8" />
                      <RechartsRadar name="Company" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strengths vs Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#0B1220] border border-green-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsUp className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-green-400">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.market_analysis?.strengths?.length > 0 ? (
                      analysis.market_analysis?.strengths?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[#CBD5E1]">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[#CBD5E1]">No strengths data available</li>
                    )}
                  </ul>
                </div>

                <div className="bg-[#0B1220] border border-red-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsDown className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-red-400">Weaknesses</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.market_analysis?.weaknesses?.length > 0 ? (
                      analysis.market_analysis?.weaknesses?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[#CBD5E1]">
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[#CBD5E1]">No weaknesses data available</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Opportunities & Threats */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#0B1220] border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-blue-400">Opportunities</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.market_analysis?.opportunities?.length > 0 ? (
                      analysis.market_analysis?.opportunities?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[#CBD5E1]">
                          <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[#CBD5E1]">No opportunities data available</li>
                    )}
                  </ul>
                </div>

                <div className="bg-[#0B1220] border border-red-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-red-400">Threats</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.market_analysis?.threats?.length > 0 ? (
                      analysis.market_analysis?.threats?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[#CBD5E1]">
                          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[#CBD5E1]">No threats data available</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Key Features */}
              {analysis.market_analysis?.key_features?.length > 0 && (
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Key Features & Products
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.market_analysis?.key_features?.map((feature, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience */}
              {analysis.market_analysis?.target_audience?.length > 0 && (
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    Target Audience
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.market_analysis?.target_audience?.map((audience, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm border border-green-500/20">
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Strategy Recommendation */}
              <div className="bg-gradient-to-r from-[#7C3AED]/10 to-[#2563EB]/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Compass className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold">AI Strategy Recommendation</h3>
                </div>
                <p className="text-[#CBD5E1] leading-relaxed">
                  {analysis.market_analysis?.recommended_strategy || "Focus on product differentiation and customer acquisition."}
                </p>
                <div className="mt-4 pt-3 border-t border-blue-500/20">
                  <p className="text-sm text-[#94A3B8]">
                    <span className="font-semibold text-blue-400">Unique Selling Point:</span> {analysis.market_analysis?.unique_selling_point || "Innovative product in growing market"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!analysis && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-[#0B1220] border border-[#1E293B] flex items-center justify-center mb-6">
                <Link2 className="w-10 h-10 text-[#94A3B8]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Enter a company URL</h3>
              <p className="text-[#94A3B8] max-w-md">
                Paste any company website URL to get instant market analysis, competitor insights, and AI-powered recommendations.
              </p>
              <div className="flex gap-2 mt-6 flex-wrap justify-center">
                {["https://enabot.com", "https://living.ai/emo/", "https://yonbo.ai/", "https://miko.ai/"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setUrl(suggestion);
                      analyzeCompany();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-blue-500/50 text-sm transition-all text-[#94A3B8] hover:text-white"
                  >
                    Try {suggestion.replace("https://", "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-[#94A3B8]">Scraping website and analyzing market data...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}