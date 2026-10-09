import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Icon from './Icon'
import SEO from './SEO'
import { SITE_URL } from '../seo/routeMeta'
import { readAtlasGlobal, fmtValue } from '../data/atlasClient'
import './Atlas.css'

// Units are read off the dataset's own title and description, never guessed from the id: 78 of
// the 88 datasets carry a boilerplate description that implies no unit at all, and a wrong
// unitCode in Dataset JSON-LD is worse for a machine reader than an absent one. unitCode is
// only set where UN/CEFACT Recommendation 20 defines a code; it has none for currencies, so
// USD ships as unitText alone rather than as an invalid ISO 4217 code in a Rec 20 field.
// A percentage reaching the billions is a mislabelled dataset rather than a percentage:
// services-imports-percent-total is titled "Percent" but reports US dollars and tops
// 815bn. Genuine shares here reach 359% (merchandise trade against GDP), so the ceiling
// rejects the impostor without touching a real one.
const UNIT_RULES = [
  [/\(%\)|percent/i, { text: '%', code: 'P1', suffix: '%', ceiling: 1000 }],
  [/US dollars/i, { text: 'USD', suffix: ' USD' }],
  [/per square kilometer|per square kilometre/i, { text: 'people per square kilometre', suffix: ' per km²' }],
  [/number of years/i, { text: 'years', code: 'ANN', suffix: ' years' }],
  [/births per woman/i, { text: 'births per woman', suffix: ' births per woman' }],
]

function resolveUnit(title, description, maxValue) {
  const hit = UNIT_RULES.find(([pattern]) => pattern.test(`${title} ${description}`))
  if (!hit) return null
  const unit = hit[1]
  if (unit.ceiling != null && !(Math.abs(maxValue) <= unit.ceiling)) return null
  return unit
}

// fmtValue rounds anything below 0.005 to "0", which is fine in a stat card but not in a
// sentence an assistant will quote: Greenland's 0.000536% forest cover is not zero forest.
function fmtFact(v) {
  const shown = fmtValue(v)
  if (shown === '-0') return 'just below zero'
  return shown === '0' && v > 0 ? 'under 0.01' : shown
}

