import './Header.css'

function Header() {
  return (
    <header className="site-header">
      <nav className="main-nav">
        <h1 className="site-title">🌍 World of Maps</h1>
        <div className="nav-links">
          <a href="/landing">Home</a>
          <a href="/about">About</a>
          <a href="/how-to-play">How to Play</a>
          <a href="/" className="play-now-btn">Play Now</a>
        </div>
      </nav>
    </header>
  )
}

export default Header