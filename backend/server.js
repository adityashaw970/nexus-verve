// ==== server.js ====
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const userModel = require("./models/user");
const quizResultModel = require("./models/quizResult");
const roundResultModel = require("./models/roundResult");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});
const helmet = require("helmet");
const { configDotenv } = require("dotenv");
app.use(helmet());
const JWT_SECRET = "shhh";
dotenv.config();

const QUIZ_CONFIG = {
  1: {
    name: "Round 1",
    scoreMultiplier: 1,
    questionTime: 30000, // 30 seconds
    startTime: "30 01 * * *",
    questions: [
      // ===== Round 1 - Set 1 =====
      { day: "Day 1", round: "Round 1", set: 1, question: "What is the Japanese term for animation, often characterized by colorful artwork, fantastical themes, and vibrant characters?", answer: "Anime" },
      { day: "Day 1", round: "Round 1", set: 1, question: "In which popular Nintendo franchise do players battle in various arenas using characters like Mario, Link, and Pikachu?", answer: "Super Smash Bros" },
      { day: "Day 1", round: "Round 1", set: 1, question: "What is the name of the iconic Japanese media franchise created by Satoshi Tajiri in 1996, featuring special creatures that can be tamed and trained?", answer: "Pokemon" },
      { day: "Day 1", round: "Round 1", set: 1, question: "This device used in the Pokémon series is an electronic encyclopedia of all types of Pokémon, vital for new trainers.", answer: "Pokedex" },
      { day: "Day 1", round: "Round 1", set: 1, question: "Who is the iconic protagonist of the Pokémon anime series, known for his dream of becoming a Pokémon Master and his bond with his partner Pikachu?", answer: "Ash Ketchum" },

      // ===== Round 1 - Set 2 =====
      { day: "Day 1", round: "Round 1", set: 2, question: "What is the term for a player who is primarily responsible for scoring runs and defending the wicket in the game of cricket?", answer: "Batsman" },
      { day: "Day 1", round: "Round 1", set: 2, question: "What is the prestigious annual cricket event, where the best players from various franchises compete, and has become immensely popular in India since its inception in 2008?", answer: "IPL / Indian Premier League" },
      { day: "Day 1", round: "Round 1", set: 2, question: "Which Indian city, known for its vibrant culture and as a major IT hub, is home to a top IPL team and has a significant cricket following?", answer: "Bangalore" },
      { day: "Day 1", round: "Round 1", set: 2, question: "This person got married to a famous celebrity in December of 2017. Which famous celebrity did he get married to from the world of Bollywood?", answer: "Anushka Sharma" },
      { day: "Day 1", round: "Round 1", set: 2, question: "Who is this prolific Indian cricketer, renowned for his batting prowess, passionate playing style, and arguably the best test captain India has ever produced?", answer: "Virat Kohli" },

      // ===== Round 1 - Set 3 =====
      { day: "Day 1", round: "Round 1", set: 3, question: "It is a majestic marble building built between 1906 and 1921. It was dedicated to the memory of the Empress of England of that time. It is also a symbol of love and culture.", answer: "Victoria Memorial" },
      { day: "Day 1", round: "Round 1", set: 3, question: "It is an iconic cantilever bridge connecting two cities. It is also named to honor the famous Bengali poet. It is one of the busiest bridges in the world standing on two main pillars.", answer: "Howrah Bridge" },
      { day: "Day 1", round: "Round 1", set: 3, question: "The oldest and the largest museum in India and Asia, housing an extensive collection of art, archeology and natural history exhibits. It was founded in 1814 at the cradle of the Asiatic Society of Bengal.", answer: "Indian Museum" },
      { day: "Day 1", round: "Round 1", set: 3, question: "A vibrant street known for its restaurants, cafes, and nightlife offering a mix of colonial-era buildings and modern establishments. In some specific festive seasons it transforms into a dazzling spectacle with vibrant decorations.", answer: "Park Street" },
      { day: "Day 1", round: "Round 1", set: 3, question: "Which city was the capital of British India before Delhi?", answer: "Kolkata" },
    ]
  },

  2: {
    name: "Round 2",
    scoreMultiplier: 2,
    questionTime: 40000, // 40 seconds
    startTime: "06 19 * * *",
    questions: [
      // ===== Round 2 - Set 1 =====
      { day: "Day 2", round: "Round 2", set: 1, question: "In the UK, the book is known as 'Harry Potter and the Philosopher's Stone.' What was the U.S. title?", answer: "Harry Potter and the Sorcerer’s Stone" },
      { day: "Day 2", round: "Round 2", set: 1, question: "J.K. Rowling conceived the idea for a famous character while on a delayed train in 1990. Who was that character?", answer: "Harry Potter" },
      { day: "Day 2", round: "Round 2", set: 1, question: "The original UK cover art was illustrated by a 23-year-old English artist. Who was he?", answer: "Thomas Taylor" },
      { day: "Day 2", round: "Round 2", set: 1, question: "Which real historical figure, known for alchemy, appears as a character in the book?", answer: "Nicolas Flamel" },
      { day: "Day 2", round: "Round 2", set: 1, question: "This book sold over 120 million copies worldwide — what is its title?", answer: "Harry Potter and the Sorcerer’s Stone" },

      // ===== Round 2 - Set 2 =====
      { day: "Day 2", round: "Round 2", set: 2, question: "What is the term for a genre of ancient Indian texts that contain myths, legends, and historical narratives?", answer: "Purana" },
      { day: "Day 2", round: "Round 2", set: 2, question: "A thief who became a sage through chanting god's name — who is he?", answer: "Valmiki" },
      { day: "Day 2", round: "Round 2", set: 2, question: "Who is the greatest devotee of Lord Shiva known for intelligence and cunning?", answer: "Ravan" },
      { day: "Day 2", round: "Round 2", set: 2, question: "What is the tear-shaped island nation located south of India?", answer: "Sri Lanka" },
      { day: "Day 2", round: "Round 2", set: 2, question: "Which epic tells the story of Lord Rama and teaches duty and devotion?", answer: "Ramayan" },

      // ===== Round 2 - Set 3 =====
      { day: "Day 2", round: "Round 2", set: 3, question: "They work with fabrics and garments using sewing machines. Who are they?", answer: "Tailor" },
      { day: "Day 2", round: "Round 2", set: 3, question: "This car was first introduced in India in 2005 and became a bestseller. Name it.", answer: "Swift" },
      { day: "Day 2", round: "Round 2", set: 3, question: "This area often refers to intergalactic or interstellar emptiness. What is it called?", answer: "Blank Space" },
      { day: "Day 2", round: "Round 2", set: 3, question: "The country bordered by Canada and Mexico, consisting of 50 states and Washington, D.C.?", answer: "United States of America" },
      { day: "Day 2", round: "Round 2", set: 3, question: "American singer-songwriter born in 1989, known for country and pop hits. Who is she?", answer: "Taylor Swift" },
    ]
  },

  3: {
    name: "Round 3",
    scoreMultiplier: 3,
    questionTime: 60000, // 60 seconds
    startTime: "35 02 * * *",
    questions: [
      // ===== Round 3 - Set 1 =====
      { day: "Day 3", round: "Round 3", set: 1, question: "Which country is known as 'The Land of the Rising Sun'?", answer: "Japan" },
      { day: "Day 3", round: "Round 3", set: 1, question: "An American singer, songwriter, dancer, and cultural icon who debuted at age six in 1964. Who is he?", answer: "Michael Jackson" },
      { day: "Day 3", round: "Round 3", set: 1, question: "A large fortified building serving as a royal residence in medieval times. What is it?", answer: "Castle" },
      { day: "Day 3", round: "Round 3", set: 1, question: "A supernatural malevolent being believed to influence humans — what is it called?", answer: "Demon" },
      { day: "Day 3", round: "Round 3", set: 1, question: "A warrior group from an anime hunting demons to avenge their family — name the anime.", answer: "Demon Slayer" },

      // ===== Round 3 - Set 2 =====
      { day: "Day 3", round: "Round 3", set: 2, question: "What is the common nickname for a device used to lift heavy objects, especially vehicles?", answer: "Jack" },
      { day: "Day 3", round: "Round 3", set: 2, question: "What is the term for a large watercraft designed to transport people or goods?", answer: "Ship" },
      { day: "Day 3", round: "Round 3", set: 2, question: "What term describes a state of armed conflict between countries or groups?", answer: "War" },
      { day: "Day 3", round: "Round 3", set: 2, question: "What small, common bird known for chirping belongs to the family Passeridae?", answer: "Sparrow" },
      { day: "Day 3", round: "Round 3", set: 2, question: "Who is the witty pirate known for saying 'Why is the rum always gone?'", answer: "Jack Sparrow" },

      // ===== Round 3 - Set 3 =====
      { day: "Day 3", round: "Round 3", set: 3, question: "An affectionate term for a rabbit, especially a young or cute one.", answer: "Bunny" },
      { day: "Day 3", round: "Round 3", set: 3, question: "The fibrous material that makes up tree trunks and branches.", answer: "Wood" },
      { day: "Day 3", round: "Round 3", set: 3, question: "The reproductive structure of flowering plants.", answer: "Flower" },
      { day: "Day 3", round: "Round 3", set: 3, question: "A central character in the Mahabharata known for his archery skills and bravery.", answer: "Arjun" },
      { day: "Day 3", round: "Round 3", set: 3, question: "Which 2021 Telugu action-drama film revolves around red sandalwood smuggling?", answer: "Pushpa" },
    ]
  },

  4: {
    name: "Bonus Round",
    scoreMultiplier: 5,
    questionTime: 60000, // 60 seconds
    startTime: "35 03 * * *",
    questions: [
      // ===== Bonus Round - Set 1 =====
      { day: "Day 4", round: "Bonus Round", set: 1, question: "I can recognize faces in your phone’s photo, and tell who is who wherever you go.", answer: "Face Recognition" },
      { day: "Day 4", round: "Bonus Round", set: 1, question: "I can translate words from one language to another, helping people understand one another.", answer: "Translator" },
      { day: "Day 4", round: "Bonus Round", set: 1, question: "I learn from data and get smarter each day, predicting things in a clever way.", answer: "Machine Learning" },
      { day: "Day 4", round: "Bonus Round", set: 1, question: "I can chat, answer questions, or tell you a joke — sometimes my answers make humans go 'whoa!'", answer: "Chatbot" },
      { day: "Day 4", round: "Bonus Round", set: 1, question: "I am the technology behind all these things, learning, predicting, and making life zing. What am I?", answer: "AI" },

      // ===== Bonus Round - Set 2 =====
      { day: "Day 4", round: "Bonus Round", set: 2, question: "I am a delicious dish with cheese and tomato, everyone loves me, even the bravest bravado.", answer: "Pizza" },
      { day: "Day 4", round: "Bonus Round", set: 2, question: "I am a famous tower that leans to one side, tourists take photos here with pride.", answer: "Leaning Tower of Pisa" },
      { day: "Day 4", round: "Bonus Round", set: 2, question: "I am a city of canals and gondolas too, a romantic place where you can float through.", answer: "Venice" },
      { day: "Day 4", round: "Bonus Round", set: 2, question: "I am a city with the Colosseum tall, gladiators once fought within my walls.", answer: "Rome" },
      { day: "Day 4", round: "Bonus Round", set: 2, question: "I’m the country of pizza, towers, and art, with canals and ruins that capture the heart. Which country am I?", answer: "Italy" },
    ]
  }
};

