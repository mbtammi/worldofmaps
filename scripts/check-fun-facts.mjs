// A fun fact sits at the top of every atlas page, directly above the stats that contradict
// it when it is wrong. gdp-per-capita read "Luxembourg leads global GDP per capita" while
// the same page's stats block showed Monaco at $288,001 and Luxembourg fourth. A reader
// sees the contradiction; an assistant quoting the page repeats the false half.
//
// Asserts that when a hand-written fact claims a country leads, that country is the one the
// data puts first.
import { readFileSync, readdirSync } from 'node:fs'
import assert from 'node:assert'

const LEAD_VERB = /^(?:leads|tops|has the highest|ranks first|is the highest)\b/

// Match against the dataset's own country names, longest first. A generic capitalised-words
// regex captured "China" out of "Hong Kong SAR, China tops the list" and reported three
// correct facts as contradictions, because the comma broke the pattern mid-name.
function claimedLeader(fact, rows) {
  const names = rows.map((r) => r.name).sort((a, b) => b.length - a.length)
  for (const name of names) {
    let from = 0
    for (;;) {
      const at = fact.indexOf(name, from)
      if (at === -1) break
      if (LEAD_VERB.test(fact.slice(at + name.length).trimStart())) return name
      from = at + 1
    }
  }
  return null
}

const failures = []
let claims = 0

for (const file of readdirSync('public/data/atlas')) {
  if (!file.endsWith('.json') || file === '_index.json') continue
  const d = JSON.parse(readFileSync(`public/data/atlas/${file}`, 'utf8'))
  const fact = d.funFact
  const top = d.stats?.max?.name
  if (!fact || !top) continue

  // A fact naming a region ("Nordic countries lead...") matches no country and is skipped;
  // this check has no opinion on those.
  const named = claimedLeader(fact, d.data)
  if (!named) continue

  claims++
  if (named !== top) {
    failures.push(`${d.id}: fact says "${named}" leads, data ranks ${top} first (${named} is #${
      d.data.findIndex((r) => r.name === named) + 1 || '?'
    })`)
  }
}

if (failures.length) {
  console.error(`fun facts contradict their own data (${failures.length}):`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}
console.log(`fun facts OK (${claims} leader claims checked against the data)`)
