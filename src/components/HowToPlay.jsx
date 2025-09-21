import Header from './Header'
import Footer from './Footer'
import './Layout.css'

function HowToPlay() {
  return (
    <div className="page-with-nav">
      <Header />
      
      <main className="page-content">
        <h2>How to Play</h2>
        
        <div className="instructions">
          <div className="step">
            <h3>1. 🌎 Study the Globe</h3>
            <p>Look at the colored regions on the 3D globe. Different colors represent different data values.</p>
          </div>
          
          <div className="step">
            <h3>2. 🤔 Make Your Guess</h3>
            <p>Type what you think the map shows (e.g., "population density", "coffee consumption").</p>
          </div>
          
          <div className="step">
            <h3>3. 💡 Get Hints</h3>
            <p>Wrong guesses reveal helpful clues to guide you toward the answer.</p>
          </div>
          
          <div className="step">
            <h3>4. 🎉 Share Your Results</h3>
            <p>Once solved, share your results with friends using our Wordle-style grid!</p>
          </div>
        </div>
        
        <div className="tips">
          <h3>Tips for Success</h3>
          <ul>
            <li>Look for patterns in the data distribution</li>
            <li>Consider both serious data (economics, climate) and fun data (coffee, music)</li>
            <li>Use hints wisely - they get more specific with each wrong guess</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default HowToPlay