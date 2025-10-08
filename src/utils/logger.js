// Centralized logging utility
// In production, sensitive logs are suppressed to prevent answer spoilers

// Detect environment without using eval for safer bundling/minification.
// Priority: explicit process.env override -> Vite import.meta.env (if present) -> default prod
let isDevelopment = false

// Safe guard for process (undefined in browser unless polyfilled)
if (typeof process !== 'undefined' && process?.env) {
  const pMode = (process.env.NODE_ENV || process.env.MODE || '').toLowerCase()
  if (pMode === 'development') isDevelopment = true
}

// Attempt to read import.meta.env safely (only works when this file is truly ESM in a compatible bundler)
// We use a Function constructor with a guarded return; this still avoids arbitrary eval of user data.
// If bundler strips or rewrites it, fallback remains stable.
try {
  // eslint-disable-next-line no-new-func
  const importMeta = new Function('try { return import.meta } catch { return null }')()
  if (importMeta && importMeta.env) {
    // Respect explicit process env if already set to dev
    if (!isDevelopment) {
      if (importMeta.env.DEV === true) isDevelopment = true
      else if (typeof importMeta.env.MODE === 'string' && importMeta.env.MODE === 'development') {
        isDevelopment = true
      }
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
