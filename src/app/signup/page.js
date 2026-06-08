"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/signup`, {
        name,
        email,
        password,
      });

      alert("Signup successful! Please login.");
      router.push("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // Get line color based on password strength
  const getLineColor = () => {
    if (password.length === 0) return "bg-gray-600";
    if (password.length < 4) return "bg-red-500";
    if (password.length < 6) return "bg-yellow-500";
    if (password.length < 8) return "bg-green-500";
    return "bg-gradient-to-r from-[#7C3AED] to-[#2563EB]";
  };

  // Get width percentage
  const getLineWidth = () => {
    if (password.length === 0) return "0%";
    if (password.length < 4) return "25%";
    if (password.length < 6) return "50%";
    if (password.length < 8) return "75%";
    return "100%";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0A0F1A] to-[#050816] flex items-center justify-center p-4">
      
      {/* Main Container - Robot and Form Side by Side */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-0 max-w-5xl w-full">
        
        {/* Robot Section */}
        <div className="md:w-auto flex flex-col items-center justify-center">
          <div className="transform rotate-12 translate-x-8 translate-y-40">
            <Image
              src="/logo2.png"
              alt="Robot"
              width={240}
              height={240}
              className="object-contain"
              priority
            />
          </div>
          
          {/* Password Strength Line */}
          <div className="w-48 mt-24 -translate-x-4">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getLineColor()}`}
                style={{ width: getLineWidth() }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {password.length === 0 ? "Enter password" :
               password.length < 4 ? "Weak" :
               password.length < 6 ? "Fair" :
               password.length < 8 ? "Good" :
               "Strong"}
            </p>
          </div>
        </div>

        {/* Signup Form Card - Redesigned */}
        <div className="w-full md:w-[440px]">
          <div className="bg-[#0F1119] border border-[#1A1F2E] rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
              <p className="text-gray-400 text-sm">
                Join our platform and start your journey
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} className="px-8 pb-8 space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full name
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'name' ? 'ring-2 ring-purple-500/50 rounded-xl' : ''
                }`}>
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-[#1A1F2E] border border-[#2A2F3E] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'email' ? 'ring-2 ring-purple-500/50 rounded-xl' : ''
                }`}>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    placeholder="hello@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-[#1A1F2E] border border-[#2A2F3E] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className={`relative transition-all duration-200 ${
                  focusedField === 'password' ? 'ring-2 ring-purple-500/50 rounded-xl' : ''
                }`}>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-[#1A1F2E] border border-[#2A2F3E] rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-xs text-red-400 mt-2">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign up
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2A2F3E]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#0F1119] text-gray-500">Already have an account?</span>
                </div>
              </div>

              {/* Login Link */}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full py-3 rounded-xl border border-[#2A2F3E] text-gray-300 font-medium hover:bg-white/5 transition"
              >
                Log in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}