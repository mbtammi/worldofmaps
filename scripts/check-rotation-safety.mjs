// The daily rotation used to throw on the first day of each cycle: dayIndex is normalised
// to 0-364, so `dayIndex - 1` was -1, JS `-1 % 88` is -1, and `pattern[-1]` is undefined.
// The throw was caught upstream and silently swapped for a hardcoded 35-country sample
// dataset, served to everyone as that day's puzzle with no error shown. Next occurrence
// would have been 2026-12-18.
//
// Separately, getDateStringForDaysAgo computed plain UTC dates while every other part of
// the rotation shifts by RESET_HOUR_UTC, so for the five hours before the daily reset
// "yesterday" resolved to the puzzle that was still live — and the home page prints its
// title, which is the answer.
import assert from 'node:assert'

const RealDate = Date

// 1) No day in a full cycle may throw, and every day must name a real dataset.
{
  const m = await import('../src/data/dailyChallenge.js')
  const seen = new Set()
  for (let day = 0; day < 365; day++) {
    const date = new RealDate(RealDate.UTC(2026, 0, 1) + day * 86400000).toISOString().slice(0, 10)
    let picked
    assert.doesNotThrow(() => { picked = m.getDatasetIdForDate(date) }, `${date} threw`)
    assert.ok(picked?.id, `${date} produced no dataset id`)
    seen.add(picked.id)
  }
  assert.ok(seen.size > 50, `rotation only reached ${seen.size} datasets across a year`)
}

// 2) "Yesterday" must never name the puzzle that is currently live, at any hour.
for (const hour of [0, 1, 4, 5, 6, 12, 23]) {
  const fake = RealDate.UTC(2026, 8, 22, hour, 30)
  Date.now = () => fake
  const m = await import(`../src/data/dailyChallenge.js?hour=${hour}`)
  const live = m.getCurrentDayIndex()
  const yesterday = m.getDatasetIdForDate(m.getDateStringForDaysAgo(1))
  assert.notEqual(
    yesterday.cycleIndex,
    live,
    `at ${hour}:30 UTC the "yesterday" card names the live puzzle (cycleIndex ${live}) — that is the answer`,
  )
  // And it must be the immediately preceding day, not two days back.
  const expected = (live - 1 + 365) % 365
  assert.equal(yesterday.cycleIndex, expected, `at ${hour}:30 UTC yesterday should be ${expected}, got ${yesterday.cycleIndex}`)
}

console.log('rotation safety OK (no wrap crash across a full cycle, no spoiler window)')
