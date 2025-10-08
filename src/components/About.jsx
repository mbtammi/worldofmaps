import Header from './Header'
import Footer from './Footer'
import './Layout.css'

function About() {
  return (
    <div className="page-with-nav">
      <Header />
      
      <main className="page-content">
        <img src="/favicon.svg" width="56" height="56" alt="World of Maps circular globe icon" style={{float:'right',margin:'0 0 1rem 1rem'}} />
  <h1>About World of Maps – Daily Geography & Data Guessing Game</h1>
        <p>
          World of Maps is a free daily geography game inspired by the addictive clarity of Wordle and the exploration spirit of GeoGuessr. Each day you analyze an interactive 3D globe shaded by a real-world dataset and guess what it represents—population density, GDP per capita, renewable energy, life expectancy, internet users, and many more global indicators.
        </p>
        
  <h2>Our Mission: Elevate Geography & Data Literacy</h2>
        <p>
          We aim to turn raw global statistics into intuitive visual puzzles that build pattern recognition, critical thinking and factual retention. Geography knowledge becomes sticky when you interact with real datasets instead of memorizing trivia lists.
        </p>
        
  <h2>Authentic Open Data Sources</h2>
        <p>All datasets are derived from reputable open data providers to ensure educational credibility:</p>
        <ul>
          <li>World Bank Open Data (economic, demographic, infrastructure & development indicators)</li>
          <li>Our World in Data (long-run health, environment & societal metrics)</li>
          <li>United Nations and affiliated statistical collections</li>
          <li>Curated, reviewed static backups for resilience</li>
        </ul>
        <p>
          No synthetic filler stats—only authentic, sourced indicators. This makes World of Maps useful for classrooms, trivia communities, lifelong learners and anyone seeking a GeoGuessr-style alternative focused on data instead of locations.
        </p>
  <h2>Who Is It For?</h2>
        <ul>
          <li>Students & educators building global awareness</li>
          <li>Quiz and trivia enthusiasts seeking higher depth</li>
          <li>Data-curious professionals sharpening pattern intuition</li>
          <li>GeoGuessr players wanting a complementary daily challenge</li>
        </ul>
  <h2>Shareable Learning</h2>
        <p>
          After solving, you can share a spoiler‑safe result grid—encouraging organic growth and friendly competition while spreading geography literacy.
        </p>
      </main>
      
      <Footer />
    </div>
  )
}

export default About