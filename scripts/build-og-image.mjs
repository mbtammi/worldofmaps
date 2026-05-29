// Rasterize public/og-image.svg → public/og-image.png at build time.
//
//   node scripts/build-og-image.mjs
//
// Runs automatically as part of `npm run build`. The PNG is what Facebook, LinkedIn,
// Twitter/X, iMessage, etc. use for link previews — they don't reliably render SVG OG
// images. We keep the SVG in the repo as the design source of truth; the PNG is the
// build artifact (committed too, so it's available to anyone curl-ing public/).
//
// resvg-js is a pure-WASM Rust SVG renderer — no native bindings, no Chrome download,
// no API key. Build-time only; nothing in the app bundle depends on it.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'og-image.svg')
const OUT = join(__dirname, '..', 'public', 'og-image.png')

const svg = readFileSync(SRC, 'utf-8')

// Rendering at the exact 1200×630 OG target dimensions. The SVG's viewBox is 1200 630
// already, so a 1× render matches pixel-for-pixel. fitTo width=1200 enforces it
// regardless of any future viewBox change.
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  background: 'transparent',
  font: { loadSystemFonts: false }, // deterministic across machines (no host fonts)
})
const pngBuf = resvg.render().asPng()
writeFileSync(OUT, pngBuf)
console.log(`✓ og-image.png written (${pngBuf.length} bytes, 1200×630)`)
