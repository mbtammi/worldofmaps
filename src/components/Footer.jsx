import { useNavigate } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (page) => {
    switch (page) {
      case 'about':
        navigate('/about');
        break;
      case 'howToPlay':
        navigate('/how-to-play');
        break;
      default:
        break;
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <p className="footer-copyright">© 2025 WorldOfTheMaps - Guess the Globe, Master the World!</p>
        </div>
        
        <div className="footer-right" aria-label="Site navigation footer links">
          <div className="footer-links" role="navigation">
            <button
              onClick={() => handleNavigation('about')}
              className="footer-link"
              aria-label="About World of Maps daily geography game"
            >
              About Game
            </button>
            <button
              onClick={() => handleNavigation('howToPlay')}
              className="footer-link"
              aria-label="How to play the geography data guessing game"
            >
              How to Play
            </button>
            <a
              href="https://worldofthemaps.com/landing"
              className="footer-link"
              aria-label="Geography game home page"
            >Home</a>
            <a
              href="mailto:mirotammi44@gmail.com"
              className="footer-link footer-email"
              aria-label="Contact the creator by email"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;