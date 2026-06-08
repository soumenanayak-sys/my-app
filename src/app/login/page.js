"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import io from "socket.io-client";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  LogIn,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isPushing, setIsPushing] = useState(false);

  // ✅ FIX 1: Remove fallback to localhost
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
      } catch {
        localStorage.clear();
      }
    }

    const timer = setTimeout(() => {
      setIsPushing(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  if (!mounted) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // ✅ FIX 2: Change from /login to /api/login (or adjust based on your backend)
      // If your backend uses /api/login, use this:
      const res = await axios.post(`${API_URL}/api/login`, { email, password });
      
      // If your backend uses just /login, use this instead:
      // const res = await axios.post(`${API_URL}/login`, { email, password });
      
      // If your backend uses /auth/login, use this:
      // const res = await axios.post(`${API_URL}/auth/login`, { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Register session with Socket.io AFTER login
      const socket = io(API_URL);
      socket.emit("registerUser", res.data.user.id);
      socket.emit("userActivity", {
        userId: res.data.user.id,
        page: "login-success",
        action: "login"
      });

      // Give socket time to register before redirect
      setTimeout(() => {
        socket.disconnect();
        if (res.data.user.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
      }, 500);

    } catch (error) {
      console.error("Login error:", error);
      alert(error.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  const quickLogin = (type) => {
    if (type === "admin") {
      setEmail("admin@example.com");
      setPassword("admin123");
    } else {
      setEmail("user@example.com");
      setPassword("user123");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0A0F1A] to-[#050816] flex items-center justify-center p-4 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-center gap-0 max-w-5xl w-full">
        
        {/* Robot */}
        <div
          className="md:w-auto flex flex-col items-center justify-center transition-all duration-1000 ease-out"
          style={{
            transform: isPushing ? "translateX(0)" : "translateX(-100px)",
            opacity: isPushing ? 1 : 0.5,
          }}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute w-[340px] h-[340px] rounded-full border-2 border-purple-500/40 animate-orbit-ring" />
            <div className="rotate-12">
              <Image
                src="/logo 5.png"
                alt="Robot Assistant"
                width={280}
                height={280}
                priority
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {!isPushing && (
            <div className="w-32 mt-4 -translate-x-4">
              <div className="h-0.5 bg-gradient-to-r from-purple-500 to-transparent rounded-full animate-pulse" />
              <p className="text-xs text-purple-400 mt-2 text-center animate-pulse">
                ⟹ pushing...
              </p>
            </div>
          )}
        </div>

        {/* Login Card */}
        <div
          className="w-full md:w-[440px] transition-all duration-1000 ease-out"
          style={{
            transform: isPushing ? "translateX(0)" : "translateX(80px)",
            opacity: isPushing ? 1 : 0.5,
          }}
        >
          <div className="bg-[#0F1119] border border-[#1A1F2E] rounded-2xl shadow-2xl overflow-hidden">
            
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#2563EB]/20 flex items-center justify-center">
                  <LogIn className="text-purple-400" size={24} />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back
              </h1>
              <p className="text-gray-400 text-sm">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>

                <div
                  className={`relative transition-all duration-200 ${
                    focusedField === "email"
                      ? "ring-2 ring-purple-500/50 rounded-xl"
                      : ""
                  }`}
                >
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="email"
                    value={email}
                    required
                    placeholder="hello@example.com"
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1A1F2E] border border-[#2A2F3E] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>

                <div
                  className={`relative transition-all duration-200 ${
                    focusedField === "password"
                      ? "ring-2 ring-purple-500/50 rounded-xl"
                      : ""
                  }`}
                >
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    required
                    placeholder="Enter your password"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1A1F2E] border border-[#2A2F3E] rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2A2F3E]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#0F1119] text-gray-500">
                    Demo Accounts
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => quickLogin("admin")}
                  className="w-full py-3 rounded-xl border border-[#2A2F3E] text-gray-300 hover:bg-white/5 flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <Sparkles size={16} className="text-purple-400" />
                  Demo Admin Login
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin("user")}
                  className="w-full py-3 rounded-xl border border-[#2A2F3E] text-gray-300 hover:bg-white/5 flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <LogIn size={16} className="text-blue-400" />
                  Demo User Login
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes orbit-ring {
          0% {
            transform: rotate(0deg);
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
          }
          50% {
            transform: rotate(180deg);
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
          }
          100% {
            transform: rotate(360deg);
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
          }
        }
        
        .animate-orbit-ring {
          animation: orbit-ring 8s linear infinite;
        }
      `}</style>
    </div>
  );
}