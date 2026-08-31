// Year-mode challenge logic. The /year-mode game shows a dataset's choropleth for a HIDDEN year
// in a multi-year window and asks the player to guess which year it's from. Today's year is
// picked deterministically from the day index, so every player sees the same puzzle.

import { getCurrentDayIndex } from './dailyChallenge.js'

// For v1 we only ship internet-users (the most visually dramatic change from 2000 to 2024).
// Adding more datasets later = add an entry to scripts/build-year-data.js + extend this picker.
export const YEAR_MODE_DATASET = 'internet-users'

let _cached = null
async function loadYearDataset() {
  if (_cached) return _cached
  const r = await fetch(`/data/year/${YEAR_MODE_DATASET}.json`)
  if (!r.ok) throw new Error(`Failed to load year-mode data: HTTP ${r.status}`)
  _cached = await r.json()
  return _cached
}

export async function getTodaysYearChallenge() {
  const data = await loadYearDataset()
  const dayIndex = getCurrentDayIndex()
  const years = data.availableYears
  const year = years[dayIndex % years.length]
  return {
    dayIndex,
    year,
    yearData: data.years[String(year)],
    title: data.title,
    description: data.description,
    unit: data.unit,
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
