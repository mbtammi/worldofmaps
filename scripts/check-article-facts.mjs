// Verifies the load-bearing numbers in the hand-written analysis posts against the atlas
// snapshots they cite. These articles quote figures inline, so a snapshot refresh (or a typo)
// would otherwise leave published prose silently wrong.
//
// Each entry lists the correlation the post claims and the extreme values it names.
// Tolerances are loose enough for rounding, tight enough to catch a real drift.
import { readFileSync } from 'node:fs'
import assert from 'node:assert'

const load = (id) => JSON.parse(readFileSync(`public/data/atlas/${id}.json`, 'utf8'))

function pearson(xs, ys) {
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy
  }
  return sxy / Math.sqrt(sxx * syy)
}

// slug -> { pair, r, n, claims: [[datasetId, countryName, value], ...] }
const ARTICLES = {
  'does-money-buy-happiness': {
    pair: ['gdp-per-capita', 'happiness-index'], r: 0.64, n: 160,
    claims: [
      ['happiness-index', 'Finland', 7.76], ['happiness-index', 'Afghanistan', 1.45],
      ['happiness-index', 'Nicaragua', 6.30], ['happiness-index', 'Botswana', 3.46],
      ['gdp-per-capita', 'Nicaragua', 2848], ['gdp-per-capita', 'Botswana', 7696],
      ['gdp-per-capita', 'Hong Kong SAR, China', 54075],
    ],
  },
  'healthcare-spending-vs-life-expectancy': {
    pair: ['healthcare-expenditure', 'life-expectancy'], r: 0.18, n: 193,
    claims: [
      ['healthcare-expenditure', 'Afghanistan', 14.99], ['healthcare-expenditure', 'Qatar', 2.52],
      ['healthcare-expenditure', 'Tuvalu', 27.09], ['healthcare-expenditure', 'Lao PDR', 1.33],
      ['life-expectancy', 'Monaco', 86.5], ['life-expectancy', 'Nigeria', 54.63],
      ['life-expectancy', 'Qatar', 82.52], ['life-expectancy', 'Lesotho', 57.8],
    ],
  },
  'internet-access-vs-income': {
    pair: ['internet-users', 'gdp-per-capita'], r: 0.47, n: 185,
    claims: [
      ['internet-users', 'Bahrain', 100], ['internet-users', 'Burundi', 8.6],
      ['internet-users', 'Jordan', 95.62], ['internet-users', 'Barbados', 70.36],
      ['internet-users', 'Kiribati', 89.44], ['gdp-per-capita', 'Jordan', 4618],
      ['gdp-per-capita', 'Barbados', 26545],
    ],
  },
  'fertility-rate-vs-education': {
    pair: ['fertility-rate', 'tertiary-enrollment'], r: -0.66, n: 150,
    claims: [
      ['fertility-rate', 'Chad', 6.03], ['fertility-rate', 'Macao SAR, China', 0.58],
      ['fertility-rate', 'Korea, Rep.', 0.75], ['fertility-rate', 'Angola', 5.05],
      ['tertiary-enrollment', 'Greece', 165.11], ['tertiary-enrollment', 'Suriname', 2.57],
      ['tertiary-enrollment', 'Korea, Rep.', 111.85], ['tertiary-enrollment', 'Malawi', 2.71],
    ],
  },
  'renewable-energy-share-explained': {
    pair: ['renewable-energy', 'gdp-per-capita'], r: -0.24, n: 200,
    claims: [
      ['renewable-energy', 'Congo, Dem. Rep.', 96.3], ['renewable-energy', 'Turkmenistan', 0.1],
      ['renewable-energy', 'Kuwait', 0.1], ['renewable-energy', 'Burundi', 83.0],
      ['gdp-per-capita', 'Congo, Dem. Rep.', 649], ['gdp-per-capita', 'Burundi', 219],
      ['gdp-per-capita', 'Bermuda', 142855],
    ],
  },
  'press-freedom-and-corruption': {
    pair: ['press-freedom', 'corruption-perception'], r: -0.61, n: 170,
    claims: [
      ['press-freedom', 'Norway', 6.72], ['press-freedom', 'Eritrea', 81.45],
      ['corruption-perception', 'Denmark', 90], ['corruption-perception', 'South Sudan', 8],
      ['corruption-perception', 'Somalia', 9],
    ],
  },
  'doctors-per-capita-and-infant-mortality': {
    pair: ['physicians-density', 'infant-mortality'], r: -0.73, n: 154,
    claims: [
      ['physicians-density', 'Cuba', 9.54], ['physicians-density', 'Niger', 0.04],
      ['physicians-density', 'Belarus', 4.72], ['physicians-density', 'Portugal', 5.85],
      ['infant-mortality', 'South Sudan', 71.9], ['infant-mortality', 'San Marino', 1.2],
      ['infant-mortality', 'Belarus', 1.8], ['infant-mortality', 'Portugal', 2.7],
    ],
  },
  'sanitation-and-maternal-mortality': {
    pair: ['sanitation-access', 'maternal-mortality'], r: -0.80, n: 184,
    claims: [
      ['sanitation-access', 'Ethiopia', 10.36], ['sanitation-access', 'Chad', 13.14],
      ['maternal-mortality', 'Nigeria', 993], ['maternal-mortality', 'Norway', 1],
      ['maternal-mortality', 'Chad', 748], ['maternal-mortality', 'Belarus', 1],
    ],
  },
}

let checked = 0
for (const [slug, spec] of Object.entries(ARTICLES)) {
  const [aId, bId] = spec.pair
  const A = load(aId), B = load(bId)
  const mb = new Map(B.data.map((r) => [r.iso_a3, r.value]))
  const joined = A.data.filter((r) => mb.has(r.iso_a3))
  assert.equal(joined.length, spec.n, `${slug}: joined country count ${joined.length} != ${spec.n}`)

  const r = pearson(joined.map((d) => d.value), joined.map((d) => mb.get(d.iso_a3)))
  assert.ok(Math.abs(r - spec.r) < 0.015, `${slug}: correlation ${r.toFixed(3)} != claimed ${spec.r}`)
  checked++

  for (const [id, country, claimed] of spec.claims) {
    const row = load(id).data.find((x) => x.name === country)
    assert.ok(row, `${slug}: ${country} missing from ${id}`)
    // Values are quoted to at most 2dp; allow half a unit in the last quoted place.
    const tol = Math.max(Math.abs(claimed) * 0.005, 0.005)
    assert.ok(
      Math.abs(row.value - claimed) <= tol,
      `${slug}: ${id}/${country} is ${row.value} but the article says ${claimed}`,
    )
    checked++
  }
}
console.log(`article facts OK (${checked} claims verified across ${Object.keys(ARTICLES).length} posts)`)
