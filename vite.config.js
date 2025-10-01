import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
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
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom'],
          'globe-vendor': ['react-globe.gl', 'topojson-client']
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
})
