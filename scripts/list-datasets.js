#!/usr/bin/env node
// Dataset Listing & Diagnostics Script
// Usage:
//   node scripts/list-datasets.js [--sample N] [--json] [--search term]
// Options:
//   --sample N    Fetch & inspect first N datasets' data coverage (skips large fetches otherwise)
//   --json        Output machine-readable JSON summary (no styling)
//   --search term Filter dataset IDs containing term (case-insensitive)
//
// This script relies on data source registry & indicator mappings in src/data/dataSources.js
// It does NOT invoke network calls unless --sample is provided.

import path from 'path'
import { fileURLToPath } from 'url'
import { getAllAvailableDatasets, DATASET_CATEGORIES } from '../src/data/dataSources.js'
import { fetchDataset } from '../src/data/dataFetcher.js'

const args = process.argv.slice(2)
const argMap = {}
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a.startsWith('--')) {
    const key = a.replace(/^--/, '')
    const next = args[i+1]
    if (next && !next.startsWith('--')) {
      argMap[key] = next
      i++
    } else {
      argMap[key] = true
    }
  }
}

const sampleCount = argMap.sample ? parseInt(argMap.sample, 10) : 0
const outputJson = !!argMap.json
const searchTerm = argMap.search ? String(argMap.search).toLowerCase() : null

function human(n) {
  if (n === 0) return '0'
  const units = ['','K','M','B']
  let idx = 0
  let val = n
  while (val >= 1000 && idx < units.length - 1) { val /= 1000; idx++ }
  return (val % 1 === 0 ? val : val.toFixed(1)) + units[idx]
}

function pad(str, len) { return (str + ' '.repeat(len)).slice(0, len) }

async function main() {
  const all = getAllAvailableDatasets()
  const filtered = searchTerm ? all.filter(d => d.id.toLowerCase().includes(searchTerm)) : all

  // Category counts (including synthetic 'Expanded Indicators')
  const categoryCounts = {}
  filtered.forEach(d => {
    categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1
  })

  // Availability distribution
  const availabilityCounts = {}
  filtered.forEach(d => {
    availabilityCounts[d.estimatedAvailability] = (availabilityCounts[d.estimatedAvailability] || 0) + 1
  })

  // Longest IDs
  const longest = [...filtered]
    .sort((a,b) => b.id.length - a.id.length)
    .slice(0, 10)

  // Optional sampling & coverage stats
  const sampledDetails = []
  if (sampleCount > 0) {
    const sampleTargets = filtered.slice(0, sampleCount)
    for (const ds of sampleTargets) {
      try {
        const fetched = await fetchDataset(ds.id)
        const values = fetched.data.map(r => r.value).filter(v => v !== null && v !== undefined)
        const coverage = fetched.data.length ? (values.length / fetched.data.length) : 0
        sampledDetails.push({
          id: ds.id,
          title: fetched.title,
          points: fetched.data.length,
          nonNull: values.length,
          coverage: +(coverage * 100).toFixed(1)
        })
      } catch (e) {
        sampledDetails.push({ id: ds.id, error: e.message })
      }
    }
  }

  if (outputJson) {
    console.log(JSON.stringify({
      totalDatasets: filtered.length,
      categoryCounts,
      availabilityCounts,
      longestIds: longest.map(d => d.id),
      sampled: sampledDetails
    }, null, 2))
    return
  }

  console.log('\n=== WorldOfMaps Dataset Inventory ===')
  console.log(`Total datasets${searchTerm ? ' (filtered)' : ''}: ${filtered.length}`)
  if (searchTerm) console.log(`Search term: "${searchTerm}"`)

  console.log('\nBy Category:')
  Object.entries(categoryCounts)
    .sort((a,b)=> a[0].localeCompare(b[0]))
    .forEach(([cat,count]) => {
      console.log(`  ${pad(cat,32)} ${count}`)
    })

  console.log('\nAvailability Levels:')
  Object.entries(availabilityCounts)
    .sort((a,b)=> a[0].localeCompare(b[0]))
    .forEach(([lvl,count]) => {
      console.log(`  ${pad(lvl,12)} ${count}`)
    })

  console.log('\nTop 10 Longest IDs:')
  longest.forEach(d => console.log(`  ${d.id} (${d.id.length})`))

  if (sampleCount > 0) {
    console.log(`\nSample Coverage (first ${sampleCount} datasets):`)
    sampledDetails.forEach(s => {
      if (s.error) {
        console.log(`  ${pad(s.id,40)} ERROR: ${s.error}`)
      } else {
        console.log(`  ${pad(s.id,40)} points=${pad(String(s.points),6)} nonNull=${pad(String(s.nonNull),6)} coverage=${pad(String(s.coverage)+'%',7)}`)
      }
    })
  }

  console.log('\nTip: run with --sample 5 to examine data coverage, or --json for machine output.')
  console.log('Done.\n')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
