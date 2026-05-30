import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import About from './components/About'
import HowToPlay from './components/HowToPlay'
import AtlasIndex from './components/AtlasIndex'
import Atlas from './components/Atlas'
import BlogIndex from './components/BlogIndex'
import BlogPost from './components/BlogPost'
import ArchiveIndex from './components/ArchiveIndex'
import NotFound from './components/NotFound'
import './App.css'

// The game routes pull in the heavy 3D globe (react-globe.gl / three.js, ~1.7MB) and
// require the browser. Lazy-load them so they are code-split on the client and excluded
// from the server/prerender bundle's eager graph (these routes are never prerendered).
const DailyGame = lazy(() => import('./components/DailyGame'))
const FreePlayGame = lazy(() => import('./components/FreePlayGame'))
const YearGame = lazy(() => import('./components/YearGame'))

function GameFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '2.5rem',
        background: '#0b2545',
      }}
    >
      🌍
    </div>
  )
}

// Router-agnostic route table, shared by the client (BrowserRouter) and the
// build-time prerender (StaticRouter).
export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<GameFallback />}>
            <DailyGame />
          </Suspense>
        }
      />
      <Route
        path="/daily/:date"
        element={
          <Suspense fallback={<GameFallback />}>
            <DailyGame />
          </Suspense>
        }
      />
      <Route
        path="/challenge/:date"
        element={
          <Suspense fallback={<GameFallback />}>
            <DailyGame />
          </Suspense>
        }
      />
      <Route path="/archive" element={<ArchiveIndex />} />
      <Route
        path="/year-mode"
        element={
          <Suspense fallback={<GameFallback />}>
            <YearGame />
          </Suspense>
        }
      />
      <Route path="/landing" element={<Landing />} />
      <Route
        path="/play"
        element={
          <Suspense fallback={<GameFallback />}>
            <FreePlayGame />
          </Suspense>
        }
      />
      <Route path="/about" element={<About />} />
      <Route path="/how-to-play" element={<HowToPlay />} />
      <Route path="/atlas" element={<AtlasIndex />} />
      <Route path="/atlas/:datasetId" element={<Atlas />} />
      <Route path="/blog" element={<BlogIndex />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
