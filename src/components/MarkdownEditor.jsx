import React, { useState, useEffect, useRef, lazy } from "react";
const  Editor = lazy(() => import("@monaco-editor/react"));
import { 
  Save, 
  FileText, 
  Trash2, 
  Download, 
  Upload,
  X,
  Eye,
  Edit,
  FileDown,
  FileSpreadsheet,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { storage } from "../utils/StorageManager";
import { themeManager } from "../utils/themeManger";

// Enhanced markdown to HTML converter with CSS parsing
const markdownToHtml = (markdown) => {
  if (!markdown) return "";
  
  let html = markdown;
  
  // Extract and parse CSS styles from <style> tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styles = [];
  let styleMatch = styleRegex.exec(markdown);
  while (styleMatch !== null) {
    styles.push(styleMatch[1]);
    styleMatch = styleRegex.exec(markdown);
  }
  
  // Remove style tags from markdown before processing
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Process markdown
  html = html
    // Headers
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>")
    // Inline code
    .replace(/`(.*?)`/gim, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2" />')
    // Line breaks
    .replace(/\n/gim, "<br />");
  
  // Inject parsed CSS styles
  if (styles.length > 0) {
    const styleTag = `<style>${styles.join('\n')}</style>`;
    html = styleTag + html;
  }
  
  return html;
};

const MarkdownEditor = () => {
  const initialMarkdown = "# Welcome to Markdown Editor\n\nStart writing your markdown here...\n\n## Features\n\n- **Live preview**\n- Save and load files\n- Auto-save functionality";

  const [markdown, setMarkdown] = useState(() => {
    return storage.get("markdown:current", initialMarkdown);
  });
  
  const [savedFiles, setSavedFiles] = useState(() => {
    return storage.get("markdown:files", []);
  });
  
  // Restore current file ID and name from storage
  const [currentFileId, setCurrentFileId] = useState(() => {
    return storage.get("markdown:currentFileId", null);
  });
  
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [fileName, setFileName] = useState(() => {
    const savedFileId = storage.get("markdown:currentFileId", null);
    if (savedFileId) {
      const savedFiles = storage.get("markdown:files", []);
      const file = savedFiles.find(f => f.id === savedFileId);
      return file?.name || "";
    }
    return "";
  });
  const [showFilesDropdown, setShowFilesDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
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
      // Save to current file if one is selected, otherwise save to temp storage
      if (currentFileId) {
        const updatedFiles = savedFiles.map(file => 
          file.id === currentFileId 
            ? { ...file, content: markdown, updatedAt: new Date().toISOString() }
            : file
        );
        setSavedFiles(updatedFiles);
        storage.set("markdown:files", updatedFiles);
        // Save current file ID for persistence
        storage.set("markdown:currentFileId", currentFileId);
      } else {
        storage.set("markdown:current", markdown);
        storage.remove("markdown:currentFileId");
      }
    }, 1000); // Debounce auto-save

    return () => clearTimeout(timer);
  }, [markdown, currentFileId, savedFiles]);
  
  // Restore file content when currentFileId is loaded from storage (only once on mount)
  useEffect(() => {
    if (!hasRestoredFile.current && currentFileId && savedFiles.length > 0) {
      const file = savedFiles.find(f => f.id === currentFileId);
      if (file) {
        setMarkdown(file.content);
        setFileName(file.name);
        hasRestoredFile.current = true;
      }
    }
  }, [currentFileId, savedFiles]);

  const handleSave = () => {
    if (!fileName.trim()) {
      return;
    }

    const fileData = {
      id: currentFileId || Date.now(),
      name: fileName.trim(),
      content: markdown,
      createdAt: currentFileId 
        ? savedFiles.find(f => f.id === currentFileId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if file with same name exists
    const existingIndex = savedFiles.findIndex(f => f.name === fileData.name);
    let updatedFiles;
    
    if (existingIndex >= 0 && savedFiles[existingIndex].id !== currentFileId) {
      // Update existing file with same name (different ID)
      updatedFiles = [...savedFiles];
      updatedFiles[existingIndex] = {
        ...updatedFiles[existingIndex],
        content: fileData.content,
        updatedAt: fileData.updatedAt,
      };
      // Remove old current file if it exists
      if (currentFileId) {
        updatedFiles = updatedFiles.filter(f => f.id !== currentFileId);
      }
      setCurrentFileId(updatedFiles[existingIndex].id);
    } else if (currentFileId) {
      // Update current file
      updatedFiles = savedFiles.map(file => 
        file.id === currentFileId 
          ? fileData
          : file
      );
    } else {
      // Add new file
      updatedFiles = [...savedFiles, fileData];
      setCurrentFileId(fileData.id);
    }

    setSavedFiles(updatedFiles);
    storage.set("markdown:files", updatedFiles);
    storage.set("markdown:currentFileId", fileData.id);
    setShowSaveDropdown(false);
    setFileName("");
  };

  const handleSaveAsNew = () => {
    setCurrentFileId(null);
    setFileName("");
    setShowSaveDropdown(true);
  };

  const handleLoad = (file) => {
    setMarkdown(file.content);
    setCurrentFileId(file.id);
    setFileName(file.name);
    storage.set("markdown:currentFileId", file.id);
    setShowFilesDropdown(false);
  };

  const handleNewFile = () => {
    setMarkdown(initialMarkdown);
    setCurrentFileId(null);
    setFileName("");
    storage.remove("markdown:currentFileId");
    setShowSaveDropdown(false);
    setShowFilesDropdown(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this file?")) {
      const updatedFiles = savedFiles.filter(f => f.id !== id);
      setSavedFiles(updatedFiles);
      storage.set("markdown:files", updatedFiles);
      if (currentFileId === id) {
        setCurrentFileId(null);
        setFileName("");
        setMarkdown(initialMarkdown);
        storage.remove("markdown:currentFileId");
      }
    }
  };

  const handleExport = (format = "md") => {
    const currentFileName = currentFileId 
      ? savedFiles.find(f => f.id === currentFileId)?.name || fileName || "markdown"
      : fileName || "markdown";
    
    let content = markdown;
    let mimeType = "text/markdown";
    let extension = "md";
    
    if (format === "doc") {
      // Convert markdown to HTML for DOC format
      const htmlContent = markdownToHtml(markdown);
      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${currentFileName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; }
    h2 { color: #555; border-bottom: 1px solid #ddd; }
    h3 { color: #777; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    a { color: #007bff; }
  </style>
</head>
<body>
${htmlContent.replace(/<style>[\s\S]*?<\/style>/gi, '')}
</body>
</html>`;
      mimeType = "text/html";
      extension = "html";
    } else if (format === "csv") {
      // Convert markdown tables to CSV
      const tableRegex = /\|(.+)\|/g;
      const lines = markdown.split('\n');
      const csvLines = [];
      
      for (const line of lines) {
        if (line.trim().startsWith('|') && line.includes('---')) {
          continue; // Skip separator rows
        }
        if (line.trim().startsWith('|')) {
          const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
          csvLines.push(cells.join(','));
        }
      }
      
      if (csvLines.length > 0) {
        content = csvLines.join('\n');
      } else {
        // If no tables, create a simple CSV with the content
        content = `Content\n"${markdown.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      }
      mimeType = "text/csv";
      extension = "csv";
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
        setMarkdown(event.target.result);
        setCurrentFileId(null); // Reset current file when importing
        setFileName("");
      };
      reader.readAsText(file);
    }
  };

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
      // Copy the markdown text content
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = markdown;
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

  const formatMarkdown = () => {
    // Split into lines
    const lines = markdown.split('\n');
    const formattedLines = [];
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Handle code blocks
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) {
          codeBlockLanguage = trimmed.substring(3).trim();
        }
        formattedLines.push(line);
        continue;
      }
      
      if (inCodeBlock) {
        formattedLines.push(line);
        continue;
      }
      
      // Add spacing before headers (except first line)
      if (trimmed.startsWith('#') && formattedLines.length > 0) {
        const lastLine = formattedLines[formattedLines.length - 1].trim();
        if (lastLine && !lastLine.startsWith('#')) {
          formattedLines.push('');
        }
      }
      
      // Format headers - ensure proper spacing
      if (trimmed.startsWith('#')) {
        formattedLines.push(line);
        // Add blank line after header if next line is not blank and not a header
        if (i < lines.length - 1) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('-') && !nextLine.startsWith('*') && !nextLine.startsWith('|')) {
            // Will add spacing in next iteration if needed
          }
        }
        continue;
      }
      
      // Format lists - ensure consistent indentation
      if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+\.\s/)) {
        // Ensure blank line before list if previous line is not blank and not a list item
        if (formattedLines.length > 0) {
          const lastLine = formattedLines[formattedLines.length - 1].trim();
          if (lastLine && !lastLine.match(/^[-*+]\s/) && !lastLine.match(/^\d+\.\s/) && !lastLine.startsWith('#')) {
            formattedLines.push('');
          }
        }
        formattedLines.push(line);
        continue;
      }
      
      // Format tables - keep as is but ensure spacing
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        // Ensure blank line before table
        if (formattedLines.length > 0) {
          const lastLine = formattedLines[formattedLines.length - 1].trim();
          if (lastLine && !lastLine.startsWith('|')) {
            formattedLines.push('');
          }
        }
        formattedLines.push(line);
        // Add blank line after table separator
        if (trimmed.match(/^\|[\s-|:]+\|$/)) {
          // This is a table separator, continue
        } else if (i < lines.length - 1) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.startsWith('|')) {
            // Will add spacing after table
          }
        }
        continue;
      }
      
      // Format horizontal rules
      if (trimmed.match(/^[-*_]{3,}$/)) {
        if (formattedLines.length > 0) {
          const lastLine = formattedLines[formattedLines.length - 1].trim();
          if (lastLine) {
            formattedLines.push('');
          }
        }
        formattedLines.push(line);
        if (i < lines.length - 1) {
          const nextLine = lines[i + 1].trim();
          if (nextLine) {
            formattedLines.push('');
          }
        }
        continue;
      }
      
      // Regular lines
      if (trimmed === '') {
        // Don't add multiple consecutive blank lines
        if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() !== '') {
          formattedLines.push('');
        }
      } else {
        formattedLines.push(line);
      }
    }
    
    // Remove trailing blank lines
    while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() === '') {
      formattedLines.pop();
    }
    
    // Join and update
    setMarkdown(formattedLines.join('\n'));
  };

  return (
    <div
      className="h-full w-[96%] flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 mt-2 px-4 py-3 relative border-b"
        style={{ background: "var(--panel)", borderColor: "var(--border-color)" }}
      >
        {/* File Name Title */}
        {currentFileId && (
          <span
            className="flex gap-2 underline font-medium px-2"
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
                // If file is loaded, show current file name
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
                    className="px-3 py-1.5 rounded-lg text-sm text-white flex-1"
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
                  className="px-2 py-1 rounded text-xs"
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
                  onClick={() => handleExport("md")}
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
                  <FileText size={16} /> Markdown (.md)
                </button>
                <button
                  onClick={() => handleExport("doc")}
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
                  <FileDown size={16} /> HTML Document (.html)
                </button>
                <button
                  onClick={() => handleExport("csv")}
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
                  <FileSpreadsheet size={16} /> CSV (.csv)
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
            accept=".md,.markdown"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={formatMarkdown}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          style={{ background: "var(--sidebar-icon-bg)" }}
          type="button"
          title="Format/Beautify Markdown"
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
              language="markdown"
              value={markdown}
              onChange={(value) => setMarkdown(value ?? "")}
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
              overflow: "auto"
            }}
          >
            <div
              className="p-6 prose prose-lg max-w-none"
              style={{ color: "var(--text)" }}
            >
              {/* eslint-disable react/no-danger */}
              <div
                dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
                style={{
                  color: "var(--text)",
                }}
              />
              {/* eslint-enable react/no-danger */}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default MarkdownEditor;

