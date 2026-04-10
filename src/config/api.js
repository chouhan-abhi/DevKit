/**
 * API Configuration
 * Update these settings to match your backend deployment
 */

// Replace with your actual crawler backend URL
export const API_CONFIG = {
  // For local development - update these URLs to match your actual backend
  BASE_URL: 'https://dracket.art',
  
  // API endpoints
  ENDPOINTS: {
    HEALTH: '/api/health',
    TOKEN: '/api/token',
    DOCUMENTS: '/api/documents',
    CONFIG: '/api/config',
    ANALYTICS: '/api/analytics/visit',
  },
  
  // Request settings
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Environment-specific overrides
if (typeof window !== 'undefined') {
  // Browser environment - can be overridden by environment variables
  if (window.ENV?.API_BASE_URL) {
    API_CONFIG.BASE_URL = window.ENV.API_BASE_URL;
  }
}

export default API_CONFIG;