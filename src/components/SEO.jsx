import { useEffect } from 'react'

// Lightweight SEO helper (client-side). For best SEO, consider SSR/prerendering.
// Usage: <SEO title="Page Title" description="Desc" path="/about" />
export default function SEO({ title, description, path = '/', keywords = [] }) {
  useEffect(() => {
    if (title) document.title = title
    const ensure = (name, value) => {
      if (!value) return
      let tag = document.querySelector(`meta[name='${name}']`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', value)
    }
    ensure('description', description)
    if (keywords.length) ensure('keywords', keywords.join(', '))
    // Canonical
    const canonicalHref = `https://worldofthemaps.com${path === '/' ? '/' : path}`
    let link = document.querySelector("link[rel='canonical']")
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', canonicalHref)
  }, [title, description, path, keywords])
  return null
}