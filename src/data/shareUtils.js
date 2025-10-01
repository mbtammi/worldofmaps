// Sharing Utilities
// Provides functions to generate shareable text blocks and an optional image capture of the globe.
// Image capture is best-effort: works only if WebGL canvas is same-origin (no taint) and user grants permission.
//
// Platform Notes:
// - Web Share API Level 2 (files) works mainly on modern mobile browsers (Chrome Android, some Safari versions).
// - Instagram & Snapchat do NOT expose a reliable public web endpoint for direct story posting with an arbitrary image.
// - For those platforms users must: (a) use the system share sheet if it lists the app OR (b) save/download the image then upload manually.
// - Packages like react-share only open URL/text-based share intents (Twitter/X, WhatsApp, Telegram, etc.) and cannot push a generated canvas image to stories.
// - We therefore provide both: system share attempt + per-platform URL links + save image fallback.

export function generateShareText(result) {
  // result: { isWon, guesses, guessCount, datasetTitle, dayIndex, challengeId, durationMs }
  const lines = []
  const dayStr = result.dayIndex != null ? `Day ${result.dayIndex}` : 'Free Play'
  const outcome = result.isWon ? `✅ Solved` : `❌ Not solved`
  const guessPart = result.isWon ? `${result.guessCount} guesses` : `${result.guessCount} tries`
  const timeSec = result.durationMs ? Math.round(result.durationMs / 1000) : null
  const timePart = timeSec != null ? `in ${timeSec}s` : ''
  lines.push(`WorldOfMaps • ${dayStr}`)
  lines.push(`${outcome} ${timePart}`.trim())
  lines.push(`${result.datasetTitle}`)

  // Minimal guess history representation
  if (Array.isArray(result.guesses) && result.guesses.length) {
    const guessSymbols = result.guesses.map(g => g.isCorrect ? '🟩' : '🟥').join('')
    lines.push(guessSymbols)
  }

  lines.push('#worldofthemaps https://worldofthemaps.com')
  return lines.join('\n')
}

export async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) {
    // Fallback: hidden textarea
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch (_) {
      return false
    }
  }
}

// Internal: attempt to capture globe canvas; retries if not immediately available
async function captureGlobe(globeSelector, attempts = 4, delayMs = 160) {
  for (let i = 0; i < attempts; i++) {
    let c = document.querySelector(globeSelector)
    if (!c) {
      // Fallback: choose the largest visible canvas
      const canvases = Array.from(document.querySelectorAll('canvas'))
      c = canvases.sort((a,b)=> (b.width*b.height) - (a.width*a.height))[0]
      if (c) console.log('[shareUtils] Fallback canvas chosen:', c.id || '(no id)', c.width, c.height)
    }
    if (c) {
      try {
        console.log(`[shareUtils] Attempt ${i+1}/${attempts} capturing canvas id=${c.id} size=${c.width}x${c.height}`)
        const url = c.toDataURL('image/png')
        if (url && url.length > 200) {
          console.log('[shareUtils] Capture success length=', url.length)
          return url
        } else {
          console.warn('[shareUtils] Capture produced small/blank data URL length=', url && url.length)
        }
      } catch (e) {
        console.warn('[shareUtils] toDataURL failed attempt', i+1, e.message)
      }
    } else {
      console.warn('[shareUtils] No canvas found for selector', globeSelector, 'attempt', i+1)
    }
    if (i < attempts - 1) {
      // Mix timeout and rAF to give WebGL a frame to settle
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, delayMs)))
    }
  }
  return null
}

