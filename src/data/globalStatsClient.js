// Client helper for submitting global stats
// Safe to call; will silently ignore network failures.

export async function submitGlobalResult({ datasetId, dayIndex, guessCount, isWon, durationMs }) {
  try {
    const resp = await fetch('/api/submitResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetId, dayIndex, guessCount, isWon, durationMs })
    })
    if (!resp.ok) {
      if (resp.status === 404) {
        console.warn('[globalStats] submitResult 404 (dev env) – skipping.')
        return { skipped: true }
      }
      console.warn('[globalStats] submitResult non-OK', resp.status)
      return { error: resp.status }
    }
    return { ok: true }
  } catch (e) {
    console.warn('[globalStats] submission failed (ignored):', e.message)
    return { error: e.message }
  }
}

export async function fetchDailyGlobalStats(dayIndex) {
  try {
    const res = await fetch(`/api/dailyStats?dayIndex=${dayIndex}`)
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('[globalStats] dailyStats 404 (dev env) – returning placeholder.')
        return { avgGuesses: null }
      }
      console.warn('[globalStats] dailyStats non-OK', res.status)
      return { avgGuesses: null }
    }
    let data = null
    try { data = await res.json() } catch (e) {
      console.warn('[globalStats] JSON parse failed, returning placeholder.', e.message)
      return { avgGuesses: null }
    }
    return data
  } catch (e) {
    console.warn('Failed fetching global stats:', e.message)
    return { avgGuesses: null }
  }
}
