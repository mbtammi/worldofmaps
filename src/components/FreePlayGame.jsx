import { useEffect, useState, useRef } from 'react'
import GlobeView from './GlobeView'
import { getAllAvailableDatasets } from '../data/dataSources'
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
    try {
      const all = getAllAvailableDatasets().filter(d => d.id) // basic filter
      if (!all.length) throw new Error('No datasets available')
      const random = all[Math.floor(Math.random()*all.length)]
      const full = await fetchDataset(random.id)
      const gs = createGameState(full)
      setGameState(gs)
      setStats(getLeaderboardData())
    } catch (e) {
      console.error('FreePlay: failed loading dataset', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRandomDataset() }, [])

  const handleGuess = (opt) => {
    if (!gameState || gameState.isComplete) return
    const newState = processGuess(gameState, opt)
    setGameState(newState)
    if (newState.isComplete) {
      finalizeGame(newState)
      setStats(getLeaderboardData())
    }
  }

  const handleThemeSwitch = () => {
    const next = getNextTheme(currentTheme)
    applyTheme(next)
    setCurrentTheme(next)
    setShowMenu(false)
  }

  if (loading || !gameState) {
    return <div className="daily-game"><div className="loading"><div className="loading-globe">🌍</div><div>Loading random map...</div></div></div>
  }

  return (
    <div className="daily-game">
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
