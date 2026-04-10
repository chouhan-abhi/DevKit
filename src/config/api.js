/**
 * API Configuration
 * Update these settings to match your backend deployment
 */

// Replace with your actual crawler backend URL
export const API_CONFIG = {
  // For local development - update these URLs to match your actual backend
  BASE_URL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8787' 
    : 'https://dracket.art',
  
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
  // Browser environment - can be overridden by environment variables or localStorage
  if (window.ENV?.API_BASE_URL) {
    API_CONFIG.BASE_URL = window.ENV.API_BASE_URL;
  }
  
  // Allow runtime override via localStorage (for easy testing)
  const storedBaseUrl = localStorage.getItem('devkit_api_base_url');
  if (storedBaseUrl) {
    API_CONFIG.BASE_URL = storedBaseUrl;
    console.log(`[API Config] Using custom base URL from localStorage: ${storedBaseUrl}`);
  }
}

export default API_CONFIG;