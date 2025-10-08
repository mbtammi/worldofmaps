import './Layout.css'

function NotFound() {
  return (
    <div className="not-found">
      <h1>Page Not Found – Explore a Real Geography Game Instead</h1>
      <p>The URL you tried doesn’t exist. While you’re here, try the daily geography & world data guessing game or learn how to play.</p>
      <ul className="not-found-suggestions">
        <li><a href="/">Play the Daily Geography Challenge</a></li>
        <li><a href="/play">Try Free Play Mode</a></li>
        <li><a href="/how-to-play">How to Play & Tips</a></li>
        <li><a href="/about">About World of Maps</a></li>
        <li><a href="/landing">Visit the Landing Page</a></li>
      </ul>
      <p style={{fontSize:'0.85rem',opacity:0.7}}>If you believe this is an error, you can reload or return to the previous page.</p>
    </div>
  )
}

export default NotFound