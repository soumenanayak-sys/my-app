"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  ThumbsUp,
  Calendar,
  Link as LinkIcon,
  X,
  CheckCircle,
  Rocket,
  Award,
  Sparkles,
  Tag,
  FileText,
  Globe,
  TrendingUp,
  StickyNote,
  Edit2,
  Trash2,
  Save,
} from "lucide-react";

export default function IdeasPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Sticky Notes State (Frontend only)
  const [notes, setNotes] = useState([]);
  const [showNewNote, setShowNewNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteFormData, setNoteFormData] = useState({
    title: "",
    content: "",
    color: "yellow",
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    reference_link: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    building: 0,
    completed: 0,
    totalVotes: 0,
  });

  const categories = [
    "AI/ML",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Operations",
    "Tech",
    "Other",
  ];

  const noteColors = {
    yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    green: "from-green-500/20 to-green-600/10 border-green-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    pink: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
    orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  };

  const fetchIdeas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/ideas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ideasData = Array.isArray(res.data) ? res.data : [];
      setIdeas(ideasData);
      
      setStats({
        total: ideasData.length,
        approved: ideasData.filter((i) => i.status === "approved").length,
        building: ideasData.filter((i) => i.status === "building").length,
        completed: ideasData.filter((i) => i.status === "completed").length,
        totalVotes: ideasData.reduce((sum, i) => sum + (i.votes || 0), 0),
      });
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch {}
  };

  // Sticky Notes Functions (Frontend only with localStorage)
  const loadNotes = () => {
    const savedNotes = localStorage.getItem("stickyNotes");
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  };

  const saveNotes = (updatedNotes) => {
    localStorage.setItem("stickyNotes", JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const createNote = (e) => {
    e.preventDefault();
    const newNote = {
      id: Date.now().toString(),
      ...noteFormData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setShowNewNote(false);
    setNoteFormData({ title: "", content: "", color: "yellow" });
  };

  const updateNote = (e) => {
    e.preventDefault();
    const updatedNotes = notes.map((note) =>
      note.id === editingNote.id
        ? { ...note, ...noteFormData, updated_at: new Date().toISOString() }
        : note
    );
    saveNotes(updatedNotes);
    setEditingNote(null);
    setNoteFormData({ title: "", content: "", color: "yellow" });
  };

  const deleteNote = (noteId) => {
    if (confirm("Are you sure you want to delete this note?")) {
      const updatedNotes = notes.filter((note) => note.id !== noteId);
      saveNotes(updatedNotes);
    }
  };

  const openEditNote = (note) => {
    setEditingNote(note);
    setNoteFormData({
      title: note.title,
      content: note.content,
      color: note.color,
    });
  };

  const createIdea = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/create-idea",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowNewIdea(false);
      setFormData({ title: "", description: "", category: "", priority: "medium", reference_link: "" });
      fetchIdeas();
    } catch (error) {
      console.error("Create idea error:", error);
      alert("Failed to create idea");
    }
  };

  const voteIdea = async (ideaId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/vote-idea/${ideaId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchIdeas();
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  const updateIdeaStatus = async (ideaId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/update-idea-status/${ideaId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchIdeas();
    } catch (error) {
      console.error("Update status error:", error);
    }
  };

  const deleteIdea = async (ideaId) => {
    if (confirm("Are you sure you want to delete this idea?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:5000/delete-idea/${ideaId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchIdeas();
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchIdeas();
    fetchUser();
    loadNotes(); // Load notes from localStorage
  }, []);

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = idea.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || idea.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedIdeas = [...filteredIdeas].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">Approved</span>;
      case "building":
        return <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">Building</span>;
      case "completed":
        return <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">Completed</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Pending</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">High</span>;
      case "medium":
        return <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Medium</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">Low</span>;
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#050816] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#050816] text-white flex">
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 rounded-xl">
                      <Lightbulb className="text-purple-400" size={28} />
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] bg-clip-text text-transparent">
                      Ideas
                    </h1>
                  </div>
                  <p className="text-[#94A3B8] mt-2 ml-12">Share and explore innovative startup ideas</p>
                </div>
                
                {/* Sticky Notes Button */}
                <button
                  onClick={() => setShowNewNote(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300"
                >
                  <StickyNote size={18} />
                  Add Sticky Note
                </button>
              </div>
            </div>

            {/* STICKY NOTES SECTION */}
            {notes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <StickyNote className="text-yellow-400" />
                  Sticky Notes ({notes.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`relative bg-gradient-to-br ${noteColors[note.color]} backdrop-blur-xl border rounded-[24px] p-5 hover:scale-[1.02] transition-all duration-300 group`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg">{note.title}</h3>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditNote(note)}
                            className="p-1 hover:bg-white/10 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1 hover:bg-white/10 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="mt-3 text-xs text-[#64748B]">
                        {new Date(note.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STATS */}
            <div className="grid lg:grid-cols-5 gap-6 mb-8">
              {[
                { title: "Ideas", value: stats.total, icon: Lightbulb, color: "purple" },
                { title: "Votes", value: stats.totalVotes, icon: ThumbsUp, color: "cyan" },
                { title: "Approved", value: stats.approved, icon: CheckCircle, color: "green" },
                { title: "Building", value: stats.building, icon: Rocket, color: "blue" },
                { title: "Completed", value: stats.completed, icon: Award, color: "pink" }
              ].map((item, index) => {
                const Icon = item.icon;
                const colorClasses = {
                  purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
                  cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
                  green: "from-green-500/20 to-green-600/10 border-green-500/30",
                  blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
                  pink: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
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

            {/* SEARCH & NEW IDEA */}
            <div className="bg-gradient-to-br from-[#111827]/90 to-[#0A0F1A]/90 backdrop-blur-xl border border-[#26324A] rounded-[32px] p-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search ideas by title, description..."
                    className="w-full bg-[#0A1023] border border-[#26324A] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 rounded-2xl border border-[#26324A] bg-[#0A1023] hover:border-purple-500 transition"
                >
                  <Filter size={18} className="text-[#94A3B8]" />
                </button>
                <button
                  onClick={() => setShowNewIdea(true)}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <Plus size={18} />
                  New Idea
                </button>
              </div>

              {/* FILTERS PANEL */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-[#26324A]">
                  <label className="block text-sm text-[#94A3B8] mb-2">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500 transition"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="building">Building</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
            </div>

            {/* IDEA CARDS */}
            <div className="space-y-6 pb-8">
              {sortedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="group bg-gradient-to-br from-[#111827]/80 to-[#0A0F1A]/80 backdrop-blur-xl border border-[#26324A] rounded-[32px] p-7 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex gap-3 mb-4 flex-wrap">
                        {getPriorityBadge(idea.priority)}
                        {getStatusBadge(idea.status)}
                        {idea.category && (
                          <span className="px-3 py-1 rounded-full text-xs bg-[#0A1023] text-[#94A3B8] border border-[#26324A]">
                            {idea.category}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition">
                        {idea.title}
                      </h2>
                      <p className="text-[#94A3B8] leading-relaxed">{idea.description}</p>
                      <div className="flex flex-wrap gap-5 mt-5 text-[#64748B] text-sm">
                        <span className="flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(idea.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                          <Lightbulb size={14} />
                          By {idea.creator_name?.split('@')[0] || "Anonymous"}
                        </span>
                        {idea.reference_link && (
                          <a
                            href={idea.reference_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-purple-400 transition"
                          >
                            <LinkIcon size={14} />
                            Reference
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:ml-6">
                      <button
                        onClick={() => voteIdea(idea.id)}
                        className="px-5 py-3 rounded-2xl border border-[#26324A] bg-[#0A1023] flex gap-2 hover:border-purple-500 hover:bg-purple-500/10 transition-all duration-200"
                      >
                        <ThumbsUp size={16} className="text-[#94A3B8]" />
                        <span className="font-semibold">{idea.votes || 0}</span>
                      </button>
                      
                      {user?.role === "admin" && (
                        <>
                          <select
                            value={idea.status || "pending"}
                            onChange={(e) => updateIdeaStatus(idea.id, e.target.value)}
                            className="px-3 py-3 rounded-2xl bg-[#0A1023] border border-[#26324A] text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve</option>
                            <option value="building">Building</option>
                            <option value="completed">Complete</option>
                          </select>
                          <button
                            onClick={() => deleteIdea(idea.id)}
                            className="px-3 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all duration-200"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* EMPTY STATE */}
            {sortedIdeas.length === 0 && (
              <div className="bg-gradient-to-br from-[#111827]/50 to-[#0A0F1A]/50 backdrop-blur-xl border border-[#26324A] rounded-[32px] p-12 text-center">
                <Lightbulb size={48} className="mx-auto text-[#64748B] mb-4" />
                <p className="text-[#94A3B8] text-lg">No ideas found</p>
                <p className="text-[#64748B] mt-2">Be the first to share an innovative idea!</p>
                <button
                  onClick={() => setShowNewIdea(true)}
                  className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Share Your Idea
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* NEW IDEA MODAL */}
      {showNewIdea && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#0F1119] to-[#0A0D14] border border-[#26324A] rounded-[32px] max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-[#26324A]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] rounded-t-[32px]" />
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 rounded-xl">
                      <Sparkles className="text-purple-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
                        Share Your Idea
                      </h2>
                      <p className="text-[#94A3B8] text-sm mt-1">Bring your innovation to life</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNewIdea(false)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={createIdea}>
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2 flex items-center gap-2">
                    <FileText size={14} />
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                    placeholder="What's your brilliant idea?"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2 flex items-center gap-2">
                    <Lightbulb size={14} />
                    Description
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
                    placeholder="Describe your idea in detail..."
                  />
                </div>

                {/* Category & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2 flex items-center gap-2">
                      <Tag size={14} />
                      Category
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500 transition"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2 flex items-center gap-2">
                      <TrendingUp size={14} />
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500 transition"
                    >
                      <option value="low">🔵 Low Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="high">🔴 High Priority</option>
                    </select>
                  </div>
                </div>

                {/* Reference Link */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2 flex items-center gap-2">
                    <Globe size={14} />
                    Reference Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.reference_link}
                    onChange={(e) => setFormData({ ...formData, reference_link: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#26324A] flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] font-semibold text-white hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  Submit Idea
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewIdea(false)}
                  className="flex-1 py-3 rounded-xl bg-[#0A1023] border border-[#26324A] font-semibold text-gray-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW STICKY NOTE MODAL */}
      {(showNewNote || editingNote) && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#0F1119] to-[#0A0D14] border border-[#26324A] rounded-[32px] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-[#26324A]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-t-[32px]" />
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl">
                      <StickyNote className="text-yellow-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                        {editingNote ? "Edit Note" : "New Sticky Note"}
                      </h2>
                      <p className="text-[#94A3B8] text-sm mt-1">Jot down your thoughts</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowNewNote(false);
                    setEditingNote(null);
                    setNoteFormData({ title: "", content: "", color: "yellow" });
                  }} 
                  className="p-2 hover:bg-white/10 rounded-xl transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={editingNote ? updateNote : createNote}>
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={noteFormData.title}
                    onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                    placeholder="Note title..."
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Content</label>
                  <textarea
                    required
                    rows="4"
                    value={noteFormData.content}
                    onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition resize-none"
                    placeholder="Write your note here..."
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Note Color</label>
                  <div className="flex gap-3">
                    {Object.keys(noteColors).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNoteFormData({ ...noteFormData, color })}
                        className={`w-10 h-10 rounded-full transition-all duration-200 ${
                          noteFormData.color === color ? "ring-2 ring-white scale-110" : ""
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${color === "yellow" ? "#EAB308" : color === "blue" ? "#3B82F6" : color === "green" ? "#22C55E" : color === "purple" ? "#A855F7" : color === "pink" ? "#EC4899" : "#F97316"} 0%, ${color === "yellow" ? "#CA8A04" : color === "blue" ? "#2563EB" : color === "green" ? "#16A34A" : color === "purple" ? "#7E22CE" : color === "pink" ? "#DB2777" : "#EA580C"} 100%)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#26324A] flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 font-semibold text-white hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editingNote ? "Update Note" : "Save Note"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewNote(false);
                    setEditingNote(null);
                    setNoteFormData({ title: "", content: "", color: "yellow" });
                  }}
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