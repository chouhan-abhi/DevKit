import { useState, useEffect, useRef, useMemo } from "react";
import { Download, Upload, Eye, Edit, Copy, Check, Sparkles } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import { markdown } from "@codemirror/lang-markdown";
import { themeManager } from "../../../shared/services/themeManager";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";

const MermaidEditor = () => {
  const initialMermaid = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

  const {
    documents, currentId, title, content, setContent,
    setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
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

  const resolveTheme = (theme) => {
    const resolved = theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;
    return resolved === "dark" ? "dark" : "light";
  };

  const [editorTheme, setEditorTheme] = useState(() =>
    resolveTheme(themeManager.getTheme())
  );

  useEffect(() => {
    const handler = (e) => setEditorTheme(e.detail === "dark" ? "dark" : "light");
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".export-dropdown-container")) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      }
    };

    renderMermaid();
  }, [mermaidCode]);

  useEffect(() => {
    const handler = async () => {
      if (mermaidRef.current && mermaidContainerRef.current && mermaidCode.trim()) {
        try {
          const mermaid = mermaidRef.current;
          const currentTheme = themeManager.getTheme();
          const resolvedTheme = currentTheme === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default"
            : currentTheme === "dark" ? "dark" : "default";

          mermaid.initialize({ startOnLoad: false, theme: resolvedTheme, securityLevel: "loose" });
          mermaidContainerRef.current.innerHTML = "";
          const id = `mermaid-${Date.now()}`;
          const { svg } = await mermaid.render(id, mermaidCode);
          mermaidContainerRef.current.innerHTML = svg;
        } catch { /* theme re-render may fail */ }
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
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = mermaidCode;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); }
      catch { /* noop */ }
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
      if (!trimmed) { formattedLines.push(""); continue; }
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
        let width = 1200, height = 800;
        if (viewBox) {
          const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
          if (vw && vh) { const scale = Math.min(1200 / vw, 800 / vh); width = vw * scale; height = vh * scale; }
        } else {
          const w = svgElement.getAttribute("width");
          const h = svgElement.getAttribute("height");
          if (w && h) { width = Number.parseFloat(w) || width; height = Number.parseFloat(h) || height; }
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
                const a = document.createElement("a"); a.href = pngUrl; a.download = `${currentFileName}.png`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(pngUrl);
              }
              URL.revokeObjectURL(url);
            }, "image/png");
          } catch { URL.revokeObjectURL(url); }
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      } catch { /* noop */ }
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
        contentToExport = svg; mimeType = "image/svg+xml"; extension = "svg";
      } catch {
        setShowExportDropdown(false); return;
      }
    }

    const blob = new Blob([contentToExport], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${currentFileName}.${extension}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
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

  const mermaidCompletions = useMemo(
    () => completeFromList([
      { label: "graph TD", type: "keyword", apply: "graph TD\n" },
      { label: "graph LR", type: "keyword", apply: "graph LR\n" },
      { label: "flowchart TD", type: "keyword", apply: "flowchart TD\n" },
      { label: "sequenceDiagram", type: "keyword", apply: "sequenceDiagram\n" },
      { label: "classDiagram", type: "keyword", apply: "classDiagram\n" },
      { label: "stateDiagram-v2", type: "keyword", apply: "stateDiagram-v2\n" },
      { label: "erDiagram", type: "keyword", apply: "erDiagram\n" },
      { label: "gantt", type: "keyword", apply: "gantt\n" },
      { label: "pie", type: "keyword", apply: "pie\n" },
      { label: "journey", type: "keyword", apply: "journey\n" },
      { label: "mindmap", type: "keyword", apply: "mindmap\n" },
      { label: "timeline", type: "keyword", apply: "timeline\n" },
      { label: "gitGraph", type: "keyword", apply: "gitGraph\n" },
      { label: "subgraph", type: "keyword", apply: "subgraph " },
      { label: "end", type: "keyword", apply: "end\n" },
    ]),
    []
  );

  const extensions = useMemo(
    () => [markdown(), autocompletion({ override: [mermaidCompletions] })],
    [mermaidCompletions]
  );

  const shortcuts = useMemo(() => ({
    preview: { mod: true, shift: true, key: "p" },
    format:  { mod: true, shift: true, key: "f" },
  }), []);

  useKeyboardShortcuts([
    { shortcut: shortcuts.preview, action: () => setPreviewMode((v) => !v) },
    { shortcut: shortcuts.format,  action: formatMermaid },
  ]);

  return (
    <div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
      <div className="p-3 pb-0">
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
              <button onClick={formatMermaid} className="toolbar-btn compact" type="button" data-tooltip={`Format (${formatShortcut(shortcuts.format)})`} aria-label="Format">
                <Sparkles size={14} />
              </button>
              <button onClick={handleCopyToClipboard} className="toolbar-btn compact" type="button" data-tooltip={copied ? "Copied!" : "Copy"} aria-label="Copy">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <div className="relative export-dropdown-container">
                <button type="button" className="toolbar-btn" onClick={() => setShowExportDropdown(!showExportDropdown)} data-tooltip="Export diagram">
                  <Download size={14} /> Export
                </button>
                {showExportDropdown && (
                  <div className="toolbar-popover" style={{ left: "auto", right: 0, transform: "none" }}>
                    <div className="toolbar-popover-list">
                      <button type="button" onClick={() => handleExport("mmd")}>Mermaid (.mmd)</button>
                      <button type="button" onClick={() => handleExport("svg")}>SVG (.svg)</button>
                      <button type="button" onClick={() => handleExport("png")}>PNG (.png)</button>
                    </div>
                  </div>
                )}
              </div>
              <label className="toolbar-btn compact cursor-pointer" data-tooltip="Import file" aria-label="Import">
                <Upload size={14} />
                <input type="file" accept=".mmd,.mermaid" onChange={handleImport} className="hidden" />
              </label>
              <div className="toolbar-divider" />
              <button onClick={() => setPreviewMode(!previewMode)} className="toolbar-btn" type="button" data-tooltip={`${previewMode ? "Back to editor" : "Full preview"} (${formatShortcut(shortcuts.preview)})`}>
                {previewMode ? <Edit size={14} /> : <Eye size={14} />}
                {previewMode ? "Edit" : "Preview"}
              </button>
            </>
          }
        />
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden border rounded-xl m-3" style={{ borderColor: "var(--border-color)" }}>
        {!previewMode && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeMirror
              value={mermaidCode}
              height="100%"
              theme={editorTheme}
              extensions={extensions}
              onChange={(value) =>
                setContent((prev) => ({ ...(prev || {}), mermaid: value ?? "" }))
              }
              className="h-full"
              basicSetup={{
                lineNumbers: true, foldGutter: true, highlightActiveLineGutter: true,
                highlightActiveLine: true, bracketMatching: true, closeBrackets: true,
                autocompletion: true, indentOnInput: true,
              }}
            />
          </div>
        )}

        <div
          className={previewMode ? "w-full" : "w-full md:w-[50%] min-h-0"}
          style={{ background: "var(--panel-color)", overflow: "auto" }}
        >
          <div className="p-6 flex items-center justify-center min-h-full">
            {error ? (
              <div className="text-center p-4">
                <p className="text-sm font-medium mb-1" style={{ color: "var(--accent-red)" }}>Render Error</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{error}</p>
              </div>
            ) : (
              <div ref={mermaidContainerRef} className="w-full flex items-center justify-center" style={{ minHeight: "200px" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MermaidEditor;
