# Firebase Feature Requests Setup Guide

## Overview
The feature requests system uses Firebase Firestore for persistence with full security - no environment variables are exposed to the browser. All Firebase operations happen server-side through API endpoints.

## Security Architecture
- **Client**: Only makes HTTP requests to `/api/features`
- **Server**: Firebase Admin SDK with service account credentials
- **Database**: Firestore with server-side authentication only
- **Vote Protection**: Client fingerprinting prevents duplicate votes

## Required Environment Variables (Vercel)

Add these to your Vercel environment variables dashboard:

```bash
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=worldofthemaps
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@worldofthemaps.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----
```

### Getting Firebase Credentials

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`  
   - `private_key` → `FIREBASE_PRIVATE_KEY`

⚠️ **Important**: Replace actual `\n` characters in private key with literal `\n` string for Vercel.

## Firestore Database Structure

### Collection: `featureRequests`
```javascript
{
  title: "Feature name (max 120 chars)",
  description: "Optional description (max 600 chars)", 
  votes: 5,
  created: 1696876543210, // timestamp
  submitterFingerprint: "fp_abc123_def456",
  voterFingerprints: ["fp_abc123_def456", "fp_xyz789_ghi012"]
}
```

### Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only server-side access via Admin SDK
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## API Endpoints

### GET `/api/features?page=0&limit=20`
List features with pagination, ordered by votes desc then created desc.

**Response:**
```javascript
{
  features: [{ id, title, description, votes, created }],
  pagination: { page, limit, total, totalPages, hasMore }
}
```

### POST `/api/features`
Submit new feature request.

**Request:**
```javascript
{ title: "string", description: "string", fingerprint: "string" }
```

**Response:**
```javascript
{ id, title, description, votes: 1, created, message }
```

### POST `/api/features?vote=true`
Upvote existing feature.

**Request:**
```javascript
{ featureId: "string", fingerprint: "string" }
```

**Response:**
```javascript
{ votes: 6, message: "Vote recorded successfully!" }
```

## Client Features

### Offline Support
- Automatic fallback to localStorage when Firebase is unavailable
- Seamless synchronization when connection restored
- Toast notifications indicate local vs remote saves

### Vote Protection
- Stable client fingerprint generated from browser characteristics
- Server-side validation prevents duplicate votes per device
- Graceful handling of already-voted scenarios

### UX Enhancements
- **Optimistic UI**: Immediate visual feedback for votes
- **Toast Notifications**: Success/error messages for all actions
- **Pagination**: "Load more" button with remaining count
- **Loading States**: Proper loading indicators throughout

### New Feature Indicator
- Red dot appears when new features exist since last visit
- Integrates with both localStorage and remote timestamps
- Automatically clears when modal opened

## Free Tier Limits (Firestore)
- **Reads**: 50,000 per day
- **Writes**: 20,000 per day  
- **Storage**: 1 GB
- **Bandwidth**: 10 GB per month

Perfect for feature requests system - should handle thousands of users easily.

## Development vs Production

**Development** (localhost):
- Uses localStorage fallback automatically
- Firebase calls will fail gracefully
- No environment variables needed

**Production** (Vercel):
- Requires environment variables configured
- Full Firebase Firestore integration
- Real-time synchronization across users

## Troubleshooting

### "Firebase Admin not initialized"
- Check environment variables are set in Vercel
- Verify private key format (literal `\n` strings)
- Ensure project ID matches Firebase console

### "Permission denied" errors  
- Confirm Firestore security rules allow server access
- Verify service account has Firestore permissions
- Check Firebase project is in production mode

### Vote duplicates
- Client fingerprint should be stable across sessions
- Server validates fingerprints in `voterFingerprints` array
- Clear localStorage to test new fingerprint generation