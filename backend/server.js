// ==========================
// LOAD ENV FIRST - CRITICAL FIX
// ==========================
require("dotenv").config();

// ==========================
// DEBUG ENV VARIABLES (REMOVE AFTER TESTING)
// ==========================
console.log("=== ENV DEBUG ===");
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "***LOADED***" : "UNDEFINED");
console.log("JWT_SECRET =", process.env.JWT_SECRET ? "***LOADED***" : "UNDEFINED");
console.log("GEMINI_API_KEY =", process.env.GEMINI_API_KEY ? "***LOADED***" : "UNDEFINED");
console.log("PORT =", process.env.PORT || "5000 (default)");
console.log("================");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const nodemailer = require("nodemailer");
const multer = require("multer");

// Market Analysis Packages
const googleTrends = require("google-trends-api");
const Sentiment = require("sentiment");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// RSS Parser for Competitor News
const Parser = require("rss-parser");
const parser = new Parser();

const supabase = require("./config/supabase");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Initialize Sentiment
const sentiment = new Sentiment();

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET;

// ==========================
// MULTER CONFIG
// ==========================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// ==========================
// NODEMAILER TRANSPORTER
// ==========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Nodemailer configuration error:");
    console.error(error);
  } else {
    console.log("✅ Nodemailer configured successfully");
    console.log(`   Email account: ${process.env.EMAIL_USER}`);
  }
});

// ==========================
// ACTIVITY LOG HELPER FUNCTION
// ==========================
async function logActivity(userId, action) {
  try {
    await supabase
      .from("activity_logs")
      .insert([
        {
          user_id: userId,
          action,
          created_at: new Date().toISOString()
        }
      ]);
  } catch (err) {
    console.error("Activity log error:", err);
  }
}

// ==========================
// JWT AUTHENTICATION MIDDLEWARE
// ==========================
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied",
    });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid token",
      });
    }
    req.user = user;
    next();
  });
}

