# Analytics Integration Guide

This guide explains the comprehensive analytics system integrated into DevKit, including frontend tracking, backend integration, and the enhanced analytics dashboard.

## Overview

The DevKit analytics system provides:
- **Real-time usage tracking** - Monitor how users interact with the app
- **Privacy-first approach** - Anonymous data collection with user consent
- **Enhanced dashboard** - Modern 2-panel analytics interface
- **Performance insights** - Track app performance and errors
- **Session management** - Detailed session tracking and user flows

## Architecture

### Frontend Components

#### 1. Analytics Service (`src/shared/services/AnalyticsService.js`)
Core service that handles all analytics collection:

```javascript
import { analyticsService } from '../services/AnalyticsService';

// Track custom events
analyticsService.trackEvent('feature_use', '/journal', {
  feature: 'calendar_view',
  context: { entries: 5 }
});

// Track app-specific events
analyticsService.trackAppOpen('journal');
analyticsService.trackDocumentCreate('journal', 'entry_2024-01-01');
```

**Key Features:**
- Automatic session tracking
- Queue-based event batching
- Graceful error handling
- Configurable flush intervals
- Page unload handling with `sendBeacon`

#### 2. Analytics Hooks (`src/shared/hooks/useAnalytics.js`)
React hooks for easy integration:

```javascript
import { useAppAnalytics, useDocumentAnalytics } from '../hooks/useAnalytics';

// In app components
const analytics = useAppAnalytics('journal');

// In document management
const docAnalytics = useDocumentAnalytics('journal');
docAnalytics.trackCreate('doc_123');
docAnalytics.trackEdit('doc_123', { contentLength: 150 });
```

**Available Hooks:**
- `useAnalytics()` - Basic analytics functions
- `useAppAnalytics(appId)` - App lifecycle tracking
- `useDocumentAnalytics(appId)` - Document operation tracking
- `useFeatureAnalytics()` - Feature usage tracking
- `useErrorAnalytics()` - Automatic error tracking

#### 3. Analytics Settings (`src/shared/components/AnalyticsSettings.jsx`)
User-facing settings component for privacy control:
- Enable/disable analytics collection
- View current session information
- Privacy policy and data usage explanation
- Real-time session statistics

### Backend Integration

#### API Endpoint
The analytics data is sent to the same crawler backend that handles document sync:

```
POST /api/analytics/visit
Content-Type: application/json

{
  "token": "user_token_optional",
  "eventType": "app_open",
  "path": "/journal",
  "href": "https://devkit.app/journal",
  "client": {
    "userAgent": "...",
    "viewport": { "width": 1920, "height": 1080 },
    "language": "en-US"
  },
  "app": {
    "application": "DevKit",
    "appName": "DevKit Frontend",
    "appVersion": "1.0.0"
  },
  "device": {
    "platform": "MacIntel",
    "language": "en-US"
  },
  "data": {
    "sessionId": "session_123",
    "timestamp": 1640995200000,
    "appId": "journal"
  }
}
```

#### Enhanced Analytics Dashboard

The enhanced dashboard (`docs/enhanced-analytics-html.js`) provides:

**Left Panel:**
- Key metrics (users, sessions, avg. session time)
- App usage breakdown
- Geographic distribution

**Right Panel:**
- Activity timeline (14-day chart)
- Event types breakdown
- System health indicators

**Features:**
- Real-time updates with auto-refresh
- Time range filtering (24h, 7d, 30d, 90d)
- Responsive 2-panel layout
- Modern UI with animations
- Admin authentication

## Event Types

### Core Events
- `session_start` - User opens the app
- `session_end` - User closes the app
- `session_hidden` - Tab becomes hidden
- `session_visible` - Tab becomes visible
- `page_view` - Navigation between routes

### App Events
- `app_open` - Specific app/module opened
- `app_close` - Specific app/module closed

### Document Events
- `document_create` - New document created
- `document_edit` - Document modified
- `document_delete` - Document deleted

### Feature Events
- `feature_use` - Specific feature used
- `sidebar_toggle` - Sidebar expanded/collapsed
- `journal_view_change` - Journal view switched

### Sync Events
- `sync_action` - Cloud sync operation
  - `action`: 'upload', 'download', 'auto_sync'
  - `result`: 'success', 'error'

### Error Events
- `error` - JavaScript errors
- `unhandled_rejection` - Promise rejections

### Performance Events
- `performance` - Performance metrics

## Data Collection

### What We Collect
✅ **Anonymous usage patterns**
✅ **Performance metrics**
✅ **Device/browser information**
✅ **Session duration**
✅ **Feature usage statistics**
✅ **Error reports**

### What We DON'T Collect
❌ **Personal information**
❌ **Document content**
❌ **User credentials**
❌ **File names or titles**
❌ **IP addresses (stored)**
❌ **Tracking cookies**

### Privacy Features
- **User consent required** - Analytics can be disabled
- **Anonymous by default** - No personally identifiable information
- **Local-first** - Data processed locally before sending
- **Configurable** - Users control what's tracked
- **Transparent** - Clear privacy policy in settings

## Implementation Guide

### 1. Basic Integration

Add analytics to any component:

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const analytics = useAnalytics();
  
  const handleAction = () => {
    analytics.trackFeatureUse('my_feature', {
      context: 'button_click',
      value: 42
    });
  };
  
  return <button onClick={handleAction}>Click me</button>;
}
```

### 2. App-Level Integration

Track app lifecycle automatically:

```javascript
import { useAppAnalytics } from '../hooks/useAnalytics';

