import { useEffect, useState } from 'react'
import { generateShareText, createStoryShareImage, copyTextToClipboard, tryWebShare } from '../data/shareUtils'

// Simple share sheet with platform-specific links and system share if available
export default function ShareSheet({ result, open, onClose }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [status, setStatus] = useState(null)
  const [supportsFileShare, setSupportsFileShare] = useState(false)

  useEffect(() => {
    if (!open) return
    setStatus('preparing')
    setImageUrl(null)
    // Detect file share support quickly
    const canFileShare = !!(navigator.canShare && navigator.share)
    setSupportsFileShare(canFileShare)
    ;(async () => {
      const url = await createStoryShareImage('#world-globe-canvas', {
        dayIndex: result.dayIndex,
        isWon: result.isWon,
        guessCount: result.guessCount
      })
      setImageUrl(url)
      setStatus(null)
    })()
  }, [open, result])

  if (!open) return null

  const text = generateShareText(result)
  const encodedText = encodeURIComponent(text)
  const pageUrl = 'https://worldofthemaps.com' // canonical base
  const encodedPage = encodeURIComponent(pageUrl)

  const shareTargets = [
    { key: 'whatsapp', label: 'WhatsApp', url: `https://api.whatsapp.com/send?text=${encodedText}` },
    { key: 'twitter', label: 'X / Twitter', url: `https://twitter.com/intent/tweet?text=${encodedText}` },
    { key: 'telegram', label: 'Telegram', url: `https://t.me/share/url?url=${encodedPage}&text=${encodedText}` },
    { key: 'reddit', label: 'Reddit', url: `https://www.reddit.com/submit?url=${encodedPage}&title=${encodedText}` },
    { key: 'facebook', label: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedPage}` },
  ]

  const handleSystemShare = async () => {
    if (!supportsFileShare) return
    try {
      setStatus('sharing')
      if (imageUrl && navigator.canShare) {
        const blob = await (await fetch(imageUrl)).blob()
        const file = new File([blob], `worldofmaps-day${result.dayIndex||'x'}.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text })
          setStatus('done')
          return
        }
      }
      // Fallback to text share
      const ok = await tryWebShare({ text })
      setStatus(ok ? 'done' : 'failed')
    } catch (e) {
      if (e && (e.name === 'AbortError' || e.message === 'Share canceled')) {
        setStatus('canceled')
      } else {
        console.warn('[ShareSheet] system share failed', e)
        setStatus('failed')
      }
    }
  }

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(text)
    setStatus(ok ? 'copied' : 'failed')
  }

  const handleSave = () => {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `worldofmaps-day${result.dayIndex||'x'}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setStatus('saved')
  }

  return (
    <div style={styles.overlay} onMouseDown={(e)=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={styles.sheet} className="share-sheet">
        <div style={styles.header}>
          <h3 style={{margin:0,fontSize:'1.1em'}}>Share your result</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>
        {status === 'preparing' && <div style={styles.status}>Preparing image…</div>}
        {imageUrl && (
          <div style={styles.previewWrap}>
            <img src={imageUrl} alt="Share preview" style={styles.previewImg} />
          </div>
        )}
        <div style={styles.buttonsGrid}>
          {supportsFileShare && (
            <button style={styles.primaryBtn} onClick={handleSystemShare} disabled={status==='sharing'}>
              {status==='sharing' ? 'Sharing…' : 'System Share'}
            </button>
          )}
          {!supportsFileShare && (
            <button style={styles.primaryBtn} onClick={handleCopy}>Copy Text</button>
          )}
          <button style={styles.outlineBtn} onClick={handleSave} disabled={!imageUrl}>Save Image</button>
          <button style={styles.outlineBtn} onClick={handleCopy}>Copy Text</button>
        </div>
        <div style={styles.linksRow}>
          {shareTargets.map(t => (
            <a key={t.key} href={t.url} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>{t.label}</a>
          ))}
        </div>
        <div style={styles.note}>
          Instagram & Snapchat do not support direct web image story posting. Save the image then upload manually or use the system share sheet if they appear.
        </div>
        {status && status !== 'preparing' && status !== 'sharing' && (
          <div style={styles.statusSmall}>
            {status === 'done' && 'Shared ✅'}
            {status === 'copied' && 'Copied ✅'}
            {status === 'saved' && 'Saved ✅'}
            {status === 'failed' && 'Share failed'}
            {status === 'canceled' && 'Share canceled'}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500 },
  sheet: { background:'var(--glassBackground, #141a22)', color:'var(--textColor,#fff)', border:'1px solid var(--glassBorder,rgba(255,255,255,0.12))', borderRadius:20, padding:'20px 22px 26px', width:'min(560px,92%)', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 10px 40px -8px rgba(0,0,0,0.45)', backdropFilter:'blur(16px)' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  closeBtn: { background:'none', border:'none', color:'inherit', fontSize:'1.4em', cursor:'pointer', lineHeight:1 },
  previewWrap: { margin:'10px auto 12px', textAlign:'center' },
  previewImg: { maxWidth:'100%', borderRadius:14, boxShadow:'0 4px 16px rgba(0,0,0,0.35)' },
  buttonsGrid: { display:'flex', flexWrap:'wrap', gap:10, marginTop:4 },
  primaryBtn: { flex:'1 1 180px', background:'linear-gradient(90deg,#805ad5,#b47bff)', color:'#fff', border:'none', padding:'10px 14px', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.9em' },
  outlineBtn: { flex:'1 1 160px', background:'rgba(255,255,255,0.06)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', padding:'10px 14px', borderRadius:10, cursor:'pointer', fontWeight:500, fontSize:'0.85em' },
  linksRow: { display:'flex', flexWrap:'wrap', gap:8, marginTop:14 },
  linkBtn: { flex:'1 1 46%', textAlign:'center', background:'rgba(255,255,255,0.08)', color:'#fff', textDecoration:'none', padding:'8px 10px', borderRadius:8, fontSize:'0.75em', fontWeight:500 },
  note: { marginTop:14, fontSize:'0.65em', lineHeight:1.4, opacity:0.7 },
  status: { fontSize:'0.8em', opacity:0.8, margin:'6px 0' },
  statusSmall: { fontSize:'0.7em', opacity:0.75, marginTop:8, textAlign:'center' }
}