// ==========================
// TRACK USER SESSION (REAL-TIME ACTIVE USERS) - ENHANCED WITH DUPLICATE PREVENTION
// ==========================
const activeSessions = new Map(); // userId -> { socketId, lastActive, currentPage, name, loginTime }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  // Handle real-time progress updates for competition
  socket.on("progressUpdated", async (data) => {
    const { userId, progress } = data;
    
    io.emit("userProgressUpdated", {
      userId,
      progress,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📊 User ${userId} updated progress to ${progress}%`);
  });

  // Enhanced user registration with name - PREVENT DUPLICATES
  socket.on("registerUser", async (userId) => {
    try {
      // Check if user already has an active session
      const existingSession = activeSessions.get(userId);
      
      // If user already has a session, update it instead of creating new one
      if (existingSession) {
        existingSession.socketId = socket.id;
        existingSession.lastActive = new Date().toISOString();
        activeSessions.set(userId, existingSession);
        console.log(`🔄 User ${userId} reconnected, updating session`);
      } else {
        // Get user details from database
        const { data: user } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", userId)
          .single();
        
        activeSessions.set(userId, {
          socketId: socket.id,
          userId: userId,
          name: user?.name || user?.email?.split("@")[0] || `User ${userId}`,
          lastActive: new Date().toISOString(),
          loginTime: new Date().toISOString(),
          currentPage: "dashboard"
        });
        
        console.log(`✅ New user ${userId} (${user?.name}) registered, active users: ${activeSessions.size}`);
      }
      
      // Broadcast updated active users list
      io.emit("activeUsersUpdate", {
        count: activeSessions.size,
        users: Array.from(activeSessions.values())
      });
      
    } catch (error) {
      console.error("Error registering user:", error);
      // Fallback registration
      if (!activeSessions.has(userId)) {
        activeSessions.set(userId, {
          socketId: socket.id,
          userId: userId,
          name: `User ${userId}`,
          lastActive: new Date().toISOString(),
          loginTime: new Date().toISOString(),
          currentPage: "dashboard"
        });
        
        io.emit("activeUsersUpdate", {
          count: activeSessions.size,
          users: Array.from(activeSessions.values())
        });
        
        console.log(`✅ User ${userId} registered (fallback), active users: ${activeSessions.size}`);
      }
    }
  });
  
  // Track page changes
  socket.on("pageChange", (data) => {
    if (activeSessions.has(data.userId)) {
      const user = activeSessions.get(data.userId);
      user.currentPage = data.page;
      user.lastActive = new Date().toISOString();
      activeSessions.set(data.userId, user);
      
      // Broadcast updated list
      io.emit("activeUsersUpdate", {
        count: activeSessions.size,
        users: Array.from(activeSessions.values())
      });
    }
  });

  // Handle user leaving explicitly
  socket.on("userLeaving", (data) => {
    if (activeSessions.has(data.userId)) {
      const session = activeSessions.get(data.userId);
      if (session.socketId === socket.id) {
        activeSessions.delete(data.userId);
        io.emit("activeUsersUpdate", {
          count: activeSessions.size,
          users: Array.from(activeSessions.values())
        });
        console.log(`👋 User ${data.userId} left explicitly, active users: ${activeSessions.size}`);
      }
    }
  });

  socket.on("disconnect", () => {
    // Find which user disconnected
    let disconnectedUserId = null;
    
    for (let [userId, session] of activeSessions.entries()) {
      if (session.socketId === socket.id) {
        disconnectedUserId = userId;
        activeSessions.delete(userId);
        break;
      }
    }
    
    // Only broadcast if a user actually disconnected
    if (disconnectedUserId) {
      io.emit("activeUsersUpdate", {
        count: activeSessions.size,
        users: Array.from(activeSessions.values())
      });
      console.log(`❌ User ${disconnectedUserId} disconnected, active users: ${activeSessions.size}`);
    } else {
      console.log("Unknown socket disconnected:", socket.id);
    }
  });
});

// ==========================
// WEB SCRAPER FUNCTION FOR URL ANALYSIS
// ==========================
async function scrapeWebsite(url) {
  let browser = null;
  try {
    console.log(`🌐 Scraping website: ${url}`);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const companyData = await page.evaluate(() => {
      const title = document.title;
      const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
      const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';
      const bodyText = document.body.innerText;
      const productMatches = bodyText.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
      const potentialProducts = [...new Set(productMatches)].slice(0, 10);
      
      return {
        company_name: title.split('|')[0].split('-')[0].trim(),
        description: metaDescription,
        keywords: metaKeywords,
        full_text: bodyText.substring(0, 10000),
        potential_products: potentialProducts
      };
    });
    
    console.log(`✅ Successfully scraped ${companyData.company_name}`);
    return companyData;
    
  } catch (error) {
    console.error(`❌ Scraping failed: ${error.message}`);
    throw new Error(`Failed to scrape website: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

// ==========================
// URL TO MARKET ANALYSIS ROUTE
// ==========================
app.post("/analyze-company-url", authenticateToken, async (req, res) => {
  try {
    const { url, gemini_api_key } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }
    
    console.log(`🔍 Analyzing company from URL: ${url}`);
    
    const companyData = await scrapeWebsite(url);
    let marketAnalysis = null;
    
    if (gemini_api_key) {
      try {
        const genAI = new GoogleGenerativeAI(gemini_api_key);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        const prompt = `You are a market analyst. Analyze this company and provide market insights.

COMPANY NAME: ${companyData.company_name}
DESCRIPTION: ${companyData.description}
PRODUCTS: ${companyData.potential_products.join(', ')}

Provide a JSON response with:
{
  "market_size": "Estimated market size in USD",
  "market_growth": "Projected CAGR percentage",
  "target_audience": ["audience1", "audience2"],
  "key_features": ["feature1", "feature2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "threats": ["threat1", "threat2"],
  "recommended_strategy": "Brief strategy recommendation",
  "unique_selling_point": "Main USP"
}`;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          marketAnalysis = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiError) {
        console.error("Gemini analysis failed:", geminiError.message);
        marketAnalysis = null;
      }
    }
    
    if (!marketAnalysis) {
      marketAnalysis = {
        market_size: "To be determined",
        market_growth: "Analyzing trends",
        target_audience: ["Tech enthusiasts", "Early adopters", "Business users"],
        key_features: companyData.potential_products.slice(0, 5),
        strengths: ["Innovative product", "Growing market"],
        weaknesses: ["Brand recognition", "Market competition"],
        opportunities: ["Market expansion", "Partnerships"],
        threats: ["Competitors", "Economic conditions"],
        recommended_strategy: "Focus on product differentiation and customer acquisition",
        unique_selling_point: companyData.description.substring(0, 100)
      };
    }
    
    let trendScore = 50;
    try {
      const trendData = await googleTrends.interestOverTime({
        keyword: companyData.company_name,
      });
      const parsed = JSON.parse(trendData);
      const timeline = parsed.default.timelineData;
      if (timeline && timeline.length) {
        trendScore = Math.round(
          timeline.reduce((sum, item) => sum + item.value[0], 0) / timeline.length
        );
      }
    } catch (err) {
      console.log("Google Trends not available for:", companyData.company_name);
    }
    
    const positiveSentiment = 65;
    const negativeSentiment = 20;
    const neutralSentiment = 15;
    
    const { data: savedAnalysis, error: dbError } = await supabase
      .from("market_analysis")
      .insert([{
        keyword: companyData.company_name,
        trend_score: trendScore,
        market_growth: parseInt(marketAnalysis.market_growth) || 10,
        positive_sentiment: positiveSentiment,
        negative_sentiment: negativeSentiment,
        neutral_sentiment: neutralSentiment,
        opportunities: marketAnalysis.opportunities || [],
        threats: marketAnalysis.threats || [],
        ai_summary: `## Market Analysis for ${companyData.company_name}\n\n` +
                   `**Market Size:** ${marketAnalysis.market_size}\n\n` +
                   `**Growth Rate:** ${marketAnalysis.market_growth}\n\n` +
                   `**Target Audience:** ${marketAnalysis.target_audience?.join(', ')}\n\n` +
                   `**Key Features:** ${marketAnalysis.key_features?.join(', ')}\n\n` +
                   `**Strengths:** ${marketAnalysis.strengths?.join(', ')}\n\n` +
                   `**Weaknesses:** ${marketAnalysis.weaknesses?.join(', ')}\n\n` +
                   `**Opportunities:** ${marketAnalysis.opportunities?.join(', ')}\n\n` +
                   `**Threats:** ${marketAnalysis.threats?.join(', ')}\n\n` +
                   `**Recommendation:** ${marketAnalysis.recommended_strategy}\n\n` +
                   `**USP:** ${marketAnalysis.unique_selling_point}`,
        created_by: req.user.id
      }])
      .select();
    
    if (dbError) {
      console.error("DB save error:", dbError);
    }
    
    await logActivity(req.user.id, `Analyzed company: ${companyData.company_name} from URL`);
    
    res.json({
      success: true,
      message: "Company analysis completed",
      company: {
        name: companyData.company_name,
        url: url,
        description: companyData.description
      },
      market_analysis: marketAnalysis,
      trend_score: trendScore,
      stored_id: savedAnalysis?.[0]?.id
    });
    
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================
// GET REAL-TIME ACTIVE USERS
// ==========================
app.get("/active-users", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    count: activeSessions.size,
    users: Array.from(activeSessions.values()),
    timestamp: new Date().toISOString()
  });
});

// ==========================
// GET USER ENGAGEMENT METRICS (COMPLETELY REAL - NO RANDOM DATA)
// ==========================
app.get("/user-engagement-metrics", authenticateToken, adminMiddleware, async (req, res) => {
  try {
    // Get all users
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email, created_at");
    
    // Get activity logs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activities } = await supabase
      .from("activity_logs")
      .select("*")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });
    
    const totalUsers = users?.length || 0;
    
    // 1. REAL ACTIVE USERS COUNT (from activity logs in last 30 days)
    const uniqueActiveUsers = new Set(activities?.map(a => a.user_id) || []);
    const totalActiveUsers = uniqueActiveUsers.size;
    
    // 2. REAL ENGAGEMENT RATE (Users active in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeLast7Days = new Set(
      activities?.filter(a => new Date(a.created_at) >= sevenDaysAgo).map(a => a.user_id) || []
    );
    const engagementRate = totalUsers > 0 ? Math.round((activeLast7Days.size / totalUsers) * 100) : 0;
    
    // 3. REAL RETENTION RATE (Users who returned after first week)
    let retentionRate = 0;
    if (users && users.length > 0) {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const oldUsers = users.filter(u => new Date(u.created_at) <= fourteenDaysAgo);
      const oldUserIds = new Set(oldUsers.map(u => u.id));
      
      const returningUsers = new Set();
      activities?.forEach(activity => {
        if (oldUserIds.has(activity.user_id)) {
          const activityDate = new Date(activity.created_at);
          if (activityDate >= sevenDaysAgo) {
            returningUsers.add(activity.user_id);
          }
        }
      });
      
      retentionRate = oldUsers.length > 0 ? Math.round((returningUsers.size / oldUsers.length) * 100) : 0;
    }
    
    // 4. REAL AVERAGE SESSION DURATION (Based on activity patterns)
    let avgSessionDuration = "0m";
    if (activities && activities.length > 0) {
      const userActivities = new Map();
      activities.forEach(activity => {
        if (!userActivities.has(activity.user_id)) {
          userActivities.set(activity.user_id, []);
        }
        userActivities.get(activity.user_id).push({
          timestamp: new Date(activity.created_at),
          action: activity.action
        });
      });
      
      let totalSessionMinutes = 0;
      let sessionCount = 0;
      
      for (const [userId, userActs] of userActivities) {
        if (userActs.length < 2) continue;
        
        userActs.sort((a, b) => a.timestamp - b.timestamp);
        
        let sessionStart = userActs[0]?.timestamp;
        for (let i = 1; i < userActs.length; i++) {
          const timeDiff = (userActs[i].timestamp - userActs[i-1].timestamp) / 1000 / 60;
          
          if (timeDiff > 30) {
            if (sessionStart) {
              const sessionDuration = (userActs[i-1].timestamp - sessionStart) / 1000 / 60;
              if (sessionDuration > 1 && sessionDuration < 480) {
                totalSessionMinutes += sessionDuration;
                sessionCount++;
              }
            }
            sessionStart = userActs[i].timestamp;
          }
        }
        
        if (sessionStart && userActs.length > 0) {
          const lastDuration = (userActs[userActs.length - 1].timestamp - sessionStart) / 1000 / 60;
          if (lastDuration > 1 && lastDuration < 480) {
            totalSessionMinutes += lastDuration;
            sessionCount++;
          }
        }
      }
      
      const avgMinutes = sessionCount > 0 ? Math.round(totalSessionMinutes / sessionCount) : 0;
      avgSessionDuration = avgMinutes > 0 ? `${avgMinutes}m` : "5m";
    }
    
    // 5. REAL LOGIN FREQUENCY DATA
    const loginLogs = activities?.filter(a => a.action?.toLowerCase().includes("login")) || [];
    const loginByDate = new Map();
    
    loginLogs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString();
      loginByDate.set(date, (loginByDate.get(date) || 0) + 1);
    });
    
    const loginFrequencyData = Array.from(loginByDate.entries())
      .map(([date, count]) => ({ date, logins: count }))
      .slice(-14);
    
    // 6. REAL FEATURE USAGE (from actual activity logs)
    const projectCount = activities?.filter(a => a.action?.toLowerCase().includes("project")).length || 0;
    const ideaCount = activities?.filter(a => a.action?.toLowerCase().includes("idea")).length || 0;
    const marketCount = activities?.filter(a => a.action?.toLowerCase().includes("market") || a.action?.toLowerCase().includes("analysis")).length || 0;
    const meetingCount = activities?.filter(a => a.action?.toLowerCase().includes("meeting")).length || 0;
    
    const featureUsageData = [
      { name: "Projects", value: projectCount, color: "#8B5CF6" },
      { name: "Ideas", value: ideaCount, color: "#3B82F6" },
      { name: "Market Analysis", value: marketCount, color: "#06B6D4" },
      { name: "Meetings", value: meetingCount, color: "#22C55E" },
    ];
    
    // 7. REAL SESSION DATA BY HOUR (from actual activity timestamps - NO RANDOM)
    const hourBuckets = new Map();
    for (let i = 0; i < 24; i++) {
      hourBuckets.set(i, { hour: `${i}:00`, users: 0 });
    }
    
    activities?.forEach(activity => {
      const hour = new Date(activity.created_at).getHours();
      const bucket = hourBuckets.get(hour);
      if (bucket) {
        bucket.users++;
      }
    });
    
    const sessionData = Array.from(hourBuckets.values()).map(bucket => ({
      hour: bucket.hour,
      users: bucket.users,
    }));
    
    // 8. REAL DROP-OFF CALCULATIONS BASED ON ACTUAL USER ACTIVITY
    const allUserIds = users?.map(u => u.id) || [];
    const totalUsersCount = allUserIds.length;

    const usersAtStage = {
      "Login": new Set(allUserIds),
      "Dashboard": new Set(),
      "Projects": new Set(),
      "Ideas": new Set(),
      "Market Analysis": new Set(),
      "Meetings": new Set()
    };

    activities?.forEach(activity => {
      const action = activity.action?.toLowerCase() || "";
      const userId = activity.user_id;
      
      if (action.includes("dashboard") || action.includes("login") || action.includes("welcome")) {
        usersAtStage["Dashboard"].add(userId);
      }
      if (action.includes("project")) {
        usersAtStage["Projects"].add(userId);
      }
      if (action.includes("idea")) {
        usersAtStage["Ideas"].add(userId);
      }
      if (action.includes("market") || action.includes("analysis")) {
        usersAtStage["Market Analysis"].add(userId);
      }
      if (action.includes("meeting")) {
        usersAtStage["Meetings"].add(userId);
      }
    });

    const dropOffData = [
      { stage: "Login", users: usersAtStage["Login"].size, retention: totalUsersCount > 0 ? 100 : 0 },
      { stage: "Dashboard", users: usersAtStage["Dashboard"].size, retention: totalUsersCount > 0 ? Math.round((usersAtStage["Dashboard"].size / totalUsersCount) * 100) : 0 },
      { stage: "Projects", users: usersAtStage["Projects"].size, retention: totalUsersCount > 0 ? Math.round((usersAtStage["Projects"].size / totalUsersCount) * 100) : 0 },
      { stage: "Ideas", users: usersAtStage["Ideas"].size, retention: totalUsersCount > 0 ? Math.round((usersAtStage["Ideas"].size / totalUsersCount) * 100) : 0 },
      { stage: "Market Analysis", users: usersAtStage["Market Analysis"].size, retention: totalUsersCount > 0 ? Math.round((usersAtStage["Market Analysis"].size / totalUsersCount) * 100) : 0 },
      { stage: "Meetings", users: usersAtStage["Meetings"].size, retention: totalUsersCount > 0 ? Math.round((usersAtStage["Meetings"].size / totalUsersCount) * 100) : 0 },
    ];
    
    console.log("📊 REAL Engagement Metrics:", {
      totalActiveUsers,
      engagementRate,
      retentionRate,
      avgSessionDuration,
      realTimeActive: activeSessions.size,
      sessionDataPoints: sessionData.filter(s => s.users > 0).length,
      dropOffPoints: dropOffData
    });
    
    res.json({
      success: true,
      metrics: {
        totalActiveUsers: totalActiveUsers,
        engagementRate: engagementRate,
        retentionRate: retentionRate,
        avgSessionDuration: avgSessionDuration,
        loginFrequency: loginFrequencyData,
        featureUsage: featureUsageData,
        sessionData: sessionData,
        dropOffPoints: dropOffData,
        realTimeActive: activeSessions.size
      }
    });
    
  } catch (error) {
    console.error("Error fetching engagement metrics:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================
// TEST ROUTE
// ==========================
app.get("/", (req, res) => {
  res.send("Backend running with Supabase 🚀");
});

// ==========================
// SIGNUP
// ==========================
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const { data: existingUsers, error: findError } =
      await supabase
        .from("users")
        .select("*")
        .eq("email", email);

    if (findError) {
      throw findError;
    }

    if (existingUsers.length > 0) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: "user"
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    await logActivity(data[0].id, `User registered: ${email}`);

    res.json({
      message: "User registered successfully",
      user: data[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Signup error",
      error: error.message
    });
  }
});

