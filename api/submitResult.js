// Serverless function: submitResult
// Purpose: Accept a single finished game result and aggregate minimal global stats.
// Storage strategy:
//   - If env vars UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are present, writes to Upstash Redis (free tier friendly).
//   - Otherwise uses an in-memory buffer (non-persistent; fine for local dev / preview deployments).
// Data stored (per dayIndex hash): plays, wins, g_<n> counts, firstTry, durationTotal, datasetId, updatedAt.
// Privacy: no user identifiers stored; purely aggregated counters.
// NOTE: Keep payload minimal to avoid accidental PII accumulation.

let memoryBuffer = [] // Fallback volatile store (reset on cold start)

// Lazy Redis client creation to avoid bundling if not configured
async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return {
    async zadd(key, score, member) {
      await fetch(`${url}/zadd/${key}/${score}/${encodeURIComponent(member)}`, { headers: { Authorization: `Bearer ${token}` } })
    },
    async incr(key) {
      await fetch(`${url}/incr/${key}`, { headers: { Authorization: `Bearer ${token}` } })
    },
    async hset(key, field, value) {
      await fetch(`${url}/hset/${key}/${field}/${encodeURIComponent(value)}`, { headers: { Authorization: `Bearer ${token}` } })
    },
    async hincrby(key, field, increment) {
      await fetch(`${url}/hincrby/${key}/${field}/${increment}`, { headers: { Authorization: `Bearer ${token}` } })
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { datasetId, dayIndex, guessCount, isWon, durationMs } = req.body || {}
    if (!datasetId || typeof dayIndex !== 'number' || !guessCount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const redis = await getRedis()
    const ts = Date.now()

    // Normalize values
    const g = Math.min(Math.max(parseInt(guessCount), 1), 50)
    const winFlag = isWon ? 1 : 0

    if (redis) {
      const baseKey = `daily:${dayIndex}:stats`
      await redis.hincrby(baseKey, 'plays', 1)
      if (winFlag) await redis.hincrby(baseKey, 'wins', 1)
      await redis.hincrby(baseKey, `g_${g}`, 1)
      if (isWon && g === 1) await redis.hincrby(baseKey, 'firstTry', 1)
      if (durationMs) await redis.hincrby(baseKey, 'durationTotal', Math.min(durationMs, 15 * 60 * 1000))
      // Track last update timestamp
      await redis.hset(baseKey, 'updatedAt', ts.toString())
      await redis.hset(baseKey, 'datasetId', datasetId)
    } else {
      memoryBuffer.push({ datasetId, dayIndex, g, winFlag, ts })
      // Keep buffer bounded
      if (memoryBuffer.length > 1000) memoryBuffer = memoryBuffer.slice(-500)
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('submitResult error', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
