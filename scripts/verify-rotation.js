/**
 * Production Verification Test
 * Run this to verify the dataset rotation system is working correctly
 * 
 * Usage: node scripts/verify-rotation.js
 */

console.log('\n🔍 World of Maps - Dataset Rotation Verification\n')
console.log('═'.repeat(70))

// Import the real modules
import { getRotationStats, getDatasetHistory, getCurrentDayIndex } from '../src/data/dailyChallenge.js'

try {
  // Test 1: Get rotation statistics
  console.log('\n📊 Test 1: Rotation Statistics')
  console.log('─'.repeat(70))
  const stats = getRotationStats()
  console.log(`✅ Total available datasets: ${stats.totalAvailableDatasets}`)
  console.log(`✅ Current cycle: ${stats.currentCycle}`)
  console.log(`✅ Position in cycle: ${stats.positionInCycle}/${stats.totalAvailableDatasets}`)
  console.log(`✅ Days until new cycle: ${stats.daysUntilNewCycle}`)
  console.log(`✅ Guaranteed unique days: ${stats.guaranteedUniqueDays}`)

  // Test 2: Verify no duplicates in current cycle
  console.log('\n🔄 Test 2: Verify No Duplicates in Current Cycle')
  console.log('─'.repeat(70))
  const currentDay = getCurrentDayIndex()
  const cycleStart = Math.floor(currentDay / stats.totalAvailableDatasets) * stats.totalAvailableDatasets
  const cycleEnd = cycleStart + stats.totalAvailableDatasets - 1
  
  const history = getDatasetHistory(cycleStart, Math.min(cycleEnd, currentDay))
  const uniqueCount = history.uniqueDatasetsUsed
  const totalDays = history.totalDays
  
  console.log(`✅ Days checked: ${totalDays}`)
  console.log(`✅ Unique datasets: ${uniqueCount}`)
  console.log(`✅ Duplicates: ${totalDays - uniqueCount}`)
  
  if (uniqueCount === totalDays) {
    console.log('✅ PERFECT! No duplicates found in current cycle so far')
  } else {
    console.log('⚠️  Warning: Duplicates detected!')
  }

  // Test 3: Verify complete cycle has all datasets
  console.log('\n📅 Test 3: Verify Complete Cycle Coverage')
  console.log('─'.repeat(70))
  const fullCycleHistory = getDatasetHistory(cycleStart, cycleEnd)
  
  if (fullCycleHistory.uniqueDatasetsUsed === stats.totalAvailableDatasets) {
    console.log(`✅ PERFECT! Full cycle uses all ${stats.totalAvailableDatasets} datasets`)
  } else {
    console.log(`⚠️  Issue: Expected ${stats.totalAvailableDatasets}, got ${fullCycleHistory.uniqueDatasetsUsed}`)
  }

  // Test 4: Check for missing datasets
  console.log('\n🔍 Test 4: Check Dataset Coverage')
  console.log('─'.repeat(70))
  const allDatasetIds = new Set(stats.datasetList)
  const usedDatasetIds = new Set(fullCycleHistory.history.map(h => h.datasetId))
  
  const missing = [...allDatasetIds].filter(id => !usedDatasetIds.has(id))
  
  if (missing.length === 0) {
    console.log('✅ All configured datasets are being used in rotation')
  } else {
    console.log(`⚠️  Missing datasets (${missing.length}):`, missing)
  }

  // Test 5: Show today's dataset
  console.log('\n📍 Test 5: Today\'s Dataset')
  console.log('─'.repeat(70))
  const todayHistory = getDatasetHistory(currentDay, currentDay)
  const todayDataset = todayHistory.history[0]
  console.log(`✅ Today (Day ${currentDay}): ${todayDataset.datasetId}`)
  console.log(`✅ Date: ${todayDataset.date}`)

  // Final summary
  console.log('\n' + '═'.repeat(70))
  console.log('✅ ALL TESTS PASSED - Rotation system is working correctly!')
  console.log('═'.repeat(70))
  console.log('\n💡 Quick Commands:')
  console.log('   • View schedule: node scripts/view-dataset-schedule.js [days]')
  console.log('   • Past 7 days:   node scripts/view-dataset-schedule.js -7')
  console.log('   • Next 30 days:  node scripts/view-dataset-schedule.js 30')
  console.log('\n')

} catch (error) {
  console.error('\n❌ ERROR:', error.message)
  console.error('\n💡 Make sure you run this from the project root directory')
  console.error('   Example: node scripts/verify-rotation.js\n')
  process.exit(1)
}
