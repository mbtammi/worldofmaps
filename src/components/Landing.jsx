import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header'
import Footer from './Footer'
import './Landing.css'

function Landing() {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState('300+')

  // Placeholder: in future fetch from an API or analytics aggregate
  useEffect(() => {
    // Example: fetch('/api/players-today').then(r=>r.json()).then(d=> setPlayerCount(d.count))
    // For now keep static or derive from local heuristics
  }, [])

  return (
    <div className="landing-page">
      <Header />
      
      <main className="landing-main">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="landing-hero-content">
            <h1>Wordle, but for MAPS!</h1>
            <p className="landing-hero-subtitle">
              A daily geography puzzle game that challenges your knowledge of world data through beautiful 3D globe visualizations
            </p>
            <div className="games-counter">
              <span className="counter-text">Join <strong className="player-count-gradient">{playerCount}</strong> players worldwide!</span>
            </div>
            <button 
              onClick={() => navigate('/')} 
              className="landing-cta-button"
            >
              Play Today's Challenge
            </button>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="landing-features">
          <h2 className="landing-section-title">Why WorldOfTheMaps?</h2>
          <p className="landing-section-subtitle">
            Experience geography like never before with our immersive daily challenges
          </p>
          
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🌍</span>
              <h3>Interactive 3D Globe</h3>
              <p>Explore world data on a beautiful, rotating 3D globe with smooth controls and stunning visuals</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🎯</span>
              <h3>Daily Challenge</h3>
              <p>New mystery dataset every day - population, GDP, climate data and more. Never run out of puzzles!</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">💡</span>
              <h3>Smart Hints</h3>
              <p>Optional progressive hints help you learn. Enable them in settings to get contextual clues as you play</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">📊</span>
              <h3>Track Progress</h3>
              <p>Monitor your win rate, average guesses, and streaks. See how your geography knowledge improves!</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🎨</span>
              <h3>Beautiful Themes</h3>
              <p>Choose from Dark, Light, or Color modes. Each theme transforms the entire globe experience</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">⚡</span>
              <h3>Quick & Fun</h3>
              <p>Each puzzle takes just 2-5 minutes. Perfect for your coffee break or daily brain training</p>
            </div>
          </div>
        </section>

        {/* How to Play */}
        <section className="landing-features">
          <h2 className="landing-section-title">How to Play</h2>
          <p className="landing-section-subtitle">
            Simple rules, endless learning possibilities
          </p>
          
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <span className="landing-feature-icon">1️⃣</span>
              <h3>Study the Map</h3>
              <p>Look at the colors and patterns on the 3D globe. Each country is colored based on some data</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">2️⃣</span>
              <h3>Make Your Guess</h3>
              <p>Choose from multiple options what data you think the map is showing. Population? GDP? Something else?</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">3️⃣</span>
              <h3>Learn & Improve</h3>
              <p>Wrong guess? Get hints and try again! Right guess? Celebrate and learn fun facts about the data</p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}

export default Landing