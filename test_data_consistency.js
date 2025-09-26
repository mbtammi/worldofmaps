// Test data consistency - run multiple times to check if values stay the same

import { fetchDataset } from './src/data/dataFetcher.js'
import { getTodaysDataset } from './src/data/dailyChallenge.js'

console.log('🧪 Testing Data Consistency...\n')

async function testConsistency() {
  try {
    console.log('='.repeat(50))
    console.log('TEST 1: Fetching population-density dataset twice')
    
    const dataset1 = await fetchDataset('population-density')
    console.log(`First fetch - Title: ${dataset1.title}`)
    console.log(`First fetch - Data points: ${dataset1.data.length}`)
    console.log(`First fetch - Sample values: ${dataset1.data.slice(0, 3).map(d => `${d.name}: ${d.value}`).join(', ')}`)
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const dataset2 = await fetchDataset('population-density')
    console.log(`Second fetch - Title: ${dataset2.title}`)
    console.log(`Second fetch - Data points: ${dataset2.data.length}`)
    console.log(`Second fetch - Sample values: ${dataset2.data.slice(0, 3).map(d => `${d.name}: ${d.value}`).join(', ')}`)
    
    // Check if values are identical
    const valuesMatch = dataset1.data.every((d1, i) => {
      const d2 = dataset2.data[i]
      return d1 && d2 && d1.value === d2.value && d1.name === d2.name
    })
    
    console.log(`Values match: ${valuesMatch ? '✅ YES' : '❌ NO'}`)
    
    console.log('\n' + '='.repeat(50))
    console.log('TEST 2: Testing today\'s dataset consistency')
    
    const today1 = await getTodaysDataset()
    console.log(`Today's dataset 1: ${today1.title}`)
    console.log(`Sample values 1: ${today1.data.slice(0, 3).map(d => `${d.name}: ${d.value}`).join(', ')}`)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const today2 = await getTodaysDataset()
    console.log(`Today's dataset 2: ${today2.title}`)
    console.log(`Sample values 2: ${today2.data.slice(0, 3).map(d => `${d.name}: ${d.value}`).join(', ')}`)
    
    const todayValuesMatch = today1.data.every((d1, i) => {
      const d2 = today2.data[i]
      return d1 && d2 && d1.value === d2.value && d1.name === d2.name
    })
    
    console.log(`Today's values match: ${todayValuesMatch ? '✅ YES' : '❌ NO'}`)
    
    console.log('\n🎉 Data consistency test complete!')
    console.log(`Overall result: ${valuesMatch && todayValuesMatch ? '✅ PASS - Data is stable!' : '❌ FAIL - Data is not consistent'}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testConsistency()