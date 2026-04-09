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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // Document operations
  async createDocument(appId, document) {
    if (!this.isSyncEnabled()) return null;
    
    return await this.request("/api/documents", {
      method: "POST",
      body: JSON.stringify({
        appId,
        document: {
          ...document,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  }

  async updateDocument(documentId, updates) {
    if (!this.isSyncEnabled()) return null;
    
    return await this.request(`/api/documents/${documentId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...updates,
        updatedAt: new Date().toISOString(),
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
      const response = await this.request("/api/health");
      return { connected: true, response };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;