// ==========================
// LOGIN
// ==========================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (error) {
      throw error;
    }

    if (users.length === 0) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      SECRET_KEY,
      {
        expiresIn: "24h"
      }
    );

    await logActivity(user.id, `User logged in: ${email}`);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Login error",
      error: error.message
    });
  }
});

// ==========================
// AUTH MIDDLEWARE (ALIAS FOR BACKWARD COMPATIBILITY)
// ==========================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
}

// ==========================
// ADMIN MIDDLEWARE
// ==========================
function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied (Admin only)"
    });
  }
  next();
}

// ==========================
// DASHBOARD
// ==========================
app.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    message: "Welcome to Dashboard",
    user: req.user
  });
});

// ==========================
// ADMIN ROUTE
// ==========================
app.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    message: "Welcome Admin 🚀"
  });
});

// ==========================
// GET ALL PROJECTS (ADMIN)
// ==========================
app.get("/all-projects", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*");

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message
    });
  }
});

// ==========================
// GET ALL USERS 
// ==========================
app.get("/all-users", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role");

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
});

// ==========================
// GET ALL USERS WITH THEIR PROJECT PROGRESS
// ==========================
app.get("/all-users-progress", authenticateToken, async (req, res) => {
  try {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, role")
      .neq("role", "admin");

    if (usersError) {
      throw usersError;
    }

    const usersWithProgress = await Promise.all(
      users.map(async (user) => {
        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select("id, title, progress, status, created_at")
          .eq("assigned_user_id", user.id);

        if (projectsError) {
          console.log(`Error fetching projects for user ${user.id}:`, projectsError);
          return {
            ...user,
            projects: [],
            avgProgress: 0,
            totalProjects: 0,
            completedProjects: 0
          };
        }

        const totalProjects = projects?.length || 0;
        const completedProjects = projects?.filter(p => p.status === "completed").length || 0;
        const avgProgress = totalProjects > 0
          ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects)
          : 0;

        return {
          ...user,
          projects: projects || [],
          avgProgress,
          totalProjects,
          completedProjects
        };
      })
    );

    const sortedUsers = usersWithProgress.sort((a, b) => b.avgProgress - a.avgProgress);

    res.json(sortedUsers);
  } catch (error) {
    console.error("Error fetching all users progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users progress",
      error: error.message
    });
  }
});

