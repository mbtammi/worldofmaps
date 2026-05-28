// AI blog article generator (build-time, run manually — NOT part of `npm run build`).
//
//   ANTHROPIC_API_KEY=sk-... node scripts/generate-articles.js <datasetId> [<datasetId> ...]
//   ANTHROPIC_API_KEY=sk-... node scripts/generate-articles.js --all
//
// Reads an atlas snapshot (public/data/atlas/<id>.json) and asks Claude to write a ~900-word
// editorial explainer grounded ONLY in the supplied real figures. Output is written to
// content/blog/explainer-<id>.md with `draft: true` — the human review gate. A reviewer reads
// the draft, fixes anything off, and flips `draft: false` to publish (build-blog-data.js skips
// drafts). The running site never calls this script or the API — it serves prerendered HTML.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ATLAS_DIR = join(__dirname, '..', 'public', 'data', 'atlas')
const OUT_DIR = join(__dirname, '..', 'content', 'blog')
mkdirSync(OUT_DIR, { recursive: true })

const TODAY = new Date().toISOString().slice(0, 10)
const MODEL = 'claude-opus-4-7'

// Stable across every dataset → cached as the prompt prefix (cheap repeated calls).
const SYSTEM_PROMPT = `You are a data journalist for "World of Maps", a site of interactive world-data maps.
Write an engaging, accurate ~900-word explainer about a single global dataset.

STRICT GROUNDING RULES:
- Use ONLY the numbers provided in the user message. Never invent or estimate statistics, years, or country values.
- You may add widely-known geographic/economic/historical context, but attribute no specific figures that were not supplied.
- Refer to real countries and their supplied values to illustrate patterns (leaders, laggards, regional clusters).

OUTPUT FORMAT — return JSON matching the schema. The "body" field is Markdown using ONLY this subset:
- "## " and "### " headings (never "# " — the title is separate)
- Plain paragraphs separated by blank lines
- "- " bullet lists and "1. " numbered lists
- **bold** and *italic*
- Links only as [text](/atlas/<id>) or [text](/) — root-relative, pointing back to the map or the game
- NO tables, NO images, NO HTML, NO code blocks

STYLE: factual, curious, accessible to a general reader. Open with a hook. Use 3-5 H2 sections.
Close with one sentence inviting the reader to explore the interactive map and play the daily game.
"title" must be compelling and specific (≤ 70 chars). "description" is a 1-sentence meta description (≤ 155 chars).
"tags" = 2-4 lowercase topic tags.`

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    body: { type: 'string' },
  },
  required: ['title', 'description', 'tags', 'body'],
  additionalProperties: false,
}

const round = (v) => {
  const a = Math.abs(v)
  if (a >= 1000) return Math.round(v)
  if (a >= 1) return Math.round(v * 10) / 10
  return Math.round(v * 100) / 100
}

// Compact, grounded payload: highlights only (top 20 + bottom 10), not all ~200 rows.
function datasetPayload(d) {
  const slim = (r) => ({ country: r.name, value: round(r.value) })
  return {
    title: d.title,
    description: d.description,
    source: d.source,
    year: d.year,
    countries_covered: d.stats.count,
    highest: { country: d.stats.max.name, value: round(d.stats.max.value) },
    lowest: { country: d.stats.min.name, value: round(d.stats.min.value) },
    average: round(d.stats.avg),
    fun_fact: d.funFact,
    top_20: d.data.slice(0, 20).map(slim),
    bottom_10: d.data.slice(-10).map(slim),
    atlas_path: `/atlas/${d.id}`,
  }
}

const fmAray = (arr) => `[${arr.map((t) => String(t).replace(/"/g, '')).join(', ')}]`

async function generate(client, id) {
  const file = join(ATLAS_DIR, `${id}.json`)
  if (!existsSync(file)) {
    console.warn(`  ✗ ${id}: no atlas snapshot`)
    return false
  }
  const outPath = join(OUT_DIR, `explainer-${id}.md`)
  if (existsSync(outPath) && !process.argv.includes('--force')) {
    console.log(`  · ${id}: draft already exists (use --force to overwrite)`)
    return false
  }

  const dataset = JSON.parse(readFileSync(file, 'utf-8'))
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    thinking: { type: 'adaptive' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [
      {
        role: 'user',
        content: `Write the explainer for this dataset. Data (JSON):\n\n${JSON.stringify(
          datasetPayload(dataset),
        )}`,
      },
    ],
  })

  const usage = response.usage
  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock) {
    console.warn(`  ✗ ${id}: no text content returned`)
    return false
  }
  let article
  try {
    article = JSON.parse(textBlock.text)
  } catch {
    console.warn(`  ✗ ${id}: response was not valid JSON`)
    return false
  }

  const frontmatter = [
    '---',
    `title: "${article.title.replace(/"/g, "'")}"`,
    `description: "${article.description.replace(/"/g, "'")}"`,
    `slug: "explainer-${id}"`,
    `date: "${TODAY}"`,
    `tags: ${fmAray(article.tags || [])}`,
    `datasets: [${id}]`,
    'draft: true',
    '---',
    '',
  ].join('\n')

  writeFileSync(outPath, frontmatter + article.body.trim() + '\n')
  const cached = usage?.cache_read_input_tokens ?? 0
  console.log(`  ✓ ${id} -> explainer-${id}.md (draft)  [cache_read=${cached} tok]`)
  return true
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Export it and re-run.')
    process.exit(1)
  }
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  let ids = args
  if (process.argv.includes('--all')) {
    ids = readdirSync(ATLAS_DIR)
      .filter((f) => f.endsWith('.json') && f !== '_index.json')
      .map((f) => f.replace(/\.json$/, ''))
  }
  if (!ids.length) {
    console.error('Usage: node scripts/generate-articles.js <datasetId> [...] | --all  [--force]')
    process.exit(1)
  }

  const client = new Anthropic()
  console.log(`Generating ${ids.length} draft article(s) with ${MODEL}...\n`)
  let n = 0
  for (const id of ids) {
    try {
      if (await generate(client, id)) n++
    } catch (e) {
      if (e instanceof Anthropic.APIError) console.warn(`  ✗ ${id}: API ${e.status} ${e.message}`)
      else console.warn(`  ✗ ${id}: ${e.message}`)
    }
  }
  console.log(`\nDone: ${n} draft(s) written to content/blog/. Review, then set draft: false to publish.`)
}

main()
