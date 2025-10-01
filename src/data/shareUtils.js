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
    const globeDataUrl = await captureGlobe(globeSelector)
    const width = 900
    const innerImgHeight = 520
    const framePadding = 40
    const bottomExtra = 160
    const totalHeight = innerImgHeight + framePadding * 2 + bottomExtra
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = totalHeight
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#f8f8f4'
    ctx.fillRect(0,0,width,totalHeight)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.18)'
    ctx.shadowBlur = 28
    ctx.shadowOffsetY = 8
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(framePadding/2, framePadding/2, width - framePadding, totalHeight - framePadding)
    ctx.restore()

    if (globeDataUrl) {
      const img = new Image()
      img.src = globeDataUrl
      await new Promise(res => { img.onload = res; img.onerror = res })
      const imgX = framePadding + 10
      const imgY = framePadding + 10
      const imgW = width - (framePadding*2) - 20
      const imgH = innerImgHeight - 20
      ctx.fillStyle = '#fff'
      ctx.fillRect(imgX, imgY, imgW, imgH)
      try { ctx.drawImage(img, imgX, imgY, imgW, imgH) } catch(_) {}
      const grad = ctx.createLinearGradient(0, imgY + imgH*0.55, 0, imgY + imgH)
      grad.addColorStop(0,'rgba(0,0,0,0)')
      grad.addColorStop(1,'rgba(0,0,0,0.35)')
      ctx.fillStyle = grad
      ctx.fillRect(imgX, imgY, imgW, imgH)
    } else {
      // Placeholder if globe capture failed
      ctx.fillStyle = '#ddd'
      ctx.fillRect(framePadding + 10, framePadding + 10, width - (framePadding*2) - 20, innerImgHeight - 20)
      ctx.fillStyle = '#666'
      ctx.font = '500 42px Inter, Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Globe unavailable', width/2, framePadding + innerImgHeight/2)
    }

  const dayText = options.dayIndex != null ? `Day #${options.dayIndex}` : 'World Data'
  const guessWord = options.guessCount === 1 ? 'guess' : 'guesses'
  const resultLine = options.isWon ? `Solved in ${options.guessCount} ${guessWord}` : `Tried ${options.guessCount} ${guessWord}`
    const site = options.site || 'worldofthemaps.com'

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

    try { return canvas.toDataURL('image/png') } catch(_) { return null }
  })()
}

// 9:16 Story-oriented share image (e.g., 1080x1920). Omits dataset title to avoid spoiling.
// options: { dayIndex, isWon, guessCount, site }
export async function createStoryShareImage(globeSelector = '#world-globe-canvas', options = {}) {
  // Compact branded card: ~70% image, 30% caption.
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Gradient background
  const bg = ctx.createLinearGradient(0,0,W,H)
  bg.addColorStop(0,'#211a3f')
  bg.addColorStop(0.5,'#372b66')
  bg.addColorStop(1,'#4d3890')
  ctx.fillStyle = bg
  ctx.fillRect(0,0,W,H)

  const cardPad = 48
  const cardRadius = 44
  const cardTop = 70
  const cardBottom = H - 70
  const cardHeight = cardBottom - cardTop
  const cardWidth = W - cardPad*2

  // Card
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 22
  ctx.beginPath(); ctx.roundRect(cardPad, cardTop, cardWidth, cardHeight, cardRadius); ctx.fillStyle = '#fcfcfb'; ctx.fill();
  ctx.restore()

  // Image area ~70%
  const imgAreaHeight = Math.round(cardHeight * 0.7)
  const imgX = cardPad + 40
  const imgY = cardTop + 40
  const imgW = cardWidth - 80
  const imgH = imgAreaHeight - 80

  const globeDataUrl = await captureGlobe(globeSelector, 3, 180)
  ctx.save(); ctx.beginPath(); ctx.roundRect(imgX, imgY, imgW, imgH, 36); ctx.clip()
  if (globeDataUrl) {
    try {
      const img = new Image(); img.src = globeDataUrl
      await new Promise(r => { img.onload = r; img.onerror = r })
      // contain-fit to avoid over zoom (show whole sphere)
      const scale = Math.min(imgW / img.width, imgH / img.height)
      const drawW = img.width * scale
      const drawH = img.height * scale
      const dx = imgX + (imgW - drawW)/2
      const dy = imgY + (imgH - drawH)/2
      ctx.drawImage(img, dx, dy, drawW, drawH)
    } catch(_) { ctx.fillStyle='#d9d9d9'; ctx.fillRect(imgX,imgY,imgW,imgH) }
  } else {
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
  const captionTop = imgY + imgH + 56
  const dayText = options.dayIndex != null ? `Day #${options.dayIndex}` : 'World Data'
  ctx.font='800 120px Inter, Arial, sans-serif'; ctx.textAlign='center'
  const m = ctx.measureText(dayText)
  const grad = ctx.createLinearGradient((W/2)-m.width/2,0,(W/2)+m.width/2,0)
  grad.addColorStop(0,'#7f5af0'); grad.addColorStop(0.5,'#b85cff'); grad.addColorStop(1,'#ffb5f7')
  ctx.fillStyle = grad; ctx.fillText(dayText, W/2, captionTop)

  const guessWord = options.guessCount === 1 ? 'guess' : 'guesses'
  const resultLine = options.isWon ? `Solved in ${options.guessCount} ${guessWord}` : `Tried ${options.guessCount} ${guessWord}`
  ctx.font='600 60px Inter, Arial, sans-serif'; ctx.fillStyle='#1f2030'
  ctx.fillText(resultLine, W/2, captionTop + 120)

  const site = options.site || 'worldofthemaps.com'
  ctx.font='400 54px Inter, Arial, sans-serif'; ctx.fillStyle='#555'
  ctx.fillText(site, W/2, cardTop + cardHeight - 90)

  // Slim vignette
  const vg = ctx.createRadialGradient(W/2,H/2,W*0.35,W/2,H/2,W*0.85)
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.18)')
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H)

  try { return canvas.toDataURL('image/png') } catch(_) { return null }
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
