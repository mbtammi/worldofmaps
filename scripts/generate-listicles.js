// Programmatic blog generator (no AI): turns atlas snapshots into editorial "ranking" posts.
//
//   node scripts/generate-listicles.js
//
// Distinct from the /atlas reference tables: curated top-10 + bottom-3 highlights, a computed
// insight, and links back to the full map. Output: content/blog/<slug>.md (committed, reviewable).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ATLAS_DIR = join(__dirname, '..', 'public', 'data', 'atlas')
const OUT_DIR = join(__dirname, '..', 'content', 'blog')
mkdirSync(OUT_DIR, { recursive: true })

const TODAY = new Date().toISOString().slice(0, 10)

// Curated datasets worth an editorial ranking post, with a tag and a "unit" hint for prose.
// `unit` reads as a full phrase ("measured in ..."); `suffix` is what attaches to a bare
// number in running text; `noun` is a noun phrase that survives being dropped mid-sentence
// (the dataset title does not — "how unevenly internet users is distributed").
const POSTS = [
  { id: 'gdp-per-capita', tag: 'economy', unit: 'US dollars per person', suffix: '', noun: 'income' },
  { id: 'life-expectancy', tag: 'health', unit: 'years', suffix: ' years', noun: 'life expectancy' },
  { id: 'population-density', tag: 'demographics', unit: 'people per km²', suffix: '/km²', noun: 'population density' },
  { id: 'internet-users', tag: 'technology', unit: '% of population', suffix: '%', noun: 'internet access' },
  { id: 'forest-coverage', tag: 'environment', unit: '% of land area', suffix: '%', noun: 'forest cover' },
  { id: 'renewable-energy', tag: 'environment', unit: '% of energy use', suffix: '%', noun: 'renewable energy use' },
  { id: 'fertility-rate', tag: 'demographics', unit: 'births per woman', suffix: '', noun: 'fertility' },
  { id: 'healthcare-expenditure', tag: 'health', unit: '% of GDP', suffix: '%', noun: 'health spending' },
  { id: 'urban-population', tag: 'demographics', unit: '% of population', suffix: '%', noun: 'urbanisation' },
  { id: 'population-total', tag: 'demographics', unit: 'people', suffix: '', noun: 'population' },
]

function fmt(v) {
  const a = Math.abs(v)
  if (a >= 1000) return Math.round(v).toLocaleString('en-US')
  if (a >= 1) return v.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function buildPost(meta) {
  const file = join(ATLAS_DIR, `${meta.id}.json`)
  if (!existsSync(file)) {
    console.warn(`  ✗ ${meta.id}: no snapshot — skipping`)
    return false
  }
  const d = JSON.parse(readFileSync(file, 'utf-8'))
  const rows = d.data
  const top = rows[0]
  const bottom = rows[rows.length - 1]
  const median = rows[Math.floor(rows.length / 2)].value
  const aboveAvg = rows.filter((r) => r.value > d.stats.avg).length
  const ratio = bottom.value ? top.value / bottom.value : null

  const title = `The 10 Countries with the Highest ${d.title} (${d.year})`
  const slug = `highest-${meta.id}`
  const description = `Which countries lead the world in ${d.title.toLowerCase()}? See the top 10 (and the bottom of the table) for ${d.year}, measured in ${meta.unit}.`

  const lines = []
  lines.push('---')
  lines.push(`title: "${title}"`)
  lines.push(`description: "${description}"`)
  lines.push(`slug: "${slug}"`)
  lines.push(`date: "${TODAY}"`)
  lines.push(`tags: [${meta.tag}, rankings]`)
  lines.push(`datasets: [${meta.id}]`)
  // Duplicates /atlas/<id>, which shows the same ranking plus the full table and JSON-LD.
  // Kept for readers, dropped from the sitemap so the two don't compete.
  lines.push('noindex: true')
  lines.push('---')
  lines.push('')
  lines.push(
    `${d.funFact} Across ${d.stats.count} countries with ${d.year} data, **${top.name}** tops the table for ${d.title.toLowerCase()} at ${fmt(top.value)}${meta.suffix}, while **${bottom.name}** sits at the bottom on ${fmt(bottom.value)}${meta.suffix}.`,
  )
  lines.push('')
  lines.push('## The top 10')
  lines.push('')
  rows.slice(0, 10).forEach((r, i) => {
    lines.push(`${i + 1}. **${r.name}** — ${fmt(r.value)}${meta.suffix}`)
  })
  lines.push('')
  lines.push('## At the other end of the table')
  lines.push('')
  rows
    .slice(-3)
    .reverse()
    .forEach((r) => {
      lines.push(`- **${r.name}** — ${fmt(r.value)}${meta.suffix}`)
    })
  lines.push('')
  lines.push('## What the numbers show')
  lines.push('')
  const insights = [
    `The global average sits at about ${fmt(d.stats.avg)}${meta.suffix}, with ${aboveAvg} of ${d.stats.count} countries above it and a median of ${fmt(median)}${meta.suffix}.`,
  ]
  if (ratio && ratio > 1.5) {
    insights.push(
      `${top.name} reports roughly ${fmt(ratio)}× the figure of ${bottom.name} — a reminder of how unevenly ${meta.noun} is spread.`,
    )
  }
  lines.push(insights.join(' '))
  lines.push('')
  lines.push(
    `Explore the complete, sortable ranking on the [${d.title} by country map](/atlas/${meta.id}), or test your instincts in the [daily map-guessing game](/). Data: ${d.source}, ${d.year}.`,
  )
  lines.push('')

  writeFileSync(join(OUT_DIR, `${slug}.md`), lines.join('\n'))
  console.log(`  ✓ ${slug}`)
  return true
}

let n = 0
for (const meta of POSTS) if (buildPost(meta)) n++
console.log(`\nGenerated ${n} listicle post(s) -> content/blog/`)
