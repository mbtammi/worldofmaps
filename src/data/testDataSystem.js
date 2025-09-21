// Test script for dynamic data system
// Run with: node testDataSystem.js

import { getTodaysDataset } from './dailyChallenge.js'
import { fetchDataset, fetchWorldBankData } from './dataFetcher.js'
import { getAllAvailableDatasets } from './dataSources.js'

console.log('🧪 Testing World of Maps Dynamic Data System...\n')

// Test 1: Check available datasets
console.log('📊 Available Datasets:')
try {
  const datasets = getAllAvailableDatasets()
  console.log(`Found ${datasets.length} datasets across ${Object.keys(datasets).length} categories`)
  
  Object.entries(datasets).forEach(([category, categoryDatasets]) => {
    console.log(`  ${category}: ${categoryDatasets.length} datasets`)
  })
} catch (error) {
  console.error('❌ Failed to get available datasets:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// Test 2: Test World Bank API
console.log('🌍 Testing World Bank API...')
try {
  console.log('Fetching GDP per capita data for 2022...')
  const wbData = await fetchWorldBankData('NY.GDP.PCAP.CD', 2022, 5)
  console.log(`✅ Success! Got ${wbData.length} country records`)
  console.log('Sample data:', wbData.slice(0, 3))
} catch (error) {
  console.error('❌ World Bank API test failed:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// Test 3: Test dataset fetching
console.log('📈 Testing Dataset Fetching...')
try {
  console.log('Fetching GDP per capita dataset...')
  const dataset = await fetchDataset('gdp-per-capita')
  console.log(`✅ Success! Dataset: "${dataset.title}"`)
  console.log(`Data points: ${dataset.data.length}`)
  console.log(`Correct answers: ${dataset.correctAnswers.length}`)
  console.log(`Options: ${dataset.options.length}`)
} catch (error) {
  console.error('❌ Dataset fetch failed:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// Test 4: Test daily challenge system
console.log('🗓️  Testing Daily Challenge System...')
try {
  console.log('Getting today\'s dataset...')
  const todaysDataset = await getTodaysDataset()
  console.log(`✅ Today's challenge: "${todaysDataset.title}"`)
  console.log(`Description: ${todaysDataset.description}`)
  console.log(`Data quality: ${todaysDataset.data.length > 0 ? 'Good' : 'No data'}`)
} catch (error) {
  console.error('❌ Daily challenge test failed:', error.message)
}

console.log('\n🎉 Data system testing complete!')