import React, { useState, useEffect, useRef, useMemo } from "react";
import { Download, Upload, Eye, Edit, Copy, Check, Sparkles } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { themeManager } from "../utils/themeManger";
import SubAppToolbar from "./SubAppToolbar";
import { useDocuments } from "../hooks/useDocuments";

const MermaidEditor = () => {
  const initialMermaid = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

  const {
    documents,
    currentId,
    title,
    content,
    setContent,
    setCurrentDocId,
    createDoc,
    saveAs,
    renameDoc,
    deleteDoc,
    isSaving,
  } = useDocuments({
    appId: "mermaid-draw",
    defaultTitle: "Untitled Mermaid",
    initialContent: { mermaid: initialMermaid },
    meta: { language: "mermaid" },
  });

  const mermaidCode = content?.mermaid ?? "";

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const mermaidRef = useRef(null);
  const mermaidContainerRef = useRef(null);

  const getEditorTheme = (theme) => {
    const resolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    return resolvedTheme === "dark" ? "dark" : "light";
  };

  const [editorTheme, setEditorTheme] = useState(() =>
    getEditorTheme(themeManager.getTheme())
  );

  useEffect(() => {
    const handler = (e) => {
      const theme = e.detail === "dark" ? "dark" : "light";
      setEditorTheme(theme);
    };

    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".export-dropdown-container")) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Render Mermaid diagram
  useEffect(() => {
    const renderMermaid = async () => {
      if (!mermaidContainerRef.current || !mermaidCode.trim()) {
        setError(null);
        return;
      }

      try {
        setError(null);

        const mermaid = (await import("mermaid")).default;

        if (!mermaidRef.current) {
          mermaid.initialize({
            startOnLoad: false,
            theme: themeManager.getTheme() === "dark" ? "dark" : "default",
            securityLevel: "loose",
          });
          mermaidRef.current = mermaid;
        }

        mermaidContainerRef.current.innerHTML = "";

        const id = `mermaid-${Date.now()}`;
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
          const resolvedTheme =
            currentTheme === "system"
              ? window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "default"
              : currentTheme === "dark"
              ? "dark"
              : "default";

          mermaid.initialize({
            startOnLoad: false,
            theme: resolvedTheme,
            securityLevel: "loose",
          });

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

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = mermaidCode;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const formatMermaid = () => {
    const lines = mermaidCode.split("\n");
    const formattedLines = [];
    let indentLevel = 0;
    const indentSize = 2;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formattedLines.push("");
        continue;
      }

      if (trimmed.startsWith("}") || trimmed.match(/^(end|else|endif)/i)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formattedLines.push(" ".repeat(indentLevel * indentSize) + trimmed);

      if (trimmed.includes("{") || trimmed.match(/^(if|else|for|while)/i)) {
        indentLevel++;
      }
    }

    setContent((prev) => ({ ...(prev || {}), mermaid: formattedLines.join("\n") }));
  };

  const handleExport = async (format = "mmd") => {
    const currentFileName = title || "mermaid";

    if (format === "png") {
      try {
        const mermaid = (await import("mermaid")).default;
        const id = `mermaid-export-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);

        const svgData = new XMLSerializer().serializeToString(
          new DOMParser().parseFromString(svg, "image/svg+xml").documentElement
        );

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        const svgDoc = new DOMParser().parseFromString(svg, "image/svg+xml");
        const svgElement = svgDoc.documentElement;
        const viewBox = svgElement.getAttribute("viewBox");
        let width = 1200;
        let height = 800;

        if (viewBox) {
          const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
          if (vw && vh) {
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

        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          try {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

    let contentToExport = mermaidCode;
    let mimeType = "text/plain";
    let extension = "mmd";

    if (format === "svg") {
      try {
        const mermaid = (await import("mermaid")).default;
        const id = `mermaid-export-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        contentToExport = svg;
        mimeType = "image/svg+xml";
        extension = "svg";
      } catch (err) {
        console.error("Failed to export SVG:", err);
        alert("Failed to export as SVG. Please try again.");
        setShowExportDropdown(false);
        return;
      }
    }

    const blob = new Blob([contentToExport], { type: mimeType });
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
        setContent((prev) => ({ ...(prev || {}), mermaid: event.target.result }));
        const name = file.name.replace(/\.(mmd|mermaid)$/i, "");
        if (name) renameDoc(name);
      };
      reader.readAsText(file);
    }
  };

  const extensions = useMemo(() => [markdown()], []);

  return (
    <div
      className="h-full w-[96%] flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="p-3">
        <SubAppToolbar
          documents={documents}
          currentId={currentId}
          currentTitle={title}
          onSelect={setCurrentDocId}
          onRename={renameDoc}
          onNew={() => createDoc("Untitled Mermaid", { mermaid: initialMermaid })}
          onSaveAs={(name) => saveAs(name)}
          onDelete={() => deleteDoc()}
          status={isSaving ? "saving" : "saved"}
          rightActions={
            <>
              <div className="relative export-dropdown-container">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                >
                  <Download size={16} /> Export
                </button>
                {showExportDropdown && (
                  <div className="toolbar-dropdown">
                    <div className="toolbar-dropdown-list">
                      <button
                        type="button"
                        className="toolbar-dropdown-item"
                        onClick={() => handleExport("mmd")}
                      >
                        Mermaid (.mmd)
                      </button>
                      <button
                        type="button"
                        className="toolbar-dropdown-item"
                        onClick={() => handleExport("svg")}
                      >
                        SVG (.svg)
                      </button>
                      <button
                        type="button"
                        className="toolbar-dropdown-item"
                        onClick={() => handleExport("png")}
                      >
                        PNG (.png)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label className="toolbar-btn">
                <Upload size={16} /> Import
                <input
                  type="file"
                  accept=".mmd,.mermaid"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button onClick={formatMermaid} className="toolbar-btn" type="button">
                <Sparkles size={16} /> Format
              </button>

              <button
                onClick={handleCopyToClipboard}
                className="toolbar-btn"
                type="button"
              >
                {copied ? (
                  <>
                    <Check size={16} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy
                  </>
                )}
              </button>

              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="toolbar-btn"
                type="button"
              >
                {previewMode ? <Edit size={16} /> : <Eye size={16} />}
                {previewMode ? "Edit" : "Preview"}
              </button>
            </>
          }
        />
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 border border-[var(--border-color)] rounded-md overflow-hidden">
        {!previewMode && (
          <div className="flex-1 rounded-md min-h-[300px] md:min-h-0 overflow-hidden">
            <CodeMirror
              value={mermaidCode}
              height="100%"
              minHeight="280px"
              theme={editorTheme}
              extensions={extensions}
              onChange={(value) =>
                setContent((prev) => ({ ...(prev || {}), mermaid: value ?? "" }))
              }
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                indentOnInput: true,
              }}
            />
          </div>
        )}

        <div
          className={
            previewMode ? "w-full" : "w-full md:w-[50%] min-h-[300px] md:min-h-0"
          }
          style={{
            background: "var(--panel-color)",
            borderColor: "var(--border)",
            overflow: "auto",
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
      </div>
    </div>
  );
};

export default MermaidEditor;
