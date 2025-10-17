import React, { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import LoginSignup from "./components/LoginSignup";
import Profile from "./components/Profile";
import LandingPage from "./components/LandingPage";
import Round from "./components/Round";
import Score from "./components/Score";
import Preloade from './Preloade';
import './Preloader.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (3 seconds)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
     
      
      <Routes>
          <Route path="/" element={ <>
             {loading && <Preloade />}
          <LandingPage /></>} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/round1" element={<Round />} />
          <Route path="/round2" element={<Round />} />
          <Route path="/round3" element={<Round />} />
          <Route path="/round4" element={<Round />} />
          <Route path="/score" element={<Score />} />
        </Routes>
    </>
  );
}

export default App;