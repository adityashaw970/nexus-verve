// ==== Enhanced server.js - Optimized for 500+ concurrent users on Render Free Tier ====
require("dotenv").config();

const cluster = require("cluster");
const os = require("os");

// CRITICAL: Limit workers for free tier (512MB RAM)
const WORKERS = Math.min(2, os.cpus().length);

if (cluster.isPrimary) {
  // console.log(`Primary ${process.pid} running`);

  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    // console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });

  return;
}

// ================== WORKER PROCESS ==================

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jwt-simple");
const cron = require("node-cron");
const moment = require("moment-timezone");

const { Server } = require("socket.io");

const Redis = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");

// ===== MODELS =====
const userModel = require("./models/user");
const quizResultModel = require("./models/quizResult");
const roundResultModel = require("./models/roundResult");
const Question = require("./models/question");
const RoundConfig = require("./models/roundConfig");

// ================= SERVER =================

const app = express();
const server = http.createServer(app);

// ===== SOCKET.IO - WEBSOCKET ONLY (NO POLLING) =====

const io = new Server(server, {
  transports: ["websocket"], // Critical: No polling!
  pingInterval: 30000,
  pingTimeout: 70000,
  maxHttpBufferSize: 300000, // 300KB limit
  perMessageDeflate: {
    threshold: 1024 // Only compress > 1KB
  },
  connectTimeout: 45000,
  allowEIO3: true,
  cookie: false,
});

// ================= REDIS ADAPTER =================

const pubClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// ================= MIDDLEWARE =================

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "512kb" })); // Reduced from 1MB
app.use(cookieParser());
app.use(helmet());

const JWT_SECRET = process.env.JWT_SECRET || "shhh";

// ================= MEMORY OPTIMIZATION =================

const configCache = new Map();
const userScoreCache = new Map(); // In-memory cache for quick score access
const socketLastSeen = new Map(); // Track socket activity

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  
  // Clear inactive sockets (2 min idle)
  for (const [id, time] of socketLastSeen) {
    if (now - time > 120000) {
      socketLastSeen.delete(id);
    }
  }
  
  // Soft garbage collection if available
  if (global.gc) global.gc();
}, 60000);

// ================= QUIZ STATE =================

let currentRound = null;
let currentQuestionIndex = 0;
let quizActive = false;
let questionTimer = null;
let scheduledJobs = [];

// ================= HELPER FUNCTIONS =================

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWord(sentence, word) {
  if (!word || !sentence) return false;
  const safeWord = escapeRegex(word.toLowerCase());
  const regex = new RegExp(`\\b${safeWord}\\b`, "i");
  return regex.test(sentence.toLowerCase());
}

async function getRoundConfig(round) {
  if (configCache.has(round)) return configCache.get(round);
  
  const config = await RoundConfig.findOne({ round }).lean();
  if (config) configCache.set(round, config);
  
  return config;
}

// ================= QUIZ FLOW =================

async function startQuiz(round) {
  // Prevent duplicate starts
  if (quizActive && currentRound === round) {
    console.log(`Quiz already running for Round ${round}`);
    return;
  }

  // Clear existing timer
  if (questionTimer) {
    clearTimeout(questionTimer);
    questionTimer = null;
  }

  const config = await getRoundConfig(round);
  if (!config) {
    console.error(`Round ${round} configuration not found`);
    return;
  }

  quizActive = true;
  currentRound = round;
  currentQuestionIndex = 0;

  // console.log(`Starting ${config.name} - Worker ${process.pid}`);
  
  sendQuestion(config);
}

async function sendQuestion(config) {
  // Clear existing timer
  if (questionTimer) {
    clearTimeout(questionTimer);
    questionTimer = null;
  }

  // Check if quiz complete
  if (currentQuestionIndex >= config.totalQuestions) {
    io.emit("quiz-end", { round: currentRound });
    quizActive = false;
    currentRound = null;
    currentQuestionIndex = 0;
    console.log(`Quiz ended for ${config.name}`);
    return;
  }

  try {
    // Fetch single question (not all)
    const question = await Question.findOne({
      round: currentRound,
      order: currentQuestionIndex
    }).lean();

    if (!question) {
      console.error(`Question not found: Round ${currentRound}, Index ${currentQuestionIndex}`);
      return;
    }

    // Emit to all clients
    io.emit("question", {
      question: question.question,
      index: currentQuestionIndex,
      round: currentRound,
      roundName: config.name,
      totalQuestions: config.totalQuestions,
    });

    console.log(`Sent Q${currentQuestionIndex + 1}/${config.totalQuestions} - ${config.name}`);

    // Schedule next question
    questionTimer = setTimeout(() => {
      currentQuestionIndex++;
      sendQuestion(config);
    }, config.questionTime);

  } catch (error) {
    console.error("Error processing question:", error);
    io.emit("quiz-end", { round: currentRound });
    quizActive = false;
    currentRound = null;
    currentQuestionIndex = 0;
  }
}

