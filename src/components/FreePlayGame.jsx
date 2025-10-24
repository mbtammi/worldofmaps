import { useEffect, useState, useRef } from 'react'
import GlobeView from './GlobeView'
import { getAuthenticDatasets } from '../data/dataSources'
import { fetchDataset } from '../data/dataFetcher'
import { createGameState, processGuess, finalizeGame } from '../data/gameManager'
import { getLeaderboardData } from '../data/gameStats'
import { getAllThemes, getNextTheme, applyTheme, initializeTheme } from '../data/themeManager'
import './DailyGame.css'

// Free play mode: user can play unlimited random datasets (excluding today's) without affecting streak
export default function FreePlayGame() {
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([])
  const [currentTheme, setCurrentTheme] = useState('dark')
  const [showTooltips, setShowTooltips] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [drawerCollapsed, setDrawerCollapsed] = useState(false)
  const [showHandlePulse, setShowHandlePulse] = useState(true)
  const [loadingSlowWarning, setLoadingSlowWarning] = useState(false)
  const [missedGuessToast, setMissedGuessToast] = useState(false)
  const leftOptionsRef = useRef(null)
  const drawerTouch = useRef({ startY: 0, lastY: 0, dragging: false })

  useEffect(() => {
    const theme = initializeTheme()
    setCurrentTheme(theme)
  }, [])

  // Remove handle pulse after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHandlePulse(false), 6000)
    return () => clearTimeout(timer)
  }, [])

  // Drawer gesture handlers (mobile only)
  useEffect(() => {
    if (!leftOptionsRef.current) return
    const el = leftOptionsRef.current
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (!isMobile) return

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      drawerTouch.current.startY = touch.clientY
      drawerTouch.current.lastY = touch.clientY
      drawerTouch.current.dragging = true
    }
    const handleTouchMove = (e) => {
      if (!drawerTouch.current.dragging) return
      const touch = e.touches[0]
      drawerTouch.current.lastY = touch.clientY
    }
    const handleTouchEnd = () => {
      if (!drawerTouch.current.dragging) return
      const delta = drawerTouch.current.lastY - drawerTouch.current.startY
      // If user swiped down enough, collapse; if swiped up enough, expand
      if (delta > 40) setDrawerCollapsed(true)
      else if (delta < -40) setDrawerCollapsed(false)
      drawerTouch.current.dragging = false
    }
    // Attach only to the handle area
    const handleEl = document.getElementById('drawer-handle-touch-freeplay')
    if (handleEl) {
      handleEl.addEventListener('touchstart', handleTouchStart, { passive: true })
      handleEl.addEventListener('touchmove', handleTouchMove, { passive: true })
      handleEl.addEventListener('touchend', handleTouchEnd)
      handleEl.addEventListener('touchcancel', handleTouchEnd)
    }
    return () => {
      if (handleEl) {
        handleEl.removeEventListener('touchstart', handleTouchStart)
        handleEl.removeEventListener('touchmove', handleTouchMove)
        handleEl.removeEventListener('touchend', handleTouchEnd)
        handleEl.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [leftOptionsRef, drawerCollapsed])

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

  const loadRandomDataset = async () => {
    setLoading(true)
    setLoadingSlowWarning(false)
    
    // Set timeout to show slow loading warning after 15 seconds
    const slowLoadTimer = setTimeout(() => {
      if (loading) {
        setLoadingSlowWarning(true)
      }
    }, 15000)
    
    try {
      const authenticDatasets = getAuthenticDatasets().filter(d => d.id) // Only use datasets with authentic data
      if (!authenticDatasets.length) throw new Error('No authentic datasets available')
      
      console.log(`🎲 Available authentic datasets: ${authenticDatasets.length}`)
      
      // Keep trying random datasets until we find one that works (with fallback limit)
      let attempts = 0
      const maxAttempts = 10
      
      while (attempts < maxAttempts) {
        try {
          const random = authenticDatasets[Math.floor(Math.random() * authenticDatasets.length)]
          console.log(`🎯 Trying dataset: ${random.id} (attempt ${attempts + 1})`)
          
          const full = await fetchDataset(random.id)
          const gs = createGameState(full)
          setGameState(gs)
          setStats(getLeaderboardData(full))
          console.log(`✅ Successfully loaded dataset: ${random.id}`)
          clearTimeout(slowLoadTimer)
          return // Success! Exit the function
          
        } catch (datasetError) {
          console.warn(`⚠️ Dataset ${authenticDatasets[Math.floor(Math.random() * authenticDatasets.length)]?.id} failed, trying another...`, datasetError.message)
          attempts++
        }
      }
      
      // If we get here, all attempts failed
      clearTimeout(slowLoadTimer)
      throw new Error(`Failed to load any dataset after ${maxAttempts} attempts`)
      
    } catch (e) {
      console.error('FreePlay: failed loading dataset', e)
      // Set a loading error state instead of leaving it stuck
      clearTimeout(slowLoadTimer)
      setGameState(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRandomDataset() }, [])

  const handleGuess = (opt) => {
    if (!gameState || gameState.isComplete) return
    const newState = processGuess(gameState, opt)
    
    // Show missed guess toast if guess was wrong
    if (!newState.isWon && newState.guesses.length > gameState.guesses.length) {
      setMissedGuessToast(true)
      setTimeout(() => setMissedGuessToast(false), 2500)
    }
    
    setGameState(newState)
    if (newState.isComplete) {
      finalizeGame(newState)
      setStats(getLeaderboardData(newState.dataset))
    }
  }

  const handleThemeSwitch = () => {
    const next = getNextTheme(currentTheme)
    applyTheme(next)
    setCurrentTheme(next)
    setShowMenu(false)
  }

  if (loading) {
    return (
      <div className="daily-game">
        <div className="loading">
          <div className="loading-globe">🌍</div>
          <div>Loading random map...</div>
          {loadingSlowWarning && (
            <div className="loading-slow-warning">
              ⏱️ Taking longer than expected... Please hold on.
            </div>
          )}
        </div>
      </div>
    )
  }
  
  if (!gameState) {
    return (
      <div className="daily-game">
        <div className="loading">
          <div className="loading-globe">⚠️</div>
          <div>Failed to load dataset</div>
          <button 
            className="option-btn" 
            onClick={loadRandomDataset}
            style={{ marginTop: '10px' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="daily-game">
      {/* Missed guess toast */}
      {missedGuessToast && (
        <div style={{position:'fixed',top:8,left:'50%',transform:'translateX(-50%)',background:'rgba(220,53,69,0.9)',backdropFilter:'blur(6px)',padding:'8px 16px',borderRadius:24,fontSize:'0.85em',zIndex:160,display:'flex',alignItems:'center',gap:8,animation:'slideDown 0.3s ease'}}>
          {/* <span> Incorrect</span> */}
          <span style={{opacity:0.85}}>❌ Try again!</span>
        </div>
      )}
      <GlobeView dataset={gameState.dataset} showTooltips={showTooltips} />
      <div className="top-left-title">Free Play</div>
      <div className="top-right-controls">
        <button className="control-btn" onClick={() => window.location.href = '/landing'}>⌂</button>
        <button className="control-btn" onClick={handleThemeSwitch}>{getAllThemes().find(t=>t.id===currentTheme)?.icon || '🌙'}</button>
        <div className="menu-container">
          <button className="control-btn" onClick={() => setShowMenu(!showMenu)}>⋯</button>
          {showMenu && (
            <div className="dropdown-menu">
              <button className="menu-item" onClick={() => { setShowTooltips(!showTooltips); setShowMenu(false) }}>{showTooltips ? '🗺 Hide Countries' : '🗺 Show Countries'}</button>
              <button className="menu-item" onClick={() => { setShowMenu(false); loadRandomDataset() }}>🔁 New Random Map</button>
              <button className="menu-item" onClick={() => setShowMenu(false)}>📊 Stats (Daily only)</button>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Middle - Stats */}
      <div className="right-leaderboard">
        <h4>Game Stats</h4>
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
      
      {/* Left Side - Game Options with mobile drawer */}
      <div 
        className={`left-options ${drawerCollapsed ? 'drawer-collapsed' : ''} ${showHandlePulse ? 'drawer-pulse' : ''}`}
        ref={leftOptionsRef}
      >
        {/* Mobile drawer handle */}
        <button
          id="drawer-handle-touch-freeplay"
          type="button"
          className="drawer-handle"
          aria-label={drawerCollapsed ? 'Expand options' : 'Collapse options'}
          onClick={() => setDrawerCollapsed(!drawerCollapsed)}
        >
          <div className="drawer-handle-bar" />
        </button>
        
        {!gameState.isComplete && (
          !drawerCollapsed && (
            <>
              <div style={{
                fontSize: '0.9em',
                fontWeight: '600',
                marginBottom: '12px',
                textAlign: 'center',
                color: 'var(--textSecondary)',
                opacity: 0.9
              }}>
                Select the data this map represents:
              </div>
              <div className="options-grid">
                {gameState.availableOptions.map((option, index) => (
                  <button
                    key={index}
                    className="option-btn"
                    onClick={() => handleGuess(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )
        )}
        {gameState.isComplete && (
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
            <button className="play-again-btn" onClick={loadRandomDataset}>
              Play Another
            </button>
          </div>
        )}
        
        {/* Previous guesses */}
        {gameState.guesses.length > 0 && !drawerCollapsed && (
          <div className="guesses-summary">
            <p>Guesses: {gameState.guesses.length}</p>
          </div>
        )}
      </div>
    </div>
  )
}
