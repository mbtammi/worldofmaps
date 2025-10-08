// Daily Challenge System
// Manages daily dataset rotation with timezone-aware switching

import { getAllAvailableDatasets } from './dataSources.js'
import { fetchDataset } from './dataFetcher.js'
import { devLog, warnLog, errorLog } from '../utils/logger.js'

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
  // Curated diverse fallback datasets (ordered). We rotate starting point daily for variety while remaining deterministic.
  FALLBACK_DATASETS: [
    'population-density',      // Demographic
    'gdp-per-capita',          // Economic
    'life-expectancy',         // Health
    'internet-users',          // Technology / access
    'forest-coverage',         // Environmental
    'unemployment-rate',       // Labor
    'co2-emissions'            // Climate (may be proxy / alt indicators when coverage low)
  ]
}

// Simple seeded random number generator (Linear Congruential Generator)
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

// Shuffle array using seeded random (Fisher-Yates shuffle)
function seededShuffle(array, seed) {
  const shuffled = [...array]
  const rng = seededRandom(seed)
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
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

// Featured dataset weighting configuration (can be tuned)
const WEIGHTING_CONFIG = {
  ENABLED: (typeof process !== 'undefined' && process.env.WOM_WEIGHTED_ROTATION === 'true') || true, // default on; override with env
  FEATURED_FRACTION: 0.7, // 70% of days from the featured pool
  // Curated high-approachability / broad-interest datasets (keep list modest)
  FEATURED_DATASETS: [
    'population-density',
    'gdp-per-capita',
    'life-expectancy',
    'internet-users',
    'forest-coverage',
    'unemployment-rate',
    'renewable-energy',
    'urban-population',
    'literacy-rate',
    'electricity-access',
    'co2-emissions',
    'healthcare-expenditure',
    'education-expenditure',
    'birth-rate',
    'death-rate'
  ]
}

// Get the dataset ID for a specific day with optional weighted rotation logic
function getDatasetForDay(dayIndex) {
  const availableDatasets = getAllAvailableDatasets()
  const suitableDatasets = availableDatasets.filter(d => d.estimatedAvailability === 'high' || d.estimatedAvailability === 'medium')

  if (suitableDatasets.length === 0) {
    warnLog('No suitable datasets found, using fallback')
    return CHALLENGE_CONFIG.FALLBACK_DATASETS[dayIndex % CHALLENGE_CONFIG.FALLBACK_DATASETS.length]
  }

  // Helper to get the dataset for a given day index (original logic)
  function _getDatasetForDayIndex(idx) {
    if (!WEIGHTING_CONFIG.ENABLED) {
      const poolSize = suitableDatasets.length
      const cycleNumber = Math.floor(idx / poolSize)
      const positionInCycle = idx % poolSize
      const shuffleSeed = `${CHALLENGE_CONFIG.RANDOM_SEED}_cycle${cycleNumber}`
      const shuffled = seededShuffle(suitableDatasets, shuffleSeed)
      const chosen = shuffled[positionInCycle]
      devLog(`(Unweighted) Day ${idx}: cycle ${cycleNumber}, pos ${positionInCycle}/${poolSize}, dataset: ${chosen.id}`)
      return chosen.id
    }

    const featuredSet = new Set(WEIGHTING_CONFIG.FEATURED_DATASETS)
    const featuredPool = []
    const exploratoryPool = []
    for (const ds of suitableDatasets) {
      if (featuredSet.has(ds.id)) featuredPool.push(ds)
      else exploratoryPool.push(ds)
    }
    if (featuredPool.length === 0 || exploratoryPool.length === 0) {
      const poolSize = suitableDatasets.length
      const cycleNumber = Math.floor(idx / poolSize)
      const positionInCycle = idx % poolSize
      const shuffleSeed = `${CHALLENGE_CONFIG.RANDOM_SEED}_cycle${cycleNumber}`
      const shuffled = seededShuffle(suitableDatasets, shuffleSeed)
      const chosen = shuffled[positionInCycle]
      devLog(`(Fallback-unweighted) Day ${idx}: dataset ${chosen.id}`)
      return chosen.id
    }
    // New UNIQUE weighted permutation logic (no duplication):
    // We create a single-cycle ordering that front-loads featured datasets roughly according to FEATURED_FRACTION
    // but never repeats any dataset within that cycle.
    const totalPool = suitableDatasets.length
    const cycleNumber = Math.floor(idx / totalPool)
    const seedBase = `${CHALLENGE_CONFIG.RANDOM_SEED}_wperm${cycleNumber}`
    const shuffledFeatured = seededShuffle(featuredPool, seedBase + '_F')
    const shuffledExploratory = seededShuffle(exploratoryPool, seedBase + '_E')
    const pattern = []
    let fPtr = 0, ePtr = 0
    let fPlaced = 0, ePlaced = 0
    const targetFrac = WEIGHTING_CONFIG.FEATURED_FRACTION
    for (let pos = 0; pos < totalPool; pos++) {
      // Expected featured count up to this position (1-based for expectation)
      const expectedFeatured = Math.round((pos + 1) * targetFrac)
      const canTakeFeatured = fPtr < shuffledFeatured.length
      const canTakeExploratory = ePtr < shuffledExploratory.length
      let takeFeatured = false
      if (canTakeFeatured && canTakeExploratory) {
        // If we are behind the expected featured count, take featured
        if (fPlaced < expectedFeatured) takeFeatured = true
        else takeFeatured = false
      } else if (canTakeFeatured) {
        takeFeatured = true
      } else if (canTakeExploratory) {
        takeFeatured = false
      }
      if (takeFeatured) {
        pattern.push(shuffledFeatured[fPtr++])
        fPlaced++
      } else {
        pattern.push(shuffledExploratory[ePtr++])
        ePlaced++
      }
    }
    // Sanity: ensure pattern length == totalPool & uniqueness
    if (pattern.length !== totalPool || new Set(pattern.map(p=>p.id)).size !== totalPool) {
      warnLog('Weighted permutation degeneracy detected; reverting to simple unified shuffle.')
      const unified = seededShuffle(suitableDatasets, seedBase + '_fallback')
      const positionInCycleFallback = idx % totalPool
      return unified[positionInCycleFallback].id
    }
    const positionInCycle = idx % totalPool
    const chosen = pattern[positionInCycle]
    devLog(`(WeightedUnique) Day ${idx}: cycle ${cycleNumber}, pos ${positionInCycle}/${totalPool}, featuredPlaced=${fPlaced}, exploratoryPlaced=${ePlaced}, dataset=${chosen.id}`)
    return chosen.id
  }

  // Prevent same dataset two days in a row
  const todayId = _getDatasetForDayIndex(dayIndex)
  const yesterdayId = _getDatasetForDayIndex(dayIndex - 1)
  if (todayId === yesterdayId && suitableDatasets.length > 1) {
    // Find the next dataset in the pattern that is not yesterday's
    for (let offset = 1; offset < suitableDatasets.length; offset++) {
      const altId = _getDatasetForDayIndex(dayIndex + offset)
      if (altId !== yesterdayId) {
        warnLog(`Prevented repeat: '${todayId}' was yesterday, using '${altId}' instead.`)
        return altId
      }
    }
    // Fallback: if all are the same (shouldn't happen), return todayId
    return todayId
  }
  return todayId
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

  devLog(`Today's challenge (day ${todayIndex}): primary '${datasetId}'`)

  const attemptIds = []
  const tried = new Set()

  // Build deterministic fallback rotation starting index based on dayIndex
  const fb = CHALLENGE_CONFIG.FALLBACK_DATASETS
  const rotate = todayIndex % fb.length
  const rotatedFallbacks = fb.slice(rotate).concat(fb.slice(0, rotate))

  // Ensure primary attempted first then rotatedFallbacks (excluding duplicates)
  const ordered = [datasetId, ...rotatedFallbacks.filter(id => id !== datasetId)]

  let lastError = null
  for (const id of ordered) {
    if (tried.has(id)) continue
    tried.add(id)
    try {
      devLog(`Attempting dataset '${id}' (order position ${attemptIds.length + 1}/${ordered.length})`)
      // Pass dayIndex to fetchDataset for deterministic option generation
      const raw = await fetchDataset(id, todayIndex)
      const ds = { ...raw }
      ds.challengeInfo = {
        dayIndex: todayIndex,
        challengeDate: new Date().toISOString().split('T')[0],
        nextResetTime: getNextResetTime(),
        challengeId: `${id}-d${todayIndex}`,
        attemptedOrder: ordered,
        primaryId: datasetId
      }
      devLog(`Selected dataset '${id}' for day ${todayIndex} (primary was '${datasetId}', attempts: ${attemptIds.length + 1})`)
      return ds
    } catch (e) {
      lastError = e
      attemptIds.push(`${id}: ${e.message}`)
      warnLog(`Dataset '${id}' failed (${e.message}). Trying next fallback...`)
    }
  }

  errorLog(`All dataset attempts failed for day ${todayIndex}:`, attemptIds)
  throw new Error('Unable to load today\'s challenge. Please try again later.')
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

// Get dataset history - which datasets have been used in a date range
export function getDatasetHistory(startDayIndex, endDayIndex) {
  const history = []
  const seenDatasets = new Set()
  
  for (let i = startDayIndex; i <= endDayIndex; i++) {
    const datasetId = getDatasetForDay(i)
    const date = new Date()
    date.setDate(date.getDate() + (i - getCurrentDayIndex()))
    
    history.push({
      dayIndex: i,
      date: date.toISOString().split('T')[0],
      datasetId,
      isFirstOccurrence: !seenDatasets.has(datasetId)
    })
    
    seenDatasets.add(datasetId)
  }
  
  return {
    history,
    uniqueDatasetsUsed: seenDatasets.size,
    totalDays: endDayIndex - startDayIndex + 1
  }
}

// Get statistics about dataset rotation
export function getRotationStats() {
  const availableDatasets = getAllAvailableDatasets()
  const suitableDatasets = availableDatasets.filter(dataset => 
    dataset.estimatedAvailability === 'high' || dataset.estimatedAvailability === 'medium'
  )
  
  const poolSize = suitableDatasets.length
  const currentDay = getCurrentDayIndex()
  const currentCycle = Math.floor(currentDay / poolSize)
  const positionInCycle = currentDay % poolSize
  const daysUntilNewCycle = poolSize - positionInCycle
  
  return {
    totalAvailableDatasets: poolSize,
    currentCycle: currentCycle,
    positionInCycle: positionInCycle,
    daysUntilNewCycle: daysUntilNewCycle,
    guaranteedUniqueDays: poolSize,
    datasetList: suitableDatasets.map(d => d.id)
  }
}

export default {
  getTodaysDataset,
  getCurrentDayIndex,
  getTimeUntilReset,
  getUpcomingDatasets,
  hasPlayedToday,
  markTodayAsPlayed,
  getDatasetByDate,
  forceRefreshToday,
  getDatasetHistory,
  getRotationStats
}