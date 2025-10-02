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
  // Core previously added
  'population-density': 'Monaco packs in over 19,000 people per km²—one of the densest places on Earth.',
  'gdp-per-capita': 'Luxembourg leads global GDP per capita, topping $100k per person.',
  'life-expectancy': 'Japan and Monaco regularly post life expectancies above 84 years.',
  'co2-emissions': 'China and the U.S. together produce roughly 40% of global CO₂ emissions.',
  'internet-users': 'Internet use exceeds 97% of the population in several Nordic countries.',
  'literacy-rate': 'Global adult literacy has climbed above 85%, a huge rise over the past decades.',
  'unemployment-rate': 'Some economies sustain sub‑4% jobless rates while others face persistent double digits.',
  'forest-coverage': 'Suriname and Guyana retain over 80% of their land under forest cover.',
  'renewable-energy': 'Iceland runs largely on geothermal and hydropower renewables.',
  'urban-population': 'Over half of humanity now lives in cities—urbanization has doubled since 1950.',

  // Demographics & Population
  'population-total': 'A handful of countries account for well over half of the world\'s population.',
  'population-growth': 'Some countries still grow above 3% yearly while others now experience population decline.',
  'population-ages-65': 'Aging societies see 1 in 5 people 65+, while others remain overwhelmingly young.',
  'population-ages-0-14': 'In parts of sub‑Saharan Africa children under 15 make up close to half the population.',
  'birth-rate': 'Birth rates vary more than fivefold between high‑ and low‑fertility countries.',
  'death-rate': 'Higher crude death rates often reflect older populations rather than poorer health systems.',
  'fertility-rate': 'Global fertility fell from over 5 children per woman mid‑century to near replacement today.',
  'infant-mortality': 'Many countries have cut infant mortality to single digits per 1,000—dramatic progress.',
  'literacy-rate-youth': 'Youth literacy surpasses 95% in most regions, signaling long‑term educational gains.',
  'literacy-rate-adult-female': 'The gender literacy gap has narrowed fast; many countries now show near parity.',

  // Economy & Development
  'gdp-total': 'The largest economies generate a dominant share of global dollar‑denominated output.',
  'gdp-growth': 'Fastest‑growing economies can expand several times the world average in a single year.',
  'gni-per-capita': 'Financial centers and resource‑rich states often rank high in GNI per person.',
  'inflation-rate': 'Some economies tame inflation below 3% while others battle double‑digit surges.',
  'exports-goods-services': 'Export‑oriented nations ship goods and services worth large shares of GDP.',
  'imports-goods-services': 'High import shares can indicate open or processing‑focused economies.',
  'foreign-investment': 'Investment inflows can spike sharply during reform waves or resource booms.',
  'government-expenditure': 'Government consumption ranges from lean minimalist states to expansive welfare models.',
  'tax-revenue': 'Tax takes range from under 10% to well above 30% of GDP across countries.',
  'gross-savings': 'High domestic savings often underpin rapid investment and industrial growth.',
  'manufacturing-value': 'Manufacturing\'s GDP share is shrinking in some advanced economies and rising elsewhere.',
  'agriculture-value': 'Agriculture\'s share falls as economies diversify, yet remains vital for livelihoods.',

  // Environment & Energy
  'methane-emissions': 'Methane from farming, energy, and waste offers fast mitigation potential when cut.',
  'energy-consumption': 'Per‑capita energy use differs more than tenfold between countries.',
  'energy-imports': 'Some nations rely on net energy imports for most needs; others export substantial surpluses.',
  'fossil-fuel-consumption': 'Fossil fuels still dominate energy mixes in many economies.',
  'electricity-consumption': 'Electricity use per person surges with industrialization and digital adoption.',

  // Technology & Connectivity
  'mobile-subscriptions': 'Mobile subscriptions often exceed population—multi‑SIM usage is common.',
  'fixed-broadband': 'High broadband penetration correlates with advanced digital economies.',
  'telephone-lines': 'Fixed telephone lines have declined sharply as mobile networks expanded.',

  // Health & Wellbeing
  'healthcare-expenditure': 'Health spending spans from minimal outlays to double‑digit shares of GDP.',
  'hospital-beds': 'Hospital bed density reflects both capacity and national care models.',
  'physicians-density': 'Physician availability per 1,000 people shows stark regional gaps.',
  'nurses-midwives': 'Nurse and midwife density forms the backbone of primary care delivery.',
  'immunization-dpt': 'Routine DPT coverage above 90% is standard in many countries today.',
  'immunization-measles': 'Immunization lapses can trigger measles outbreaks despite overall gains.',
  'maternal-mortality': 'Maternal mortality has fallen sharply but remains a major challenge in some regions.',
  'tuberculosis-incidence': 'TB incidence has trended downward yet remains concentrated in high‑burden areas.',

  // Education
  'education-expenditure': 'Education spending priorities vary from under 3% to well above 6% of GDP.',
  'secondary-enrollment': 'Secondary net enrollment approaches universality in many middle‑income states.',
  'tertiary-enrollment': 'Tertiary enrollment has expanded rapidly with mass higher education.',

  // Infrastructure & Access
  'electricity-access': 'Near‑universal electricity access is still elusive in some rural regions.',
  'water-access': 'Basic drinking water coverage has risen sharply, yet rural gaps persist.',
  'sanitation-access': 'Improved sanitation lags water access in many low‑income countries.',
  'roads-paved': 'Paved road share highlights major disparities in transport infrastructure.',
  'rail-lines': 'Extensive rail networks support freight efficiency and lower emissions.',
  'air-passengers': 'Air passenger traffic concentrates in major hubs and tourism centers.',

  // Culture & Lifestyle
  'coffee-consumption': 'Nordic countries are renowned for some of the world\'s highest coffee consumption.',
  'alcohol-consumption': 'Alcohol consumption patterns reflect culture, policy, and income levels.'
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
