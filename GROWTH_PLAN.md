# World of Maps — Growth Plan

A working document. Built from the analysis in this thread + a code-grounded
investigation. Items are sized so we can execute one at a time.

## Where we are

- 100 prerendered URLs (5 content pages + 83 atlas pages + `/atlas` + `/blog` + 10 listicles)
- Daily rotation now constrained to 83 runtime-validated datasets (no more sparse-data console errors)
- Self-hosted topojson + SVG OG image + auto-generated sitemap + per-route SEO meta
- Share system works (image + text); blog has 10 programmatic listicles live
- 1.7 MB globe chunk code-split out of the main JS bundle

What's missing: the parts of a daily game that **drive organic growth** — the share-loop, the streak hook, the past-days archive, and a handful of quirky datasets that actually want to be shared.

## Guiding principles

- **Lean.** No new runtime services, no new API keys. Build-time tools and existing free APIs (World Bank, OWID, REST Countries) only.
- **Compound.** Every feature should reinforce another. (E.g. the past-days archive is retention + 90 new SEO pages + lets us do "yesterday's was X" callbacks.)
- **Ship the share first.** A daily game with a broken share format can't grow no matter what else is fixed.

## Two findings worth flagging up front

1. **`shareUtils.js` line 22 leaks the dataset title into the share text.** Today's share says *"GDP per Capita"* in clear text. Wordle and every successful clone go to extreme lengths to avoid this — the share has to be a tease, not a reveal.
2. **`gameStats.js` already tracks streaks, guess histograms, fastest-time, first-try wins.** `getLeaderboardData()` has `Win Streak` and `Games Played` commented out (lines 256–263). The data exists; the UI just doesn't surface it. Ship cost is mostly markup.

---

## The plan, by tier

Effort tags: **S** ≤ ½ day · **M** 1–2 days · **L** 3–5 days. Impact tags: **🔥** = growth multiplier, **⭐** = strong retention, **📈** = SEO, **🛠️** = polish.

### Tier 1 — Growth multipliers (do first)

#### 1. Share-format revamp 🔥 — **S**

**Goal.** Make every share a hook, not a spoiler. Mirror Wordle/Worldle's pattern: instantly recognizable visual fingerprint + curiosity-inducing tease + URL.

**Why.** Wordle's grid carried ~80% of Wordle's growth. The share is the only piece of game content that travels into feeds where non-players see it. Currently ours leaks the answer in line 1 of the text.

**Build.**
- Rewrite `generateShareText()` to never include `datasetTitle`. New format candidate:
  ```
  🌍 World of Maps · Day 57
  ✅ 2/10 · ⚡ 18s
  🟥🟩
  worldofthemaps.com
  ```
- Add a "share line" we can encourage people to paste — one line, emoji-only summary, exactly like Wordle.
- The story image (9:16) — verify it doesn't render the dataset title anywhere visible. Replace with the globe + outcome glyphs + day number + URL. Currently it correctly hides the title (per the code comment) — verify against the actual output.
- Add a global-average comparison line when we beat it: *"Beat the global average (3.4 guesses) 🏆"* — same data we already fetch.
- Optional but high-impact: a numeric "share rank" — *"Day 57 · #142 to solve today"* — exists in Firestore if we count.

**Files.** `src/data/shareUtils.js`, possibly `src/components/ShareSheet.jsx`, story-image generator.

**Acceptance.** Share text never contains the dataset title. Pasting it into Slack/Twitter shows a recognizable fingerprint. A non-player seeing the share understands the game in 2 seconds.

#### 2. Streaks + a real stats screen ⭐ — **S**

**Goal.** Surface what we're already tracking — make the streak the dopamine hit it should be, and ship a Wordle-style stats modal.

**Why.** Daily games live or die on the streak. The "🔥 7-day streak" indicator is the single biggest reason users return. We're collecting the data and showing none of it.

