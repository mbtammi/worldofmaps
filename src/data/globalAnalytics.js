// Global Analytics System
// Tracks aggregate player statistics for production insights

// Configuration
const ANALYTICS_CONFIG = {
  ENABLED: true, // Can be disabled for privacy/development
  ENDPOINT: '/api/analytics', // Future backend endpoint
  BATCH_SIZE: 10, // Number of events to batch before sending
  RETENTION_DAYS: 30, // Days to keep local analytics data
  LOCAL_STORAGE_KEY: 'worldofmaps_analytics',
  SESSION_KEY: 'worldofmaps_session'
}

// Event types for tracking
export const ANALYTICS_EVENTS = {
  GAME_START: 'game_start',
  GAME_COMPLETE: 'game_complete',
  GUESS_MADE: 'guess_made',
  HINT_USED: 'hint_used',
  THEME_CHANGED: 'theme_changed',
  PAGE_VIEW: 'page_view'
}

// Generate unique session ID
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

// Get or create session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem(ANALYTICS_CONFIG.SESSION_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem(ANALYTICS_CONFIG.SESSION_KEY, sessionId)
  }
  return sessionId
}

// Get user's approximate location (for aggregate regional insights)
function getUserRegion() {
  // Use timezone to estimate region (privacy-friendly)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const region = timezone.split('/')[0] // e.g., "America", "Europe", "Asia"
  return region || 'Unknown'
}

// Local analytics storage
class LocalAnalytics {
  constructor() {
    this.events = this.loadEvents()
    this.pendingEvents = []
  }

  loadEvents() {
    try {
      const stored = localStorage.getItem(ANALYTICS_CONFIG.LOCAL_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load analytics events:', error)
      return []
    }
  }

  saveEvents() {
    try {
      // Only keep recent events based on retention policy
      const cutoffTime = Date.now() - (ANALYTICS_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000)
      const recentEvents = this.events.filter(event => event.timestamp > cutoffTime)
      localStorage.setItem(ANALYTICS_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(recentEvents))
      this.events = recentEvents
    } catch (error) {
      console.warn('Failed to save analytics events:', error)
    }
  }

  addEvent(eventType, data = {}) {
    if (!ANALYTICS_CONFIG.ENABLED) return

    const event = {
      id: Math.random().toString(36).substr(2, 9),
      type: eventType,
      sessionId: getSessionId(),
      timestamp: Date.now(),
      userRegion: getUserRegion(),
      data: {
        url: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
        ...data
      }
    }

    this.events.push(event)
    this.pendingEvents.push(event)
    this.saveEvents()

    // Batch send events when we have enough
    if (this.pendingEvents.length >= ANALYTICS_CONFIG.BATCH_SIZE) {
      this.sendPendingEvents()
    }
  }

  async sendPendingEvents() {
    if (this.pendingEvents.length === 0) return

    try {
      // In production, this would send to your analytics backend
      console.log('📊 Analytics: Would send events to backend:', this.pendingEvents)
      
      // For now, just log the aggregate data
      this.logLocalInsights()
      
      // Clear pending events after "sending"
      this.pendingEvents = []
    } catch (error) {
      console.warn('Failed to send analytics events:', error)
    }
  }

  logLocalInsights() {
    const recentEvents = this.events.filter(e => 
      e.timestamp > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    )

    const gameCompleteEvents = recentEvents.filter(e => e.type === ANALYTICS_EVENTS.GAME_COMPLETE)
    const guessEvents = recentEvents.filter(e => e.type === ANALYTICS_EVENTS.GUESS_MADE)

    if (gameCompleteEvents.length > 0) {
      const winRate = (gameCompleteEvents.filter(e => e.data.won).length / gameCompleteEvents.length) * 100
      const avgGuesses = guessEvents.length > 0 ? guessEvents.length / gameCompleteEvents.length : 0
      
      console.log('📈 Local Analytics Insights (Last 7 days):')
      console.log(`  Games played: ${gameCompleteEvents.length}`)
      console.log(`  Win rate: ${winRate.toFixed(1)}%`)
      console.log(`  Average guesses: ${avgGuesses.toFixed(1)}`)
      
      // Dataset popularity
      const datasetStats = {}
      gameCompleteEvents.forEach(event => {
        const dataset = event.data.datasetType
        if (dataset) {
          datasetStats[dataset] = (datasetStats[dataset] || 0) + 1
        }
      })
      
      if (Object.keys(datasetStats).length > 0) {
        console.log('  Popular datasets:', Object.entries(datasetStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([name, count]) => `${name}: ${count}`)
          .join(', '))
      }
    }
  }

  // Get aggregated stats for display
  getAggregateStats(days = 7) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)
    const recentEvents = this.events.filter(e => e.timestamp > cutoffTime)
    
