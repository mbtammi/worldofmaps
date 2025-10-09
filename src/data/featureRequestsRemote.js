/**
 * Remote Feature Requests Client - Firebase API integration
 * Handles API calls with fallback to localStorage, includes client fingerprinting
 * Features: pagination, optimistic UI, toast notifications, vote uniqueness
 */

import { 
  listFeatures as listLocal, 
  submitFeature as submitLocal, 
  upvoteFeature as upvoteLocal,
  getLastSeenTimestamp,
  markAllSeen as markAllSeenLocal,
  hasNewFeatures as hasNewFeaturesLocal
} from './featureRequests.js';

const API_BASE = '/api/features';

// Generate stable client fingerprint for vote uniqueness
function getClientFingerprint() {
  const key = 'worldofmaps_client_fingerprint';
  let fingerprint = localStorage.getItem(key);
  
  if (!fingerprint) {
    // Generate fingerprint from browser characteristics + random
    const nav = navigator;
    const screen = window.screen;
    const baseData = [
      nav.userAgent,
      nav.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      Date.now().toString(36),
      Math.random().toString(36)
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < baseData.length; i++) {
      const char = baseData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    fingerprint = 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
    localStorage.setItem(key, fingerprint);
  }
  
  return fingerprint;
}

// API helper with error handling
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(API_BASE + endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API call failed:', error.message);
    throw error;
  }
}

// Remote feature list with pagination
export async function listFeaturesRemote(page = 0, limit = 20) {
  try {
    const data = await apiCall(`?page=${page}&limit=${limit}`);
    return {
      features: data.features || [],
      pagination: data.pagination || { page: 0, hasMore: false, total: 0 }
    };
  } catch (error) {
    console.warn('Falling back to local storage for feature list');
    const localFeatures = listLocal();
    const start = page * limit;
    const end = start + limit;
    return {
      features: localFeatures.slice(start, end),
      pagination: {
        page,
        limit,
        total: localFeatures.length,
        hasMore: end < localFeatures.length
      }
    };
  }
}

// Submit feature with optimistic UI support
export async function submitFeatureRemote({ title, description }) {
  const fingerprint = getClientFingerprint();
  
  try {
    const result = await apiCall('', {
      method: 'POST',
      body: JSON.stringify({ title, description, fingerprint })
    });
    
    return {
      success: true,
      feature: result,
      message: result.message || 'Feature submitted successfully!'
    };
  } catch (error) {
    // Fallback to local storage
    console.warn('Falling back to local storage for feature submission');
    const id = submitLocal({ title, description });
    return {
      success: true,
      feature: { id, title, description, votes: 1, created: Date.now() },
      message: 'Feature saved locally (will sync when online)',
      isLocal: true
    };
  }
}

// Upvote with optimistic UI
export async function upvoteFeatureRemote(featureId) {
  const fingerprint = getClientFingerprint();
  
  try {
    const result = await apiCall('?vote=true', {
      method: 'POST',
      body: JSON.stringify({ featureId, fingerprint })
    });
    
    return {
      success: true,
      votes: result.votes,
      message: result.message || 'Vote recorded!'
    };
  } catch (error) {
    // Check if it's a "already voted" error
    if (error.message.includes('Already voted')) {
      return {
        success: false,
        error: 'You already voted on this feature',
        alreadyVoted: true
      };
    }
    
    // Fallback to local storage
    console.warn('Falling back to local storage for upvote');
    const success = upvoteLocal(featureId);
    return {
      success,
      message: success ? 'Vote saved locally (will sync when online)' : 'Already voted on this feature',
      isLocal: true
    };
  }
}

// Check for new features since last seen
export async function hasNewFeaturesRemote() {
  try {
    const { features } = await listFeaturesRemote(0, 5); // Just check recent items
    const lastSeen = getLastSeenTimestamp();
    return features.some(f => f.created > lastSeen);
  } catch (error) {
    // Fallback to local check
    console.warn('Falling back to local storage for new features check');
    return hasNewFeaturesLocal();
  }
}

// Mark all as seen (for indicator)
export function markAllSeenRemote() {
  markAllSeenLocal(); // Always update local timestamp regardless of remote status
}

// Utility for toast notifications
export function createToast(message, type = 'success') {
  // Remove existing toast if any
  const existing = document.querySelector('.feature-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `feature-toast feature-toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export { getClientFingerprint };