// Data Sources Configuration
// Manages external API integrations for dynamic dataset loading

export const DATA_SOURCES = {
  WORLD_BANK: {
    name: 'World Bank Open Data',
    baseUrl: 'https://api.worldbank.org/v2',
    format: 'json',
    attribution: 'World Bank Open Data',
    rateLimit: 100, // requests per hour
  },
  OUR_WORLD_IN_DATA: {
    name: 'Our World in Data',
    baseUrl: 'https://raw.githubusercontent.com/owid/owid-datasets/master',
    format: 'csv',
    attribution: 'Our World in Data',
    rateLimit: 60,
  },
  UN_DATA: {
    name: 'UN Data',
    baseUrl: 'https://data.un.org/ws/rest',
    format: 'json',
    attribution: 'United Nations Statistics Division',
    rateLimit: 50,
  },
  STATIC_BACKUP: {
    name: 'Static Backup Data',
    baseUrl: '/data/backup',
    format: 'json',
    attribution: 'WorldOfMaps Curated Data',
    rateLimit: 1000,
  }
}

// Dataset Categories and their potential sources
export const DATASET_CATEGORIES = {
  DEMOGRAPHICS: {
    name: 'Demographics & Society',
    icon: '👥',
    datasets: [
      'population-density',
      'life-expectancy',
      'birth-rate',
      'death-rate',
      'urban-population',
      'literacy-rate',
      'infant-mortality',
      'median-age',
      'population-growth',
      'fertility-rate'
    ]
  },
  ECONOMY: {
    name: 'Economy & Development',
    icon: '💰',
    datasets: [
      'gdp-per-capita',
      'gdp-growth',
      'unemployment-rate',
      'inflation-rate',
      'poverty-rate',
      'gini-coefficient',
      'foreign-investment',
      'debt-to-gdp',
      'exports-total',
      'imports-total'
    ]
  },
  ENVIRONMENT: {
    name: 'Environment & Climate',
    icon: '🌍',
    datasets: [
      'co2-emissions',
      'renewable-energy',
      'forest-coverage',
      'water-stress',
      'air-pollution',
      'temperature-change',
      'precipitation-annual',
      'biodiversity-index',
      'plastic-waste',
      'energy-consumption'
    ]
  },
  TECHNOLOGY: {
    name: 'Technology & Innovation',
    icon: '💻',
    datasets: [
      'internet-users',
      'mobile-subscriptions',
      'broadband-subscriptions',
      'rd-expenditure',
      'patent-applications',
      'scientific-publications',
      'high-tech-exports',
      'digital-government',
      'cybersecurity-index',
      'innovation-index'
    ]
  },
  HEALTH: {
    name: 'Health & Wellbeing',
    icon: '🏥',
    datasets: [
      'healthcare-expenditure',
      'hospital-beds',
      'physicians-density',
      'vaccination-coverage',
      'malnutrition-rate',
      'obesity-rate',
      'mental-health-disorders',
      'disease-burden',
      'healthcare-access',
      'pharmaceutical-spending'
    ]
  },
  EDUCATION: {
    name: 'Education & Knowledge',
    icon: '🎓',
    datasets: [
      'education-expenditure',
      'primary-enrollment',
      'secondary-enrollment',
      'tertiary-enrollment',
      'teacher-ratio',
      'education-quality-index',
      'adult-learning',
      'educational-attainment',
      'school-completion',
      'education-gender-parity'
    ]
  },
  CULTURE: {
    name: 'Culture & Lifestyle',
    icon: '🎭',
    datasets: [
      'coffee-consumption',
      'alcohol-consumption',
      'tourism-arrivals',
      'cultural-sites',
      'language-diversity',
      'religious-diversity',
      'happiness-index',
      'social-progress-index',
      'press-freedom',
      'human-rights-index'
    ]
  },
  GOVERNANCE: {
    name: 'Governance & Politics',
    icon: '🏛️',
    datasets: [
      'democracy-index',
      'corruption-index',
      'government-effectiveness',
      'rule-of-law',
      'political-stability',
      'civil-liberties',
      'electoral-process',
      'government-expenditure',
      'tax-revenue',
      'public-debt'
    ]
  },
  INFRASTRUCTURE: {
    name: 'Infrastructure & Transport',
    icon: '🚧',
    datasets: [
      'road-density',
      'railway-density',
      'airport-density',
      'port-infrastructure',
      'electricity-access',
      'water-access',
      'sanitation-access',
      'logistics-performance',
      'infrastructure-investment',
      'transport-emissions'
    ]
  },
  SECURITY: {
    name: 'Security & Safety',
    icon: '🛡️',
    datasets: [
      'homicide-rate',
      'peace-index',
      'terrorism-index',
      'military-expenditure',
      'police-per-capita',
      'prison-population',
      'road-deaths',
      'natural-disaster-risk',
      'food-security',
      'cyber-security'
    ]
  }
}

