import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { 
  Save, 
  FileText, 
  Trash2, 
  Download, 
  Upload,
  X,
  Eye,
  Edit
} from "lucide-react";
import { storage } from "../utils/StorageManager";
import { themeManager } from "../utils/themeManger";

// Simple markdown to HTML converter (basic implementation)
const markdownToHtml = (markdown) => {
  if (!markdown) return "";
  
  return markdown
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
};

const MarkdownEditor = () => {
  const initialMarkdown = "# Welcome to Markdown Editor\n\nStart writing your markdown here...\n\n## Features\n\n- **Live preview**\n- Save and load files\n- Auto-save functionality";

  const [markdown, setMarkdown] = useState(() => {
    return storage.get("markdown:current", initialMarkdown);
  });
  
  const [savedFiles, setSavedFiles] = useState(() => {
    return storage.get("markdown:files", []);
  });
  
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showFilesDropdown, setShowFilesDropdown] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentFileId, setCurrentFileId] = useState(null); // Track currently loaded file

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
      } else {
        storage.set("markdown:current", markdown);
      }
    }, 1000); // Debounce auto-save

    return () => clearTimeout(timer);
  }, [markdown, currentFileId, savedFiles]);

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
    setShowFilesDropdown(false);
  };

  const handleNewFile = () => {
    setMarkdown(initialMarkdown);
    setCurrentFileId(null);
    setFileName("");
    setShowSaveDropdown(false);
    setShowFilesDropdown(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this file?")) {
      const updatedFiles = savedFiles.filter(f => f.id !== id);
      setSavedFiles(updatedFiles);
      storage.set("markdown:files", updatedFiles);
    }
  };

  const handleExport = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const currentFileName = currentFileId 
      ? savedFiles.find(f => f.id === currentFileId)?.name || fileName || "markdown"
      : fileName || "markdown";
    a.download = `${currentFileName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="h-full w-[96%] flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b relative"
        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
      >
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
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white"
            style={{ background: "var(--primary-color)" }}
            type="button"
          >
            <Save size={16} /> Save {currentFileId && `(${savedFiles.find(f => f.id === currentFileId)?.name || ""})`}
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
                    style={{ background: "var(--primary-color)" }}
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
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white"
            style={{ background: "var(--primary-color)" }}
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
                    background: "var(--primary-color)",
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

        <button
          onClick={handleExport}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white"
          style={{ background: "var(--primary-color)" }}
          type="button"
        >
          <Download size={16} /> Export
        </button>

        <label
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white cursor-pointer"
          style={{ background: "var(--primary-color)" }}
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
          onClick={() => setPreviewMode(!previewMode)}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white ml-auto"
          style={{ background: "var(--primary-color)" }}
          type="button"
        >
          {previewMode ? <Edit size={16} /> : <Eye size={16} />}
          {previewMode ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        {!previewMode && (
          <div className="flex-1 flex flex-col">
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
            className={previewMode ? "w-full" : "w-[50%] border-l"}
            style={{ 
              background: "var(--panel)", 
              borderColor: "var(--border)",
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

