import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Import debug utilities for development
import DataSystemDebug from './data/debugUtils.js'
// Import system checker for automatic testing
import './data/systemChecker.js'

// Make debug tools available in development
if (import.meta.env.DEV) {
  window.DataSystemDebug = DataSystemDebug
  console.log('🔧 DataSystemDebug loaded in development mode!')
  console.log('Available commands:')
  console.log('  DataSystemDebug.quickTest() - Quick system check')
  console.log('  DataSystemDebug.runAllTests() - Run all API tests') 
  console.log('  DataSystemDebug.showCategories() - Show dataset categories')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