// ================= SOCKET HANDLER =================

io.on("connection", (socket) => {
  socketLastSeen.set(socket.id, Date.now());

  // Heartbeat to track active connections
  socket.on("heartbeat", () => {
    socketLastSeen.set(socket.id, Date.now());
  });

  // Send current state to new connections
  socket.on("get-initial", async () => {
    if (!quizActive) return;

    const config = await getRoundConfig(currentRound);
    
    socket.emit("question", {
      index: currentQuestionIndex,
      round: currentRound,
      roundName: config?.name || `Round ${currentRound}`,
      totalQuestions: config?.totalQuestions || 0,
    });
  });

  // ================= ANSWER SUBMISSION =================

  socket.on("answer", async ({ userId, answer, questionIndex }) => {
    try {
      // Validation
      if (!userId || typeof userId !== "string") {
        return socket.emit("error", { message: "Invalid userId" });
      }

      if (!Array.isArray(answer) || answer.length !== 1) {
        return socket.emit("error", { message: "Answer must be an array with one element" });
      }

      if (!quizActive || !currentRound) {
        return socket.emit("error", { message: "No active quiz" });
      }

      // Fetch question
      const config = await getRoundConfig(currentRound);
      
      const question = await Question.findOne({
        round: currentRound,
        order: questionIndex
      }).lean();

      if (!question) {
        return socket.emit("error", { message: "Invalid question" });
      }

      // Check answer
      const correctAnswer = question.answer.toLowerCase().trim();
      const userAnswer = answer[0].toLowerCase().trim();
      const isCorrect = containsWord(correctAnswer, userAnswer);

      // ===== IN-MEMORY SCORE CACHE (Fast Response) =====
      
      let cached = userScoreCache.get(userId) || {
        totalScore: 0,
        attempted: 0,
        rounds: new Set()
      };

      if (isCorrect) {
        cached.totalScore += config.scoreMultiplier;
      }

      cached.attempted++;
      cached.rounds.add(currentRound);
      
      userScoreCache.set(userId, cached);

      // ===== REDIS LEADERBOARD (Async, Non-Blocking) =====
      
      if (isCorrect) {
        pubClient.zincrby("leaderboard", config.scoreMultiplier, userId).catch(err => {
          console.error("Redis leaderboard update failed:", err);
        });
      }

      // ===== RESPOND IMMEDIATELY (Don't wait for DB) =====
      
      socket.emit("score-update", {
        isCorrect,
        totalScore: cached.totalScore,
        roundScore: cached.totalScore, // Simplified
        currentRound: currentRound,
        correctAnswer: question.answer,
      });

      // ===== DATABASE UPDATE (Async, Background) =====
      
      setImmediate(async () => {
        try {
          const userObjId = new mongoose.Types.ObjectId(userId);
          
          // Update round result
          let roundUpdate = await roundResultModel.findOne({
            userId: userObjId,
            round: currentRound
          });

          if (!roundUpdate) {
            try {
              roundUpdate = await roundResultModel.create({
                userId: userObjId,
                round: currentRound,
                score: isCorrect ? config.scoreMultiplier : 0,
                attemptedQuestions: [questionIndex]
              });
            } catch (createError) {
              if (createError.code === 11000) {
                roundUpdate = await roundResultModel.findOne({
                  userId: userObjId,
                  round: currentRound
                });
              }
            }
          } else if (!roundUpdate.attemptedQuestions.includes(questionIndex)) {
            if (isCorrect) roundUpdate.score += config.scoreMultiplier;
            roundUpdate.attemptedQuestions.push(questionIndex);
            await roundUpdate.save();
          }

          // Update total score
          const allRounds = await roundResultModel.find({ userId: userObjId }).lean();
          
          let totalScore = 0;
          let totalAttempted = 0;
          let roundsCompleted = [];

          allRounds.forEach(r => {
            totalScore += r.score || 0;
            totalAttempted += r.attemptedQuestions?.length || 0;
            if (!roundsCompleted.includes(r.round)) {
              roundsCompleted.push(r.round);
            }
          });

          await quizResultModel.findOneAndUpdate(
            { userId: userObjId },
            { totalScore, totalAttemptedQuestions: totalAttempted, roundsCompleted },
            { upsert: true }
          );

        } catch (dbErr) {
          console.error("Background DB update failed:", dbErr);
        }
      });

    } catch (err) {
      console.error("Answer processing error:", err);
      socket.emit("error", { message: "Failed to process answer" });
    }
  });

  socket.on("disconnect", () => {
    socketLastSeen.delete(socket.id);
  });
});