// Current quiz state
let currentRound = null;
let currentQuestionIndex = 0;
let currentQuestion = null;
let quizActive = false;
let connectedUsers = new Set();

// Generic Quiz Starter
const startQuiz = (roundNumber) => {
  const config = QUIZ_CONFIG[roundNumber];
  if (!config) {
    console.error(`Round ${roundNumber} configuration not found`);
    return;
  }

  currentRound = roundNumber;
  currentQuestionIndex = 0;

  console.log(
    `Starting ${config.name} with ${config.questions.length} questions`
  );

  processNextQuestion(config);
};

const processNextQuestion = (config) => {
  if (currentQuestionIndex >= config.questions.length) {
    // Quiz ended
    io.emit("quiz-end", { round: currentRound });
    currentQuestion = null;
    quizActive = false;
    currentQuestionIndex = 0;
    currentRound = null;
    return;
  }

  currentQuestion = {
    ...config.questions[currentQuestionIndex],
    roundNumber: currentRound,
    roundName: config.name,
  };
  quizActive = true;

  io.emit("question", {
    ...currentQuestion,
    index: currentQuestionIndex,
    totalQuestions: config.questions.length,
    round: currentRound,
    roundName: config.name,
    scoreMultiplier: config.scoreMultiplier,
  });

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < config.questions.length) {
      processNextQuestion(config);
    } else {
      io.emit("quiz-end", { round: currentRound });
      currentQuestion = null;
      quizActive = false;
      currentQuestionIndex = 0;
      currentRound = null;
    }
  }, config.questionTime);
};

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  connectedUsers.add(socket.id);

  // Handle initial connection
  socket.on("get-initial", () => {
    if (currentQuestion !== null && quizActive) {
      const config = QUIZ_CONFIG[currentRound];
      socket.emit("question", {
        ...currentQuestion,
        index: currentQuestionIndex,
        totalQuestions: config.questions.length,
        round: currentRound,
        roundName: config.name,
        scoreMultiplier: config.scoreMultiplier,
      });
    }
  });

  socket.on("answer", async ({ answer, userId, questionIndex }) => {
    try {
      // Validate input
      if (!userId || typeof userId !== "string") {
        socket.emit("error", { message: "Invalid userId" });
        return;
      }

      if (!Array.isArray(answer) || answer.length !== 1) {
        socket.emit("error", {
          message: "Answer must be an array with exactly one element",
        });
        return;
      }

      // Get current round questions and validate
      if (!currentRound || !QUIZ_CONFIG[currentRound]) {
        socket.emit("error", { message: "No active quiz round" });
        return;
      }

      const config = QUIZ_CONFIG[currentRound];
      const quiz = config.questions;

      // Validate question index
      if (questionIndex < 0 || questionIndex >= quiz.length) {
        socket.emit("error", { message: "Invalid question index" });
        return;
      }

      function containsWord(sentence, word) {
        if (
          !word ||
          !sentence ||
          word.trim() === "" ||
          sentence.trim() === ""
        ) {
          return false;
        }
        // Convert both to lowercase for case-insensitive comparison
        sentence = sentence.toLowerCase();
        word = word.toLowerCase();

        // Use RegExp to match exact word with word boundaries
        const regex = new RegExp(`\\b${word}\\b`, "i");
        return regex.test(sentence);
      }

      // === Handle Round Result First ===
      let roundRecord = await roundResultModel.findOne({
        userId,
        round: currentRound,
      });

      // Get the correct answer and user answer (first element of array)
      let correctAnswer = quiz[questionIndex].answer.toLowerCase().trim();
      let userAnswer = answer[0].toLowerCase().trim();
      const result = containsWord(correctAnswer, userAnswer);

      console.log("User Answer:", userAnswer);
      console.log("Correct Answer:", correctAnswer);
      console.log("Answer Check Result:", result);
      console.log("Question Index:", questionIndex);

      if (!roundRecord) {
        // Create new round record
        let roundScore = 0;

        // Award points if answer is correct
        if (result) {
          roundScore += config.scoreMultiplier;
        }

        console.log("Creating new round record with score:", roundScore);

        roundRecord = new roundResultModel({
          userId,
          round: currentRound,
          score: roundScore,
          attemptedQuestions: [questionIndex],
        });
      } else {
        // Update existing round record
        console.log("Existing round record found");
        console.log("Current score before update:", roundRecord.score);
        console.log(
          "Current attempted questions:",
          roundRecord.attemptedQuestions
        );

        // Check if question already attempted to prevent duplicates
        if (!roundRecord.attemptedQuestions.includes(questionIndex)) {
          // Award points if answer is correct
          if (result) {
            roundRecord.score += config.scoreMultiplier;
          }
          roundRecord.attemptedQuestions.push(questionIndex);
          console.log("Added new question to attempted list");
        } else {
          console.log("Question already attempted, no score change");
          // Don't add additional points for duplicate attempts
        }
      }

      await roundRecord.save();

      console.log("Final round score:", roundRecord.score);
      console.log("Final attempted questions:", roundRecord.attemptedQuestions);

      // === Handle Total Quiz Result ===
      let record = await quizResultModel.findOne({ userId });

      if (!record) {
        // Create new total record by calculating from all rounds
        const allRounds = await roundResultModel.find({ userId });
        const totalScore = allRounds.reduce((sum, r) => sum + r.score, 0);
        const totalAttempted = allRounds.reduce(
          (sum, r) => sum + r.attemptedQuestions.length,
          0
        );

        record = new quizResultModel({
          userId,
          totalScore: totalScore,
          totalAttemptedQuestions: totalAttempted,
          roundsCompleted: [currentRound],
        });
      } else {
        // Update total record by recalculating from all rounds
        const allRounds = await roundResultModel.find({ userId });
        record.totalScore = allRounds.reduce((sum, r) => sum + r.score, 0);
        record.totalAttemptedQuestions = allRounds.reduce(
          (sum, r) => sum + r.attemptedQuestions.length,
          0
        );

        // Add current round to completed rounds if not already there
        if (!record.roundsCompleted.includes(currentRound)) {
          record.roundsCompleted.push(currentRound);
        }
      }

      await record.save();

      console.log(
        "Sending score update - Total:",
        record.totalScore,
        "Round:",
        roundRecord.score
      );

      socket.emit("score-update", {
        totalScore: record.totalScore,
        roundScore: roundRecord.score,
        currentRound: currentRound,
        roundAttempted: roundRecord.attemptedQuestions.length,
        isCorrect: result,
        correctAnswer: quiz[questionIndex].answer,
      });
    } catch (err) {
      console.error("Score update error:", err);
      socket.emit("error", { message: "Failed to update score" });
    }
  });

  socket.on("quit-quiz", () => {
    connectedUsers.delete(socket.id);
  });

  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

