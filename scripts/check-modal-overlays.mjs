// A full-bleed `position: fixed` overlay only covers the viewport when nothing above it in
// the tree is a containing block for fixed positioning. `backdrop-filter`, `filter` and
// `transform` each create one, and this site is built out of glass panels, so filtered
// elements are everywhere.
//
// The bug this encodes: FeatureRequestsModal is rendered from inside <footer>, and .footer
// carries backdrop-filter: blur(20px). `inset: 0` on .fr-overlay therefore resolved against
// the footer's box rather than the viewport, and the dialog opened 1378px down the page in a
// 106px strip — measured in Chrome over CDP, not guessed. Nothing in the source reads as
// wrong; the only way to see it is to open the modal.
//
// The rule: an overlay dialog rendered from inside a filtered element must escape the tree
// with createPortal. Mounting at the top of the tree (what StatsModal and ShareSheet do,
// as siblings of .daily-game under #root) is equally fine, which is why the check keys off
// the render site instead of demanding a portal everywhere.
//
//   node scripts/check-modal-overlays.mjs

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const rel = (f) => relative(ROOT, f)

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  )

const files = walk(SRC)
const read = (f) => readFileSync(f, 'utf-8')

// --- 1. Classify every CSS rule ------------------------------------------------------
// Only the rightmost compound selector is the rule's subject: in `.daily-game .btn:hover
// { transform: ... }` it is .btn that gets the transform, not .daily-game. Crediting both
// is how the first draft of this check reported five phantom failures.
const CREATES_CONTAINING_BLOCK = /(?:^|[;{\s])(?:backdrop-filter|filter|transform)\s*:\s*(?!none)[^;}]+/i
const filtered = new Map() // class -> the declaration that traps position: fixed
const fullBleedFixed = new Set()

for (const file of files.filter((f) => f.endsWith('.css'))) {
  for (const [, selectorList, body] of read(file).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of selectorList.split(',')) {
      const subject = selector.trim().split(/\s+|>|\+|~/).filter(Boolean).pop()
      if (!subject) continue
      const classes = [...subject.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((m) => m[1])
      if (!classes.length) continue
      const trap = body.match(CREATES_CONTAINING_BLOCK)
      if (trap) classes.forEach((c) => filtered.set(c, trap[0].trim()))
      if (/position\s*:\s*fixed/i.test(body) && /inset\s*:\s*0/i.test(body)) {
        classes.forEach((c) => fullBleedFixed.add(c))
      }
    }
  }
}

// --- 2. Which components are overlay dialogs? ----------------------------------------
// A dialog, not a background layer: it declares aria-modal and paints a full-bleed fixed
// overlay. That distinction keeps GlobeView's fixed canvas out of this.
const dialogs = new Map() // name -> file
for (const file of files.filter((f) => f.endsWith('.jsx'))) {
  const src = read(file)
  if (!/aria-modal/.test(src)) continue
  const paintsOverlay =
    [...src.matchAll(/className=["'`]([^"'`]+)["'`]/g)]
      .flatMap((m) => m[1].split(/\s+/))
      .some((c) => fullBleedFixed.has(c)) ||
    // ShareSheet styles its overlay inline rather than in a stylesheet.
    /position\s*:\s*['"]fixed['"][^}]*inset\s*:\s*0/.test(src)
  if (paintsOverlay) dialogs.set(file.split('/').pop().replace(/\.jsx$/, ''), file)
}

if (dialogs.size < 2) {
  console.error(`modal overlays: detector found only ${dialogs.size} dialog(s) — it is broken, not the code.`)
  process.exit(1)
}

// --- 3. Flag any dialog rendered inside a filtered element ----------------------------
// Nesting is read from indentation. These files are Prettier-shaped and a JSX parser is a
// heavy dependency for one rule, so: a usage is inside an element when it appears after
// that element's opening tag and is indented further than it. In DailyGame.jsx the modals
// sit at the same indent as <div className="daily-game">, i.e. as siblings, and are
// correctly left alone.
const indentOf = (line) => line.match(/^\s*/)[0].length
const problems = []

for (const file of files.filter((f) => f.endsWith('.jsx'))) {
  const lines = read(file).split('\n')
  const traps = lines.flatMap((line, i) => {
    const classAttr = line.match(/className=["'`]([^"'`]+)["'`]/)
    if (!classAttr) return []
    const hit = classAttr[1].split(/\s+/).find((c) => filtered.has(c))
    return hit ? [{ line: i, indent: indentOf(line), cls: hit }] : []
  })
  if (!traps.length) continue

  for (const [name, dialogFile] of dialogs) {
    if (dialogFile === file) continue
    if (/createPortal\s*\(/.test(read(dialogFile))) continue
    for (const [i, line] of lines.entries()) {
      if (!new RegExp(`<${name}[\\s/>]`).test(line)) continue
      const trap = traps.find((t) => t.line < i && t.indent < indentOf(line))
      if (!trap) continue
      problems.push(
        `${rel(file)}:${i + 1} renders <${name}> inside .${trap.cls} (${rel(file)}:${trap.line + 1}), ` +
        `which sets\n    ${trap.cls} as a containing block for position: fixed via "${filtered.get(trap.cls)}". ` +
        `${name} does not\n    use createPortal, so its overlay is clipped to that element instead of the viewport.`,
      )
    }
  }
}

// --- 4. The feature-request dialog specifically ---------------------------------------
const frJsx = read(join(SRC, 'components', 'FeatureRequestsModal.jsx'))
const frCss = read(join(SRC, 'components', 'FeatureRequestsModal.css'))
const assert = (cond, msg) => { if (!cond) problems.push(msg) }

assert(/createPortal\([\s\S]*?document\.body/.test(frJsx),
  'FeatureRequestsModal must createPortal to document.body — Footer renders it inside <footer>.')
assert(/\.fr-body\s*\{[^}]*overflow-y\s*:\s*auto/.test(frCss),
  '.fr-body must own the scrollbar, or a short viewport leaves the dialog unscrollable.')
assert(/\.fr-container\s*\{[^}]*max-height/.test(frCss),
  '.fr-container needs a max-height, or a long list pushes the dialog past the viewport.')
assert(!/\.fr-list\s*\{[^}]*overflow-y\s*:\s*auto/.test(frCss),
  '.fr-list must not scroll independently now that .fr-body does — nested scrollers trap the wheel.')

if (problems.length) {
  console.error('modal overlay check FAILED:\n')
  for (const p of problems) console.error('  - ' + p + '\n')
  process.exit(1)
}

console.log(
  `modal overlays OK (${dialogs.size} dialogs: ${[...dialogs.keys()].join(', ')}; ` +
  `${filtered.size} classes trap position:fixed; none clipped)`,
)