**Build.**
- Uncomment + redesign the stats panel in `DailyGame.jsx` to show: current streak, max streak, win %, average guesses, fastest solve.
- Add a stats *modal* triggered from a small "📊" icon in the top-right (was a placeholder, now real). Show the full guess histogram (1/10, 2/10, etc. with bars) — this is the visual Wordle made iconic.
- On a streak milestone (3, 7, 14, 30, 100), fire a small celebration (confetti or themed toast).
- Day-rollover logic: if `lastPlayedDate` was yesterday → streak continues. If older → reset. Already partly implemented; verify the edges.
- Persist `maxWinStreak` (already there).

**Files.** `src/components/DailyGame.jsx`, `src/data/gameStats.js` (small edits), new `src/components/StatsModal.jsx`.

**Acceptance.** A returning user sees "🔥 N-day streak" front-and-centre. Clicking 📊 opens a modal with histogram + key metrics. Missing a day correctly resets to 0.

#### 3. Past challenges archive 🔥📈 — **M**

**Goal.** Add `/daily/:date` routes letting users play any past day. Three wins: retention (lapsed users can catch up), SEO (~90 new indexable pages/year), and unlocks "yesterday's answer" features.

**Why.** Every other successful daily game has an archive. NYT Connections, Worldle, Globle all do this. It's both a habit-repair tool and free SEO content.

**Build.**
- New route `/daily/:dateOrIndex` rendering the daily game UI but with `getDatasetByDate()` (already exists in `dailyChallenge.js`).
- New `/archive` index page listing recent past days in a calendar grid (or simple list).
- Past-day completions don't break the streak (or do — design choice; recommend: don't, but reward them with a separate "archived" badge).
- The day's static info (dataset title after solve, global avg, etc.) is server-rendered at prerender time → these are 90+ prerenderable URLs, each with the dataset's name in title for SEO.
- Add to the prerender pipeline and sitemap.
- Link from the win screen ("Missed yesterday? Play Day 56 →").

**Files.** `src/AppRoutes.jsx`, new `src/components/ArchiveIndex.jsx`, new daily-game wrapper that accepts a date prop, `scripts/prerender.mjs`, `src/seo/routeMeta.js`.

**Acceptance.** Visiting `/daily/2026-05-15` plays that day's dataset. `/archive` lists ~30 most recent days. Sitemap auto-includes them. View source on `/daily/2026-05-15` shows the day's metadata in the static HTML.

#### 4. Quirky/viral datasets expansion 🔥 — **M**

**Goal.** Add 5–10 datasets that *want* to be shared. The maps that go viral are unexpected ones, not GDP.

**Why.** Of your 83 validated datasets, most are policy-flavoured. The "share-bait" datasets are the unexpected ones: things that surprise people, prompt arguments, or get screenshot-shared. These also dominate Reddit/Twitter for geography content.

**Build.**
- Re-enable the OWID datasets currently commented out in `dataSources.js`: happiness index, democracy index, press freedom, corruption perception, peace index, innovation index (these all have known stable paths or can use proxies).
- Add a small set of new "quirky" indicators (verify a source first — only ship the ones that pass the quality gate):
  - **McDonald's per capita** — can derive from public data (e.g. official "McDonald's locations" lists by country)
  - **Coffee consumption** — already in OWID list, re-enable
  - **Alcohol consumption** — already in OWID list, re-enable
  - **Average height** (NCD-RisC has open data)
  - **Median age** (UN Population Division)
  - **Vehicles per 1000 people** (World Bank-adjacent)
- Run `npm run atlas:data` to re-snapshot. Each successful one auto-becomes a new atlas page, a new daily-rotation candidate, and a new listicle if we re-run `blog:listicles`.

**Files.** `src/data/dataSources.js`, possibly `scripts/build-atlas-data.js` (if we need new fetchers), `scripts/generate-listicles.js` (extend curated list).

