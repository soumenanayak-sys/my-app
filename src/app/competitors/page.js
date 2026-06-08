"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import ReactMarkdown from "react-markdown";
import {
  Search,
  Zap,
  Bot,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  Brain,
  Target,
  ArrowRight,
  RefreshCw,
  Heart,
  Cpu,
  Shield
} from "lucide-react";

export default function CompetitorNewsPage() {
  const [user, setUser] = useState(null);
  const [keyword, setKeyword] = useState("AI companion robot desktop pet");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const competitorRobots = [
    { name: "EMO", url: "https://living.ai/emo/" },
    { name: "YONBO", url: "https://yonbo.ai/" },
    { name: "Eilik", url: "https://energizelab.com/consumerview/eilik" },
    { name: "KEYi", url: "https://keyirobot.com/" },
    { name: "Looi", url: "https://looirobot.com/" },
    { name: "Miko", url: "https://miko.ai/" },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/competitor-news?keyword=${encodeURIComponent(keyword)}`,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      setNews(res.data.news);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getRobotCategory = (analysis) => {
    if (analysis.toLowerCase().includes("educational") || analysis.toLowerCase().includes("learning")) return "Educational";
    if (analysis.toLowerCase().includes("companion") || analysis.toLowerCase().includes("pet")) return "Companion";
    return "Desktop Robot";
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case "Educational": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "Companion": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
      default: return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    }
  };

  const filteredNews = selectedFilter === "all" 
    ? news 
    : news.filter(item => getRobotCategory(item.analysis).toLowerCase().includes(selectedFilter));

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
                  AI-Powered Intelligence
                </div>
                <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
                  Competitor Intelligence
                </h1>
                <p className="text-[#94A3B8] text-sm mt-2">
                  AI-powered tracking for desktop companions & educational robots
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-emerald-400">Qwen3 Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Competitor Selector */}
          <div className="mb-6">
            <p className="text-xs text-[#94A3B8] mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Quick competitor tracking:
            </p>
            <div className="flex flex-wrap gap-2">
              {competitorRobots.map((robot) => (
                <button
                  key={robot.name}
                  onClick={() => {
                    setKeyword(robot.name);
                    fetchNews();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-sm flex items-center gap-2"
                >
                  <Bot className="w-3 h-3 text-blue-400" />
                  {robot.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search Section */}
          <div className="relative mb-8">
            <div className="relative bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && fetchNews()}
                    placeholder="Search competitor: EMO, YONBO, Eilik, Miko..."
                    className="w-full bg-[#050816] border border-[#1E293B] rounded-xl pl-12 pr-4 py-4 outline-none text-white placeholder-[#94A3B8] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <button
                  onClick={fetchNews}
                  disabled={loading}
                  className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 shadow-lg bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#06B6D4]"
                >
                  <span className="flex items-center gap-2">
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Analyze Market
                      </>
                    )}
                  </span>
                </button>
              </div>
              
              <div className="mt-3 text-xs text-[#94A3B8]/60 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                <span>AI analyzes: expression engines, sensors, companion features, educational value</span>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          {news.length > 0 && !loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Competitors</span>
                </div>
                <div className="text-2xl font-bold text-white">{news.length}</div>
                <div className="text-xs text-[#94A3B8]">products analyzed</div>
              </div>
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <Brain className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">AI Model</span>
                </div>
                <div className="text-lg font-bold text-white">Qwen3:1.7b</div>
                <div className="text-xs text-[#94A3B8]">companion analysis</div>
              </div>
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Key Features</span>
                </div>
                <div className="text-lg font-bold text-white">Expressions & AI</div>
                <div className="text-xs text-[#94A3B8]">personality + interaction</div>
              </div>
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-4">
                <div className="flex items-center gap-2 text-pink-400 mb-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Audience</span>
                </div>
                <div className="text-lg font-bold text-white">Kids & Adults</div>
                <div className="text-xs text-[#94A3B8]">desktop companions</div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          {news.length > 0 && !loading && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedFilter === "all"
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-lg"
                    : "bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:bg-white/5"
                }`}
              >
                All ({news.length})
              </button>
              <button
                onClick={() => setSelectedFilter("educational")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedFilter === "educational"
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-lg"
                    : "bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:bg-white/5"
                }`}
              >
                Educational
              </button>
              <button
                onClick={() => setSelectedFilter("companion")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedFilter === "companion"
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-lg"
                    : "bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:bg-white/5"
                }`}
              >
                Companion
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-[#94A3B8]">Analyzing competitor market...</p>
            </div>
          )}

          {/* News Grid */}
          {!loading && news.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
              {filteredNews.map((item, index) => {
                const category = getRobotCategory(item.analysis);
                const categoryColor = getCategoryColor(category);
                
                return (
                  <div
                    key={index}
                    className="relative bg-[#0B1220] border border-[#1E293B] rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${categoryColor}`}>
                              {category}
                            </span>
                            <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.published).toLocaleDateString()}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold leading-tight text-white line-clamp-2">
                            {item.title}
                          </h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-blue-400" />
                        </div>
                      </div>

                      {/* Source */}
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <div className="flex items-center gap-1 text-[#94A3B8]">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                          <span>{item.source}</span>
                        </div>
                      </div>

                      {/* Analysis Content */}
                      <div className="mt-4 prose prose-invert max-w-none prose-p:text-[#CBD5E1] prose-p:text-sm prose-headings:text-white prose-strong:text-blue-400">
                        <ReactMarkdown
                          components={{
                            h1: ({...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-blue-400" {...props} />,
                            h2: ({...props}) => <h4 className="text-md font-semibold mt-3 mb-2 text-cyan-400" {...props} />,
                            strong: ({...props}) => <strong className="text-blue-400" {...props} />,
                            hr: ({...props}) => <hr className="my-3 border-[#1E293B]" {...props} />,
                          }}
                        >
                          {item.analysis.length > 800 ? item.analysis.substring(0, 800) + "..." : item.analysis}
                        </ReactMarkdown>
                      </div>

                      {/* Key Features Tags */}
                      <div className="mt-4 pt-3 border-t border-[#1E293B]">
                        <div className="flex flex-wrap gap-2">
                          {item.analysis.toLowerCase().includes("expression") && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Expressions</span>
                          )}
                          {item.analysis.toLowerCase().includes("sensor") && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">Multi-sensor</span>
                          )}
                          {item.analysis.toLowerCase().includes("educational") && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">Educational</span>
                          )}
                          {item.analysis.toLowerCase().includes("voice") && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">Voice AI</span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-sm font-medium text-blue-400"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Read Article
                        </a>
                        <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                          <Brain className="w-3 h-3" />
                          <span>AI Analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && news.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-[#0B1220] border border-[#1E293B] flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-[#94A3B8]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No intelligence yet</h3>
              <p className="text-[#94A3B8] max-w-md">
                Enter a competitor name above to generate AI-powered competitive intelligence.
              </p>
              <div className="flex gap-2 mt-6">
                {["EMO", "YONBO", "Eilik", "Miko"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setKeyword(suggestion);
                      fetchNews();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-blue-500/50 text-sm transition-all text-[#94A3B8] hover:text-white"
                  >
                    Try {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          {news.length > 0 && !loading && (
            <div className="mt-8 text-center text-xs text-[#94A3B8] border-t border-[#1E293B] pt-6">
              <p>Powered by Qwen3:1.7b • Google News RSS • AI Companion Robot Market</p>
              <p className="mt-1">Tracking: EMO | YONBO | Eilik | KEYi | Looi | Miko</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}