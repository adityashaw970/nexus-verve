import React, { useState, useEffect } from "react";

const Score = () => {
  const [roundData, setRoundData] = useState(null);
  const [totalData, setTotalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [allRoundsData, setAllRoundsData] = useState({});

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Check if user is logged in
        const res = await fetch("http://localhost:5000/auth/status", {
          method: "GET",
          credentials: "include",
        });

        const authData = await res.json();

        if (!authData.loggedIn) {
          window.location.href = "/login";
          return;
        }

        setUserInfo(authData.user);

        // Get round number from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const roundParam = urlParams.get("round");
        const round = roundParam ? parseInt(roundParam) : 1;
        setCurrentRound(round);

        // Fetch both round-specific and total data
        await Promise.all([
          fetchRoundData(round),
          fetchTotalData(),
          fetchAllRoundsData(),
        ]);
      } catch (error) {
        console.error("Error loading score data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, []);

  const fetchRoundData = async (round) => {
    try {
      const response = await fetch(
        `http://localhost:5000/get-user-score?round=${round}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setRoundData(data);
      } else {
        throw new Error("Failed to fetch round data");
      }
    } catch (error) {
      console.error("Error fetching round data:", error);
      // Fallback to localStorage for current round
      const savedScore =
        parseInt(localStorage.getItem(`round_${round}_score`)) || 0;
      const savedAttempt =
        parseInt(localStorage.getItem(`round_${round}_attempt`)) || 0;

      setRoundData({
        round: round,
        roundName: `Round ${round}`,
        score: savedScore,
        questionAttempt: savedAttempt,
        totalQuestions: 0,
        scoreMultiplier: 1,
      });
    }
  };

  const fetchTotalData = async () => {
    try {
      const response = await fetch("http://localhost:5000/get-user-score", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTotalData(data);
      }
    } catch (error) {
      console.error("Error fetching total data:", error);
      // Fallback to localStorage
      const savedTotalScore =
        parseInt(localStorage.getItem("total_score")) || 0;
      setTotalData({
        totalScore: savedTotalScore,
        totalAttempted: 0,
        roundsCompleted: [],
        totalRounds: 4,
      });
    }
  };

  const fetchAllRoundsData = async () => {
    try {
      const rounds = [1, 2, 3, 4];
      const allData = {};

      for (const round of rounds) {
        const response = await fetch(
          `http://localhost:5000/get-user-score?round=${round}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          allData[round] = data;
        }
      }

      setAllRoundsData(allData);
    } catch (error) {
      console.error("Error fetching all rounds data:", error);
    }
  };

  const getScorePercentage = () => {
    if (!roundData || roundData.totalQuestions === 0) return 0;
    return Math.round((roundData.score / roundData.totalQuestions) * 100);
  };

  const getTotalScorePercentage = () => {
    if (!totalData) return 0;
    const totalPossibleScore = Object.values(allRoundsData).reduce(
      (sum, round) => {
        return sum + round.totalQuestions * round.scoreMultiplier;
      },
      0
    );

    if (totalPossibleScore === 0) return 0;
    return Math.round((totalData.totalScore / totalPossibleScore) * 100);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    if (percentage >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return "🏆 Outstanding Performance!";
    if (percentage >= 80) return "🎉 Excellent Work!";
    if (percentage >= 70) return "👏 Great Job!";
    if (percentage >= 60) return "👍 Good Effort!";
    if (percentage >= 50) return "💪 Keep Improving!";
    return "📚 Practice Makes Perfect!";
  };

  const switchRound = (newRound) => {
    const url = new URL(window.location);
    url.searchParams.set("round", newRound);
    window.history.pushState({}, "", url);
    setCurrentRound(newRound);
    setIsLoading(true);

    fetchRoundData(newRound).then(() => {
      setIsLoading(false);
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-xl">Loading your results...</p>
      </div>
    );
  }

  const roundPercentage = getScorePercentage();
  const totalPercentage = getTotalScorePercentage();

  return (
    <div className="font-[GilM] flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-1">
      <div className="max-w-6xl w-full bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-5xl font-bold mb-1 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Quiz Results
          </h1>
          <p className="text-gray-300 text-lg">
            {userInfo?.username || "Quiz Participant"}
          </p>
        </div>

        {/* Round Selector */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-col lg:flex-row bg-gray-800 rounded-xl p-1 border border-gray-600">
            {[1, 2, 3, 4].map((round) => (
              <button
                key={round}
                onClick={() => switchRound(round)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  currentRound === round
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                Round {round}
              </button>
            ))}
            <button
              onClick={() => switchRound("total")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                currentRound === "total"
                  ? "bg-purple-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              Total
            </button>
          </div>
        </div>

        {currentRound !== "total" && roundData ? (
          /* Individual Round Results */
          <>
            {/* Round Header */}
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold mb-2 text-cyan-400">
                {roundData.roundName}
              </h2>
              <p className="text-gray-400">
                Multiplier: ×{roundData.scoreMultiplier} | Questions:{" "}
                {roundData.totalQuestions}
              </p>
            </div>

            {/* Performance Message */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold mb-2">
                {getPerformanceMessage(roundPercentage)}
              </h3>
            </div>

            {/* Round Score Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-600">
                <div className="text-4xl font-bold mb-2">
                  <span className={getScoreColor(roundPercentage)}>
                    {roundData.score}
                  </span>
                  <span className="text-gray-400">
                    /{roundData.totalQuestions * roundData.scoreMultiplier}
                  </span>
                </div>
                <p className="text-gray-300 text-sm uppercase tracking-wide">
                  Round Score
                </p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-600">
                <div
                  className={`text-4xl font-bold mb-2 ${getScoreColor(
                    roundPercentage
                  )}`}
                >
                  {roundPercentage}%
                </div>
                <p className="text-gray-300 text-sm uppercase tracking-wide">
                  Accuracy
                </p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-600">
                <div className="text-4xl font-bold mb-2 text-blue-400">
                  {roundData.questionAttempt}
                </div>
                <p className="text-gray-300 text-sm uppercase tracking-wide">
                  Questions Attempted
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">
                  Round Progress
                </span>
                <span className="text-gray-300">
                  {roundData.questionAttempt} / {roundData.totalQuestions}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${
                      roundData.totalQuestions > 0
                        ? (roundData.questionAttempt /
                            roundData.totalQuestions) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Detailed Round Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-600">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {Math.round(roundData.score / roundData.scoreMultiplier)}
                </div>
                <p className="text-gray-400 text-sm">Correct Answers</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-600">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {roundData.questionAttempt -
                    Math.round(roundData.score / roundData.scoreMultiplier)}
                </div>
                <p className="text-gray-400 text-sm">Incorrect Answers</p>
              </div>
            </div>
          </>
        ) : totalData ? (
          /* Total Results Across All Rounds */
          <>
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold mb-2 text-purple-400">
                Overall Performance
              </h2>
              <p className="text-gray-400">
                Rounds Completed: {totalData.roundsCompleted.length} /{" "}
                {totalData.totalRounds}
              </p>
            </div>

            {/* Total Performance Message */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold mb-2">
                {getPerformanceMessage(totalPercentage)}
              </h3>
            </div>

            {/* Total Score Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-600">
                <div className="text-4xl font-bold mb-2">
                  <span className={getScoreColor(totalPercentage)}>
                    {totalData.totalScore}
                  </span>
                </div>
                <p className="text-gray-300 text-sm uppercase tracking-wide">
                  Total Score
                </p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-600">
                <div
                  className={`text-4xl font-bold mb-2 ${getScoreColor(
                    totalPercentage
                  )}`}
                >
                  {totalPercentage}%
                </div>
                <p className="text-gray-300 text-sm uppercase tracking-wide">
                  Overall Accuracy
                </p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-600">
                <div className="text-4xl font-bold mb-2 text-purple-400">
                  {totalData.totalAttempted}
                </div>
                <p className="text-gray-300 text-sm uppercase tracking-wide">
                  Total Questions
                </p>
              </div>
            </div>

            {/* Round Breakdown */}
            <div className="4">
              <h3 className="text-xl font-bold mb-4 text-center">
                Round Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((round) => {
                  const roundInfo = allRoundsData[round];
                  const isCompleted = totalData.roundsCompleted.includes(round);

                  return (
                    <div
                      key={round}
                      className={`bg-gray-800 rounded-xl p-4 border ${
                        isCompleted ? "border-green-500" : "border-gray-600"
                      }`}
                    >
                      <div className="text-center">
                        <h4 className="font-bold text-lg mb-2">
                          Round {round}
                        </h4>
                        {roundInfo ? (
                          <>
                            <div className="text-2xl font-bold mb-1 text-cyan-400">
                              {roundInfo.score}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {roundInfo.questionAttempt} /{" "}
                              {roundInfo.totalQuestions} questions
                            </p>
                            <p className="text-gray-500 text-xs">
                              ×{roundInfo.scoreMultiplier} multiplier
                            </p>
                          </>
                        ) : (
                          <div className="text-gray-500">
                            <div className="text-2xl mb-1">-</div>
                            <p className="text-sm">Not attempted</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center ">
          <button
            onClick={() => {
              window.location.href = "/profile";
            }}
            className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl font-semibold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 transform hover:scale-105 relative top-5"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Score;
