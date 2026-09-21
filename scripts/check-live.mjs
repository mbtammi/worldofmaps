// Smoke-tests the deployed site. Everything else in `npm run check` validates the source;
// this validates what search engines and players actually receive.
//
//   npm run check:live                      # production
//   SITE=https://my-preview.vercel.app npm run check:live
//
// Catches the class of problem that only exists after deploy: a canonical pointing at a
// redirect, a page that 404s, a noindex that silently stopped being emitted, a sitemap
// listing URLs that no longer resolve.

const SITE = (process.env.SITE || 'https://www.worldofthemaps.com').replace(/\/$/, '')

const failures = []
const notes = []
const check = (ok, msg) => (ok ? notes.push(`  ok   ${msg}`) : failures.push(`  FAIL ${msg}`))

async function get(url) {
  const res = await fetch(url, { redirect: 'manual' })
  // Follow one hop so we can report both the status and the final body.
  if ([301, 302, 307, 308].includes(res.status)) {
    const to = res.headers.get('location')
    const final = await fetch(new URL(to, url))
    return { status: res.status, redirectedTo: to, finalStatus: final.status, body: await final.text() }
  }
  return { status: res.status, redirectedTo: null, finalStatus: res.status, body: await res.text() }
}

const tag = (html, re) => (html.match(re) || [])[1] || null

console.log(`Checking ${SITE}\n`)

// 1) Core routes must serve directly, without a redirect hop. A redirect here means the
//    canonical host and the serving host disagree.
const ROUTES = ['/', '/year-mode', '/play', '/atlas', '/blog', '/archive', '/how-to-play', '/for-teachers']
for (const route of ROUTES) {
  const r = await get(SITE + route)
  check(r.status === 200, `${route} serves 200 directly${r.redirectedTo ? ` (got ${r.status} -> ${r.redirectedTo})` : ''}`)
}

// 2) Canonical must point at the host that actually served the page, and resolve without
//    redirecting. This is the bug that prompted the check.
for (const route of ['/', '/atlas/gdp-growth', '/blog/does-money-buy-happiness']) {
  const r = await get(SITE + route)
  const canonical = tag(r.body, /<link rel="canonical" href="([^"]+)"/)
  check(!!canonical, `${route} has a canonical tag`)
  if (canonical) {
    check(
      canonical.startsWith(SITE),
      `${route} canonical is on the serving host (${canonical})`,
    )
    const c = await get(canonical)
    check(c.status === 200, `${route} canonical resolves without a redirect (${c.status})`)
  }
}

// 3) The generated ranking posts duplicate their atlas page, so they must stay noindex and
//    stay out of the sitemap. The hand-written articles must stay indexable.
const listicle = await get(`${SITE}/blog/highest-internet-users`)
check(
  /<meta name="robots" content="noindex/.test(listicle.body),
  'generated listicle still carries noindex',
)
const article = await get(`${SITE}/blog/does-money-buy-happiness`)
check(
  !/<meta name="robots" content="noindex/.test(article.body),
  'hand-written article is NOT noindexed',
)

// 4) Sitemap: present, on the right host, no noindexed URLs, and its entries resolve.
const sitemap = await get(`${SITE}/sitemap.xml`)
const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
check(locs.length > 100, `sitemap lists ${locs.length} urls`)
check(!locs.some((u) => u.includes('/blog/highest-')), 'no noindexed listicles in the sitemap')
check(locs.every((u) => u.startsWith(SITE)), 'every sitemap url is on the serving host')

// Spot-check a spread of sitemap entries rather than all 137.
const sample = [locs[0], locs[Math.floor(locs.length / 2)], locs[locs.length - 1]].filter(Boolean)
for (const u of sample) {
  const r = await get(u)
  check(r.status === 200, `sitemap entry serves 200 directly: ${u.replace(SITE, '')}`)
}

// 5) robots.txt must advertise the sitemap on the serving host.
const robots = await get(`${SITE}/robots.txt`)
check(robots.body.includes(`Sitemap: ${SITE}/sitemap.xml`), 'robots.txt points at the right sitemap')

// 6) llms.txt is how AI assistants read the site; copilot.microsoft.com already refers traffic.
const llms = await get(`${SITE}/llms.txt`)
check(llms.status === 200, 'llms.txt is served')
check(!llms.body.includes('/blog/highest-'), 'llms.txt excludes the noindexed listicles')

// 7) The OG image backs every share and social unfurl.
const og = await get(`${SITE}/og-image.png`)
check(og.status === 200, 'og-image.png resolves')

// 8) The daily game depends on these at runtime; a missing one is a blank globe.
for (const asset of ['/countries-110m.json', '/data/atlas/_index.json', '/data/year/internet-users.json']) {
  const r = await get(SITE + asset)
  check(r.status === 200, `runtime asset present: ${asset}`)
}

console.log(notes.join('\n'))
if (failures.length) {
  console.error(`\n${failures.length} live check(s) failed:\n${failures.join('\n')}`)
  process.exit(1)
}
console.log(`\nAll ${notes.length} live checks passed.`)

// 9) Global stats need Upstash. Without UPSTASH_REDIS_REST_URL / _TOKEN the API silently
//    falls back to a per-lambda buffer that empties on every cold start and is not shared
//    between the function that writes results and the one that reads them - so every day
//    reports zero, which is indistinguishable from "nobody has played". Fail loudly instead.
const stats = await get(`${SITE}/api/dailyStats?dayIndex=1`)
let storage = null
try { storage = JSON.parse(stats.body).storage } catch { /* reported below */ }
check(
  storage === 'redis',
  `global stats are backed by Redis (reported: ${storage ?? 'unparseable'})` +
    (storage === 'memory' ? ' - set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel' : ''),
)
