// Bakes iso_a3 into public/countries-110m.json so the globe can match datasets by ISO code.
// The upstream world-atlas topology only ships { name } + a numeric ISO 3166-1 id, so the
// globe used to match on lowercased country names — which silently failed for 45 of 177
// countries (USA, Russia, Iran, Vietnam, Egypt, both Koreas...) and for year-mode entirely,
// since year snapshots carry no names at all.
//
// Idempotent: rerun after refreshing the topology from upstream.
import fs from 'node:fs'

const TOPO = 'public/countries-110m.json'
const REFERENCE_ATLAS = 'public/data/atlas/internet-users.json'

// Natural Earth short names that don't match World Bank names, keyed by ISO 3166-1 numeric id.
// Keyed by id rather than name so upstream label tweaks don't reintroduce the gap.
const ISO3_BY_NUMERIC = {
  '010': 'ATA', '044': 'BHS', '070': 'BIH', '090': 'SLB', '096': 'BRN',
  '104': 'MMR', '140': 'CAF', '158': 'TWN', '178': 'COG', '180': 'COD',
  '214': 'DOM', '226': 'GNQ', '232': 'ERI', '238': 'FLK', '260': 'ATF',
  '270': 'GMB', '275': 'PSE', '304': 'GRL', '364': 'IRN', '384': 'CIV',
  '408': 'PRK', '410': 'KOR', '417': 'KGZ', '418': 'LAO', '540': 'NCL',
  '548': 'VUT', '630': 'PRI', '643': 'RUS', '703': 'SVK', '704': 'VNM',
  '706': 'SOM', '728': 'SSD', '729': 'SDN', '732': 'ESH', '760': 'SYR',
  '792': 'TUR', '795': 'TKM', '807': 'MKD', '818': 'EGY', '840': 'USA',
  '862': 'VEN', '887': 'YEM',
}

// Disputed territories with no ISO 3166-1 numeric id in the topology.
const ISO3_BY_NAME = { 'Kosovo': 'XKX', 'N. Cyprus': 'CYP', 'Somaliland': 'SOM' }

const topo = JSON.parse(fs.readFileSync(TOPO, 'utf8'))
const atlas = JSON.parse(fs.readFileSync(REFERENCE_ATLAS, 'utf8'))
const iso3ByName = Object.fromEntries(atlas.data.map(r => [r.name.toLowerCase(), r.iso_a3]))

const unmatched = []
for (const g of topo.objects.countries.geometries) {
  const name = g.properties.name
  const iso3 = ISO3_BY_NUMERIC[g.id] || iso3ByName[name.toLowerCase()] || ISO3_BY_NAME[name]
  if (iso3) g.properties.iso_a3 = iso3
  else unmatched.push(name)
}

fs.writeFileSync(TOPO, JSON.stringify(topo))
const total = topo.objects.countries.geometries.length
console.log(`Annotated ${total - unmatched.length}/${total} countries with iso_a3`)
if (unmatched.length) console.log('Unmatched:', unmatched.join(', '))
