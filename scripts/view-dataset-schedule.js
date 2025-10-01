#!/usr/bin/env node
/**
 * Dataset Schedule Viewer
 * Shows which datasets are/were used on specific dates
 * 
 * Usage:
 *   node scripts/view-dataset-schedule.js          # Show next 7 days
 *   node scripts/view-dataset-schedule.js 30       # Show next 30 days
 *   node scripts/view-dataset-schedule.js -7       # Show last 7 days
 */

// Simplified version of the rotation logic
const DATASET_CATEGORIES = {
  DEMOGRAPHICS: ['population-density', 'population-total', 'population-growth', 'urban-population', 'population-ages-65', 'population-ages-0-14', 'life-expectancy', 'birth-rate', 'death-rate', 'fertility-rate', 'infant-mortality'],
  ECONOMY: ['gdp-per-capita', 'gdp-total', 'gdp-growth', 'gni-per-capita', 'unemployment-rate', 'inflation-rate', 'exports-goods-services', 'imports-goods-services', 'foreign-investment', 'government-expenditure', 'tax-revenue', 'gross-savings', 'manufacturing-value', 'agriculture-value'],
  HEALTH: ['healthcare-expenditure', 'hospital-beds', 'physicians-density', 'nurses-midwives', 'immunization-dpt', 'immunization-measles', 'maternal-mortality', 'tuberculosis-incidence'],
  EDUCATION: ['literacy-rate', 'literacy-rate-youth', 'education-expenditure', 'secondary-enrollment', 'tertiary-enrollment'],
  TECHNOLOGY: ['internet-users', 'mobile-subscriptions', 'fixed-broadband', 'telephone-lines'],
  INFRASTRUCTURE: ['electricity-access', 'electricity-consumption', 'water-access', 'sanitation-access', 'roads-paved', 'rail-lines', 'air-passengers'],
  ENVIRONMENT: ['forest-coverage', 'energy-consumption', 'renewable-energy', 'methane-emissions', 'energy-imports', 'fossil-fuel-consumption'],
  CULTURE: ['coffee-consumption', 'alcohol-consumption']
}

const highAvailability = [
  'population-density', 'population-total', 'population-growth', 'urban-population',
  'population-ages-65', 'population-ages-0-14', 'life-expectancy', 'birth-rate',
  'death-rate', 'fertility-rate', 'infant-mortality',
  'gdp-per-capita', 'gdp-total', 'gdp-growth', 'gni-per-capita', 'unemployment-rate',
  'inflation-rate', 'exports-goods-services', 'imports-goods-services',
  'foreign-investment', 'government-expenditure', 'tax-revenue', 'gross-savings',
  'manufacturing-value', 'agriculture-value',
  'healthcare-expenditure', 'hospital-beds', 'physicians-density', 'nurses-midwives',
  'immunization-dpt', 'immunization-measles', 'maternal-mortality', 'tuberculosis-incidence',
  'literacy-rate', 'literacy-rate-youth', 'education-expenditure',
  'secondary-enrollment', 'tertiary-enrollment',
  'internet-users', 'mobile-subscriptions', 'fixed-broadband', 'telephone-lines',
  'electricity-access', 'electricity-consumption', 'water-access', 'sanitation-access',
  'roads-paved', 'rail-lines', 'air-passengers',
  'forest-coverage', 'energy-consumption', 'renewable-energy', 'methane-emissions',
  'energy-imports', 'fossil-fuel-consumption'
]

const mediumAvailability = ['coffee-consumption', 'alcohol-consumption']

function getAllDatasets() {
  const all = []
  Object.entries(DATASET_CATEGORIES).forEach(([category, datasets]) => {
    datasets.forEach(id => {
      const avail = highAvailability.includes(id) ? 'high' : 
                    mediumAvailability.includes(id) ? 'medium' : 'low'
      all.push({ id, category, availability: avail })
    })
  })
  return all.filter(d => d.availability === 'high' || d.availability === 'medium')
}

function seededRandom(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }
  return function() {
    hash = ((hash * 1103515245) + 12345) & 0x7fffffff
    return hash / 0x7fffffff
  }
}

function seededShuffle(array, seed) {
  const shuffled = [...array]
  const rng = seededRandom(seed)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getCurrentDayIndex() {
  const MS_PER_HOUR = 60 * 60 * 1000
  const MS_PER_DAY = 24 * MS_PER_HOUR
  const RESET_HOUR_UTC = 5
  const nowUtcMs = Date.now()
  const shifted = nowUtcMs - (RESET_HOUR_UTC * MS_PER_HOUR)
  const rawIndex = Math.floor(shifted / MS_PER_DAY)
  const CYCLE_LENGTH_DAYS = 365
  return ((rawIndex % CYCLE_LENGTH_DAYS) + CYCLE_LENGTH_DAYS) % CYCLE_LENGTH_DAYS
}

function getDatasetForDay(dayIndex) {
  const suitableDatasets = getAllDatasets()
  const poolSize = suitableDatasets.length
  const cycleNumber = Math.floor(dayIndex / poolSize)
  const positionInCycle = dayIndex % poolSize
  const shuffleSeed = `worldofmaps2025_cycle${cycleNumber}`
  const shuffledDatasets = seededShuffle(suitableDatasets, shuffleSeed)
  return shuffledDatasets[positionInCycle]
}

function getCategoryIcon(category) {
  const icons = {
    DEMOGRAPHICS: '👥',
    ECONOMY: '💰',
    HEALTH: '🏥',
    EDUCATION: '🎓',
    TECHNOLOGY: '💻',
    INFRASTRUCTURE: '🚧',
    ENVIRONMENT: '🌍',
    CULTURE: '🎭'
  }
  return icons[category] || '📊'
}

// Main
const days = parseInt(process.argv[2] || '7')
const currentDay = getCurrentDayIndex()
const suitableDatasets = getAllDatasets()
const poolSize = suitableDatasets.length

console.log('\n🗓️  Dataset Schedule for World of Maps')
console.log('═'.repeat(70))
console.log(`📊 Total available datasets: ${poolSize}`)
console.log(`📅 Current day index: ${currentDay}`)
console.log(`🔄 Cycle: ${Math.floor(currentDay / poolSize)} (Position: ${currentDay % poolSize + 1}/${poolSize})`)
console.log('═'.repeat(70))

const start = days < 0 ? currentDay + days : currentDay
const end = days < 0 ? currentDay : currentDay + days

console.log(`\n${days < 0 ? '📜 Past' : '🔮 Upcoming'} ${Math.abs(days)} Days:\n`)

const seen = new Set()
for (let i = start; i < end; i++) {
  const dataset = getDatasetForDay(i)
  const date = new Date()
  const dayOffset = i - currentDay
  date.setDate(date.getDate() + dayOffset)
  
  const dateStr = date.toISOString().split('T')[0]
  const dayLabel = dayOffset === 0 ? '(TODAY)' : dayOffset === -1 ? '(Yesterday)' : dayOffset === 1 ? '(Tomorrow)' : ''
  const icon = getCategoryIcon(dataset.category)
  const isRepeat = seen.has(dataset.id) ? '🔁' : '✨'
  
  console.log(`${dateStr} ${dayLabel.padEnd(12)} ${icon} ${dataset.id.padEnd(30)} ${isRepeat}`)
  seen.add(dataset.id)
}

console.log('\n' + '═'.repeat(70))
console.log(`✨ = First occurrence  🔁 = Repeat from earlier in this period`)
console.log(`\nℹ️  In each ${poolSize}-day cycle, all datasets appear exactly once.`)
console.log('\n')
