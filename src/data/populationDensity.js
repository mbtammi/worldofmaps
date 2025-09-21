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
  
  // The choropleth data - including both 2-letter and 3-letter ISO codes for compatibility
  data: [
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
  ],
  
  // Data attribution
  source: 'World Bank Open Data',
  year: 2023
}

export default populationDensityDataset