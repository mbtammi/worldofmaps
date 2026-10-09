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
const LOW_VERB = /^(?:sits at the lower end|has the lowest|is the lowest|ranks last|trails)\b/

// Match against the dataset's own country names, longest first. A generic capitalised-words
// regex captured "China" out of "Hong Kong SAR, China tops the list" and reported three
// correct facts as contradictions, because the comma broke the pattern mid-name.
function claimedBy(fact, rows, verb) {
  const names = rows.map((r) => r.name).sort((a, b) => b.length - a.length)
  for (const name of names) {
    let from = 0
    for (;;) {
      const at = fact.indexOf(name, from)
      if (at === -1) break
      if (verb.test(fact.slice(at + name.length).trimStart())) return name
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
  const rank = (n) => d.data.findIndex((r) => r.name === n) + 1 || '?'

  // Compare values, not names. Ties are common and legitimate: 152 countries report one
  // language and 226 report one timezone, so a fact naming any of them as lowest is true
  // even though stats.min.name picks a different member. A name comparison called four
  // correct facts contradictions.
  const valueOf = (n) => d.data.find((r) => r.name === n)?.value

  const leader = claimedBy(fact, d.data, LEAD_VERB)
  if (leader) {
    claims++
    if (valueOf(leader) !== d.stats.max.value) {
      failures.push(`${d.id}: fact says "${leader}" leads at ${valueOf(leader)}, but the maximum is ${top} at ${d.stats.max.value} ("${leader}" is #${rank(leader)})`)
    }
  }

  // Leader claims alone missed languages-count, whose fact named a country as lowest.
  const bottom = d.stats?.min?.name
  const trailer = claimedBy(fact, d.data, LOW_VERB)
  if (trailer && bottom) {
    claims++
    if (valueOf(trailer) !== d.stats.min.value) {
      failures.push(`${d.id}: fact says "${trailer}" is lowest at ${valueOf(trailer)}, but the minimum is ${bottom} at ${d.stats.min.value} ("${trailer}" is #${rank(trailer)} of ${d.data.length})`)
    }
  }
}

if (failures.length) {
  console.error(`fun facts contradict their own data (${failures.length}):`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}
console.log(`fun facts OK (${claims} leader and lowest claims checked against the data)`)

// Three dataset pairs carry byte-identical stats, which means one of each pair is built
// from the wrong World Bank indicator: exports-goods-services with exports-percent-gdp,
// imports-goods-services with imports-percent-gdp, and urban-population with
// urban-population-percent. Their twin pages now render the same number with and without a
// percent sign. Fixing it needs a network refresh of the snapshots (npm run atlas:data) and
// a corrected indicator in scripts/build-atlas-data.js, so the known pairs are recorded
// here rather than failing the build. A NEW collision does fail, so this cannot spread.
const KNOWN_DUPLICATE_STATS = new Set([
  'exports-goods-services|exports-percent-gdp',
  'imports-goods-services|imports-percent-gdp',
  'urban-population|urban-population-percent',
])

const byStats = new Map()
for (const file of readdirSync('public/data/atlas')) {
  if (!file.endsWith('.json') || file === '_index.json') continue
  const d = JSON.parse(readFileSync(`public/data/atlas/${file}`, 'utf8'))
  if (!d.stats) continue
  const key = JSON.stringify(d.stats)
  if (!byStats.has(key)) byStats.set(key, [])
  byStats.get(key).push(d.id)
}

const unexpected = []
for (const ids of byStats.values()) {
  if (ids.length < 2) continue
  const pair = [...ids].sort().join('|')
  if (!KNOWN_DUPLICATE_STATS.has(pair)) unexpected.push(pair)
}
if (unexpected.length) {
  console.error(`datasets sharing identical stats, so one is built from the wrong indicator:`)
  for (const p of unexpected) console.error(`  ${p.replace('|', ' and ')}`)
  process.exit(1)
}
console.log(`duplicate-stats check OK (${KNOWN_DUPLICATE_STATS.size} known pairs tracked, no new collisions)`)
