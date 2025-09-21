// Theme Management System
// Handles Dark, Light, and Color mode switching

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light', 
  COLOR: 'color'
}

const THEME_KEY = 'worldofmaps_theme'

// Theme configurations
export const themeConfigs = {
  [THEMES.DARK]: {
    name: 'Dark Mode',
    icon: '🌙',
    colors: {
      // Globe background
      globeBackground: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0c29 100%)',
      
      // UI elements
      glassBackground: 'rgba(0, 0, 0, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
      textPrimary: 'rgba(255, 255, 255, 0.9)',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textMuted: 'rgba(255, 255, 255, 0.5)',
      
      // Interactive elements
      buttonHover: 'rgba(255, 255, 255, 0.2)',
      buttonActive: 'rgba(255, 255, 255, 0.1)',
      
      // Data visualization (mint to coral)
      dataColorStart: 'rgb(100, 180, 120)',
      dataColorEnd: 'rgb(255, 100, 50)',
      noDataColor: '#4a5568'
    }
  },
  
  [THEMES.LIGHT]: {
    name: 'Light Mode',
    icon: '☀️',
    colors: {
      // Globe background  
      globeBackground: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)',
      
      // UI elements
      glassBackground: 'rgba(255, 255, 255, 0.8)',
      glassBorder: 'rgba(0, 0, 0, 0.1)',
      textPrimary: 'rgba(0, 0, 0, 0.9)',
      textSecondary: 'rgba(0, 0, 0, 0.7)',
      textMuted: 'rgba(0, 0, 0, 0.5)',
      
      // Interactive elements
      buttonHover: 'rgba(0, 0, 0, 0.1)',
      buttonActive: 'rgba(0, 0, 0, 0.05)',
      
      // Data visualization (blue to orange for better light mode visibility)
      dataColorStart: 'rgb(33, 150, 243)',
      dataColorEnd: 'rgb(255, 152, 0)',
      noDataColor: '#bdbdbd'
    }
  },
  
  [THEMES.COLOR]: {
    name: 'Color Mode', 
    icon: '🌈',
    colors: {
      // Globe background
      globeBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      
      // UI elements
      glassBackground: 'rgba(255, 255, 255, 0.15)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      
      // Interactive elements
      buttonHover: 'rgba(255, 255, 255, 0.3)',
      buttonActive: 'rgba(255, 255, 255, 0.2)',
      
      // Data visualization (rainbow spectrum)
      dataColorStart: 'rgb(138, 43, 226)', // Purple
      dataColorEnd: 'rgb(255, 20, 147)',   // Deep pink
      noDataColor: '#666666'
    }
  }
}

// Get current theme from localStorage
export const getCurrentTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored && themeConfigs[stored]) {
      return stored
    }
  } catch (error) {
    console.error('Error loading theme:', error)
  }
  return THEMES.DARK // Default to dark mode
}

// Save theme to localStorage  
export const saveTheme = (theme) => {
  try {
    if (themeConfigs[theme]) {
      localStorage.setItem(THEME_KEY, theme)
    }
  } catch (error) {
    console.error('Error saving theme:', error)
  }
}

// Apply theme CSS custom properties to document root
export const applyTheme = (theme) => {
  const config = themeConfigs[theme]
  if (!config) return

  const root = document.documentElement
  
  // Apply all color variables
  Object.entries(config.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
  
  // Set theme name as data attribute for CSS targeting
  root.setAttribute('data-theme', theme)
  
  saveTheme(theme)
}

// Get next theme in rotation
export const getNextTheme = (currentTheme) => {
  const themes = Object.keys(themeConfigs)
  const currentIndex = themes.indexOf(currentTheme)
  const nextIndex = (currentIndex + 1) % themes.length
  return themes[nextIndex]
}

// Initialize theme system
export const initializeTheme = () => {
  const currentTheme = getCurrentTheme()
  applyTheme(currentTheme)
  return currentTheme
}

// Get all available themes for UI
export const getAllThemes = () => {
  return Object.entries(themeConfigs).map(([key, config]) => ({
    id: key,
    name: config.name,
    icon: config.icon
  }))
}

export default {
  THEMES,
  themeConfigs,
  getCurrentTheme,
  saveTheme,
  applyTheme,
  getNextTheme,
  initializeTheme,
  getAllThemes
}