// Single source of truth for per-route SEO metadata.
// Consumed both by the <SEO> component (client-side, runtime tag updates) and by
// scripts/prerender.mjs (build-time, injects crawler-visible <head> tags into static HTML).
// Plain JS (no JSX) so the Node prerender script can import it directly.

export const SITE_URL = 'https://worldofthemaps.com'
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

export const ROUTE_META = {
  '/': {
    path: '/',
    title: 'World of Maps | Daily Geography & Data Guessing Game',
    description:
      "Play today's free geography puzzle: identify the real global dataset shaded on a 3D globe. A new mystery map every day.",
    keywords: [
      'daily geography game',
      'geography quiz',
      'map guessing game',
      'world data game',
      'geoguessr alternative',
    ],
  },
  '/landing': {
    path: '/landing',
    title: 'World of Maps | Daily Geography & Data Guessing Game',
    description:
      'Play a free daily geography & world data guessing game. Identify real global datasets on an interactive 3D globe — like GeoGuessr meets Wordle.',
    keywords: [
      'geography game',
      'daily geography game',
      'map guessing game',
      'geoguessr alternative',
      'world data quiz',
    ],
  },
  '/play': {
    path: '/play',
    title: 'Free Play | World of Maps Geography Game',
    description:
      'Play unlimited rounds of the World of Maps geography data game. Guess real global datasets visualized on a 3D globe — no daily limit.',
    keywords: [
      'free geography game',
      'unlimited map game',
      'world data quiz',
      'geography practice',
    ],
  },
  '/atlas': {
    path: '/atlas',
    title: 'World Data Atlas — Maps & Country Rankings | World of Maps',
    description:
      'Browse interactive world maps with full country rankings — GDP, population density, life expectancy, internet use, energy, the environment and more. Built on real open data.',
    keywords: [
      'world data atlas',
      'country rankings',
      'world maps by country',
      'gdp by country',
      'population density map',
    ],
  },
  '/year-mode': {
    path: '/year-mode',
    title: 'Guess the Year — Year Mode | World of Maps',
    description:
      'A daily geography puzzle with a twist: look at how the world map changes over time, then guess what year you\'re seeing. Internet usage went from 0% to 80%+ in 25 years — can you tell which year?',
    keywords: [
      'guess the year game',
      'historical world map',
      'geography time puzzle',
      'year mode world of maps',
    ],
  },
  '/archive': {
    path: '/archive',
    title: 'Daily Map Archive | World of Maps',
    description:
      'Catch up on past World of Maps daily challenges. Replay any map from the last 30 days — archive plays don\'t affect your daily streak.',
    keywords: ['daily map archive', 'past geography puzzles', 'world of maps archive'],
  },
  '/blog': {
    path: '/blog',
    title: 'Blog — World Data Stories & Rankings | World of Maps',
    description:
      'Rankings, explainers and stories built from real global data: the countries that lead and lag on GDP, life expectancy, energy, the environment and more.',
    keywords: ['world data blog', 'country rankings', 'geography facts', 'data stories'],
  },
  '/about': {
    path: '/about',
    title: 'About World of Maps | Daily Geography & Data Guessing Game',
    description:
      "World of Maps turns real global datasets into a daily 3D-globe guessing game. Learn how it works, our open-data sources, and who it's for.",
    keywords: [
      'about world of maps',
      'geography game',
      'world data game',
      'geoguessr alternative',
    ],
  },
  '/how-to-play': {
    path: '/how-to-play',
    title: 'How to Play | World of Maps Daily Geography Game',
    description:
      'Learn how to play World of Maps: read the shaded 3D globe, guess which real-world dataset it represents, and share your spoiler-free result.',
    keywords: [
      'how to play world of maps',
      'geography guessing game rules',
      'daily map game',
    ],
  },
}

// Routes that are static enough to prerender to crawler-visible HTML at build time.
// The game routes ('/', '/play') stay client-rendered (they need the browser + live data).
export const PRERENDER_ROUTES = ['/landing', '/about', '/how-to-play', '/atlas', '/blog', '/archive', '/year-mode']
