import { useRef, useEffect, useState } from 'react'
import Globe from 'react-globe.gl'
import './GlobeView.css'

function GlobeView({ dataset }) {
  const globeEl = useRef()
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 600 })

  // Use the dataset data, or fallback to sample data
  const choroplethData = dataset?.data || [
    // Fallback sample data if no dataset provided
    { iso_a2: 'US', name: 'United States', value: 36 },
    { iso_a2: 'CN', name: 'China', value: 153 },
    { iso_a2: 'IN', name: 'India', value: 464 },
  ]

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
        
        // Use a very subtle earth texture that won't interfere with colors
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        
        // Add choropleth layer
        choroplethData={choroplethData}
        choroplethAccessor={d => d.value}
        choroplethScale={dataset?.colorScale || ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594']}
        choroplethTopojson="//unpkg.com/world-atlas/countries-50m.json"
        choroplethTopoJsonTranslate={feat => feat.properties.ISO_A2}
        choroplethLabel={({ properties: d, value }) => 
          `<b>${d.NAME}</b><br />${dataset?.title || 'Value'}: ${value || 'N/A'}`
        }
        
        // Styling
        showAtmosphere={true}
        atmosphereColor="#4a90e2"
        atmosphereAltitude={0.15}
        
        // Interaction
        onGlobeReady={() => {
          console.log('Globe loaded with dataset:', dataset?.title || 'sample data')
        }}
      />
    </div>
  )
}

export default GlobeView