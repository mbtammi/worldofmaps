import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Icon from './Icon'
import SEO from './SEO'
import { ROUTE_META } from '../seo/routeMeta'
import { getDateStringForDaysAgo } from '../data/dailyChallenge'
import './Archive.css'

const NUM_DAYS = 30
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatLong(yyyyMmDd) {
  const parts = String(yyyyMmDd || '').split('-')
  if (parts.length !== 3) return yyyyMmDd
  const y = parts[0]
  const mi = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  if (isNaN(mi) || mi < 0 || mi > 11 || isNaN(d)) return yyyyMmDd
  return `${MONTHS[mi]} ${d}, ${y}`
}

function dayOfWeek(yyyyMmDd) {
  const date = new Date(yyyyMmDd + 'T00:00:00Z')
  if (isNaN(date.getTime())) return ''
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()]
}

// /archive — browse the last 30 past daily challenges.
// Compute the date list both at module-load (used by SSR/prerender) and again on the client
// in useEffect, so prerendered HTML reflects build-day's window and the client refreshes the
// view if the user opens the page later.
export default function ArchiveIndex() {
  const initialDays = useMemo(() => {
    const out = []
    for (let i = 1; i <= NUM_DAYS; i++) out.push(getDateStringForDaysAgo(i))
    return out
  }, [])

  const [days, setDays] = useState(initialDays)
  const [playedDays, setPlayedDays] = useState(() => new Set())

  useEffect(() => {
    // Refresh window on client (build time and view time may differ by a few days for static hosts).
    const fresh = []
    for (let i = 1; i <= NUM_DAYS; i++) fresh.push(getDateStringForDaysAgo(i))
    setDays(fresh)

    // Mark days the user has completed before.
    try {
      const played = new Set()
      for (const d of fresh) {
        const raw = localStorage.getItem(`worldofmaps_past_progress_${d}`)
        if (!raw) continue
        try {
          const saved = JSON.parse(raw)
          if (saved.isComplete) played.add(d)
        } catch (_) { /* ignore */ }
      }
      setPlayedDays(played)
    } catch (_) { /* ignore */ }
  }, [])

  return (
    <div className="page-with-nav">
      <SEO {...ROUTE_META['/archive']} />
      <Header />
      <main className="page-content archive">
        <h1>Daily Map Archive</h1>
        <p className="archive-intro">
          Missed a day? Catch up on past World of Maps challenges. Archive plays don't affect
          your daily streak — they're just for fun (and to share with friends).
        </p>

        <ul className="archive-list">
          {days.map((d) => {
            const isPlayed = playedDays.has(d)
            return (
              <li key={d} className="archive-item">
                <Link to={`/daily/${d}`} className="archive-link" aria-label={`Play archive challenge from ${formatLong(d)}`}>
                  <span className="archive-date">
                    <span className="archive-dow">{dayOfWeek(d)}</span>
                    <span>{formatLong(d)}</span>
                  </span>
                  {isPlayed && <span className="archive-badge"><Icon name="check" /> Played</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="archive-footer">
          <Link to="/">← Today's challenge</Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}
