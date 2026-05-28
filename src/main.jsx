import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Debug tooling is loaded lazily and only in development, so it is excluded from
// the production bundle (and never runs auto-checks for real users).
if (import.meta.env.DEV) {
  Promise.all([
    import('./data/debugUtils.js'),
    import('./data/systemChecker.js'),
  ]).then(([{ default: DataSystemDebug }]) => {
    window.DataSystemDebug = DataSystemDebug
    console.log('🔧 DataSystemDebug loaded in development mode!')
    console.log('  DataSystemDebug.quickTest() / .runAllTests() / .showCategories()')
  })
}

const rootEl = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Prerendered content routes ship server-rendered HTML inside #root -> hydrate it.
// Game routes ship an empty #root -> create a fresh client root.
if (rootEl.firstElementChild) {
  hydrateRoot(rootEl, app)
} else {
  createRoot(rootEl).render(app)
}
