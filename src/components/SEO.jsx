import { useEffect } from 'react'
import { SITE_URL, DEFAULT_IMAGE } from '../seo/routeMeta'

// Lightweight client-side SEO helper. Keeps <title>, description, keywords,
// canonical and Open Graph / Twitter tags in sync per route.
// For crawler-visible HTML, content routes are additionally prerendered at build time.
// Usage: <SEO title="Page Title" description="Desc" path="/about" />
export default function SEO({ title, description, path = '/', keywords = [], image = DEFAULT_IMAGE }) {
  useEffect(() => {
    if (title) document.title = title

    const url = `${SITE_URL}${path === '/' ? '/' : path}`

    // Upsert a <meta> tag matched by name= or property=.
    const setMeta = (attr, key, value) => {
      if (!value) return
      let tag = document.head.querySelector(`meta[${attr}='${key}']`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, key)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', value)
    }

    setMeta('name', 'description', description)
    if (keywords.length) setMeta('name', 'keywords', keywords.join(', '))

    // Open Graph
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)

    // Twitter
    setMeta('property', 'twitter:title', title)
    setMeta('property', 'twitter:description', description)
    setMeta('property', 'twitter:url', url)
    setMeta('property', 'twitter:image', image)

    // Canonical
    let link = document.head.querySelector("link[rel='canonical']")
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', url)
  }, [title, description, path, keywords, image])

  return null
}
