import './Layout.css'

function NotFound() {
  return (
    <div className="not-found">
      <h1>🗺️ Lost in the World</h1>
      <p>This page doesn't exist on our globe!</p>
      <div className="not-found-links">
        <a href="/">🎮 Play Today's Challenge</a>
        <a href="/landing">🏠 Go Home</a>
      </div>
    </div>
  )
}

export default NotFound