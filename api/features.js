/**
 * Feature Requests API - Handles submissions, voting, and listing with pagination
 * Uses Firebase Firestore with server-side authentication only (no env exposure to browser)
 * 
 * GET /api/features?page=0&limit=10 - List features with pagination
 * POST /api/features - Submit new feature { title, description, fingerprint }
 * POST /api/features/vote - Upvote feature { featureId, fingerprint }
 */

import { getFirestore } from './_firebaseAdmin.js';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
  const db = await getFirestore();
  const featuresRef = db.collection('featureRequests');

    // GET: List features with pagination
    if (req.method === 'GET') {
      const page = parseInt(req.query.page) || 0;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 items per page
      const offset = page * limit;

      // Get total count for pagination info
      const snapshot = await featuresRef.get();
      const total = snapshot.size;

      // Get paginated results ordered by votes desc, then created desc
      const query = featuresRef
        .orderBy('votes', 'desc')
        .orderBy('created', 'desc')
        .limit(limit)
        .offset(offset);

      const paginatedSnapshot = await query.get();
      const features = [];
      
      paginatedSnapshot.forEach(doc => {
        const data = doc.data();
        features.push({
          id: doc.id,
          title: data.title,
          description: data.description || '',
          votes: data.votes || 0,
          created: data.created || Date.now()
        });
      });

      return res.status(200).json({
        features,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: (offset + features.length) < total
        }
      });
    }

    // POST: Submit new feature
    if (req.method === 'POST' && !req.query.vote) {
      const { title, description, fingerprint } = req.body;

      // Validation
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }
      if (!fingerprint || typeof fingerprint !== 'string') {
        return res.status(400).json({ error: 'Client fingerprint required' });
      }

      const trimmedTitle = title.trim().slice(0, 120);
      const trimmedDesc = (description || '').trim().slice(0, 600);
      const now = Date.now();

      // Create new feature document
      const newFeature = {
        title: trimmedTitle,
        description: trimmedDesc,
        votes: 1, // Auto-upvote by submitter
        created: now,
        submitterFingerprint: fingerprint,
        voterFingerprints: [fingerprint] // Track who voted to prevent duplicates
      };

      const docRef = await featuresRef.add(newFeature);

      return res.status(201).json({
        id: docRef.id,
        title: trimmedTitle,
        description: trimmedDesc,
        votes: 1,
        created: now,
        message: 'Feature submitted successfully!'
      });
    }

    // POST: Upvote feature
    if (req.method === 'POST' && req.query.vote === 'true') {
      const { featureId, fingerprint } = req.body;

      if (!featureId || !fingerprint) {
        return res.status(400).json({ error: 'Feature ID and fingerprint required' });
      }

      const featureDoc = featuresRef.doc(featureId);
      const doc = await featureDoc.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Feature not found' });
      }

      const data = doc.data();
      const voterFingerprints = data.voterFingerprints || [];

      // Check if user already voted
      if (voterFingerprints.includes(fingerprint)) {
        return res.status(409).json({ error: 'Already voted on this feature' });
      }

      // Update vote count and add fingerprint
      await featureDoc.update({
        votes: (data.votes || 0) + 1,
        voterFingerprints: [...voterFingerprints, fingerprint]
      });

      return res.status(200).json({
        votes: (data.votes || 0) + 1,
        message: 'Vote recorded successfully!'
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Features API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}