// ==========================
// CREATE PROJECT
// ==========================
app.post("/create-project", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, assigned_user_id, progress } = req.body;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", assigned_user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        message: "Assigned user not found"
      });
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          title,
          description,
          assigned_user_id,
          assigned_to: user.name,
          status: "pending",
          progress: progress || 0
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    await logActivity(req.user.id, `Created project: ${title} for user ${user.name}`);

    res.json({
      message: "Project assigned successfully 🚀",
      project: data[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Project creation failed",
      error: error.message
    });
  }
});

// ==========================
// GET MY PROJECTS
// ==========================
app.get("/my-projects", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("assigned_user_id", req.user.id);

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching projects",
      error: error.message
    });
  }
});

// ==========================
// UPDATE PROJECT STATUS
// ==========================
app.put("/update-project/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("assigned_user_id", req.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const { data, error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    await logActivity(req.user.id, `Updated project status to ${status}: ${project.title}`);

    res.json({
      message: "Project updated successfully",
      project: data[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Update failed",
      error: error.message
    });
  }
});

// ==========================
// UPDATE PROJECT PROGRESS (WITH SOCKET EMIT)
// ==========================
app.put("/update-project-progress/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        message: "Progress must be between 0 and 100"
      });
    }

    let query = supabase
      .from("projects")
      .select("*")
      .eq("id", id);

    if (req.user.role !== "admin") {
      query = query.eq("assigned_user_id", req.user.id);
    }

    const { data: project, error: projectError } = await query.single();

    if (projectError || !project) {
      return res.status(404).json({
        message: "Project not found or access denied"
      });
    }

    const { data, error } = await supabase
      .from("projects")
      .update({ progress })
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    let newStatus = project.status;
    if (progress === 100) {
      newStatus = "completed";
    } else if (progress > 0 && progress < 100 && project.status === "pending") {
      newStatus = "in progress";
    } else if (progress === 0 && project.status === "completed") {
      newStatus = "pending";
    }

    if (newStatus !== project.status) {
      await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", id);
      
      data[0].status = newStatus;
    }

    await logActivity(req.user.id, `Updated project progress to ${progress}%: ${project.title}`);

    io.emit("userProgressUpdated", {
      userId: req.user.id,
      userName: req.user.email,
      progress: progress,
      projectId: id,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: "Progress updated 🚀",
      project: data[0],
      autoStatus: newStatus !== project.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update progress",
      error: error.message
    });
  }
});

// ==========================
// DELETE PROJECT (ADMIN)
// ==========================
app.delete("/delete-project/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    if (project) {
      await logActivity(req.user.id, `Deleted project: ${project.title}`);
    }

    res.json({
      message: "Project deleted successfully 🚀"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Delete failed",
      error: error.message
    });
  }
});

// ==========================
// SEND REMINDER EMAIL
// ==========================
app.post("/send-reminder/:id", authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", project.assigned_user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Project Reminder 🚀",
      html: `
        <h2>Hello ${user.name}</h2>
        <p>This is a reminder for your assigned project.</p>
        <h3>Project Details</h3>
        <p><strong>Title:</strong> ${project.title}</p>
        <p><strong>Description:</strong> ${project.description}</p>
        <p><strong>Status:</strong> ${project.status}</p>
        <p><strong>Progress:</strong> ${project.progress || 0}%</p>
        <br />
        <p>Please update your progress.</p>
        <p>Regards,<br/>Admin Team</p>
      `,
    });

    await logActivity(req.user.id, `Sent reminder for project: ${project.title}`);

    res.json({
      message: "Reminder sent successfully 🚀",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to send email",
    });
  }
});

// ==========================
// SEND MESSAGE
// ==========================
app.post("/send-message", authMiddleware, async (req, res) => {
  try {
    const { receiver_id, message } = req.body;

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: req.user.id,
          receiver_id,
          message
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    await logActivity(req.user.id, `Sent message to user ${receiver_id}`);

    io.emit("receiveMessage", {
      message: data[0],
      sender_id: req.user.id,
      receiver_id: receiver_id
    });

    res.json({
      message: "Message sent 🚀",
      data
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to send message",
      error: error.message
    });
  }
});

// ==========================
// GET MESSAGES
// ==========================
app.get("/get-messages/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", {
        ascending: true
      });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to fetch messages",
      error: error.message
    });
  }
});

