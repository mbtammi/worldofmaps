import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import SEO from './SEO'
import { ROUTE_META } from '../seo/routeMeta'
import { readAtlasGlobal } from '../data/atlasClient'
import './Atlas.css'

// /atlas hub page: lists every dataset map grouped by category. Strong internal-linking
// surface that guides crawlers to all the programmatic /atlas/:id pages.
export default function AtlasIndex() {
  const [index, setIndex] = useState(() => readAtlasGlobal('__ATLAS_INDEX__') || [])
  useEffect(() => {
    if (index.length) return
    fetch('/data/atlas/_index.json')
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => {})
  }, [index.length])

  const byCategory = {}
  for (const d of index) (byCategory[d.category] ||= []).push(d)
  const categories = Object.keys(byCategory).sort()

  return (
    <div className="page-with-nav">
      <SEO {...ROUTE_META['/atlas']} />
      <Header />
      <main className="page-content atlas">
        <h1>World Data Atlas</h1>
        <p className="atlas-intro">
          Explore {index.length || 'dozens of'} interactive world maps with full country
          rankings — from GDP and population density to internet use, energy and the
          environment. Every map is built on real open data, and each one is a puzzle in the{' '}
          <Link to="/">daily guessing game</Link>.
        </p>

        {categories.map((cat) => (
          <section key={cat} className="atlas-cat">
            <h2>{cat}</h2>
            <ul className="atlas-cat-list">
              {byCategory[cat]
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((d) => (
                  <li key={d.id}>
                    <Link to={`/atlas/${d.id}`}>{d.title}</Link>
                    <span className="atlas-cat-count">{d.count} countries</span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  )
}