// Two significant figures, and a ceiling above it. The raw quotient runs to eleven digits on
// the absolute-magnitude datasets (cereal production tops its smallest reporter by 1.07e10),
// and a number that long contradicts the word "roughly" standing next to it.
function fmtRatio(r) {
  if (r >= 10000) return 'more than 10,000'
  return `roughly ${Number(r.toPrecision(2)).toLocaleString('en-US')}`
}

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

  // Inline cross-links to 2 related atlas pages, picked from the same category. These are
  // crawler-visible inside the intro prose (not just in the related-list at the bottom),
  // which 2026 SEO guidance rates heavily — internal-link density inside body content is one
  // of the strongest topical-authority signals. ×88 atlas pages × 2 = ~176 inline outbound links.
  const inlineRelated = useMemo(() => {
    const index = readAtlasGlobal('__ATLAS_INDEX__') || []
    if (!data || !index.length) return []
    return index
      .filter((d) => d.category === data.category && d.id !== data.id)
      .slice(0, 2)
  }, [data])

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
          <div className="atlas-loading"><Icon name="globe" /> Loading map data…</div>
        </main>
        <Footer />
      </div>
    )
  }

  const title = `${data.title} by Country`
  const url = `${SITE_URL}/atlas/${data.id}`
  const seoDescription = `${data.description} World map and full country rankings for ${data.stats.count} countries (${data.year}). Highest: ${data.stats.max.name}; lowest: ${data.stats.min.name}.`
  const maxVal = data.stats.max.value || 1

  const topVal = data.stats.max.value
  const lowVal = data.stats.min.value
  const unit = resolveUnit(data.title, data.description, topVal)
  const unitSuffix = unit ? unit.suffix : ''
  // The top-to-bottom ratio is only stated when the lowest value both renders as a non-zero
  // number and is positive. fmtValue rounds anything under 0.005 to "0", so for the four
  // near-zero datasets a ratio would contradict the figure printed next to it, and the eight
  // datasets with negative minima (net energy imports, GDP growth) have no meaningful ratio.
  const ratio =
    Number.isFinite(topVal) && Number.isFinite(lowVal) && lowVal >= 0.005 ? topVal / lowVal : null

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
          {inlineRelated.length > 0 && (
            <>
              {' '}See also{' '}
              {inlineRelated.map((r, i) => (
                <span key={r.id}>
                  {i > 0 ? ' and ' : ''}
                  <Link to={`/atlas/${r.id}`}>{r.title}</Link>
                </span>
              ))}
              .
            </>
          )}
        </p>

        {/* "reaches its highest value in X" rather than "is highest in X", and "the X figure"
            rather than "X's figure". Two datasets run on inverted scales (press freedom and
            corruption perception both score the worst performer highest), so a sentence
            claiming a country "is highest in Press Freedom" states the opposite of the
            funFact further down this same page. Naming the value instead of the country's
            standing stays true on every scale. The possessive is out because country names
            here end in "s" ("United States Minor Outlying Islands") or in a period ("Yemen,
            Rep."), which doubled the sentence's full stop. */}
        <section className="atlas-keyfacts" aria-label="Key facts">
          <p>
            {data.title} reaches its highest value in {data.stats.max.name}, at{' '}
            {fmtFact(topVal)}
            {unitSuffix}, and its lowest in {data.stats.min.name}, at {fmtFact(lowVal)}
            {unitSuffix}.
          </p>
          <p>
            The average across {data.stats.count} countries and territories is{' '}
            {fmtFact(data.stats.avg)}
            {unitSuffix} for {data.year}.
            {ratio !== null &&
              ` That makes the ${data.stats.max.name} figure ${fmtRatio(ratio)} times the ${data.stats.min.name} figure.`}
          </p>
        </section>

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

        {data.funFact && <p className="atlas-funfact"><Icon name="bulb" /> {data.funFact}</p>}

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

        <div className="atlas-cta">
          <Link to="/" className="atlas-cta-btn">
            <Icon name="target" /> Play the daily map-guessing game
          </Link>
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
            // No dataset carries a licence or a source URL, and the three sources have
            // different terms, so license/citation/sameAs are omitted rather than asserted.
            // The source names the publisher, which is `publisher`, not
            // `measurementTechnique`: schema.org means that field for the technique itself
            // (survey, mass spectrometry), and no single technique string is true across
            // World Bank indicators, Our World in Data series and REST Countries reference
            // data, so the field is omitted rather than filled with provenance.
            creditText: data.source,
            publisher: { '@type': 'Organization', name: data.source },
            variableMeasured: {
              '@type': 'PropertyValue',
              name: data.title,
              // 78 of the 88 descriptions are page boilerplate ("... shown on a world map
              // with full country rankings"), which describes this page, not the variable.
              ...(/full country rankings\.$/.test(data.description)
                ? {}
                : { description: data.description }),
              ...(unit ? { unitText: unit.text, ...(unit.code ? { unitCode: unit.code } : {}) } : {}),
              ...(Number.isFinite(lowVal) ? { minValue: lowVal } : {}),
              ...(Number.isFinite(topVal) ? { maxValue: topVal } : {}),
            },
            spatialCoverage: {
              '@type': 'Place',
              name: 'Worldwide',
              description: `${data.stats.count} countries and territories with reported values.`,
              geo: { '@type': 'GeoShape', box: '-90 -180 90 180' },
            },
            distribution: {
              '@type': 'DataDownload',
              name: `${data.title} by country (JSON)`,
              encodingFormat: 'application/json',
              contentUrl: `${SITE_URL}/data/atlas/${data.id}.json`,
            },
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
              { '@type': 'ListItem', position: 2, name: 'Atlas', item: `${SITE_URL}/atlas` },
              { '@type': 'ListItem', position: 3, name: title, item: url },
            ],
          }),
        }}
      />
    </div>
  )
}
