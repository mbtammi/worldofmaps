// Build-time prerender: renders static content routes + all /atlas pages to crawler-visible
// HTML, injects per-route <head> and (for atlas) the snapshot data so client hydration matches,
// and regenerates sitemap.xml.
//
//   dist/index.html (template) + rendered app HTML + <head> [+ inline data] -> dist/<route>/index.html
//
// The game routes ('/', '/play') stay client-rendered (not prerendered).

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from '../dist-ssr/entry-server.js'
import { ROUTE_META, PRERENDER_ROUTES, SITE_URL } from '../src/seo/routeMeta.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const atlasDataDir = join(__dirname, '..', 'public', 'data', 'atlas')
const template = readFileSync(join(distDir, 'index.html'), 'utf-8')

if (!template.includes('<div id="root"></div>')) {
  throw new Error('Template missing <div id="root"></div> — cannot inject prerendered HTML')
}

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function setMeta(html, attr, key, value) {
  const re = new RegExp(
    `(<meta\\s+${attr}=["']${key}["'][^>]*\\scontent=["'])[\\s\\S]*?(["'][^>]*>)`,
    'i',
  )
  if (re.test(html)) return html.replace(re, `$1${esc(value)}$2`)
  return html.replace('</head>', `  <meta ${attr}="${key}" content="${esc(value)}" />\n  </head>`)
}

