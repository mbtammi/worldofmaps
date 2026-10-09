// The prerendered content pages — the atlas and blog pages search traffic lands on — must
// not pull in the 1.7MB three.js/globe chunk. They have no globe on them.
//
// This regressed silently once: vite.config.js used the array form of manualChunks, which
// only matched React's CJS factory modules, so Rollup hoisted the interop helper and the
// evaluated React namespace into globe-vendor and made the entry chunk statically import
// it. Every content page then had to download, parse and evaluate the whole globe bundle
// before running a line of its own code — invisible in the source, invisible in the page,
// and worth ~480KB gzip on the critical path.
//
// Runs after a build (needs dist/).
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import assert from 'node:assert'

assert.ok(existsSync('dist/index.html'), 'no dist/ — run npm run build first')

// 1) The entry chunk must not statically import the globe chunk.
const entry = readdirSync('dist/assets').find((f) => /^index-.*\.js$/.test(f))
assert.ok(entry, 'no entry chunk found in dist/assets')
const entrySrc = readFileSync(`dist/assets/${entry}`, 'utf8')
const staticImports = [...entrySrc.matchAll(/(?:^|[;\s])import\s*(?:[^;'"]*from\s*)?["']([^"']+)["']/g)]
  .map((m) => m[1])
assert.ok(
  !staticImports.some((s) => s.includes('globe-vendor')),
  `entry chunk ${entry} statically imports the globe chunk — check manualChunks in vite.config.js`,
)

// 2) No prerendered content page may reference the globe chunk in its HTML (script tag or
//    modulepreload). Game routes are not prerendered, so every page here is content.
const CONTENT_PAGES = [
  'dist/atlas/gdp-growth/index.html',
  'dist/atlas/index.html',
  'dist/blog/index.html',
  'dist/blog/does-money-buy-happiness/index.html',
  'dist/landing/index.html',
  'dist/how-to-play/index.html',
  'dist/for-teachers/index.html',
]
for (const page of CONTENT_PAGES) {
  if (!existsSync(page)) continue
  const html = readFileSync(page, 'utf8')
  assert.ok(
    !html.includes('globe-vendor'),
    `${page.replace('dist/', '')} references the globe chunk — it has no globe on it`,
  )
}

// 3) The globe must still reach the game, or the split went too far. Rollup emits more
//    than one DailyGame-* chunk, and only one of them carries the reference, so this asks
//    whether ANY lazy game chunk pulls the globe in rather than picking the first match.
const gameChunks = readdirSync('dist/assets').filter((f) =>
  /^(DailyGame|FreePlayGame|YearGame)-.*\.js$/.test(f),
)
assert.ok(gameChunks.length, 'no game chunks found')
const pullsGlobe = gameChunks.filter((f) =>
  readFileSync(`dist/assets/${f}`, 'utf8').includes('globe-vendor'),
)
assert.ok(
  pullsGlobe.length,
  `no game chunk references the globe — the lazy path is broken (checked ${gameChunks.join(', ')})`,
)

const kb = (f) => (readFileSync(`dist/assets/${f}`).length / 1024).toFixed(0)
console.log(
  `bundle split OK (content pages load ${kb(entry)}KB entry, not the ${kb(
    readdirSync('dist/assets').find((f) => /^globe-vendor-.*\.js$/.test(f)),
  )}KB globe)`,
)
