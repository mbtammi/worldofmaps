import Header from './Header'
import Footer from './Footer'
import './Layout.css'

function HowToPlay() {
  return (
    <div className="page-with-nav">
      <Header />
      
      <main className="page-content">
        <img src="/favicon.svg" width="52" height="52" alt="World of Maps educational globe icon" style={{float:'right',margin:'0 0 1rem 1rem'}} />
  <h1>How to Play the World of Maps Daily Geography Game</h1>
        
        <div className="instructions">
          <div className="step">
            <h2>1. 🌎 Analyze the Globe Visualization</h2>
            <p>Each country is shaded based on a real dataset (e.g. population density, life expectancy, GDP, renewable energy). Identify spatial clusters, outliers and continental contrasts.</p>
          </div>
          
          <div className="step">
            <h2>2. 🤔 Make a Data-Driven Guess</h2>
            <p>Enter or select what you think the dataset represents: demographics, economy, environment, health, infrastructure, technology or education indicators.</p>
          </div>
          
          <div className="step">
            <h2>3. 💡 Use Adaptive Hints</h2>
            <p>Each incorrect guess unlocks progressively stronger contextual hints—region bias, thematic clues or value range guidance—reinforcing learning rather than random trial.</p>
          </div>
          
          <div className="step">
            <h2>4. 🎉 Share & Compare</h2>
            <p>Post your spoiler-safe grid to friends or study groups. Encourage competition while spreading world data literacy.</p>
          </div>
        </div>
        
        <div className="tips">
          <h2>Tips for Faster Geography Recognition</h2>
          <ul>
            <li>Trace continent-by-continent intensity—does Africa lag or lead? Are Nordics clustered?</li>
            <li>Relate patterns to development, climate zones, resource access or demographics.</li>
            <li>Use hints strategically instead of brute forcing unrelated categories.</li>
            <li>Remember high-income economies often correlate with health, internet and education metrics.</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default HowToPlay