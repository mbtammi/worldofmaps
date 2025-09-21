// Population Density Dataset
// Data source: World Bank / Our World in Data (sample values)

export const populationDensityDataset = {
  id: 'population-density-2023',
  title: 'Population Density',
  description: 'Number of people per square kilometer by country',
  
  // The correct answers (with variations)
  correctAnswers: [
    'population density',
    'pop density', 
    'people per km2',
    'people per square kilometer',
    'population per area',
    'demographic density',
    'inhabitants per km2'
  ],
  
  // Multiple choice options for the game
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
  
  // Progressive hints that get more specific
  hints: [
    "This shows how crowded different countries are.",
    "It measures how many people live in a given area.",
    "The unit of measurement involves 'per square kilometer'.",
    "Bangladesh and Singapore have very high values, while Canada and Australia have very low values.",
    "This demographic measure helps understand urban crowding and rural spacing."
  ],
  
  // Fun fact revealed on win
  funFact: "Monaco has the highest population density in the world at over 19,000 people per km²! That's like fitting the entire population of a small city into just one square kilometer.",
  
  // The choropleth data
  data: [
    { iso_a2: 'US', name: 'United States', value: 36 },
    { iso_a2: 'CN', name: 'China', value: 153 },
    { iso_a2: 'IN', name: 'India', value: 464 },
    { iso_a2: 'ID', name: 'Indonesia', value: 151 },
    { iso_a2: 'BR', name: 'Brazil', value: 25 },
    { iso_a2: 'PK', name: 'Pakistan', value: 287 },
    { iso_a2: 'BD', name: 'Bangladesh', value: 1265 },
    { iso_a2: 'NG', name: 'Nigeria', value: 226 },
    { iso_a2: 'RU', name: 'Russia', value: 9 },
    { iso_a2: 'MX', name: 'Mexico', value: 66 },
    { iso_a2: 'JP', name: 'Japan', value: 347 },
    { iso_a2: 'PH', name: 'Philippines', value: 368 },
    { iso_a2: 'VN', name: 'Vietnam', value: 314 },
    { iso_a2: 'ET', name: 'Ethiopia', value: 115 },
    { iso_a2: 'EG', name: 'Egypt', value: 103 },
    { iso_a2: 'DE', name: 'Germany', value: 240 },
    { iso_a2: 'TR', name: 'Turkey', value: 109 },
    { iso_a2: 'IR', name: 'Iran', value: 52 },
    { iso_a2: 'TH', name: 'Thailand', value: 137 },
    { iso_a2: 'GB', name: 'United Kingdom', value: 281 },
    { iso_a2: 'FR', name: 'France', value: 119 },
    { iso_a2: 'IT', name: 'Italy', value: 206 },
    { iso_a2: 'KR', name: 'South Korea', value: 527 },
    { iso_a2: 'ES', name: 'Spain', value: 94 },
    { iso_a2: 'UA', name: 'Ukraine', value: 75 },
    { iso_a2: 'PL', name: 'Poland', value: 124 },
    { iso_a2: 'CA', name: 'Canada', value: 4 },
    { iso_a2: 'AU', name: 'Australia', value: 3 },
    { iso_a2: 'ZA', name: 'South Africa', value: 49 },
    { iso_a2: 'KE', name: 'Kenya', value: 94 }
  ],
  
  // Color scale for the choropleth - blue gradient for better visibility
  colorScale: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'],
  
  // Data attribution
  source: 'World Bank Open Data',
  year: 2023
}

export default populationDensityDataset