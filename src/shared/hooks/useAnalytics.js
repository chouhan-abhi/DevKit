/**
 * Analytics Hook for DevKit App
 * Provides easy access to analytics tracking throughout the app
 */

import { useEffect, useRef } from 'react';
import { analyticsService } from '../services/AnalyticsService';

export const useAnalytics = () => {
  return {
    trackEvent: analyticsService.trackEvent.bind(analyticsService),
    trackAppOpen: analyticsService.trackAppOpen.bind(analyticsService),
    trackAppClose: analyticsService.trackAppClose.bind(analyticsService),
    trackDocumentCreate: analyticsService.trackDocumentCreate.bind(analyticsService),
    trackDocumentEdit: analyticsService.trackDocumentEdit.bind(analyticsService),
    trackDocumentDelete: analyticsService.trackDocumentDelete.bind(analyticsService),
    trackFeatureUse: analyticsService.trackFeatureUse.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    trackPerformance: analyticsService.trackPerformance.bind(analyticsService),
    trackSync: analyticsService.trackSync.bind(analyticsService),
    getSessionInfo: analyticsService.getSessionInfo.bind(analyticsService),
    isEnabled: analyticsService.isAnalyticsEnabled.bind(analyticsService),
    setEnabled: analyticsService.setEnabled.bind(analyticsService),
  };
};

// Hook for tracking app lifecycle
export const useAppAnalytics = (appId) => {
  const analytics = useAnalytics();
  const openTimeRef = useRef(null);

  useEffect(() => {
    // Track app open
    openTimeRef.current = Date.now();
    analytics.trackAppOpen(appId);

    // Track app close on unmount
    return () => {
      if (openTimeRef.current) {
        const duration = Date.now() - openTimeRef.current;
        analytics.trackAppClose(appId, duration);
      }
    };
  }, [appId, analytics]);

  return analytics;
};

// Hook for tracking document operations
export const useDocumentAnalytics = (appId) => {
  const analytics = useAnalytics();

  const trackCreate = (documentId) => {
    analytics.trackDocumentCreate(appId, documentId);
  };

  const trackEdit = (documentId, changes = {}) => {
    analytics.trackDocumentEdit(appId, documentId, changes);
  };

  const trackDelete = (documentId) => {
    analytics.trackDocumentDelete(appId, documentId);
  };

  return {
    ...analytics,
    trackCreate,
    trackEdit,
    trackDelete,
  };
};

// Hook for tracking feature usage
export const useFeatureAnalytics = () => {
  const analytics = useAnalytics();

  const trackFeature = (feature, context = {}) => {
    analytics.trackFeatureUse(feature, context);
  };

  return {
    ...analytics,
    trackFeature,
  };
};

// Hook for error tracking
export const useErrorAnalytics = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    const handleError = (event) => {
      analytics.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error',
      });
    };

    const handleUnhandledRejection = (event) => {
      analytics.trackError(event.reason || new Error('Unhandled Promise Rejection'), {
        type: 'unhandled_rejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [analytics]);

  return analytics;
};

export default useAnalytics;