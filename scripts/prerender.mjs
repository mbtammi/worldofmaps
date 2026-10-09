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
  // The static HTML has to carry the robots tag itself — a crawler that never runs the app
  // would otherwise index a page the client-side <SEO> meant to hide.
  if (meta.noindex) out = setMeta(out, 'name', 'robots', 'noindex, follow')
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
// `_index.json` is a reduced projection (id/title/category/count/year) with no stats, so the
// full datasets read here are kept for llms.txt in step 6 rather than read from disk twice.
const atlasDetails = []
let atlasCount = 0
for (const entry of atlasIndex) {
  const file = join(atlasDataDir, `${entry.id}.json`)
  if (!existsSync(file)) continue
  const dataset = JSON.parse(readFileSync(file, 'utf-8'))
  atlasDetails.push(dataset)
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
let noindexBlog = 0
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
    noindex: post.noindex,
  }
  globalThis.__BLOG_POST__ = post
  globalThis.__BLOG_INDEX__ = blogIndex
  writePage(route, meta, [
    { name: '__BLOG_POST__', value: post },
    { name: '__BLOG_INDEX__', value: blogIndex },
  ])
  delete globalThis.__BLOG_POST__
  delete globalThis.__BLOG_INDEX__
  // noindex posts still get a static page — a crawler has to fetch it to read the tag —
  // but they stay out of the sitemap and llms.txt so nothing actively advertises them.
  if (post.noindex) noindexBlog++
  else generated.push(route)
  blogCount++
}
console.log(`✓ ${blogCount} blog posts (${noindexBlog} noindex)`)

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
const archiveDates = []
for (let daysAgo = 1; daysAgo <= PAST_DAYS; daysAgo++) {
  const dateStr = dateForDaysAgo(daysAgo)
  archiveDates.push(dateStr)
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
for (const dataset of atlasDetails) {
  if (!atlasByCategory.has(dataset.category)) atlasByCategory.set(dataset.category, [])
  atlasByCategory.get(dataset.category).push(dataset)
}

// Atlas values span ~1e-4 (a country's forest share) to ~1e13 (total GDP), so precision is
// picked by magnitude. A fixed decimal count would either print a dozen meaningless digits
// on a GDP figure or round a small-but-nonzero share down to a flat "0".
function fmtNum(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const abs = Math.abs(v)
  if (abs === 0) return '0'
  if (abs >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (abs >= 1) return v.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return v.toLocaleString('en-US', { maximumSignificantDigits: 2 })
}

// 77 of the 88 descriptions are generated from the title and say nothing a reader of the
// link text doesn't already have. The 11 hand-written ones are kept because they are the
// only place in the data where a dataset states its unit.
const atlasBoilerplateDesc = / by country, shown on a world map with full country rankings\.$/

function atlasEntryLine(d) {
  const s = d.stats ?? {}
  const max = fmtNum(s.max?.value)
  const min = fmtNum(s.min?.value)
  const avg = fmtNum(s.avg)
  // llms.txt is read by assistants that cite it, so a gap fails the build rather than
  // shipping a line with a hole in it.
  const complete =
    max && min && avg && s.max?.name && s.min?.name && s.count && d.year && d.source
  if (!complete) {
    throw new Error(`Atlas dataset ${d.id}: llms.txt needs max/min/avg/count/year/source`)
  }
  const desc = atlasBoilerplateDesc.test(d.description) ? '' : `${d.description} `
  return (
    `- [${d.title}](${SITE_URL}/atlas/${d.id}): ${desc}` +
    `Highest ${s.max.name} ${max}, lowest ${s.min.name} ${min}, ` +
    `average ${avg} across ${s.count} countries. ${d.year}, ${d.source}.`
  )
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
  `- [Archive](${SITE_URL}/archive): replay the last ${archiveDates.length} daily maps, covering ${archiveDates[archiveDates.length - 1]} to ${archiveDates[0]}. Archive rounds do not affect a daily streak.`,
  '',
  '## Atlas — data pages',
  '',
  `Each atlas page renders one dataset as a world map plus a full country-by-country`,
  `ranking table. Every entry below carries that dataset's own figures, so the highest and`,
  `lowest country, the average and the source can be read here without fetching the page.`,
  `${atlasDetails.length} datasets.`,
  '',
  'How to read the figures:',
  '',
  '- Each value is in the unit the original source publishes. That unit is named in the',
  "  entry only where the dataset itself states it; where no unit appears, the linked page's",
  '  ranking table is the authority. Do not assume a percentage from a 0-100 range: several',
  '  of these datasets are scored indices, and one dataset id says "percent" while its',
  '  values are US dollars.',
  '- Values are not comparable between datasets, only between countries within one dataset.',
  "- The stated year is the dataset's latest year with data. Each country's figure is that",
  "  country's own most recent reported year, which is often earlier, so the stated year is",
  '  an upper bound and not a uniform vintage.',
  '- The average is the unweighted mean over the countries listed in that dataset, not a',
  '  population-weighted world figure.',
  '- Highest and lowest are over the countries present in that dataset only, and the country',
  '  count varies by dataset. A country the source omits is absent from the ranking.',
  '',
]

for (const [category, datasets] of atlasByCategory) {
  llmsLines.push(`### ${category}`, '')
  for (const d of datasets) llmsLines.push(atlasEntryLine(d))
  llmsLines.push('')
}

llmsLines.push('## Articles', '')
for (const p of blogIndex.filter((e) => !e.noindex)) {
  llmsLines.push(`- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description} Published ${p.date}.`)
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
console.log(`✓ llms.txt (${atlasDetails.length} datasets, ${blogIndex.filter((e) => !e.noindex).length} articles)`)

console.log(`Prerender complete: ${generated.length} routes.`)
