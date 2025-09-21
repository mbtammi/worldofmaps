import { useRef, useEffect, useState, useMemo } from 'react'
import Globe from 'react-globe.gl'
import { feature } from 'topojson-client'
import './GlobeView.css'

function GlobeView({ dataset, showTooltips = false }) {
  const globeEl = useRef()
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 600 })
  const [countries, setCountries] = useState([])

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
  }, [maxValue])

  // Load countries data
  useEffect(() => {
    fetch('//unpkg.com/world-atlas/countries-50m.json')
      .then(res => res.json())
      .then(topology => {
        const countries = feature(topology, topology.objects.countries).features
        
        // Enrich with our data
        const enrichedCountries = countries.map((country, index) => {
          // Debug: log the first few countries to see available properties
          if (index < 3) {
            console.log('Country properties for', country.properties.NAME, ':', Object.keys(country.properties))
          }
          
          // Try different property names for country code
          const iso2 = country.properties.ISO_A2 || country.properties.iso_a2
          const iso3 = country.properties.ISO_A3 || country.properties.iso_a3
          const countryName = country.properties.NAME || country.properties.name || country.properties.NAME_EN || 'Unknown'
          
          // Try multiple lookup strategies
          let value = dataMap[iso2] || dataMap[iso3] || dataMap[countryName.toLowerCase()] || 0
          
          const color = getColor(value)
          
          // Debug specific countries
          if (countryName.includes('United States') || countryName.includes('China') || countryName.includes('India')) {
            console.log(`${countryName} Debug - ISO2: ${iso2}, ISO3: ${iso3}, Value: ${value}`)
          }
          
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
      })
      .catch(err => console.error('Error loading countries:', err))
  }, [dataMap, getColor])

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
      globeEl.current.pointOfView({ altitude: 2.5 })
    }
  }, [])

  return (
    <div className="globe-view-container">
      <Globe
        ref={globeEl}
        width={globeSize.width}
        height={globeSize.height}
        backgroundColor="rgba(0,0,0,0)"
        animateIn={true}
        
        // Use a very subtle earth texture that won't interfere with colors
        globeImageUrl={null} // Remove earth texture to see colors better
        
        // Use polygons instead of choropleth
        polygonsData={countries}
        polygonGeoJsonGeometry={d => d.geometry} // Extract just the geometry from the feature
        polygonCapColor={d => d.color}
        polygonSideColor={d => d.color}
        polygonStrokeColor={() => 'rgba(255,255,255,0.15)'}
        polygonAltitude={0.005} // Much lower altitude for better performance
        polygonCapCurvatureResolution={5} // Lower resolution for better performance
        polygonLabel={showTooltips ? (d => {
          const value = d.value
          const name = d.countryName || d.properties?.NAME || 'Unknown'
          return `<b>${name}</b><br />${dataset?.title || 'Population Density'}: ${value || 'N/A'}${dataset?.title?.includes('Density') ? ' per km²' : ''}`
        }) : undefined}
        
        // Styling
        showAtmosphere={true}
        atmosphereColor="#4a90e2"
        atmosphereAltitude={0.15}
        
        // Interaction
        onGlobeReady={() => {
          console.log('Globe loaded with', countries.length, 'countries')
        }}
      />
    </div>
  )
}

export default GlobeView