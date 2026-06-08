"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // ================= INIT =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) return router.replace("/login");

    const parsed = JSON.parse(savedUser);

    setUser(parsed);
    setForm({
      name: parsed.name || "",
      email: parsed.email || "",
      password: "",
    });

    setAvatarPreview(parsed.avatar || "");
  }, []);

  // ================= PROFILE UPDATE =================
  const updateProfile = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...form,
        avatar: avatarPreview,
      };

      await axios.put(`${API_URL}/update-profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = {
        ...user,
        name: form.name,
        email: form.email,
        avatar: avatarPreview,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert("Profile updated 🚀");
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  // ================= AVATAR HANDLER =================
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatar(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-[#050816] text-white">
      <Sidebar user={user} />

      <main className="flex-1 p-10 max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-[#94A3B8] mt-2">
            Manage your profile and account details
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-[#111827] border border-[#26324A] rounded-3xl p-8">

          {/* AVATAR SECTION */}
          <div className="flex items-center gap-6 mb-8">

            <div className="relative">
              <img
                src={
                  avatarPreview ||
                  "https://ui-avatars.com/api/?name=User"
                }
                className="w-24 h-24 rounded-full object-cover border border-[#26324A]"
              />

              <label className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-xs px-2 py-1 rounded-full cursor-pointer">
                Edit
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                {form.name || "Your Name"}
              </h2>
              <p className="text-[#94A3B8]">{form.email}</p>
              <p className="text-sm text-green-400 mt-1">
                Active Account
              </p>
            </div>
          </div>

          {/* FORM */}
          <form
            onSubmit={updateProfile}
            className="grid md:grid-cols-2 gap-6"
          >

            <div>
              <label className="text-sm text-[#94A3B8]">
                Full Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full mt-2 p-4 rounded-2xl bg-[#0A1023] border border-[#26324A] outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-[#94A3B8]">
                Email Address
              </label>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full mt-2 p-4 rounded-2xl bg-[#0A1023] border border-[#26324A] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-[#94A3B8]">
                New Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Leave blank to keep current password"
                className="w-full mt-2 p-4 rounded-2xl bg-[#0A1023] border border-[#26324A] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full p-4 rounded-2xl font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg,#7C3AED,#2563EB,#22C55E)",
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* ACCOUNT INFO SECTION */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">

          <div className="bg-[#111827] border border-[#26324A] rounded-2xl p-6">
            <h3 className="font-semibold mb-2">Account Role</h3>
            <p className="text-[#94A3B8]">{user.role}</p>
          </div>

          <div className="bg-[#111827] border border-[#26324A] rounded-2xl p-6">
            <h3 className="font-semibold mb-2">Security</h3>
            <p className="text-green-400">Protected</p>
          </div>

          <div className="bg-[#111827] border border-red-500/30 rounded-2xl p-6">
            <h3 className="font-semibold text-red-400 mb-2">
              Danger Zone
            </h3>

            <button className="w-full mt-2 p-2 rounded-xl bg-red-500/20 text-red-300">
              Delete Account
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}