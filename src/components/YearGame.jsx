import { useState, useEffect, useMemo } from 'react'
import GlobeView from './GlobeView'
import Icon from './Icon'
import SEO from './SEO'
import { ROUTE_META } from '../seo/routeMeta'
import { getTodaysYearChallenge, scoreYearGuess } from '../data/yearChallenge'
import { initializeTheme } from '../data/themeManager'
import { haptic } from '../data/haptics'
import './YearGame.css'

const STORAGE_KEY = (day) => `worldofthemaps_year_progress_${day}`
const STATS_KEY = 'worldofthemaps_year_stats'

function loadYearStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function recordYearResult(distance) {
  try {
    const cur = loadYearStats() || { games: 0, bullseyes: 0, within1: 0, within3: 0, totalDistance: 0 }
    cur.games += 1
    cur.totalDistance += distance
    if (distance === 0) cur.bullseyes += 1
    if (distance <= 1) cur.within1 += 1
    if (distance <= 3) cur.within3 += 1
    cur.lastPlayedDate = new Date().toDateString()
    localStorage.setItem(STATS_KEY, JSON.stringify(cur))
  } catch { /* silent */ }
}

export default function YearGame() {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guess, setGuess] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { initializeTheme() }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const ch = await getTodaysYearChallenge()
        if (cancelled) return
        setChallenge(ch)
        // Restore previously-submitted guess for today, if any
        try {
          const raw = localStorage.getItem(STORAGE_KEY(ch.dayIndex))
          if (raw) {
            const saved = JSON.parse(raw)
            if (saved && typeof saved.guess === 'number') {
              setGuess(saved.guess)
              if (saved.submitted) setSubmitted(true)
              return
            }
          }
        } catch { /* ignore */ }
        // Default the slider to the middle of the window
        setGuess(Math.round((ch.startYear + ch.endYear) / 2))
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load year-mode data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Build the dataset shape GlobeView expects. iso_a3 is the only join key year snapshots
  // carry, and the topology is annotated with iso_a3 by scripts/annotate-topojson.mjs.
  const globeDataset = useMemo(() => {
    if (!challenge) return null
    return {
      data: challenge.yearData.map((d) => ({
        iso_a3: d.iso_a3,
        name: d.iso_a3,
        value: d.value,
      })),
    }
  }, [challenge])

  const distance = submitted && challenge && guess != null ? Math.abs(guess - challenge.year) : null
  const score = distance != null ? scoreYearGuess(distance) : null

  const handleSubmit = () => {
    if (submitted || !challenge || guess == null) return
    setSubmitted(true)
    haptic(Math.abs(guess - challenge.year) <= 1 ? 'win' : 'wrong')
    try {
      localStorage.setItem(STORAGE_KEY(challenge.dayIndex), JSON.stringify({ guess, submitted: true }))
    } catch { /* ignore */ }
    recordYearResult(Math.abs(guess - challenge.year))
  }

  if (loading) {
    return (
      <div className="daily-game year-mode">
        <SEO {...ROUTE_META['/year-mode']} />
        <div className="loading"><div className="loading-globe"><Icon name="calendar" /></div><div>Loading the year mystery…</div></div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="daily-game year-mode">
        <SEO {...ROUTE_META['/year-mode']} />
        <div className="loading">
          <div className="loading-globe"><Icon name="alert" /></div>
          <div>Couldn't load year-mode data</div>
          <div className="loading-subtitle">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="daily-game year-mode">
      <SEO {...ROUTE_META['/year-mode']} />
      <GlobeView dataset={globeDataset} showTooltips={false} />

      <div className="top-left-title">worldofthemaps</div>

      <div className="top-right-controls">
        <button className="control-btn" onClick={() => (window.location.href = '/landing')} title="Home"><Icon name="home" /></button>
        <button className="control-btn" onClick={() => (window.location.href = '/')} title="Daily game"><Icon name="globe" /></button>
      </div>

      <div className="year-banner">
        <div className="year-banner-label">Guess the year</div>
        <div className="year-banner-title">{challenge.title}</div>
        <div className="year-banner-sub">{challenge.description}</div>
      </div>

      <div className="year-controls">
        {!submitted ? (
          <>
            <div className="year-slider-row">
              <span className="year-slider-end">{challenge.startYear}</span>
              <input
                type="range"
                min={challenge.startYear}
                max={challenge.endYear}
                step={1}
                value={guess ?? challenge.startYear}
                onChange={(e) => setGuess(parseInt(e.target.value, 10))}
                className="year-slider"
                aria-label="Year"
              />
              <span className="year-slider-end">{challenge.endYear}</span>
            </div>
            <div className="year-guess-value">Your guess: <strong>{guess}</strong></div>
            <button className="year-submit" onClick={handleSubmit}>Submit</button>
          </>
        ) : (
          <div className={`year-result year-result-${score.tone}`}>
            <div className="year-result-emoji"><Icon name={score.icon} /></div>
            <div className="year-result-headline">{score.label}</div>
            <div className="year-result-detail">
              Actual year: <strong>{challenge.year}</strong> · You guessed: <strong>{guess}</strong>
            </div>
            <div className="year-result-hint">Come back tomorrow for a different year.</div>
          </div>
        )}
      </div>
    </div>
  )
}
