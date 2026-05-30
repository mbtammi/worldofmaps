import { Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import SEO from './SEO'
import { ROUTE_META } from '../seo/routeMeta'
import './Layout.css'

// /for-teachers — a single page targeting geography / social-studies / data-literacy teachers.
// No login, no ads. Designed to be useful as-is and shareable into teacher newsletters and
// classroom-resource directories.
export default function ForTeachers() {
  return (
    <div className="page-with-nav">
      <SEO {...ROUTE_META['/for-teachers']} />
      <Header />
      <main className="page-content">
        <h1>World of Maps for the Classroom</h1>
        <p>
          A free 3-minute daily warm-up that builds <strong>geography literacy</strong> and{' '}
          <strong>data literacy</strong> together. Students look at a world map shaded by a real
          global dataset and guess what the data is — population density, GDP per capita,
          internet usage, life expectancy, forest coverage, and 80+ others. No accounts, no
          ads, no email collection. Works on any browser.
        </p>

        <h2>Why it works in class</h2>
        <ul>
          <li>
            <strong>One concept per day.</strong> The puzzle is the lesson. Students engage with
            one real global dataset, see who's high and low, and start asking why.
          </li>
          <li>
            <strong>Pattern recognition, not memorization.</strong> The cognitive task is
            reading a choropleth and inferring meaning — a skill that transfers to every data
            visualization students will encounter later.
          </li>
          <li>
            <strong>Discussion-rich.</strong> Every dataset opens 5 minutes of "why is Africa
            mostly dark?" or "why does Eastern Europe cluster together?" — the kind of
            geography discussion that teaches more than a textbook page.
          </li>
        </ul>

        <h2>A 10-minute classroom outline</h2>
        <ol>
          <li>
            <strong>Pull up today's challenge.</strong> Go to{' '}
            <Link to="/">worldofthemaps.com</Link> on the projector. Don't click anything yet
            — let students study the map for 30 seconds.
          </li>
          <li>
            <strong>Predict, in pairs.</strong> Each pair writes down what they think the map
            represents and one piece of evidence ("Russia and Canada look big" / "Europe is
            uniformly dark" / "Africa shows a north-south gradient").
          </li>
          <li>
            <strong>Reveal together.</strong> Open the answer. Discuss what surprised the class
            — usually the outliers (e.g. Monaco's GDP per capita, Afghanistan's literacy rate).
          </li>
          <li>
            <strong>Compare to a baseline.</strong> Open the same indicator on the{' '}
            <Link to="/atlas">Data Atlas</Link> to see the full ranked table. Students often
            misjudge by an order of magnitude — the table corrects that fast.
          </li>
          <li>
            <strong>Extension (optional).</strong> Send pairs to pick one country from the
            ranked list and explain to the class why it lands where it does.
          </li>
        </ol>

        <h2>Discussion prompts to keep handy</h2>
        <ul>
          <li>"Is this map showing a number per person, or a total? How does that change which countries look big?"</li>
          <li>"If we showed this same map 50 years ago, what would be different?"</li>
          <li>"What's a country you'd want to ask a question of, after seeing this?"</li>
          <li>"Find a country that's an outlier from its neighbors. What might explain that?"</li>
        </ul>

        <h2>What's behind the data</h2>
        <p>
          Every dataset is sourced from open data: World Bank Open Data, Our World in Data, and
          REST Countries. Source and year are attributed on every map. We snapshot at build
          time, so the same number is shown to every student — important for class consistency.
        </p>

        <h2>Other modes worth knowing about</h2>
        <ul>
          <li>
            <Link to="/year-mode">Guess the Year</Link> — same idea, but the dataset is named
            and the year is hidden. Great for showing how internet use, life expectancy, and
            urbanization have changed since 2000.
          </li>
          <li>
            <Link to="/archive">Past Challenges</Link> — replay any of the last 30 days. Use
            this if you want to align the puzzle to a topic you're already teaching this week.
          </li>
          <li>
            <Link to="/blog">Stories &amp; rankings</Link> — short articles built from the same
            data. Useful as homework reading.
          </li>
        </ul>

        <h2>Free, forever</h2>
        <p>
          No paywalls planned. No login. No data collected from students. If your school's web
          filter blocks unfamiliar sites, the domain is <code>worldofthemaps.com</code> — happy
          to be allowlisted alongside any open-data source you already use.
        </p>

        <p>
          Have a suggestion, a lesson idea, or want a specific dataset added?{' '}
          <a href="mailto:mirotammi44@gmail.com">Email us</a>. We read every note.
        </p>
      </main>
      <Footer />
    </div>
  )
}
