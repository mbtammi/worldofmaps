// Test authentic data for multiple datasets

import { fetchDataset } from './src/data/dataFetcher.js'

console.log('🧪 Testing Authentic Data Coverage...\n')

const testDatasets = ['population-density', 'gdp-per-capita', 'life-expectancy', 'literacy-rate', 'co2-emissions']

async function testAuthentic() {
  for (const datasetId of testDatasets) {
    try {
      console.log(`=== Testing ${datasetId} ===`)
      const dataset = await fetchDataset(datasetId)
      console.log(`Title: ${dataset.title}`)
      console.log(`Countries: ${dataset.data.length}`)
      console.log(`Sample data: ${dataset.data.slice(0, 3).map(d => `${d.name}: ${d.value}`).join(', ')}`)
      
      // Check if this looks like authentic vs generated data
      const hasAuthenticPattern = dataset.data.some(d => 
        (datasetId === 'population-density' && d.name === 'Bangladesh' && d.value > 1000) ||
        (datasetId === 'gdp-per-capita' && d.name === 'Luxembourg' && d.value > 100000) ||
        (datasetId === 'life-expectancy' && d.name === 'Japan' && d.value > 84) ||
        (datasetId === 'literacy-rate' && d.name === 'Finland' && d.value >= 99)
      )
      
      console.log(`Status: ${hasAuthenticPattern ? '✅ AUTHENTIC' : '⚠️ GENERATED'}`)
      console.log()
    } catch (error) {
      console.error(`❌ Failed to fetch ${datasetId}:`, error.message)
      console.log()
    }
  }
}

testAuthentic()