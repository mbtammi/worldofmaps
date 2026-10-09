// The change-over-time posts quote figures from public/data/year/*.json inline, so a
// refreshed snapshot would leave published prose stating numbers the site no longer shows.
// Same guard as check-article-facts.mjs, over the year series instead of the atlas ones.
//
// Each entry names the series, the two endpoint years, and every value the post asserts.
import { readFileSync } from 'node:fs'
import assert from 'node:assert'

const load = (id) => JSON.parse(readFileSync(`public/data/year/${id}.json`, 'utf8'))

/** Unweighted mean across countries present in BOTH endpoint years, as the posts compute it. */
function endpoints(id) {
  const d = load(id)
  const years = d.availableYears
  const first = String(years[0])
  const last = String(years[years.length - 1])
  const a = new Map(d.years[first].map((r) => [r.iso_a3, r.value]))
  const b = new Map(d.years[last].map((r) => [r.iso_a3, r.value]))
  const shared = [...b.keys()].filter((k) => a.has(k))
  const mean = (xs) => xs.reduce((x, y) => x + y, 0) / xs.length
  return {
    first,
    last,
    a,
    b,
    shared,
    meanFirst: mean(shared.map((k) => a.get(k))),
    meanLast: mean(shared.map((k) => b.get(k))),
    // "Went backwards" is direction-dependent: for mortality a fall is an improvement.
    fell: shared.filter((k) => b.get(k) < a.get(k)).length,
    rose: shared.filter((k) => b.get(k) > a.get(k)).length,
  }
}

const POSTS = {
  'child-mortality-since-2000': {
    series: 'child-mortality',
    shared: 196,
    meanFirst: 55.2,
    meanLast: 24.2,
    fell: 189,
    rose: 6,
    values: { RWA: [184.2, 37.7], AGO: [185.0, 49.0], SLE: [222.8, 90.5], NER: [227.9, 110.7], SSD: [180.1, 96.7], IND: [91.8, 26.6], NGA: [177.3, 115.6], FIN: [4.3, 2.4] },
  },
  'life-expectancy-gains-since-2000': {
    series: 'life-expectancy',
    shared: 217,
    meanFirst: 67.6,
    meanLast: 74.0,
    fell: 2,
    rose: 215,
    values: { MWI: [46.2, 67.6], RWA: [47.8, 68.0], ZMB: [46.6, 66.5], ETH: [50.9, 67.6], PSE: [70.3, 69.2], DMA: [71.7, 71.3], SYR: [70.9, 72.6], MCO: [82.1, 86.5], NGA: [47.1, 54.6] },
  },
  'more-phones-than-people': {
    series: 'mobile-subscriptions',
    shared: 147,
    meanFirst: 18.0,
    meanLast: 123.5,
    fell: 0,
    rose: 147,
    values: { FJI: [6.5, 574.2], HKG: [81.2, 364.8], RUS: [2.2, 186.1], IND: [0.3, 79.4], ETH: [0.0, 65.1], USA: [38.9, 113.2] },
  },
  'electricity-access-since-2000': {
    series: 'electricity-access',
    shared: 211,
    meanFirst: 75.6,
    meanLast: 89.8,
    fell: 2,
    rose: 144,
    values: { AFG: [4.4, 87.8], KHM: [16.6, 99.2], SLB: [4.7, 81.5], YEM: [49.2, 86.3], IND: [60.3, 99.9], LBY: [99.8, 77.4], SYR: [93.4, 89.3] },
  },
}

let checked = 0
for (const [slug, spec] of Object.entries(POSTS)) {
  const e = endpoints(spec.series)
  assert.equal(e.first, '2000', `${slug}: series starts at ${e.first}`)
  assert.equal(e.last, '2024', `${slug}: series ends at ${e.last}`)
  assert.equal(e.shared.length, spec.shared, `${slug}: ${e.shared.length} countries in both years, post says ${spec.shared}`)

  const near = (actual, claimed, tol, what) =>
    assert.ok(Math.abs(actual - claimed) <= tol, `${slug}: ${what} is ${actual.toFixed(2)}, post says ${claimed}`)
  near(e.meanFirst, spec.meanFirst, 0.06, `${spec.first} mean`)
  near(e.meanLast, spec.meanLast, 0.06, `${spec.last} mean`)
  checked += 3

  // Both directions, because a post's headline claim is usually "only N went backwards" and
  // the complement is not simply total minus N: 65 countries were already at 100%
  // electrification and moved in neither direction.
  assert.equal(e.fell, spec.fell, `${slug}: post implies ${spec.fell} countries fell, data says ${e.fell}`)
  assert.equal(e.rose, spec.rose, `${slug}: post implies ${spec.rose} countries rose, data says ${e.rose}`)
  checked += 2

  for (const [iso, [from, to]] of Object.entries(spec.values)) {
    assert.ok(e.a.has(iso) && e.b.has(iso), `${slug}: ${iso} missing from an endpoint year`)
    near(e.a.get(iso), from, 0.05, `${iso} in ${e.first}`)
    near(e.b.get(iso), to, 0.05, `${iso} in ${e.last}`)
    checked += 2
  }
}

console.log(`change-article facts OK (${checked} claims verified across ${Object.keys(POSTS).length} posts)`)
