// Serverless function: fetchData
// Proxies requests to external data APIs to bypass CORS restrictions
// Supports World Bank API and other data sources

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { source, indicator, year = '2022' } = req.query
    
    if (!source || !indicator) {
      return res.status(400).json({ 
        error: 'Missing required parameters: source and indicator' 
      })
    }
    
    let url
    
    // Construct URL based on data source
    switch (source) {
      case 'worldbank':
        const actualYear = year === 'latest' ? '2022' : year
        url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=300&date=${actualYear}`
        break
        
      case 'owid':
        // Our World in Data endpoints (CSV format) - try multiple paths
        const possiblePaths = [
          `https://github.com/owid/owid-datasets/raw/master/datasets/${indicator}/${indicator}.csv`,
          `https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/${indicator}/${indicator}.csv`,
          `https://github.com/owid/owid-datasets/raw/master/datasets/${indicator}.csv`
        ]
        
        let csvData = null
        let lastError = null
        
        // Try each possible path
        for (const testUrl of possiblePaths) {
          try {
            console.log(`Trying OWID URL: ${testUrl}`)
            const testResponse = await fetch(testUrl, {
              headers: {
                'User-Agent': 'WorldOfMaps/1.0 (+https://worldofmaps.vercel.app)',
                'Accept': 'text/csv'
              }
            })
            
            if (testResponse.ok) {
              csvData = await testResponse.text()
              url = testUrl // Set the successful URL for logging
              console.log(`✓ OWID data found at: ${testUrl}`)
              break
            }
          } catch (pathError) {
            console.log(`Failed path: ${testUrl} - ${pathError.message}`)
            lastError = pathError
            continue
          }
        }
        
        if (!csvData) {
          throw new Error(`OWID dataset not found at any expected path for: ${indicator}. Last error: ${lastError?.message}`)
        }
        
        // Return the CSV data directly
        return res.status(200).json({
          success: true,
          source: 'owid',
          indicator,
          data: csvData,
          format: 'csv',
          url: url
        })
        
      default:
        return res.status(400).json({ error: 'Unsupported data source' })
    }
    
    // World Bank API handling
    if (source === 'worldbank') {
      const actualYear = year === 'latest' ? '2022' : year
      url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=300&date=${actualYear}`
      
      console.log(`Fetching World Bank data from: ${url}`)
      
      // Fetch data from the World Bank API
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WorldOfMaps/1.0 (+https://worldofmaps.vercel.app)',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`World Bank API responded with status: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // World Bank returns [metadata, data] array
      if (!Array.isArray(data) || data.length < 2) {
        throw new Error('Invalid World Bank API response format')
      }
      
      // Return the data portion with success metadata
      return res.status(200).json({
        success: true,
        source: 'worldbank',
        indicator,
        year: actualYear,
        data: data[1], // The actual data array
        metadata: data[0] // Metadata about the request
      })
    }
    
    // If we get here, something went wrong
    return res.status(500).json({
      success: false,
      error: 'Unknown data source or processing error'
    })
    
  } catch (error) {
    console.error('Error fetching data:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to fetch data from external API'
    })
  }
}