// Year mode rotates datasets by day index, so the ids the client asks for must exist as
// built snapshots. A mismatch is invisible in the source and shows up as a blank globe.
import { readFileSync, existsSync } from 'node:fs'
import assert from 'node:assert'
import { YEAR_MODE_DATASETS, yearDatasetForDay } from '../src/data/yearChallenge.js'

assert.ok(YEAR_MODE_DATASETS.length >= 2, 'year mode needs more than one puzzle to rotate')

for (const id of YEAR_MODE_DATASETS) {
  const file = `public/data/year/${id}.json`
  assert.ok(existsSync(file), `${id}: no snapshot at ${file} — run npm run year:data`)
  const d = JSON.parse(readFileSync(file, 'utf8'))
  assert.equal(d.id, id, `${file}: id is "${d.id}", expected "${id}"`)
  assert.ok(d.availableYears?.length >= 10, `${id}: only ${d.availableYears?.length} years`)
  for (const y of d.availableYears) {
    const rows = d.years[String(y)]
    assert.ok(rows?.length > 100, `${id}@${y}: only ${rows?.length ?? 0} countries`)
    assert.ok(
      rows.every((r) => r.iso_a3 && typeof r.value === 'number'),
      `${id}@${y}: malformed rows`,
    )
  }
}

// Every day must land on a real dataset, and a full cycle must use all of them.
const seen = new Set()
for (let day = 0; day < YEAR_MODE_DATASETS.length * 4; day++) {
  const id = yearDatasetForDay(day)
  assert.ok(YEAR_MODE_DATASETS.includes(id), `day ${day} picked unknown dataset ${id}`)
  seen.add(id)
}
assert.equal(seen.size, YEAR_MODE_DATASETS.length, 'rotation never reaches some datasets')

console.log(`year mode OK (${YEAR_MODE_DATASETS.length} puzzles rotating, all snapshots present)`)
