// The daily reset instant must always be in the future, in every timezone. The original
// implementation derived it from local midnight and then overwrote the UTC hour, which
// silently produced past timestamps (and a negative countdown) for most of the world.
import assert from 'node:assert'
import { execFileSync } from 'node:child_process'

const ZONES = [
  'UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London',
  'Europe/Helsinki', 'Asia/Singapore', 'Asia/Kolkata', 'Pacific/Auckland',
  'Pacific/Kiritimati', 'Pacific/Niue',
]

for (const tz of ZONES) {
  const out = execFileSync(
    process.execPath,
    ['-e', `import('./src/data/dailyChallenge.js').then(m => {
       const t = m.getTimeUntilReset()
       process.stdout.write(JSON.stringify(t))
     })`],
    { env: { ...process.env, TZ: tz }, encoding: 'utf8' },
  )
  const { totalMs, hours } = JSON.parse(out)
  assert.ok(totalMs > 0, `${tz}: countdown is ${totalMs}ms — reset time is in the past`)
  assert.ok(totalMs <= 24 * 3600 * 1000, `${tz}: countdown ${hours}h exceeds one day`)
}

console.log(`reset clock OK (positive and under 24h in ${ZONES.length} timezones)`)
