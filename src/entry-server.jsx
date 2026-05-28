import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import AppRoutes from './AppRoutes'

// Build-time only: render a route's component tree to an HTML string.
// Consumed by scripts/prerender.mjs after the SSR bundle is built.
export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>,
  )
}
