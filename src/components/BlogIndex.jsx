import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import SEO from './SEO'
import { ROUTE_META } from '../seo/routeMeta'
import { readInjected } from '../data/atlasClient'
import './Blog.css'

// Blog index (/blog): lists published posts. Internal-linking surface to the articles.
export default function BlogIndex() {
  const [index, setIndex] = useState(() => readInjected('__BLOG_INDEX__') || [])
  useEffect(() => {
    if (index.length) return
    fetch('/data/blog/_index.json')
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => {})
  }, [index.length])

  return (
    <div className="page-with-nav">
      <SEO {...ROUTE_META['/blog']} />
      <Header />
      <main className="page-content blog">
        <h1>World of Maps Blog</h1>
        <p className="blog-intro">
          Stories, rankings and explainers built from real global data — the countries that lead
          and lag on everything from GDP to forest cover. Every post links to an interactive{' '}
          <Link to="/atlas">map</Link> you can explore.
        </p>

        {index.length === 0 && <p>New posts coming soon.</p>}

        <ul className="blog-list">
          {index.map((post) => (
            <li key={post.slug} className="blog-card">
              <h2>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="blog-meta">
                {post.date && <time dateTime={post.date}>{post.date}</time>}
                {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ''}
              </p>
              {post.description && <p className="blog-card-desc">{post.description}</p>}
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  )
}
