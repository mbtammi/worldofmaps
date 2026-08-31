import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Icon from './Icon'
import SEO from './SEO'
import { SITE_URL } from '../seo/routeMeta'
import { readInjected } from '../data/atlasClient'
import './Blog.css'

const labelFromId = (id) => id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// Single blog article (/blog/:slug). HTML body is pre-sanitized at build time by the
// markdown converter (all HTML escaped), so dangerouslySetInnerHTML is safe here.
export default function BlogPost() {
  const { slug } = useParams()
  const injected = (() => {
    const d = readInjected('__BLOG_POST__')
    return d && d.slug === slug ? d : null
  })()
  const [post, setPost] = useState(injected)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (post && post.slug === slug) return
    let cancelled = false
    setPost(null)
    setError(false)
    fetch(`/data/blog/${slug}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then((j) => !cancelled && setPost(j))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [slug, post])

  if (error) {
    return (
      <div className="page-with-nav">
        <Header />
        <main className="page-content blog">
          <h1>Article not found</h1>
          <p>
            That post doesn&apos;t exist. <Link to="/blog">Browse the blog</Link>.
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="page-with-nav">
        <Header />
        <main className="page-content blog">
          <div className="blog-loading">Loading article…</div>
        </main>
        <Footer />
      </div>
    )
  }

  const url = `${SITE_URL}/blog/${post.slug}`
  return (
    <div className="page-with-nav">
      <SEO
        title={`${post.title} | World of Maps`}
        description={post.description}
        path={`/blog/${post.slug}`}
        noindex={post.noindex}
      />
      <Header />
      <main className="page-content blog">
        <nav className="blog-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span aria-hidden="true">›</span>{' '}
          <Link to="/blog">Blog</Link> <span aria-hidden="true">›</span> <span>{post.title}</span>
        </nav>
        <h1>{post.title}</h1>
        <p className="blog-meta">
          {post.date && <time dateTime={post.date}>{post.date}</time>}
          {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ''}
        </p>
        <article className="blog-body" dangerouslySetInnerHTML={{ __html: post.html }} />

        {post.datasets?.length > 0 && (
          <p className="blog-related">
            Explore the data:{' '}
            {post.datasets.map((id, i) => (
              <span key={id}>
                {i > 0 && ', '}
                <Link to={`/atlas/${id}`}>{labelFromId(id)} map</Link>
              </span>
            ))}
            .
          </p>
        )}

        <div className="blog-cta">
          <Link to="/" className="blog-cta-btn">
            <Icon name="target" /> Play the daily map-guessing game
          </Link>
        </div>
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.description,
            datePublished: post.date || undefined,
            author: { '@type': 'Organization', name: post.author || 'World of Maps' },
            publisher: { '@type': 'Organization', name: 'World of Maps' },
            mainEntityOfPage: url,
            url,
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
              { '@type': 'ListItem', position: 3, name: post.title, item: url },
            ],
          }),
        }}
      />
    </div>
  )
}
