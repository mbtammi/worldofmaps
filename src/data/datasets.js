// Dataset Management System
// Updated to use dynamic data fetching with fallback to static data

import { getTodaysDataset as getDynamicTodaysDataset } from './dailyChallenge.js'
import { fetchDataset } from './dataFetcher.js'
import populationDensityDataset from './populationDensity.js'

// Legacy static datasets (kept as fallbacks)
const STATIC_DATASETS = {
  'population-density': populationDensityDataset,
}

// Get today's dataset (dynamic system with fallback)
export const getDailyDataset = async () => {
  try {
    // Dev log removed to prevent revealing daily challenge in production
    return await getDynamicTodaysDataset()
  } catch (error) {
    console.error('Dynamic dataset fetch failed, using static fallback:', error)
    
    // Fallback to static dataset
    const today = new Date()
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
    const staticDatasetIds = Object.keys(STATIC_DATASETS)
    const selectedId = staticDatasetIds[dayOfYear % staticDatasetIds.length]
    
    return STATIC_DATASETS[selectedId]
  }
}

// Get dataset by type (with dynamic fetching)
export const getDatasetByType = async (datasetType) => {
  try {
    // Dev log removed to prevent revealing dataset type in production
    return await fetchDataset(datasetType)
  } catch (error) {
    console.error(`Failed to fetch dynamic dataset ${datasetType}, using static fallback:`, error)
    
    // Fallback to static data if available
    if (STATIC_DATASETS[datasetType]) {
      return STATIC_DATASETS[datasetType]
    }
    
    // If no static fallback, throw error
    throw new Error(`Dataset ${datasetType} not available`)
  }
}

// Get all available dataset types
export const getAvailableDatasetTypes = () => {
  // This would eventually query the dynamic system
  // For now, return static types plus some dynamic ones
  return [
    'population-density',
    'land-area',
    'languages-count',
    'timezones-count',
    'gdp-per-capita',
    'life-expectancy',
    'co2-emissions',
    'internet-users',
    'literacy-rate',
    'unemployment-rate',
    'forest-coverage',
    'renewable-energy',
    'urban-population'
  ]
}

// Data validation helper
export const validateDataset = (dataset) => {
  const requiredFields = ['id', 'title', 'description', 'correctAnswers', 'options', 'funFact', 'data']
  
  for (const field of requiredFields) {
    if (!dataset[field]) {
      console.error(`Dataset missing required field: ${field}`)
      return false
    }
  }
  
  // Validate data format
  if (!Array.isArray(dataset.data) || dataset.data.length === 0) {
    console.error('Dataset data must be a non-empty array')
    return false
  }
  
  // Validate data entries
  const dataFieldsRequired = ['iso_a2', 'iso_a3', 'name', 'value']
  for (const entry of dataset.data.slice(0, 5)) { // Check first 5 entries
    for (const field of dataFieldsRequired) {
      if (entry[field] === undefined || entry[field] === null) {
        console.warn(`Data entry missing field ${field}:`, entry)
      }
    }
  }
  
  return true
}

// Get all available dataset types for admin/testing
export const getAllDatasetTypes = () => {
  return getAvailableDatasetTypes().map(id => ({
    id,
    title: id.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    description: `Dynamic dataset for ${id}`
  }))
}

export default {
  getDailyDataset,
  getDatasetByType,
  getAvailableDatasetTypes,
  validateDataset,
  getAllDatasetTypes
}