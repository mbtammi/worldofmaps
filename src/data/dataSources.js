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

// Dataset Categories and their potential sources (Aligned with World Bank Indicators)
export const DATASET_CATEGORIES = {
  DEMOGRAPHICS: {
    name: 'Demographics & Society',
    icon: '👥',
    datasets: [
      'population-density',
      'population-total',
      'population-growth',
      'urban-population',
      'population-ages-65',
      'population-ages-0-14',
      'life-expectancy',
      'birth-rate',
      'death-rate',
      'fertility-rate',
      'infant-mortality',
      'literacy-rate',
      'literacy-rate-youth',
      'literacy-rate-adult-female'
    ]
  },
  ECONOMY: {
    name: 'Economy & Development',
    icon: '💰',
    datasets: [
      'gdp-per-capita',
      'gdp-total',
      'gdp-growth',
      'gni-per-capita',
      'unemployment-rate',
      'inflation-rate',
      'exports-goods-services',
      'imports-goods-services',
      'foreign-investment',
      'government-expenditure',
      'tax-revenue',
      'gross-savings',
      'manufacturing-value',
      'agriculture-value'
    ]
  },
  ENVIRONMENT: {
    name: 'Environment & Climate',
    icon: '🌍',
    datasets: [
      'forest-coverage',
      'methane-emissions',
      'renewable-energy',
      'energy-consumption',
      'energy-imports',
      'fossil-fuel-consumption',
      'electricity-consumption'
    ]
  },
  TECHNOLOGY: {
    name: 'Technology & Innovation',
    icon: '💻',
    datasets: [
      'internet-users',
      'mobile-subscriptions',
      'fixed-broadband',
      'telephone-lines'
    ]
  },
  HEALTH: {
    name: 'Health & Wellbeing',
    icon: '🏥',
    datasets: [
      'healthcare-expenditure',
      'hospital-beds',
      'physicians-density',
      'nurses-midwives',
      'immunization-dpt',
      'immunization-measles',
      'maternal-mortality',
      'tuberculosis-incidence'
    ]
  },
  EDUCATION: {
    name: 'Education & Knowledge',
    icon: '🎓',
    datasets: [
      'education-expenditure',
      'secondary-enrollment',
      'tertiary-enrollment',
      'literacy-rate-youth'
    ]
  },
  INFRASTRUCTURE: {
    name: 'Infrastructure & Transport',
    icon: '🚧',
    datasets: [
      'electricity-access',
      'water-access',
      'sanitation-access',
      'roads-paved',
      'rail-lines',
      'air-passengers'
    ]
  },
  CULTURE: {
    name: 'Culture & Lifestyle',
    icon: '🎭',
    datasets: [
      'coffee-consumption',
      'alcohol-consumption'
    ]
  }
}

