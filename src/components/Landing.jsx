import Header from './Header'
import Footer from './Footer'
import './Layout.css'

function Landing() {
  return (
    <div className="landing-page">
      <Header />
      
      <main>
        <section className="hero">
          <h2>Guess the Globe, Master the World!</h2>
          <p>A daily geography puzzle game that challenges your knowledge of world data</p>
          <a href="/" className="cta-button">Play Today's Challenge</a>
        </section>
        
        <section className="features">
          <div className="feature">
            <h3>🗺️ Daily Challenge</h3>
            <p>New mystery map every day</p>
          </div>
          <div className="feature">
            <h3>🎯 Smart Hints</h3>
            <p>Get clues with each guess</p>
          </div>
          <div className="feature">
            <h3>📊 Share Results</h3>
            <p>Wordle-style sharing</p>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}

export default Landing