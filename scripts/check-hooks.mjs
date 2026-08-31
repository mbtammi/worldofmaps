// Fails on React hook-order violations only.
//
// `npm run lint` currently reports ~75 pre-existing style errors, which is exactly why a real
// one went unnoticed: Atlas.jsx called useMemo below two early returns, so every client-side
// navigation to an atlas page — the site's main search landing pages — blanked the screen with
// "Rendered more hooks than during the previous render". Direct loads hid it, because
// prerendering injects the data and the early return never fires on the first render.
//
// This gate stays green while the style backlog does not.
import { ESLint } from 'eslint'

const eslint = new ESLint()
const results = await eslint.lintFiles(['src/**/*.{js,jsx}'])

const violations = results.flatMap((r) =>
  r.messages
    .filter((m) => m.ruleId === 'react-hooks/rules-of-hooks')
    .map((m) => `${r.filePath.replace(process.cwd() + '/', '')}:${m.line}  ${m.message}`),
)

if (violations.length) {
  console.error(`Hook-order violations (${violations.length}):`)
  for (const v of violations) console.error(`  ${v}`)
  process.exit(1)
}
console.log('hook order OK (no rules-of-hooks violations)')