**Acceptance.** At least 5 new datasets pass the runtime quality gate. Each gets an atlas page + listicle. The daily rotation auto-includes them on next `atlas:data` run.

---

### Tier 2 — Retention & game-feel

#### 5. "Guess the Year" mode ⭐ — **M**

**Goal.** A second game mode using the same data infrastructure. The README has promised this for ~2 years.

**Why.** Mode variety extends per-user session time. The data layer already fetches multi-year windows, so this is mostly UI + state-machine work.

**Build.**
- Route: `/year-mode` (or `/year-mode/:date`).
- Mechanic: show a known dataset (e.g. "GDP per Capita") with no year label, player guesses which year (multiple choice or slider).
- Share format separate from daily-mode share.
- Different stats bucket from daily so the streaks don't mix.

**Files.** New `src/components/YearGame.jsx`, `src/data/yearChallenge.js` (mirror of `dailyChallenge.js`), routes, prerender.

**Acceptance.** Standalone playable mode. Distinct share. Doesn't impact daily streak.

#### 6. Yesterday's reveal ⭐ — **S**

**Goal.** A small *"Yesterday's map was 🟢 GDP per Capita (solved by 67% in 3.4 guesses)"* line on the daily game.

**Why.** Continuity. Reminds returning users this is a series. Adds social-proof number ("67% solved it") without leaderboards.

**Build.** Read `getDatasetByDate(today - 1)` + Firestore daily stats for that day. Cache 24h.

**Files.** `src/components/DailyGame.jsx`, possibly `api/dailyStats.js` (already aggregates this).

**Acceptance.** Yesterday's data appears subtly on today's game screen. Doesn't spoil today.

#### 7. First-day onboarding ⭐ — **S**

**Goal.** A 30-second interactive 2-puzzle tutorial for first-time visitors that's better than the current "10-second instructions overlay."

**Why.** First-time daily-game drop-off is brutal. The current overlay is too easy to dismiss without understanding.

**Build.**
- Detect first visit (no `worldofmaps_stats` in localStorage).
- Show a guided 1-puzzle walkthrough using a fixed dataset (something obvious like Population Density) with annotation tooltips: "See how Asia and Africa are darker? That hints at which dataset this is."
- After the tutorial, drop them into today's actual challenge.

**Files.** New `src/components/Onboarding.jsx`, `src/components/DailyGame.jsx`.

**Acceptance.** New users see the tutorial once. Returning users never see it.

#### 8. Hard mode ⭐ — **S**

**Goal.** A toggle that gives only 4 options instead of 10, for returning players who find the daily too easy.

**Why.** Skilled players currently top out — there's no progression beyond "I solved in 1 guess again." Hard mode lets them re-engage.

**Build.** Toggle in the menu. Modifies the option-generation in `dataFetcher.generateDatasetMetadata`. Tracks hard-mode wins separately in stats.

**Files.** `src/data/dataFetcher.js`, `src/components/DailyGame.jsx`, `src/data/gameStats.js`.

**Acceptance.** Hard mode is opt-in. Stats track it separately. Streak doesn't conflate easy/hard wins.

---

### Tier 3 — Discoverability (low code, high leverage)

#### 9. OG image: SVG → PNG 📈 — **S**

**Goal.** Rasterize `public/og-image.svg` to PNG at prerender time so Facebook/LinkedIn/Twitter actually render it.

**Why.** SVG OG images are a known dead-end on most social platforms. This is the single biggest free fix to link-preview shares.

**Build.** Use `satori` + `@resvg/resvg-js` or a tiny puppeteer snapshot at prerender time. Output to `public/og-image.png`. Update meta tags. Could also generate per-route OG variants for atlas pages (huge bonus — each atlas page gets its own social card).

**Files.** New `scripts/build-og-images.mjs`, `index.html`, prerender script.