function applyHead(html, meta) {
  const url = `${SITE_URL}${meta.path === '/' ? '/' : meta.path}`
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
  out = setMeta(out, 'name', 'description', meta.description)
  if (meta.keywords?.length) out = setMeta(out, 'name', 'keywords', meta.keywords.join(', '))
  out = setMeta(out, 'property', 'og:title', meta.title)
  out = setMeta(out, 'property', 'og:description', meta.description)
  out = setMeta(out, 'property', 'og:url', url)
  out = setMeta(out, 'property', 'twitter:title', meta.title)
  out = setMeta(out, 'property', 'twitter:description', meta.description)
  out = setMeta(out, 'property', 'twitter:url', url)

  const canonRe = /(<link\s+rel=["']canonical["']\s+href=["'])[\s\S]*?(["'][^>]*>)/i
  if (canonRe.test(out)) out = out.replace(canonRe, `$1${url}$2`)
  else out = out.replace('</head>', `  <link rel="canonical" href="${url}" />\n  </head>`)
  return out
}

// Inline data set on window before the (deferred) app module runs, so the client's first
// render matches the server-rendered HTML. `<` is escaped to avoid breaking out of the script.
function injectData(html, dataScripts) {
  if (!dataScripts.length) return html
  const tags = dataScripts
    .map(
      (s) =>
        `  <script>window.${s.name}=${JSON.stringify(s.value).replace(/</g, '\\u003c')}</script>`,
    )
    .join('\n')
  return html.replace('</head>', `${tags}\n  </head>`)
}

function writePage(route, meta, dataScripts = []) {
  const appHtml = render(route)
  let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  html = applyHead(html, meta)
  html = injectData(html, dataScripts)
  const rel = route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`
  const outPath = join(distDir, rel)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html)
  return appHtml.length
}

// Load atlas + blog snapshots.
const atlasDataDirIndex = join(atlasDataDir, '_index.json')
const blogDataDir = join(__dirname, '..', 'public', 'data', 'blog')
const blogDataDirIndex = join(blogDataDir, '_index.json')

let atlasIndex = []
if (existsSync(atlasDataDirIndex)) atlasIndex = JSON.parse(readFileSync(atlasDataDirIndex, 'utf-8'))

let blogIndex = []
if (existsSync(blogDataDirIndex)) blogIndex = JSON.parse(readFileSync(blogDataDirIndex, 'utf-8'))

const generated = []

// 1) Static content routes.
for (const route of PRERENDER_ROUTES) {
  const meta = ROUTE_META[route]
  if (!meta) {
    console.warn(`⚠️  No ROUTE_META for ${route} — skipping`)
    continue
  }
  let dataScripts = []
  if (route === '/atlas') {
    globalThis.__ATLAS_INDEX__ = atlasIndex
    dataScripts = [{ name: '__ATLAS_INDEX__', value: atlasIndex }]
  } else if (route === '/blog') {
    globalThis.__BLOG_INDEX__ = blogIndex
    dataScripts = [{ name: '__BLOG_INDEX__', value: blogIndex }]
  }
  const chars = writePage(route, meta, dataScripts)
  delete globalThis.__ATLAS_INDEX__
  delete globalThis.__BLOG_INDEX__
  generated.push(route)
  console.log(`✓ ${route} (${chars} chars)`)
}

// 2) One page per atlas dataset.
let atlasCount = 0
for (const entry of atlasIndex) {
  const file = join(atlasDataDir, `${entry.id}.json`)
  if (!existsSync(file)) continue
  const dataset = JSON.parse(readFileSync(file, 'utf-8'))
  const route = `/atlas/${dataset.id}`
  const meta = {
    path: route,
    title: `${dataset.title} by Country — Map & Country Rankings | World of Maps`,
    description: `${dataset.description} World map and full country rankings for ${dataset.stats.count} countries (${dataset.year}). Highest: ${dataset.stats.max.name}; lowest: ${dataset.stats.min.name}.`,
    keywords: [dataset.title, `${dataset.title} by country`, 'world map', 'country rankings'],
  }
  globalThis.__ATLAS_DATA__ = dataset
  globalThis.__ATLAS_INDEX__ = atlasIndex
  writePage(route, meta, [
    { name: '__ATLAS_DATA__', value: dataset },
    { name: '__ATLAS_INDEX__', value: atlasIndex },
  ])
  delete globalThis.__ATLAS_DATA__
  delete globalThis.__ATLAS_INDEX__
  generated.push(route)
  atlasCount++
}
console.log(`✓ ${atlasCount} atlas detail pages`)

// 3) One page per blog post.
let blogCount = 0
for (const entry of blogIndex) {
  const file = join(blogDataDir, `${entry.slug}.json`)
  if (!existsSync(file)) continue
  const post = JSON.parse(readFileSync(file, 'utf-8'))
  const route = `/blog/${post.slug}`
  const meta = {
    path: route,
    title: `${post.title} | World of Maps`,
    description: post.description,
    keywords: post.tags,
  }
  globalThis.__BLOG_POST__ = post
  globalThis.__BLOG_INDEX__ = blogIndex
  writePage(route, meta, [
    { name: '__BLOG_POST__', value: post },
    { name: '__BLOG_INDEX__', value: blogIndex },
  ])
  delete globalThis.__BLOG_POST__
  delete globalThis.__BLOG_INDEX__
  generated.push(route)
  blogCount++
}
console.log(`✓ ${blogCount} blog posts`)

// 4) Past-day archive pages — last 30 days at /daily/:date.
// Each is statically rendered with a unique title/description so search engines have a
// distinct page per date. The body is just the Suspense fallback (the actual game lazy-loads
// on the client), which is fine for SEO since the head + visible date is the unique signal.
const PAST_DAYS = 30
const ARCHIVE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const formatLongDate = (yyyyMmDd) => {
  const parts = yyyyMmDd.split('-')
  return `${ARCHIVE_MONTHS[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}, ${parts[0]}`
}
const dateForDaysAgo = (daysAgo) => {
  const d = new Date(Date.now() - daysAgo * 86400000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

let pastCount = 0
for (let daysAgo = 1; daysAgo <= PAST_DAYS; daysAgo++) {
  const dateStr = dateForDaysAgo(daysAgo)
  const route = `/daily/${dateStr}`
  const longDate = formatLongDate(dateStr)
  const meta = {
    path: route,
    title: `Daily Map · ${longDate} | World of Maps`,
    description: `Replay the World of Maps daily map challenge from ${longDate}. Archive plays don't affect your daily streak — guess the global dataset behind the map.`,
    keywords: ['daily map', 'archive challenge', 'world of maps', longDate.toLowerCase()],
  }
  writePage(route, meta)
  generated.push(route)
  pastCount++
}
console.log(`✓ ${pastCount} past-day archive pages`)

// 5) Sitemap: game routes (CSR but indexable) + everything prerendered.
const today = new Date().toISOString().slice(0, 10)
const urls = [...new Set(['/', '/play', ...generated])]
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map((u) => {
      const loc = `${SITE_URL}${u === '/' ? '/' : u}`
      const priority =
        u === '/'
          ? '1.0'
          : u.startsWith('/daily/')
            ? '0.5'
            : u.startsWith('/atlas/') || u.startsWith('/blog/')
              ? '0.7'
              : '0.8'
      const changefreq = u === '/' ? 'daily' : 'weekly'
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    })
    .join('\n') +
  '\n</urlset>\n'
writeFileSync(join(distDir, 'sitemap.xml'), xml)
console.log(`✓ sitemap.xml (${urls.length} urls)`)

// 6) llms.txt — a plain-text map of the site for AI assistants, per the llmstxt.org
// convention. Sitemaps give crawlers URLs; this gives models the context to answer
// "what is this site" and to pick the right page to cite. Generated from the same
// snapshots as the pages themselves so it can't drift.
const atlasByCategory = new Map()
for (const entry of atlasIndex) {
  if (!atlasByCategory.has(entry.category)) atlasByCategory.set(entry.category, [])
  atlasByCategory.get(entry.category).push(entry)
}

const llmsLines = [
  '# World of Maps',
  '',
  '> A free daily world map game. Each day a real global dataset (GDP per capita,',
  '> population density, life expectancy, forest cover, internet use and ~85 more) is',
  '> shaded onto an interactive 3D globe with the legend hidden, and the player guesses',
  '> which dataset it is from 10 options. Think GeoGuessr meets Wordle, for world data.',
  '',
  'All content is free, requires no account, and is published in English.',
  'Every dataset comes from a named public source (World Bank, UN, WHO, FAO and',
  'similar) with the source and year stated on the page.',
  '',
  '## Play',
  '',
  `- [Today's daily map](${SITE_URL}/): the main game — one new map every day, shared globally.`,
  `- [How to play](${SITE_URL}/how-to-play): rules, scoring, and how to read a choropleth map.`,
  `- [Free play](${SITE_URL}/play): unlimited practice rounds, no daily limit.`,
  `- [Year mode](${SITE_URL}/year-mode): guess the year a dataset snapshot is from.`,
  `- [Archive](${SITE_URL}/archive): replay the last 30 daily maps.`,
  '',
  '## Atlas — data pages',
  '',
  `Each atlas page renders one dataset as a world map plus a full country-by-country`,
  `ranking table, with the source, year and country count stated. ${atlasIndex.length} datasets:`,
  '',
]

for (const [category, entries] of atlasByCategory) {
  llmsLines.push(`### ${category}`, '')
  for (const e of entries) {
    llmsLines.push(`- [${e.title}](${SITE_URL}/atlas/${e.id}): ${e.title} by country, ${e.count} countries, ${e.year}.`)
  }
  llmsLines.push('')
}

llmsLines.push('## Articles', '')
for (const p of blogIndex) {
  llmsLines.push(`- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`)
}

llmsLines.push(
  '',
  '## About',
  '',
  `- [About](${SITE_URL}/about): what the project is, and where the data comes from.`,
  `- [For teachers](${SITE_URL}/for-teachers): classroom use, lesson ideas, curriculum fit.`,
  '',
)

writeFileSync(join(distDir, 'llms.txt'), llmsLines.join('\n'))
console.log(`✓ llms.txt (${atlasIndex.length} datasets, ${blogIndex.length} articles)`)

console.log(`Prerender complete: ${generated.length} routes.`)
