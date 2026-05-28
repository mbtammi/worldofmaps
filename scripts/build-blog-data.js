// Build step: content/blog/*.md  ->  public/data/blog/<slug>.json + _index.json
//
//   node scripts/build-blog-data.js
//
// Offline + deterministic (no network). Runs as part of `npm run build`. Posts with
// `draft: true` in frontmatter are skipped — that's the human review gate for AI drafts.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { markdownToHtml, parseFrontmatter } from './lib/markdown.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = join(__dirname, '..', 'content', 'blog')
const OUT_DIR = join(__dirname, '..', 'public', 'data', 'blog')
mkdirSync(OUT_DIR, { recursive: true })

if (!existsSync(SRC_DIR)) {
  console.log('No content/blog directory — writing empty blog index.')
  writeFileSync(join(OUT_DIR, '_index.json'), '[]')
  process.exit(0)
}

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.md'))
const index = []
let skipped = 0

for (const file of files) {
  const raw = readFileSync(join(SRC_DIR, file), 'utf-8')
  const { data, body } = parseFrontmatter(raw)
  const slug = data.slug || file.replace(/\.md$/, '')

  if (data.draft === true) {
    skipped++
    console.log(`  · skipped draft: ${slug}`)
    continue
  }
  if (!data.title) {
    console.warn(`  ✗ ${file}: missing title — skipping`)
    continue
  }

  const html = markdownToHtml(body)
  const words = body.split(/\s+/).filter(Boolean).length
  const post = {
    slug,
    title: data.title,
    description: data.description || '',
    date: data.date || '',
    author: data.author || 'World of Maps',
    tags: Array.isArray(data.tags) ? data.tags : [],
    datasets: Array.isArray(data.datasets) ? data.datasets : [],
    readingMinutes: Math.max(1, Math.round(words / 200)),
    html,
  }
  writeFileSync(join(OUT_DIR, `${slug}.json`), JSON.stringify(post))
  index.push({
    slug,
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
    readingMinutes: post.readingMinutes,
  })
  console.log(`  ✓ ${slug} (${post.readingMinutes} min)`)
}

index.sort((a, b) => String(b.date).localeCompare(String(a.date)))
writeFileSync(join(OUT_DIR, '_index.json'), JSON.stringify(index, null, 2))
console.log(`\nBlog data built: ${index.length} published, ${skipped} draft(s) skipped.`)
