import { useState, useEffect } from 'react'
import GlobeView from './GlobeView'
import { getTodaysDataset, createGameState, processGuess } from '../data/gameManager'
import './DailyGame.css'

function DailyGame() {
  const [gameState, setGameState] = useState(null)

  // Initialize game on component mount
  useEffect(() => {
    const dataset = getTodaysDataset()
    const initialGameState = createGameState(dataset)
    setGameState(initialGameState)
  }, [])

  const handleOptionSelect = (selectedOption) => {
    if (gameState && !gameState.isComplete) {
      const newGameState = processGuess(gameState, selectedOption)
      setGameState(newGameState)
    }
  }

  // Show loading if game state isn't ready
  if (!gameState) {
    return (
      <div className="daily-game">
        <div className="loading">Loading today's challenge...</div>
      </div>
    )
  }

  return (
    <div className="daily-game">
      {/* Fullscreen Globe Background */}
      <GlobeView dataset={gameState.dataset} />
      
      {/* Top Left - Game Title */}
      <div className="top-left-title">
        worldofmaps
      </div>
      
      {/* Top Right - Controls */}
      <div className="top-right-controls">
        <button className="control-btn" onClick={() => window.location.href = '/landing'}>
          🏠
        </button>
        <button className="control-btn">
          🎨
        </button>
        <button className="control-btn">
          ⋯
        </button>
      </div>
      
      {/* Right Middle - Leaderboard */}
      <div className="right-leaderboard">
        <h4>Daily Stats</h4>
        <div className="stat-item">
          <span>Avg Guesses:</span>
          <span>3.2</span>
        </div>
        <div className="stat-item">
          <span>Success Rate:</span>
          <span>87%</span>
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