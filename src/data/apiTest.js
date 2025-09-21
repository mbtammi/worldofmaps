// Quick test to validate World Bank API access
// This tests if we can fetch data from World Bank's public API

console.log('🧪 Testing World Bank API access...')

// Test the World Bank API endpoint directly
async function testWorldBankAPI() {
  try {
    // Test GDP per capita for a few countries (latest year)
    const url = 'https://api.worldbank.org/v2/country/US;CN;DE;GB;FR/indicator/NY.GDP.PCAP.CD?format=json&date=2022&per_page=10'
    console.log('Fetching:', url)
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ World Bank API Response:', data)
    
    if (Array.isArray(data) && data.length > 1) {
      const countries = data[1] // World Bank returns [metadata, data]
      console.log(`✅ Got data for ${countries.length} countries`)
      countries.forEach(country => {
        console.log(`  ${country.country.value}: $${country.value ? country.value.toLocaleString() : 'N/A'}`)
      })
      return true
    } else {
      console.log('❌ Unexpected data format')
      return false
    }
  } catch (error) {
    console.error('❌ World Bank API test failed:', error.message)
    return false
  }
}

// Run the test
testWorldBankAPI().then(success => {
  if (success) {
    console.log('🎉 World Bank API is accessible!')
    console.log('You can now test the full data system in the browser console with:')
    console.log('  DataSystemDebug.testWorldBankAPI()')
  } else {
    console.log('😔 World Bank API test failed - may be CORS or network issue')
  }
})