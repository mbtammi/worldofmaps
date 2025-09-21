import './Footer.css'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p>&copy; 2025 World of Maps</p>
        <div className="footer-links">
          <a href="/about">About</a>
          <a href="/how-to-play">How to Play</a>
          <a href="https://github.com/worldofmaps" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer