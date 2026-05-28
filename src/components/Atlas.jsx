import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import SEO from './SEO'
import { SITE_URL } from '../seo/routeMeta'
import { readAtlasGlobal, fmtValue } from '../data/atlasClient'
import './Atlas.css'

// Per-dataset programmatic page (/atlas/:datasetId): map-backed country rankings built from
// the prerendered snapshot. Crawler-visible content = top-10 bar chart + full ranked table.
function RelatedMaps({ currentId, category }) {
  const [index, setIndex] = useState(() => readAtlasGlobal('__ATLAS_INDEX__') || [])
  useEffect(() => {
    if (index.length) return
    fetch('/data/atlas/_index.json')
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => {})
  }, [index.length])

  const related = index
    .filter((d) => d.category === category && d.id !== currentId)
    .slice(0, 8)
  if (!related.length) return null
  return (
    <section className="atlas-related">
      <h2>More maps in {category}</h2>
      <ul className="atlas-related-list">
        {related.map((d) => (
          <li key={d.id}>
            <Link to={`/atlas/${d.id}`}>{d.title}</Link>
          </li>
        ))}
        <li>
          <Link to="/atlas">Browse all maps →</Link>
        </li>
      </ul>
    </section>
  )
}

export default function Atlas() {
  const { datasetId } = useParams()
  const injected = (() => {
    const d = readAtlasGlobal('__ATLAS_DATA__')
    return d && d.id === datasetId ? d : null
  })()
  const [data, setData] = useState(injected)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (data && data.id === datasetId) return
    let cancelled = false
    setData(null)
    setError(false)
    fetch(`/data/atlas/${datasetId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then((j) => !cancelled && setData(j))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [datasetId, data])

  if (error) {
    return (
      <div className="page-with-nav">
        <Header />
        <main className="page-content atlas">
          <h1>Map not found</h1>
          <p>
            We don&apos;t have that dataset yet. <Link to="/atlas">Browse all maps</Link>.
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-with-nav">
        <Header />
        <main className="page-content atlas">
          <div className="atlas-loading">🌍 Loading map data…</div>
        </main>
        <Footer />
      </div>
    )
  }

  const title = `${data.title} by Country`
  const url = `${SITE_URL}/atlas/${data.id}`
  const seoDescription = `${data.description} World map and full country rankings for ${data.stats.count} countries (${data.year}). Highest: ${data.stats.max.name}; lowest: ${data.stats.min.name}.`
  const maxVal = data.stats.max.value || 1

  return (
    <div className="page-with-nav">
      <SEO
        title={`${title} — Map & Country Rankings | World of Maps`}
        description={seoDescription}
        path={`/atlas/${data.id}`}
      />
      <Header />
      <main className="page-content atlas">
        <nav className="atlas-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span aria-hidden="true">›</span>{' '}
          <Link to="/atlas">Atlas</Link> <span aria-hidden="true">›</span>{' '}
          <span>{data.title}</span>
        </nav>

        <h1>{title}</h1>
        <p className="atlas-intro">
          {data.description} Data covers {data.stats.count} countries for {data.year}, sourced
          from {data.source}.
        </p>

        <section className="atlas-stats" aria-label="Key statistics">
          <div className="atlas-stat">
            <span className="atlas-stat-label">Highest</span>
            <span className="atlas-stat-value">{data.stats.max.name}</span>
            <span className="atlas-stat-sub">{fmtValue(data.stats.max.value)}</span>
          </div>
          <div className="atlas-stat">
            <span className="atlas-stat-label">Lowest</span>
            <span className="atlas-stat-value">{data.stats.min.name}</span>
            <span className="atlas-stat-sub">{fmtValue(data.stats.min.value)}</span>
          </div>
          <div className="atlas-stat">
            <span className="atlas-stat-label">Average</span>
            <span className="atlas-stat-value">{fmtValue(data.stats.avg)}</span>
            <span className="atlas-stat-sub">{data.stats.count} countries</span>
          </div>
          <div className="atlas-stat">
            <span className="atlas-stat-label">Year</span>
            <span className="atlas-stat-value">{data.year}</span>
            <span className="atlas-stat-sub">latest available</span>
          </div>
        </section>

        {data.funFact && <p className="atlas-funfact">💡 {data.funFact}</p>}

        <h2>Top 10 countries</h2>
        <div className="atlas-bars">
          {data.data.slice(0, 10).map((row) => (
            <div className="atlas-bar-row" key={row.iso_a3}>
              <span className="atlas-bar-label">{row.name}</span>
              <span className="atlas-bar-track">
                <span
                  className="atlas-bar-fill"
                  style={{ width: `${Math.max(2, (row.value / maxVal) * 100)}%` }}
                />
              </span>
              <span className="atlas-bar-val">{fmtValue(row.value)}</span>
            </div>
          ))}
        </div>

        <h2>
          {data.title}: full country ranking ({data.year})
        </h2>
        <table className="atlas-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Country</th>
              <th scope="col">{data.title}</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((row, i) => (
              <tr key={row.iso_a3}>
                <td>{i + 1}</td>
                <td>{row.name}</td>
                <td>{fmtValue(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="atlas-source">
          Source: {data.source}. Latest available year: {data.year}. Values shown are the most
          recent reported figure per country.
        </p>

        <div className="atlas-cta">
          <Link to="/" className="atlas-cta-btn">
            🎯 Play the daily map-guessing game
          </Link>
        </div>

        <RelatedMaps currentId={data.id} category={data.category} />
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: title,
            description: data.description,
            url,
            creator: { '@type': 'Organization', name: data.source },
            temporalCoverage: String(data.year),
            isAccessibleForFree: true,
            keywords: [data.title, `${data.title} by country`, 'world map', 'country rankings'],
          }),
        }}
      />
    </div>
  )
}