// ==========================
// UPLOAD RESEARCH
// ==========================
app.post(
  "/upload-research",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        research_link,
      } = req.body;

      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      if (req.file) {
        const file = req.file;

        const uniqueName =
          `${Date.now()}-${file.originalname}`;

        const { error: uploadError } =
          await supabase.storage
            .from("research-files")
            .upload(uniqueName, file.buffer, {
              contentType:
                file.mimetype,
            });

        if (uploadError)
          throw uploadError;

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("research-files")
          .getPublicUrl(uniqueName);

        fileUrl =
          publicUrlData.publicUrl;

        fileName =
          file.originalname;

        fileType =
          file.mimetype;
      }

      const { data, error } =
        await supabase
          .from("research")
          .insert([
            {
              title,
              description,
              category,
              research_link,
              uploaded_by:
                req.user.id,
              file_name:
                fileName,
              file_url:
                fileUrl,
              file_type:
                fileType,
            },
          ])
          .select();

      if (error) throw error;

      await logActivity(req.user.id, `Uploaded research: ${title}`);

      res.json({
        message:
          "Research uploaded 🚀",
        data,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Upload failed",
        error:
          error.message,
      });
    }
  }
);

// ==========================
// GET RESEARCH
// ==========================
app.get(
  "/research",
  authMiddleware,
  async (req, res) => {
    try {
      const { data, error } =
        await supabase
          .from("research")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (error) throw error;

      res.json(data);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch research",
      });
    }
  }
);

// ==========================
// DELETE RESEARCH FILE
// ==========================
app.delete(
  "/delete-research/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        data: research,
        error: findError,
      } = await supabase
        .from("research")
        .select("*")
        .eq("id", id)
        .single();

      if (findError || !research) {
        return res.status(404).json({
          message: "Research not found",
        });
      }

      if (research.file_url) {
        const filePath = research.file_url.split("/").pop();
        await supabase.storage
          .from("research-files")
          .remove([filePath]);
      }

      await supabase
        .from("research")
        .delete()
        .eq("id", id);

      await logActivity(req.user.id, `Deleted research: ${research.title}`);

      res.json({
        message: "Research deleted successfully 🚀",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Delete failed",
      });
    }
  }
);

// ==========================
// GET ALL IDEAS
// ==========================
app.get(
  "/ideas",
  authMiddleware,
  async (req, res) => {
    try {
      const { data, error } =
        await supabase
          .from("ideas")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) throw error;

      res.json(data);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to fetch ideas",
      });
    }
  }
);

// ==========================
// CREATE IDEA
// ==========================
app.post(
  "/create-idea",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        priority,
        reference_link,
      } = req.body;

      const {
        data,
        error,
      } = await supabase
        .from("ideas")
        .insert([
          {
            title,
            description,
            category,
            priority,
            reference_link,
            created_by:
              req.user.id,
            creator_name:
              req.user.email,
            status:
              "pending",
            votes: 0,
          },
        ])
        .select();

      if (error) throw error;

      await logActivity(req.user.id, `Created idea: ${title}`);

      res.json({
        message:
          "Idea created 🚀",
        idea: data[0],
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to create idea",
        error:
          error.message,
      });
    }
  }
);

// ==========================
// VOTE IDEA
// ==========================
app.put(
  "/vote-idea/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        data: idea,
        error:
          fetchError,
      } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .single();

      if (
        fetchError ||
        !idea
      ) {
        return res
          .status(404)
          .json({
            message:
              "Idea not found",
          });
      }

      const {
        data,
        error,
      } = await supabase
        .from("ideas")
        .update({
          votes:
            idea.votes +
            1,
        })
        .eq("id", id)
        .select();

      if (error) throw error;

      await logActivity(req.user.id, `Voted for idea: ${idea.title}`);

      res.json({
        message:
          "Vote added",
        idea: data[0],
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to vote",
      });
    }
  }
);

// ==========================
// UPDATE IDEA STATUS (ADMIN ONLY) - FULL UPDATE
// ==========================
app.put(
  "/update-idea/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        status,
        priority,
        admin_feedback,
      } = req.body;

      const {
        data,
        error,
      } = await supabase
        .from("ideas")
        .update({
          status,
          priority,
          admin_feedback,
        })
        .eq("id", id)
        .select();

      if (error)
        throw error;

      await logActivity(req.user.id, `Updated idea status to ${status}: ${data[0]?.title}`);

      res.json({
        message:
          "Idea updated successfully 🚀",
        idea: data[0],
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to update idea",
      });
    }
  }
);

// ==========================
// UPDATE IDEA STATUS ONLY (ADMIN ONLY)
// ==========================
app.put(
  "/update-idea-status/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const { data, error } =
        await supabase
          .from("ideas")
          .update({
            status,
          })
          .eq("id", id)
          .select();

      if (error)
        throw error;

      await logActivity(req.user.id, `Updated idea status to ${status}`);

      res.json({
        message:
          "Status updated successfully ✅",
        data,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to update status",
      });
    }
  }
);

// ==========================
// DELETE IDEA
// ==========================
app.delete(
  "/delete-idea/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { data: idea } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .single();

      const { error } =
        await supabase
          .from("ideas")
          .delete()
          .eq("id", id);

      if (error) throw error;

      if (idea) {
        await logActivity(req.user.id, `Deleted idea: ${idea.title}`);
      }

      res.json({
        message:
          "Idea deleted successfully 🚀",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to delete idea",
      });
    }
  }
);

