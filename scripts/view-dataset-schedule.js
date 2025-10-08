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


// Use the real dailyChallenge.js logic
import { getUpcomingDatasets, getDatasetHistory, getCurrentDayIndex } from '../src/data/dailyChallenge.js'
import { getAllAvailableDatasets } from '../src/data/dataSources.js'

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
const absDays = Math.abs(days)
const allMeta = getAllAvailableDatasets()
const metaMap = new Map(allMeta.map(m => [m.id, m]))

console.log('\n🗓️  Dataset Schedule for World of Maps')
console.log('═'.repeat(70))
console.log(`📊 Showing ${days < 0 ? 'past' : 'upcoming'} ${absDays} day(s)`) // clarify plural
console.log('═'.repeat(70))

const seen = new Set()

if (days >= 0) {
  // Upcoming including today
  const upcoming = getUpcomingDatasets(absDays)
  for (const entry of upcoming) {
    const dsMeta = metaMap.get(entry.datasetId) || {}
    const icon = getCategoryIcon(resolveCategoryIconKey(dsMeta.category))
    const isRepeat = seen.has(entry.datasetId) ? '🔁' : '✨'
    const dayLabel = entry.isToday ? '(TODAY)' : ''
    console.log(`${entry.date} ${dayLabel.padEnd(12)} ${icon} ${entry.datasetId.padEnd(32)} ${isRepeat}`)
    seen.add(entry.datasetId)
  }
} else {
  // Past days (exclude today by default) -> we ask history from (currentDay-absDays) to (currentDay-1)
  const currentDay = getCurrentDayIndex()
  const start = currentDay - absDays
  const end = currentDay - 1
  const history = getDatasetHistory(start, end)
  for (const entry of history.history) {
    const dsMeta = metaMap.get(entry.datasetId) || {}
    const icon = getCategoryIcon(resolveCategoryIconKey(dsMeta.category))
    const dayOffset = entry.dayIndex - currentDay
    const isRepeat = seen.has(entry.datasetId) ? '🔁' : '✨'
    const dayLabel = dayOffset === -1 ? '(Yesterday)' : ''
    console.log(`${entry.date} ${dayLabel.padEnd(12)} ${icon} ${entry.datasetId.padEnd(32)} ${isRepeat}`)
    seen.add(entry.datasetId)
  }
}

console.log('\n' + '═'.repeat(70))
console.log('✨ = First occurrence  🔁 = Repeat from earlier in this listing window')
console.log('\n')

function resolveCategoryIconKey(categoryName) {
  if (!categoryName) return undefined
  // Map long category names back to keys used by icons
  const mapping = {
    'Demographics & Society': 'DEMOGRAPHICS',
    'Economy & Development': 'ECONOMY',
    'Environment & Climate': 'ENVIRONMENT',
    'Technology & Innovation': 'TECHNOLOGY',
    'Health & Wellbeing': 'HEALTH',
    'Education & Knowledge': 'EDUCATION',
    'Infrastructure & Transport': 'INFRASTRUCTURE',
    'Culture & Lifestyle': 'CULTURE',
    'Cultural & Structural Diversity': 'CULTURE',
    'Expanded Indicators': 'ECONOMY'
  }
  return mapping[categoryName] || 'CULTURE'
}
