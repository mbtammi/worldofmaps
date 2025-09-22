import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const theme = initializeTheme()
    setCurrentTheme(theme)
  }, [])

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
      <div className="left-options">
        {!gameState.isComplete ? (
          <div className="options-grid">
            {gameState.availableOptions.map((o,i)=> <button key={i} className="option-btn" onClick={()=>handleGuess(o)}>{o}</button>)}
          </div>
        ) : (
          <div className="game-results">
            {gameState.isWon ? (
              <div className="win-message"><h2>🎉 Correct!</h2><p>{gameState.dataset.title}</p></div>
            ) : (
              <div className="lose-message"><h2>❌ Not Quite</h2><p>{gameState.dataset.title}</p></div>
            )}
            <button className="play-again-btn" onClick={loadRandomDataset}>Play Another</button>
          </div>
        )}
      </div>
    </div>
  )
}
