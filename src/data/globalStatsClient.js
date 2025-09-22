// Client helper for submitting global stats
// Safe to call; will silently ignore network failures.

export async function submitGlobalResult({ datasetId, dayIndex, guessCount, isWon, durationMs }) {
  try {
    await fetch('/api/submitResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetId, dayIndex, guessCount, isWon, durationMs })
    })
  } catch (e) {
    console.warn('Global stats submission failed (ignored):', e)
  }
}

export async function fetchDailyGlobalStats(dayIndex) {
  try {
    const res = await fetch(`/api/dailyStats?dayIndex=${dayIndex}`)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.warn('Failed fetching global stats:', e)
    return null
  }
}
