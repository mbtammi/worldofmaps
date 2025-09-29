// Daily Challenge System
// Manages daily dataset rotation with timezone-aware switching

import { getAllAvailableDatasets } from './dataSources.js'
import { fetchDataset } from './dataFetcher.js'

// Mock localStorage for Node.js environments
const storage = typeof localStorage !== 'undefined' ? localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  key: () => null,
  length: 0
}

// Challenge configuration
const CHALLENGE_CONFIG = {
  // What time (UTC) should the daily challenge reset?
  // Daily reset time: 07:00 Helsinki time.
  // Finland is UTC+2 (standard) / UTC+3 (DST). For simplicity we fix to 05:00 UTC which maps to 07:00 during standard time
  // and 08:00 during DST. If exact 07:00 local time across DST is required, we'd need to compute Europe/Helsinki offset.
  RESET_HOUR_UTC: 5,
  
  // How many days should we cycle through before repeating?
  CYCLE_LENGTH_DAYS: 365,
  
  // Seed for reproducible randomization
  RANDOM_SEED: 'worldofmaps2025',
  
  // Fallback datasets if API fails
  FALLBACK_DATASETS: [
    'population-density',
    'gdp-per-capita', 
    'life-expectancy',
    'co2-emissions',
    'internet-users',
    'literacy-rate',
    'unemployment-rate'
  ]
}

// Simple seeded random number generator
function seededRandom(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return function() {
    hash = ((hash * 1103515245) + 12345) & 0x7fffffff
    return hash / 0x7fffffff
  }
}

// Get the current day index based purely on UTC and the configured RESET_HOUR_UTC.
// This avoids unreliable string->Date timezone parsing and guarantees the day rolls over
// exactly at RESET_HOUR_UTC no matter the user's local timezone or DST.
// Formula: floor( (nowUTC - resetHourUTC)/MS_PER_DAY )
export function getCurrentDayIndex() {
  const MS_PER_HOUR = 60 * 60 * 1000
  const MS_PER_DAY = 24 * MS_PER_HOUR
  const nowUtcMs = Date.now() // JS Date.now is UTC-based epoch ms
  const shifted = nowUtcMs - (CHALLENGE_CONFIG.RESET_HOUR_UTC * MS_PER_HOUR)
  // Use modulo cycle length with positive normalization
  const rawIndex = Math.floor(shifted / MS_PER_DAY)
  const cycleIndex = ((rawIndex % CHALLENGE_CONFIG.CYCLE_LENGTH_DAYS) + CHALLENGE_CONFIG.CYCLE_LENGTH_DAYS) % CHALLENGE_CONFIG.CYCLE_LENGTH_DAYS
  return cycleIndex
}

// Get the dataset ID for a specific day
function getDatasetForDay(dayIndex) {
  const availableDatasets = getAllAvailableDatasets()
  
  // Filter to high and medium availability datasets for daily challenges
  const suitableDatasets = availableDatasets.filter(dataset => 
    dataset.estimatedAvailability === 'high' || dataset.estimatedAvailability === 'medium'
  )
  
  if (suitableDatasets.length === 0) {
    console.warn('No suitable datasets found, using fallback')
    return CHALLENGE_CONFIG.FALLBACK_DATASETS[dayIndex % CHALLENGE_CONFIG.FALLBACK_DATASETS.length]
  }
  
  // Use seeded randomization for reproducible but seemingly random selection
  const rng = seededRandom(CHALLENGE_CONFIG.RANDOM_SEED + dayIndex)
  const randomIndex = Math.floor(rng() * suitableDatasets.length)
  
  return suitableDatasets[randomIndex].id
}

