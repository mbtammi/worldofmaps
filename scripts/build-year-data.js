// Build-time data snapshot for the /year-mode game.
//
//   node scripts/build-year-data.js
//
// For each curated dataset, fetches one World Bank year-snapshot per year in a window
// (default 2000-2024) and writes the result as public/data/year/<id>.json. The committed
// JSON is what the year-mode game reads at runtime — no live API calls in production.
//
// Only one dataset is enabled for v1 (internet-users) — it changes dramatically over the
// window (single-digit % in 2000, > 80% in many countries by 2024), so the year-guessing
// puzzle is actually solvable. Add more here when ready.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'data', 'year')
mkdirSync(OUT_DIR, { recursive: true })

const START_YEAR = 2000
const END_YEAR = 2024

const DATASETS = [
  {
    id: 'internet-users',
    indicator: 'IT.NET.USER.ZS',
    title: 'Internet Users',
    description: 'Share of the population using the internet (%).',
    unit: '%',
  },
]

let _countrySet = null
async function realCountryISO3() {
  if (_countrySet) return _countrySet
  const r = await fetch('https://api.worldbank.org/v2/country?format=json&per_page=400')
  const j = await r.json()
  _countrySet = new Set(
    (j[1] || [])
      .filter((c) => c.region?.value && c.region.value !== 'Aggregates')
      .map((c) => c.id),
  )
  return _countrySet
}

async function fetchOneYear(indicator, year, countries) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=4000&date=${year}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${indicator}@${year}`)
  const j = await r.json()
  if (!Array.isArray(j) || !Array.isArray(j[1])) return []
  const out = []
  for (const it of j[1]) {
    if (!it || it.value == null || !it.countryiso3code) continue
    if (!countries.has(it.countryiso3code)) continue
    out.push({ iso_a3: it.countryiso3code, value: parseFloat(it.value) })
  }
  return out
}

async function buildOne(d) {
  const countries = await realCountryISO3()
  const years = {}
  let kept = 0
  for (let y = START_YEAR; y <= END_YEAR; y++) {
    try {
      const data = await fetchOneYear(d.indicator, y, countries)
      if (data.length >= 30) {
        years[y] = data
        kept++
        process.stdout.write(`  ✓ ${y}:${data.length} `)
      } else {
        process.stdout.write(`  ✗ ${y}:${data.length} `)
      }
    } catch (e) {
      process.stdout.write(`  ✗ ${y}:err `)
    }
  }
  process.stdout.write('\n')

  if (kept < 5) {
    console.warn(`  ⚠️  ${d.id}: only ${kept} years passed quality gate — skipping output`)
    return false
  }
  const out = {
    id: d.id,
    title: d.title,
    description: d.description,
    unit: d.unit,
    startYear: START_YEAR,
    endYear: END_YEAR,
    availableYears: Object.keys(years).map(Number).sort((a, b) => a - b),
    years,
  }
  writeFileSync(join(OUT_DIR, `${d.id}.json`), JSON.stringify(out))
  console.log(`  → wrote ${d.id}.json with ${kept} years`)
  return true
}

async function main() {
  console.log(`Building year-mode snapshots (${START_YEAR}–${END_YEAR})...\n`)
  let n = 0
  for (const d of DATASETS) {
    console.log(`* ${d.id} (${d.indicator})`)
    if (await buildOne(d)) n++
  }
  console.log(`\nYear-mode data built: ${n}/${DATASETS.length} datasets -> public/data/year/`)
}

main()
