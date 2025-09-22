// Serverless function: dailyStats
// Returns aggregated stats for a given dayIndex.
// Reads from Upstash Redis if configured (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) else uses volatile memory.
// Response fields: plays, wins, firstTry, firstTryRate, avgGuesses, medianGuesses, histogram, avgDurationMs, datasetId, updatedAt.
// Histogram keys are numeric guess counts (1..n). No user-level data returned.

let memoryBuffer = [] // Should mirror submitResult's fallback; duplication acceptable for simplicity

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return {
    async hgetall(key) {
      const r = await fetch(`${url}/hgetall/${key}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await r.json()
      return json // Upstash returns array [field, value, field, value]
    }
  }
}

function parseRedisArray(arr) {
  if (!Array.isArray(arr)) return {}
  const obj = {}
  for (let i = 0; i < arr.length; i += 2) obj[arr[i]] = arr[i + 1]
  return obj
}

export default async function handler(req, res) {
  try {
    const dayIndex = parseInt(req.query.dayIndex)
    if (Number.isNaN(dayIndex)) return res.status(400).json({ error: 'dayIndex required' })

    const redis = await getRedis()
    if (redis) {
      const baseKey = `daily:${dayIndex}:stats`
      const raw = await redis.hgetall(baseKey)
      const data = parseRedisArray(raw)
      if (!Object.keys(data).length) return res.status(200).json({ dayIndex, plays: 0, wins: 0, histogram: {}, avgGuesses: null })
      const plays = parseInt(data.plays || '0')
      const wins = parseInt(data.wins || '0')
      const firstTry = parseInt(data.firstTry || '0')
      const durationTotal = parseInt(data.durationTotal || '0')

      // Build histogram
      const histogram = {}
      let sum = 0
      for (let k in data) {
        if (k.startsWith('g_')) {
          const g = parseInt(k.slice(2))
            histogram[g] = parseInt(data[k])
            sum += g * histogram[g]
        }
      }
      const avgGuesses = plays > 0 ? +(sum / plays).toFixed(2) : null

      // Median calculation from histogram
      let median = null
      if (plays > 0) {
        const sorted = Object.keys(histogram).map(n=>parseInt(n)).sort((a,b)=>a-b)
        let cumulative = 0
        const mid = plays / 2
        for (const g of sorted) {
          cumulative += histogram[g]
          if (cumulative >= mid) { median = g; break }
        }
      }

      return res.status(200).json({
        dayIndex,
        datasetId: data.datasetId || null,
        plays,
        wins,
        firstTry,
        firstTryRate: wins ? +(firstTry / wins * 100).toFixed(1) : 0,
        avgGuesses,
        medianGuesses: median,
        histogram,
        avgDurationMs: (plays && durationTotal) ? Math.round(durationTotal / plays) : null,
        updatedAt: data.updatedAt ? parseInt(data.updatedAt) : null
      })
    }

    // In-memory fallback aggregation (not shared across functions, just placeholder dev)
    const filtered = memoryBuffer.filter(r => r.dayIndex === dayIndex)
    if (!filtered.length) return res.status(200).json({ dayIndex, plays: 0, wins: 0, histogram: {}, avgGuesses: null })
    const plays = filtered.length
    const wins = filtered.filter(r => r.winFlag).length
    const histogram = {}
    let sum = 0
    let firstTry = 0
    filtered.forEach(r => {
      histogram[r.g] = (histogram[r.g] || 0) + 1
      sum += r.g
      if (r.winFlag && r.g === 1) firstTry++
    })
    const avgGuesses = +(sum / plays).toFixed(2)
    return res.status(200).json({ dayIndex, plays, wins, histogram, avgGuesses, firstTry, firstTryRate: wins ? +(firstTry / wins * 100).toFixed(1) : 0 })
  } catch (e) {
    console.error('dailyStats error', e)
    return res.status(500).json({ error: 'Server error' })
  }
}
