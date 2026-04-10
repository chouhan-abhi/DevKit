import React, { useState, useEffect } from "react";
import { Cloud, CloudOff, RotateCw, Key, Check, X, AlertCircle, Loader2, Server } from "lucide-react";
import { apiService } from "../services/ApiService";
import { API_CONFIG } from "../../config/api";

export default function CloudSyncSettings() {
  const [token, setToken] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [backendUrl, setBackendUrl] = useState("");

  useEffect(() => {
    // Initialize with current settings
    const currentToken = apiService.getToken();
    const currentSyncEnabled = apiService.isSyncEnabled();
    const storedUrl = localStorage.getItem('devkit_api_base_url') || API_CONFIG.BASE_URL;
    
    setToken(currentToken || "");
    setSyncEnabled(currentSyncEnabled);
    setBackendUrl(storedUrl);
    
    if (currentToken && currentSyncEnabled) {
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.checkConnection();
      setIsConnected(result.connected);
      if (!result.connected) {
        setError(result.error || "Connection failed");
      } else {
        setError("");
      }
    } catch (err) {
      setIsConnected(false);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateToken = async () => {
    setIsLoading(true);
    setError("");
    try {
      const newToken = await apiService.createToken();
      setToken(newToken);
      apiService.setToken(newToken);
      setStatus("New token created successfully!");
      setTimeout(() => setStatus(""), 3000);
      await checkConnection();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToken = async () => {
    if (!token.trim()) {
      setError("Please enter a valid token");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      apiService.setToken(token.trim());
      setStatus("Token saved successfully!");
      setTimeout(() => setStatus(""), 3000);
      await checkConnection();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSync = async () => {
    const newSyncEnabled = !syncEnabled;
    setSyncEnabled(newSyncEnabled);
    apiService.setSyncEnabled(newSyncEnabled);
    
    if (newSyncEnabled && token) {
      await checkConnection();
    } else {
      setIsConnected(false);
    }
    
    setStatus(newSyncEnabled ? "Cloud sync enabled" : "Cloud sync disabled");
    setTimeout(() => setStatus(""), 3000);
  };

  const handleClearToken = () => {
    setToken("");
    setSyncEnabled(false);
    setIsConnected(false);
    apiService.clearToken();
    apiService.setSyncEnabled(false);
    setStatus("Token cleared and sync disabled");
    setTimeout(() => setStatus(""), 3000);
  };

  const handleUpdateBackendUrl = () => {
    if (backendUrl.trim()) {
      localStorage.setItem('devkit_api_base_url', backendUrl.trim());
      // Update the API service base URL
      apiService.baseUrl = backendUrl.trim();
      setStatus("Backend URL updated. Please refresh the page.");
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const handleResetBackendUrl = () => {
    localStorage.removeItem('devkit_api_base_url');
    setBackendUrl(API_CONFIG.BASE_URL);
    setStatus("Backend URL reset to default. Please refresh the page.");
    setTimeout(() => setStatus(""), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Cloud size={20} style={{ color: "var(--primary-color)" }} />
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
          Cloud Sync
        </h3>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 p-3 rounded-lg" style={{ 
        background: isConnected ? "var(--accent-green)" : syncEnabled ? "var(--accent-orange)" : "var(--border-subtle)",
        color: isConnected || syncEnabled ? "#ffffff" : "var(--text-muted)"
      }}>
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isConnected ? (
          <Check size={16} />
        ) : syncEnabled ? (
          <AlertCircle size={16} />
        ) : (
          <CloudOff size={16} />
        )}
        <span className="text-sm font-medium">
          {isLoading ? "Checking connection..." : 
           isConnected ? "Connected to cloud" :
           syncEnabled ? "Sync enabled but not connected" :
           "Cloud sync disabled"}
        </span>
      </div>

      {/* Backend URL Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Backend URL
        </h4>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="url"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="https://your-backend.workers.dev"
              className="w-full px-3 py-2 text-sm border rounded"
              style={{
                background: "var(--panel-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
          </div>
          <button
            onClick={handleUpdateBackendUrl}
            disabled={isLoading || !backendUrl.trim()}
            className="toolbar-btn"
            style={{ opacity: isLoading || !backendUrl.trim() ? 0.5 : 1 }}
          >
            <Server size={14} />
            Update
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleResetBackendUrl}
            className="toolbar-btn"
            style={{ color: "var(--text-muted)" }}
          >
            Reset to Default
          </button>
          
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Current: {apiService.baseUrl || API_CONFIG.BASE_URL}
          </div>
        </div>
      </div>

      {/* Token Management */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          API Token
        </h4>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your API token"
              className="w-full px-3 py-2 text-sm border rounded"
              style={{
                background: "var(--panel-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            />
          </div>
          <button
            onClick={handleSaveToken}
            disabled={isLoading || !token.trim()}
            className="toolbar-btn"
            style={{ opacity: isLoading || !token.trim() ? 0.5 : 1 }}
          >
            <Key size={14} />
            Save
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreateToken}
            disabled={isLoading}
            className="toolbar-btn"
            style={{ opacity: isLoading ? 0.5 : 1 }}
          >
            Create New Token
          </button>
          
          <button
            onClick={async () => {
              const result = await apiService.testApi();
              console.log('API Test Result:', result);
              alert(`API Test: ${result.connected ? 'SUCCESS' : 'FAILED'}\n${result.error || 'Connection working'}`);
            }}
            disabled={isLoading}
            className="toolbar-btn"
            style={{ opacity: isLoading ? 0.5 : 1 }}
          >
            Test API
          </button>
          
          {token && (
            <button
              onClick={handleClearToken}
              className="toolbar-btn"
              style={{ color: "var(--accent-red)" }}
            >
              Clear Token
            </button>
          )}
        </div>
      </div>

      {/* Sync Toggle */}
      {token && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg" style={{ 
            borderColor: "var(--border-color)",
            background: "var(--panel-color)"
          }}>
            <div>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                Enable Cloud Sync
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Automatically sync documents to the cloud
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={handleToggleSync}
                className="sr-only peer"
              />
              <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                   style={{ 
                     background: syncEnabled ? "var(--primary-color)" : "var(--border-color)"
                   }}>
              </div>
            </label>
          </div>

          {syncEnabled && (
            <button
              onClick={checkConnection}
              disabled={isLoading}
              className="toolbar-btn"
              style={{ opacity: isLoading ? 0.5 : 1 }}
            >
              <RotateCw size={14} />
              Test Connection
            </button>
          )}
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div className="p-3 rounded-lg" style={{ 
          background: "var(--accent-green)",
          color: "#ffffff"
        }}>
          <div className="flex items-center gap-2">
            <Check size={16} />
            <span className="text-sm">{status}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg" style={{ 
          background: "var(--accent-red)",
          color: "#ffffff"
        }}>
          <div className="flex items-center gap-2">
            <X size={16} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs space-y-2" style={{ color: "var(--text-muted)" }}>
        <p>
          <strong>Local-First:</strong> Your documents are always saved locally first. 
          Cloud sync is optional and provides backup and cross-device access.
        </p>
        <p>
          <strong>Privacy:</strong> Documents are associated with your token and only 
          accessible to you. No data is shared between users.
        </p>
      </div>
    </div>
  );
}