mongoose.set("debug", true);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Authentication Routes
app.post("/register", async (req, res) => {
  try {
    let { email, username, password } = req.body;
    let existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).send("User already registered");

    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    let user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });
    let token = jwt.sign(
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
    let { username, password } = req.body;
    let user = await userModel.findOne({ username });
    if (!user) return res.status(400).send("User not found");

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send("Incorrect password");

    let token = jwt.sign(
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
  let token = req.cookies.token;
  if (!token) return res.json({ loggedIn: false });

  try {
    let user = jwt.verify(token, JWT_SECRET);
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

// Leaderboard Route
app.get("/leaderboard", async (req, res) => {
  try {
    const results = await quizResultModel
      .find()
      .sort({ totalScore: -1, createdAt: 1 })
      .populate("userId", "username email")
      .limit(100);

    res.json(results);
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res.status(500).send("Failed to fetch leaderboard");
  }
});

// User Score Route
app.get("/get-user-score/", async (req, res) => {
  const round = req.query.round;
  try {
    const token = req.cookies.token;
    const requestedRound = round ? parseInt(round) : null;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = jwt.verify(token, JWT_SECRET);

    if (requestedRound) {
      // Get specific round data
      const roundScore = await roundResultModel.findOne({
        userId: user.id,
        round: requestedRound,
      });

      const config = QUIZ_CONFIG[requestedRound];

      res.json({
        round: requestedRound,
        roundName: config?.name || `Round ${requestedRound}`,
        score: roundScore?.score || 0,
        totalQuestions: config?.questions?.length || 0,
        questionAttempt: roundScore?.attemptedQuestions?.length || 0,
        scoreMultiplier: config?.scoreMultiplier || 1,
      });
    } else {
      // Get total data
      const totalRecord = await quizResultModel.findOne({ userId: user.id });

      res.json({
        totalScore: totalRecord?.totalScore || 0,
        totalAttempted: totalRecord?.totalAttemptedQuestions || 0,
        roundsCompleted: totalRecord?.roundsCompleted || [],
        totalRounds: Object.keys(QUIZ_CONFIG).length,
      });
    }
  } catch (err) {
    console.error("Get user score error:", err);
    res.status(500).json({ error: "Failed to fetch score" });
  }
});

// Round Results Route
app.get("/round-results/:round", async (req, res) => {
  try {
    const round = parseInt(req.params.round);
    const results = await roundResultModel
      .find({ round })
      .sort({ score: -1, createdAt: 1 })
      .populate("userId", "username email")
      .limit(10);

    res.json({
      round,
      roundName: QUIZ_CONFIG[round]?.name || `Round ${round}`,
      results,
    });
  } catch (err) {
    console.error("Round results fetch error:", err);
    res.status(500).send("Failed to fetch round results");
  }
});

// Start Quiz Manually (for testing)
app.post("/start-quiz/:round", (req, res) => {
  const round = parseInt(req.params.round);
  if (QUIZ_CONFIG[round]) {
    startQuiz(round);
    res.json({ message: `${QUIZ_CONFIG[round].name} started successfully` });
  } else {
    res.status(400).json({ error: "Invalid round number" });
  }
});

console.log(process.env.PORT);

// Server Start
server.listen(process.env.PORT || 5000, () => {
  console.log("Server running on http://localhost:5000");
});

// Schedule All Rounds
Object.keys(QUIZ_CONFIG).forEach((roundNumber) => {
  const config = QUIZ_CONFIG[roundNumber];
  cron.schedule(config.startTime, () => {
    console.log(`Auto-starting ${config.name}`);
    startQuiz(parseInt(roundNumber));
  });
});