// Legacy polaroid (landscape within frame) – now hides dataset title to avoid spoilers
export function createPolaroidImage(globeSelector = '#world-globe-canvas', options = {}) {
  return (async () => {
    console.log('[POLAROID] Starting createPolaroidImage with selector:', globeSelector)
    console.log('[POLAROID] Options:', options)
    
    const globeDataUrl = await captureGlobe(globeSelector)
    console.log('[POLAROID] Globe capture result:', globeDataUrl ? `Data URL length: ${globeDataUrl.length}` : 'NULL')
    
    const width = 900
    const innerImgHeight = 520
    const framePadding = 40
    const bottomExtra = 160
    const totalHeight = innerImgHeight + framePadding * 2 + bottomExtra
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = totalHeight
    const ctx = canvas.getContext('2d')

    console.log('[POLAROID] Canvas dimensions:', width, 'x', totalHeight)

    // ctx.fillStyle = '#f8f8f4'
    ctx.fillRect(0,0,width,totalHeight)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.18)'
    ctx.shadowBlur = 28
    ctx.shadowOffsetY = 8
    // ctx.fillStyle = '#ffffff'
    ctx.fillRect(framePadding/2, framePadding/2, width - framePadding, totalHeight - framePadding)
    ctx.restore()

    // Refined image area: minimal insets so globe can fill nearly full width.
    const imgSideInset = 14
    const imgTopInset = 12
    const imgX = (framePadding/2) + imgSideInset
    const imgY = (framePadding/2) + imgTopInset
    const imgW = width - framePadding - imgSideInset * 2
    const imgH = innerImgHeight - imgTopInset * 2

    console.log('[POLAROID] Image area bounds:', {imgX, imgY, imgW, imgH})

    // Background area - ensure solid, always-visible background
    console.log('[POLAROID] Drawing background layers...')
    ctx.fillStyle = '#0a2442'  // Fallback solid color
    ctx.fillRect(imgX, imgY, imgW, imgH)
    console.log('[POLAROID] Base background drawn:', '#0a2442')

    // Main gradient background - linear blue gradient
    const bg = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH)
    bg.addColorStop(0,'#0e5da3')
    bg.addColorStop(1,'#062335')
    ctx.fillStyle = bg
    ctx.fillRect(imgX, imgY, imgW, imgH)
    console.log('[POLAROID] Linear gradient drawn:', '#0e5da3 -> #062335')

    // Center calculations for radial gradient
    const cx = imgX + imgW/2
    const cy = imgY + imgH/2
    const circleR = Math.min(imgW, imgH) * 0.48

    console.log('[POLAROID] Radial gradient center:', {cx, cy, circleR})

    // Radial gradient overlay for visual depth
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, circleR * 1.1)
    radial.addColorStop(0,'#1d8bff')
    radial.addColorStop(0.4,'#0d4770')
    radial.addColorStop(0.8,'#062335')
    radial.addColorStop(1,'rgba(4,28,46,0.6)')
    ctx.save()
    ctx.globalAlpha = 0.8
    ctx.fillStyle = radial
    ctx.fillRect(imgX, imgY, imgW, imgH)
    ctx.restore()
    console.log('[POLAROID] Radial gradient overlay drawn with alpha 0.8')

    const drawCoverImage = (img) => {
      console.log('[POLAROID] Starting drawCoverImage with image:', img.width, 'x', img.height)
      
      // (1) Optional trimming of transparent edges
      const off = document.createElement('canvas')
      off.width = img.width; off.height = img.height
      const octx = off.getContext('2d')
      octx.drawImage(img,0,0)
      let cropCanvas = off
      console.log('[POLAROID] Original image size:', img.width, 'x', img.height)
      
      try {
        const data = octx.getImageData(0,0,off.width,off.height).data
        let minX=off.width, minY=off.height, maxX=0, maxY=0, found=false
        for (let y=0; y<off.height; y++) {
          for (let x=0; x<off.width; x++) {
            const a = data[(y*off.width + x)*4 + 3]
            if (a > 10) { // threshold
              if (x<minX) minX=x
              if (x>maxX) maxX=x
              if (y<minY) minY=y
              if (y>maxY) maxY=y
              found=true
            }
          }
        }
        if (found && maxX>minX && maxY>minY) {
          const cropW = maxX - minX + 1
          const cropH = maxY - minY + 1
          console.log('[POLAROID] Transparency crop found bounds:', {minX, minY, maxX, maxY, cropW, cropH})
          cropCanvas = document.createElement('canvas')
          cropCanvas.width = cropW; cropCanvas.height = cropH
          cropCanvas.getContext('2d').drawImage(off, minX, minY, cropW, cropH, 0,0,cropW,cropH)
          console.log('[POLAROID] Created cropped canvas:', cropW, 'x', cropH)
        } else {
          console.log('[POLAROID] No transparency cropping needed or found')
        }
      } catch(e) {
        console.log('[POLAROID] Transparency cropping failed:', e.message)
      }

      // (2) TRUE COVER-FIT: Scale to fill the ENTIRE area, then clip to bounds
      const scaleX = imgW / cropCanvas.width
      const scaleY = imgH / cropCanvas.height  
      const coverScale = Math.max(scaleX, scaleY) // Cover-fit: use larger scale to fill completely
      
      console.log('[POLAROID] Cover-fit calculations:')
      console.log('  Available space:', imgW, 'x', imgH)
      console.log('  Source size:', cropCanvas.width, 'x', cropCanvas.height)
      console.log('  Scale X:', scaleX, 'Scale Y:', scaleY)
      console.log('  Cover scale (max):', coverScale)
      
      const drawW = cropCanvas.width * coverScale
      const drawH = cropCanvas.height * coverScale
      const dx = imgX + (imgW - drawW)/2  // Center horizontally
      const dy = imgY + (imgH - drawH)/2  // Center vertically

      console.log('[POLAROID] Final draw dimensions:', drawW, 'x', drawH)
      console.log('[POLAROID] Draw position:', {dx, dy})
      console.log('[POLAROID] Will overflow by:', {
        horizontal: Math.max(0, drawW - imgW),
        vertical: Math.max(0, drawH - imgH)
      })

      // (3) Clip to rectangular bounds to maintain polaroid shape
      console.log('[POLAROID] Applying rectangular clip...')
      ctx.save()
      ctx.beginPath()
      ctx.rect(imgX, imgY, imgW, imgH)
      ctx.clip()
      
      // Draw globe - will be clipped to rectangle
      console.log('[POLAROID] Drawing globe with clipping...')
      ctx.drawImage(cropCanvas, dx, dy, drawW, drawH)
      ctx.restore()
      console.log('[POLAROID] Globe drawing completed')
    }

    if (globeDataUrl) {
      console.log('[POLAROID] Globe data available, creating image...')
      const img = new Image()
      img.src = globeDataUrl
      await new Promise(res => { 
        img.onload = () => {
          console.log('[POLAROID] Image loaded successfully:', img.width, 'x', img.height)
          res()
        }
        img.onerror = (e) => {
          console.error('[POLAROID] Image load failed:', e)
          res()
        }
      })
      drawCoverImage(img)
    } else {
      console.log('[POLAROID] No globe data, drawing fallback text')
      ctx.fillStyle = '#c2ccd4'
      ctx.font = '500 42px Inter, Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Globe unavailable', width/2, imgY + imgH/2)
    }

    console.log('[POLAROID] Background check - getting pixel data to verify background...')
    try {
      const testData = ctx.getImageData(imgX + 10, imgY + 10, 1, 1).data
      console.log('[POLAROID] Background pixel at (imgX+10, imgY+10):', {
        r: testData[0], g: testData[1], b: testData[2], a: testData[3]
      })
    } catch(e) {
      console.log('[POLAROID] Could not sample background pixel:', e.message)
    }

    // NOTE: We do NOT round the corners of the inner image; any perceived rounding previously came from gradients/shadows.

    const dayText = options.dayIndex != null ? `Day #${options.dayIndex}` : 'World Data'
    const guessWord = options.guessCount === 1 ? 'guess' : 'guesses'
    const resultLine = options.isWon ? `Solved in ${options.guessCount} ${guessWord}` : `Tried ${options.guessCount} ${guessWord}`
    const site = options.site || 'worldofthemaps.com'

    console.log('[POLAROID] Drawing text elements:', {dayText, resultLine, site})

    ctx.font = '600 46px Inter, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#222'
    ctx.fillText(dayText, width/2, innerImgHeight + framePadding + 70)

    ctx.fillStyle = '#2a2a2a'
    ctx.font = '400 30px Inter, Arial, sans-serif'
    ctx.fillText(resultLine, width/2, innerImgHeight + framePadding + 130)

    ctx.fillStyle = '#555'
    ctx.font = '400 26px Inter, Arial, sans-serif'
    ctx.fillText(site, width/2, totalHeight - 42)

    console.log('[POLAROID] Final canvas conversion...')
    try { 
      const result = canvas.toDataURL('image/png')
      console.log('[POLAROID] SUCCESS - Generated data URL length:', result.length)
      return result
    } catch(e) { 
      console.error('[POLAROID] Canvas toDataURL failed:', e)
      return null 
    }
  })()
}

