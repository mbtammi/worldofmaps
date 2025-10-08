// Centralized logging utility
// In production, sensitive logs are suppressed to prevent answer spoilers

// Detect environment without using eval for safer bundling/minification.
// Priority: explicit process.env override -> Vite import.meta.env (if present) -> default prod
let isDevelopment = (process.env && (process.env.NODE_ENV || process.env.MODE))
  ? (process.env.NODE_ENV || process.env.MODE).toLowerCase() === 'development'
  : false

// Attempt to read import.meta.env safely (only works when this file is truly ESM in a compatible bundler)
// We use a Function constructor with a guarded return; this still avoids arbitrary eval of user data.
// If bundler strips or rewrites it, fallback remains stable.
try {
  // eslint-disable-next-line no-new-func
  const importMeta = new Function('try { return import.meta } catch { return null }')()
  if (importMeta && importMeta.env && typeof importMeta.env.MODE === 'string') {
    if (!process.env.NODE_ENV) { // Don't override explicit process value
      isDevelopment = importMeta.env.MODE === 'development'
    }
  }
} catch (_) {
  // Silent fallback
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
