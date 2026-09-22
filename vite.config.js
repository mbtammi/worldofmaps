import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],

  build: {
    // Production build optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production (keep console.error and console.warn)
        drop_console: false, // We handle this with our logger utility
        drop_debugger: true,
        pure_funcs: ['console.log'] // Only remove console.log specifically
      }
    },
    // Optimize bundle size. Vendor chunk splitting only applies to the client build;
    // in the SSR/prerender build these deps are external, so manualChunks would error.
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            // Function form, not the array form. The array form only matched the CJS
            // *factory* modules, so Rollup hoisted the interop helper and the evaluated
            // React namespace into globe-vendor and made the entry chunk statically import
            // it. Result: every prerendered content page — the atlas and blog pages search
            // traffic actually lands on — had to download, parse and evaluate 1.69MB of
            // three.js before any of its own code ran, for a page with no globe on it.
            manualChunks(id) {
              // Rollup's CJS interop helpers are virtual modules (\0-prefixed). They must
              // land beside React or the hoisting comes straight back.
              if (id.includes('commonjsHelpers') || id.startsWith('\0')) return 'react-vendor'
              if (!id.includes('node_modules')) return undefined
              if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor'
              if (
                /node_modules\/(three|react-globe\.gl|globe\.gl|topojson|d3-|kapsule|accessor-fn|float-tooltip|tinycolor2|index-array-by|data-joint|@tweenjs)/.test(
                  id,
                )
              ) {
                return 'globe-vendor'
              }
              return undefined
            }
          }
    },
    // Generate source maps for debugging production issues
    sourcemap: false, // Disable for security in production
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  },

  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    open: false
  },

  // Preview server configuration (for testing production build locally)
  preview: {
    port: 4173,
    strictPort: false
  }
}))