    const gameCompleteEvents = recentEvents.filter(e => e.type === ANALYTICS_EVENTS.GAME_COMPLETE)
    const guessEvents = recentEvents.filter(e => e.type === ANALYTICS_EVENTS.GUESS_MADE)
    
    return {
      totalGames: gameCompleteEvents.length,
      totalWins: gameCompleteEvents.filter(e => e.data.won).length,
      totalGuesses: guessEvents.length,
      winRate: gameCompleteEvents.length > 0 ? 
        (gameCompleteEvents.filter(e => e.data.won).length / gameCompleteEvents.length) * 100 : 0,
      avgGuesses: gameCompleteEvents.length > 0 ? guessEvents.length / gameCompleteEvents.length : 0,
      uniqueSessions: new Set(recentEvents.map(e => e.sessionId)).size,
      periodDays: days
    }
  }

  // Clear all analytics data (for privacy/testing)
  clearAll() {
    this.events = []
    this.pendingEvents = []
    localStorage.removeItem(ANALYTICS_CONFIG.LOCAL_STORAGE_KEY)
    sessionStorage.removeItem(ANALYTICS_CONFIG.SESSION_KEY)
  }
}

// Global analytics instance
const analytics = new LocalAnalytics()

// Public API for tracking events
export const trackEvent = (eventType, data = {}) => {
  analytics.addEvent(eventType, data)
}

// Convenience functions for common events
export const trackGameStart = (datasetType, datasetTitle) => {
  trackEvent(ANALYTICS_EVENTS.GAME_START, {
    datasetType,
    datasetTitle,
    timestamp: Date.now()
  })
}

export const trackGameComplete = (gameResult) => {
  trackEvent(ANALYTICS_EVENTS.GAME_COMPLETE, {
    datasetType: gameResult.datasetType,
    datasetTitle: gameResult.datasetTitle,
    won: gameResult.isWon,
    guessCount: gameResult.guessCount,
    hintsUsed: gameResult.hintsUsed || 0,
    timeToComplete: gameResult.timeToComplete || null,
    difficulty: gameResult.difficulty || 'unknown'
  })
}

export const trackGuess = (guess, isCorrect, guessNumber, datasetType) => {
  trackEvent(ANALYTICS_EVENTS.GUESS_MADE, {
    guess,
    isCorrect,
    guessNumber,
    datasetType
  })
}

export const trackHintUsed = (hintNumber, datasetType) => {
  trackEvent(ANALYTICS_EVENTS.HINT_USED, {
    hintNumber,
    datasetType
  })
}

// Get insights for admin/debugging
export const getAnalyticsInsights = (days = 7) => {
  return analytics.getAggregateStats(days)
}

// Send any pending events (call before page unload)
export const flushAnalytics = () => {
  analytics.sendPendingEvents()
}

// Clear analytics data
export const clearAnalytics = () => {
  analytics.clearAll()
}

// Initialize analytics on module load
if (ANALYTICS_CONFIG.ENABLED) {
  // Track page view
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    path: window.location.pathname,
    referrer: document.referrer
  })

  // Send pending events when user leaves
  window.addEventListener('beforeunload', flushAnalytics)
  
  // Send pending events periodically
  setInterval(() => {
    analytics.sendPendingEvents()
  }, 30000) // Every 30 seconds
}

export default {
  trackEvent,
  trackGameStart,
  trackGameComplete,
  trackGuess,
  trackHintUsed,
  getAnalyticsInsights,
  flushAnalytics,
  clearAnalytics,
  ANALYTICS_EVENTS
}