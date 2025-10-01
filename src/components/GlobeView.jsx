import { useRef, useEffect, useState, useMemo } from 'react'
import Globe from 'react-globe.gl'
import { feature } from 'topojson-client'
import './GlobeView.css'

function GlobeView({ dataset, showTooltips = false }) {
  const globeEl = useRef()
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 600 })
  const [countries, setCountries] = useState([])
  const [globeImageUrl, setGlobeImageUrl] = useState(null)
  const [atmosphereColor, setAtmosphereColor] = useState('#4a90e2')
  const [backgroundColor, setBackgroundColor] = useState('rgba(0,0,0,0)')
  const [themeUpdateTrigger, setThemeUpdateTrigger] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Convert dataset to lookup object - memoized for performance
  const dataMap = useMemo(() => {
    if (!dataset?.data) return { 'US': 36, 'CN': 153, 'IN': 464 }
    
    const map = {}
    dataset.data.forEach(item => {
      // Add entries for both ISO codes and name
      map[item.iso_a2] = item.value
      map[item.iso_a3] = item.value
      map[item.name.toLowerCase()] = item.value
    })
    return map
  }, [dataset])

  // Memoize max value calculation
  const maxValue = useMemo(() => Math.max(...Object.values(dataMap)), [dataMap])

  // Update globe properties when theme changes
  useEffect(() => {
    const updateGlobeTheme = () => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      
      // Get globe image URL (texture). If none provided, synthesize a flat texture using water color
      const themeGlobeUrl = computedStyle.getPropertyValue('--globeImageUrl').trim()
      const themeWaterColor = computedStyle.getPropertyValue('--globeWaterColor').trim() || '#E6F7FF'
      if (themeGlobeUrl === 'null' || !themeGlobeUrl) {
        // Create (or reuse cached) data URL for flat color texture to avoid black oceans
        try {
          const cacheKey = `__flat_globe_${themeWaterColor}`
          let flatUrl = sessionStorage.getItem(cacheKey)
          if (!flatUrl) {
            const canvas = document.createElement('canvas')
            canvas.width = 2
            canvas.height = 1
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = themeWaterColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            flatUrl = canvas.toDataURL('image/png')
            sessionStorage.setItem(cacheKey, flatUrl)
          }
          setGlobeImageUrl(flatUrl)
        } catch (e) {
          setGlobeImageUrl(null)
        }
      } else {
        setGlobeImageUrl(themeGlobeUrl)
      }
      
      // Get atmosphere color
      const themeAtmosphereColor = computedStyle.getPropertyValue('--globeAtmosphereColor').trim()
      if (themeAtmosphereColor) {
        setAtmosphereColor(themeAtmosphereColor)
      }
      
      // Get background color (space / surrounding background or fallback water color behind sphere)
      if (themeWaterColor) setBackgroundColor(themeWaterColor)
      
      // Trigger theme update for color recalculation
      setThemeUpdateTrigger(prev => prev + 1)
    }
    
    updateGlobeTheme()
    
    // Listen for theme changes
    const observer = new MutationObserver(updateGlobeTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    
    return () => observer.disconnect()
  }, [])

  // Dynamic color scale based on CSS custom properties - optimized with theme support
  const getColor = useMemo(() => (value) => {
    if (!value || value === 0) {
      // Get no-data color from CSS custom property
      const noDataColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--noDataColor').trim() || '#4a5568'
      return noDataColor
    }
    
    const normalized = Math.min(value / maxValue, 1)
    
    // Get theme colors from CSS custom properties
    const startColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--dataColorStart').trim() || 'rgb(100, 180, 120)'
    const endColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--dataColorEnd').trim() || 'rgb(255, 100, 50)'
    
    // Parse RGB values
    const parseRGB = (rgbString) => {
      const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [100, 180, 120]
    }
    
    const [r1, g1, b1] = parseRGB(startColor)
    const [r2, g2, b2] = parseRGB(endColor)
    
    // Interpolate between start and end colors
    const red = Math.floor(r1 + (normalized * (r2 - r1)))
    const green = Math.floor(g1 + (normalized * (g2 - g1)))
    const blue = Math.floor(b1 + (normalized * (b2 - b1)))
    
    return `rgb(${red}, ${green}, ${blue})`
  }, [maxValue, themeUpdateTrigger])

  // Load countries data - optimized for faster loading
  useEffect(() => {
    // Use a smaller resolution for faster loading (110m instead of 50m)
    fetch('//unpkg.com/world-atlas/countries-110m.json')
      .then(res => res.json())
      .then(topology => {
        const countries = feature(topology, topology.objects.countries).features
        
        // Enrich with our data
        const enrichedCountries = countries.map((country, index) => {
          // Try different property names for country code
          const iso2 = country.properties.ISO_A2 || country.properties.iso_a2
          const iso3 = country.properties.ISO_A3 || country.properties.iso_a3
          const countryName = country.properties.NAME || country.properties.name || country.properties.NAME_EN || 'Unknown'
          
          // Try multiple lookup strategies
          let value = dataMap[iso2] || dataMap[iso3] || dataMap[countryName.toLowerCase()] || 0
          
          const color = getColor(value)
          
          return {
            ...country,
            value: value,
            color: color,
            countryCode: iso2 || iso3,
            countryName: countryName
          }
        })
        
        console.log('Globe loaded with', enrichedCountries.length, 'countries')
        setCountries(enrichedCountries)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error loading countries:', error)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Error loading countries:', err)
        setIsLoading(false)
      })
  }, [dataMap, getColor, themeUpdateTrigger])

  // Handle window resize for responsive globe
  useEffect(() => {
    const handleResize = () => {
      setGlobeSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    handleResize() // Set initial size
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-rotate the globe
  useEffect(() => {
    if (globeEl.current) {
      // Set up auto-rotation
      globeEl.current.controls().autoRotate = true
      globeEl.current.controls().autoRotateSpeed = 0.3
      globeEl.current.controls().enableDamping = true
      globeEl.current.controls().dampingFactor = 0.1
      
      // Set initial camera position
  // Slightly further altitude for less zoomed-in initial view
  // globeEl.current.pointOfView({ altitude: 3.1 })
  globeEl.current.pointOfView({ altitude: 2.5 })
    }
  }, [])

  // Assign stable id to underlying canvas when available for sharing capture
  useEffect(() => {
    if (!globeEl.current) return
    const trySetId = () => {
      try {
        const renderer = globeEl.current.renderer && globeEl.current.renderer()
        const domEl = renderer && renderer.domElement
        if (domEl && !domEl.id) {
          domEl.id = 'world-globe-canvas'
        }
      } catch (_) {}
    }
    // Attempt now and after a couple animation frames
    trySetId()
    let raf1 = requestAnimationFrame(() => {
      trySetId()
      let raf2 = requestAnimationFrame(trySetId)
      return () => cancelAnimationFrame(raf2)
    })
    return () => cancelAnimationFrame(raf1)
  }, [themeUpdateTrigger, countries.length])

  return (
    <div className="globe-view-container globe-gradient-bg">
      {isLoading && (
        <div className="globe-loading">
          <div className="globe-spinner"></div>
          <p>Loading world data...</p>
          <div className="loading-progress">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </div>
      )}
      <Globe
        key={`globe-${themeUpdateTrigger}`}
        ref={globeEl}
        width={globeSize.width}
        height={globeSize.height}
        backgroundColor={backgroundColor}
        animateIn={true}
        rendererConfig={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        
        // Use theme-appropriate earth texture
        globeImageUrl={globeImageUrl}
        
        // Use polygons instead of choropleth
        polygonsData={countries}
        polygonGeoJsonGeometry={d => d.geometry} // Extract just the geometry from the feature
        polygonCapColor={d => d.color}
        polygonSideColor={d => d.color}
        polygonStrokeColor={() => 'rgba(255,255,255,0.15)'}
        polygonAltitude={0.005} // Much lower altitude for better performance
        polygonCapCurvatureResolution={5} // Lower resolution for better performance
        polygonLabel={showTooltips ? (d => {
          const name = d.countryName || d.properties?.NAME || 'Unknown'
          return `<b>${name}</b>`
        }) : undefined}
        
        // Styling
        showAtmosphere={true}
        atmosphereColor={atmosphereColor}
        atmosphereAltitude={0.15}
        
        // Interaction
        onGlobeReady={() => {
          console.log('Globe loaded with', countries.length, 'countries')
          setIsLoading(false)
          // Ensure canvas id after ready
          try {
            const renderer = globeEl.current?.renderer?.()
            const domEl = renderer?.domElement
            if (domEl && !domEl.id) domEl.id = 'world-globe-canvas'
            if (domEl) {
              console.log('[GlobeView] Canvas ready for capture', domEl.width, 'x', domEl.height, 'preserveDrawingBuffer=', renderer?.getContext()?.getContextAttributes()?.preserveDrawingBuffer)
            }
          } catch(_) {}
        }}
      />
    </div>
  )
}

export default GlobeView