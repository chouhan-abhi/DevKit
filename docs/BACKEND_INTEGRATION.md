# Backend Integration Guide

This guide explains how to integrate the DevKit frontend with a backend API for cloud synchronization and multi-device access.

## Overview

The DevKit app follows a **local-first** architecture:
- Documents are always saved locally first
- Cloud sync is optional and provides backup + cross-device access
- The app works fully offline without any backend
- Users can optionally enable cloud sync with an API token

## Backend Requirements

The backend should be based on the crawler project structure and provide these endpoints:

### Authentication
- Uses token-based authentication (similar to crawler dashboard tokens)
- Tokens are created via `POST /api/token`
- Tokens are passed via `Authorization: Bearer <token>` header

### Required API Endpoints

#### 1. Health Check
```
GET /api/health
Response: { "status": "healthy", "timestamp": "2024-01-01T00:00:00.000Z" }
```

#### 2. Token Management
```
POST /api/token
Response: { "token": "abc123...", "config": [], "theme": {} }
```

#### 3. Document Operations
```
# Create document
POST /api/documents
Body: { "appId": "journal", "document": { "title": "...", "content": {...} } }
Response: { "success": true, "document": { "id": "doc_123", ... } }

# List documents
GET /api/documents?appId=journal
Response: { "success": true, "documents": [...] }

# Get document
GET /api/documents/:id
Response: { "success": true, "document": {...} }

# Update document
PUT /api/documents/:id
Body: { "title": "...", "content": {...}, "meta": {...} }
Response: { "success": true, "document": {...} }

# Delete document
DELETE /api/documents/:id
Response: { "success": true }
```

## Database Schema

Add this table to your D1 database:

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  title TEXT,
  content TEXT, -- JSON string
  meta TEXT,    -- JSON string for additional metadata
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
);

CREATE INDEX idx_documents_profile_app ON documents (profile_id, app_id);
CREATE INDEX idx_documents_updated ON documents (updated_at DESC);
```

## Backend Implementation

### 1. Add Routes to Crawler Worker

Copy the routes from `src/shared/services/DocumentApi.js` and add them to your crawler's `routeRequest` function.

### 2. Add Database Functions

Copy the database functions from `src/shared/services/DocumentApi.js` and add them to your D1 storage module.

### 3. Update Schema Initialization

Add `ensureDocumentSchema(db)` to your schema initialization function.

## Frontend Configuration

### 1. Update API Base URL

Edit `src/config/api.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'https://your-crawler-backend.workers.dev',
  // ... rest of config
};
```

### 2. Environment Variables

For different environments, you can set:

```javascript
// Development
BASE_URL: 'http://localhost:8787'

// Production  
BASE_URL: 'https://your-production-backend.workers.dev'
```

## User Experience

### First Time Setup
1. User opens the app - works normally with local storage
2. User goes to Settings → Cloud Sync
3. User clicks "Create New Token" to get an API token
4. User enables cloud sync
5. Documents start syncing automatically

### Sync Behavior
- **Auto-sync**: Documents sync automatically when cloud sync is enabled
- **Manual sync**: Users can manually upload/download via sync buttons
- **Conflict resolution**: Last-write-wins (cloud timestamp vs local timestamp)
- **Offline resilience**: App works normally when offline, syncs when back online

### Sync Status Indicators
- **Local**: Document saved locally only
- **Syncing**: Currently uploading to cloud
- **Synced**: Successfully synced with cloud
- **Error**: Sync failed (with retry option)

## Security Considerations

### Token Security
- Tokens are stored in localStorage (same as current app data)
- Tokens should be long, random strings (32+ characters)
- Tokens should be scoped to individual users/profiles

### Data Privacy
- Documents are only accessible to the token owner
- No cross-user data access
- All API calls require valid token authentication

### CORS Configuration
- Configure CORS to allow your frontend domain
- Use the same CORS setup as the crawler dashboard

## Development Setup

### 1. Local Backend
```bash
# In your crawler project
npm run dev
# Backend runs on http://localhost:8787
```

### 2. Frontend Development
```bash
# In DevKit project
bun run dev
# Frontend runs on http://localhost:5173
```

### 3. Testing Integration
1. Create a token via the Settings page
2. Enable cloud sync
3. Create/edit documents and verify sync status
4. Check browser network tab for API calls
5. Verify documents in backend database

## Deployment

### 1. Deploy Backend
Deploy your crawler worker with document API endpoints to Cloudflare Workers.

### 2. Update Frontend Config
Update `API_CONFIG.BASE_URL` to point to your production backend.

### 3. Deploy Frontend
Deploy the frontend to your preferred hosting (Vercel, Netlify, etc.).

## Troubleshooting

### Common Issues

#### "Connection failed" in sync settings
- Check if backend URL is correct
- Verify CORS configuration
- Check browser network tab for errors

#### Documents not syncing
- Verify token is valid and saved
- Check sync is enabled in settings
- Look for error messages in sync status

#### Sync conflicts
- Currently uses last-write-wins
- Future: Could implement conflict resolution UI

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'api:*');
```

## Future Enhancements

### Planned Features
- [ ] Conflict resolution UI
- [ ] Selective sync (choose which documents to sync)
- [ ] Sync history and version control
- [ ] Team collaboration (shared documents)
- [ ] Real-time sync via WebSockets

### API Extensions
- [ ] Bulk operations for faster sync
- [ ] Delta sync (only changed content)
- [ ] Document versioning
- [ ] Sharing and permissions

## Support

For backend integration issues:
1. Check this documentation
2. Review the example code in `src/shared/services/DocumentApi.js`
3. Test with the health endpoint first
4. Verify token creation and authentication
5. Check browser developer tools for network errors