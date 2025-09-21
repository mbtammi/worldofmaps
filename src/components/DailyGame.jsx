import { useState, useEffect } from 'react'
import GlobeView from './GlobeView'
import { getTodaysDataset, createGameState, processGuess, finalizeGame, toggleHints } from '../data/gameManager'
import { getLeaderboardData } from '../data/gameStats'
import { initializeTheme, getNextTheme, applyTheme, getCurrentTheme, getAllThemes } from '../data/themeManager'
import './DailyGame.css'

function DailyGame() {
  const [gameState, setGameState] = useState(null)
  const [showTooltips, setShowTooltips] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTheme, setCurrentTheme] = useState('dark')

  // Initialize theme on mount
  useEffect(() => {
    const theme = initializeTheme()
    setCurrentTheme(theme)
  }, [])

  // Theme switching handler
  const handleThemeSwitch = () => {
    const nextTheme = getNextTheme(currentTheme)
    applyTheme(nextTheme)
    setCurrentTheme(nextTheme)
    setShowMenu(false)
  }

  // Hints toggle handler
  const handleHintsToggle = () => {
    if (gameState) {
      const newGameState = toggleHints(gameState)
      setGameState(newGameState)
      setShowMenu(false)
    }
  }

  // Initialize game on component mount
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true)
        console.log('DailyGame: Initializing game...')
        
        const dataset = await getTodaysDataset()
        console.log('DailyGame: Dataset loaded:', dataset.title)
        
        const initialGameState = createGameState(dataset)
        setGameState(initialGameState)
        
        // Load stats for display
        const currentStats = getLeaderboardData()
        setStats(currentStats)
        
        console.log('DailyGame: Game initialized successfully')
      } catch (error) {
        console.error('DailyGame: Failed to initialize game:', error)
        // TODO: Show error message to user
        // For now, we'll just keep loading state showing
      } finally {
        setLoading(false)
      }
    }
    
    initializeGame()
  }, [])

  // Auto-hide instructions after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false)
    }, 10000) // 10 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleOptionSelect = (selectedOption) => {
    if (gameState && !gameState.isComplete) {
      const newGameState = processGuess(gameState, selectedOption)
      setGameState(newGameState)
      
      // If game is complete, finalize it and update stats
      if (newGameState.isComplete) {
        finalizeGame(newGameState)
        // Refresh stats display
        const updatedStats = getLeaderboardData()
        setStats(updatedStats)
      }
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  // Show loading if game state isn't ready
  if (loading || !gameState) {
    return (
      <div className="daily-game">
        <div className="loading">
          <div className="loading-globe">🌍</div>
          <div>Loading today's data challenge...</div>
          <div className="loading-subtitle">Fetching live data from global sources</div>
        </div>
      </div>
    )
  }

  return (
    <div className="daily-game">
      {/* Fullscreen Globe Background */}
      <GlobeView dataset={gameState.dataset} showTooltips={showTooltips} />
      
      {/* Top Left - Game Title */}
      <div className="top-left-title">
        worldofthemaps
      </div>
      
      {/* Game Instructions Header */}
      <div className={`game-instructions ${!showInstructions ? 'fade-out' : ''}`}>
        Guess what data this map is presenting?
      </div>
      
      {/* Top Right - Controls */}
      <div className="top-right-controls">
        <button className="control-btn" onClick={() => window.location.href = '/landing'}>
          ⌂
        </button>
        <button className="control-btn" onClick={handleThemeSwitch}>
          {getAllThemes().find(t => t.id === currentTheme)?.icon || '🌙'}
        </button>
        <div className="menu-container">
          <button className="control-btn" onClick={() => setShowMenu(!showMenu)}>
            ⋯
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <button 
                className="menu-item" 
                onClick={() => {
                  setShowTooltips(!showTooltips)
                  setShowMenu(false)
                }}
              >
                {showTooltips ? '� Hide Countries' : '� Show Countries'}
              </button>
              <button 
                className="menu-item" 
                onClick={handleHintsToggle}
              >
                {gameState?.hintsEnabled ? '💡 Disable Hints' : '💡 Enable Hints'}
              </button>
              {/* <button 
                className="menu-item" 
                onClick={handleThemeSwitch}
              >
                🎨 Theme: {getAllThemes().find(t => t.id === currentTheme)?.name || 'Dark'}
              </button> */}
              <button 
                className="menu-item" 
                onClick={() => setShowMenu(false)}
              >
                📊 Stats (Not yet...)
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Middle - Leaderboard */}
      <div className="right-leaderboard">
        <h4>Your Stats</h4>
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <span>{stat.label}:</span>
            <span>{stat.value}</span>
          </div>
        ))}
        <div className="legend-gradient"></div>
        <div className="legend-labels">
          <span>Min</span>
          <span>Max</span>
        </div>
      </div>
      
      {/* Left Side - Game Options */}
      <div className="left-options">
        {/* Current hint if available */}
        {gameState.currentHint && (
          <div className="hint-display">
            💡 {gameState.currentHint}
          </div>
        )}
        
        {!gameState.isComplete ? (
          <div className="options-grid">
            {gameState.availableOptions.map((option, index) => (
              <button
                key={index}
                className="option-btn"
                onClick={() => handleOptionSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          // Game completed - show results
          <div className="game-results">
            {gameState.isWon ? (
              <div className="win-message">
                <h2>🎉 Correct!</h2>
                <p>The answer was: <strong>{gameState.dataset.title}</strong></p>
                <p className="fun-fact">{gameState.dataset.funFact}</p>
              </div>
            ) : (
              <div className="lose-message">
                <h2>😔 Game Over!</h2>
                <p>The answer was: <strong>{gameState.dataset.title}</strong></p>
                <p>{gameState.dataset.description}</p>
              </div>
            )}
            <button className="play-again-btn" onClick={() => window.location.reload()}>
              Play Again Tomorrow
            </button>
          </div>
        )}
        
        {/* Previous guesses */}
        {gameState.guesses.length > 0 && (
          <div className="guesses-summary">
            <p>Guesses: {gameState.guesses.length}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyGame