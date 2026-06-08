"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Search,
  Folder,
  ExternalLink,
  Sparkles,
  Tag,
  Globe,
  X,
  Calendar,
  Download,
  BookOpen,
  Microscope,
  TrendingUp,
  Database,
  ChevronRight,
} from "lucide-react";

export default function ResearchHubPage() {
  const [user, setUser] = useState(null);
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploadType, setUploadType] = useState("file"); // 'file' or 'link'

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    research_link: "",
  });

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const categories = [
    "AI & Machine Learning",
    "Market Research",
    "Competitor Analysis",
    "Financial Analysis",
    "Marketing Strategy",
    "Product Research",
    "User Behavior",
    "Industry Trends",
    "Other",
  ];

  // ==========================
  // AUTH CHECK
  // ==========================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchResearch(token);
  }, []);

  // ==========================
  // FETCH RESEARCH
  // ==========================
  const fetchResearch = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/research`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResearch(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // UPLOAD RESEARCH
  // ==========================
  const uploadResearch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("category", formData.category);
      
      if (uploadType === "link") {
        form.append("research_link", formData.research_link);
      } else if (uploadType === "file" && file) {
        form.append("file", file);
      }

      await axios.post(`${API_URL}/upload-research`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Research Uploaded Successfully! 🚀");
      setFormData({
        title: "",
        description: "",
        category: "",
        research_link: "",
      });
      setFile(null);
      setFileName("");
      setShowUpload(false);
      fetchResearch(token);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Upload failed");
    }
  };

  // ==========================
  // DRAG & DROP HANDLERS
  // ==========================
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  // ==========================
  // FILTERED DATA
  // ==========================
  const filteredResearch = research.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const stats = {
    total: research.length,
    categories: new Set(research.map(r => r.category)).size,
    files: research.filter(r => r.file_url).length,
    links: research.filter(r => r.research_link).length,
  };

  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#050816] via-[#0A0F1A] to-[#050816] text-white flex">
      {/* Sidebar - Fixed, doesn't scroll */}
      <div className="h-screen sticky top-0 flex-shrink-0 overflow-y-auto border-r border-[#1E293B] bg-[#081020]">
        <Sidebar user={user} />
      </div>

      {/* Main Content - Scrolls independently */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 rounded-xl">
                  <Microscope className="text-purple-400" size={28} />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] bg-clip-text text-transparent">
                  Research Library
                </h1>
              </div>
              <p className="text-[#94A3B8] mt-2 ml-12">
                Curated insights, market data, and competitive intelligence
              </p>
            </div>

            {/* STATS CARDS */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Research Assets", value: stats.total, icon: Database, color: "purple" },
                { title: "Categories", value: stats.categories, icon: Tag, color: "blue" },
                { title: "Documents", value: stats.files, icon: FileText, color: "green" },
                { title: "External Sources", value: stats.links, icon: Globe, color: "cyan" },
              ].map((item, index) => {
                const Icon = item.icon;
                const colorClasses = {
                  purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
                  blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
                  green: "from-green-500/20 to-green-600/10 border-green-500/30",
                  cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
                };
                return (
                  <div
                    key={index}
                    className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[item.color]} backdrop-blur-xl border rounded-[32px] p-6 hover:scale-[1.02] transition-all duration-300`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[#94A3B8] text-sm">{item.title}</p>
                        <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
                      </div>
                      <Icon className="text-white/40" size={28} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SEARCH & UPLOAD SECTION */}
            <div className="bg-gradient-to-br from-[#111827]/90 to-[#0A0F1A]/90 backdrop-blur-xl border border-[#26324A] rounded-[32px] p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                  <input
                    type="text"
                    placeholder="Search research papers, reports, articles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#0A1023] border border-[#26324A] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <button
                  onClick={() => setShowUpload(true)}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <Upload size={18} />
                  Contribute Research
                </button>
              </div>

              {/* Category Pills */}
              <div className="mt-6 pt-6 border-t border-[#26324A]">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={14} className="text-[#64748B]" />
                  <span className="text-sm text-[#64748B]">Filter by category:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedCategory === "all"
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-lg shadow-purple-500/25"
                        : "bg-[#0A1023] border border-[#26324A] text-[#94A3B8] hover:border-purple-500 hover:text-purple-400"
                    }`}
                  >
                    All Resources
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedCategory === cat
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-lg shadow-purple-500/25"
                          : "bg-[#0A1023] border border-[#26324A] text-[#94A3B8] hover:border-purple-500 hover:text-purple-400"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RESEARCH GRID */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredResearch.length === 0 ? (
              <div className="bg-gradient-to-br from-[#111827]/50 to-[#0A0F1A]/50 backdrop-blur-xl border border-[#26324A] rounded-[32px] p-12 text-center">
                <Database size={48} className="mx-auto text-[#64748B] mb-4" />
                <p className="text-[#94A3B8] text-lg">No research found</p>
                <p className="text-[#64748B] mt-2">Be the first to contribute to the research library!</p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 inline-flex items-center gap-2"
                >
                  <Upload size={16} />
                  Contribute Research
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                {filteredResearch.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-gradient-to-br from-[#111827]/80 to-[#0A0F1A]/80 backdrop-blur-xl border border-[#26324A] rounded-[24px] p-6 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                  >
                    {/* Category Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {item.category}
                      </span>
                      <span className="text-xs text-[#64748B] flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-purple-400 transition">
                      {item.title}
                    </h2>

                    {/* Description */}
                    <p className="text-[#94A3B8] text-sm mb-4 line-clamp-3">
                      {item.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-[#26324A]">
                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#0A1023] border border-[#26324A] text-cyan-300 px-3 py-2 rounded-xl flex items-center justify-center gap-2 hover:border-cyan-500 hover:bg-cyan-500/5 transition text-sm"
                        >
                          <FileText size={14} />
                          Read
                        </a>
                      )}
                      {item.research_link && (
                        <a
                          href={item.research_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#0A1023] border border-[#26324A] text-purple-400 px-3 py-2 rounded-xl flex items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-500/5 transition text-sm"
                        >
                          <ExternalLink size={14} />
                          Visit
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* UPLOAD MODAL - REDESIGNED */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#0F1119] to-[#0A0D14] border border-[#26324A] rounded-[32px] max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-[#26324A]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] rounded-t-[32px]" />
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 rounded-xl">
                      <BookOpen className="text-purple-400" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
                      Add to Research Library
                    </h2>
                  </div>
                  <p className="text-[#94A3B8] text-sm ml-12">
                    Share valuable insights with your team
                  </p>
                </div>
                <button 
                  onClick={() => setShowUpload(false)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={uploadResearch}>
              <div className="p-6 space-y-5">
                {/* Upload Type Toggle */}
                <div className="flex gap-3 p-1 bg-[#0A1023] rounded-xl border border-[#26324A]">
                  <button
                    type="button"
                    onClick={() => setUploadType("file")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      uploadType === "file"
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    📄 Upload Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType("link")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      uploadType === "link"
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    🔗 External Link
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Research Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Q4 2024 AI Market Analysis Report"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Abstract / Summary</label>
                  <textarea
                    placeholder="Brief overview of this research resource..."
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Research Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500 transition"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Fields based on uploadType */}
                {uploadType === "link" ? (
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Source URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.research_link}
                      onChange={(e) => setFormData({ ...formData, research_link: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                      required={uploadType === "link"}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Upload Document</label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                        dragActive
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-[#26324A] hover:border-purple-500"
                      }`}
                    >
                      <input
                        type="file"
                        onChange={(e) => {
                          setFile(e.target.files[0]);
                          setFileName(e.target.files[0]?.name);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={32} className="text-[#64748B]" />
                        <p className="text-sm text-[#94A3B8]">
                          {fileName ? fileName : "Drag & drop or click to upload"}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          Supports PDF, DOC, DOCX, TXT, PPT (Max 20MB)
                        </p>
                        {fileName && (
                          <span className="text-xs text-green-400 mt-2">✓ File selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#26324A] flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  Add to Library
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 py-3 rounded-xl bg-[#0A1023] border border-[#26324A] font-semibold text-gray-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}