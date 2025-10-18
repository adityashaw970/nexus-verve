import React, { useEffect, useState } from "react";

export default function LandingPage() {
  let rounds = [
    {
      title: "Round 1",
      start: true,
      completed: false,
      video:
        "https://player.vimeo.com/progressive_redirect/playback/1059748367/rendition/720p/file.mp4?loc=external&signature=b8c299d68150ff794b0096fd199cc1e08d26d74e68e498ed91ec7d47b038f2e7&user_id=148208548#t=0.001",
    },
    {
      title: "Round 2",
      start: true,
      completed: false,
      video:
        "https://player.vimeo.com/progressive_redirect/playback/1059749311/rendition/1080p/file.mp4?loc=external&signature=f30d439a0c5c6d72588855ad64719cf7e7ba4bd619167e49f9eb8343face52a6&user_id=148208548#t=0.001",
    },
    {
      title: "Round 3",
      start: true,
      completed: false,
      video:
        "https://res.cloudinary.com/dke15c3sv/video/upload/v1760723087/short2_xhyvq9.mp4",
    },
    {
      title: "Bonus Round",
      start: true,
      completed: false,
      video:
        "https://player.vimeo.com/progressive_redirect/playback/831162360/rendition/720p/file.mp4?loc=external&signature=fe27313dcd4ea07fd5d87afd5938cd9465575663669ed4506feabf01de752392#t=0.001",
    },
  ];

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [Round] = useState(rounds);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(
          "https://nexus-verve.onrender.com/auth/status",
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await res.json();
        setIsLoggedIn(data.loggedIn);
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsLoggedIn(false);
      }
    };

    checkStatus();
  }, []);

  // Redirect if logged in
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

        if (window.location.href === "http://localhost:5173/") {
          if (msg.loggedIn) {
            window.location.href = "/profile";
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoggedIn();
  }, []);

  const handleToggleLeaderboard = async () => {
    if (showLeaderboard) {
      setShowLeaderboard(false);
    } else {
      setIsLeaderboardLoading(true);
      try {
        const res = await fetch(
          "https://nexus-verve.onrender.com/leaderboard",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (res.ok) {
          const data = await res.json();
          console.log("Leaderboard data:", data); // Debug log
          setLeaderboard(data);
          setShowLeaderboard(true);
        } else {
          console.error("Failed to fetch leaderboard:", res.status);
          alert("Failed to load leaderboard. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        alert("Error loading leaderboard. Please check your connection.");
      } finally {
        setIsLeaderboardLoading(false);
      }
    }
  };

  const handleRoundClick = (round, index) => {
    if (!round.start) return;

    if (!isLoggedIn) {
      alert("Please log in to play the game.");
      window.location.href = "/login";
    } else {
      window.location.href = `/round${index + 1}`;
    }
  };

  const getMedalBackground = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-orange-300 via-yellow-400 to-orange-600";
      case 1:
        return "bg-gradient-to-br from-red-300 via-red-400 to-red-600";
      case 2:
        return "bg-gradient-to-br from-green-400 via-green-400 to-green-600";
      default:
        return "bg-white/40";
    }
  };

  const getMedalTextColor = (index) => {
    return index < 3 ? "text-white" : "text-black/80";
  };

  return (
    <>
      <div className="w-full overflow-hidden h-screen bg-gray-800 font-[Game_of_Squids] relative">
        <video
          src="https://res.cloudinary.com/dke15c3sv/video/upload/v1760723119/landing_wxbihl.mp4"
          autoPlay
          loop
          muted
          preload="metadata"
          poster="https://res.cloudinary.com/dke15c3sv/image/upload/v1760723161/landing_fqyvzy.jpg"
          className="h-screen w-full object-cover"
        ></video>

        <div className="absolute lg:top-[0vw] lg:left-[5vw] z-10 top-[10vw] left-[2vw]">
          <img
            src="https://www.radionitroz.in/assets/rnlogo-BNXsDXYE.png"
            alt=""
            className="h-30 lg:h-[8vw] w-auto object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
          />
        </div>
        {/*Prasanna Greyish-white Squid Game style title */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-0">
          <h1
            className="text-[20vw] sm:text-[14vw] md:text-[5vw] lg:text-[7vw] font-bold uppercase lg:tracking-tight leading-[18vw]
          font-['Game_of_Squids'] text-gray-200 animate-glowPulse"
          >
            Nexus Verse
          </h1>
        </div>

        <div className="overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:px-[5vw] top-[75%] lg:top-[70%] absolute items-center w-full  z-10 space-y-[2vh] lg:space-y-0">
            {/* Leaderboard Button */}
            <div
              onClick={handleToggleLeaderboard}
              className={`lg:rounded-[4vw] rounded-[4vh] overflow-hidden lg:h-[10vw] h-[8vh] w-[40vh] lg:w-[10vw] cursor-pointer relative  hover:scale-105 transition-transform ${
                showLeaderboard ? "opacity-0" : "opacity-100"
              }`}
            >
              <h1 className="absolute lg:hidden text-white uppercase text-[3.5vh] font-bold flex justify-center items-center w-full h-full">
                Leaderboard
              </h1>
              <video
                className="object-cover object-[50%_0%] w-full h-full"
                src="https://res.cloudinary.com/dke15c3sv/video/upload/v1760723100/trophy_pkjqvp.mp4"
                autoPlay
                muted
                loop
              />
              {isLeaderboardLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-opacity-50">
                  <div className="text-white text-[1vw]">Loading...</div>
                </div>
              )}
            </div>

            {/* Play Button */}
            <div
              className="relative flex lg:w-[25vw] justify-center group items-center cursor-pointer"
              onClick={() => setIsPanelOpen(true)}
            >
              {/* Play Circle Slide In */}
              <div className="hidden lg:block  flex items-center absolute z-10 -translate-x-[11vw] group-hover:translate-x-0 transition-transform duration-500 ease-out-in">
                <div className="w-[6vw] h-[6vw] bg-[#f10593d9] rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[2vw] border-l-white border-t-[1vw] border-t-transparent border-b-[1vw] border-b-transparent ml-[.5vw]" />
                </div>
              </div>

              {/* Video Box */}
              <div className="relative lg:w-[25vw] lg:h-[11vw] h-[11vh] w-[40vh] group overflow-hidden rounded-[2vh_2vh] lg:rounded-[2vh_0vh] [clip-path:polygon(10%_0%,90%_0%,100%_100%,0%_100%)] lg:[clip-path:polygon(10%_0%,100%_0%,100%_100%,0%_100%)] bg-gray-900 flex justify-center items-center">
                <span className="uppercase absolute font-bold text-white lg:text-[7vw] text-[8vh] tracking-[1vh] z-10">
                  Play
                </span>
                <video
                  className="w-full h-full object-cover"
                  src="https://player.vimeo.com/progressive_redirect/playback/1059748367/rendition/540p/file.mp4?loc=external&signature=ca5778ce895677c3e8c7df60a1a1bb046009392baecae686c2d2a9217621e43a&user_id=148208548"
                  autoPlay
                  loop
                  muted
                />
                <div className="absolute inset-0 bg-red-700 opacity-50 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              </div>
            </div>
          </div>

          {/* Rounds Sliding Panel */}
          <div
            className={`fixed top-0 right-0 h-full lg:w-[50vw] w-[40vh] bg-white z-50 transform transition-transform duration-500 ${
              isPanelOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsPanelOpen(false)}
              className={`${
                isPanelOpen ? "block" : "hidden"
              } absolute top-[50%] lg:left-[-5%] left-[-12%] lg:text-[2vw] text-[3vh] font-bold bg-[#f10593d9] text-white lg:w-[5vw] lg:h-[5vw] h-[10vh] w-[10vh] flex items-center justify-center rounded-full hover:animate-spin z-20`}
            >
              ✕
            </button>

            {/* Rounds Content */}
            <div className="py-[1vw] px-[3vw] space-y-[2vw] overflow-y-auto h-full">
              {Round.map((round, index) => (
                <div key={index} className="space-y-[.1vw]">
                  <div className="flex justify-between items-center px-[.5vw]">
                    <h2 className="text-black  text-[3vh] lg:text-[4vw] font-bold uppercase lg:tracking-tighter font-[GilM]">
                      {round.title}
                    </h2>
                    <span className="text-[3vh] lg:text-[4vw] font-extrabold">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="rounded-[2vw] relative overflow-hidden w-full lg:h-[25vw] h-[25vh] flex justify-center items-center bg-gray-900">
                    <span
                      onClick={() => handleRoundClick(round, index)}
                      className={`uppercase absolute font-bold cursor-pointer font-[GilM] ${
                        round.start ? "text-white" : "text-black"
                      } ${
                        round.start
                          ? "text-[10vh] lg:text-[7vw]"
                          : "text-[5vh] lg:text-[5vw]"
                      } tracking-tight z-10 w-full h-full flex justify-center items-center ${
                        round.start ? "opacity-100" : "opacity-50 bg-gray-100"
                      }`}
                    >
                      {round.start
                        ? round.completed
                          ? "Completed"
                          : "Play"
                        : "Coming soon"}
                    </span>

                    <video
                      className="w-full h-full object-cover"
                      src={round.video}
                      autoPlay
                      loop
                      muted
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Sliding Panel */}

          <div
            className={`font-[GilM] fixed top-0 left-0 h-full w-[40vh] lg:w-[40vw] bg-white/20  z-50 transform transition-transform duration-500 ${
              showLeaderboard ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLeaderboard(false)}
              className={`${
                showLeaderboard ? "block" : "hidden"
              } absolute top-[50%] right-[-5vh] lg:right-[-7%]  text-[3vh] lg:text-[2vw] font-bold bg-[#f10593d9] text-white lg:w-[5vw] w-[10vh] h-[10vh] lg:h-[5vw] flex items-center justify-center rounded-full hover:animate-spin z-50`}
            >
              ✕
            </button>

            {/* Leaderboard Header */}
            <div className="w-full flex flex-col items-center text-white my-[5vh] lg:my-[2vw]">
              <div className="lg:rounded-[4vw] rounded-full overflow-hidden lg:h-[10vw] h-[20vh] w-[20vh] lg:w-[10vw] cursor-pointer relative">
                <video
                  src="https://res.cloudinary.com/dke15c3sv/video/upload/v1760723100/trophy_pkjqvp.mp4"
                  autoPlay
                  loop
                  muted
                  preload="metadata"
                  poster=""
                  className="lg:h-[10vw] lg:w-[10vw] object-cover h-[20vh] w-[20vh]"
                ></video>
              </div>
              <h2 className="text-[5vh] lg:text-[2.5vw] font-bold uppercase text-center mt-[2vw] font-[GilM]">
                Leaderboard
              </h2>
            </div>

            {/* Leaderboard Content */}
            <div className="px-[2vw] space-y-[1vh] lg:space-y-[1vw] overflow-y-auto h-full">
              <ul className="lg:space-y-[.7vw] space-y-[1vh]  max-h-[75vh] overflow-y-auto pb-[10vw]">
                {leaderboard.length === 0 ? (
                  <li className="text-[3vh] lg:text-[1.5vw] text-white text-center py-[2vw]">
                    {isLeaderboardLoading ? "Loading..." : "No entries yet"}
                  </li>
                ) : (
                  <div className="lg:space-y-[.7vw] space-y-[1vh] overflow-hidden">
                    {leaderboard.map((entry, idx) => (
                      <li
                        key={entry._id}
                        className={`text-[2vh] lg:text-[1.7vw] uppercase font-medium flex justify-between items-center ${getMedalBackground(
                          idx
                        )} ${getMedalTextColor(
                          idx
                        )} rounded-[1vw] px-[1vh] py-[2vh] lg:px-[1.3vw] lg:py-[1vw] relative`}
                      >
                        <span className=" font-bold">#{idx + 1}</span>
                        <span className="truncate font-semibold max-w-[15vw]">
                          {entry.userId?.username || "Unknown User"}
                        </span>
                        <span className=" font-bold">
                          {entry.totalScore || 0}
                        </span>
                      </li>
                    ))}
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
