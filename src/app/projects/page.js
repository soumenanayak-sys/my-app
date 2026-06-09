"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Trash2,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  X,
} from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_user_id: "",
    progress: 0,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my-app-2lpp.onrender.com";

  // ================= AUTH =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) return router.replace("/login");

    const parsed = JSON.parse(savedUser);

    if (parsed.role !== "admin") return router.replace("/dashboard");

    setUser(parsed);
    fetchData(token);
  }, []);

  // ================= FETCH =================
  const fetchData = async (token) => {
    try {
      setLoading(true);

      const headers = { Authorization: `Bearer ${token}` };

      const [pRes, uRes] = await Promise.all([
        axios.get(`${API_URL}/all-projects`, { headers }),
        axios.get(`${API_URL}/all-users`, { headers }),
      ]);

      setProjects(pRes.data || []);
      setUsers(uRes.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ================= CREATE =================
  const createProject = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/create-project`,
        {
          ...formData,
          progress: Number(formData.progress) || 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFormData({
        title: "",
        description: "",
        assigned_user_id: "",
        progress: 0,
      });

      fetchData(token);
      setShowCreateForm(false);
      alert("Project Created 🚀");
    } catch (err) {
      alert(err.response?.data?.message || "Create failed");
    }
  };

  // ================= DELETE =================
  const deleteProject = async (id) => {
    if (!confirm("Delete this project?")) return;

    const token = localStorage.getItem("token");

    await axios.delete(`${API_URL}/delete-project/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchData(token);
  };

  // ================= REMINDER =================
  const sendReminder = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${API_URL}/send-reminder/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Reminder sent successfully! 📧");
    } catch (error) {
      console.error("Failed to send reminder:", error);
      alert(error.response?.data?.message || "Failed to send reminder");
    }
  };

  // ================= FILTERED DATA =================
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) =>
        p.title?.toLowerCase().includes(search.toLowerCase())
      )
      .filter((p) => {
        if (filter === "all") return true;
        if (filter === "low") return p.progress < 40;
        if (filter === "mid") return p.progress >= 40 && p.progress < 80;
        if (filter === "high") return p.progress >= 80;
        return true;
      });
  }, [projects, search, filter]);

  // ================= KPI =================
  const kpi = useMemo(() => {
    return {
      total: projects.length,
      low: projects.filter((p) => p.progress < 40).length,
      mid: projects.filter((p) => p.progress >= 40 && p.progress < 80).length,
      high: projects.filter((p) => p.progress >= 80).length,
    };
  }, [projects]);

  if (!user) return null;

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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 rounded-xl">
                      <FolderKanban className="text-purple-400" size={28} />
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] bg-clip-text text-transparent">
                      Projects
                    </h1>
                  </div>
                  <p className="text-[#94A3B8] mt-2 ml-12">
                    Manage and track your team's projects
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <Plus size={18} />
                  New Project
                </button>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Projects", value: kpi.total, icon: FolderKanban, color: "purple" },
                { label: "Low Progress", value: kpi.low, icon: AlertCircle, color: "red" },
                { label: "Mid Progress", value: kpi.mid, icon: Clock, color: "blue" },
                { label: "High Progress", value: kpi.high, icon: CheckCircle, color: "green" },
              ].map((item, index) => {
                const Icon = item.icon;
                const colorClasses = {
                  purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
                  red: "from-red-500/20 to-red-600/10 border-red-500/30",
                  blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
                  green: "from-green-500/20 to-green-600/10 border-green-500/30",
                };
                return (
                  <div
                    key={index}
                    className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[item.color]} backdrop-blur-xl border rounded-[32px] p-6 hover:scale-[1.02] transition-all duration-300`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[#94A3B8] text-sm">{item.label}</p>
                        <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
                      </div>
                      <Icon className="text-white/40" size={28} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SEARCH + FILTER */}
            <div className="bg-gradient-to-br from-[#111827]/90 to-[#0A0F1A]/90 backdrop-blur-xl border border-[#26324A] rounded-[32px] p-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                  <input
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#0A1023] border border-[#26324A] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-6 rounded-2xl border border-[#26324A] bg-[#0A1023] text-white focus:outline-none focus:border-purple-500 transition cursor-pointer"
                >
                  <option value="all">All Progress</option>
                  <option value="low">Low Progress (&lt;40%)</option>
                  <option value="mid">Mid Progress (40-79%)</option>
                  <option value="high">High Progress (≥80%)</option>
                </select>
              </div>
            </div>

            {/* PROJECT CARDS */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-gradient-to-br from-[#111827]/50 to-[#0A0F1A]/50 backdrop-blur-xl border border-[#26324A] rounded-[32px] p-12 text-center">
                <FolderKanban size={48} className="mx-auto text-[#64748B] mb-4" />
                <p className="text-[#94A3B8] text-lg">No projects found</p>
                <p className="text-[#64748B] mt-2">Create your first project to get started</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    className="group bg-gradient-to-br from-[#111827]/80 to-[#0A0F1A]/80 backdrop-blur-xl border border-[#26324A] rounded-[32px] p-6 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-purple-500/10 rounded-xl">
                        <FolderKanban size={20} className="text-purple-400" />
                      </div>
                      <div className="flex gap-2">
                        {/* ✅ REMINDER BUTTON - PAPER PLANE ICON */}
                        <button
                          onClick={() => sendReminder(p.id)}
                          className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all duration-300 hover:scale-110"
                          title="Send Reminder Email"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all duration-300 hover:scale-110"
                          title="Delete Project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition">
                      {p.title}
                    </h3>
                    
                    <p className="text-[#94A3B8] text-sm mb-4 line-clamp-2">
                      {p.description || "No description provided"}
                    </p>

                    {/* PROGRESS BAR */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-[#94A3B8] mb-1">
                        <span>Progress</span>
                        <span>{p.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#0A1023] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${p.progress || 0}%`,
                            background: "linear-gradient(90deg, #7C3AED, #2563EB, #22C55E)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#26324A]">
                      <span className="text-xs text-[#64748B]">
                        Assigned to: {p.assigned_to || "Unassigned"}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.progress >= 80 ? 'bg-green-500/20 text-green-400' :
                        p.progress >= 40 ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {p.progress >= 80 ? 'On Track' : p.progress >= 40 ? 'In Progress' : 'At Risk'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE PROJECT MODAL */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#0F1119] to-[#0A0D14] border border-[#26324A] rounded-[32px] max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative p-6 border-b border-[#26324A]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] rounded-t-[32px]" />
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 rounded-xl">
                      <FolderKanban className="text-purple-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
                        Create New Project
                      </h2>
                      <p className="text-[#94A3B8] text-sm mt-1">Set up a new project for your team</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={createProject}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Project Title</label>
                  <input
                    placeholder="Enter project title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-2">Description</label>
                  <textarea
                    placeholder="Describe the project..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Assign To</label>
                    <select
                      value={formData.assigned_user_id}
                      onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white focus:outline-none focus:border-purple-500 transition"
                    >
                      <option value="">Select User</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] mb-2">Progress (%)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 bg-[#0A1023] border border-[#26324A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#26324A] flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-semibold text-white hover:scale-[1.02] transition-all duration-300"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
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