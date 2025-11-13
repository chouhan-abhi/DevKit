import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { 
  Save, 
  FileText, 
  Trash2, 
  Download, 
  Upload,
  Eye,
  Edit,
  FileDown,
  FileSpreadsheet,
  Copy,
  Check,
  Sparkles,
  Image
} from "lucide-react";
import { storage } from "../utils/StorageManager";
import { themeManager } from "../utils/themeManger";

const MermaidEditor = () => {
  const initialMermaid = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

  const [mermaidCode, setMermaidCode] = useState(() => {
    return storage.get("mermaid:current", initialMermaid);
  });
  
  const [savedFiles, setSavedFiles] = useState(() => {
    return storage.get("mermaid:files", []);
  });
  
  // Restore current file ID and name from storage
  const [currentFileId, setCurrentFileId] = useState(() => {
    return storage.get("mermaid:currentFileId", null);
  });
  
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [fileName, setFileName] = useState(() => {
    const savedFileId = storage.get("mermaid:currentFileId", null);
    if (savedFileId) {
      const savedFiles = storage.get("mermaid:files", []);
      const file = savedFiles.find(f => f.id === savedFileId);
      return file?.name || "";
    }
    return "";
  });
  const [showFilesDropdown, setShowFilesDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const mermaidRef = useRef(null);
  const mermaidContainerRef = useRef(null);
  const hasRestoredFile = useRef(false);

  // Get initial theme and convert to Monaco theme format
  const getMonacoTheme = (theme) => {
    const resolvedTheme = theme === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    return resolvedTheme === "dark" ? "vs-dark" : "vs-light";
  };
  
  const [monacoTheme, setMonacoTheme] = useState(() => {
    const currentTheme = themeManager.getTheme();
    return getMonacoTheme(currentTheme);
  });

  useEffect(() => {
    const handler = (e) => {
      const theme = e.detail === "dark" ? "vs-dark" : "vs-light";
      setMonacoTheme(theme);
    };

    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  // Auto-save current content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentFileId) {
        const updatedFiles = savedFiles.map(file => 
          file.id === currentFileId 
            ? { ...file, content: mermaidCode, updatedAt: new Date().toISOString() }
            : file
        );
        setSavedFiles(updatedFiles);
        storage.set("mermaid:files", updatedFiles);
        // Save current file ID for persistence
        storage.set("mermaid:currentFileId", currentFileId);
      } else {
        storage.set("mermaid:current", mermaidCode);
        storage.remove("mermaid:currentFileId");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [mermaidCode, currentFileId, savedFiles]);
  
  // Restore file content when currentFileId is loaded from storage (only once on mount)
  useEffect(() => {
    if (!hasRestoredFile.current && currentFileId && savedFiles.length > 0) {
      const file = savedFiles.find(f => f.id === currentFileId);
      if (file) {
        setMermaidCode(file.content);
        setFileName(file.name);
        hasRestoredFile.current = true;
      }
    }
  }, [currentFileId, savedFiles]);

  // Render Mermaid diagram
  useEffect(() => {
    const renderMermaid = async () => {
      if (!mermaidContainerRef.current || !mermaidCode.trim()) {
        setError(null);
        return;
      }

      try {
        setError(null);
        
        // Dynamically import mermaid
        const mermaid = (await import("mermaid")).default;
        
        // Initialize mermaid if not already done
        if (!mermaidRef.current) {
          mermaid.initialize({ 
            startOnLoad: false,
            theme: themeManager.getTheme() === "dark" ? "dark" : "default",
            securityLevel: "loose"
          });
          mermaidRef.current = mermaid;
        }

        // Clear container
        mermaidContainerRef.current.innerHTML = "";

        // Create a unique ID for this diagram
        const id = `mermaid-${Date.now()}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, mermaidCode);
        mermaidContainerRef.current.innerHTML = svg;
      } catch (err) {
        setError(err.message || "Failed to render Mermaid diagram");
        console.error("Mermaid render error:", err);
      }
    };

    renderMermaid();
  }, [mermaidCode]);

  // Update mermaid theme when app theme changes
  useEffect(() => {
    const handler = async () => {
      if (mermaidRef.current && mermaidContainerRef.current && mermaidCode.trim()) {
        try {
          const mermaid = mermaidRef.current;
          const currentTheme = themeManager.getTheme();
          const resolvedTheme = currentTheme === "system" 
            ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default")
            : (currentTheme === "dark" ? "dark" : "default");
          
          mermaid.initialize({ 
            startOnLoad: false,
            theme: resolvedTheme,
            securityLevel: "loose"
          });

          // Re-render with new theme
          mermaidContainerRef.current.innerHTML = "";
          const id = `mermaid-${Date.now()}`;
          const { svg } = await mermaid.render(id, mermaidCode);
          mermaidContainerRef.current.innerHTML = svg;
        } catch (err) {
          console.error("Mermaid theme update error:", err);
        }
      }
    };

    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, [mermaidCode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.save-dropdown-container') && !event.target.closest('button[data-save-button]')) {
        setShowSaveDropdown(false);
      }
      if (!event.target.closest('.files-dropdown-container') && !event.target.closest('button[data-files-button]')) {
        setShowFilesDropdown(false);
      }
      if (!event.target.closest('.export-dropdown-container') && !event.target.closest('button[data-export-button]')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Check if save button should be active
  const isSaveActive = currentFileId || fileName.trim().length > 0;
  
  const handleCopyToClipboard = async () => {
    try {
      // Copy the mermaid code text content
      await navigator.clipboard.writeText(mermaidCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = mermaidCode;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };
  
  const formatMermaid = () => {
    // Basic formatting for Mermaid code - add proper indentation
    const lines = mermaidCode.split('\n');
    const formattedLines = [];
    let indentLevel = 0;
    const indentSize = 2;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formattedLines.push('');
        continue;
      }
      
      // Decrease indent for closing braces or certain keywords
      if (trimmed.startsWith('}') || trimmed.match(/^(end|else|endif)/i)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Add indented line
      formattedLines.push(' '.repeat(indentLevel * indentSize) + trimmed);
      
      // Increase indent for opening braces or certain keywords
      if (trimmed.includes('{') || trimmed.match(/^(if|else|for|while)/i)) {
        indentLevel++;
      }
    }
    
    setMermaidCode(formattedLines.join('\n'));
  };

  const handleSave = () => {
    if (!fileName.trim()) {
      return;
    }

    const fileData = {
      id: currentFileId || Date.now(),
      name: fileName.trim(),
      content: mermaidCode,
      createdAt: currentFileId 
        ? savedFiles.find(f => f.id === currentFileId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = savedFiles.findIndex(f => f.name === fileData.name);
    let updatedFiles;
    
    if (existingIndex >= 0 && savedFiles[existingIndex].id !== currentFileId) {
      updatedFiles = [...savedFiles];
      updatedFiles[existingIndex] = {
        ...updatedFiles[existingIndex],
        content: fileData.content,
        updatedAt: fileData.updatedAt,
      };
      if (currentFileId) {
        updatedFiles = updatedFiles.filter(f => f.id !== currentFileId);
      }
      setCurrentFileId(updatedFiles[existingIndex].id);
    } else if (currentFileId) {
      updatedFiles = savedFiles.map(file => 
        file.id === currentFileId 
          ? fileData
          : file
      );
    } else {
      updatedFiles = [...savedFiles, fileData];
      setCurrentFileId(fileData.id);
    }

    setSavedFiles(updatedFiles);
    storage.set("mermaid:files", updatedFiles);
    storage.set("mermaid:currentFileId", fileData.id);
    setShowSaveDropdown(false);
    setFileName("");
  };

  const handleSaveAsNew = () => {
    setCurrentFileId(null);
    setFileName("");
    setShowSaveDropdown(true);
  };

  const handleLoad = (file) => {
    setMermaidCode(file.content);
    setCurrentFileId(file.id);
    setFileName(file.name);
    storage.set("mermaid:currentFileId", file.id);
    setShowFilesDropdown(false);
  };

  const handleNewFile = () => {
    setMermaidCode(initialMermaid);
    setCurrentFileId(null);
    setFileName("");
    storage.remove("mermaid:currentFileId");
    setShowSaveDropdown(false);
    setShowFilesDropdown(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this file?")) {
      const updatedFiles = savedFiles.filter(f => f.id !== id);
      setSavedFiles(updatedFiles);
      storage.set("mermaid:files", updatedFiles);
      if (currentFileId === id) {
        setCurrentFileId(null);
        setFileName("");
        setMermaidCode(initialMermaid);
        storage.remove("mermaid:currentFileId");
      }
    }
  };

  const handleExport = async (format = "mmd") => {
    const currentFileName = currentFileId 
      ? savedFiles.find(f => f.id === currentFileId)?.name || fileName || "mermaid"
      : fileName || "mermaid";
    
    if (format === "png") {
      // Export as PNG
      try {
        const mermaid = (await import("mermaid")).default;
        const id = `mermaid-export-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        
        // Convert SVG to PNG using a more reliable method
        const svgData = new XMLSerializer().serializeToString(
          new DOMParser().parseFromString(svg, "image/svg+xml").documentElement
        );
        
        // Create a canvas and draw the SVG
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        // Set canvas size - use a reasonable default or calculate from SVG viewBox
        const svgDoc = new DOMParser().parseFromString(svg, "image/svg+xml");
        const svgElement = svgDoc.documentElement;
        const viewBox = svgElement.getAttribute("viewBox");
        let width = 1200; // Default width
        let height = 800; // Default height
        
        if (viewBox) {
          const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
          if (vw && vh) {
            // Maintain aspect ratio, scale to fit reasonable size
            const scale = Math.min(1200 / vw, 800 / vh);
            width = vw * scale;
            height = vh * scale;
          }
        } else {
          const w = svgElement.getAttribute("width");
          const h = svgElement.getAttribute("height");
          if (w && h) {
            width = Number.parseFloat(w) || width;
            height = Number.parseFloat(h) || height;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Create SVG data URL with proper encoding
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          try {
            // Fill white background for better PNG export
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the SVG image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convert to PNG blob and download
            canvas.toBlob((blob) => {
              if (blob) {
                const pngUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = pngUrl;
                a.download = `${currentFileName}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(pngUrl);
              } else {
                throw new Error("Failed to create PNG blob");
              }
              URL.revokeObjectURL(url);
            }, "image/png");
          } catch (drawErr) {
            console.error("Failed to draw image on canvas:", drawErr);
            URL.revokeObjectURL(url);
            alert("Failed to export as PNG. Please try again.");
          }
        };
        
        img.onerror = () => {
          console.error("Failed to load SVG image");
          URL.revokeObjectURL(url);
          alert("Failed to export as PNG. Please try again.");
        };
        
        img.src = url;
      } catch (err) {
        console.error("Failed to export PNG:", err);
        alert("Failed to export as PNG. Please try again.");
      }
      setShowExportDropdown(false);
      return;
    }
    
    let content = mermaidCode;
    let mimeType = "text/plain";
    let extension = "mmd";
    
    if (format === "svg") {
      // Export as SVG
      try {
        const mermaid = (await import("mermaid")).default;
        const id = `mermaid-export-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        content = svg;
        mimeType = "image/svg+xml";
        extension = "svg";
      } catch (err) {
        console.error("Failed to export SVG:", err);
        alert("Failed to export as SVG. Please try again.");
        setShowExportDropdown(false);
        return;
      }
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentFileName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMermaidCode(event.target.result);
        setCurrentFileId(null);
        setFileName("");
        storage.remove("mermaid:currentFileId");
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      className="h-full w-[96%] flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 mt-2 px-4 py-3 border-b relative"
        style={{ background: "var(--panel-color)", borderColor: "var(--border-color)" }}
      >
        {/* File Name Title */}
        {currentFileId && (
          <span
            className="font-medium px-2 underline"
            style={{ color: "var(--text-color)" }}
          >
            File: {savedFiles.find(f => f.id === currentFileId)?.name || fileName}
          </span>
        )}
        
        {/* Save Button with Dropdown */}
        <div className="relative save-dropdown-container">
          <button
            data-save-button
            onClick={() => {
              if (currentFileId) {
                const currentFile = savedFiles.find(f => f.id === currentFileId);
                setFileName(currentFile?.name || "");
              }
              setShowSaveDropdown(!showSaveDropdown);
            }}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white transition-opacity opacity-100 hover:opacity-90"
            style={{ 
              background: "var(--sidebar-icon-bg)",
              boxShadow: isSaveActive ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
            type="button"
          >
            <Save size={16} /> Save
          </button>
          
          {showSaveDropdown && (
            <div
              className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg z-50"
              style={{
                background: "var(--panel-color)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div className="p-3">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name..."
                  className="w-full px-3 py-2 rounded-lg mb-2 text-sm"
                  style={{
                    background: "var(--bg-color)",
                    color: "var(--text)",
                    border: "1px solid var(--border-color)",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 rounded-lg text-sm text-white flex-1 hover:opacity-90 transition-opacity"
                    style={{ background: "var(--sidebar-icon-bg)" }}
                    type="button"
                  >
                    {currentFileId ? "Update" : "Save"}
                  </button>
                  {currentFileId && (
                    <button
                      onClick={handleSaveAsNew}
                      className="px-3 py-1.5 rounded-lg text-sm flex-1"
                      style={{
                        background: "var(--bg-color)",
                        color: "var(--text)",
                        border: "1px solid var(--border-color)",
                      }}
                      type="button"
                    >
                      Save As
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Saved Files Button with Dropdown */}
        <div className="relative files-dropdown-container">
          <button
            data-files-button
            onClick={() => setShowFilesDropdown(!showFilesDropdown)}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--sidebar-icon-bg)" }}
            type="button"
          >
            <FileText size={16} /> Saved Files ({savedFiles.length})
          </button>
          
          {showFilesDropdown && (
            <div
              className="absolute top-full left-0 mt-2 w-80 rounded-lg shadow-lg z-50 flex flex-col max-h-96"
              style={{
                background: "var(--panel-color)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--border-color)" }}>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--primary-color)" }}
                >
                  Saved Files
                </h3>
                <button
                  onClick={handleNewFile}
                  className="px-2 py-1 rounded text-xs hover:opacity-90 transition-opacity"
                  style={{
                    background: "var(--sidebar-icon-bg)",
                    color: "white",
                  }}
                  type="button"
                >
                  New
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {savedFiles.length === 0 ? (
                  <p className="text-center text-sm opacity-70 py-4">No saved files yet</p>
                ) : (
                  <div>
                    {savedFiles.map((file, index) => (
                      <button
                        key={file.id}
                        onClick={() => handleLoad(file)}
                        type="button"
                        className={`w-full text-left p-3 cursor-pointer transition border-b ${
                          currentFileId === file.id ? "opacity-100" : "opacity-80 hover:opacity-100"
                        } ${index === savedFiles.length - 1 ? "border-b-0" : ""}`}
                        style={{
                          background: "transparent",
                          borderColor: "var(--border-color)",
                          color: currentFileId === file.id ? "var(--primary-color)" : "var(--text)",
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {file.name}
                            </h4>
                            <p className="text-xs opacity-70 mt-0.5">
                              {new Date(file.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDelete(file.id, e)}
                            className="p-2 rounded hover:bg-opacity-20 ml-2 shrink-0"
                            style={{ 
                              color: "var(--danger)",
                            }}
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Export Button with Dropdown */}
        <div className="relative export-dropdown-container">
          <button
            data-export-button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--sidebar-icon-bg)" }}
            type="button"
          >
            <Download size={16} /> Export
          </button>
          
          {showExportDropdown && (
            <div
              className="absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg z-50"
              style={{
                background: "var(--panel-color)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div className="p-2">
                <button
                  onClick={() => handleExport("mmd")}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition"
                  style={{
                    color: "var(--text-color)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "var(--bg-color)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                  }}
                  type="button"
                >
                  <FileText size={16} /> Mermaid (.mmd)
                </button>
                <button
                  onClick={() => handleExport("svg")}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition"
                  style={{
                    color: "var(--text)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "var(--bg-color)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                  }}
                  type="button"
                >
                  <FileDown size={16} /> SVG (.svg)
                </button>
                <button
                  onClick={() => handleExport("png")}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition"
                  style={{
                    color: "var(--text)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "var(--bg-color)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                  }}
                  type="button"
                >
                  <Image size={16} /> PNG (.png)
                </button>
              </div>
            </div>
          )}
        </div>

        <label
          className="px-3 py-1 rounded-2xl text-sm flex items-center gap-2 text-white cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: "var(--sidebar-icon-bg)" }}
        >
          <Upload size={16} /> Import
          <input
            type="file"
            accept=".mmd,.mermaid"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={formatMermaid}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          style={{ background: "var(--sidebar-icon-bg)" }}
          type="button"
          title="Format/Beautify Mermaid"
        >
          <Sparkles size={16} /> Format
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white transition-opacity hover:opacity-90"
            style={{
              background: copied ? "var(--primary-color)" : "var(--sidebar-icon-bg)",
            }}
            type="button"
          >
            {copied ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy as Text
              </>
            )}
          </button>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--sidebar-icon-bg)" }}
            type="button"
          >
            {previewMode ? <Edit size={16} /> : <Eye size={16} />}
            {previewMode ? "Edit" : "Preview"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Editor */}
        {!previewMode && (
          <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0">
            <Editor
              height="100%"
              theme={monacoTheme}
              language="mermaid"
              value={mermaidCode}
              onChange={(value) => setMermaidCode(value ?? "")}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                wordWrap: "on",
                smoothScrolling: true,
              }}
            />
          </div>
        )}

        {/* Preview */}
        {(previewMode || !previewMode) && (
          <div
            className={previewMode ? "w-full" : "w-full md:w-[50%] min-h-[300px] md:min-h-0"}
            style={{ 
              background: "var(--panel-color)", 
              borderColor: "var(--border)",
              overflow: "auto"
            }}
          >
            <div className="p-6 flex items-center justify-center min-h-full">
              {error ? (
                <div className="text-center">
                  <p className="text-red-600 mb-2">Error rendering diagram:</p>
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : (
                <div 
                  ref={mermaidContainerRef}
                  className="w-full flex items-center justify-center"
                  style={{ minHeight: "200px" }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MermaidEditor;

