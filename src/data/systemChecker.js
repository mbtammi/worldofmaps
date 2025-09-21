// Simple data system status checker
// This file will automatically test our system on page load and show results

import DataSystemDebug from './debugUtils.js'

// Auto-run quick system check on load
async function runQuickSystemCheck() {
  console.log('🔍 Auto-running quick system check...')
  
  try {
    // Test 1: Basic system load
    const systemOk = await DataSystemDebug.quickTest()
    if (!systemOk) {
      console.error('❌ System failed basic load test')
      return false
    }
    
    // Test 2: Try to get today's dataset info (without full fetch)
    console.log('📅 Checking today\'s challenge info...')
    const dayIndex = (await import('./dailyChallenge.js')).getCurrentDayIndex()
    const timeUntilReset = (await import('./dailyChallenge.js')).getTimeUntilReset()
    
    console.log(`✅ Today is day ${dayIndex} of the challenge cycle`)
    console.log(`⏰ Next reset in ${Math.floor(timeUntilReset / 1000 / 60 / 60)} hours`)
    
    // Test 3: Check dataset categories
    console.log('📊 Available dataset categories:')
    const { DATASET_CATEGORIES } = await import('./dataSources.js')
    
    // Randomize the order of categories for display
    const categoryEntries = Object.entries(DATASET_CATEGORIES)
    // Fisher-Yates shuffle algorithm
    for (let i = categoryEntries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [categoryEntries[i], categoryEntries[j]] = [categoryEntries[j], categoryEntries[i]]
    }
    
    categoryEntries.forEach(([key, category]) => {
      console.log(`  ${category.icon || '📊'} ${category.name}`)
    })
    
    console.log('🎉 Quick system check passed! Full API testing available via:')
    console.log('  DataSystemDebug.testWorldBankAPI()')
    console.log('  DataSystemDebug.runAllTests()')
    
    return true
  } catch (error) {
    console.error('❌ Quick system check failed:', error)
    return false
  }
}

// Export for potential use
export { runQuickSystemCheck }

// Run automatically in development
if (import.meta.env.DEV) {
  // Run after a short delay to let everything load
  setTimeout(() => {
    runQuickSystemCheck()
  }, 1000)
}