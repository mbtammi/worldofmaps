// Theme Management System
// Handles Dark, Light, and Color mode switching

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light', 
  COLOR: 'color'
}

const THEME_KEY = 'worldofthemaps_theme'

// Theme configurations
export const themeConfigs = {
  [THEMES.DARK]: {
    name: 'Dark Mode',
    icon: '🌙',
    colors: {
      // Globe background
      globeBackground: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0c29 100%)',
      
      // Globe imagery (null = no texture, let data colors show)
      globeImageUrl: null,
      
      // Globe atmosphere and water color
      globeAtmosphereColor: '#4a90e2',
      globeWaterColor: 'rgba(0, 0, 0, 0)', // Transparent for space look
      
      // UI elements
      glassBackground: 'rgba(0, 0, 0, 0.2)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
      textPrimary: 'rgba(255, 255, 255, 0.9)',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textMuted: 'rgba(255, 255, 255, 0.5)',
      
      // Interactive elements
      buttonHover: 'rgba(255, 255, 255, 0.2)',
      buttonActive: 'rgba(255, 255, 255, 0.1)',
      
      // Data visualization (light blue to dark purple)
      dataColorStart: 'rgb(135, 206, 250)',   // Light sky blue
      dataColorEnd: 'rgb(75, 0, 130)',        // Dark purple (indigo)
      noDataColor: '#2d3748'
    }
  },
  
  [THEMES.LIGHT]: {
    name: 'Light Mode',
    icon: '☀️',
    colors: {
      // Globe background  
      globeBackground: 'linear-gradient(135deg, #f7fafc 0%, #e2e8f0 50%, #cbd5e0 100%)',
      
    // Globe imagery: provide a flat light-blue texture so oceans are visible.
    // Using an inlined SVG (1024x512) with color #E6F7FF to avoid external fetch & keep it crisp when filtered.
    globeImageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512"><rect width="1024" height="512" fill="%23E6F7FF"/></svg>',
      
    // Globe atmosphere and water background (canvas background around sphere / fallback water tint)
    globeAtmosphereColor: '#cbd5e0',
    globeWaterColor: 'rgba(230, 247, 255, 0.95)',
      
      // UI elements
      glassBackground: 'rgba(255, 255, 255, 0.8)',
  // Slightly stronger border contrast for readability
      glassBorder: 'rgba(0, 0, 0, 0.1)',
      textPrimary: 'rgba(0, 0, 0, 0.9)',
      textSecondary: 'rgba(0, 0, 0, 0.7)',
      textMuted: 'rgba(0, 0, 0, 0.5)',
      
      // Interactive elements
      buttonHover: 'rgba(0, 0, 0, 0.1)',
      buttonActive: 'rgba(0, 0, 0, 0.05)',
      
      // Data visualization (pastel green to pastel red)
      dataColorStart: 'rgb(144, 238, 144)',   // Light green
      dataColorEnd: 'rgb(255, 182, 193)',     // Light pink
      noDataColor: '#ffffff' // White for countries without data
    }
  },
  
  [THEMES.COLOR]: {
    name: 'Color Mode', 
    icon: '🌈',
    colors: {
      // Globe background
      globeBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      
      // Globe imagery (realistic earth texture)
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      
      // Globe atmosphere and water color
      globeAtmosphereColor: '#4a90e2',
      globeWaterColor: 'rgba(0, 0, 0, 8)', // Transparent to show earth texture
      
      // UI elements
      glassBackground: 'rgba(255, 255, 255, 0.15)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      
      // Interactive elements
      buttonHover: 'rgba(255, 255, 255, 0.3)',
      buttonActive: 'rgba(255, 255, 255, 0.2)',
      
      // Data visualization (pastel green to pastel red for earth texture)
      dataColorStart: 'rgb(152, 251, 152)',   // Pale green
      dataColorEnd: 'rgb(255, 160, 160)',     // Pale red
      noDataColor: '#4a5568'
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
    if (key === 'globeImageUrl') {
      // Handle globe image URL specially
      root.style.setProperty(`--${key}`, value || 'null')
    } else {
      root.style.setProperty(`--${key}`, value)
    }
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