// 9:16 Story-oriented share image (e.g., 1080x1920). Omits dataset title to avoid spoiling.
// options: { dayIndex, isWon, guessCount, site }
export async function createStoryShareImage(globeSelector = '#world-globe-canvas', options = {}) {
  console.log('[STORY] Starting createStoryShareImage with selector:', globeSelector)
  console.log('[STORY] Options:', options)
  
  // Blue themed variant; slightly larger outer padding; ~68% image, captions lowered.
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  console.log('[STORY] Canvas dimensions:', W, 'x', H)

  // Blue -> deep navy gradient background
  const bg = ctx.createLinearGradient(0,0,W,H)
  bg.addColorStop(0,'#1b4f8f')
  bg.addColorStop(0.45,'#0f335d')
  bg.addColorStop(1,'#071a30')
  ctx.fillStyle = bg
  ctx.fillRect(0,0,W,H)

  const cardPad = 70 // increased from 48 for more edge breathing room
  const cardRadius = 44
  const cardTop = 90
  const cardBottom = H - 90
  const cardHeight = cardBottom - cardTop
  const cardWidth = W - cardPad*2

  // Card
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 22
  ctx.beginPath(); ctx.roundRect(cardPad, cardTop, cardWidth, cardHeight, cardRadius); ctx.fillStyle = '#fcfcfb'; ctx.fill();
  ctx.restore()

  // Image area ~68% of card height (slightly less to push text lower)
  const imgAreaHeight = Math.round(cardHeight * 0.68)
  const imgX = cardPad + 40
  const imgY = cardTop + 40
  const imgW = cardWidth - 80
  const imgH = imgAreaHeight - 80

  console.log('[STORY] Image area bounds:', {imgX, imgY, imgW, imgH})

  const globeDataUrl = await captureGlobe(globeSelector, 3, 180)
  console.log('[STORY] Globe capture result:', globeDataUrl ? `Data URL length: ${globeDataUrl.length}` : 'NULL')
  
  ctx.save(); ctx.beginPath(); ctx.roundRect(imgX, imgY, imgW, imgH, 36); ctx.clip()
  if (globeDataUrl) {
    try {
      const img = new Image(); img.src = globeDataUrl
      await new Promise(r => { img.onload = r; img.onerror = r })
      
      console.log('[STORY] Image loaded:', img.width, 'x', img.height)
      
      // COVER-FIT: Scale to fill entire available space, crop overflow
      const scaleX = imgW / img.width
      const scaleY = imgH / img.height
      const coverScale = Math.max(scaleX, scaleY) // Cover-fit: use larger scale to fill completely
      const drawW = img.width * coverScale
      const drawH = img.height * coverScale
      const dx = imgX + (imgW - drawW)/2
      const dy = imgY + (imgH - drawH)/2
      
      console.log('[STORY] COVER-FIT calculations:')
      console.log('  Available space:', imgW, 'x', imgH)
      console.log('  Source size:', img.width, 'x', img.height)
      console.log('  Scale X:', scaleX, 'Scale Y:', scaleY)
      console.log('  Cover scale (max):', coverScale)
      console.log('  Final draw size:', drawW, 'x', drawH)
      console.log('  Position:', {dx, dy})
      console.log('  Will overflow by:', {
        horizontal: Math.max(0, drawW - imgW),
        vertical: Math.max(0, drawH - imgH)
      })
      
      ctx.drawImage(img, dx, dy, drawW, drawH)
    } catch(_) { 
      console.log('[STORY] Image loading failed, drawing fallback')
      ctx.fillStyle='#d9d9d9'; ctx.fillRect(imgX,imgY,imgW,imgH) 
    }
  } else {
    console.log('[STORY] No globe data, drawing fallback')
    ctx.fillStyle='#d9d9d9'; ctx.fillRect(imgX,imgY,imgW,imgH)
    ctx.fillStyle='#555'; ctx.font='600 56px Inter, Arial'; ctx.textAlign='center'; ctx.fillText('Globe unavailable', imgX+imgW/2, imgY+imgH/2)
  }
  ctx.restore()

  // Overlay gradient for readability (bottom 35%)
  ctx.save(); ctx.beginPath(); ctx.roundRect(imgX, imgY, imgW, imgH,36); ctx.clip()
  const ov = ctx.createLinearGradient(0, imgY + imgH*0.65, 0, imgY + imgH)
  ov.addColorStop(0,'rgba(0,0,0,0)')
  ov.addColorStop(1,'rgba(0,0,0,0.55)')
  ctx.fillStyle = ov
  ctx.fillRect(imgX, imgY, imgW, imgH)
  ctx.restore()

  // Caption area
  const captionTop = imgY + imgH + 110 // move captions lower
  const dayText = options.dayIndex != null ? `Day #${options.dayIndex}` : 'World Data'
  ctx.font='800 120px Inter, Arial, sans-serif'; ctx.textAlign='center'
  const m = ctx.measureText(dayText)
  const grad = ctx.createLinearGradient((W/2)-m.width/2,0,(W/2)+m.width/2,0)
  grad.addColorStop(0,'#7f5af0'); grad.addColorStop(0.5,'#b85cff'); grad.addColorStop(1,'#ffb5f7')
  ctx.fillStyle = grad; ctx.fillText(dayText, W/2, captionTop)

  const guessWord = options.guessCount === 1 ? 'guess' : 'guesses'
  const resultLine = options.isWon ? `Solved in ${options.guessCount} ${guessWord}` : `Tried ${options.guessCount} ${guessWord}`
  ctx.font='600 60px Inter, Arial, sans-serif'; ctx.fillStyle='#1f2030'
  ctx.fillText(resultLine, W/2, captionTop + 140)

  console.log('[STORY] Drawing text elements:', {dayText, resultLine})

  const site = options.site || 'worldofthemaps.com'
  ctx.font='400 54px Inter, Arial, sans-serif'; ctx.fillStyle='#555'
  ctx.fillText(site, W/2, cardTop + cardHeight - 70)

  // Slim vignette
  const vg = ctx.createRadialGradient(W/2,H/2,W*0.35,W/2,H/2,W*0.85)
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.18)')
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H)

  console.log('[STORY] Final canvas conversion...')
  try { 
    const result = canvas.toDataURL('image/png')
    console.log('[STORY] SUCCESS - Generated data URL length:', result.length)
    return result
  } catch(e) { 
    console.error('[STORY] Canvas toDataURL failed:', e)
    return null 
  }
}

function wrapCenter(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let y = startY
  const lines = []
  for (let w of words) {
    const test = line ? line + ' ' + w : w
    const { width } = ctx.measureText(test)
    if (width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  lines.forEach((ln,i) => ctx.fillText(ln, centerX, y + i*lineHeight))
}

// Try Web Share API (text only). If share fails or unsupported, return false so caller can fallback.
export async function tryWebShare(shareData) {
  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return true
    } catch (_) {
      return false
    }
  }
  return false
}

// Attempt to capture globe canvas: pass a ref or query selector.
export function captureGlobeImage(selector = 'canvas') {
  try {
    const canvas = document.querySelector(selector)
    if (!canvas) return null
    // May throw if tainted
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl
  } catch (e) {
    console.warn('Globe capture failed (likely cross-origin texture):', e.message)
    return null
  }
}

// Download an image (data URL) as file
export function downloadImage(dataUrl, filename = 'worldofmaps.png') {
  try {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (e) {
    console.warn('Download image failed:', e.message)
  }
}

export default {
  generateShareText,
  copyTextToClipboard,
  tryWebShare,
  captureGlobeImage,
  downloadImage
  ,createPolaroidImage
  ,createStoryShareImage
}
