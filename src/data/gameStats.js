// Game Statistics Management
// Handles localStorage persistence for game stats

const STATS_KEY = 'worldofthemaps_stats'

// Default stats structure
const defaultStats = {
  totalGames: 0,
  totalWins: 0,
  totalGuesses: 0,
  winStreak: 0,
  maxWinStreak: 0,
  firstTryWins: 0,
  totalTimeMs: 0,
  fastestMs: null,
  hintsUsedTotal: 0,
  gamesWithHints: 0,
  gamesWonByGuesses: {
    1: 0, // Games won on first guess
    2: 0, // Games won on second guess
    3: 0, // etc.
    4: 0,
    5: 0,
    '6+': 0 // Games won after 6+ guesses
  },
  lastPlayedDate: null,
  playedToday: false,
  datasetStats: {}, // Track stats per dataset type (e.g., population)
  datasetIdStats: {} // Track stats per specific dataset id (e.g., population-density-2022)
}

// Get current stats from localStorage
export const getStats = () => {
  try {
    const stored = localStorage.getItem(STATS_KEY)
    if (stored) {
      const stats = JSON.parse(stored)
      // Merge with defaults to handle new properties
      return { ...defaultStats, ...stats }
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
  return { ...defaultStats }
}

// Save stats to localStorage
export const saveStats = (stats) => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error('Error saving stats:', error)
  }
}

// Update stats after a game completion
export const updateStatsAfterGame = (gameResult) => {
  const {
    isWon,
    guessCount,
    datasetType,
    datasetTitle,
    datasetId,
    durationMs = 0,
    hintsRevealed = 0
  } = gameResult

  const stats = getStats()
  const today = new Date().toDateString()
  
  // Update basic counters
  stats.totalGames += 1
  stats.totalGuesses += guessCount
  if (durationMs) {
    stats.totalTimeMs += durationMs
    if (stats.fastestMs === null || durationMs < stats.fastestMs) stats.fastestMs = durationMs
  }
  stats.lastPlayedDate = today
  stats.playedToday = true

  if (isWon) {
    stats.totalWins += 1
    stats.winStreak += 1
    stats.maxWinStreak = Math.max(stats.maxWinStreak, stats.winStreak)
    if (guessCount === 1) stats.firstTryWins += 1
    
    // Track wins by guess count
    const guessKey = guessCount > 6 ? '6+' : guessCount.toString()
    stats.gamesWonByGuesses[guessKey] += 1
  } else {
    stats.winStreak = 0
  }

  // Update dataset-specific stats
  if (!stats.datasetStats[datasetType]) {
    stats.datasetStats[datasetType] = {
      title: datasetTitle,
      played: 0,
      won: 0,
      totalGuesses: 0,
      guessHistogram: {1:0,2:0,3:0,4:0,5:0,'6+':0},
      firstTryWins: 0,
      totalTimeMs: 0,
      fastestMs: null,
      hintsUsedTotal: 0,
      gamesWithHints: 0
    }
  }

  const datasetStat = stats.datasetStats[datasetType]
  datasetStat.played += 1
  datasetStat.totalGuesses += guessCount
  if (durationMs) {
    datasetStat.totalTimeMs += durationMs
    if (datasetStat.fastestMs === null || durationMs < datasetStat.fastestMs) datasetStat.fastestMs = durationMs
  }
  if (hintsRevealed) {
    datasetStat.hintsUsedTotal += hintsRevealed
    datasetStat.gamesWithHints += 1
  }
  if (isWon) {
    datasetStat.won += 1
    const gKey = guessCount > 6 ? '6+' : guessCount.toString()
    datasetStat.guessHistogram[gKey] += 1
    if (guessCount === 1) datasetStat.firstTryWins += 1
  }

  // Update per datasetId stats
  if (datasetId) {
    if (!stats.datasetIdStats[datasetId]) {
      stats.datasetIdStats[datasetId] = {
        title: datasetTitle,
        played: 0,
        won: 0,
        totalGuesses: 0,
        guessHistogram: {1:0,2:0,3:0,4:0,5:0,'6+':0},
        firstTryWins: 0,
        totalTimeMs: 0,
        fastestMs: null,
        hintsUsedTotal: 0,
        gamesWithHints: 0
      }
    }
    const dsIdStat = stats.datasetIdStats[datasetId]
    dsIdStat.played += 1
    dsIdStat.totalGuesses += guessCount
    if (durationMs) {
      dsIdStat.totalTimeMs += durationMs
      if (dsIdStat.fastestMs === null || durationMs < dsIdStat.fastestMs) dsIdStat.fastestMs = durationMs
    }
    if (hintsRevealed) {
      dsIdStat.hintsUsedTotal += hintsRevealed
      dsIdStat.gamesWithHints += 1
    }
    if (isWon) {
      dsIdStat.won += 1
      const gKey = guessCount > 6 ? '6+' : guessCount.toString()
      dsIdStat.guessHistogram[gKey] += 1
      if (guessCount === 1) dsIdStat.firstTryWins += 1
    }
  }

  saveStats(stats)
  return stats
}

