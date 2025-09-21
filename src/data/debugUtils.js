// Debug utilities for testing the dynamic data system in browser
// Available in browser console as window.DataSystemDebug

import { getAllAvailableDatasets, DATASET_CATEGORIES } from './dataSources.js'
import { fetchWorldBankData, fetchOWIDData, fetchDataset } from './dataFetcher.js'
import { getTodaysDataset, getCurrentDayIndex, getTimeUntilReset } from './dailyChallenge.js'

// Export debug utilities to window for browser console access
const DataSystemDebug = {
  
  // Test available datasets
  async testAvailableDatasets() {
    console.log('🧪 Testing Available Datasets System...')
    try {
      const datasets = getAllAvailableDatasets()
      console.log(`✅ Found datasets in ${Object.keys(datasets).length} categories:`)
      
      Object.entries(datasets).forEach(([category, categoryDatasets]) => {
        console.log(`  📊 ${category}: ${categoryDatasets.length} datasets`)
        categoryDatasets.slice(0, 3).forEach(ds => {
          console.log(`    - ${ds.id}: ${ds.title}`)
        })
      })
      return datasets
    } catch (error) {
      console.error('❌ Available datasets test failed:', error)
      throw error
    }
  },
  
  // Test World Bank API
  async testWorldBankAPI() {
    console.log('🌍 Testing World Bank API...')
    try {
      // Test GDP per capita - a reliable indicator
      const data = await fetchWorldBankData('NY.GDP.PCAP.CD', 2022, 10)
      console.log(`✅ World Bank API working! Got ${data.length} countries`)
      console.log('Sample data:', data.slice(0, 3))
      return data
    } catch (error) {
      console.error('❌ World Bank API test failed:', error)
      console.log('This might be due to CORS or network issues')
      throw error
    }
  },
  
  // Test OWID API
  async testOWIDAPI() {
    console.log('📈 Testing Our World in Data API...')
    try {
      const data = await fetchOWIDData('co2-emissions', 5)
      console.log(`✅ OWID API working! Got ${data.length} countries`)
      console.log('Sample data:', data.slice(0, 3))
      return data
    } catch (error) {
      console.error('❌ OWID API test failed:', error)
      console.log('This might be due to CORS or the data structure')
      throw error
    }
  },
  
  // Test dataset generation
  async testDatasetGeneration() {
    console.log('🏗️  Testing Dataset Generation...')
    try {
      const dataset = await fetchDataset('gdp-per-capita')
      console.log(`✅ Dataset generated: "${dataset.title}"`)
      console.log(`   Data points: ${dataset.data.length}`)
      console.log(`   Options: ${dataset.options.length}`)
      console.log(`   Hints: ${dataset.hints.length}`)
      return dataset
    } catch (error) {
      console.error('❌ Dataset generation failed:', error)
      throw error
    }
  },
  
  // Test daily challenge system
  async testDailyChallenge() {
    console.log('🗓️  Testing Daily Challenge System...')
    try {
      const dayIndex = getCurrentDayIndex()
      console.log(`Current day index: ${dayIndex}`)
      
      const timeUntilReset = getTimeUntilReset()
      console.log(`Time until reset: ${Math.floor(timeUntilReset / 1000 / 60 / 60)} hours`)
      
      const todaysDataset = await getTodaysDataset()
      console.log(`✅ Today's dataset: "${todaysDataset.title}"`)
      console.log(`   Description: ${todaysDataset.description}`)
      
      return todaysDataset
    } catch (error) {
      console.error('❌ Daily challenge test failed:', error)
      throw error
    }
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all Dynamic Data System tests...\n')
    
    const results = {}
    
    try {
      results.datasets = await this.testAvailableDatasets()
    } catch (e) { results.datasets = null }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    try {
      results.worldBank = await this.testWorldBankAPI()
    } catch (e) { results.worldBank = null }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    try {
      results.owid = await this.testOWIDAPI()
    } catch (e) { results.owid = null }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    try {
      results.datasetGen = await this.testDatasetGeneration()
    } catch (e) { results.datasetGen = null }
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    try {
      results.dailyChallenge = await this.testDailyChallenge()
    } catch (e) { results.dailyChallenge = null }
    
    console.log('\n🎉 All tests completed!')
    console.log('Results summary:')
    console.log('  Available Datasets:', results.datasets ? '✅' : '❌')
    console.log('  World Bank API:', results.worldBank ? '✅' : '❌')
    console.log('  OWID API:', results.owid ? '✅' : '❌')
    console.log('  Dataset Generation:', results.datasetGen ? '✅' : '❌')
    console.log('  Daily Challenge:', results.dailyChallenge ? '✅' : '❌')
    
    return results
  },
  
  // Show dataset categories
  showCategories() {
    console.log('📊 Available Dataset Categories:')
    Object.entries(DATASET_CATEGORIES).forEach(([key, category]) => {
      console.log(`  ${category.icon} ${category.name}: ${category.description}`)
    })
  },
  
  // Quick test - just check if system loads
  async quickTest() {
    try {
      const datasets = getAllAvailableDatasets()
      console.log('✅ Data system loaded successfully')
      console.log(`Found ${Object.keys(datasets).flat().length} total datasets`)
      return true
    } catch (error) {
      console.error('❌ Data system failed to load:', error)
      return false
    }
  }
}

// Make available globally for browser console testing
if (typeof window !== 'undefined') {
  window.DataSystemDebug = DataSystemDebug
  console.log('🔧 DataSystemDebug available in console!')
  console.log('Try: DataSystemDebug.quickTest() or DataSystemDebug.runAllTests()')
}

export default DataSystemDebug