// World Bank Indicator Mappings
export const WORLD_BANK_INDICATORS = {
  'population-density': 'EN.POP.DNST',
  'gdp-per-capita': 'NY.GDP.PCAP.CD',
  'life-expectancy': 'SP.DYN.LE00.IN',
  'co2-emissions': 'EN.ATM.CO2E.PC',
  'internet-users': 'IT.NET.USER.ZS',
  'literacy-rate': 'SE.ADT.LITR.ZS',
  'unemployment-rate': 'SL.UEM.TOTL.ZS',
  'forest-coverage': 'AG.LND.FRST.ZS',
  'renewable-energy': 'EG.FEC.RNEW.ZS',
  'urban-population': 'SP.URB.TOTL.IN.ZS'
}

// Our World in Data Dataset Mappings (Conservative list of known datasets)
export const OWID_DATASETS = {
  // Focus on datasets we know exist or can reliably fallback
  // Comment out problematic ones until we can verify paths
  // 'happiness-index': 'happiness-cantril-ladder',
  // 'democracy-index': 'democracy-index',
  // 'corruption-index': 'corruption-perception-index', 
  // 'press-freedom': 'press-freedom-index',
  // 'human-rights-index': 'human-rights-protection-index',
  // 'peace-index': 'global-peace-index',
  // 'innovation-index': 'global-innovation-index',
  'coffee-consumption': 'coffee-per-capita',
  'alcohol-consumption': 'alcohol-consumption-per-capita'
  // 'mental-health-disorders': 'prevalence-of-mental-health-disorders'
}

// Generate a complete dataset list (100+ datasets)
export const getAllAvailableDatasets = () => {
  const allDatasets = []
  
  Object.values(DATASET_CATEGORIES).forEach(category => {
    category.datasets.forEach(dataset => {
      allDatasets.push({
        id: dataset,
        category: category.name,
        hasWorldBankData: !!WORLD_BANK_INDICATORS[dataset],
        hasOWIDData: !!OWID_DATASETS[dataset],
        estimatedAvailability: getDatasetAvailability(dataset)
      })
    })
  })
  
  return allDatasets
}

// Estimate data availability for a dataset
function getDatasetAvailability(datasetId) {
  // High availability datasets (World Bank, OWID)
  const highAvailability = [
    'population-density', 'gdp-per-capita', 'life-expectancy', 'co2-emissions',
    'internet-users', 'literacy-rate', 'unemployment-rate', 'forest-coverage'
  ]
  
  // Medium availability datasets (UN, specialized sources)
  const mediumAvailability = [
    'happiness-index', 'democracy-index', 'corruption-index', 'tourism-arrivals'
  ]
  
  if (highAvailability.includes(datasetId)) return 'high'
  if (mediumAvailability.includes(datasetId)) return 'medium'
  return 'low'
}

export default {
  DATA_SOURCES,
  DATASET_CATEGORIES,
  WORLD_BANK_INDICATORS,
  OWID_DATASETS,
  getAllAvailableDatasets
}