**Acceptance.** Pasting `worldofthemaps.com` into Slack/Discord/LinkedIn shows the image preview. Bonus: pasting an atlas URL shows that map's branded card.

#### 10. Auto-posted social account 🔥 — **S**

**Goal.** A Twitter/X (and/or Bluesky) account that posts the day's puzzle screenshot + URL at 7am Helsinki, automatically.

**Why.** Free daily distribution. Geography accounts retweet these readily. Zero ongoing work once wired up.

**Build.** GitHub Action (cron) → fetches today's dataset → renders the spoiler-safe story image → posts via API. Bluesky has a free API. Twitter requires a developer account (free tier exists). Mastodon also free.

**Files.** New `.github/workflows/daily-post.yml`, `scripts/post-daily-social.mjs`.

**Acceptance.** A new tweet/post lands daily at 7am with the day's puzzle image, no manual intervention.

#### 11. Submit to directories + Search Console 📈 — **S**

**Goal.** Get listed in the places that aggregate daily games and educational tools.

**Build.** No code — a one-day push:
- Submit `sitemap.xml` to Google Search Console + Bing Webmaster Tools.
- Enable IndexNow (one HTTP POST per new URL).
- Submit to: WordleAlternatives, Word Hippo's daily games list, PuzzleNation, edshelf, classtools.net.
- Cross-link with similar daily games where there's a mutual fit.

**Acceptance.** Listed in ≥5 directories. GSC + Bing both indexing.

#### 12. Reddit + Hacker News push 🔥 — **S** (people-cost, not code)

**Goal.** Single, well-prepared "Show HN" + 3 well-prepared subreddit posts.

**Build.** No code — preparation only. Post once, well, on:
- HN Show HN: lead with the unique angle ("Wordle for global data — guess what the world map represents")
- r/wordlegames, r/dataisbeautiful, r/geography — different framing each (game/data/educational).

**Acceptance.** Posts go up after Tier 1 is done. Track referral traffic.

#### 13. Teachers landing page ⭐ 📈 — **S**

**Goal.** A `/for-teachers` page with a one-page lesson plan + sample maps + classroom usage tips.

**Why.** Geography is a curriculum subject. A clean teacher-facing page gets shared in teacher subreddits/newsletters and is durable referral traffic. No login required.

**Build.** A single static page + lesson PDF download.

**Files.** New `src/components/ForTeachers.jsx`, route, sitemap.

**Acceptance.** Listed in 2–3 teacher resource directories. Mentioned in at least one classroom newsletter.

---

### Tier 4 — SEO depth (slow burn but compounding)

#### 14. Year variants of atlas pages 📈 — **M**

**Goal.** Generate `/atlas/gdp-per-capita-2024`, `/atlas/gdp-per-capita-2023` etc. for the top 20 datasets.

**Why.** "GDP per capita by country 2024" is a higher-volume query than "GDP per capita by country." Time-tagged pages rank for the date variants. Multiplies the SEO surface 3–5x without invented content.

**Build.** Extend `build-atlas-data.js` to snapshot multiple years where the data is available. Prerender each. Cross-link from the "current year" atlas page.

**Files.** `scripts/build-atlas-data.js`, `scripts/prerender.mjs`.

**Acceptance.** Top 20 datasets each have a current-year + 2 historical-year pages. Sitemap auto-includes.

#### 15. Compare pages 📈 — **M**

**Goal.** `/compare/gdp-per-capita/life-expectancy` — show two atlas tables side by side. Curated to ~30 high-interest pairs (not the full 83×83 = 6889).

**Why.** "GDP vs life expectancy by country" and similar comparisons are exactly what OurWorldInData ranks for. This is uncontested long-tail.

**Build.** New route + page component. Manual curation list of 30 pairs in `src/seo/comparePairs.js`. Prerender each.

**Files.** New `src/components/Compare.jsx`, new `comparePairs.js`, prerender.

**Acceptance.** 30 compare pages live, each linked from both contributing atlas pages.

