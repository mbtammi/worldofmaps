// Shared helpers for the Atlas pages (SSR-safe — no browser-only APIs at module load).

// Reads data injected by the prerender step. During SSR the prerender sets the value on
// globalThis before rendering; in the browser an inline <script> sets it on window before
// hydration, so client and server first-render from the same data (no hydration mismatch).
export function readAtlasGlobal(key) {
  const g = typeof window !== 'undefined' ? window : globalThis
  return g[key] || null
}

// Generic alias — also used by the blog pages for their injected globals.
export const readInjected = readAtlasGlobal

// Human-friendly number formatting that adapts to magnitude (counts, percentages, dollars).
export function fmtValue(v) {
  if (v == null || Number.isNaN(v)) return '—'
  const abs = Math.abs(v)
  if (abs >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (abs >= 1) return v.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
