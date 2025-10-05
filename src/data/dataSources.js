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
  REST_COUNTRIES: {
    name: 'REST Countries',
    baseUrl: 'https://restcountries.com/v3.1',
    format: 'json',
    attribution: 'REST Countries (CC BY-SA 4.0)',
    rateLimit: 300,
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
      'land-area',
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
  CULTURAL_DIVERSITY: {
    name: 'Cultural & Structural Diversity',
    icon: '🌐',
    datasets: [
      'languages-count',
      'timezones-count'
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
  ,
  // --- EXPANDED DATASET MAPPINGS (additional authentic indicators) ---
  // Additional Demographics / Society
  'female-population-percent': 'SP.POP.TOTL.FE.ZS',
  'male-population-percent': 'SP.POP.TOTL.MA.ZS',
  'population-density-rural': 'EN.POP.DNST.RU',
  'population-density-urban': 'EN.POP.DNST.UR',
  'dependency-ratio': 'SP.POP.DPND',
  'marriage-rate-proxy': 'SP.DYN.CDRT.IN',
  'life-expectancy-female': 'SP.DYN.LE00.FE.IN',
  'life-expectancy-male': 'SP.DYN.LE00.MA.IN',
  'adolescent-fertility-rate': 'SP.ADO.TFRT',
  'age-dependency-old': 'SP.POP.DPND.OL',
  'age-dependency-young': 'SP.POP.DPND.YG',
  'labor-force-participation-female': 'SL.TLF.ACTI.FE.ZS',
  'labor-force-participation-male': 'SL.TLF.ACTI.MA.ZS',
  'labor-force-total': 'SL.TLF.TOTL.IN',
  'refugee-population': 'SM.POP.REFG',
  'net-migration': 'SM.POP.NETM',

  // Economy & Finance (expanded)
  'gdp-per-capita-ppp': 'NY.GDP.PCAP.PP.CD',
  'gdp-ppp': 'NY.GDP.MKTP.PP.CD',
  'gni-atlas-method': 'NY.GNP.ATLS.CD',
  'services-value-added-percent-gdp': 'NV.SRV.TOTL.ZS',
  'industry-value-added-percent-gdp': 'NV.IND.TOTL.ZS',
  'agriculture-value-added-percent-gdp': 'NV.AGR.TOTL.ZS',
  'capital-formation-percent-gdp': 'NE.GDI.TOTL.ZS',
  'gross-capital-formation': 'NE.GDI.TOTL.CD',
  'current-account-balance': 'BN.CAB.XOKA.CD',
  'merchandise-exports-current-usd': 'TX.VAL.MRCH.CD.WT',
  'merchandise-imports-current-usd': 'TM.VAL.MRCH.CD.WT',
  'high-technology-exports-percent-manufactured': 'TX.VAL.TECH.MF.ZS',
  'research-development-expenditure-percent-gdp': 'GB.XPD.RSDV.GD.ZS',
  'inflation-gdp-deflator': 'NY.GDP.DEFL.KD.ZG',
  'gross-national-expenditure-percent-gdp': 'NE.GNE.TOTL.ZS',
  'household-consumption-percent-gdp': 'NE.CON.PRVT.ZS',
  'government-consumption-percent-gdp': 'NE.CON.GOVT.ZS',
  'fixed-capital-formation-percent-gdp': 'NE.GDI.FTOT.ZS',
  'trade-percent-gdp': 'NE.TRD.GNFS.ZS',
  'remittance-inflows-percent-gdp': 'BX.TRF.PWKR.DT.GD.ZS',
  'unemployment-youth-total': 'SL.UEM.1524.ZS',
  'unemployment-youth-female': 'SL.UEM.1524.FE.ZS',
  'unemployment-youth-male': 'SL.UEM.1524.MA.ZS',
  'tax-revenue-percent-gdp': 'GC.TAX.TOTL.GD.ZS',
  'military-expenditure-percent-gdp': 'MS.MIL.XPND.GD.ZS',
  'external-debt-stocks': 'DT.DOD.DECT.CD',
  'external-debt-percent-gni': 'DT.DOD.DECT.GN.ZS',
  'total-reserves': 'FI.RES.TOTL.CD',
  'total-reserves-in-months-imports': 'FI.RES.TOTL.MO',
  'fdi-net-outflows-percent-gdp': 'BM.KLT.DINV.WD.GD.ZS',
  'fdi-net-outflows-current-usd': 'BM.KLT.DINV.CD.WD',
  'fdi-net-inflows-current-usd': 'BX.KLT.DINV.CD.WD',
  'portfolio-equity-net-inflows': 'BX.PEF.TOTL.CD.WD',

  // Education / Knowledge (expanded)
  'primary-enrollment-gross': 'SE.PRM.ENRR',
  'primary-enrollment-net': 'SE.PRM.NENR',
  'secondary-enrollment-gross': 'SE.SEC.ENRR',
  'tertiary-enrollment-female': 'SE.TER.ENRR.FE',
  'pupil-teacher-ratio-primary': 'SE.PRM.ENRL.TC.ZS',
  'pupil-teacher-ratio-secondary': 'SE.SEC.ENRL.TC.ZS',
  'government-education-expenditure-percent-gdp': 'SE.XPD.TOTL.GD.ZS',
  'education-completion-primary': 'SE.PRM.CMPT.ZS',
  'education-completion-lower-secondary': 'SE.SEC.CMPT.LO.ZS',
  'education-completion-upper-secondary': 'SE.SEC.CMPT.UP.ZS',
  'out-of-school-children-primary': 'SE.PRM.UNER',
  'school-enrollment-preprimary': 'SE.PRE.ENRR',

  // Health & Wellbeing (expanded)
  'life-expectancy-at-birth-total': 'SP.DYN.LE00.IN',
  'life-expectancy-at-birth-female': 'SP.DYN.LE00.FE.IN',
  'life-expectancy-at-birth-male': 'SP.DYN.LE00.MA.IN',
  'mortality-under-5': 'SH.DYN.MORT',
  'mortality-adult-male': 'SP.DYN.AMRT.MA',
  'mortality-adult-female': 'SP.DYN.AMRT.FE',
  'obesity-prevalence-female': 'SH.STA.OB18.FE.ZS',
  'obesity-prevalence-male': 'SH.STA.OB18.MA.ZS',
  'diabetes-prevalence-total': 'SH.STA.DIAB.ZS',
  'cause-injury-mortality-percent': 'SH.DTH.INJR.ZS',
  'cause-communicable-mortality-percent': 'SH.DTH.COMM.ZS',
  'cause-noncommunicable-mortality-percent': 'SH.DTH.NCOM.ZS',
  'births-attended-by-skilled-staff': 'SH.STA.BRTC.ZS',
  'contraceptive-prevalence': 'SP.DYN.CONU.ZS',
  'prevalence-anemia-pregnant-women': 'SH.PRG.ANEM',
  'mental-health-proxy-suicide-rate': 'SH.STA.SUIC.P5',
  'tuberculosis-detection-rate': 'SH.TBS.DTEC.ZS',

  // Infrastructure / Technology (expanded)
  'broadband-subscriptions-fixed-total': 'IT.NET.BBND',
  'broadband-subscriptions-mobile': 'IT.CEL.BBND.P2',
  'internet-secure-servers': 'IT.NET.SECR.P6',
  'high-tech-exports-current-usd': 'TX.VAL.TECH.CD',
  'air-freight-ton-km': 'IS.AIR.GOOD.MT.K1',
  'container-port-traffic-teu': 'IS.SHP.GOOD.TU',
  'electricity-production-kwh': 'EG.ELC.PROD.KH',
  'renewable-electricity-percent-total': 'EG.ELC.RNEW.ZS',
  'access-clean-fuels-cooking': 'EG.CFT.ACCS.ZS',
  'mobile-cellular-subscriptions-total': 'IT.CEL.SETS',
  'logistics-performance-index': 'LP.LPI.OVRL.XQ',
  'time-required-to-start-business-days': 'IC.REG.DURS',
  'cost-of-business-startup-percent-income': 'IC.REG.COST.PC.ZS',
  'quality-of-port-infrastructure': 'IQ.WEF.PORT.XQ',
  'quality-of-air-transport-infrastructure': 'IQ.WEF.AIRP.XQ',

  // Environment & Energy (expanded)
  'co2-emissions-per-capita': 'EN.ATM.CO2E.PC',
  'co2-emissions-kt': 'EN.ATM.CO2E.KT',
  'methane-emissions-kt': 'EN.ATM.METH.KT.CE',
  'nitrous-oxide-emissions-thousand-metric-tons': 'EN.ATM.NOXE.KT.CE',
  'energy-use-kg-oil-per-capita': 'EG.USE.PCAP.KG.OE',
  'electric-power-consumption-kwh-capita': 'EG.USE.ELEC.KH.PC',
  'forest-area-percent-land': 'AG.LND.FRST.ZS',
  'agricultural-land-percent-land-area': 'AG.LND.AGRI.ZS',
  'terrestrial-protected-areas-percent-total': 'ER.LND.PTLD.ZS',
  'marine-protected-areas-percent': 'ER.MRN.PTMR.ZS',
  'threatened-mammal-species': 'EN.MAM.THRD.NO',
  'threatened-bird-species': 'EN.BIR.THRD.NO',
  'threatened-fish-species': 'EN.FSH.THRD.NO',
  'renewable-internal-freshwater-percent-total': 'ER.H2O.INTR.PC',
  'water-withdrawal-percent-available': 'ER.H2O.FWTL.ZS',
  'population-exposed-air-pm25-above-who': 'EN.ATM.PM25.MC.M3',

  // Governance / Social
  'intentional-homicides-per-100k': 'VC.IHR.PSRC.P5',
  'armed-forces-personnel-percent-labor': 'MS.MIL.TOTL.TF.ZS',
  'female-parliament-percent': 'SG.GEN.PARL.ZS',
  'rule-of-law-estimate': 'RL.EST',
  'control-of-corruption-estimate': 'CC.EST',
  'voice-and-accountability-estimate': 'VA.EST',
  'political-stability-estimate': 'PV.EST',
  'regulatory-quality-estimate': 'RQ.EST',
  'government-effectiveness-estimate': 'GE.EST'
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
let __allDatasetsCache = null
let __allDatasetsCacheTime = 0
const DATASET_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const getAllAvailableDatasets = () => {
  const now = Date.now()
  if (__allDatasetsCache && (now - __allDatasetsCacheTime) < DATASET_CACHE_TTL_MS) {
    return __allDatasetsCache
  }

  const allDatasets = []
  const seen = new Set()

  // Include configured category datasets first
  Object.values(DATASET_CATEGORIES).forEach(category => {
    category.datasets.forEach(dataset => {
      if (seen.has(dataset)) return
      seen.add(dataset)
      allDatasets.push({
        id: dataset,
        category: category.name,
        hasWorldBankData: !!WORLD_BANK_INDICATORS[dataset],
        hasOWIDData: !!OWID_DATASETS[dataset],
        estimatedAvailability: getDatasetAvailability(dataset)
      })
    })
  })

  // Add any WORLD_BANK_INDICATORS not already represented in categories (expansion block)
  Object.keys(WORLD_BANK_INDICATORS).forEach(indicatorId => {
    if (seen.has(indicatorId)) return
    seen.add(indicatorId)
    allDatasets.push({
      id: indicatorId,
      category: 'Expanded Indicators',
      hasWorldBankData: true,
      hasOWIDData: !!OWID_DATASETS[indicatorId],
      estimatedAvailability: getDatasetAvailability(indicatorId)
    })
  })

  // Sort for determinism (alphabetical by id) so seeded shuffles are stable when set changes
  allDatasets.sort((a, b) => a.id.localeCompare(b.id))

  __allDatasetsCache = allDatasets
  __allDatasetsCacheTime = now
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
  if (WORLD_BANK_INDICATORS[datasetId]) return 'high'
  if (OWID_DATASETS[datasetId]) return 'medium'
  if (['land-area','languages-count','timezones-count'].includes(datasetId)) return 'medium'
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