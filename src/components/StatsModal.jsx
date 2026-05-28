import { useEffect, useState } from 'react'
import { getCalculatedStats } from '../data/gameStats'
import { getTimeUntilReset } from '../data/dailyChallenge'
import './StatsModal.css'

// Wordle-style stats panel. Reads from gameStats (localStorage-backed). Highlights the bucket
// the current game landed in if provided. Optional Share button (shown only when there's a
// completed game to share — caller decides).
export default function StatsModal({ open, onClose, currentGuessBucket = null, onShare = null }) {
  const [stats, setStats] = useState(null)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    if (!open) return
    setStats(getCalculatedStats())
    // Tick the countdown each minute while the modal is open.
    const tick = () => setCountdown(getTimeUntilReset())
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [open])

  if (!open) return null

  const s = stats || getCalculatedStats()
  const histogram = s.gamesWonByGuesses || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, '6+': 0 }
  const buckets = ['1', '2', '3', '4', '5', '6+']
  const maxCount = Math.max(1, ...buckets.map((b) => histogram[b] || 0))
  const fastestSec = s.fastestMs != null ? Math.round(s.fastestMs / 1000) : null

  return (
    <div className="stats-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="stats-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Game statistics"
        aria-modal="true"
      >
        <button className="stats-modal-close" onClick={onClose} aria-label="Close stats">
          ×
        </button>
        <h2 className="stats-modal-title">Statistics</h2>

        <div className="stats-modal-summary">
          <div className="stats-cell">
            <span className="stats-cell-value">{s.totalGames || 0}</span>
            <span className="stats-cell-label">Played</span>
          </div>
          <div className="stats-cell">
            <span className="stats-cell-value">{s.winPercentage || 0}%</span>
            <span className="stats-cell-label">Win&nbsp;%</span>
          </div>
          <div className="stats-cell stats-cell-streak">
            <span className="stats-cell-value">🔥&nbsp;{s.displayedStreak || 0}</span>
            <span className="stats-cell-label">Current streak</span>
          </div>
          <div className="stats-cell">
            <span className="stats-cell-value">{s.maxWinStreak || 0}</span>
            <span className="stats-cell-label">Max streak</span>
          </div>
        </div>

        <div className="stats-modal-secondary">
          <span>Avg guesses: <strong>{s.averageGuesses || '—'}</strong></span>
          {fastestSec != null && (
            <span>Fastest: <strong>⚡ {fastestSec < 60 ? `${fastestSec}s` : `${Math.floor(fastestSec / 60)}m ${fastestSec % 60}s`}</strong></span>
          )}
        </div>

        <h3 className="stats-modal-section">Guess distribution</h3>
        {s.totalWins ? (
          <div className="stats-histogram">
            {buckets.map((b) => {
              const count = histogram[b] || 0
              const widthPct = Math.max(8, Math.round((count / maxCount) * 100))
              const isCurrent = b === currentGuessBucket
              return (
                <div key={b} className="stats-hist-row">
                  <span className="stats-hist-label">{b}</span>
                  <span className="stats-hist-track">
                    <span
                      className={`stats-hist-fill${isCurrent ? ' stats-hist-fill-current' : ''}`}
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="stats-hist-count">{count}</span>
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="stats-empty">Play a daily challenge to see your distribution.</p>
        )}

        {countdown && (
          <div className="stats-modal-footer">
            <span className="stats-countdown-label">Next puzzle in</span>
            <span className="stats-countdown-value">
              {String(countdown.hours).padStart(2, '0')}h&nbsp;{String(countdown.minutes).padStart(2, '0')}m
            </span>
            {onShare && (
              <button className="stats-share-btn" onClick={onShare}>
                Share result
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