#### 16. Inline internal linking 📈 — **S**

**Goal.** Every atlas page's intro paragraph should link inline to 2–3 related atlas/blog pages, not just the related-list at the bottom.

**Why.** Internal-linking density is one of the strongest 2026 SEO signals after the post-Helpful-Content updates.

**Build.** Add a helper that picks 2–3 related-by-category datasets and injects them into the intro paragraph at render time. Same for blog posts.

**Files.** `src/components/Atlas.jsx`, `src/components/BlogPost.jsx`.

**Acceptance.** Every atlas page has ≥3 outbound internal links in the first ~150 words.

---

### Tier 5 — Community & social proof

#### 17. Real player count 🛠️ — **S**

**Goal.** Replace the hard-coded `1001+` on Landing with a real number from Firestore daily stats.

**Why.** Honest numbers (even small) build more trust than inflated round ones. Also: a real number that grows is itself a metric we can show in PR-style posts.

**Build.** `api/playerCount.js` (or extend `dailyStats.js`). Cached 1h. Render at prerender time so it's in the static HTML.

**Files.** `api/dailyStats.js` or new endpoint, `src/components/Landing.jsx`, prerender.

**Acceptance.** Number on Landing reflects real cumulative players. Refreshes hourly.

#### 18. Send-to-a-friend / challenge mode ⭐ — **S**

**Goal.** A `/challenge/:dayIndex` URL that loads a specific past puzzle. Lets a player taunt a friend with "I solved Day 57 in 2 — can you?"

**Why.** Direct viral lever. Each challenge URL is a manually-targeted invite that converts way better than passive shares.

**Build.** Mostly piggybacks on the past-days archive (#3). Just a different framing/UI: "<Friend> challenged you to Day 57" header.

**Files.** Same as #3 + a tiny URL-param check.

**Acceptance.** Sending a `/challenge/57` link to a friend lands them on Day 57's puzzle with the challenger context visible.

#### 19. Comments / community fact-add on atlas pages — **L** (deferred)

**Goal.** Lightweight Disqus-style comments on atlas pages so power users can add context.

**Deferred** unless a clear demand signal emerges. Adds moderation overhead.

---

## Recommended sequence

**Week 1 — ship the share + the streak.** These are the two highest-impact items and together are ~1 day of work.

- Day 1: Item 1 (share revamp) + Item 17 (real player count).
- Day 2: Item 2 (streaks + stats UI).

**Week 2 — past days + quirky datasets.**

- Days 3–4: Item 3 (past-days archive).
- Day 5: Item 4 (quirky datasets) + re-snapshot.

**Week 3 — distribution.**

- Day 6: Item 9 (OG → PNG with per-atlas variants).
- Day 7: Item 10 (auto-post account) + Item 11 (directory submissions).
- Day 8: Item 13 (teachers page).
- Day 9–10: Item 12 (HN/Reddit push) — only after the above polish lands.

**Week 4+ — depth and modes.**

- Item 14 (year variants), Item 15 (compare pages), Item 6 (yesterday's reveal), Item 7 (onboarding), Item 16 (inline linking).
- Item 5 (Guess the Year) and Item 8 (hard mode) when you want fresh mechanics.

**Item 18 (challenge URLs)** falls out for free as part of Item 3.

## Out of scope (deliberately not building, for now)

- Native mobile app (PWA already works fine; native is a 10x effort for incremental gain right now)
- Multiplayer / live games
- Account system + cross-device sync (localStorage is enough; revisit if retention asks for it)
- Comments (Item 19) until a community shows up to use them
- Paid tier (revisit only after organic traction is real)

---

## Tracking

I'll create a task per Tier-1 item when we start so progress is visible. Tier-2+ get tasks as we begin them. The roadmap log at `~/.claude/plans/analyze-this-entire-code-keen-matsumoto.md` records what's shipped; this file is the forward plan.
