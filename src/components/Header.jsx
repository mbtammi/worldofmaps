import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

function Header({ theme, onThemeChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'game';
    if (path === '/landing') return 'home';
    return path.slice(1); // remove leading slash
  };

  const handleNavigation = (page) => {
    switch (page) {
      case 'home':
        navigate('/landing');
        break;
      case 'game':
        navigate('/');
        break;
      case 'about':
        navigate('/about');
        break;
      case 'howToPlay':
        navigate('/how-to-play');
        break;
      default:
        navigate('/landing');
    }
  };

  const currentPage = getCurrentPage();

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <h1 className="logo-text" onClick={() => handleNavigation('home')}>WorldOfTheMaps</h1>
        </div>
        
        <nav className="header-nav">
          <div className="nav-links">
            <button
              onClick={() => handleNavigation('game')}
              className={`nav-btn play-now-btn ${currentPage === 'game' ? 'nav-btn-active' : ''}`}
            >
              Play Now
            </button>
            <button
              onClick={() => handleNavigation('howToPlay')}
              className={`nav-btn ${currentPage === 'how-to-play' ? 'nav-btn-active' : ''}`}
            >
              How to Play
            </button>
            <button
              onClick={() => handleNavigation('about')}
              className={`nav-btn ${currentPage === 'about' ? 'nav-btn-active' : ''}`}
            >
              About
            </button>
          </div>
          
          {theme && onThemeChange && (
            <div className="theme-selector">
              <select 
                value={theme} 
                onChange={(e) => onThemeChange(e.target.value)}
                className="theme-select"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="color">Color</option>
              </select>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;