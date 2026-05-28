// Build-time data snapshot for the Atlas pages (run periodically, output committed).
//
//   node scripts/build-atlas-data.js
//
// Fetches real country-level values directly from the source APIs (server-side, no CORS /
// proxy needed) and writes one JSON per dataset to public/data/atlas/<id>.json plus an
// _index.json. The prerender step and the /atlas pages read these snapshots, so production
// builds stay fast and offline-deterministic (and the game stops depending on a live fetch).

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  WORLD_BANK_INDICATORS,
  OWID_DATASETS,
  getAllAvailableDatasets,
} from '../src/data/dataSources.js'
import { getFunFact } from '../src/data/funFacts.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'data', 'atlas')
mkdirSync(OUT_DIR, { recursive: true })

const YEAR = new Date().getFullYear() - 1 // last complete year
const RANGE_START = YEAR - 4
const MIN_COUNTRIES = 30 // skip sparse datasets to avoid thin pages
const CONCURRENCY = 6

const REST_KINDS = {
  'land-area': 'area',
  'languages-count': 'languages',
  'timezones-count': 'timezones',
}

// Nicer titles/descriptions for well-known datasets; everything else is derived from the id.
const META = {
  'population-density': ['Population Density', 'People per square kilometer of land area, by country.'],
  'gdp-per-capita': ['GDP per Capita', 'Gross domestic product per person, in current US dollars.'],
  'life-expectancy': ['Life Expectancy', 'Average number of years a newborn is expected to live.'],
  'internet-users': ['Internet Users', 'Share of the population using the internet (%).'],
  'literacy-rate': ['Adult Literacy Rate', 'Share of adults aged 15+ who can read and write (%).'],
  'unemployment-rate': ['Unemployment Rate', 'Share of the labor force that is unemployed (%).'],
  'forest-coverage': ['Forest Coverage', 'Share of land area covered by forest (%).'],
  'urban-population': ['Urban Population', 'Share of the population living in urban areas (%).'],
  'renewable-energy': ['Renewable Energy Use', 'Renewable energy as a share of total final energy use (%).'],
  'co2-emissions-per-capita': ['CO₂ Emissions per Capita', 'Metric tons of CO₂ emitted per person per year.'],
  'healthcare-expenditure': ['Healthcare Expenditure', 'Current health expenditure as a share of GDP (%).'],
  'fertility-rate': ['Fertility Rate', 'Average number of births per woman.'],
  'gdp-per-capita-ppp': ['GDP per Capita (PPP)', 'GDP per person adjusted for purchasing power parity.'],
}

const titleFor = (id) =>
  META[id]?.[0] || id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const descFor = (id) =>
  META[id]?.[1] ||
  `${titleFor(id)} by country, shown on a world map with full country rankings.`

// World Bank "country/all" includes aggregates (World, regions, income groups). Build a set
// of real-country ISO3 codes so those rows never pollute the map or rankings.
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

async function fetchWorldBank(indicator) {
  const countries = await realCountryISO3()
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=4000&date=${RANGE_START}:${YEAR}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`WB HTTP ${r.status}`)
  const j = await r.json()
  if (!Array.isArray(j) || !Array.isArray(j[1])) throw new Error('WB bad format')
  const byCountry = new Map()
  for (const it of j[1]) {
    if (!it || it.value == null || !it.countryiso3code || !it.country?.value) continue
    const iso3 = it.countryiso3code
    if (!countries.has(iso3)) continue
    const yr = parseInt(it.date, 10)
    if (Number.isNaN(yr)) continue
    const cur = byCountry.get(iso3)
    if (!cur || yr > cur.year) {
      byCountry.set(iso3, {
        iso_a2: iso3.slice(0, 2),
        iso_a3: iso3,
        name: it.country.value,
        value: parseFloat(it.value),
        year: yr,
      })
    }
  }
  return [...byCountry.values()].filter((d) => d.name && !Number.isNaN(d.value) && d.value !== 0)
}

let _restBase = null
async function fetchRestBase() {
  if (_restBase) return _restBase
  const r = await fetch(
    'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,area,languages,timezones',
  )
  if (!r.ok) throw new Error(`REST HTTP ${r.status}`)
  _restBase = await r.json()
  return _restBase
}