function MyApp() {
  const analytics = useAppAnalytics('my-app');
  
  // Automatically tracks:
  // - app_open when component mounts
  // - app_close when component unmounts
  // - Session duration
  
  return <div>My App Content</div>;
}
```

### 3. Document Operations

Track document operations:

```javascript
import { useDocumentAnalytics } from '../hooks/useAnalytics';

function DocumentEditor({ documentId }) {
  const analytics = useDocumentAnalytics('my-app');
  
  const handleSave = (content) => {
    // Save document...
    
    analytics.trackEdit(documentId, {
      contentLength: content.length,
      hasImages: content.includes('<img'),
      saveMethod: 'auto'
    });
  };
  
  return <Editor onSave={handleSave} />;
}
```

### 4. Error Tracking

Automatic error tracking:

```javascript
import { useErrorAnalytics } from '../hooks/useAnalytics';

function App() {
  useErrorAnalytics(); // Automatically tracks all errors
  
  return <MyAppContent />;
}
```

## Backend Setup

### 1. Update Crawler Worker

Copy the enhanced analytics HTML template to your crawler:

```javascript
// Replace the existing getAnalyticsHtml function
import { getEnhancedAnalyticsHtml } from './enhanced-analytics-html.js';

// In your route handler
if (path === "/analytics" && method === "GET") {
  return htmlResponse(getEnhancedAnalyticsHtml(theme));
}
```

### 2. Configure API Base URL

Update the frontend configuration:

```javascript
// src/config/api.js
export const API_CONFIG = {
  BASE_URL: 'https://your-crawler-backend.workers.dev',
  // ... rest of config
};
```

### 3. Test Integration

1. Deploy your updated crawler backend
2. Update the API configuration in DevKit
3. Enable analytics in Settings → Analytics & Privacy
4. Use the app and verify events in the analytics dashboard

## Analytics Dashboard

### Accessing the Dashboard

1. Navigate to `https://your-backend.workers.dev/analytics`
2. Enter your admin API key
3. View real-time analytics data

### Dashboard Features

**Overview Panel:**
- Total users and sessions
- Average session duration
- Active users today
- App usage breakdown
- Geographic distribution

**Detailed Analytics Panel:**
- 14-day activity timeline
- Event type breakdown
- System health metrics
- Real-time updates

**Controls:**
- Time range selector (24h, 7d, 30d, 90d)
- Auto-refresh toggle
- Manual refresh button
- Admin logout

## Development

### Local Testing

1. Start the DevKit development server:
```bash
bun run dev
```

2. Start your crawler backend locally:
```bash
# In your crawler project
npm run dev
```

3. Update API config for local development:
```javascript
BASE_URL: 'http://localhost:8787'
```

### Debugging

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'analytics:*');
```

View analytics queue:
```javascript
// In browser console
analyticsService.getSessionInfo();
```

Manual flush for testing:
```javascript
// In browser console
analyticsService.flushNow();
```

## Configuration Options

### Analytics Service Configuration

```javascript
// Modify in AnalyticsService.js
class AnalyticsService {
  constructor() {
    this.flushInterval = 5000; // 5 seconds
    this.maxQueueSize = 10;    // Max events before auto-flush
    this.isEnabled = true;     // Default enabled state
  }
}
```

### Event Filtering

Add custom event filtering:

```javascript
trackEvent(eventType, path, data) {
  // Skip certain events
  if (eventType === 'debug_event' && process.env.NODE_ENV === 'production') {
    return;
  }
  
  // Filter sensitive data
  const sanitizedData = {
    ...data,
    // Remove any sensitive fields
  };
  
  // Continue with normal tracking...
}
```

## Privacy Compliance

### GDPR Compliance
- ✅ User consent required
- ✅ Right to disable tracking
- ✅ Data anonymization
- ✅ Clear privacy policy
- ✅ No cross-site tracking

### Best Practices
1. **Transparent data collection** - Clear about what's tracked
2. **Minimal data collection** - Only collect what's necessary
3. **User control** - Easy opt-out mechanism
4. **Data retention** - Automatic cleanup after 90 days
5. **Security** - Encrypted data transmission

## Troubleshooting

### Common Issues

**Analytics not working:**
1. Check if analytics is enabled in settings
2. Verify API base URL configuration
3. Check browser console for errors
4. Verify backend is receiving requests

**Dashboard not loading:**
1. Verify admin API key
2. Check CORS configuration
3. Ensure analytics endpoint is accessible
4. Check browser network tab for failed requests

**Events not appearing:**
1. Check event queue size (may be batched)
2. Verify flush interval settings
3. Check for JavaScript errors
4. Ensure backend is processing events correctly

### Debug Commands

```javascript
// Check analytics status
analyticsService.isAnalyticsEnabled();

// View current session
analyticsService.getSessionInfo();

// Manual flush
analyticsService.flushNow();

// View queue
console.log(analyticsService.queue);
```

## Future Enhancements

### Planned Features
- [ ] A/B testing framework
- [ ] Funnel analysis
- [ ] Cohort analysis
- [ ] Custom event dashboards
- [ ] Real-time alerts
- [ ] Performance monitoring
- [ ] User journey mapping

### Advanced Analytics
- [ ] Heatmap tracking
- [ ] Scroll depth analysis
- [ ] Click tracking
- [ ] Form analytics
- [ ] Page performance metrics
- [ ] Custom conversion goals

This comprehensive analytics system provides deep insights into DevKit usage while maintaining user privacy and providing full transparency about data collection.