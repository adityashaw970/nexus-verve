//profile.jsx
import { useEffect, useState } from "react";
import LandingPage from "./LandingPage.jsx";

const Profile = () => {
  const [user, setUser] = useState("null");
  const API_URL = "https://nexus-verve.onrender.com";

  useEffect(() => {
    const checkLoggedIn = async () => {
      const res = await fetch(`${API_URL}/auth/status`, {
        method: "GET",
        credentials: "include", // important for sending cookies
      });

      const msg = await res.json();
      if (msg.loggedIn && msg.user?.email) {
        setUser(msg.user.username);
      }
      if (window.location.href === `${API_URL}/profile`) {
        if (!msg.loggedIn || res.status === 404 || !msg.user?.email) {
          window.location.href = "/";
        }
      }
    };

    checkLoggedIn();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/logout`, {
        method: "GET",
        credentials: "include",
      });
      const msg = await res.text();
      alert(msg);

      // ✅ Clear both localStorage AND sessionStorage
      localStorage.clear();
      sessionStorage.clear(); // ADD THIS

      window.location.href = "/";
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <div className="absolute z-2 w-full flex justify-end py-[5vh] px-[1vh] lg:p-[2vw] font-[GilM]">
        <div className="flex flex-col lg:flex-row  lg:justify-center items-end lg:items-center gap-4">
          <h1 className="lg:text-[1.3vw] text-white ">
            Welcome,{" "}
            <span className="text-orange-200">
              {user ? user : "Loading..."}
            </span>
          </h1>
          <button
            onClick={handleLogout}
            className=" lg:px-[2vw] lg:py-[.8vw] bg-red-600 rounded-md active:scale-95 cursor-pointer text-[2vh] px-[4vh] py-[1vh] lg:text-[1vw] text-white font-semibold uppercase"
          >
            Logout
          </button>
        </div>
      </div>

      <LandingPage />
    </div>
  );
};

export default Profile;