// Get today's dataset
export async function getTodaysDataset() {
  const todayIndex = getCurrentDayIndex()
  const datasetId = getDatasetForDay(todayIndex)

  // Daily rollover handling: when the computed day index changes, clear stale per-day progress keys.
  try {
    const lastIndexRaw = storage.getItem('worldofmaps_last_day_index')
    const lastIndex = lastIndexRaw != null ? parseInt(lastIndexRaw) : null
    if (lastIndex !== null && lastIndex !== todayIndex) {
      // Purge previous daily progress + cached global averages for cleanliness
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        if (!k) continue
        if (k.startsWith('worldofmaps_daily_progress_') || k.startsWith('worldofmaps_global_avg_')) {
          try { storage.removeItem(k) } catch(_) {}
        }
      }
    }
    storage.setItem('worldofmaps_last_day_index', todayIndex.toString())
  } catch (e) {
    // Non-fatal; continue silently
  }

  console.log(`Today's challenge (day ${todayIndex}): ${datasetId}`)
  try {
    // IMPORTANT: clone dataset to avoid mutating a cached reference reused across days
    const raw = await fetchDataset(datasetId)
    const dataset = { ...raw } // shallow clone sufficient (data array not mutated here)
    dataset.challengeInfo = {
      dayIndex: todayIndex,
      challengeDate: new Date().toISOString().split('T')[0],
      nextResetTime: getNextResetTime()
    }
    // Provide a unique challenge identifier in case the same dataset concept returns on a later day
    dataset.challengeInfo.challengeId = `${datasetId}-d${todayIndex}`
    return dataset
  } catch (error) {
    console.error('Error fetching today\'s dataset, trying fallback:', error)
    const fallbackId = CHALLENGE_CONFIG.FALLBACK_DATASETS[todayIndex % CHALLENGE_CONFIG.FALLBACK_DATASETS.length]
    try {
      const rawFallback = await fetchDataset(fallbackId)
      const fb = { ...rawFallback }
      fb.challengeInfo = {
        dayIndex: todayIndex,
        challengeDate: new Date().toISOString().split('T')[0],
        nextResetTime: getNextResetTime(),
        challengeId: `${fallbackId}-d${todayIndex}`
      }
      return fb
    } catch (fallbackError) {
      console.error('Fallback dataset also failed:', fallbackError)
      throw new Error('Unable to load today\'s challenge. Please try again later.')
    }
  }
}

// Get the next reset time
function getNextResetTime() {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  tomorrow.setUTCHours(CHALLENGE_CONFIG.RESET_HOUR_UTC, 0, 0, 0)
  return tomorrow
}

// Get time until next reset (for display purposes)
export function getTimeUntilReset() {
  const now = new Date()
  const nextReset = getNextResetTime()
  const diff = nextReset.getTime() - now.getTime()
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { hours, minutes, totalMs: diff }
}

// Preview upcoming datasets (for admin/debug purposes)
export function getUpcomingDatasets(days = 7) {
  const currentDay = getCurrentDayIndex()
  const upcoming = []
  
  for (let i = 0; i < days; i++) {
    const dayIndex = (currentDay + i) % CHALLENGE_CONFIG.CYCLE_LENGTH_DAYS
    const datasetId = getDatasetForDay(dayIndex)
    const date = new Date()
    date.setDate(date.getDate() + i)
    
    upcoming.push({
      dayIndex,
      date: date.toISOString().split('T')[0],
      datasetId,
      isToday: i === 0
    })
  }
  
  return upcoming
}

// Check if user has played today
export function hasPlayedToday() {
  const todayIndex = getCurrentDayIndex()
  const lastPlayedDay = storage.getItem('worldofmaps_last_played_day')
  
  return lastPlayedDay && parseInt(lastPlayedDay) === todayIndex
}

// Mark today as played
export function markTodayAsPlayed() {
  const todayIndex = getCurrentDayIndex()
  storage.setItem('worldofmaps_last_played_day', todayIndex.toString())
}

// Get dataset by specific date (for testing/admin)
export async function getDatasetByDate(dateString) {
  const targetDate = new Date(dateString + 'T00:00:00Z')
  const epochStart = new Date('1970-01-01T00:00:00Z')
  const dayIndex = Math.floor((targetDate.getTime() - epochStart.getTime()) / (1000 * 60 * 60 * 24))
  
  const datasetId = getDatasetForDay(dayIndex % CHALLENGE_CONFIG.CYCLE_LENGTH_DAYS)
  return await fetchDataset(datasetId)
}

// Admin function to force refresh today's dataset
export function forceRefreshToday() {
  const todayIndex = getCurrentDayIndex()
  const cacheKey = `worldofmaps_data_daily_${todayIndex}`
  storage.removeItem(cacheKey)
  console.log('Forced refresh of today\'s dataset')
}

export default {
  getTodaysDataset,
  getCurrentDayIndex,
  getTimeUntilReset,
  getUpcomingDatasets,
  hasPlayedToday,
  markTodayAsPlayed,
  getDatasetByDate,
  forceRefreshToday
}