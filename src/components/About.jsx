import Header from './Header'
import Footer from './Footer'
import './Layout.css'

function About() {
  return (
    <div className="page-with-nav">
      <Header />
      
      <main className="page-content">
        <h2>About World of Maps</h2>
        <p>
          World of Maps is inspired by Wordle and GeoGuessr, challenging players 
          to identify what dataset a mysterious 3D globe represents.
        </p>
        
        <h3>Our Mission</h3>
        <p>
          Make geography and data literacy fun, accessible, and shareable. 
          One globe at a time.
        </p>
        
        <h3>Data Sources</h3>
        <ul>
          <li>Our World in Data</li>
          <li>World Bank Open Data</li>
          <li>UN Data</li>
          <li>Kaggle Datasets</li>
        </ul>
      </main>
      
      <Footer />
    </div>
  )
}

export default About