import { Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Icon from './Icon'
import SEO from './SEO'
import { ROUTE_META } from '../seo/routeMeta'
import './Layout.css'

function HowToPlay() {
  return (
    <div className="page-with-nav">
      <SEO {...ROUTE_META['/how-to-play']} />
      <Header />
      
      <main className="page-content">
        <img src="/favicon.svg" width="52" height="52" alt="World of Maps educational globe icon" style={{float:'right',margin:'0 0 1rem 1rem'}} />
  <h1>How to Play the World of Maps Daily Geography Game</h1>
        
        <div className="instructions">
          <div className="step">
            <h2><Icon name="globe" /> 1. Analyze the Globe Visualization</h2>
            <p>Each country is shaded based on a real dataset (e.g. population density, life expectancy, GDP, renewable energy). Identify spatial clusters, outliers and continental contrasts.</p>
          </div>
          
          <div className="step">
            <h2><Icon name="question" /> 2. Make a Data-Driven Guess</h2>
            <p>Enter or select what you think the dataset represents: demographics, economy, environment, health, infrastructure, technology or education indicators.</p>
          </div>
          
          <div className="step">
            <h2><Icon name="target" /> 3. Narrow It Down</h2>
            <p>You get <strong>5 guesses</strong>. A wrong one is struck off the list, so each miss narrows the field — but run out and the map is lost for the day. The fewer tries you need, the better your score, and you carry that intuition into the next day's map.</p>
          </div>
          
          <div className="step">
            <h2><Icon name="share" /> 4. Share &amp; Compare</h2>
            <p>Post your spoiler-safe grid to friends or study groups. Encourage competition while spreading world data literacy.</p>
          </div>
        </div>
        
        <div className="tips">
          <h2>Tips for Faster Geography Recognition</h2>
          <ul>
            <li>Trace continent-by-continent intensity—does Africa lag or lead? Are Nordics clustered?</li>
            <li>Relate patterns to development, climate zones, resource access or demographics.</li>
            <li>Eliminate quickly: rule out options that clearly don't match the regional pattern.</li>
            <li>Remember high-income economies often correlate with health, internet and education metrics.</li>
          </ul>
        </div>

        <h2>Other ways to play</h2>
        <ul>
          <li>
            <strong><Link to="/year-mode">Guess the Year mode</Link></strong> — the dataset is
            named ("Internet Users"), the year is hidden. Slide to a year between 2000 and 2024
            and see how close you got. Stats are tracked separately from the daily streak.
          </li>
          <li>
            <strong><Link to="/archive">Past challenges archive</Link></strong> — replay any of
            the last 30 days. Doesn't affect your daily streak, so it's safe to catch up.
          </li>
          <li>
            <strong>Hard mode</strong> — open the ⋯ menu on the daily game and toggle it on.
            You'll see 4 options instead of 10 (3 wrong + 1 correct) and get 2 guesses instead
            of 5. The page reloads to apply the new option count, and shares switch to
            <code>N/2</code> with a hard-mode tag.
          </li>
          <li>
            <strong>Challenge a friend</strong> — after you solve today's puzzle, the win screen
            has a "Challenge a friend" button. Sends a link that lands them on the same
            puzzle with your score visible: "they solved in 2/5 — can you?"
          </li>
        </ul>

        <h2>Explore the data behind the maps</h2>
        <p>
          When you're done playing, the <Link to="/atlas">Data Atlas</Link> has one page per
          dataset with the full ranked country table, key stats, and the data source. The{' '}
          <Link to="/blog">blog</Link> has short rankings posts ("the 10 countries with the
          highest internet usage" etc.) built from the same numbers.
        </p>
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to play World of Maps',
            description:
              'Identify which real global dataset is shaded onto a 3D globe, in as few guesses as possible.',
            totalTime: 'PT2M',
            step: [
              {
                '@type': 'HowToStep',
                position: 1,
                name: 'Analyze the globe visualization',
                text: 'Each country is shaded based on a real dataset (e.g. population density, life expectancy, GDP, renewable energy). Identify spatial clusters, outliers and continental contrasts.',
              },
              {
                '@type': 'HowToStep',
                position: 2,
                name: 'Make a data-driven guess',
                text: 'Select what you think the dataset represents: demographics, economy, environment, health, infrastructure, technology or education indicators.',
              },
              {
                '@type': 'HowToStep',
                position: 3,
                name: 'Narrow it down',
                text: 'You get 5 guesses. Each wrong answer is struck off the list, narrowing the field — but run out and the map is lost for the day.',
              },
              {
                '@type': 'HowToStep',
                position: 4,
                name: 'Share and compare',
                text: 'Post your spoiler-safe grid to friends or study groups to compare guess counts without revealing the answer.',
              },
            ],
          }),
        }}
      />
    </div>
  )
}

export default HowToPlay