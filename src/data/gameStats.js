// Game Statistics Management
// Handles localStorage persistence for game stats

const STATS_KEY = 'worldofmaps_stats'

// Default stats structure
const defaultStats = {
  totalGames: 0,
  totalWins: 0,
  totalGuesses: 0,
  winStreak: 0,
  maxWinStreak: 0,
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
  datasetStats: {} // Track stats per dataset type
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
    datasetTitle
  } = gameResult

  const stats = getStats()
  const today = new Date().toDateString()
  
  // Update basic counters
  stats.totalGames += 1
  stats.totalGuesses += guessCount
  stats.lastPlayedDate = today
  stats.playedToday = true

  if (isWon) {
    stats.totalWins += 1
    stats.winStreak += 1
    stats.maxWinStreak = Math.max(stats.maxWinStreak, stats.winStreak)
    
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
      totalGuesses: 0
    }
  }
  
  const datasetStat = stats.datasetStats[datasetType]
  datasetStat.played += 1
  datasetStat.totalGuesses += guessCount
  if (isWon) {
    datasetStat.won += 1
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
    
  const averageGuesses = currentStats.totalWins > 0
    ? Math.round((currentStats.totalGuesses / currentStats.totalGames) * 10) / 10
    : 0

  return {
    ...currentStats,
    winPercentage,
    averageGuesses
  }
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
export const getLeaderboardData = () => {
  const stats = getCalculatedStats()
  
  return [
    {
      label: 'Win Rate',
      value: `${stats.winPercentage}%`
    },
    {
      label: 'Avg Guesses',
      value: stats.averageGuesses
    },
    {
      label: 'Win Streak',
      value: stats.winStreak
    },
    {
      label: 'Best Streak',
      value: stats.maxWinStreak
    },
    {
      label: 'Games Played',
      value: stats.totalGames
    }
  ]
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
  getCalculatedStats,
  hasPlayedToday,
  resetDailyPlay,
  getLeaderboardData,
  exportStats,
  clearStats
}