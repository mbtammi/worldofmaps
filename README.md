# World of Maps 🌍

A daily geography + data guessing game. Every day a new world map is shaded by a real global dataset (GDP, life expectancy, internet usage, …) and your job is to figure out what the map represents. Spoiler-safe sharing, daily streaks, a 30-day archive, and a separate "guess the year" mode.

Live at **[worldofthemaps.com](https://worldofthemaps.com)**.

## What's in here

**Game modes**

- **Daily** (`/`) — today's puzzle, 10 options, picked deterministically from a validated 88-dataset pool.
- **Year mode** (`/year-mode`) — same idea, but the dataset is named and the year is hidden. Shows how the world has changed since 2000.
- **Hard mode** — toggle in the menu, drops the puzzle from 10 options to 4 (3 wrong + 1 correct).
- **Past challenges** (`/archive`) — replay any of the last 30 days. Doesn't affect your daily streak.
- **Friend challenge** (`/challenge/:date?score=N&mode=hard`) — invite link with the inviter's score visible.

**Content (prerendered for SEO)**

- **`/atlas/:dataset`** — one indexable page per dataset (88 of them), with a CSS top-10 bar chart, the full ranked country table, key stats, methodology, `Dataset` JSON-LD, and inline cross-links to 2 related datasets.
- **`/blog`** — programmatic listicles built from the same snapshots (no AI, no hallucinations, real numbers).
- **`/for-teachers`** — a single-page classroom outline + discussion prompts.

## Stack

- **React 19 + Vite** — SPA with code-split routes.
- **react-globe.gl** + a self-hosted world-atlas topojson — interactive 3D globe; topojson committed in `public/` so there's no runtime CDN dependency.
- **Zero-dep build-time SSG** — `react-dom/server` + React Router's `StaticRouter` + `scripts/prerender.mjs`. No `vite-react-ssg`, no puppeteer. 138 prerendered URLs.
- **Upstash Redis** for global game stats (per-day plays / wins / histograms via `api/dailyStats.js` + `api/submitResult.js`). Optional — falls back to in-memory if not configured.
- **Vercel** for hosting + serverless `/api/*`.

## Data

Three sources, all open + free:

- **World Bank Open Data** — most economic / demographic / health indicators.
- **Our World in Data** Grapher CSVs — happiness, democracy, press freedom, corruption, alcohol consumption.
- **REST Countries** — land area, languages, timezones.

All datasets are **snapshotted at build time** and committed under `public/data/atlas/*.json`. The runtime daily-game fetcher reads from these snapshots first, falling back to the live API only if the snapshot is missing. This means the daily game serves from same-origin static JSON in production — fast, reliable, no rate-limit risk.

Multi-year snapshots for year-mode live at `public/data/year/*.json`.

## Commands

```sh
npm install
npm run dev        # vite dev server

npm run build      # full prod build:
                   #   og:build  → rasterize public/og-image.svg → og-image.png
                   #   blog:data → content/blog/*.md → public/data/blog/*.json
                   #   vite build (client)
                   #   vite build --ssr (server)
                   #   prerender.mjs → 138 static HTML files

npm run atlas:data # refresh atlas snapshots (network heavy)
npm run year:data  # refresh year-mode snapshots
npm run blog:listicles  # regenerate the programmatic blog posts
```

## Project structure (the important bits)

```
public/
  data/atlas/<id>.json        # snapshot per validated dataset
  data/year/<id>.json         # multi-year snapshot per year-mode dataset
  data/blog/<slug>.json       # generated blog HTML + frontmatter
  countries-110m.json         # self-hosted topojson
  og-image.png                # rasterized OG card
src/
  AppRoutes.jsx               # routes, lazy game routes, atlas/blog/archive/year-mode
  entry-server.jsx            # the SSR/prerender entry
  components/
    DailyGame.jsx             # the main game, past-day and challenge modes too
    YearGame.jsx              # /year-mode
    Atlas.jsx                 # /atlas/:datasetId
    BlogIndex.jsx, BlogPost.jsx
    ArchiveIndex.jsx
    ForTeachers.jsx
    StatsModal.jsx, OnboardingTutorial.jsx
  data/
    dailyChallenge.js         # rotation, validated allowlist, past-day lookup
    dataFetcher.js            # snapshot-first runtime fetcher
    validDatasets.js          # auto-generated allowlist (do not edit)
    yearChallenge.js          # /year-mode rotation
scripts/
  build-atlas-data.js         # WB + REST + OWID snapshot builder
  build-year-data.js          # multi-year snapshot builder
  build-blog-data.js          # md → json
  build-og-image.mjs          # SVG → PNG rasterizer
  prerender.mjs               # the SSG step
  post-daily-social.mjs       # Bluesky daily post (dormant until secrets added)
.github/workflows/
  daily-post.yml              # cron for the Bluesky post
GROWTH_PLAN.md                # forward roadmap
```

## Roadmap

See **[GROWTH_PLAN.md](./GROWTH_PLAN.md)**. The five-tier plan covers growth multipliers (share format, streaks, archive, quirky data), retention features (year mode, onboarding, hard mode, yesterday's reveal), distribution (OG PNG, social auto-post, teachers page), SEO depth (year variants, compare pages, inline linking), and community (real player count, friend-challenge URLs). Tiers 1 and 2 are fully shipped; most of Tier 3 and the small Tier 4/5 items are done as of this README.
