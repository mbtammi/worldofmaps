// Streak and histogram accounting. Both had bugs that silently produced wrong numbers:
// a second win on the same calendar day incremented the streak again (reachable in one
// click via the hard-mode toggle, which reloads into a separate progress namespace and
// replays the same puzzle with the answer known), and the guess histogram keys run 1..5
// plus '6+', so a 6-guess win wrote `undefined + 1` and poisoned the bucket with NaN.
import assert from 'node:assert'

// Minimal localStorage so the module can run outside a browser.
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}

const { updateStatsAfterGame, getStats, clearStats } = await import('../src/data/gameStats.js')

const win = (guessCount = 2) =>
  updateStatsAfterGame({ isWon: true, guessCount, datasetType: 't', datasetTitle: 'T', datasetId: 'd' })

// A single day may only advance the streak once, however many times it is played.
clearStats()
win()
assert.equal(getStats().winStreak, 1, 'first win should start the streak')
win()
win()
assert.equal(getStats().winStreak, 1, 'replaying the same day must not extend the streak')

// Every bucket stays numeric, including the 6+ edge that used to write NaN.
clearStats()
for (const g of [1, 2, 5, 6, 7, 12]) win(g)
const hist = getStats().gamesWonByGuesses
for (const [bucket, count] of Object.entries(hist)) {
  assert.ok(Number.isFinite(count), `histogram bucket "${bucket}" is ${count}, not a number`)
}
assert.equal(hist['6+'], 3, `6, 7 and 12 guesses all belong in "6+" — got ${hist['6+']}`)
assert.ok(!('6' in hist) || Number.isFinite(hist['6']), 'a stray numeric 6 bucket was created')

console.log('stats integrity OK (streak counts once a day, histogram buckets stay numeric)')
