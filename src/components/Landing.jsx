import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header'
import Footer from './Footer'
import './Landing.css'

function Landing() {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState('469+')

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
            <h1>Daily Geography Game on a 3D Globe</h1>
            <p className="landing-hero-subtitle">
              Play a free daily geography & world data guessing game. Like GeoGuessr meets Wordle: identify real global datasets (GDP, population density, life expectancy, energy use, internet access and more) from an interactive 3D map.
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
            <div style={{ marginTop: '1.5rem' }}>
              <a href="https://launchigniter.com/product/world-of-maps?ref=badge-world-of-maps" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://launchigniter.com/api/badge/world-of-maps?theme=dark" 
                  alt="Featured on LaunchIgniter" 
                  width="212" 
                  height="55" 
                  style={{ border: 'none', display: 'block', margin: '0 auto' }}
                />
              </a>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="landing-features">
          <h2 className="landing-section-title">Why Play This Geography & World Data Game?</h2>
          <p className="landing-section-subtitle">
            Learn real global statistics while having fun. Build geography literacy, spot global patterns, and challenge friends.
          </p>
          
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🌍</span>
              <h3>Interactive 3D Globe Visualization</h3>
              <p>Explore authentic world datasets on a smooth, rotating globe. Visual patterns teach economic, demographic, health and environmental trends.</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🎯</span>
              <h3>Daily Geography Challenge</h3>
              <p>Fresh mystery dataset every day: population density, GDP per capita, forest coverage, renewable energy, literacy rate, healthcare spending and more.</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">💡</span>
              <h3>Progressive Learning Hints</h3>
              <p>Optional contextual hints reinforce geography and data literacy without spoiling the answer.</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">📊</span>
              <h3>Track Performance & Streaks</h3>
              <p>Monitor win rate, guess efficiency and solving streaks. See your mastery of world statistics improve.</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🎨</span>
              <h3>Accessible Visual Themes</h3>
              <p>Light, dark and color-rich modes designed for clarity and immersion on desktop & mobile.</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">⚡</span>
              <h3>Fast, Brain-Friendly Sessions</h3>
              <p>Each puzzle takes 2–5 minutes—perfect for daily learning, classrooms or competitive sharing.</p>
            </div>
          </div>
        </section>

        {/* How to Play */}
        <section className="landing-features">
          <h2 className="landing-section-title">How to Play the Daily Geography Guessing Game</h2>
          <p className="landing-section-subtitle">
            Simple mechanics, high replay value: guess the dataset, learn the world.
          </p>
          
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <span className="landing-feature-icon">1️⃣</span>
              <h3>Study the World Map</h3>
              <p>Observe color gradients and regional clusters. Are high values in wealthy nations? Coastal regions? Tropical zones? Pattern recognition is key.</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">2️⃣</span>
              <h3>Guess the Dataset</h3>
              <p>Select the concept: population density, GDP per capita, internet usage, healthcare spending, energy metrics, demographics and more.</p>
            </div>
            
            <div className="landing-feature-card">
              <span className="landing-feature-icon">3️⃣</span>
              <h3>Learn & Retain World Knowledge</h3>
              <p>Each solved puzzle reveals a bite-sized fact and reinforces global awareness. Ideal for students, teachers, trivia fans and lifelong learners.</p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}

export default Landing