import { useState, useEffect, useRef } from 'react'
import GlobeView from './GlobeView'
import { getTodaysDataset, createGameState, processGuess, finalizeGame, toggleHints } from '../data/gameManager'
import { hasPlayedToday, markTodayAsPlayed } from '../data/dailyChallenge'
import { getLeaderboardData } from '../data/gameStats'
import { submitGlobalResult, fetchDailyGlobalStats } from '../data/globalStatsClient'
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
  const leftOptionsRef = useRef(null)
  const [alreadyPlayedModal, setAlreadyPlayedModal] = useState(false)
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [globalAvg, setGlobalAvg] = useState(null)
  const [drawerCollapsed, setDrawerCollapsed] = useState(false)
  const drawerTouch = useRef({ startY: 0, lastY: 0, dragging: false })
  const [showHandlePulse, setShowHandlePulse] = useState(true)

  // Initialize theme on mount
  useEffect(() => {
    const theme = initializeTheme()
    setCurrentTheme(theme)
  }, [])

  // Remove handle pulse after a few seconds
  useEffect(()=>{
    const t = setTimeout(()=> setShowHandlePulse(false), 6000)
    return ()=> clearTimeout(t)
  },[])

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

        // Attempt to load saved progress
        try {
          const dayKey = `worldofmaps_daily_progress_${dataset.challengeInfo?.dayIndex || 'unknown'}`
          const savedRaw = localStorage.getItem(dayKey)
          if (savedRaw) {
            const saved = JSON.parse(savedRaw)
            if (saved.datasetId === dataset.id) {
              // Rebuild game state
              const restored = {
                ...initialGameState,
                guesses: saved.guesses || [],
                isComplete: saved.isComplete || false,
                isWon: saved.isWon || false,
                availableOptions: saved.availableOptions || initialGameState.availableOptions,
                incorrectOptions: saved.incorrectOptions || [],
              }
              setGameState(restored)
              if (restored.isComplete) {
                // Mark as played (in case) and show modal optionally
                markTodayAsPlayed()
              }
            } else {
              setGameState(initialGameState)
            }
          } else {
            setGameState(initialGameState)
          }
        } catch (e) {
          console.warn('Failed to restore saved progress', e)
          setGameState(initialGameState)
        } finally {
          setProgressLoaded(true)
        }
        
        // Load stats for display
        const currentStats = getLeaderboardData(dataset)
        setStats(currentStats)
        // Attempt to load cached global avg first (for instant display)
        try {
          const dayIndex = dataset?.challengeInfo?.dayIndex
          if (dayIndex != null) {
            const cacheKey = `worldofmaps_global_avg_${dayIndex}`
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
              const num = parseFloat(cached)
              if (!Number.isNaN(num)) setGlobalAvg(num)
            }
            // Kick off fresh fetch (non-blocking)
            fetchDailyGlobalStats(dayIndex).then(data => {
              if (data && typeof data.avgGuesses === 'number') {
                const rounded = Math.round(Number(data.avgGuesses) * 10) / 10
                if (!Number.isNaN(rounded)) {
                  setGlobalAvg(rounded)
                  localStorage.setItem(cacheKey, rounded.toString())
                }
              }
            })
          }
        } catch(e){/* ignore */}
        
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

      // Persist progress after each guess
      try {
        const dayIndex = gameState.dataset.challengeInfo?.dayIndex
        const dayKey = `worldofmaps_daily_progress_${dayIndex}`
        const toSave = {
          datasetId: gameState.dataset.id,
          guesses: newGameState.guesses,
          isComplete: newGameState.isComplete,
          isWon: newGameState.isWon,
          availableOptions: newGameState.availableOptions,
          incorrectOptions: newGameState.incorrectOptions
        }
        localStorage.setItem(dayKey, JSON.stringify(toSave))
      } catch (e) {
        console.warn('Failed saving progress', e)
      }
      
      if (newGameState.isComplete) {
        finalizeGame(newGameState)
        markTodayAsPlayed()
        const updatedStats = getLeaderboardData(newGameState.dataset)
        setStats(updatedStats)
        // Refresh global average after submission (delayed to allow backend aggregation)
        const dayIndex = newGameState.dataset.challengeInfo?.dayIndex
        if (dayIndex != null) {
          setTimeout(() => {
            fetchDailyGlobalStats(dayIndex).then(data => {
              if (data && typeof data.avgGuesses === 'number') {
                const rounded = Math.round(Number(data.avgGuesses) * 10) / 10
                if (!Number.isNaN(rounded)) {
                  setGlobalAvg(rounded)
                  try { localStorage.setItem(`worldofmaps_global_avg_${dayIndex}`, rounded.toString()) } catch(_){}
                }
              }
            })
          }, 800)
        }
        try {
          submitGlobalResult({
            datasetId: newGameState.dataset.id,
            dayIndex: newGameState.dataset.challengeInfo?.dayIndex,
            guessCount: newGameState.guesses.length,
            isWon: newGameState.isWon,
            durationMs: Date.now() - newGameState.startTime
          })
        } catch (e) {
          console.warn('Submit global result failed', e)
        }
      }
    }
  }

  // Drawer gesture handlers (mobile only)
  useEffect(()=>{
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
    // Attach only to the handle area; we'll use a separate element for handle
    const handleEl = document.getElementById('drawer-handle-touch')
    if (handleEl) {
      handleEl.addEventListener('touchstart', handleTouchStart, { passive: true })
      handleEl.addEventListener('touchmove', handleTouchMove, { passive: true })
      handleEl.addEventListener('touchend', handleTouchEnd)
      handleEl.addEventListener('touchcancel', handleTouchEnd)
    }
    return ()=>{
      if (handleEl) {
        handleEl.removeEventListener('touchstart', handleTouchStart)
        handleEl.removeEventListener('touchmove', handleTouchMove)
        handleEl.removeEventListener('touchend', handleTouchEnd)
        handleEl.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  },[leftOptionsRef, drawerCollapsed])

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

  // On load after game state ready, if already played and game is complete show modal
  useEffect(() => {
    if (gameState && gameState.isComplete && hasPlayedToday()) {
      setAlreadyPlayedModal(true)
    }
  }, [gameState])

  // Check for overflow and add class for scroll indicator
  useEffect(() => {
    if (leftOptionsRef.current && gameState && !gameState.isComplete) {
      const element = leftOptionsRef.current
      const hasOverflow = element.scrollHeight > element.clientHeight
      
      if (hasOverflow) {
        element.classList.add('has-overflow')
      } else {
        element.classList.remove('has-overflow')
      }
    }
  }, [gameState])

  // Show loading if game state isn't ready
  if (loading || !gameState || !progressLoaded) {
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
      {alreadyPlayedModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,background:'rgba(0,0,0,0.6)'}}>
          <div style={{background:'var(--glassBackground)',backdropFilter:'blur(12px)',border:'1px solid var(--glassBorder)',padding:'30px 35px',borderRadius:16,maxWidth:320,textAlign:'center'}}>
            <h2 style={{margin:'0 0 10px',fontSize:'1.3em'}}>Already Played</h2>
            <p style={{fontSize:'0.9em',lineHeight:1.4,margin:'0 0 18px'}}>You already finished today’s map. Come back tomorrow or play other maps.</p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button className="play-again-btn" onClick={() => { window.location.href='/play' }}>Play More Maps</button>
              <button className="option-btn" onClick={() => setAlreadyPlayedModal(false)} style={{fontSize:'0.8em'}}>Close</button>
            </div>
          </div>
        </div>
      )}
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
        <button className="control-btn" style={{fontSize: '1.2em', padding: '0'}} onClick={() => window.location.href = '/landing'}>
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
              {/* <button 
                className="menu-item" 
                onClick={handleHintsToggle}
              >
                {gameState?.hintsEnabled ? '💡 Disable Hints' : '💡 Enable Hints'}
              </button> */}
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
        <h4>Game Stats</h4>
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <span>{stat.label}:</span>
            <span>{stat.value}</span>
          </div>
        ))}
        <div className="stat-item" style={{marginTop:6,borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:6}}>
          <span>Global Avg</span>
          <span>{globalAvg !== null ? globalAvg.toFixed(1) : '—'}</span>
        </div>
        <div className="legend-gradient"></div>
        <div className="legend-labels">
          <span>Min</span>
          <span>Max</span>
        </div>
      </div>
      
      {/* Left Side - Game Options */}
      <div 
        className={`left-options ${drawerCollapsed ? 'drawer-collapsed' : ''} ${showHandlePulse ? 'drawer-pulse' : ''}`}
        ref={leftOptionsRef}
      >
        {/* Mobile drawer handle */}
        <button
          id="drawer-handle-touch"
            type="button"
            className="drawer-handle"
            aria-label={drawerCollapsed ? 'Expand options' : 'Collapse options'}
            onClick={()=> setDrawerCollapsed(!drawerCollapsed)}
        >
          <div className="drawer-handle-bar" />
        </button>
        {/* Current hint if available */}
        {gameState.currentHint && (
          <div className="hint-display">
            💡 {gameState.currentHint}
          </div>
        )}
        
        {!gameState.isComplete && (
          !drawerCollapsed && (
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
            <button className="play-again-btn" onClick={() => window.location.reload()}>
              Play Again Tomorrow
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

export default DailyGame