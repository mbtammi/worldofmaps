// Centralized logging utility
// In production, sensitive logs are suppressed to prevent answer spoilers

// Safely detect environment. In Vite we have import.meta.env, in plain Node (scripts) we do not.
let isDevelopment = (process.env.NODE_ENV || '').toLowerCase() === 'development'
// Try Vite style environment if present
if (typeof globalThis !== 'undefined') {
  try {
    // Some bundlers expose import.meta on modules; this file may still be ESM in build
    // We access it indirectly to avoid parse errors in plain Node.
    // eslint-disable-next-line no-eval
    const meta = eval('import.meta')
    if (meta && meta.env && typeof meta.env.MODE === 'string') {
      isDevelopment = meta.env.MODE === 'development'
    }
  } catch (_) {
    // Ignore if not available
  }
}

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
