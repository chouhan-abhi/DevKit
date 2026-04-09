import React from "react";
import { Cloud, CloudOff, RotateCw, AlertCircle, Check, Loader2 } from "lucide-react";

export default function SyncStatusIndicator({ 
  syncStatus = "local", 
  lastSyncError = null, 
  isCloudSyncEnabled = false,
  onSync = null,
  compact = false 
}) {
  const getStatusIcon = () => {
    if (!isCloudSyncEnabled) {
      return <CloudOff size={compact ? 12 : 14} />;
    }

    switch (syncStatus) {
      case "syncing":
        return <Loader2 size={compact ? 12 : 14} className="animate-spin" />;
      case "synced":
        return <Check size={compact ? 12 : 14} />;
      case "error":
        return <AlertCircle size={compact ? 12 : 14} />;
      default:
        return <Cloud size={compact ? 12 : 14} />;
    }
  };

  const getStatusColor = () => {
    if (!isCloudSyncEnabled) {
      return "var(--text-muted)";
    }

    switch (syncStatus) {
      case "syncing":
        return "var(--primary-color)";
      case "synced":
        return "var(--accent-green)";
      case "error":
        return "var(--accent-red)";
      default:
        return "var(--text-muted)";
    }
  };

  const getStatusText = () => {
    if (!isCloudSyncEnabled) {
      return compact ? "Local" : "Local only";
    }

    switch (syncStatus) {
      case "syncing":
        return compact ? "Sync..." : "Syncing";
      case "synced":
        return compact ? "Synced" : "Synced";
      case "error":
        return compact ? "Error" : "Sync error";
      default:
        return compact ? "Local" : "Local only";
    }
  };

  const getTooltip = () => {
    if (!isCloudSyncEnabled) {
      return "Cloud sync is disabled. Documents are saved locally only.";
    }

    switch (syncStatus) {
      case "syncing":
        return "Syncing documents to cloud...";
      case "synced":
        return "Documents are synced with cloud";
      case "error":
        return `Sync failed: ${lastSyncError || "Unknown error"}`;
      default:
        return "Documents are saved locally";
    }
  };

  if (compact) {
    return (
      <div 
        className="flex items-center gap-1"
        style={{ color: getStatusColor() }}
        title={getTooltip()}
      >
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
        style={{ 
          background: `color-mix(in srgb, ${getStatusColor()} 10%, transparent)`,
          color: getStatusColor()
        }}
        title={getTooltip()}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      
      {syncStatus === "error" && onSync && (
        <button
          onClick={onSync}
          className="text-xs px-2 py-1 rounded hover:opacity-80"
          style={{ 
            background: "var(--accent-orange)",
            color: "#ffffff"
          }}
          title="Retry sync"
        >
          <RotateCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}