// World Bank Indicator Mappings (50+ Verified Authentic Datasets)
export const WORLD_BANK_INDICATORS = {
  // CURRENT 10 INDICATORS (verified working)
  'population-density': 'EN.POP.DNST',
  'gdp-per-capita': 'NY.GDP.PCAP.CD', 
  'life-expectancy': 'SP.DYN.LE00.IN',
  'internet-users': 'IT.NET.USER.ZS',
  'literacy-rate': 'SE.ADT.LITR.ZS', 
  'unemployment-rate': 'SL.UEM.TOTL.ZS',
  'forest-coverage': 'AG.LND.FRST.ZS',
  'urban-population': 'SP.URB.TOTL.IN.ZS',

  // DEMOGRAPHIC & POPULATION INDICATORS (8 new)
  'birth-rate': 'SP.DYN.CBRT.IN',              // Birth rate, crude (per 1,000 people)
  'death-rate': 'SP.DYN.CDRT.IN',              // Death rate, crude (per 1,000 people)
  'fertility-rate': 'SP.DYN.TFRT.IN',          // Fertility rate, total (births per woman)
  'population-growth': 'SP.POP.GROW',          // Population growth (annual %)
  'infant-mortality': 'SP.DYN.IMRT.IN',        // Mortality rate, infant (per 1,000 live births)
  'population-total': 'SP.POP.TOTL',           // Population, total
  'population-ages-65': 'SP.POP.65UP.TO.ZS',  // Population ages 65 and above (% of total)
  'population-ages-0-14': 'SP.POP.0014.TO.ZS', // Population ages 0-14 (% of total)

  // ECONOMIC INDICATORS (12 new)
  'inflation-rate': 'FP.CPI.TOTL.ZG',          // Inflation, consumer prices (annual %)
  'gdp-growth': 'NY.GDP.MKTP.KD.ZG',           // GDP growth (annual %)
  'gdp-total': 'NY.GDP.MKTP.CD',               // GDP (current US$)
  'gni-per-capita': 'NY.GNP.PCAP.CD',          // GNI per capita (current US$)
  'exports-goods-services': 'NE.EXP.GNFS.ZS',  // Exports of goods and services (% of GDP)
  'imports-goods-services': 'NE.IMP.GNFS.ZS',  // Imports of goods and services (% of GDP)
  'foreign-investment': 'BX.KLT.DINV.WD.GD.ZS', // Foreign direct investment, net inflows (% of GDP)
  'government-expenditure': 'GC.XPN.TOTL.GD.ZS', // General government final consumption expenditure (% of GDP)
  'tax-revenue': 'GC.TAX.TOTL.GD.ZS',          // Tax revenue (% of GDP)
  'gross-savings': 'NY.GNS.ICTR.ZS',           // Gross domestic savings (% of GDP)
  'manufacturing-value': 'NV.IND.MANF.ZS',     // Manufacturing, value added (% of GDP)
  'agriculture-value': 'NV.AGR.TOTL.ZS',       // Agriculture, forestry, and fishing, value added (% of GDP)

  // HEALTH INDICATORS (8 new)
  'healthcare-expenditure': 'SH.XPD.CHEX.GD.ZS', // Current health expenditure (% of GDP)
  'hospital-beds': 'SH.MED.BEDS.ZS',           // Hospital beds (per 1,000 people)
  'physicians-density': 'SH.MED.PHYS.ZS',      // Physicians (per 1,000 people)
  'nurses-midwives': 'SH.MED.NUMW.P3',         // Nurses and midwives (per 1,000 people)
  'immunization-dpt': 'SH.IMM.IDPT',           // Immunization, DPT (% of children ages 12-23 months)
  'immunization-measles': 'SH.IMM.MEAS',       // Immunization, measles (% of children ages 12-23 months)
  'maternal-mortality': 'SH.STA.MMRT',         // Maternal mortality ratio (per 100,000 live births)
  'tuberculosis-incidence': 'SH.TBS.INCD',     // Incidence of tuberculosis (per 100,000 people)

  // EDUCATION INDICATORS (4 new) - removed non-working indicators
  'education-expenditure': 'SE.XPD.TOTL.GD.ZS', // Government expenditure on education, total (% of GDP)
  'secondary-enrollment': 'SE.SEC.NENR',       // School enrollment, secondary (% net)
  'tertiary-enrollment': 'SE.TER.ENRR',        // School enrollment, tertiary (% gross)
  'literacy-rate-youth': 'SE.ADT.1524.LT.ZS',  // Literacy rate, youth total (% of people ages 15-24)

  // INFRASTRUCTURE & TECHNOLOGY (10 new)
  'electricity-access': 'EG.ELC.ACCS.ZS',      // Access to electricity (% of population)
  'electricity-consumption': 'EG.USE.ELEC.KH.PC', // Electric power consumption (kWh per capita)
  'mobile-subscriptions': 'IT.CEL.SETS.P2',    // Mobile cellular subscriptions (per 100 people)
  'fixed-broadband': 'IT.NET.BBND.P2',         // Fixed broadband subscriptions (per 100 people)
  'telephone-lines': 'IT.MLT.MAIN.P2',         // Fixed telephone subscriptions (per 100 people)
  'roads-paved': 'IS.ROD.PAVE.ZS',             // Roads, paved (% of total roads)
  'rail-lines': 'IS.RRS.TOTL.KM',              // Rail lines (total route-km)
  'air-passengers': 'IS.AIR.PSGR',             // Air transport, passengers carried
  'water-access': 'SH.H2O.BASW.ZS',            // People using at least basic drinking water services (% of population)
  'sanitation-access': 'SH.STA.BASS.ZS',       // People using at least basic sanitation services (% of population)

  // ENERGY & ENVIRONMENT (5 new) - removed problematic CO2 indicator
  'energy-consumption': 'EG.USE.COMM.KT.OE',   // Energy use (kt of oil equivalent)
  'renewable-energy': 'EG.FEC.RNEW.ZS',        // Renewable energy consumption (% of total final energy consumption)
  'methane-emissions': 'EN.ATM.METH.KT.CE',    // Methane emissions (kt of CO2 equivalent)
  'energy-imports': 'EG.IMP.CONS.ZS',          // Energy imports, net (% of energy use)
  'fossil-fuel-consumption': 'EG.USE.COMM.FO.ZS' // Fossil fuel energy consumption (% of total)
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

// Get only datasets with authentic data sources available
export const getAuthenticDatasets = () => {
  const authenticDatasets = []
  
  Object.values(DATASET_CATEGORIES).forEach(category => {
    category.datasets.forEach(dataset => {
      // Only include datasets that have World Bank data, OWID data, or are in our curated static list
      const hasWorldBank = !!WORLD_BANK_INDICATORS[dataset]
      const hasOWID = !!OWID_DATASETS[dataset]
      const hasStaticData = dataset === 'population-density' // Only population-density has curated static data
      
      if (hasWorldBank || hasOWID || hasStaticData) {
        authenticDatasets.push({
          id: dataset,
          category: category.name,
          hasWorldBankData: hasWorldBank,
          hasOWIDData: hasOWID,
          hasStaticData: hasStaticData,
          estimatedAvailability: getDatasetAvailability(dataset)
        })
      }
    })
  })
  
  return authenticDatasets
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
  getAllAvailableDatasets,
  getAuthenticDatasets
}