// ================= EXPRESS ROUTES =================

app.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    const existingUser = await userModel.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).send("User already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.encode(
      { email: user.email, id: user._id, username: user.username },
      JWT_SECRET
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    
    res.send("Registered successfully");
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).send("Registration failed");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await userModel.findOne({ username }).lean();
    if (!user) {
      return res.status(400).send("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send("Incorrect password");
    }

    const token = jwt.encode(
      { email: user.email, id: user._id, username: user.username },
      JWT_SECRET
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    
    res.status(200).send("Login successful");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login failed");
  }
});

app.get("/auth/status", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ loggedIn: false });

  try {
    const user = jwt.decode(token, JWT_SECRET);
    res.json({ loggedIn: true, user });
  } catch {
    res.json({ loggedIn: false });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.status(200).send("Logged out successfully");
});

// ===== LEADERBOARD (Redis-First, DB Fallback) =====

app.get("/leaderboard", async (req, res) => {
  try {
    // Use DB directly - most reliable for leaderboard
    const results = await quizResultModel
      .find()
      .sort({ totalScore: -1, createdAt: 1 })
      .populate("userId", "username email")
      .limit(100)
      .lean();

    // Format response to match expected structure
    const formattedResults = results.map(result => ({
      _id: result._id,
      userId: result.userId || { username: "Unknown User", email: "" },
      totalScore: result.totalScore || 0
    }));

    res.json(formattedResults);
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res.status(500).json([]);
  }
});

app.get("/get-user-score/", async (req, res) => {
  try {
    const token = req.cookies.token;
    const requestedRound = req.query.round ? parseInt(req.query.round) : null;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = jwt.decode(token, JWT_SECRET);

    if (requestedRound) {
      const roundScore = await roundResultModel.findOne({
        userId: user.id,
        round: requestedRound,
      }).lean();

      const config = await getRoundConfig(requestedRound);

      res.json({
        round: requestedRound,
        roundName: config?.name || `Round ${requestedRound}`,
        score: roundScore?.score || 0,
        totalQuestions: config?.totalQuestions || 0,
        questionAttempt: roundScore?.attemptedQuestions?.length || 0,
        scoreMultiplier: config?.scoreMultiplier || 1,
      });
    } else {
      const totalRecord = await quizResultModel.findOne({ userId: user.id }).lean();

      res.json({
        totalScore: totalRecord?.totalScore || 0,
        totalAttempted: totalRecord?.totalAttemptedQuestions || 0,
        roundsCompleted: totalRecord?.roundsCompleted || [],
        totalRounds: configCache.size,
      });
    }
  } catch (err) {
    console.error("Get user score error:", err);
    res.status(500).json({ error: "Failed to fetch score" });
  }
});

app.get("/round-results/:round", async (req, res) => {
  try {
    const round = parseInt(req.params.round);
    const config = await getRoundConfig(round);
    
    const results = await roundResultModel
      .find({ round })
      .sort({ score: -1, createdAt: 1 })
      .populate("userId", "username email")
      .limit(10)
      .lean();

    res.json({
      round,
      roundName: config?.name || `Round ${round}`,
      results,
    });
  } catch (err) {
    console.error("Round results fetch error:", err);
    res.status(500).send("Failed to fetch round results");
  }
});

// ================= MONGO CONNECTION =================

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 20,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000,
  compressors: ['zlib'],
}).then(async () => {
  console.log(`✅ MongoDB Connected - Worker ${process.pid}`);
  
  // Load configs into cache
  const configs = await RoundConfig.find().lean();
  configs.forEach(config => {
    configCache.set(config.round, config);
  });
  
  // Schedule quizzes
  scheduleQuizzes();
  
}).catch((err) => console.error("❌ MongoDB connection error:", err));

// ================= QUIZ SCHEDULING =================

async function scheduleQuizzes() {
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];

  const configs = await RoundConfig.find().lean();
  
  configs.forEach((config) => {
    const job = cron.schedule(
      config.startTime,
      () => {
        // console.log(`[Auto Start] ${config.name}`);
        startQuiz(config.round);
      },
      { timezone: "Asia/Kolkata" }
    );

    scheduledJobs.push(job);
    console.log(`✅ Scheduled ${config.name} - ${config.startTime}`);
  });
}

// ================= GRACEFUL SHUTDOWN =================

process.on("SIGTERM", async () => {
  // console.log(`Worker ${process.pid} shutting down...`);
  
  if (questionTimer) clearTimeout(questionTimer);
  scheduledJobs.forEach(job => job.stop());
  
  await pubClient.quit();
  await subClient.quit();

  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  // console.log(`✅ Worker ${process.pid} listening on port ${PORT}`);
});