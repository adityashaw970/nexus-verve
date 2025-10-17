import React, { useState, useEffect } from 'react';
import './Preloader.css';

const Preloader = ({ onLoadComplete }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (3 seconds)
    const timer = setTimeout(() => {
      setLoading(false);
      if (onLoadComplete) {
        onLoadComplete();
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  if (!loading) return null;

  return (
    <div className="preloader-container">
      <video autoPlay loop muted className="preloader-video">
        <source src="/pre2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="preloader-text-box">
        <h1 className="text-[14vw] sm:text-[10vw] md:text-[8vw] lg:text-[8vw] font-bold uppercase tracking-tight 
          font-['Game_of_Squids'] text-gray-200 animate-glowPulse">NEXUS VERSE</h1>
       
      </div>
    </div>
  );
};

// Demo wrapper component
const App = () => {
  const [showContent, setShowContent] = useState(false);

  return (
    <>
      <Preloader onLoadComplete={() => setShowContent(true)} />
      {showContent && (
        <div style={{ 
          padding: '50px', 
          textAlign: 'center',
          minHeight: '100vh',
          background: '#f0f0f0'
        }}>
          <h1>Welcome!</h1>
          <p>Content loaded successfully</p>
        </div>
      )}
    </>
  );
};

export default App;