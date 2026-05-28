import Header from './Header'
import Footer from './Footer'
import SEO from './SEO'
import { ROUTE_META } from '../seo/routeMeta'
import './Layout.css'

function HowToPlay() {
  return (
    <div className="page-with-nav">
      <SEO {...ROUTE_META['/how-to-play']} />
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
            <h2>3. 🎯 Narrow It Down</h2>
            <p>If your first guess is wrong, the remaining options stay on screen so you can refine your thinking. The fewer tries you need, the better your score — and you carry that intuition into the next day's map.</p>
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
            <li>Eliminate quickly: rule out options that clearly don't match the regional pattern.</li>
            <li>Remember high-income economies often correlate with health, internet and education metrics.</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default HowToPlay