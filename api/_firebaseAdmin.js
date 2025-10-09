// Firebase Admin singleton initializer (server-side only)
// IMPORTANT: Do NOT import this from client bundles.
// Expects environment variables (configured in Vercel project settings):
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY  (with literal newlines or escaped \n)
// These are never exposed to the browser because this file sits in /api.

let adminInstance = null

export async function getFirebaseAdmin() {
  if (adminInstance) return adminInstance
  // Lazy import to avoid bundling if not needed
  const admin = (await import('firebase-admin')).default

  if (admin.apps && admin.apps.length) {
    adminInstance = admin
    return adminInstance
  }

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
  } = process.env

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('[Firebase] Missing environment variables; feature API will operate in degraded mode.')
    throw new Error('Missing Firebase credentials')
  }

  const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  })

  adminInstance = admin
  return adminInstance
}

export async function getFirestore() {
  const admin = await getFirebaseAdmin();
  return admin.firestore();
}
