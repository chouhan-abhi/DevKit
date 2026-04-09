/**
 * Analytics Service for DevKit App
 * Logs user interactions and app usage to the crawler backend analytics system
 */

import { API_CONFIG } from "../../config/api";
import { apiService } from "./ApiService";

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.isEnabled = true;
    this.queue = [];
    this.flushTimer = null;
    this.flushInterval = 5000; // 5 seconds
    this.maxQueueSize = 10;
    
    // Initialize session tracking
    this.init();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    // Log session start
    this.trackEvent('session_start', '/devkit', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session_hidden', window.location.pathname);
      } else {
        this.trackEvent('session_visible', window.location.pathname);
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', window.location.pathname, {
        sessionDuration: Date.now() - this.sessionStartTime,
      });
      this.flush(true); // Synchronous flush on unload
    });

    // Start flush timer
    this.startFlushTimer();
  }

  getClientInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
    };
  }

  getAppInfo() {
    return {
      application: 'DevKit',
      appName: 'DevKit Frontend',
      appVersion: '1.0.0', // You can make this dynamic
      appPlatform: 'web',
      appBuild: process.env.NODE_ENV || 'development',
    };
  }

  getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      userAgent: ua,
      platform: navigator.platform,
      language: navigator.language,
      secChUaPlatform: this.getClientHint('sec-ch-ua-platform'),
      secChUaMobile: this.getClientHint('sec-ch-ua-mobile'),
      secChUaModel: this.getClientHint('sec-ch-ua-model'),
      secChUaArch: this.getClientHint('sec-ch-ua-arch'),
      secChUaBitness: this.getClientHint('sec-ch-ua-bitness'),
    };
  }

  getClientHint(name) {
    // Client hints are not directly accessible via JS, but we can try
    // This would typically be sent by the browser in headers
    return null;
  }

  trackEvent(eventType, path = window.location.pathname, data = {}) {
    if (!this.isEnabled) return;

    const event = {
      token: apiService.getToken(),
      eventType,
      path,
      href: window.location.href,
      client: this.getClientInfo(),
      app: this.getAppInfo(),
      device: this.getDeviceInfo(),
      data: {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        ...data,
      },
    };

    this.queue.push(event);

    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  // App-specific tracking methods
  trackAppOpen(appId) {
    this.trackEvent('app_open', `/apps/${appId}`, {
      appId,
      openedAt: Date.now(),
    });
  }

  trackAppClose(appId, duration) {
    this.trackEvent('app_close', `/apps/${appId}`, {
      appId,
      duration,
      closedAt: Date.now(),
    });
  }

  trackDocumentCreate(appId, documentId) {
    this.trackEvent('document_create', `/apps/${appId}`, {
      appId,
      documentId,
      action: 'create',
    });
  }

  trackDocumentEdit(appId, documentId, changes = {}) {
    this.trackEvent('document_edit', `/apps/${appId}`, {
      appId,
      documentId,
      action: 'edit',
      changes,
    });
  }

  trackDocumentDelete(appId, documentId) {
    this.trackEvent('document_delete', `/apps/${appId}`, {
      appId,
      documentId,
      action: 'delete',
    });
  }

  trackFeatureUse(feature, context = {}) {
    this.trackEvent('feature_use', window.location.pathname, {
      feature,
      context,
    });
  }

  trackError(error, context = {}) {
    this.trackEvent('error', window.location.pathname, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
    });
  }

  trackPerformance(metric, value, context = {}) {
    this.trackEvent('performance', window.location.pathname, {
      metric,
      value,
      context,
    });
  }

  trackSync(action, result, context = {}) {
    this.trackEvent('sync_action', window.location.pathname, {
      action, // 'upload', 'download', 'auto_sync'
      result, // 'success', 'error'
      context,
    });
  }

  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  async flush(synchronous = false) {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const promises = events.map(event => this.sendEvent(event, synchronous));
      
      if (synchronous) {
        // Use sendBeacon for synchronous sending (e.g., on page unload)
        promises.forEach(promise => {
          // sendBeacon doesn't return a promise, so we can't await it
          // but it's more reliable for unload events
        });
      } else {
        await Promise.allSettled(promises);
      }
    } catch (error) {
      console.warn('Analytics flush failed:', error);
      // Re-queue events on failure (but limit retries to avoid infinite loops)
      if (events.length < 50) { // Arbitrary limit
        this.queue.unshift(...events);
      }
    }
  }

  async sendEvent(event, synchronous = false) {
    const url = `${API_CONFIG.BASE_URL}/api/analytics/visit`;
    
    console.log(`[AnalyticsService] Sending event to: ${url}`, {
      eventType: event.eventType,
      path: event.path,
      synchronous
    });
    
    if (synchronous && navigator.sendBeacon) {
      // Use sendBeacon for reliable delivery on page unload
      const success = navigator.sendBeacon(url, JSON.stringify(event));
      console.log(`[AnalyticsService] sendBeacon result:`, success);
      if (!success) {
        throw new Error('sendBeacon failed');
      }
      return;
    }

    // Regular fetch for async sending
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        keepalive: synchronous, // Keep connection alive for unload events
      });

      console.log(`[AnalyticsService] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AnalyticsService] Error response:`, errorText);
        throw new Error(`Analytics request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error(`[AnalyticsService] Send event failed:`, error);
      throw error;
    }
  }

  // Configuration methods
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.startFlushTimer();
    } else {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
    }
  }

  isAnalyticsEnabled() {
    return this.isEnabled;
  }

  // Manual flush for testing or immediate sending
  async flushNow() {
    await this.flush();
  }

  // Get current session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      duration: Date.now() - this.sessionStartTime,
      queueSize: this.queue.length,
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;