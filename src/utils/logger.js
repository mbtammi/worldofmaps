// Centralized logging utility
// In production, sensitive logs are suppressed to prevent answer spoilers

const isDevelopment = import.meta.env.MODE === 'development'

// Dev-only logs (completely suppressed in production)
export const devLog = (...args) => {
  if (isDevelopment) {
    console.log(...args)
  }
}

// Always show errors
export const errorLog = (...args) => {
  console.error(...args)
}

// Always show warnings
export const warnLog = (...args) => {
  console.warn(...args)
}

// Info logs (shown in production but less verbose)
export const infoLog = (...args) => {
  console.log(...args)
}

export default {
  dev: devLog,
  error: errorLog,
  warn: warnLog,
  info: infoLog
}
