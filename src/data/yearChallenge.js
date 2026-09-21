// Year-mode challenge logic. The /year-mode game shows a dataset's choropleth for a HIDDEN year
// in a multi-year window and asks the player to guess which year it's from. Today's year is
// picked deterministically from the day index, so every player sees the same puzzle.

import { getCurrentDayIndex } from './dailyChallenge.js'

// Rotated by day index so the mode doesn't show the same puzzle forever. Must match the ids
// built by scripts/build-year-data.js; scripts/check-year-mode.mjs asserts they line up.
export const YEAR_MODE_DATASETS = [
  'internet-users',
  'mobile-subscriptions',
  'child-mortality',
  'electricity-access',
  'life-expectancy',
  'fertility-rate',
]

export function yearDatasetForDay(dayIndex) {
  return YEAR_MODE_DATASETS[Math.abs(dayIndex) % YEAR_MODE_DATASETS.length]
}

const _cache = new Map()
async function loadYearDataset(id) {
  if (_cache.has(id)) return _cache.get(id)
  const r = await fetch(`/data/year/${id}.json`)
  if (!r.ok) throw new Error(`Failed to load year-mode data: HTTP ${r.status}`)
  const data = await r.json()
  _cache.set(id, data)
  return data
}

export async function getTodaysYearChallenge() {
  const dayIndex = getCurrentDayIndex()
  const data = await loadYearDataset(yearDatasetForDay(dayIndex))
  const years = data.availableYears
  const year = years[(dayIndex + Math.floor(dayIndex / YEAR_MODE_DATASETS.length)) % years.length]
  return {
    dayIndex,
    year,
    yearData: data.years[String(year)],
    title: data.title,
    description: data.description,
    unit: data.unit,
    datasetId: data.id,
    startYear: data.startYear,
    endYear: data.endYear,
    availableYears: years,
  }
}

// Pick a sensible distance bucket for the result screen.
//   0 → bullseye, 1 → great, 2–3 → close, otherwise → miss.
export function scoreYearGuess(distance) {
  if (distance === 0) return { icon: 'target', label: 'Bullseye!', tone: 'win' }
  if (distance === 1) return { icon: 'trophy', label: 'Just 1 year off — great guess', tone: 'win' }
  if (distance <= 3) return { icon: 'check', label: `${distance} years off — close`, tone: 'close' }
  return { icon: 'close', label: `${distance} years off`, tone: 'miss' }
}
