// Dynamic Datasets System
// This system allows for easy addition of new game types with real data

export const DATASET_TYPES = {
  POPULATION_DENSITY: 'population-density',
  GDP_PER_CAPITA: 'gdp-per-capita',
  LIFE_EXPECTANCY: 'life-expectancy',
  INTERNET_USAGE: 'internet-usage',
  FOREST_COVERAGE: 'forest-coverage',
  CO2_EMISSIONS: 'co2-emissions'
}

// Dataset templates - these define the structure and game parameters
export const datasetTemplates = {
  [DATASET_TYPES.POPULATION_DENSITY]: {
    id: 'population-density-2023',
    title: 'Population Density',
    description: 'Number of people per square kilometer by country',
    unit: 'per km²',
    
    correctAnswers: [
      'population density',
      'pop density', 
      'people per km2',
      'people per square kilometer',
      'population per area',
      'demographic density',
      'inhabitants per km2'
    ],
    
    options: [
      'Population Density',
      'Coffee Consumption', 
      'Internet Usage',
      'GDP per Capita',
      'Life Expectancy',
      'CO₂ Emissions',
      'Forest Coverage',
      'Literacy Rate',
      'Urban Population',
      'Renewable Energy'
    ],
    
    hints: [
      "This shows how crowded different countries are.",
      "It measures how many people live in a given area.",
      "The unit of measurement involves 'per square kilometer'.",
      "Bangladesh and Singapore have very high values, while Canada and Australia have very low values.",
      "This demographic measure helps understand urban crowding and rural spacing."
    ],
    
    funFact: "Monaco has the highest population density in the world at over 19,000 people per km²! That's like fitting the entire population of a small city into just one square kilometer.",
    
    // Data fetching function - can be API or static
    fetchData: () => Promise.resolve([
      { iso_a2: 'US', iso_a3: 'USA', name: 'United States', value: 36 },
      { iso_a2: 'CN', iso_a3: 'CHN', name: 'China', value: 153 },
      { iso_a2: 'IN', iso_a3: 'IND', name: 'India', value: 464 },
      { iso_a2: 'ID', iso_a3: 'IDN', name: 'Indonesia', value: 151 },
      { iso_a2: 'BR', iso_a3: 'BRA', name: 'Brazil', value: 25 },
      { iso_a2: 'PK', iso_a3: 'PAK', name: 'Pakistan', value: 287 },
      { iso_a2: 'BD', iso_a3: 'BGD', name: 'Bangladesh', value: 1265 },
      { iso_a2: 'NG', iso_a3: 'NGA', name: 'Nigeria', value: 226 },
      { iso_a2: 'RU', iso_a3: 'RUS', name: 'Russia', value: 9 },
      { iso_a2: 'MX', iso_a3: 'MEX', name: 'Mexico', value: 66 },
      { iso_a2: 'JP', iso_a3: 'JPN', name: 'Japan', value: 347 },
      { iso_a2: 'PH', iso_a3: 'PHL', name: 'Philippines', value: 368 },
      { iso_a2: 'VN', iso_a3: 'VNM', name: 'Vietnam', value: 314 },
      { iso_a2: 'ET', iso_a3: 'ETH', name: 'Ethiopia', value: 115 },
      { iso_a2: 'EG', iso_a3: 'EGY', name: 'Egypt', value: 103 },
      { iso_a2: 'DE', iso_a3: 'DEU', name: 'Germany', value: 240 },
      { iso_a2: 'TR', iso_a3: 'TUR', name: 'Turkey', value: 109 },
      { iso_a2: 'IR', iso_a3: 'IRN', name: 'Iran', value: 52 },
      { iso_a2: 'TH', iso_a3: 'THA', name: 'Thailand', value: 137 },
      { iso_a2: 'GB', iso_a3: 'GBR', name: 'United Kingdom', value: 281 },
      { iso_a2: 'FR', iso_a3: 'FRA', name: 'France', value: 119 },
      { iso_a2: 'IT', iso_a3: 'ITA', name: 'Italy', value: 206 },
      { iso_a2: 'KR', iso_a3: 'KOR', name: 'South Korea', value: 527 },
      { iso_a2: 'ES', iso_a3: 'ESP', name: 'Spain', value: 94 },
      { iso_a2: 'UA', iso_a3: 'UKR', name: 'Ukraine', value: 75 },
      { iso_a2: 'PL', iso_a3: 'POL', name: 'Poland', value: 124 },
      { iso_a2: 'CA', iso_a3: 'CAN', name: 'Canada', value: 4 },
      { iso_a2: 'AU', iso_a3: 'AUS', name: 'Australia', value: 3 },
      { iso_a2: 'ZA', iso_a3: 'ZAF', name: 'South Africa', value: 49 },
      { iso_a2: 'KE', iso_a3: 'KEN', name: 'Kenya', value: 94 },
      { iso_a2: 'FI', iso_a3: 'FIN', name: 'Finland', value: 18 },
      { iso_a2: 'SE', iso_a3: 'SWE', name: 'Sweden', value: 25 },
      { iso_a2: 'NO', iso_a3: 'NOR', name: 'Norway', value: 15 },
      { iso_a2: 'DK', iso_a3: 'DNK', name: 'Denmark', value: 137 },
      { iso_a2: 'NL', iso_a3: 'NLD', name: 'Netherlands', value: 508 }
    ])
  },

  [DATASET_TYPES.GDP_PER_CAPITA]: {
    id: 'gdp-per-capita-2023',
    title: 'GDP per Capita',
    description: 'Gross Domestic Product per person in thousands of US dollars',
    unit: 'thousands USD',
    
    correctAnswers: [
      'gdp per capita',
      'gdp',
      'gross domestic product',
      'economic output',
      'wealth per person',
      'income per capita',
      'economic prosperity'
    ],
    
    options: [
      'GDP per Capita',
      'Population Density',
      'Life Expectancy',
      'Military Spending',
      'Education Index',
      'Happiness Score',
      'Internet Speed',
      'Tourism Revenue',
      'Energy Consumption',
      'Innovation Index'
    ],
    
    hints: [
      "This measures the economic strength of countries.",
      "It shows how wealthy the average person is in each country.",
      "The unit is measured in thousands of US dollars.",
      "Luxembourg and Switzerland typically rank highest, while many African countries rank lower.",
      "This economic indicator reflects a country's standard of living and economic development."
    ],
    
    funFact: "Luxembourg has the world's highest GDP per capita at over $125,000 per person annually - that's more than twice the US average!",
    
    fetchData: () => Promise.resolve([
      { iso_a2: 'LU', iso_a3: 'LUX', name: 'Luxembourg', value: 125 },
      { iso_a2: 'CH', iso_a3: 'CHE', name: 'Switzerland', value: 94 },
      { iso_a2: 'NO', iso_a3: 'NOR', name: 'Norway', value: 89 },
      { iso_a2: 'US', iso_a3: 'USA', name: 'United States', value: 76 },
      { iso_a2: 'DE', iso_a3: 'DEU', name: 'Germany', value: 51 },
      { iso_a2: 'GB', iso_a3: 'GBR', name: 'United Kingdom', value: 47 },
      { iso_a2: 'FR', iso_a3: 'FRA', name: 'France', value: 44 },
      { iso_a2: 'JP', iso_a3: 'JPN', name: 'Japan', value: 40 },
      { iso_a2: 'CA', iso_a3: 'CAN', name: 'Canada', value: 52 },
      { iso_a2: 'AU', iso_a3: 'AUS', name: 'Australia', value: 64 },
      { iso_a2: 'KR', iso_a3: 'KOR', name: 'South Korea', value: 35 },
      { iso_a2: 'CN', iso_a3: 'CHN', name: 'China', value: 12 },
      { iso_a2: 'IN', iso_a3: 'IND', name: 'India', value: 2.4 },
      { iso_a2: 'BR', iso_a3: 'BRA', name: 'Brazil', value: 9 },
      { iso_a2: 'RU', iso_a3: 'RUS', name: 'Russia', value: 13 }
    ])
  },

  [DATASET_TYPES.LIFE_EXPECTANCY]: {
    id: 'life-expectancy-2023',
    title: 'Life Expectancy',
    description: 'Average number of years a person is expected to live',
    unit: 'years',
    
    correctAnswers: [
      'life expectancy',
      'lifespan',
      'longevity',
      'average age',
      'mortality rate',
      'life span',
      'expected lifespan'
    ],
    
    options: [
      'Life Expectancy',
      'Birth Rate',
      'Healthcare Spending',
      'Population Density',
      'Education Level',
      'Air Quality Index',
      'Food Security',
      'Disease Prevalence',
      'Vaccination Rate',
      'Quality of Life'
    ],
    
    hints: [
      "This measures how long people typically live in each country.",
      "It's strongly correlated with healthcare quality and economic development.",
      "The measurement is in years.",
      "Japan and Monaco typically have the highest values, while some African nations have lower values.",
      "This health indicator reflects medical care, nutrition, and living conditions."
    ],
    
    funFact: "People in Monaco live the longest on average - about 89 years! Good healthcare and lifestyle make a huge difference.",
    
    fetchData: () => Promise.resolve([
      { iso_a2: 'MC', iso_a3: 'MCO', name: 'Monaco', value: 89 },
      { iso_a2: 'JP', iso_a3: 'JPN', name: 'Japan', value: 84 },
      { iso_a2: 'CH', iso_a3: 'CHE', name: 'Switzerland', value: 84 },
      { iso_a2: 'KR', iso_a3: 'KOR', name: 'South Korea', value: 83 },
      { iso_a2: 'ES', iso_a3: 'ESP', name: 'Spain', value: 83 },
      { iso_a2: 'AU', iso_a3: 'AUS', name: 'Australia', value: 83 },
      { iso_a2: 'IT', iso_a3: 'ITA', name: 'Italy', value: 83 },
      { iso_a2: 'FR', iso_a3: 'FRA', name: 'France', value: 82 },
      { iso_a2: 'CA', iso_a3: 'CAN', name: 'Canada', value: 82 },
      { iso_a2: 'GB', iso_a3: 'GBR', name: 'United Kingdom', value: 81 },
      { iso_a2: 'DE', iso_a3: 'DEU', name: 'Germany', value: 81 },
      { iso_a2: 'US', iso_a3: 'USA', name: 'United States', value: 78 },
      { iso_a2: 'CN', iso_a3: 'CHN', name: 'China', value: 77 },
      { iso_a2: 'BR', iso_a3: 'BRA', name: 'Brazil', value: 75 },
      { iso_a2: 'RU', iso_a3: 'RUS', name: 'Russia', value: 73 },
      { iso_a2: 'IN', iso_a3: 'IND', name: 'India', value: 70 }
    ])
  }
}

// Function to get a dataset by type
export const getDatasetByType = async (datasetType) => {
  const template = datasetTemplates[datasetType]
  if (!template) {
    throw new Error(`Dataset type ${datasetType} not found`)
  }

  const data = await template.fetchData()
  
  return {
    ...template,
    data,
    source: 'World Bank Open Data',
    year: 2023
  }
}

// Get daily dataset based on date (rotates through available datasets)
export const getDailyDataset = async () => {
  const datasetTypes = Object.keys(datasetTemplates)
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  const todaysType = datasetTypes[daysSinceEpoch % datasetTypes.length]
  
  return await getDatasetByType(todaysType)
}

// Get all available dataset types for admin/testing
export const getAllDatasetTypes = () => {
  return Object.keys(datasetTemplates).map(key => ({
    id: key,
    title: datasetTemplates[key].title,
    description: datasetTemplates[key].description
  }))
}

export default {
  DATASET_TYPES,
  datasetTemplates,
  getDatasetByType,
  getDailyDataset,
  getAllDatasetTypes
}