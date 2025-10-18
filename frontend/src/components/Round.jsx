import React, { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

// Initialize socket connection
const socket = io("https://nexus-verve.onrender.com", {
  withCredentials: true,
});

const Round = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30);
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
  const [questionTime, setQuestionTime] = useState(10);

  // Check authentication and get current round info
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const res = await fetch(
          "https://nexus-verve.onrender.com/auth/status",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const msg = await res.json();
        if (!msg.loggedIn || res.status === 404 || !msg.user?.email) {
          window.location.href = "/login";
          return;
        }

        // Determine which round based on URL or other logic
        const urlPath = window.location.pathname;
        let round = 1;
        if (urlPath.includes("round2")) round = 2;
        else if (urlPath.includes("round3")) round = 3;
        else if (urlPath.includes("round4")) round = 4;

        setCurrentRound(round);

        // Fetch round-specific user data
        await fetchCurrentRoundData(round);
      } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = "/login";
      }
    };

    checkLoggedIn();
  }, []);

  // Fetch current round data from backend
  const fetchCurrentRoundData = async (round) => {
    try {
      const response = await fetch(
        `https://nexus-verve.onrender.com/get-user-score?round=${round}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRoundScore(data.score || 0);
        setTotalQuestions(data.totalQuestions || 0);
        setQuestionAttempt(data.questionAttempt || 0);
        setRoundName(data.roundName || `Round ${round}`);
        setScoreMultiplier(data.scoreMultiplier || 1);

        // Save to localStorage for persistence
        localStorage.setItem(
          `round_${round}_score`,
          data.score?.toString() || "0"
        );
        localStorage.setItem(
          `round_${round}_attempt`,
          data.questionAttempt?.toString() || "0"
        );
      }

      // Also fetch total score across all rounds
      const totalResponse = await fetch(
        "https://nexus-verve.onrender.com/get-user-score",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (totalResponse.ok) {
        const totalData = await totalResponse.json();
        setTotalScore(totalData.totalScore || 0);
      }
    } catch (error) {
      console.error("Error fetching round data:", error);
      // Fallback to localStorage
      const savedScore =
        parseInt(localStorage.getItem(`round_${round}_score`)) || 0;
      const savedAttempt =
        parseInt(localStorage.getItem(`round_${round}_attempt`)) || 0;
      setRoundScore(savedScore);
      setQuestionAttempt(savedAttempt);
    }
  };

  // Socket.IO event listeners
  useEffect(() => {
    // Request initial question quiz data
    socket.emit("get-initial");

    // Listen for question updates
    socket.on("question", (questionData) => {
      // Update question data
      setCurrentQuestion(questionData);
      setCurrentIndex(questionData.index || 0);
      setCurrentRound(questionData.round || currentRound);
      setRoundName(
        questionData.roundName || `Round ${questionData.round || currentRound}`
      );
      setScoreMultiplier(questionData.scoreMultiplier || 1);
      setTotalQuestions(questionData.totalQuestions || 0);

      // Set question time based on round configuration
      const timeForQuestion =
        questionData.round === 1
          ? 30
          : questionData.round === 2
          ? 40
          : questionData.round === 3
          ? 60
          : questionData.round === 4
          ? 60
          : 60;
      setQuestionTime(timeForQuestion);
      setTimeLeft(timeForQuestion);

      setIsSubmitted(false);
      setHasQuitted(false);
      setQuestionAttempt((prev) => {
        const updated = prev + 1;
        localStorage.setItem(
          `round_${currentRound}_attempt`,
          updated.toString()
        );
        return updated;
      });

      // Reset start time
      localStorage.setItem("quiz_question_start", Date.now().toString());
    });

    // Listen for quiz end
    socket.on("quiz-end", (data) => {
      console.log("Quiz ended:", data);
      setIsSubmitted(true);
      setIsQuizActive(false);
      handleQuizComplete();
    });

    // Listen for score updates
    socket.on("score-update", (scoreData) => {
      console.log("Score update:", scoreData);
      setRoundScore(scoreData.roundScore || 0);
      setTotalScore(scoreData.totalScore || 0);
      setQuestionAttempt(scoreData.roundAttempted || 0);

      // Update localStorage
      localStorage.setItem(
        `round_${currentRound}_score`,
        scoreData.roundScore?.toString() || "0"
      );
      localStorage.setItem(
        `round_${currentRound}_attempt`,
        scoreData.roundAttempted?.toString() || "0"
      );
      localStorage.setItem(
        "total_score",
        scoreData.totalScore?.toString() || "0"
      );
    });

    // Cleanup socket listeners
    return () => {
      socket.off("question");
      socket.off("quiz-end");
      socket.off("score-update");
    };
  }, [currentRound]);

  // Load saved state
  useEffect(() => {
    const savedAnswers =
      JSON.parse(localStorage.getItem(`round_${currentRound}_answers`)) || {};
    const savedIndex =
      parseInt(localStorage.getItem(`round_${currentRound}_index`)) || 0;
    const submitted =
      localStorage.getItem(`round_${currentRound}_submitted`) === "true";
    const quitted =
      localStorage.getItem(`round_${currentRound}_quitted`) === "true";

    // If quiz was already completed, redirect to score page
    if (submitted) {
      window.location.href = `/score?round=${currentRound}`;
      return;
    }

    if (quitted) {
      setHasQuitted(true);
    }

    setUserAnswers(savedAnswers);
    setCurrentIndex(savedIndex);

    const questionStartTime = localStorage.getItem("quiz_question_start");
    const now = Date.now();
    if (questionStartTime) {
      const elapsed = Math.floor((now - parseInt(questionStartTime)) / 1000);
      const remaining = questionTime - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    } else {
      localStorage.setItem("quiz_question_start", Date.now().toString());
    }
  }, [currentRound, questionTime]);

  // Countdown timer
  useEffect(() => {
    if (
      !isQuizActive ||
      isSubmitted ||
      timeLeft <= 0 ||
      !currentQuestion ||
      hasQuitted
    )
      return;

    const interval = setInterval(() => {
      const startTime = localStorage.getItem("quiz_question_start");
      if (startTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - parseInt(startTime)) / 1000);
        const remaining = questionTime - elapsed;
        const newTime = remaining > 0 ? remaining : 0;
        setTimeLeft(newTime);

        if (newTime <= 0) {
          clearInterval(interval);
          handleAutoSubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isQuizActive,
    isSubmitted,
    timeLeft,
    currentQuestion,
    hasQuitted,
    questionTime,
  ]);

  // Handle quiz completion
  const handleQuizComplete = useCallback(() => {
    localStorage.setItem(`round_${currentRound}_submitted`, "true");
    localStorage.setItem(`round_${currentRound}_score`, roundScore.toString());

    // Small delay to ensure data is saved
    setTimeout(() => {
      window.location.href = `/score?round=${currentRound}`;
    }, 1000);
  }, [currentRound, roundScore]);

  // Handle answer submission via Socket.IO
  const sendAnswer = async () => {
    if (!currentQuestion || isSubmitted || isLoading) return;

    setIsLoading(true);
    try {
      const currentAnswer = userAnswers[currentIndex] || "";
      const res = await fetch("https://nexus-verve.onrender.com/auth/status", {
        credentials: "include",
      });
      const data = await res.json();

      if (data.loggedIn) {
        // Submit answer in array format as requested
        socket.emit("answer", {
          answer: [currentAnswer.trim()],
          userId: data.user.id,
          questionIndex:
            currentQuestion.index !== undefined
              ? currentQuestion.index
              : currentIndex,
          roundNumber: currentRound,
        });

        setIsSubmitted(true);
        console.log("Answer submitted:", currentAnswer.trim());
      } else {
        alert("You must be logged in to submit answers");
      }
    } catch (error) {
      console.error("Failed to send answer:", error);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSubmit = useCallback(() => {
    if (isSubmitted || isLoading || hasQuitted) return;
    console.log("Auto-submitting due to timeout");
    sendAnswer();
  }, [isSubmitted, isLoading, hasQuitted]);

  // Handle manual answer submission
  const handleManualSubmit = () => {
    if (isSubmitted || isLoading || hasQuitted) return;
    sendAnswer();
  };

  // Handle answer change (only save locally, no auto-submit)
  const handleAnswerChange = (e) => {
    if (hasQuitted || isSubmitted) return;

    const newAnswer = e.target.value;
    const newAnswers = { ...userAnswers };
    newAnswers[currentIndex] = newAnswer;
    setUserAnswers(newAnswers);

    // Only save to localStorage, no socket emission
    localStorage.setItem(
      `round_${currentRound}_answers`,
      JSON.stringify(newAnswers)
    );
    localStorage.setItem(
      `round_${currentRound}_index`,
      currentIndex.toString()
    );
  };

  const handleQuit = async () => {
    if (
      window.confirm(
        "Are you sure you want to quit the quiz? Your current progress will be saved and you'll see your results."
      )
    ) {
      // Save current answers to backend before quitting
      const currentAnswer = userAnswers[currentIndex] || "";

      try {
        const res = await fetch(
          "https://nexus-verve.onrender.com/auth/status",
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (data.loggedIn && currentAnswer.trim()) {
          // Submit current answer before quitting
          socket.emit("answer", {
            answer: [currentAnswer.trim()],
            userId: data.user.id,
            questionIndex: currentQuestion?.index || currentIndex,
            roundNumber: currentRound,
          });
        }

        // Save quit state and score
        localStorage.setItem(`round_${currentRound}_quitted`, "true");
        localStorage.setItem(
          `round_${currentRound}_score`,
          roundScore.toString()
        );

        // Redirect to score page
        window.location.href = `/score?round=${currentRound}`;
      } catch (error) {
        console.error("Error during quit:", error);
        window.location.href = `/score?round=${currentRound}`;
      }
    }
  };

  const handleRejoin = () => {
    localStorage.removeItem(`round_${currentRound}_quitted`);
    setHasQuitted(false);
    setIsQuizActive(true);
    // Re-request current question
    socket.emit("get-initial");
  };

  const getProgressPercentage = () => {
    return (timeLeft / questionTime) * 100;
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage > 60) return "bg-gradient-to-r from-green-400 to-green-500";
    if (percentage > 30)
      return "bg-gradient-to-r from-yellow-400 to-yellow-500";
    return "bg-gradient-to-r from-red-400 to-red-500";
  };

  // Get current set info (for rounds with set structure)
  const getCurrentSet = () => {
    if (!currentQuestion) return { setNumber: 1, questionInSet: 1 };
    const questionIndex = currentQuestion.index || currentIndex;
    const setNumber = Math.floor(questionIndex / 5) + 1;
    const questionInSet = (questionIndex % 5) + 1;
    return { setNumber, questionInSet };
  };

  // Get progress indicators for current set
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

  // Display previous answers for the final question of each set
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

  return (
    <div className="font-[GilM] flex flex-col items-center justify-center min-h-screen bg-black text-white overflow-hidden relative">
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
            {/* Header */}

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
              <div className="w-full lg:max-w-4xl ">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-xl px-[1vh]">
                    Time Remaining
                  </span>
                  <span className="text-white font-mono text-2xl  px-4 py-2 rounded-xl">
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Question Display */}
              <div className="w-full lg:max-w-[80%]  animate-fade-in">
                <div className="bg-black/60 backdrop-blur-lg rounded-3xl p-8 border border-white/30 shadow-2xl">
                  <h2 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {questionInSet === 5
                      ? "🎯 Final Question"
                      : `💡 Clue ${questionInSet}`}
                  </h2>
                  <p className="text-white text-center text-2xl leading-relaxed font-medium">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>

              {/* Answer Input */}
              <div className="w-full max-w-4xl mb-6">
                <textarea
                  value={userAnswers[currentIndex] || ""}
                  onChange={handleAnswerChange}
                  className="w-full lg:h-32 lg:px-6 lg:py-10 h-[15vh] py-[5vh] px-[2vh] text-center bg-black/60 backdrop-blur-md border-2 border-white/30 rounded-3xl lg:text-xl text-[2.5vh] text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 resize-none"
                  placeholder={
                    questionInSet === 5
                      ? "🎯 Guess the answer according to all your previous clues"
                      : "Write your answer here"
                  }
                  disabled={
                    isSubmitted || timeLeft <= 0 || !isQuizActive || isLoading
                  }
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleManualSubmit}
                disabled={
                  isSubmitted ||
                  timeLeft <= 0 ||
                  !isQuizActive ||
                  isLoading ||
                  !userAnswers[currentIndex]?.trim()
                }
                className={`lg:px-12 px-25 py-4 lg:py-4 rounded-3xl text-[3vh] lg:text-xl font-bold transition-all duration-300 mb-8 transform hover:scale-105 shadow-lg ${
                  isSubmitted ||
                  timeLeft <= 0 ||
                  !isQuizActive ||
                  isLoading ||
                  !userAnswers[currentIndex]?.trim()
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
                  "Submitted"
                ) : (
                  " Submit Answer"
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
              className="h-screen w-full object-cover z-10 inset-0"
              src="https://res.cloudinary.com/dke15c3sv/video/upload/v1760795224/Recording_2025-10-18_191130_amnqj3.mp4"
            ></video>
            {/* Overlay content */}
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