// Calculate derived stats
export const getCalculatedStats = (stats = null) => {
  const currentStats = stats || getStats()
  const winPercentage = currentStats.totalGames > 0 
    ? Math.round((currentStats.totalWins / currentStats.totalGames) * 100)
    : 0
  const averageGuesses = currentStats.totalGames > 0
    ? Math.round((currentStats.totalGuesses / currentStats.totalGames) * 100) / 100
    : 0
  const firstTryRate = currentStats.totalWins ? +(currentStats.firstTryWins / currentStats.totalWins * 100).toFixed(1) : 0
  const avgTimeMs = currentStats.totalWins ? Math.round(currentStats.totalTimeMs / currentStats.totalWins) : null
  const hintUsageRate = currentStats.totalGames ? +(currentStats.gamesWithHints / currentStats.totalGames * 100).toFixed(1) : 0
  const medianGuesses = computeMedianFromHistogram(currentStats.gamesWonByGuesses, currentStats.totalWins)
  return {
    ...currentStats,
    winPercentage,
    averageGuesses,
    firstTryRate,
    avgTimeMs,
    hintUsageRate,
    medianGuesses
  }
}

function computeMedianFromHistogram(hist, wins) {
  if (!wins) return null
  const expanded = []
  Object.entries(hist).forEach(([k,c]) => {
    const g = k === '6+' ? 6 : parseInt(k)
    for (let i=0;i<c;i++) expanded.push(g)
  })
  if (!expanded.length) return null
  expanded.sort((a,b)=>a-b)
  const mid = Math.floor(expanded.length/2)
  if (expanded.length % 2) return expanded[mid]
  return (expanded[mid-1] + expanded[mid]) / 2
}

// Check if user has played today
export const hasPlayedToday = () => {
  const stats = getStats()
  const today = new Date().toDateString()
  return stats.lastPlayedDate === today && stats.playedToday
}

// Reset daily play flag (call at midnight or when new day's game is available)
export const resetDailyPlay = () => {
  const stats = getStats()
  stats.playedToday = false
  saveStats(stats)
}

// Get leaderboard-style data for display
export const getLeaderboardData = (dataset = null) => {
  const stats = getCalculatedStats()
  
  // Calculate data range from current dataset if provided
  let rangeText = '-'
  if (dataset && dataset.data && dataset.data.length > 0) {
    const values = dataset.data.map(item => item.value).filter(val => val != null && !isNaN(val))
    if (values.length > 0) {
      const minVal = Math.min(...values)
      const maxVal = Math.max(...values)
      
      // Format numbers nicely - show decimals only if needed
      const formatValue = (val) => {
        if (val >= 1000000) return `${Math.round(val / 100000) / 10}M`
        if (val >= 1000) return `${Math.round(val / 100) / 10}K`
        if (val % 1 === 0) return val.toString()
        return Math.round(val * 10) / 10
      }
      
      rangeText = `${formatValue(minVal)}-${formatValue(maxVal)}`
    }
  }
  
  return [
    // {
    //   label: 'Win Rate',
    //   value: `${stats.winPercentage}%`
    // },
    {
      label: 'Avg Guesses',
      value: stats.averageGuesses
    },
    {
      label: 'Data Range',
      value: rangeText
    },
    // {
    //   label: 'Win Streak',
    //   value: stats.winStreak
    // },
    // {
    //   label: 'Games Played',
    //   value: stats.totalGames
    // }
  ]
}

// Get game-specific statistics for current dataset
export const getGameSpecificStats = (dataset) => {
  if (!dataset) return []
  
  const stats = getStats()
  const datasetType = dataset.id.split('-')[0] // Extract type from ID like 'population-density-2023'
  const datasetStat = stats.datasetStats[datasetType]
  const datasetIdStat = stats.datasetIdStats[dataset.id]
  
  // If no stats for this dataset type yet, return default stats
  if (!datasetStat) {
    return [
      {
        label: 'Dataset',
        value: dataset.title
      },
      {
        label: 'Difficulty',
        value: 'New!'
      },
      {
        label: 'Your Attempts',
        value: '0'
      },
      {
        label: 'Success Rate',
        value: '-'
      }
    ]
  }
  
  const successRate = datasetStat.played > 0 ? Math.round((datasetStat.won / datasetStat.played) * 100) : 0
  const avgGuesses = datasetStat.played > 0 ? Math.round(datasetStat.totalGuesses / datasetStat.played * 10) / 10 : 0
  
  // Determine difficulty based on success rate and average guesses
  let difficulty = 'Medium'
  if (successRate >= 70) difficulty = 'Easy'
  else if (successRate <= 30) difficulty = 'Hard'
  
  return [
    {
      label: 'Dataset',
      value: dataset.title
    },
    {
      label: 'Difficulty',
      value: difficulty
    },
    {
      label: 'Your Attempts',
      value: datasetStat.played.toString()
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`
    },
    {
      label: 'Avg Guesses',
      value: avgGuesses.toString()
    },
    ...(datasetIdStat ? [{
      label: 'Wins (Today)',
      value: datasetIdStat.won.toString()
    }] : [])
  ]
}

// Record per-dataset result externally (alt entry point)
export const recordDatasetResult = (datasetId, datasetTitle, isWon, guessCount) => {
  const datasetType = datasetId.split('-')[0]
  return updateStatsAfterGame({
    isWon,
    guessCount,
    datasetType,
    datasetTitle,
    datasetId
  })
}

// Retrieve stats for specific dataset id
export const getDatasetStats = (datasetId) => {
  const stats = getStats()
  return stats.datasetIdStats[datasetId] || null
}
// Export for debugging/admin
export const exportStats = () => {
  return getCalculatedStats()
}

// Clear all stats (for testing/reset)
export const clearStats = () => {
  localStorage.removeItem(STATS_KEY)
}

export default {
  getStats,
  saveStats,
  updateStatsAfterGame,
  recordDatasetResult,
  getDatasetStats,
  getCalculatedStats,
  hasPlayedToday,
  resetDailyPlay,
  getLeaderboardData,
  getGameSpecificStats,
  exportStats,
  clearStats
}