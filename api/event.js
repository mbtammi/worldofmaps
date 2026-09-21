// Serverless function: event
//
// Counts a handful of named funnel events per day. Deliberately tiny: Vercel's custom events
// need a Pro team, and the one thing we could not see was how many people load the game and
// never finish it — api/submitResult.js only fires on completion.
//
// Storage: one Redis hash per day (`daily:<dayIndex>:events`), one counter per event name.
// No identifiers, no payloads, no per-user rows — just counters, same privacy posture as
// submitResult. Falls back to an in-memory tally when Redis is not configured (local dev).
//
// Event names are allow-listed. The endpoint is public and unauthenticated, so without a
// fixed list any caller could write arbitrary fields into the hash.

const EVENTS = [
  'game_start', // daily game finished loading and is playable
  'game_abandon', // left with a game in progress (beacon on page hide)
  'share_click',
  'challenge_click',
  'hard_mode_on',
  'hard_mode_off',
  'archive_play',
  'year_start',
  'year_submit',
]

let memoryTally = {} // volatile fallback, reset on cold start

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return {
    async hincrby(key, field, increment) {
      await fetch(`${url}/hincrby/${key}/${field}/${increment}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    },
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    // sendBeacon posts a Blob, so the body may arrive as a string rather than parsed JSON.
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { name, dayIndex } = body

    if (!EVENTS.includes(name)) return res.status(400).json({ error: 'Unknown event' })
    const day = parseInt(dayIndex, 10)
    if (!Number.isFinite(day)) return res.status(400).json({ error: 'dayIndex required' })

    const redis = await getRedis()
    if (redis) {
      await redis.hincrby(`daily:${day}:events`, name, 1)
    } else {
      memoryTally[day] = memoryTally[day] || {}
      memoryTally[day][name] = (memoryTally[day][name] || 0) + 1
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('event error', e)
    return res.status(500).json({ error: 'Server error' })
  }
}

export { EVENTS }
