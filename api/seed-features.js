/**
 * One-time script to seed Firestore with initial feature requests
 * Run this locally to populate your production database
 */

import { getFirestore } from './_firebaseAdmin.js';

async function seedFeatures() {
  try {
    const db = await getFirestore();
    const featuresRef = db.collection('featureRequests');
    
    // Check if database already has features
    const existing = await featuresRef.get();
    if (existing.size > 0) {
      console.log(`Database already has ${existing.size} features. Skipping seed.`);
      return;
    }
    
    const testFeatures = [
      {
        title: 'Offline Mode',
        description: 'Play cached recent datasets when offline and sync later.',
        votes: 5,
        created: Date.now() - 3600 * 1000,
        submitterFingerprint: 'seed_fp_1',
        voterFingerprints: ['seed_fp_1', 'seed_fp_2', 'seed_fp_3', 'seed_fp_4', 'seed_fp_5']
      },
      {
        title: 'Global Leaderboard',
        description: 'Daily fastest solve / fewest guesses board (privacy-friendly).',
        votes: 9,
        created: Date.now() - 7200 * 1000,
        submitterFingerprint: 'seed_fp_6',
        voterFingerprints: ['seed_fp_6', 'seed_fp_7', 'seed_fp_8', 'seed_fp_9', 'seed_fp_10', 'seed_fp_11', 'seed_fp_12', 'seed_fp_13', 'seed_fp_14']
      },
      {
        title: 'Classroom Pack',
        description: 'Teacher dashboard to pick dataset and track class results.',
        votes: 3,
        created: Date.now() - 5400 * 1000,
        submitterFingerprint: 'seed_fp_15',
        voterFingerprints: ['seed_fp_15', 'seed_fp_16', 'seed_fp_17']
      }
    ];
    
    console.log('Seeding Firestore with initial features...');
    
    for (const feature of testFeatures) {
      await featuresRef.add(feature);
      console.log(`✅ Added: ${feature.title}`);
    }
    
    console.log('🎉 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Export as API endpoint so you can call it once via browser
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await seedFeatures();
      return res.status(200).json({ message: 'Database seeded successfully!' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}