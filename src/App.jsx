import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

// Import our page components (we'll create these next)
import DailyGame from './components/DailyGame'
import Landing from './components/Landing'
import About from './components/About'
import HowToPlay from './components/HowToPlay'
import NotFound from './components/NotFound'
import { Analytics } from "@vercel/analytics/react"


function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <Routes>
        {/* Root route = Daily game (no header/footer for immersion) */}
        <Route path="/" element={<DailyGame />} />
        
        {/* Marketing/info pages (will have header/footer) */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        
        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
