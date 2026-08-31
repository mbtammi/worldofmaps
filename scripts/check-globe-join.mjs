// Guards the globe's dataset->polygon join. Both game modes match on iso_a3, so a topology
// refresh that drops the annotation (or a snapshot schema change) must fail loudly here
// rather than silently painting the world gray.
import fs from 'node:fs'
import assert from 'node:assert'

const topo = JSON.parse(fs.readFileSync('public/countries-110m.json', 'utf8'))
const polygons = topo.objects.countries.geometries
const isoOnGlobe = new Set(polygons.map(g => g.properties.iso_a3).filter(Boolean))
assert(isoOnGlobe.size > 170, `topology missing iso_a3 — run: node scripts/annotate-topojson.mjs`)

function coverage(rows) {
  const keys = new Set(rows.map(r => r.iso_a3))
  return [...isoOnGlobe].filter(i => keys.has(i)).length / isoOnGlobe.size
}

const atlas = JSON.parse(fs.readFileSync('public/data/atlas/internet-users.json', 'utf8'))
const dailyCoverage = coverage(atlas.data)
console.log(`daily  : ${(dailyCoverage * 100).toFixed(0)}% of polygons get a value`)
assert(dailyCoverage > 0.85, 'daily-game join regressed')

const year = JSON.parse(fs.readFileSync('public/data/year/internet-users.json', 'utf8'))
const yearCoverage = coverage(year.years[year.endYear])
console.log(`year   : ${(yearCoverage * 100).toFixed(0)}% of polygons get a value`)
assert(yearCoverage > 0.85, 'year-mode join regressed')

console.log('globe join OK')
