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
        
        <div className="footer-right">
          <div className="footer-links">
            <button
              onClick={() => handleNavigation('about')}
              className="footer-link"
            >
              About
            </button>
            <button
              onClick={() => handleNavigation('howToPlay')}
              className="footer-link"
            >
              How to Play
            </button>
            <a
              href="mailto:mirotammi44@gmail.com"
              className="footer-link footer-email"
            >
              Email Me!
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;