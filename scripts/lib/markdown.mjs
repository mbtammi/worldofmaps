// Minimal, dependency-free Markdown -> HTML converter for blog content.
// Deliberately supports a constrained subset (headings, paragraphs, bold/italic, links,
// ordered/unordered lists, blockquotes, hr). It HTML-escapes everything first, so AI- or
// user-authored content can never inject raw HTML/scripts — safer than a passthrough parser.

const escapeHtml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Inline: links, bold, italic, code. Operates on already-escaped text.
function inline(text) {
  let t = text
  // [label](url) — only allow http(s) and root-relative links.
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
    const safe = /^(https?:\/\/|\/)/.test(url.trim())
    if (!safe) return label
    const ext = url.trim().startsWith('http')
    const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${url.trim()}"${attrs}>${label}</a>`
  })
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  return t
}

export function markdownToHtml(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0
  let para = []

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(escapeHtml(para.join(' ')))}</p>`)
      para = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      flushPara()
      i++
      continue
    }

    // Headings (## .. ######; single # reserved for the page title in frontmatter).
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushPara()
      const level = Math.min(Math.max(h[1].length, 2), 4) // clamp to h2..h4
      out.push(`<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`)
      i++
      continue
    }

    // Horizontal rule.
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushPara()
      out.push('<hr />')
      i++
      continue
    }

    // Blockquote.
    if (trimmed.startsWith('> ')) {
      flushPara()
      const buf = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        buf.push(lines[i].trim().slice(2))
        i++
      }
      out.push(`<blockquote>${inline(escapeHtml(buf.join(' ')))}</blockquote>`)
      continue
    }

    // Unordered list.
    if (/^[-*]\s+/.test(trimmed)) {
      flushPara()
      const items = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`<li>${inline(escapeHtml(lines[i].trim().replace(/^[-*]\s+/, '')))}</li>`)
        i++
      }
      out.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // Ordered list.
    if (/^\d+\.\s+/.test(trimmed)) {
      flushPara()
      const items = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${inline(escapeHtml(lines[i].trim().replace(/^\d+\.\s+/, '')))}</li>`)
        i++
      }
      out.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    para.push(trimmed)
    i++
  }
  flushPara()
  return out.join('\n')
}

// Parse a tiny YAML-ish frontmatter block delimited by --- ... ---.
// Supports `key: value`, quoted strings, and inline arrays [a, b, c].
export function parseFrontmatter(raw) {
  const text = String(raw).replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) return { data: {}, body: text }
  const end = text.indexOf('\n---', 4)
  if (end === -1) return { data: {}, body: text }
  const fm = text.slice(4, end)
  const body = text.slice(end + 4).replace(/^\n+/, '')
  const data = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!m) continue
    let value = m[2].trim()
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      value = value.replace(/^["']|["']$/g, '')
      if (value === 'true') value = true
      else if (value === 'false') value = false
    }
    data[m[1]] = value
  }
  return { data, body }
}
