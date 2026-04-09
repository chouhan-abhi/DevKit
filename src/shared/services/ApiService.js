/**
 * API Service for backend communication
 * Handles document operations with the crawler backend system
 */

import { storage } from "./StorageManager";
import { API_CONFIG } from "../../config/api";
const TOKEN_KEY = "api_token";
const SYNC_ENABLED_KEY = "sync_enabled";

class ApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.token = null;
    this.syncEnabled = false;
    this.init();
  }

  init() {
    this.token = storage.get(TOKEN_KEY);
    this.syncEnabled = storage.get(SYNC_ENABLED_KEY, false);
  }

  // Token management
  setToken(token) {
    this.token = token;
    storage.set(TOKEN_KEY, token);
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    storage.remove(TOKEN_KEY);
  }

  // Sync settings
  setSyncEnabled(enabled) {
    this.syncEnabled = enabled;
    storage.set(SYNC_ENABLED_KEY, enabled);
  }

  isSyncEnabled() {
    return this.syncEnabled && !!this.token;
  }

  // HTTP request helper
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    console.log(`[ApiService] Making request to: ${url}`, {
      method: options.method || 'GET',
      headers: { ...headers, Authorization: this.token ? `Bearer ${this.token.substring(0, 10)}...` : 'none' },
      hasBody: !!options.body
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`[ApiService] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ApiService] Error response:`, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[ApiService] Response data:`, data);
      return data;
    } catch (error) {
      console.error(`[ApiService] Request failed for ${url}:`, error);
      throw error;
    }
  }

  // Document operations
  async createDocument(appId, document) {
    if (!this.isSyncEnabled()) return null;
    
    return await this.request("/api/documents", {
      method: "POST",
      body: JSON.stringify({
        id: document.id,
        appId,
        title: document.title || 'Untitled',
        content: document.content || '',
        type: document.type,
        metadata: document.metadata,
      }),
    });
  }

  async updateDocument(documentId, updates) {
    if (!this.isSyncEnabled()) return null;
    
    return await this.request(`/api/documents/${documentId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: updates.title,
        content: updates.content,
        type: updates.type,
        metadata: updates.metadata,
      }),
    });
  }

  async deleteDocument(documentId) {
    if (!this.isSyncEnabled()) return null;
    
    return await this.request(`/api/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  async getDocuments(appId) {
    if (!this.isSyncEnabled()) return [];
    
    const response = await this.request(`/api/documents?appId=${appId}`);
    return response.documents || [];
  }

  async getDocument(documentId) {
    if (!this.isSyncEnabled()) return null;
    
    const response = await this.request(`/api/documents/${documentId}`);
    return response.document || null;
  }

  // Token creation (for new users)
  async createToken() {
    const response = await this.request("/api/token", {
      method: "POST",
    });
    return response.token;
  }

  // Sync operations
  async syncToCloud(localDocuments) {
    if (!this.isSyncEnabled()) return { success: false, error: "Sync not enabled" };
    
    try {
      const results = [];
      for (const doc of localDocuments) {
        try {
          if (doc.cloudId) {
            // Update existing document
            const result = await this.updateDocument(doc.cloudId, doc);
            results.push({ local: doc, cloud: result, action: "updated" });
          } else {
            // Create new document
            const result = await this.createDocument(doc.appId, doc);
            results.push({ local: doc, cloud: result, action: "created" });
          }
        } catch (error) {
          results.push({ local: doc, error: error.message, action: "failed" });
        }
      }
      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async syncFromCloud(appId) {
    if (!this.isSyncEnabled()) return { success: false, error: "Sync not enabled" };
    
    try {
      const cloudDocuments = await this.getDocuments(appId);
      return { success: true, documents: cloudDocuments };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Health check
  async checkConnection() {
    try {
      console.log(`[ApiService] Testing connection to: ${this.baseUrl}`);
      
      // Try a simple endpoint first - the token creation endpoint
      const response = await fetch(`${this.baseUrl}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      console.log(`[ApiService] Connection test response: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[ApiService] Connection successful, got token:`, data.token?.substring(0, 10) + '...');
        return { connected: true, response: data };
      } else {
        const errorText = await response.text();
        console.error(`[ApiService] Connection failed:`, errorText);
        return { connected: false, error: `${response.status} ${response.statusText}: ${errorText}` };
      }
    } catch (error) {
      console.error(`[ApiService] Connection test failed:`, error);
      return { connected: false, error: error.message };
    }
  }

  // Test method to verify API is working
  async testApi() {
    console.log(`[ApiService] Testing API configuration:`);
    console.log(`- Base URL: ${this.baseUrl}`);
    console.log(`- Token: ${this.token ? this.token.substring(0, 10) + '...' : 'none'}`);
    console.log(`- Sync Enabled: ${this.isSyncEnabled()}`);
    
    const connectionTest = await this.checkConnection();
    console.log(`- Connection Test:`, connectionTest);
    
    return connectionTest;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;