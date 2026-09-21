// Fire-and-forget funnel events.
//
// Counters only, no identifiers — the site promises "no accounts, no ads, no email
// collection" and this keeps that true. Never awaited and never throws: a blocked request
// or an ad blocker must not affect a guess.

const ENDPOINT = '/api/event'

// Guard against double-counting a page-level event (React strict mode double-invokes
// effects in dev, and the abandon beacon can fire on both pagehide and visibilitychange).
const sentOnce = new Set()

export function trackEvent(name, dayIndex, { once = false } = {}) {
  if (dayIndex == null) return
  if (once) {
    const key = `${name}:${dayIndex}`
    if (sentOnce.has(key)) return
    sentOnce.add(key)
  }
  const payload = JSON.stringify({ name, dayIndex })
  try {
    // sendBeacon survives the page being torn down, which is the only way to catch abandons.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }))
      return
    }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* analytics must never break the game */
  }
}

/**
 * Reports a game abandoned in progress: the player started guessing and left without
 * finishing. Loads minus starts tells you bounce; starts minus finishes tells you where the
 * puzzle loses people, which is the number nothing currently measures.
 *
 * Returns a cleanup function.
 */
export function trackAbandonOnExit(dayIndex, isInProgress) {
  const onHide = () => {
    if (document.visibilityState === 'hidden' && isInProgress()) {
      trackEvent('game_abandon', dayIndex, { once: true })
    }
  }
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', onHide)
  return () => {
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', onHide)
  }
}

export default { trackEvent, trackAbandonOnExit }
