"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import {
  Users,
  Search,
  Mail,
  Shield,
  UserPlus,
  Crown,
  MoreVertical,
  Filter,
  X,
  Star,
  Briefcase,
  Calendar,
  Award,
  Sparkles,
} from "lucide-react";

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    fetchUsers(token);
  }, []);

  const fetchUsers = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/all-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u?.name?.toLowerCase().includes(search.toLowerCase()) ||
      u?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u?.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    members: users.filter(u => u.role !== "admin").length,
  };

  return (
    <div className="h-screen overflow-hidden bg-[#050816] flex">
      {/* Sidebar - Fixed */}
      <div className="h-full sticky top-0 flex-shrink-0 overflow-y-auto border-r border-[#1E293B] bg-[#081020]">
        <Sidebar user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 rounded-xl">
                      <Users className="text-purple-400" size={28} />
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#22C55E] bg-clip-text text-transparent">
                      Team
                    </h1>
                  </div>
                  <p className="text-[#94A3B8] mt-2 ml-12">Connect with your collaborators</p>
                </div>

                <button className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                  <UserPlus size={18} className="group-hover:scale-110 transition" />
                  Invite Member
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="group relative overflow-hidden bg-gradient-to-br from-[#111827]/90 to-[#0A0F1A]/90 backdrop-blur-xl border border-[#26324A] rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition" />
                <div className="relative flex justify-between items-start">
                  <div>
                    <p className="text-[#94A3B8] text-sm">Total Members</p>
                    <h2 className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">{stats.total}</h2>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Users className="text-purple-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-[#111827]/90 to-[#0A0F1A]/90 backdrop-blur-xl border border-[#26324A] rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition" />
                <div className="relative flex justify-between items-start">
                  <div>
                    <p className="text-[#94A3B8] text-sm">Administrators</p>
                    <h2 className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">{stats.admins}</h2>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <Crown className="text-cyan-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-[#111827]/90 to-[#0A0F1A]/90 backdrop-blur-xl border border-[#26324A] rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition" />
                <div className="relative flex justify-between items-start">
                  <div>
                    <p className="text-[#94A3B8] text-sm">Team Members</p>
                    <h2 className="text-4xl font-bold mt-2 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">{stats.members}</h2>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <Briefcase className="text-green-400" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-gradient-to-br from-[#111827]/90 to-[#0A0F1A]/90 backdrop-blur-xl border border-[#26324A] rounded-2xl p-4 mb-8">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#0A1023] border border-[#26324A] rounded-xl py-3 pl-12 pr-4 text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-5 rounded-xl border transition flex items-center gap-2 ${
                    showFilters 
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                      : 'border-[#26324A] bg-[#0A1023] text-[#94A3B8] hover:border-purple-500'
                  }`}
                >
                  <Filter size={16} />
                  <span className="text-sm">Filter</span>
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-[#26324A] flex gap-3">
                  <button
                    onClick={() => setFilterRole("all")}
                    className={`px-4 py-2 rounded-xl text-sm transition ${
                      filterRole === "all"
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-[#0A1023] text-[#94A3B8] border border-[#26324A] hover:border-purple-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterRole("admin")}
                    className={`px-4 py-2 rounded-xl text-sm transition ${
                      filterRole === "admin"
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-[#0A1023] text-[#94A3B8] border border-[#26324A] hover:border-purple-500'
                    }`}
                  >
                    <Crown size={12} className="inline mr-1" />
                    Admins
                  </button>
                  <button
                    onClick={() => setFilterRole("user")}
                    className={`px-4 py-2 rounded-xl text-sm transition ${
                      filterRole === "user"
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-[#0A1023] text-[#94A3B8] border border-[#26324A] hover:border-purple-500'
                    }`}
                  >
                    Members
                  </button>
                </div>
              )}
            </div>

            {/* Team Grid - Fixed key issue */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
              {filteredUsers.map((member) => {
                // Use member.id instead of member._id (fix for React key warning)
                const uniqueKey = member?.id || member?._id || `member-${member?.email}-${Date.now()}`;
                return (
                  <div
                    key={uniqueKey}
                    className="group relative bg-gradient-to-br from-[#111827]/80 to-[#0A0F1A]/80 backdrop-blur-xl border border-[#26324A] rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-500/0 transition-all duration-300" />
                    
                    {/* Top Accent Bar */}
                    <div className={`h-1 w-full ${member.role === "admin" ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-gradient-to-r from-[#7C3AED] to-[#2563EB]'}`} />
                    
                    <div className="p-6">
                      {/* Avatar & Role */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                            {member?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          {member.role === "admin" && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                              <Crown size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.role === "admin" 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {member.role === "admin" ? "Admin" : "Member"}
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-purple-400 transition">
                        {member.name || "Unknown"}
                      </h3>

                      {/* Email */}
                      <div className="flex items-center gap-2 text-[#94A3B8] text-sm mb-3">
                        <Mail size={14} />
                        <span className="truncate">{member.email}</span>
                      </div>

                      {/* Info Chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-[#0A1023] border border-[#26324A] rounded-lg text-xs text-[#94A3B8] flex items-center gap-1">
                          <Calendar size={10} />
                          Joined {new Date(member.created_at || Date.now()).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 bg-[#0A1023] border border-[#26324A] rounded-lg text-xs text-[#94A3B8] flex items-center gap-1">
                          <Shield size={10} />
                          {member.role === "admin" ? "Full Access" : "Standard"}
                        </span>
                      </div>

                      {/* Action Button */}
                      <button className="w-full mt-2 py-2 rounded-xl bg-[#0A1023] border border-[#26324A] text-[#94A3B8] text-sm font-medium hover:border-purple-500 hover:text-purple-400 transition-all duration-200">
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="bg-gradient-to-br from-[#111827]/50 to-[#0A0F1A]/50 backdrop-blur-xl border border-[#26324A] rounded-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl flex items-center justify-center mb-4">
                  <Users size={40} className="text-purple-400" />
                </div>
                <p className="text-[#94A3B8] text-lg">No team members found</p>
                <p className="text-[#64748B] text-sm mt-1">Try adjusting your search or filters</p>
                <button className="mt-6 px-6 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white text-sm font-medium inline-flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition">
                  <UserPlus size={16} />
                  Invite Members
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}