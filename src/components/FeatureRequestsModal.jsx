import { useEffect, useState } from 'react'
import './FeatureRequestsModal.css'
import { 
  listFeaturesRemote, 
  submitFeatureRemote, 
  upvoteFeatureRemote, 
  markAllSeenRemote,
  createToast 
} from '../data/featureRequestsRemote'

export default function FeatureRequestsModal({ open, onClose }) {
  const [features, setFeatures] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [justSubmittedId, setJustSubmittedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 0, hasMore: false, total: 0 })
  const [optimisticVotes, setOptimisticVotes] = useState({}) // For optimistic UI

  useEffect(() => {
    if (open) {
      loadFeatures(0, true) // Reset to first page
      markAllSeenRemote()
    }
  }, [open])

  async function loadFeatures(page = 0, reset = false) {
    if (loading) return
    setLoading(true)
    setError(null)
    
    try {
      const result = await listFeaturesRemote(page, 20)
      
      if (reset) {
        setFeatures(result.features)
      } else {
        setFeatures(prev => [...prev, ...result.features])
      }
      
      setPagination(result.pagination)
    } catch (err) {
      setError('Failed to load features: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    
    try {
      if (!title.trim()) throw new Error('Title required')
      setSubmitting(true)
      
      const result = await submitFeatureRemote({ title, description })
      
      if (result.success) {
        setTitle('')
        setDescription('')
        setJustSubmittedId(result.feature.id)
        
        // Add to top of list for immediate feedback
        setFeatures(prev => [result.feature, ...prev])
        
        // Show success toast
        createToast(result.message)
        
        // Refresh list to get accurate data
        setTimeout(() => loadFeatures(0, true), 500)
      }
    } catch (err) {
      setError(err.message)
      createToast('Failed to submit feature: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpvote = async (featureId) => {
    // Optimistic UI update
    setOptimisticVotes(prev => ({
      ...prev,
      [featureId]: (prev[featureId] || 0) + 1
    }))
    
    setFeatures(prev => prev.map(f => 
      f.id === featureId 
        ? { ...f, votes: f.votes + 1 }
        : f
    ))
    
    try {
      const result = await upvoteFeatureRemote(featureId)
      
      if (result.success) {
        createToast(result.message)
        // Refresh to get accurate vote count
        if (!result.isLocal) {
          setTimeout(() => loadFeatures(0, true), 300)
        }
      } else {
        // Revert optimistic update
        setOptimisticVotes(prev => ({
          ...prev,
          [featureId]: Math.max(0, (prev[featureId] || 0) - 1)
        }))
        
        setFeatures(prev => prev.map(f => 
          f.id === featureId 
            ? { ...f, votes: Math.max(0, f.votes - 1) }
            : f
        ))
        
        createToast(result.error || 'Failed to vote', 'error')
      }
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticVotes(prev => ({
        ...prev,
        [featureId]: Math.max(0, (prev[featureId] || 0) - 1)
      }))
      
      setFeatures(prev => prev.map(f => 
        f.id === featureId 
          ? { ...f, votes: Math.max(0, f.votes - 1) }
          : f
      ))
      
      createToast('Failed to vote: ' + err.message, 'error')
    }
  }

  if (!open) return null

  return (
    <div className="fr-overlay" role="dialog" aria-modal="true" aria-labelledby="fr-modal-title">
      <div className="fr-container">
        <div className="fr-header">
          <h2 id="fr-modal-title">Feature Requests & Roadmap</h2>
          <button className="fr-close" onClick={onClose} aria-label="Close feature requests">✕</button>
        </div>
        <form className="fr-form" onSubmit={handleSubmit}>
          <div className="fr-fields">
            <input
              type="text"
              placeholder="Short feature title (e.g. Multiplayer mode)"
              value={title}
              maxLength={120}
              onChange={e=>setTitle(e.target.value)}
              aria-label="Feature title"
            />
            <textarea
              placeholder="Optional description – why is this useful?"
              value={description}
              maxLength={600}
              onChange={e=>setDescription(e.target.value)}
              aria-label="Feature description"
            />
          </div>
          {error && <div className="fr-error" role="alert">{error}</div>}
          <div className="fr-actions">
            <button type="submit" disabled={submitting || !title.trim()} className="fr-submit">
              {submitting ? 'Submitting…' : 'Submit Feature'}
            </button>
          </div>
        </form>
        <div className="fr-list" aria-live="polite">
          {loading && features.length === 0 && (
            <div className="fr-loading">Loading features...</div>
          )}
          {!loading && features.length === 0 && (
            <div className="fr-empty">No features yet. Be the first to suggest one!</div>
          )}
          {features.map(f => (
            <div key={f.id} className={`fr-item ${f.id === justSubmittedId ? 'fr-new' : ''}`}> 
              <div className="fr-item-main">
                <div className="fr-item-title">{f.title}</div>
                {f.description && <div className="fr-item-desc">{f.description}</div>}
                <div className="fr-item-meta">
                  <span>{timeAgo(f.created)}</span>
                </div>
              </div>
              <div className="fr-item-actions">
                <button onClick={()=>handleUpvote(f.id)} className="fr-upvote" aria-label={`Upvote feature ${f.title}`}>⬆</button>
                <div className="fr-vote-count">
                  {f.votes + (optimisticVotes[f.id] || 0)} vote{f.votes===1?'':'s'}
                </div>
              </div>
            </div>
          ))}
          
          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="fr-load-more">
              <button 
                onClick={() => loadFeatures(pagination.page + 1, false)}
                disabled={loading}
                className="fr-load-more-btn"
              >
                {loading ? 'Loading...' : `Load More (${pagination.total - features.length} remaining)`}
              </button>
            </div>
          )}
        </div>
        <div className="fr-footer-note">
          {pagination.total > 0 && (
            <span>Showing {features.length} of {pagination.total} features • </span>
          )}
          Real-time sync with Firebase Firestore. Vote uniqueness tracked per device.
        </div>
      </div>
    </div>
  )
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const sec = Math.floor(diff/1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec/60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min/60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr/24)
  return `${d}d ago`
}
