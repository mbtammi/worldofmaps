import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import GlobeView from './GlobeView'
import { getTodaysDataset, createGameState, processGuess, finalizeGame } from '../data/gameManager'
import { hasPlayedToday, markTodayAsPlayed } from '../data/dailyChallenge'
import { getLeaderboardData } from '../data/gameStats'
import { submitGlobalResult, fetchDailyGlobalStats } from '../data/globalStatsClient'
import { initializeTheme, getNextTheme, applyTheme, getCurrentTheme, getAllThemes } from '../data/themeManager'
import { generateShareText, copyTextToClipboard, tryWebShare, captureGlobeImage, createPolaroidImage, createStoryShareImage } from '../data/shareUtils'
import './DailyGame.css'

// Lazy load ShareSheet to improve initial page load performance
const ShareSheet = lazy(() => import('./ShareSheet'))

function DailyGame() {
  const [gameState, setGameState] = useState(null)
  const [showTooltips, setShowTooltips] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [currentTheme, setCurrentTheme] = useState('dark')
  const leftOptionsRef = useRef(null)
  const [alreadyPlayedModal, setAlreadyPlayedModal] = useState(false)
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [globalAvg, setGlobalAvg] = useState(null)
  const [drawerCollapsed, setDrawerCollapsed] = useState(false)
  const drawerTouch = useRef({ startY: 0, lastY: 0, dragging: false })
  const [showHandlePulse, setShowHandlePulse] = useState(true)
  const [shareStatus, setShareStatus] = useState(null)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const autoScrollRef = useRef({ active: false, userInteracted: false })
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [extremesLine, setExtremesLine] = useState(null)
  // Hints removed
  const [showWinToast, setShowWinToast] = useState(false)

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

  // Hints removed

  // Initialize game on component mount
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true)
        // Dev log removed - prevents answer spoilers in production
        
        const dataset = await getTodaysDataset()
        // Dev log removed - prevents revealing dataset title in production
        
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
        
        // Stats & global averages now lazy-loaded after first paint (see effect below)
        
        console.log('DailyGame: Game initialized successfully')
      } catch (error) {
        console.error('DailyGame: Failed to initialize game:', error)
        setLoadError(error.message || 'Failed to load today\'s challenge. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    initializeGame()
  }, [])

  // Lazy-load stats and global averages after first paint / idle
  useEffect(() => {
    if (!gameState) return
    // Only load once if stats empty (or could refresh if desired)
    if (stats.length === 0) {
      const runIdle = (fn) => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(fn, { timeout: 1200 })
        } else {
          setTimeout(fn, 120) // small delay to yield first paint
        }
      }
      runIdle(() => {
        try {
          const currentStats = getLeaderboardData(gameState.dataset)
          setStats(currentStats)
        } catch(e) { console.warn('Lazy stats load failed', e) }
        try {
          const dayIndex = gameState.dataset?.challengeInfo?.dayIndex
          if (dayIndex != null) {
            const cacheKey = `worldofmaps_global_avg_${dayIndex}`
            try {
              const cached = localStorage.getItem(cacheKey)
              if (cached) {
                const num = parseFloat(cached)
                if (!Number.isNaN(num)) setGlobalAvg(num)
              }
            } catch(_){/* ignore */}
            fetchDailyGlobalStats(dayIndex).then(data => {
              if (data && typeof data.avgGuesses === 'number') {
                const rounded = Math.round(Number(data.avgGuesses) * 10) / 10
                if (!Number.isNaN(rounded)) {
                  setGlobalAvg(rounded)
                  try { localStorage.setItem(cacheKey, rounded.toString()) } catch(_){/* ignore */}
                }
              }
            })
          }
        } catch(e) { /* ignore */ }
      })
    }
  }, [gameState, stats.length])

  // Auto-hide instructions after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false)
    }, 10000) // 10 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleOptionSelect = (selectedOption) => {
    // Any explicit option selection should permanently cancel auto-scroll
    autoScrollRef.current.userInteracted = true
    autoScrollRef.current.active = false
    setShowScrollHint(false)
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
        // Compute a single-line extremes summary
        try {
          const arr = (newGameState.dataset.data || []).filter(d => typeof d.value === 'number')
          if (arr.length > 1) {
            let min = arr[0], max = arr[0]
            for (const d of arr) { if (d.value < min.value) min = d; if (d.value > max.value) max = d }
            if (min && max) setExtremesLine(`${max.name} highest, ${min.name} lowest`)
          }
        } catch(_){}
        if (newGameState.isWon) {
          setShowWinToast(true)
          setTimeout(()=> setShowWinToast(false), 3000)
        }
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

  // Share result handler
  const handleShare = async () => {
    if (!gameState || !gameState.isComplete) return
    const dataset = gameState.dataset
    const result = {
      isWon: gameState.isWon,
      guesses: gameState.guesses,
      guessCount: gameState.guesses.length,
      datasetTitle: dataset.title,
      dayIndex: dataset.challengeInfo?.dayIndex,
      challengeId: dataset.challengeInfo?.challengeId,
      durationMs: Date.now() - gameState.startTime
    }
    setShareStatus('preparing')
    // Create 9:16 story image (no title reveal)
    // Capture globe via stable id (#world-globe-canvas)
    const polyUrl = await createStoryShareImage(undefined, {
      dayIndex: result.dayIndex,
      isWon: result.isWon,
      guessCount: result.guessCount
    })
    if (!polyUrl) {
      console.warn('[DailyGame] Story share image generation returned null (no globe capture).')
    }
    const text = generateShareText(result)

    // Try Web Share with image if possible
    let shared = false
    if (polyUrl && navigator.canShare && window.fetch) {
      try {
        const blob = await (await fetch(polyUrl)).blob()
        const file = new File([blob], `worldofmaps-day${result.dayIndex||'x'}.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text })
          setShareStatus('shared-image')
          shared = true
        }
      } catch (e) {
        if (e && (e.name === 'AbortError' || e.message === 'Share canceled' || e.message === 'The request is aborted')) {
          console.log('[Share] User canceled share – not treating as error.')
        } else {
          console.warn('Image share failed, fallback to text:', e.message)
        }
      }
    }
    if (shared) { setTimeout(()=> setShareStatus(null), 3500); return }

    // Try text-only sharing
    if (!shared) {
      const textShared = await tryWebShare({ text })
      if (textShared) {
        setShareStatus('shared-text')
        setTimeout(()=> setShareStatus(null), 3500)
        return
      }
    }
    // Fallback copy + open image preview
    const copied = await copyTextToClipboard(text)
    if (polyUrl) {
      const w = window.open()
      if (w) {
        w.document.write(`<title>WorldOfMaps Share</title><img src="${polyUrl}" style="max-width:100%;height:auto;display:block;margin:20px auto;border:12px solid #fff;box-shadow:0 4px 18px rgba(0,0,0,0.25);" />`)
      }
    }
    setShareStatus(copied ? (polyUrl ? 'copied+image' : 'copied') : 'failed')
    setTimeout(()=> setShareStatus(null), 4000)
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
        setShowScrollHint(true)
        // Gentle auto scroll on mobile only first time
        const isMobile = window.matchMedia('(max-width: 768px)').matches
        if (isMobile && !autoScrollRef.current.active && !autoScrollRef.current.userInteracted) {
          autoScrollRef.current.active = true
          const step = () => {
            if (!autoScrollRef.current.active) return
            if (autoScrollRef.current.userInteracted) {
              autoScrollRef.current.active = false
              setShowScrollHint(false)
              return
            }
            element.scrollTop += 0.4
            const endReached = element.scrollTop + element.clientHeight >= element.scrollHeight - 4
            if (endReached) {
              autoScrollRef.current.active = false
              setTimeout(()=> setShowScrollHint(false), 1200)
              return
            }
            requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      } else {
        element.classList.remove('has-overflow')
        setShowScrollHint(false)
      }
    }
  }, [gameState])

  // Cancel auto-scroll on user interaction
  useEffect(() => {
    const el = leftOptionsRef.current
    if (!el) return
    const cancel = () => { autoScrollRef.current.userInteracted = true; setShowScrollHint(false) }
    el.addEventListener('wheel', cancel, { passive: true })
    el.addEventListener('touchstart', cancel, { passive: true })
    el.addEventListener('mousedown', cancel)
    return () => {
      el.removeEventListener('wheel', cancel)
      el.removeEventListener('touchstart', cancel)
      el.removeEventListener('mousedown', cancel)
    }
  }, [])

  // Show error if game failed to load
  if (loadError) {
    return (
      <div className="daily-game">
        <div className="loading">
          <div className="loading-globe">❌</div>
          <div>Unable to load today's challenge</div>
          <div className="loading-subtitle">{loadError}</div>
          <button 
            className="play-again-btn" 
            style={{marginTop: '20px'}}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

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
      {/* Minimal mobile toast for win */}
      {showWinToast && (
        <div style={{position:'fixed',top:8,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)',padding:'8px 16px',borderRadius:24,fontSize:'0.85em',zIndex:160,display:'flex',alignItems:'center',gap:8}}>
          <span>✅ Correct</span>
          <span style={{opacity:0.75}}>{gameState?.dataset?.title}</span>
        </div>
      )}
      {alreadyPlayedModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,background:'rgba(0,0,0,0.6)'}}>
          <div style={{background:'var(--glassBackground)',backdropFilter:'blur(12px)',border:'1px solid var(--glassBorder)',padding:'30px 35px',borderRadius:16,maxWidth:320,textAlign:'center'}}>
            <h2 style={{margin:'0 0 10px',fontSize:'1.3em'}}>You WON!</h2>
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
              {/* Hints feature removed */}
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
  <div style={{marginTop:4,fontSize:'0.65em',textAlign:'center',opacity:0.85}}>Gray = No data</div>
      </div>
      
      {/* Left Side - Game Options */}
      <div 
        className={`left-options ${drawerCollapsed ? 'drawer-collapsed' : ''} ${showHandlePulse ? 'drawer-pulse' : ''}`}
        ref={leftOptionsRef}
        onMouseDown={() => { autoScrollRef.current.userInteracted = true; autoScrollRef.current.active = false; setShowScrollHint(false) }}
        onTouchStart={() => { autoScrollRef.current.userInteracted = true; autoScrollRef.current.active = false; setShowScrollHint(false) }}
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
        {/* Hints removed */}
        
        {!gameState.isComplete && (
          !drawerCollapsed && (
            <div className="options-grid">
              {gameState.availableOptions.map((option, index) => (
                <button
                  key={index}
                  className="option-btn"
                  onClick={() => handleOptionSelect(option)}
                  onTouchStart={() => { autoScrollRef.current.userInteracted = true; autoScrollRef.current.active = false; setShowScrollHint(false) }}
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
                {extremesLine && <p style={{fontSize:'0.7em',opacity:0.75,marginTop:6}}>{extremesLine}</p>}
              </div>
            ) : (
              <div className="lose-message">
                <h2>😔 Game Over!</h2>
                <p>The answer was: <strong>{gameState.dataset.title}</strong></p>
                <p>{gameState.dataset.description}</p>
                {extremesLine && <p style={{fontSize:'0.7em',opacity:0.75,marginTop:6}}>{extremesLine}</p>}
              </div>
            )}
            <button className="play-again-btn" onClick={() => window.location.reload()}>
              Play Again Tomorrow
            </button>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
              <button className="option-btn" onClick={handleShare}>Quick Share (Image)</button>
              <button className="option-btn" style={{background:'rgba(255,255,255,0.08)'}} onClick={()=> setShareSheetOpen(true)}>More Share Options</button>
            </div>
            {shareStatus && (
              <div style={{marginTop:8,fontSize:'0.7em',opacity:0.8}}>
                {shareStatus === 'preparing' && 'Generating image...'}
                {shareStatus === 'shared-image' && 'Shared image ✅'}
                {shareStatus === 'shared-text' && 'Shared text ✅'}
                {shareStatus === 'copied' && 'Copied text ✅'}
                {shareStatus === 'copied+image' && 'Copied text + opened image ✅'}
                {shareStatus === 'failed' && 'Share failed ❌'}
              </div>
            )}
          </div>
        )}
        
        {/* Previous guesses */}
        {gameState.guesses.length > 0 && !drawerCollapsed && (
          <div className="guesses-summary">
            <p>Guesses: {gameState.guesses.length}</p>
            {/* Hint suggestion removed */}
          </div>
        )}
        {showScrollHint && !drawerCollapsed && !gameState.isComplete && (
          <div style={{textAlign:'center',fontSize:'0.6em',opacity:0.55,marginTop:6}}>
            Scroll for more options ↓
          </div>
        )}
      </div>
    {shareSheetOpen && gameState?.isComplete && (
      <Suspense fallback={<div style={{position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: 'white'}}>Loading share options...</div>}>
        <ShareSheet
          open={shareSheetOpen}
          onClose={()=> setShareSheetOpen(false)}
          result={{
            isWon: gameState.isWon,
            guesses: gameState.guesses,
            guessCount: gameState.guesses.length,
            datasetTitle: gameState.dataset.title,
            dayIndex: gameState.dataset.challengeInfo?.dayIndex,
            challengeId: gameState.dataset.challengeInfo?.challengeId,
            durationMs: Date.now() - gameState.startTime
          }}
        />
      </Suspense>
    )}
    </div>
  )
}

export default DailyGame