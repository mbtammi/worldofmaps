// llms.txt is a live surface: copilot.microsoft.com already refers traffic, and assistants
// quote its atlas figures instead of fetching the 88 pages. Every failure it can have is
// silent — the build still exits 0 and the file still looks like a sitemap. A dataset whose
// stats went missing, a formatter that started emitting `NaN` or `288001.433369041`, a
// dropped section or a relative link all ship wrong facts to a reader that cannot tell.
//
// Runs after a build (needs dist/).
import { readFileSync, existsSync } from 'node:fs'
import assert from 'node:assert'

assert.ok(existsSync('dist/llms.txt'), 'no dist/llms.txt — run npm run build first')

const SITE_URL = 'https://www.worldofthemaps.com'
const MAX_BYTES = 40 * 1024

const raw = readFileSync('dist/llms.txt', 'utf8')
const lines = raw.split('\n')
const atlasIndex = JSON.parse(readFileSync('public/data/atlas/_index.json', 'utf8'))

assert.ok(
  Buffer.byteLength(raw) <= MAX_BYTES,
  `llms.txt is ${Buffer.byteLength(raw)} bytes — over the ${MAX_BYTES} ceiling, it has to stay skimmable`,
)

// 1) Structure. The headings are what an assistant uses to decide which part to read.
for (const heading of ['# World of Maps', '## Play', '## Atlas — data pages', '## Articles', '## About']) {
  assert.ok(lines.includes(heading), `missing heading: ${heading}`)
}

// 2) Links. Every one must be absolute and on this site, or a model resolves it against
//    its own base and cites a URL that does not exist.
const links = [...raw.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)]
assert.ok(links.length > 100, `only ${links.length} links — the atlas entries are not being emitted`)
for (const [, text, href] of links) {
  assert.ok(text.trim(), `empty link text for ${href}`)
  assert.ok(href.startsWith(`${SITE_URL}/`), `link is not an absolute ${SITE_URL} URL: ${href}`)
}
assert.ok(!/\]\([^)]*\n/.test(raw), 'a markdown link is split across lines')

// 3) No placeholder leaking in from a missing field.
for (const bad of ['undefined', 'NaN', 'Infinity', '[object Object]']) {
  const hit = lines.findIndex((l) => l.includes(bad))
  assert.equal(hit, -1, `line ${hit + 1} contains ${bad}: ${lines[hit]}`)
}

// 4) One entry per atlas dataset, carrying the figures themselves.
const entryShape =
  /^- \[(.+?)\]\((\S+?)\): (?:.*?\. )?Highest (.+?) (-?[\d,.]+), lowest (.+?) (-?[\d,.]+), average (-?[\d,.]+) across (\d+) countries\. (\d{4}), (.+)\.$/

// A readable figure: grouped in threes above 999, at most two decimals at or above 1, and
// at most two significant digits below 1 so a tiny share neither rounds to a flat "0" nor
// prints as a raw float.
function assertReadable(token, where) {
  assert.ok(/^-?(\d{1,3}(,\d{3})*|\d{1,3})(\.\d+)?$/.test(token), `${where}: unreadable number "${token}"`)
  const [int, frac = ''] = token.replace('-', '').split('.')
  const digits = int.replace(/,/g, '')
  assert.ok(digits.length <= 3 || int.includes(','), `${where}: "${token}" is missing thousands separators`)
  if (digits === '0') {
    assert.ok(frac.replace(/^0+/, '').length <= 2, `${where}: "${token}" carries more than two significant digits`)
  } else {
    assert.ok(frac.length <= 2, `${where}: "${token}" is a raw unformatted float`)
  }
}

const seen = new Set()
for (const line of lines) {
  if (!line.startsWith(`- [`) || !line.includes(`${SITE_URL}/atlas/`)) continue
  const m = entryShape.exec(line)
  assert.ok(m, `atlas entry does not carry highest/lowest/average/count/year/source:\n  ${line}`)
  const [, , href, maxName, maxVal, minName, minVal, avg, count, year, source] = m
  const id = href.slice(`${SITE_URL}/atlas/`.length)
  assert.ok(!seen.has(id), `atlas dataset ${id} is listed twice`)
  seen.add(id)
  assert.ok(maxName.trim() && minName.trim(), `${id}: missing a country name`)
  assertReadable(maxVal, `${id} highest`)
  assertReadable(minVal, `${id} lowest`)
  assertReadable(avg, `${id} average`)
  assert.ok(Number(count) > 0, `${id}: country count is ${count}`)
  assert.ok(Number(year) >= 1900 && Number(year) <= 2100, `${id}: implausible year ${year}`)
  assert.ok(source.trim().length > 2, `${id}: no named source`)
}

const expected = atlasIndex.map((e) => e.id)
const missing = expected.filter((id) => !seen.has(id))
const extra = [...seen].filter((id) => !expected.includes(id))
assert.deepEqual(missing, [], `atlas datasets absent from llms.txt: ${missing.join(', ')}`)
assert.deepEqual(extra, [], `llms.txt links atlas pages that are not in the index: ${extra.join(', ')}`)

// 5) The reading convention has to travel with the figures. Without it a model reads an
//    index as a percentage, or treats the stated year as every country's year.
const atlasSection = raw.slice(raw.indexOf('## Atlas — data pages'), raw.indexOf('### '))
for (const phrase of ['unit', 'not comparable between datasets', 'unweighted mean', 'upper bound']) {
  assert.ok(atlasSection.includes(phrase), `the atlas reading convention no longer states: ${phrase}`)
}

// 6) noindex posts stay unadvertised. check-live.mjs asserts this against production; the
//    same invariant belongs at build time, where it is cheap to catch.
const noindex = JSON.parse(readFileSync('public/data/blog/_index.json', 'utf8')).filter((p) => p.noindex)
for (const p of noindex) {
  assert.ok(!raw.includes(`/blog/${p.slug}`), `llms.txt advertises the noindexed post ${p.slug}`)
}

console.log(
  `llms.txt OK (${Buffer.byteLength(raw)} bytes, ${seen.size} atlas entries with figures, ` +
    `${links.length} absolute links, ${noindex.length} noindex posts withheld)`,
)
