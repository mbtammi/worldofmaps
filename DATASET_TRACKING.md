# Dataset Tracking & Rotation System

## Overview
The daily challenge uses **57 unique datasets** that rotate without duplicates for 57 days.

## How It Works

### Rotation Algorithm
1. **Pool Size**: 57 datasets (55 World Bank + 2 OWID)
2. **Cycle System**: Every 57 days starts a new cycle
3. **Seeded Shuffle**: Each cycle gets a different deterministic shuffle
4. **No Duplicates**: Guaranteed unique datasets within each 57-day period

### Tracking Past Datasets

To see which datasets have been used, you can run these commands in the browser console:

```javascript
// Get rotation statistics
import { getRotationStats } from './src/data/dailyChallenge.js'
const stats = getRotationStats()
console.log(stats)

// See dataset history for last 30 days
import { getDatasetHistory, getCurrentDayIndex } from './src/data/dailyChallenge.js'
const today = getCurrentDayIndex()
const history = getDatasetHistory(today - 30, today)
console.log(history)

// Preview next 7 days
import { getUpcomingDatasets } from './src/data/dailyChallenge.js'
const upcoming = getUpcomingDatasets(7)
console.log(upcoming)
```

## Available Datasets (57 Total)

### Demographics & Population (11 datasets)
- population-density
- population-total
- population-growth
- urban-population
- population-ages-65
- population-ages-0-14
- life-expectancy
- birth-rate
- death-rate
- fertility-rate
- infant-mortality

### Economy (14 datasets)
- gdp-per-capita
- gdp-total
- gdp-growth
- gni-per-capita
- unemployment-rate
- inflation-rate
- exports-goods-services
- imports-goods-services
- foreign-investment
- government-expenditure
- tax-revenue
- gross-savings
- manufacturing-value
- agriculture-value

### Health (8 datasets)
- healthcare-expenditure
- hospital-beds
- physicians-density
- nurses-midwives
- immunization-dpt
- immunization-measles
- maternal-mortality
- tuberculosis-incidence

### Education (5 datasets)
- literacy-rate
- literacy-rate-youth
- education-expenditure
- secondary-enrollment
- tertiary-enrollment

### Technology & Infrastructure (11 datasets)
- internet-users
- mobile-subscriptions
- fixed-broadband
- telephone-lines
- electricity-access
- electricity-consumption
- water-access
- sanitation-access
- roads-paved
- rail-lines
- air-passengers

### Energy & Environment (6 datasets)
- forest-coverage
- energy-consumption
- renewable-energy
- methane-emissions
- energy-imports
- fossil-fuel-consumption

### Culture (2 datasets)
- coffee-consumption
- alcohol-consumption

## Rotation Guarantee

✅ **First 57 days**: All 57 datasets appear exactly once (no duplicates)  
✅ **Day 58+**: New cycle begins with different shuffle  
✅ **Deterministic**: Same day always shows same dataset for all users  
✅ **Trackable**: You can always lookup which dataset was shown on any date

## Adding New Datasets

When you add new datasets to World Bank indicators:

1. Add the dataset ID to `WORLD_BANK_INDICATORS` in `dataSources.js`
2. Add it to the `highAvailability` array in `getDatasetAvailability()`
3. The pool size will automatically increase
4. Test with the rotation test script

## Development Commands

### Test rotation system
```bash
node /tmp/test_rotation.js
```

### Count available datasets
```bash
node -e "
const datasets = ['population-density', /* ... all 57 ... */];
console.log('Total datasets:', datasets.length);
"
```

### Preview specific date
```javascript
import { getDatasetByDate } from './src/data/dailyChallenge.js'
const dataset = await getDatasetByDate('2025-10-15')
console.log(dataset)
```

## Important Notes

- **No manual tracking needed**: The system is fully deterministic
- **Same dataset per day globally**: All users see the same challenge
- **Cycle-based shuffling**: Each 57-day cycle gets a new random order
- **Fallback system**: 7 curated datasets if all APIs fail
- **Cache duration**: 30 days for API responses

## Future Expansion

When adding more datasets (e.g., 100+):
- The pool size increases automatically
- No code changes needed to rotation logic
- Longer guaranteed unique period (100 days for 100 datasets)
- Same deterministic behavior maintained
