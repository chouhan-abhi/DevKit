import React, { useState } from "react";
import { RotateCw, Download, Upload, AlertCircle, Check } from "lucide-react";

export default function ManualSyncButton({ 
  onSyncToCloud, 
  onSyncFromCloud, 
  isCloudSyncEnabled,
  syncStatus,
  compact = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [operation, setOperation] = useState(null); // 'upload', 'download', null

  if (!isCloudSyncEnabled) {
    return null;
  }

  const handleSyncToCloud = async () => {
    setOperation('upload');
    try {
      await onSyncToCloud();
      setOperation(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      setOperation(null);
    }
  };

  const handleSyncFromCloud = async () => {
    setOperation('download');
    try {
      await onSyncFromCloud();
      setOperation(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Sync from cloud failed:', error);
      setOperation(null);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          className="toolbar-btn compact"
          onClick={() => setIsOpen(!isOpen)}
          data-tooltip="Manual Sync"
          disabled={operation !== null}
        >
          <RotateCw size={14} />
        </button>

        {isOpen && (
          <div 
            className="absolute top-full right-0 mt-1 py-1 rounded-lg shadow-lg border z-50"
            style={{
              background: "var(--panel-color)",
              borderColor: "var(--border-color)",
              minWidth: "140px",
            }}
          >
            <button
              onClick={handleSyncToCloud}
              disabled={operation !== null}
              className="w-full px-3 py-2 text-left text-sm hover:bg-opacity-80 flex items-center gap-2"
              style={{ 
                color: "var(--text-color)",
                background: operation === 'upload' ? "var(--border-subtle)" : "transparent"
              }}
            >
              <Upload size={12} />
              {operation === 'upload' ? 'Uploading...' : 'Upload to Cloud'}
            </button>
            <button
              onClick={handleSyncFromCloud}
              disabled={operation !== null}
              className="w-full px-3 py-2 text-left text-sm hover:bg-opacity-80 flex items-center gap-2"
              style={{ 
                color: "var(--text-color)",
                background: operation === 'download' ? "var(--border-subtle)" : "transparent"
              }}
            >
              <Download size={12} />
              {operation === 'download' ? 'Downloading...' : 'Download from Cloud'}
            </button>
          </div>
        )}

        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSyncToCloud}
        disabled={operation !== null}
        className="toolbar-btn"
        style={{ opacity: operation !== null ? 0.5 : 1 }}
      >
        <Upload size={14} />
        {operation === 'upload' ? 'Uploading...' : 'Upload to Cloud'}
      </button>
      <button
        onClick={handleSyncFromCloud}
        disabled={operation !== null}
        className="toolbar-btn"
        style={{ opacity: operation !== null ? 0.5 : 1 }}
      >
        <Download size={14} />
        {operation === 'download' ? 'Downloading...' : 'Download from Cloud'}
      </button>
    </div>
  );
}