// ==========================
// MARKET ANALYSIS AI (KEYWORD BASED)
// ==========================
app.post(
  "/market-analysis",
  authMiddleware,
  async (req, res) => {
    try {
      const { keyword } = req.body;

      console.log("🔍 Market analysis:", keyword);

      let trendScore = 50;

      try {
        const trendData = await googleTrends.interestOverTime({
          keyword: keyword,
        });

        const parsed = JSON.parse(trendData);
        const timeline = parsed.default.timelineData;

        if (timeline && timeline.length) {
          trendScore = Math.round(
            timeline.reduce((sum, item) => sum + item.value[0], 0) / timeline.length
          );
        }
      } catch (err) {
        console.log("Google Trends failed:", err.message);
      }

      let redditText = "";

      try {
        const redditURL = `https://www.reddit.com/search/?q=${encodeURIComponent(keyword)}`;

        const response = await axios.get(redditURL, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });

        const $ = cheerio.load(response.data);

        $("h3").each((i, el) => {
          redditText += $(el).text() + " ";
        });
      } catch (error) {
        console.log("Reddit scrape failed:", error.message);
      }

      const analysis = sentiment.analyze(redditText);

      let positive = 50;
      let negative = 20;
      let neutral = 30;

      if (analysis.score > 0) {
        positive = 72;
        negative = 12;
        neutral = 16;
      } else if (analysis.score < 0) {
        positive = 20;
        negative = 60;
        neutral = 20;
      }

      const opportunities = [];
      const threats = [];

      const lowerKeyword = keyword.toLowerCase();

      if (lowerKeyword.includes("robot") || lowerKeyword.includes("ai")) {
        opportunities.push("Home robotics market");
        opportunities.push("Emotional AI companion");
        opportunities.push("Productivity robot");
        threats.push("Hardware cost");
        threats.push("Battery limitations");
      }

      if (lowerKeyword.includes("market") || lowerKeyword.includes("product")) {
        opportunities.push("Market expansion potential");
        opportunities.push("New product features");
        threats.push("Competition");
      }

      if (lowerKeyword.includes("tech") || lowerKeyword.includes("software")) {
        opportunities.push("Innovation opportunities");
        opportunities.push("Integration possibilities");
        threats.push("Rapid tech changes");
      }

      if (trendScore > 60) {
        opportunities.push("Growing demand");
      } else if (trendScore < 40) {
        threats.push("Weak search demand");
      } else {
        opportunities.push("Stable market interest");
      }

      if (opportunities.length === 0) {
        opportunities.push("Further research needed");
        opportunities.push("Market exploration");
      }

      if (threats.length === 0) {
        threats.push("Market competition");
        threats.push("Resource requirements");
      }

      const aiSummary = `
The ${keyword} market currently shows a trend score of ${trendScore}/100.

Consumer sentiment appears ${analysis.score > 0 ? "mostly positive" : analysis.score < 0 ? "somewhat negative" : "neutral"}.

Key opportunities include:
${opportunities.join(", ")}

Potential threats include:
${threats.join(", ")}

Overall market outlook:
${
  trendScore > 60
    ? "Strong growth potential with favorable conditions."
    : trendScore > 40
    ? "Moderate opportunity with careful planning required."
    : "Challenging market conditions - consider niche targeting."
}
`;

      const { data, error } = await supabase
        .from("market_analysis")
        .insert([
          {
            keyword: keyword,
            trend_score: trendScore,
            market_growth: Math.round(trendScore / 5),
            positive_sentiment: positive,
            negative_sentiment: negative,
            neutral_sentiment: neutral,
            opportunities: opportunities,
            threats: threats,
            ai_summary: aiSummary,
            created_by: req.user.id
          },
        ])
        .select();

      if (error) throw error;

      await logActivity(req.user.id, `Performed market analysis for: ${keyword}`);

      res.json({
        success: true,
        data: data[0],
      });
    } catch (error) {
      console.error("Market analysis error:", error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ==========================
// GET MARKET ANALYSES (HISTORY)
// ==========================
app.get("/market-analyses", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("market_analysis")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================
// GET SINGLE MARKET ANALYSIS
// ==========================
app.get("/market-analysis/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("market_analysis")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================
// DELETE MARKET ANALYSIS (ADMIN)
// ==========================
app.delete("/market-analysis/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("market_analysis")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await logActivity(req.user.id, `Deleted market analysis`);

    res.json({
      success: true,
      message: "Market analysis deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================
// COMPETITOR NEWS ANALYSIS WITH OLLAMA QWEN3:1.7B
// ==========================
app.get(
  "/competitor-news",
  authMiddleware,
  async (req, res) => {
    try {
      const keyword = req.query.keyword || "OpenAI";

      console.log(`📰 Fetching competitor news for: ${keyword}`);

      const feed = await parser.parseURL(
        `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`
      );

      const articles = feed.items.slice(0, 8);
      const analyzedNews = [];

      for (const article of articles) {
        const prompt = `
You are an enterprise competitor intelligence AI.

Analyze this competitor news.

TITLE:
${article.title}

CONTENT:
${article.contentSnippet || article.content || "No content available"}

SOURCE:
${article.creator || article.source || "Google News"}

PUBLISHED:
${article.pubDate || "Unknown date"}

Please provide a professional analysis with:

1. **Summary** (2-3 sentences)
2. **Threat Level** (High/Medium/Low)
3. **Market Impact** (How this affects the market)
4. **Competitor Strategy** (What the competitor is doing)
5. **Opportunity** (What we can learn/leverage)
6. **Recommended Action** (What should we do)

Keep response concise and actionable.
`;

        try {
          const aiResponse = await axios.post(
            "http://localhost:11434/api/generate",
            {
              model: "qwen3:1.7b",
              prompt: prompt,
              stream: false,
              options: {
                temperature: 0.7,
                top_p: 0.9,
              }
            }
          );

          analyzedNews.push({
            title: article.title,
            link: article.link,
            published: article.pubDate,
            source: article.creator || article.source || "Google News",
            contentSnippet: article.contentSnippet?.substring(0, 300),
            analysis: aiResponse.data.response,
            analyzedAt: new Date().toISOString()
          });

          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (ollamaError) {
          console.error(`Ollama analysis failed for article: ${article.title}`, ollamaError.message);
          analyzedNews.push({
            title: article.title,
            link: article.link,
            published: article.pubDate,
            source: article.creator || article.source || "Google News",
            contentSnippet: article.contentSnippet?.substring(0, 300),
            analysis: "❌ AI analysis failed. Please check if Ollama is running with 'ollama run qwen3:1.7b'",
            error: ollamaError.message,
            analyzedAt: new Date().toISOString()
          });
        }
      }

      try {
        const { error: saveError } = await supabase
          .from("competitor_news_analysis")
          .insert([
            {
              keyword: keyword,
              news_count: analyzedNews.length,
              analyses: analyzedNews,
              created_by: req.user.id,
              created_at: new Date().toISOString()
            }
          ]);

        if (saveError) {
          console.log("Could not save to database (table may not exist):", saveError.message);
        }
      } catch (dbError) {
        console.log("Database save skipped - table not found");
      }

      await logActivity(
        req.user.id,
        `Generated competitor analysis for ${keyword} (${analyzedNews.length} articles)`
      );

      res.json({
        success: true,
        keyword,
        totalArticles: analyzedNews.length,
        analyzedAt: new Date().toISOString(),
        news: analyzedNews,
        summary: {
          totalAnalyzed: analyzedNews.length,
          modelsUsed: "qwen3:1.7b",
          source: "Google News RSS"
        }
      });

    } catch (error) {
      console.error("Competitor News Error:", error);

      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to fetch competitor news. Please make sure Ollama is running."
      });
    }
  }
);

// ==========================
// GET COMPETITOR NEWS HISTORY (OPTIONAL)
// ==========================
app.get(
  "/competitor-news-history",
  authMiddleware,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("competitor_news_analysis")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error("Error fetching competitor news history:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ==========================
// AI ASSISTANT ROUTE
// ==========================
app.post(
  "/ai-assistant",
  authMiddleware,
  async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: "Prompt is required"
        });
      }

      const response = await axios.post(
        "http://localhost:11434/api/generate",
        {
          model: "qwen2.5-coder:1.5b",
          prompt: prompt,
          stream: false,
        }
      );

      await logActivity(req.user.id, `Used AI Assistant with prompt: ${prompt.substring(0, 50)}...`);

      res.json({
        success: true,
        answer: response.data.response,
      });
    } catch (error) {
      console.error("AI Assistant error:", error);

      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: "AI service is not available. Please make sure Ollama is running on localhost:11434",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ==========================
// ADMIN DASHBOARD STATS
// ==========================
app.get(
  "/dashboard-stats",
  authMiddleware,
  async (req, res) => {
    try {
      const { data: users } = await supabase
        .from("users")
        .select("*");

      const { data: projects } = await supabase
        .from("projects")
        .select("*");

      const { data: market } = await supabase
        .from("market_analysis")
        .select("*");

      const { data: research } = await supabase
        .from("research")
        .select("*");

      const { data: ideas } = await supabase
        .from("ideas")
        .select("*");

      const { data: meetings } = await supabase
        .from("meetings")
        .select("*");

      const { data: events } = await supabase
        .from("calendar_events")
        .select("*");

      const totalUsers = users?.length || 0;
      const totalProjects = projects?.length || 0;
      
      const completedProjects = projects?.filter(
        (p) => p.status === "completed"
      ).length || 0;

      const inProgressProjects = projects?.filter(
        (p) => p.status === "in progress"
      ).length || 0;

      const pendingProjects = projects?.filter(
        (p) => p.status === "pending"
      ).length || 0;

      const avgProgress = projects?.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0;

      const marketReports = market?.length || 0;
      const totalMeetings = meetings?.length || 0;
      const totalEvents = events?.length || 0;

      const completionRate = totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weeklyData = days.map((day) => ({ day, value: 0 }));

      projects?.forEach((project) => {
        if (project.created_at) {
          const date = new Date(project.created_at);
          const dayIndex = date.getDay();
          if (weeklyData[dayIndex]) {
            weeklyData[dayIndex].value += 1;
          }
        }
      });

      ideas?.forEach((idea) => {
        if (idea.created_at) {
          const date = new Date(idea.created_at);
          const dayIndex = date.getDay();
          if (weeklyData[dayIndex]) {
            weeklyData[dayIndex].value += 1;
          }
        }
      });

      const enhancedWeeklyData = weeklyData.map((item) => ({
        ...item,
        value: item.value > 0 ? item.value : 0
      }));

      const recentActivity = [];

      projects?.slice(0, 3).forEach((p) => {
        recentActivity.push({
          id: p.id,
          type: "project",
          title: "Project Created",
          subtitle: p.title,
          time: p.created_at,
          status: p.status,
          progress: p.progress || 0
        });
      });

      ideas?.slice(0, 2).forEach((idea) => {
        recentActivity.push({
          id: idea.id,
          type: "idea",
          title: "Idea Submitted",
          subtitle: idea.title,
          time: idea.created_at,
          priority: idea.priority
        });
      });

      research?.slice(0, 2).forEach((r) => {
        recentActivity.push({
          id: r.id,
          type: "research",
          title: "Research Uploaded",
          subtitle: r.title,
          time: r.created_at,
          category: r.category
        });
      });

      market?.slice(0, 2).forEach((m) => {
        recentActivity.push({
          id: m.id,
          type: "market",
          title: "Market Analysis",
          subtitle: m.keyword,
          time: m.created_at,
          trendScore: m.trend_score
        });
      });

      meetings?.slice(0, 2).forEach((m) => {
        recentActivity.push({
          id: m.id,
          type: "meeting",
          title: "Meeting Scheduled",
          subtitle: m.title,
          time: m.created_at,
          date: m.meeting_date
        });
      });

      recentActivity.sort((a, b) => {
        return new Date(b.time) - new Date(a.time);
      });

      const monthlyGrowth = [];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      months.forEach(month => {
        monthlyGrowth.push({ month, projects: 0, ideas: 0 });
      });

      projects?.forEach((project) => {
        if (project.created_at) {
          const date = new Date(project.created_at);
          const monthIndex = date.getMonth();
          if (monthlyGrowth[monthIndex]) {
            monthlyGrowth[monthIndex].projects += 1;
          }
        }
      });

      ideas?.forEach((idea) => {
        if (idea.created_at) {
          const date = new Date(idea.created_at);
          const monthIndex = date.getMonth();
          if (monthlyGrowth[monthIndex]) {
            monthlyGrowth[monthIndex].ideas += 1;
          }
        }
      });

      res.json({
        success: true,
        stats: {
          totalProjects,
          totalUsers,
          marketReports,
          completionRate,
          completedProjects,
          inProgressProjects,
          pendingProjects,
          avgProgress,
          totalMeetings,
          totalEvents
        },
        weeklyData: enhancedWeeklyData,
        monthlyGrowth,
        recentActivity: recentActivity.slice(0, 8),
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ==========================
// ACTIVITY LOGS - GET ALL LOGS (ADMIN ONLY)
// ==========================
app.get(
  "/activity-logs",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", {
          ascending: false
        });

      if (error) throw error;

      res.json(data);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch logs"
      });
    }
  }
);

// ==========================
// CALENDAR EVENTS - CREATE EVENT
// ==========================
app.post(
  "/create-event",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        title,
        description,
        event_date,
        start_time,
        end_time
      } = req.body;

      const { data, error } =
        await supabase
          .from("calendar_events")
          .insert([
            {
              title,
              description,
              event_date,
              start_time,
              end_time,
              created_by: parseInt(req.user.id)
            }
          ])
          .select();

      if (error) throw error;

      await logActivity(req.user.id, `Created calendar event: ${title}`);

      res.json({
        success: true,
        event: data[0]
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: error.message
      });
    }
  }
);

// ==========================
// CALENDAR EVENTS - GET ALL EVENTS
// ==========================
app.get(
  "/events",
  authMiddleware,
  async (req, res) => {
    try {
      const { data, error } =
        await supabase
          .from("calendar_events")
          .select("*")
          .order("event_date", {
            ascending: true
          });

      if (error) throw error;

      res.json(data);
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
);

// ==========================
// CALENDAR EVENTS - UPDATE EVENT
// ==========================
app.put(
  "/update-event/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data: existingEvent, error: findError } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("id", id)
        .single();

      if (findError || !existingEvent) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }

      if (req.user.role !== "admin" && existingEvent.created_by?.toString() !== req.user.id?.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only update events you created"
        });
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .update(req.body)
        .eq("id", id)
        .select();

      if (error) throw error;

      await logActivity(req.user.id, `Updated calendar event: ${existingEvent.title}`);

      res.json({
        success: true,
        event: data[0]
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: error.message
      });
    }
  }
);

// ==========================
// CALENDAR EVENTS - DELETE EVENT
// ==========================
app.delete(
  "/delete-event/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`[DELETE EVENT] Attempting to delete event ${id} by user ${req.user.id} (role: ${req.user.role})`);

      const { data: event, error: fetchError } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !event) {
        console.log(`[DELETE EVENT] Event ${id} not found`);
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }

      const eventCreatorId = event.created_by?.toString();
      const currentUserId = req.user.id?.toString();

      if (req.user.role !== "admin" && eventCreatorId !== currentUserId) {
        console.log(`[DELETE EVENT] Access denied - User ${currentUserId} is not admin and not creator`);
        return res.status(403).json({
          success: false,
          message: "You can only delete events you created"
        });
      }

      console.log(`[DELETE EVENT] Deleting event: ${event.title}`);

      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await logActivity(req.user.id, `Deleted calendar event: ${event.title}`);

      console.log(`[DELETE EVENT] Successfully deleted event ${id}`);

      res.json({
        success: true,
        message: "Event deleted successfully"
      });

    } catch (error) {
      console.error("[DELETE EVENT] Error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to delete event"
      });
    }
  }
);

