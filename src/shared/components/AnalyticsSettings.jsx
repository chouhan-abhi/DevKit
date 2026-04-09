import React, { useState, useEffect } from "react";
import { BarChart3, Eye, EyeOff, Info, Shield, Activity } from "lucide-react";
import { analyticsService } from "../services/analyticsService";

export default function AnalyticsSettings() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    // Get current analytics state
    setAnalyticsEnabled(analyticsService.isAnalyticsEnabled());
    setSessionInfo(analyticsService.getSessionInfo());
  }, []);

  const handleToggleAnalytics = () => {
    const newState = !analyticsEnabled;
    setAnalyticsEnabled(newState);
    analyticsService.setEnabled(newState);
    
    // Update session info
    setSessionInfo(analyticsService.getSessionInfo());
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 size={20} style={{ color: "var(--primary-color)" }} />
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
          Analytics & Usage Data
        </h3>
      </div>

      {/* Main Toggle */}
      <div className="p-4 border rounded-lg" style={{ 
        borderColor: "var(--border-color)",
        background: "var(--panel-color)"
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded" style={{ 
              background: analyticsEnabled ? "var(--accent-green)" : "var(--border-subtle)",
              color: analyticsEnabled ? "#ffffff" : "var(--text-muted)"
            }}>
              {analyticsEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
            </div>
            <div>
              <div className="font-medium" style={{ color: "var(--text-color)" }}>
                Usage Analytics
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                {analyticsEnabled 
                  ? "Collecting anonymous usage data to improve the app"
                  : "Analytics collection is disabled"
                }
              </div>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={handleToggleAnalytics}
              className="sr-only peer"
            />
            <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                 style={{ 
                   background: analyticsEnabled ? "var(--primary-color)" : "var(--border-color)"
                 }}>
            </div>
          </label>
        </div>
        
        {analyticsEnabled && (
          <button
            onClick={() => {
              console.log('Testing analytics...');
              analyticsService.trackEvent('test_event', '/settings', {
                test: true,
                timestamp: Date.now()
              });
              alert('Test analytics event sent! Check browser console for details.');
            }}
            className="toolbar-btn mt-3"
          >
            Test Analytics
          </button>
        )}
      </div>

      {/* Session Information */}
      {analyticsEnabled && sessionInfo && (
        <div className="p-4 border rounded-lg" style={{ 
          borderColor: "var(--border-color)",
          background: "var(--panel-color)"
        }}>
          <h4 className="font-medium mb-3" style={{ color: "var(--text-color)" }}>
            Current Session
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
                Session ID
              </div>
              <div className="font-mono" style={{ color: "var(--text-color)" }}>
                {sessionInfo.sessionId.slice(-8)}...
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
                Duration
              </div>
              <div style={{ color: "var(--text-color)" }}>
                {formatDuration(sessionInfo.duration)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
                Events Queued
              </div>
              <div style={{ color: "var(--text-color)" }}>
                {sessionInfo.queueSize}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
                Status
              </div>
              <div className="flex items-center gap-1">
                <Activity size={12} style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--accent-green)" }}>Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What We Collect */}
      <div className="p-4 border rounded-lg" style={{ 
        borderColor: "var(--border-color)",
        background: "var(--panel-color)"
      }}>
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} style={{ color: "var(--primary-color)" }} />
          <h4 className="font-medium" style={{ color: "var(--text-color)" }}>
            What We Collect
          </h4>
        </div>
        <div className="text-sm space-y-2" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--primary-color)" }} />
            <span>App usage patterns (which features you use and when)</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--primary-color)" }} />
            <span>Performance metrics (load times, errors)</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--primary-color)" }} />
            <span>Device information (screen size, browser type)</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--primary-color)" }} />
            <span>Session duration and interaction patterns</span>
          </div>
        </div>
      </div>

      {/* Privacy Information */}
      <div className="p-4 border rounded-lg" style={{ 
        borderColor: "var(--accent-green)",
        background: `color-mix(in srgb, var(--accent-green) 5%, transparent)`
      }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} style={{ color: "var(--accent-green)" }} />
          <h4 className="font-medium" style={{ color: "var(--text-color)" }}>
            Privacy & Security
          </h4>
        </div>
        <div className="text-sm space-y-2" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--accent-green)" }} />
            <span><strong>No personal data:</strong> We don't collect names, emails, or document content</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--accent-green)" }} />
            <span><strong>Anonymous:</strong> All data is anonymized and cannot be traced back to you</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--accent-green)" }} />
            <span><strong>Local first:</strong> Data is processed locally before being sent</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--accent-green)" }} />
            <span><strong>Opt-out anytime:</strong> You can disable analytics at any time</span>
          </div>
        </div>
      </div>

      {/* Data Usage */}
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        <p className="mb-2">
          <strong>Why we collect this data:</strong> Analytics help us understand how DevKit is used, 
          identify popular features, find performance bottlenecks, and prioritize improvements.
        </p>
        <p>
          <strong>Data retention:</strong> Analytics data is automatically deleted after 90 days. 
          No data is shared with third parties or used for advertising.
        </p>
      </div>
    </div>
  );
}