async function fetchRest(kind) {
  const base = await fetchRestBase()
  const out = []
  for (const c of base) {
    if (!c?.cca3 || !c.name?.common) continue
    let v = null
    if (kind === 'area') v = typeof c.area === 'number' ? c.area : null
    else if (kind === 'languages') v = c.languages ? Object.keys(c.languages).length : null
    else if (kind === 'timezones') v = Array.isArray(c.timezones) ? c.timezones.length : null
    if (v == null || Number.isNaN(v) || v === 0) continue
    out.push({ iso_a2: c.cca2, iso_a3: c.cca3, name: c.name.common, value: v, year: YEAR })
  }
  return out
}

function computeStats(data) {
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const sum = data.reduce((acc, d) => acc + d.value, 0)
  return {
    count: data.length,
    max: { name: sorted[0].name, iso_a3: sorted[0].iso_a3, value: sorted[0].value },
    min: {
      name: sorted[sorted.length - 1].name,
      iso_a3: sorted[sorted.length - 1].iso_a3,
      value: sorted[sorted.length - 1].value,
    },
    avg: sum / data.length,
    year: Math.max(...data.map((d) => d.year || 0)),
  }
}

async function buildOne(d) {
  const id = d.id
  try {
    let data
    let source
    if (WORLD_BANK_INDICATORS[id]) {
      data = await fetchWorldBank(WORLD_BANK_INDICATORS[id])
      source = 'World Bank Open Data'
    } else if (REST_KINDS[id]) {
      data = await fetchRest(REST_KINDS[id])
      source = 'REST Countries'
    } else {
      return null // OWID handled separately / skipped if archived
    }
    if (!data || data.length < MIN_COUNTRIES) {
      console.warn(`  ✗ ${id}: only ${data?.length || 0} countries (min ${MIN_COUNTRIES})`)
      return null
    }
    const title = titleFor(id)
    const stats = computeStats(data)
    const out = {
      id,
      title,
      description: descFor(id),
      category: d.category,
      source,
      year: stats.year,
      stats,
      funFact: getFunFact(id, data, title),
      data: data.sort((a, b) => b.value - a.value),
    }
    writeFileSync(join(OUT_DIR, `${id}.json`), JSON.stringify(out))
    console.log(`  ✓ ${id}: ${data.length} countries (${source})`)
    return { id, title, category: d.category, count: data.length, year: stats.year }
  } catch (e) {
    console.warn(`  ✗ ${id}: ${e.message}`)
    return null
  }
}

async function main() {
  const targets = getAllAvailableDatasets().filter(
    (d) =>
      (d.estimatedAvailability === 'high' || d.estimatedAvailability === 'medium') &&
      d.category !== 'Expanded Indicators',
  )
  console.log(`Building atlas snapshots for ${targets.length} curated datasets...\n`)

  const queue = [...targets]
  const index = []
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const d = queue.shift()
        const entry = await buildOne(d)
        if (entry) index.push(entry)
      }
    }),
  )

  index.sort((a, b) => a.title.localeCompare(b.title))
  writeFileSync(join(OUT_DIR, '_index.json'), JSON.stringify(index, null, 2))

  // Also emit the runtime-validated allowlist used by dailyChallenge.js to restrict
  // the rotation pool. Keeps the daily game from ever picking a dataset that will
  // fail the quality gate at runtime.
  const ids = index.map((d) => d.id).sort()
  const validBody =
    '// Auto-generated by scripts/build-atlas-data.js — do not edit by hand.\n' +
    '// Datasets that have passed the runtime quality gate (>=30 real countries,\n' +
    '// from World Bank / REST Countries) and have a snapshot in public/data/atlas/.\n' +
    '// Used by dailyChallenge.js to restrict the rotation pool to known-working datasets,\n' +
    '// so the daily game never picks a dataset that will fail the quality gate at runtime.\n\n' +
    'export const VALID_DATASET_IDS = [\n' +
    ids.map((id) => `  '${id}',`).join('\n') +
    '\n]\n'
  writeFileSync(join(__dirname, '..', 'src', 'data', 'validDatasets.js'), validBody)

  console.log(`\nAtlas data built: ${index.length}/${targets.length} datasets -> public/data/atlas/`)
  console.log(`Wrote src/data/validDatasets.js with ${ids.length} IDs (rotation allowlist)`)
}

main()
