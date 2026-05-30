// Posts a daily teaser to Bluesky pointing at today's World of Maps puzzle.
//
//   BSKY_HANDLE=... BSKY_APP_PASSWORD=... node scripts/post-daily-social.mjs
//
// Driven by .github/workflows/daily-post.yml on cron. Exits 0 with a "no creds, skipping"
// message when either secret is missing — that way the workflow stays green until the user
// is ready to activate it, and re-enabling is just adding the secrets.
//
// Bluesky's API is plain JSON HTTPS, no SDK needed. Posts are text-only here; Bluesky's
// link unfurler will pick up the OG image automatically when it sees worldofthemaps.com.
//
// Uses only Node's built-in fetch (no devDeps). Safe to run from any GitHub Actions runner.

const HANDLE = process.env.BSKY_HANDLE
const APP_PASSWORD = process.env.BSKY_APP_PASSWORD
const PDS = process.env.BSKY_PDS || 'https://bsky.social'

if (!HANDLE || !APP_PASSWORD) {
  console.log('BSKY_HANDLE or BSKY_APP_PASSWORD not set — skipping post.')
  console.log('To activate: add both as repo secrets in GitHub Settings → Secrets and variables → Actions.')
  process.exit(0)
}

const SITE = 'https://worldofthemaps.com'
const TEASERS = [
  "Today's World of Maps puzzle: can you guess which global dataset the map represents?",
  'Daily geography brain warm-up — read the map, guess the data.',
  "What does the world look like today? Pick the dataset behind today's map.",
  '🌍 Today\'s map mystery is live. Solve in as few guesses as possible.',
  'Globe + 10 options + 3 minutes = today\'s puzzle.',
]

// Deterministic teaser pick — same teaser for same day, varies day-to-day.
function pickTeaser() {
  const epoch = Math.floor(Date.now() / 86400000)
  return TEASERS[epoch % TEASERS.length]
}

async function createSession() {
  const r = await fetch(`${PDS}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: HANDLE, password: APP_PASSWORD }),
  })
  if (!r.ok) throw new Error(`createSession failed: HTTP ${r.status} — ${await r.text()}`)
  return r.json()
}

async function createPost(session, text) {
  // Compute byteStart/byteEnd of the URL within the text for the link facet.
  const enc = new TextEncoder()
  const urlIdx = text.indexOf(SITE)
  const facets = []
  if (urlIdx >= 0) {
    const byteStart = enc.encode(text.slice(0, urlIdx)).length
    const byteEnd = byteStart + enc.encode(SITE).length
    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: SITE }],
    })
  }
  const record = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: new Date().toISOString(),
    langs: ['en'],
    facets,
  }
  const r = await fetch(`${PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessJwt}`,
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record,
    }),
  })
  if (!r.ok) throw new Error(`createRecord failed: HTTP ${r.status} — ${await r.text()}`)
  return r.json()
}

async function main() {
  const session = await createSession()
  const teaser = pickTeaser()
  const text = `${teaser}\n\n${SITE}`
  const result = await createPost(session, text)
  console.log(`✓ Posted: ${result.uri}`)
  console.log(`  text: ${text}`)
}

main().catch((e) => {
  console.error('✗ Daily post failed:', e.message)
  process.exit(1)
})