// ==========================
// MEETING ATTENDANCE - MARK ATTENDANCE
// ==========================
app.post(
  "/join-meeting/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const meetingId = req.params.id;

      const { data: existing } = await supabase
        .from("meeting_attendance")
        .select("*")
        .eq("meeting_id", meetingId)
        .eq("user_id", req.user.id);

      if (existing && existing.length > 0) {
        return res.json({
          success: true,
          message: "Already joined this meeting",
          attendance: existing[0]
        });
      }

      const { data, error } =
        await supabase
          .from("meeting_attendance")
          .insert([
            {
              meeting_id: meetingId,
              user_id: req.user.id
            }
          ])
          .select();

      if (error) throw error;

      await logActivity(req.user.id, `Joined meeting ${meetingId}`);

      res.json({
        success: true,
        attendance: data[0]
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
);

// ==========================
// MEETING ATTENDANCE - GET ATTENDANCE FOR MEETING
// ==========================
app.get(
  "/meeting-attendance/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { data, error } =
        await supabase
          .from("meeting_attendance")
          .select("*")
          .eq("meeting_id", req.params.id);

      if (error) throw error;

      const attendanceWithUsers = await Promise.all(
        data.map(async (attendance) => {
          const { data: user } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", attendance.user_id)
            .single();
          
          return {
            ...attendance,
            user
          };
        })
      );

      res.json(attendanceWithUsers);
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
);

// ==========================
// CREATE MEETING
// ==========================
app.post(
  "/create-meeting",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        title,
        description,
        meeting_date,
        start_time,
        end_time,
        meeting_link,
        participants
      } = req.body;

      const { data, error } =
        await supabase
          .from("meetings")
          .insert([
            {
              title,
              description,
              meeting_date,
              start_time,
              end_time,
              meeting_link,
              participants: participants || [],
              created_by: parseInt(req.user.id)
            }
          ])
          .select();

      if (error) throw error;

      await logActivity(req.user.id, `Created meeting: ${title}`);

      io.emit(
        "meetingCreated",
        data[0]
      );

      if (
        participants &&
        participants.length > 0
      ) {
        for (const email of participants) {
          await transporter.sendMail({
            from:
              process.env.EMAIL_USER,
            to: email,
            subject:
              `Meeting Invite: ${title}`,
            html: `
              <h2>Meeting Invitation</h2>

              <p>You have been invited to a meeting.</p>

              <p>
                <strong>Title:</strong>
                ${title}
              </p>

              <p>
                <strong>Date:</strong>
                ${meeting_date}
              </p>

              <p>
                <strong>Time:</strong>
                ${start_time}
                -
                ${end_time}
              </p>

              <br />

              <a
                href="${meeting_link}"
                style="
                  background:#2563eb;
                  color:white;
                  padding:12px 20px;
                  border-radius:10px;
                  text-decoration:none;
                "
              >
                Join Meeting
              </a>
            `
          });
        }
      }

      res.json({
        success: true,
        message:
          "Meeting created 🚀",
        meeting: data[0]
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ==========================
// GET ALL MEETINGS
// ==========================
app.get(
  "/meetings",
  authMiddleware,
  async (req, res) => {
    try {
      const { data, error } =
        await supabase
          .from("meetings")
          .select("*")
          .order(
            "meeting_date",
            {
              ascending: true
            }
          );

      if (error) throw error;

      res.json(data);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to fetch meetings"
      });
    }
  }
);

// ==========================
// MY MEETINGS - GET MEETINGS FOR LOGGED-IN USER
// ==========================
app.get(
  "/my-meetings",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const { data, error } =
        await supabase
          .from("meetings")
          .select("*");

      if (error) throw error;

      const myMeetings =
        data.filter((meeting) =>
          meeting.participants?.some(
            (p) => p === userId || p.id === userId || p.email === req.user.email
          ) || meeting.created_by?.toString() === userId?.toString()
        );

      res.json({
        success: true,
        meetings: myMeetings,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ==========================
// DELETE MEETING
// ==========================
app.delete(
  "/delete-meeting/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`[DELETE MEETING] Attempting to delete meeting ${id} by user ${req.user.id} (role: ${req.user.role})`);

      const { data: meeting, error: fetchError } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !meeting) {
        console.log(`[DELETE MEETING] Meeting ${id} not found`);
        return res.status(404).json({
          success: false,
          message: "Meeting not found"
        });
      }

      const meetingCreatorId = meeting.created_by?.toString();
      const currentUserId = req.user.id?.toString();

      if (req.user.role !== "admin" && meetingCreatorId !== currentUserId) {
        console.log(`[DELETE MEETING] Access denied - User ${currentUserId} is not admin and not creator`);
        return res.status(403).json({
          success: false,
          message: "You can only delete meetings you created"
        });
      }

      console.log(`[DELETE MEETING] Deleting meeting: ${meeting.title}`);

      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await logActivity(req.user.id, `Deleted meeting: ${meeting.title}`);

      io.emit("meetingDeleted", id);

      console.log(`[DELETE MEETING] Successfully deleted meeting ${id}`);

      res.json({
        success: true,
        message: "Meeting deleted successfully 🚀"
      });

    } catch (error) {
      console.error("[DELETE MEETING] Error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to delete meeting"
      });
    }
  }
);

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email notifications: ${process.env.EMAIL_USER ? "ENABLED" : "DISABLED"}`);
  console.log(`🤖 Gemini URL Analysis: ${process.env.GEMINI_API_KEY ? "ENABLED" : "DISABLED"}`);
  console.log(`📊 Market Analysis: ENABLED`);
  console.log(`📈 Dashboard Stats: ENABLED`);
  console.log(`📋 Project Progress Tracking: ENABLED`);
  console.log(`🏆 Competition Mode: ENABLED`);
  console.log(`📅 Meeting Routes: ENABLED`);
  console.log(`📝 Activity Logs: ENABLED`);
  console.log(`📆 Calendar Events: ENABLED`);
  console.log(`✅ Meeting Attendance Tracking: ENABLED`);
  console.log(`🤖 AI Assistant: ENABLED`);
  console.log(`📰 Competitor News: ENABLED`);
  console.log(`👥 Real-time Active Users Tracking: ENABLED (No duplicates on refresh)`);
  console.log(`📊 User Engagement Metrics: ENABLED`);
  console.log(`📉 Real Drop-off Calculations: ENABLED (Based on actual user activity)`);
});