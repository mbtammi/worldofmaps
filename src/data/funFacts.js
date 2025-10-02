// Fun Facts Utility
// Central place to manage per-dataset fun fact overrides and a fallback generator.
// Strategy:
//  - Provide a concise human-written fact for well-known core datasets.
//  - For all other datasets, auto-generate a single-line fact based on extremes in the data.
//  - This avoids maintaining 60+ manual strings while keeping every dataset informative.
//  - Add new overrides by extending FUN_FACT_OVERRIDES.

// Helper to compute extremes (min/max) ignoring null/NaN
function computeExtremes(data) {
  if (!Array.isArray(data) || !data.length) return null
  const valid = data.filter(d => typeof d.value === 'number' && !isNaN(d.value))
  if (!valid.length) return null
  let min = valid[0], max = valid[0]
  for (const row of valid) {
    if (row.value < min.value) min = row
    if (row.value > max.value) max = row
  }
  return { min, max }
}

// Static overrides: keep these short and punchy.
const FUN_FACT_OVERRIDES = {
  'population-density': 'Monaco packs in over 19,000 people per km²—one of the densest places on Earth.',
  'gdp-per-capita': 'Luxembourg leads global GDP per capita, topping $100k per person.',
  'life-expectancy': 'Japan and Monaco regularly post life expectancies above 84 years.',
  'co2-emissions': 'China and the U.S. together produce roughly 40% of global CO₂ emissions.',
  'internet-users': 'Internet use exceeds 97% of the population in several Nordic countries.',
  'literacy-rate': 'Global adult literacy has climbed above 85%, a huge rise over the past decades.',
  'unemployment-rate': 'Some economies sustain sub‑4% jobless rates while others face persistent double digits.',
  'forest-coverage': 'Suriname and Guyana retain over 80% of their land under forest cover.',
  'renewable-energy': 'Iceland runs largely on geothermal and hydropower renewables.',
  'urban-population': 'Over half of humanity now lives in cities—urbanization has doubled since 1950.'
}

export function getFunFact(datasetId, data, title) {
  if (FUN_FACT_OVERRIDES[datasetId]) return FUN_FACT_OVERRIDES[datasetId]
  const extremes = computeExtremes(data)
  if (!extremes) return `Interesting patterns emerge in global ${title.toLowerCase()} data.`
  const { min, max } = extremes
  // Format numbers lightly (integers if large, one decimal if < 100 and not integer)
  function fmt(v) {
    if (v === 0) return '0'
    if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString()
    if (Math.abs(v) >= 100) return Math.round(v).toString()
    if (Math.abs(v) >= 10) return (+v.toFixed(1)).toString()
    return (+v.toFixed(2)).toString()
  }
  const maxPart = `${max.name} tops the list`
  const minPart = `${min.name} sits at the lower end`
  return `${maxPart}, while ${minPart}, showing wide variation.`
}

export default { getFunFact }
