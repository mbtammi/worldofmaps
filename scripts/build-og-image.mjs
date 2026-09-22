// Rasterize public/og-image.svg → public/og-image.png at build time.
//
//   node scripts/build-og-image.mjs
//
// Runs automatically as part of `npm run build`. The PNG is what Facebook, LinkedIn,
// Twitter/X, iMessage, Slack, Discord etc. use for link previews — they don't reliably
// render SVG OG images. We keep the SVG in the repo as the design source of truth; the PNG
// is the build artifact (committed too, so it's available to anyone curl-ing public/).
//
// resvg-js is a pure-WASM Rust SVG renderer — no native bindings, no Chrome download,
// no API key. Build-time only; nothing in the app bundle depends on it.
//
// FONTS: this used to pass `loadSystemFonts: false` for deterministic output across
// machines. resvg then had no font to shape with, so every <text> element rendered as
// nothing and the card shipped as a wordless globe with an empty yellow pill — on every
// link anyone ever shared. Determinism was the right instinct and a blank card was the
// cost. System fonts are on now, and the render is verified below instead: if the host has
// no usable font the build fails loudly rather than quietly shipping an empty card again.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'public', 'og-image.svg')
const OUT = join(__dirname, '..', 'public', 'og-image.png')

const svg = readFileSync(SRC, 'utf-8')

function render(loadSystemFonts) {
  // Rendering at the exact 1200×630 OG target dimensions. The SVG's viewBox is 1200 630
  // already, so a 1× render matches pixel-for-pixel. fitTo width=1200 enforces it
  // regardless of any future viewBox change.
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    background: 'transparent',
    font: { loadSystemFonts },
  })
}

const withFonts = render(true)

// 1) Did any text actually shape? A fontless host renders the artwork and silently drops
//    every glyph, which is exactly how the blank card went unnoticed. The two renders are
//    byte-identical in that case.
const textless = render(false).render().asPng()
const png = withFonts.render().asPng()
if (Buffer.compare(png, textless) === 0) {
  console.error(
    'og-image: text did not render — no usable system font on this host.\n' +
      'The card would ship as a wordless globe. Install a font (e.g. fonts-dejavu) or\n' +
      'commit a font file and pass it via the resvg `fontFiles` option.',
  )
  process.exit(1)
}

// 2) Does the text fit? At the old sizes the title ran past the right edge and lost its
//    last letters, which a byte-size check would never catch.
const box = withFonts.getBBox()
if (box && (box.x + box.width > 1200.5 || box.y + box.height > 630.5 || box.x < -0.5 || box.y < -0.5)) {
  console.error(
    `og-image: content overflows the 1200×630 canvas ` +
      `(bbox x=${box.x.toFixed(1)} y=${box.y.toFixed(1)} ` +
      `w=${box.width.toFixed(1)} h=${box.height.toFixed(1)}). Shrink or reposition the text.`,
  )
  process.exit(1)
}

writeFileSync(OUT, png)
console.log(
  `✓ og-image.png written (${png.length} bytes, 1200×630, text verified` +
    `${box ? `, bbox ${Math.round(box.width)}×${Math.round(box.height)}` : ''})`,
)
