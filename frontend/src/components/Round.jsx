/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";

const API_URL = "https://nexus-verve.onrender.com";

// Initialize socket connection - OPTIMIZED FOR 500+ USERS
const socket = io(API_URL, {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity, // Keep trying to reconnect
  reconnectionDelay: 1000, // Faster reconnection
  reconnectionDelayMax: 5000,
  transports: ["websocket"], // WebSocket only - no polling!
  timeout: 20000,
});

const Round = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [hasQuitted, setHasQuitted] = useState(false);
  const [questionAttempt, setQuestionAttempt] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundName, setRoundName] = useState("Round 1");
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [questionTime, setQuestionTime] = useState(45);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const questionTimerRef = useRef(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const MAX_TAB_SWITCHES = 5;
  const FALLBACK_QUESTIONS = {
    1: {
      1: [
        {
          order: 0,
          question:
            "What is the Japanese term for animation, often characterized by colorful artwork, fantastical themes, and vibrant characters?",
        },
        {
          order: 1,
          question:
            "In which popular Nintendo franchise do players battle in various arenas using characters like Mario, Link, and Pikachu?",
        },
        {
          order: 2,
          question:
            "What is the name of the iconic Japanese media franchise created by Satoshi Tajiri in 1996, featuring special creatures that can be tamed and trained?",
        },
        {
          order: 3,
          question:
            "This device used in the Pokémon series is an electronic encyclopedia of all types of Pokémon, vital for new trainers.",
        },
        {
          order: 4,
          question:
            "Who is the iconic protagonist of the Pokémon anime series, known for his dream of becoming a Pokémon Master and his bond with his partner Pikachu?",
        },
      ],
      2: [
        {
          order: 5,
          question:
            "What is the term for a player who is primarily responsible for scoring runs and defending the wicket in the game of cricket?",
        },
        {
          order: 6,
          question:
            "What is the prestigious annual cricket event, where the best players from various franchises compete, and has become immensely popular in India since its inception in 2008?",
        },
        {
          order: 7,
          question:
            "Which Indian city, known for its vibrant culture and as a major IT hub, is home to a top IPL team and has a significant cricket following?",
        },
        {
          order: 8,
          question:
            "This person got married to a famous celebrity in December of 2017. Which famous celebrity did he get married to from the world of Bollywood?",
        },
        {
          order: 9,
          question:
            "Who is this prolific Indian cricketer, renowned for his batting prowess, passionate playing style, and arguably the best test captain India has ever produced?",
        },
      ],
      3: [
        {
          order: 10,
          question:
            "It is a majestic marble building built between 1906 and 1921. It was dedicated to the memory of the Empress of England of that time. It is also a symbol of love and culture.",
        },
        {
          order: 11,
          question:
            "It is an iconic cantilever bridge connecting two cities. It is also named to honor the famous Bengali poet. It is one of the busiest bridges in the world standing on two main pillars.",
        },
        {
          order: 12,
          question:
            "The oldest and the largest museum in India and Asia, housing an extensive collection of art, archeology and natural history exhibits. It was founded in 1814 at the cradle of the Asiatic Society of Bengal.",
        },
        {
          order: 13,
          question:
            "A vibrant street known for its restaurants, cafes, and nightlife offering a mix of colonial-era buildings and modern establishments. In some specific festive seasons it transforms into a dazzling spectacle with vibrant decorations.",
        },
        {
          order: 14,
          question: "Which city was the capital of British India before Delhi?",
        },
      ],
    },

    2: {
      1: [
        {
          order: 0,
          question:
            "I can recognize faces in your phone's photo, and tell who is who wherever you go.",
        },
        {
          order: 1,
          question:
            "I can translate words from one language to another, helping people understand one another.",
        },
        {
          order: 2,
          question:
            "I learn from data and get smarter each day, predicting things in a clever way.",
        },
        {
          order: 3,
          question:
            "I can chat, answer questions, or tell you a joke — sometimes my answers make humans go 'whoa!",
        },
        {
          order: 4,
          question:
            "I am the technology behind all these things, learning, predicting, and making life zing. What am I?",
        },
      ],
      2: [
        {
          order: 5,
          question:
            "What is the term for a genre of ancient Indian texts that contain myths, legends, and historical narratives?",
        },
        {
          order: 6,
          question:
            "A thief who became a sage through chanting god's name — who is he?",
        },
        {
          order: 7,
          question:
            "Who is the greatest devotee of Lord Shiva known for intelligence and cunning?",
        },
        {
          order: 8,
          question:
            "What is the tear-shaped island nation located south of India?",
        },
        {
          order: 9,
          question:
            "Which epic tells the story of Lord Rama and teaches duty and devotion?",
        },
      ],
      3: [
        {
          order: 10,
          question:
            "They work with fabrics and garments using sewing machines. Who are they?",
        },
        {
          order: 11,
          question:
            "This car was first introduced in India in 2005 and became a bestseller. Name it.",
        },
        {
          order: 12,
          question:
            "This area often refers to intergalactic or interstellar emptiness. What is it called?",
        },
        {
          order: 13,
          question:
            "The country bordered by Canada and Mexico, consisting of 50 states and Washington, D.C.?",
        },
        {
          order: 14,
          question:
            "American singer-songwriter born in 1989, known for country and pop hits. Who is she?",
        },
      ],
    },

    3: {
      1: [
        {
          order: 0,
          question:
            "I am a delicious dish with cheese and tomato, everyone loves me, even the bravest bravado.?",
        },
        {
          order: 1,
          question:
            "I am a famous tower that leans to one side, tourists take photos here with pride",
        },
        {
          order: 2,
          question:
            "I am a city of canals and gondolas too, a romantic place where you can float through.",
        },
        {
          order: 3,
          question:
            "I am a city with the Colosseum tall, gladiators once fought within my walls.",
        },
        {
          order: 4,
          question:
            "I'm the country of pizza, towers, and art, with canals and ruins that capture the heart. Which country am I?",
        },
      ],
      2: [
        {
          order: 5,
          question:
            "What is the common nickname for a device used to lift heavy objects, especially vehicles?",
        },
        {
          order: 6,
          question:
            "What is the term for a large watercraft designed to transport people or goods?",
        },
        {
          order: 7,
          question:
            "What term describes a state of armed conflict between countries or groups?",
        },
        {
          order: 8,
          question:
            "What small, common bird known for chirping belongs to the family Passeridae?",
        },
        {
          order: 9,
          question:
            "Who is the witty pirate known for saying 'Why is the rum always gone?'",
        },
      ],
      3: [
        {
          order: 10,
          question:
            "An affectionate term for a rabbit, especially a young or cute one.",
        },
        {
          order: 11,
          question:
            "The fibrous material that makes up tree trunks and branches.",
        },
        {
          order: 12,
          question: "The reproductive structure of flowering plants.",
        },
        {
          order: 13,
          question:
            "A central character in the Mahabharata known for his archery skills and bravery.",
        },
        {
          order: 14,
          question:
            "Which 2021 Telugu action-drama film revolves around red sandalwood smuggling?",
        },
      ],
    },

    4: {
      1: [
        {
          order: 0,
          question:
            "It is related to cinema hall.We say it in it's English name.",
        },
        {
          order: 1,
          question: "It is not a food. It can be of different types.",
        },
        {
          order: 2,
          question: "After watching the movie it is of no use.",
        },
        {
          order: 3,
          question:
            "While entering the hall many people carry it in their hand.",
        },
        {
          order: 4,
          question: "We use this to see 3D films.",
        },
      ],
    },
  };

  // ========== HEARTBEAT MECHANISM ==========
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("heartbeat");
      }
    }, 25000); // Every 25 seconds

    return () => clearInterval(heartbeatInterval);
  }, []);

  // ========== CONNECTION MANAGEMENT ==========
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to server");
      setIsConnected(true);
      setConnectionError(null);
      // Request current question state
      socket.emit("get-initial");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError("Connection lost. Reconnecting...");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  // ========== AUTHENTICATION & RESTORE FROM URL ==========
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/status`, {
          method: "GET",
          credentials: "include",
        });

        const msg = await res.json();
        if (!msg.loggedIn || res.status === 404 || !msg.user?.email) {
          window.location.href = "/login";
          return;
        }

        // Determine which round based on URL
        const urlPath = window.location.pathname;
        let round = 1;
        if (urlPath.includes("round2")) round = 2;
        else if (urlPath.includes("round3")) round = 3;
        else if (urlPath.includes("round4")) round = 4;

        setCurrentRound(round);

        // ✅ RESTORE QUESTION FROM URL PARAMS (if exists)
        const urlParams = new URLSearchParams(window.location.search);
        const qIndex = urlParams.get("qIndex");
        const qRound = urlParams.get("qRound");
        const qTime = urlParams.get("qTime");
        const qTotal = urlParams.get("qTotal");
        const qName = urlParams.get("qName");
        const qMult = urlParams.get("qMult");
        const qText = urlParams.get("qText");

        if (
          qIndex !== null &&
          qRound !== null &&
          qTime !== null &&
          qText !== null
        ) {
          // We have a saved question in URL
          const questionData = {
            index: parseInt(qIndex),
            round: parseInt(qRound),
            totalQuestions: parseInt(qTotal || 0),
            roundName: qName || `Round ${qRound}`,
            scoreMultiplier: parseInt(qMult || 1),
            question: decodeURIComponent(qText),
          };

          const startTime = parseInt(qTime);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);

          // Determine question time
          const timeForQuestion =
            questionData.round === 1
              ? 45
              : questionData.round === 2
                ? 60
                : questionData.round === 3
                  ? 60
                  : questionData.round === 4
                    ? 60
                    : 60;

          const remaining = Math.max(0, timeForQuestion - elapsed);

          // Restore all state
          setCurrentQuestion(questionData);
          setCurrentIndex(questionData.index);
          setCurrentRound(questionData.round);
          setRoundName(questionData.roundName);
          setScoreMultiplier(questionData.scoreMultiplier);
          setTotalQuestions(questionData.totalQuestions);
          setQuestionTime(timeForQuestion);
          setTimeLeft(remaining);
          setIsQuizActive(true);

          // ✅ Restore user answers for this round
          let restoredAnswers = {}; // Declare outside try-catch for debug logging
          const savedAnswers = localStorage.getItem(
            `temp_answers_${questionData.round}`,
          );
          if (savedAnswers) {
            try {
              restoredAnswers = JSON.parse(savedAnswers);
              setUserAnswers(restoredAnswers);
              console.log("✅ Restored user answers:", restoredAnswers);
            } catch (e) {
              console.error("Failed to restore answers:", e);
            }
          }

          // If time is up, auto-submit
          if (remaining <= 0) {
            setIsSubmitted(true);
          }

          // ✅ Debug logging
          console.log("🔍 Restoration Debug:");
          console.log("- Current Question:", questionData);
          console.log("- Time Left:", remaining);
          console.log("- Question Time:", timeForQuestion);
          console.log("- User Answers:", restoredAnswers);
        } else {
          // No saved question, request current state from server
          console.log("⚠️ No URL params found, requesting from server");
          socket.emit("get-initial");
        }

        // Fetch round-specific user data from backend
        await fetchCurrentRoundData(round);
      } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = "/login";
      }
    };

    checkLoggedIn();
  }, []); // Run once on mount

  // ========== ENSURE FULLSCREEN ON ROUND START ==========
  useEffect(() => {
    const ensureFullscreen = () => {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.log("Auto-fullscreen failed:", err);
          });
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
        }
      }
    };

    // Try to go fullscreen when component mounts
    ensureFullscreen();

    // Re-enable fullscreen if user exits during quiz
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isQuizActive && currentQuestion) {
        // User exited fullscreen during active quiz
        setTimeout(() => {
          alert("⚠️ Please stay in fullscreen mode during the quiz!");
          ensureFullscreen();
        }, 500);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [isQuizActive]);

  // ========== FETCH ROUND DATA FROM BACKEND (NO LOCALSTORAGE FALLBACK) ==========
  const fetchCurrentRoundData = async (round) => {
    try {
      const response = await fetch(`${API_URL}/get-user-score?round=${round}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setRoundScore(data.score || 0);
        setTotalQuestions(data.totalQuestions || 0);
        setQuestionAttempt(data.questionAttempt || 0);
        setRoundName(data.roundName || `Round ${round}`);
        setScoreMultiplier(data.scoreMultiplier || 1);
      }

      // Fetch total score across all rounds
      const totalResponse = await fetch(`${API_URL}/get-user-score`, {
        method: "GET",
        credentials: "include",
      });

      if (totalResponse.ok) {
        const totalData = await totalResponse.json();
        setTotalScore(totalData.totalScore || 0);
      }
    } catch (error) {
      console.error("Error fetching round data:", error);
      // Don't fallback to localStorage - show error state
      setRoundScore(0);
      setQuestionAttempt(0);
    }
  };

  // ========== SOCKET EVENT LISTENERS ==========
  useEffect(() => {
    socket.on("question", (questionData) => {
      console.log("📩 Received question:", questionData);

      // Use server-provided startTime if available, otherwise use current time
      const startTime = questionData.startTime || Date.now();
      const duration =
        questionData.duration ||
        (questionData.round === 1 ? 45 : questionData.round === 2 ? 60 : 60);

      // ✅ Clear old URL params first
      const url = new URL(window.location);
      url.searchParams.delete("qIndex");
      url.searchParams.delete("qRound");
      url.searchParams.delete("qTime");
      url.searchParams.delete("qTotal");
      url.searchParams.delete("qName");
      url.searchParams.delete("qMult");
      url.searchParams.delete("qText");

      // ✅ Now set new URL params
      url.searchParams.set("qIndex", questionData.index || 0);
      url.searchParams.set("qRound", questionData.round);
      url.searchParams.set("qTime", Date.now().toString());
      url.searchParams.set("qTotal", questionData.totalQuestions || 0);
      url.searchParams.set("qName", questionData.roundName || "");
      url.searchParams.set("qMult", questionData.scoreMultiplier || 1);
      url.searchParams.set("qText", encodeURIComponent(questionData.question));
      window.history.replaceState({}, "", url);

      // Update question data
      setCurrentQuestion(questionData);
      setCurrentIndex(questionData.index || 0);
      setCurrentRound(questionData.round || currentRound);
      setRoundName(
        questionData.roundName || `Round ${questionData.round || currentRound}`,
      );
      setScoreMultiplier(questionData.scoreMultiplier || 1);
      setTotalQuestions(questionData.totalQuestions || 0);

      // Set question time based on round configuration
      const timeForQuestion =
        questionData.round === 1
          ? 45
          : questionData.round === 2
            ? 60
            : questionData.round === 3
              ? 60
              : questionData.round === 4
                ? 60
                : 60;

      setQuestionTime(timeForQuestion);
      setTimeLeft(timeForQuestion);

      setIsSubmitted(false);
      setHasQuitted(false);
      setQuestionAttempt((prev) => prev + 1);
    });

    // Listen for quiz end
    socket.on("quiz-end", (data) => {
      console.log("🏁 Quiz ended:", data);
      setIsSubmitted(true);
      setIsQuizActive(false);
      handleQuizComplete();
    });

    // Listen for score updates
    socket.on("score-update", (scoreData) => {
      console.log("🎯 Score update:", scoreData);
      setRoundScore(scoreData.roundScore || 0);
      setTotalScore(scoreData.totalScore || 0);
      setQuestionAttempt(scoreData.roundAttempted || 0);
    });

    socket.on("error", (errorData) => {
      console.error("Server error:", errorData);
      alert(errorData.message || "An error occurred");
    });

    // Cleanup socket listeners
    return () => {
      socket.off("question");
      socket.off("quiz-end");
      socket.off("score-update");
      socket.off("error");
    };
  }, [currentRound]);

  // ========== COUNTDOWN TIMER USING URL PARAMS ==========
  useEffect(() => {
    if (!isQuizActive || !currentQuestion || hasQuitted) {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
      return;
    }

    // ✅ Get start time from URL (more reliable than sessionStorage)
    const urlParams = new URLSearchParams(window.location.search);
    const qTime = urlParams.get("qTime");
    const startTime = qTime ? parseInt(qTime) : Date.now();

    // If no time in URL, set it now
    if (!qTime) {
      const url = new URL(window.location);
      url.searchParams.set("qTime", startTime.toString());
      window.history.replaceState({}, "", url);
    }

    questionTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, questionTime - elapsed);
      setTimeLeft(remaining);

      // Auto-submit when time is up
      if (remaining <= 0) {
        clearInterval(questionTimerRef.current);
        if (!isSubmitted) {
          handleAutoSubmit();
        }
      }
    }, 1000);

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [currentQuestion, isQuizActive, hasQuitted, questionTime]);

  const handleQuizComplete = useCallback(() => {
    // Clear URL params on quiz end
    const url = new URL(window.location);
    url.searchParams.delete("qIndex");
    url.searchParams.delete("qRound");
    url.searchParams.delete("qTime");
    url.searchParams.delete("qTotal");
    url.searchParams.delete("qName");
    url.searchParams.delete("qMult");
    url.searchParams.delete("qText");
    window.history.replaceState({}, "", url);

    // ✅ ADD THIS: Clear temp answers
    localStorage.removeItem(`temp_answers_${currentRound}`);

    setTimeout(() => {
      window.location.href = `/score?round=${currentRound}`;
    }, 1000);
  }, [currentRound]);
  // ========== ANSWER SUBMISSION ==========
  const sendAnswer = useCallback(async () => {
    if (!currentQuestion || isSubmitted || isLoading) return;

    setIsLoading(true);
    try {
      const currentAnswer = userAnswers[currentIndex] || "";
      const res = await fetch(`${API_URL}/auth/status`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.loggedIn) {
        // Submit answer in array format
        socket.emit("answer", {
          answer: [currentAnswer.trim()],
          userId: data.user.id,
          questionIndex:
            currentQuestion.index !== undefined
              ? currentQuestion.index
              : currentIndex,
        });

        setIsSubmitted(true);
        console.log("✅ Answer submitted:", currentAnswer.trim());
      } else {
        alert("You must be logged in to submit answers");
      }
    } catch (error) {
      console.error("Failed to send answer:", error);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestion, isSubmitted, isLoading, userAnswers, currentIndex]);

  const handleAutoSubmit = useCallback(() => {
    if (isSubmitted || isLoading || hasQuitted) return;
    console.log("⏰ Auto-submitting due to timeout");
    sendAnswer();
  }, [isSubmitted, isLoading, hasQuitted, sendAnswer]); // ✅ Add sendAnswer

  // Handle manual answer submission
  const handleManualSubmit = () => {
    if (isSubmitted || isLoading || hasQuitted) return;
    sendAnswer();
  };

  // ========== HANDLE ANSWER CHANGE ==========
  const handleAnswerChange = (e) => {
    if (hasQuitted || isSubmitted) return;

    const newAnswer = e.target.value;
    const newAnswers = { ...userAnswers };
    newAnswers[currentIndex] = newAnswer;
    setUserAnswers(newAnswers);

    // ✅ Store answers in localStorage (only for current session)
    localStorage.setItem(
      `temp_answers_${currentRound}`,
      JSON.stringify(newAnswers),
    );
  };

  // ========== HANDLE QUIT ==========
  // ========== HANDLE QUIT ==========
  const handleQuit = async () => {
    // Temporarily disable tab switch detection during quit process
    setIsQuizActive(false);

    if (
      window.confirm(
        "Are you sure you want to quit the quiz? Your current progress will be saved and you'll see your results.",
      )
    ) {
      const currentAnswer = userAnswers[currentIndex] || "";

      try {
        const res = await fetch(`${API_URL}/auth/status`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data.loggedIn && currentAnswer.trim()) {
          // Submit current answer before quitting
          socket.emit("answer", {
            answer: [currentAnswer.trim()],
            userId: data.user.id,
            questionIndex: currentQuestion?.index || currentIndex,
          });
        }

        // Redirect to score page immediately
        window.location.href = `/score?round=${currentRound}`;
      } catch (error) {
        console.error("Error during quit:", error);
        window.location.href = `/score?round=${currentRound}`;
      }
    } else {
      // User cancelled quit - re-enable quiz
      setIsQuizActive(true);
    }
  };

  const handleRejoin = () => {
    setHasQuitted(false);
    setIsQuizActive(true);
    // Re-request current question
    socket.emit("get-initial");
  };

  // ========== GET CURRENT SET INFO ==========
  const getCurrentSet = () => {
    if (!currentQuestion) return { setNumber: 1, questionInSet: 1 };
    const questionIndex = currentQuestion.index || currentIndex;
    const setNumber = Math.floor(questionIndex / 5) + 1;
    const questionInSet = (questionIndex % 5) + 1;
    return { setNumber, questionInSet };
  };

  // ========== PROGRESS INDICATORS ==========
  const getSetProgressIndicators = () => {
    const { setNumber, questionInSet } = getCurrentSet();
    const setStartIndex = (setNumber - 1) * 5;

    return Array.from({ length: 5 }, (_, i) => {
      const questionIndex = setStartIndex + i;
      const isAnswered =
        questionIndex in userAnswers && userAnswers[questionIndex]?.trim();
      const isCurrent = i + 1 === questionInSet;

      let className = "w-4 h-4 rounded-full transition-all duration-300 ";

      if (isCurrent) {
        className += "bg-blue-500 ring-2 ring-blue-300 shadow-lg animate-pulse";
      } else if (isAnswered) {
        className += "bg-green-500 shadow-lg";
      } else {
        className += "bg-gray-400 opacity-50";
      }

      return <div key={i + 1} className={className} />;
    });
  };

  // ========== DISPLAY PREVIOUS ANSWERS ==========
  const getPreviousAnswersForSet = () => {
    const { setNumber, questionInSet } = getCurrentSet();
    if (questionInSet !== 5) return null;

    const setStartIndex = (setNumber - 1) * 5;

    return (
      <div className="lg:w-[90%] w-[95%] bg-black/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row w-full items-center justify-around text-white uppercase lg:text-[1.8vw]">
          {[1, 2, 3, 4].map((clueNum) => (
            <div
              key={clueNum}
              className="text-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className="text-gray-300 text-[2vh] lg:text-[1.2vw] mb-2 font-medium">
                Clue {clueNum}
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl text-[2vh] px-12 py-4 lg:px-5 lg:py-4 border border-white/20">
                <span className="text-cyan-200">
                  {userAnswers[setStartIndex + clueNum - 1] || "Not answered"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const { setNumber, questionInSet } = getCurrentSet();

  // ========== TAB SWITCH & ALT+TAB DETECTION ==========
  useEffect(() => {
    let altPressed = false;

    const handleKeyDown = (e) => {
      if (e.key === "Alt") {
        altPressed = true;
      }

      // Detect Alt+Tab (only if quiz is active)
      if (
        altPressed &&
        e.key === "Tab" &&
        isQuizActive &&
        currentQuestion &&
        !isSubmitted
      ) {
        e.preventDefault();
        handleTabSwitch("Alt+Tab detected");
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "Alt") {
        altPressed = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isQuizActive && currentQuestion && !isSubmitted) {
        handleTabSwitch("Tab switch detected");
      }
    };

    const handleBlur = () => {
      // Only trigger if quiz is active AND not submitted
      if (isQuizActive && currentQuestion && !isSubmitted) {
        handleTabSwitch("Window focus lost");
      }
    };

    const handleTabSwitch = (reason) => {
      const newCount = tabSwitchCount + 1;
      setTabSwitchCount(newCount);

      console.warn(`⚠️ ${reason}! Count: ${newCount}/${MAX_TAB_SWITCHES}`);

      if (newCount >= MAX_TAB_SWITCHES) {
        alert(
          `You have switched tabs ${MAX_TAB_SWITCHES} times. Quiz terminated.`,
        );

        const currentAnswer = userAnswers[currentIndex] || "";
        if (currentAnswer.trim()) {
          fetch(`${API_URL}/auth/status`, { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
              if (data.loggedIn) {
                socket.emit("answer", {
                  answer: [currentAnswer.trim()],
                  userId: data.user.id,
                  questionIndex: currentQuestion?.index || currentIndex,
                });
              }
            })
            .catch((err) => console.error(err));
        }

        setTimeout(() => {
          window.location.href = `/score?round=${currentRound}`;
        }, 1000);
      } else {
        alert(
          `⚠️ Warning: ${reason}!\n${MAX_TAB_SWITCHES - newCount} violations remaining before quiz termination.`,
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isQuizActive, isSubmitted, currentQuestion, tabSwitchCount]); // Added currentQuestion dependency

  return (
    <div className="font-[GilM] flex flex-col items-center justify-center min-h-screen bg-black text-white overflow-hidden relative">
      {/* CONNECTION STATUS INDICATOR */}
      {!isConnected && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-red-300/50 shadow-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            <span className="text-white font-bold">
              {connectionError || "Reconnecting..."}
            </span>
          </div>
        </div>
      )}

      {isConnected && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-green-300/50 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span className="text-white font-bold">Connected</span>
          </div>
        </div>
      )}
      <div className="flex gap-4 font-[GilM] flex flex-col items-center justify-center min-h-screen bg-black text-white overflow-hidden absolute">
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
              } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
              }
            } else {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
              } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
              } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
              }
            }
          }}
          className="bg-blue-500/70 hover:bg-blue-500 text-white lg:px-4 lg:py-3 px-4 py-3 rounded-2xl border border-blue-500/30 transition-all duration-300 text-[2.5vh] lg:text-sm font-medium backdrop-blur-sm hover:scale-105 transform fixed top-4 left-4 z-50 backdrop-blur-md px-6 py-3 rounded-2xl border  shadow-lg"
        >
          FullScreen
        </button>
      </div>
      {/* Content */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-center ">
        {hasQuitted ? (
          <div className="relative text-center bg-black/60 backdrop-blur-lg rounded-3xl p-8 border border-white/20 animate-fade-in">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Quiz Paused
            </h1>
            <p className="text-2xl mb-6 text-gray-200">
              You have temporarily left the quiz.
            </p>
            <p className="text-xl mb-8 text-gray-300">
              Your progress has been saved. You can rejoin anytime!
            </p>
            <div className="mb-6 space-y-2">
              <p className="text-cyan-300 text-lg">
                Round Score: {roundScore} (×{scoreMultiplier} multiplier)
              </p>
              <p className="text-cyan-300 text-lg">Total Score: {totalScore}</p>
            </div>
            <div className="space-x-4 flex lg:block">
              <button
                onClick={handleRejoin}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl text-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Rejoin Quiz
              </button>
              <button
                onClick={() => {
                  window.location.href = `/score?round=${currentRound}`;
                }}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl text-xl font-bold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                View Score
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          <>
            <video
              src="https://res.cloudinary.com/dke15c3sv/video/upload/v1760723119/landing_wxbihl.mp4"
              autoPlay
              loop
              muted
              preload="metadata"
              poster="https://res.cloudinary.com/dke15c3sv/image/upload/v1760723161/landing_fqyvzy.jpg"
              className="h-screen w-full object-cover"
            ></video>
            <div className="absolute flex flex-col items-center w-full lg:w-[90%] h-full lg:h-[45vw] lg:px-4 lg:py-11 space-y-2 bg-white/20 lg:rounded-3xl rounded-2xl border border-white/30 backdrop-blur-md shadow-2xl animate-fade-in overflow-y-auto">
              <div className="relative flex lg:flex-row flex-col items-center justify-between px-[1vh] lg:justify-between w-full lg:max-w-7xl lg:px-8 py-10 lg:py-5 space-y-4 lg:space-y-0">
                <div className="text-center">
                  <h1 className="text-[5vh] lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {roundName}
                  </h1>
                </div>

                <div className="text-center">
                  <h1 className="text-[3.5vh] lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent animate-pulse">
                    Set {setNumber}
                  </h1>
                </div>

                <button
                  onClick={handleQuit}
                  className="bg-red-500/70 hover:bg-red-500 text-white lg:px-6 lg:py-3 px-20 py-3 rounded-2xl border border-red-500/30 transition-all duration-300 text-[2.5vh] lg:text-lg font-medium backdrop-blur-sm hover:scale-105 transform"
                >
                  Quit Quiz
                </button>
              </div>

              {/* Progress Bar Timer */}
              <div className="w-full lg:max-w-4xl">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-xl px-[1vh] ">
                    {isSubmitted ? "Time Elapsed" : "Time Remaining"}
                  </span>
                  <span
                    className={`font-mono text-2xl px-4 py-2 rounded-xl ${
                      timeLeft <= 10 && !isSubmitted
                        ? "animate-pulse text-red-400"
                        : isSubmitted
                          ? "text-white"
                          : "text-green-400"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Question Display */}
              <div className="w-full lg:max-w-[80%] animate-fade-in">
                <div className="bg-black/60 backdrop-blur-lg rounded-3xl p-8 border border-white/30 shadow-2xl">
                  <h2 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {questionInSet === 5
                      ? "🎯 Final Question"
                      : `💡 Clue ${questionInSet}`}
                  </h2>
                  <p className="text-white text-center text-2xl leading-relaxed font-medium">
                    {FALLBACK_QUESTIONS[currentRound][setNumber][
                      questionInSet - 1
                    ].question || currentQuestion.question}
                  </p>
                </div>
              </div>

              {/* Answer Input */}
              {/* Answer Input */}
              <div className="w-full max-w-4xl mb-6">
                <textarea
                  ref={(el) => {
                    if (el && !isSubmitted && !isLoading) {
                      // Auto-focus on mount and when question changes
                      el.focus();
                    }
                  }}
                  value={userAnswers[currentIndex] || ""}
                  onChange={handleAnswerChange}
                  onMouseEnter={(e) => {
                    if (!isSubmitted && !isLoading) {
                      e.target.focus();
                    }
                  }}
                  onClick={(e) => {
                    if (!isSubmitted && !isLoading) {
                      e.target.focus();
                    }
                  }}
                  onTouchStart={(e) => {
                    // For mobile devices
                    if (!isSubmitted && !isLoading) {
                      e.target.focus();
                    }
                  }}
                  className="w-full lg:h-32 lg:px-6 lg:py-10 h-[15vh] py-[5vh] px-[2vh] text-center bg-black/60 backdrop-blur-md border-2 border-white/30 rounded-3xl lg:text-xl text-[2.5vh] text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 resize-none"
                  placeholder={
                    questionInSet === 5
                      ? "🎯 Guess the answer according to all your previous clues"
                      : "Write your answer here"
                  }
                  disabled={isSubmitted || isLoading}
                  autoFocus
                />
              </div>
              {/* Submit Button */}
              <button
                onClick={handleManualSubmit}
                disabled={
                  isSubmitted || isLoading || !userAnswers[currentIndex]?.trim()
                }
                className={`lg:px-12 px-25 py-4 lg:py-4 rounded-3xl text-[3vh] lg:text-xl font-bold transition-all duration-300 mb-8 transform hover:scale-105 shadow-lg ${
                  isSubmitted || isLoading || !userAnswers[currentIndex]?.trim()
                    ? "bg-gray-500/50 text-gray-400 cursor-not-allowed backdrop-blur-sm"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : isSubmitted ? (
                  "✓ Submitted "
                ) : (
                  "Submit Answer"
                )}
              </button>

              {/* Display previous answers for final question of each set */}
              {getPreviousAnswersForSet()}

              {/* Progress Indicator for Current Set */}
              <div className="flex justify-center space-x-4 mb-6 ">
                {getSetProgressIndicators()}
              </div>
            </div>
          </>
        ) : (
          <div className="relative w-full h-screen overflow-hidden bg-black">
            <video
              autoPlay
              muted
              loop
              preload="metadata"
              poster="https://res.cloudinary.com/dke15c3sv/image/upload/v1760795245/Screenshot_2025-10-18_190026_hvl9mt.png"
              className="absolute top-[10%] left-[5%] lg:left-[0%] lg:top-[0%] h-[70%] w-[100%] lg:h-screen lg:w-full object-cover z-10 inset-0"
              src="https://res.cloudinary.com/dke15c3sv/video/upload/v1768596871/Untitled_design_xkyatp.mp4"
            ></video>
            <div className="absolute inset-0 flex top-[-40%] flex-col items-center justify-center text-center text-white animate-fade-in z-50">
              <p className="text-3xl sm:text-3xl mb-8 font-medium">
                Waiting for {roundName} questions...
              </p>
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Round;
