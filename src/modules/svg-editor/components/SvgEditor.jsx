import { useState, useEffect, useRef, useMemo } from "react";
import {
  Download, Upload, Eye, Edit, Copy, Check, Shapes,
  Circle, Square, Triangle, Star, Hexagon,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { xml } from "@codemirror/lang-xml";
import { themeManager } from "../../../shared/services/themeManager";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";

const SvgEditor = () => {
  const initialSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" stroke="black" stroke-width="3" fill="red"/>
</svg>`;

  const {
    documents, currentId, title, content, setContent,
    setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
  } = useDocuments({
    appId: "svg-editor",
    defaultTitle: "Untitled SVG",
    initialContent: { svg: initialSvg },
    meta: { language: "svg" },
  });

  const svgCode = content?.svg ?? initialSvg;
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportResolution, setExportResolution] = useState(1);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const previewRef = useRef(null);

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
    if (previewRef.current) previewRef.current.innerHTML = svgCode;
  }, [svgCode]);

  useEffect(() => {
    const handler = (event) => {
      if (!event.target.closest(".shapes-dropdown")) setShapesOpen(false);
      if (!event.target.closest(".export-dropdown")) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(svgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const handleExport = (format = "svg", resolution = 1) => {
    if (format === "svg") {
      const blob = new Blob([svgCode], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${title || "drawing"}.svg`;
      a.click();
      return;
    }
    if (format === "png") {
      const svgBlob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width * resolution;
        canvas.height = img.height * resolution;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${title || "drawing"}.png`;
          a.click();
        });
      };
      img.src = url;
    }
    setExportOpen(false);
  };

  const shapeSnippets = {
    circle: `<circle cx="100" cy="100" r="50" stroke="black" stroke-width="3" fill="red"/>`,
    square: `<rect x="50" y="50" width="100" height="100" stroke="black" stroke-width="3" fill="blue"/>`,
    triangle: `<polygon points="100,50 50,150 150,150" stroke="black" stroke-width="3" fill="green"/>`,
    star: `<polygon points="100,10 120,90 190,90 135,135 155,190 100,160 45,190 65,135 10,90 80,90" stroke="black" stroke-width="3" fill="yellow"/>`,
    hexagon: `<polygon points="100,20 140,50 140,110 100,140 60,110 60,50" stroke="black" stroke-width="3" fill="purple"/>`,
  };

  const addShapeSnippet = (shape) => {
    const snippet = shapeSnippets[shape] || "";
    setContent((prev) => {
      const current = prev?.svg || "";
      return { ...(prev || {}), svg: current.replace("</svg>", `  ${snippet}\n</svg>`) };
    });
    setShapesOpen(false);
  };

  const handleImportSvg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const svgText = event.target.result;
      if (svgText.includes("<svg")) {
        setContent((prev) => ({ ...(prev || {}), svg: svgText }));
        const nextName = file.name.replace(/\.svg$/i, "");
        if (nextName) renameDoc(nextName);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const extensions = useMemo(() => [xml()], []);

  const shapeEntries = [
    { key: "circle", Icon: Circle },
    { key: "square", Icon: Square },
    { key: "triangle", Icon: Triangle },
    { key: "star", Icon: Star },
    { key: "hexagon", Icon: Hexagon },
  ];

  return (
    <div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
      <div className="p-3 pb-0">
        <SubAppToolbar
          documents={documents}
          currentId={currentId}
          currentTitle={title}
          onSelect={setCurrentDocId}
          onRename={renameDoc}
          onNew={() => createDoc("Untitled SVG", { svg: initialSvg })}
          onSaveAs={(name) => saveAs(name)}
          onDelete={() => deleteDoc()}
          status={isSaving ? "saving" : "saved"}
          rightActions={
            <>
              <button
                onClick={handleCopyToClipboard}
                className="toolbar-btn compact"
                type="button"
                data-tooltip={copied ? "Copied!" : "Copy SVG"}
                aria-label="Copy SVG"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>

              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="toolbar-btn"
                type="button"
                data-tooltip={previewMode ? "Switch to editor" : "Full preview"}
              >
                {previewMode ? <Edit size={14} /> : <Eye size={14} />}
                {previewMode ? "Edit" : "Preview"}
              </button>

              <div className="toolbar-divider" />

              <div className="relative shapes-dropdown">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => setShapesOpen((v) => !v)}
                  data-tooltip="Insert shape"
                >
                  <Shapes size={14} /> Shapes
                </button>
                {shapesOpen && (
                  <div className="toolbar-popover">
                    <div className="toolbar-popover-grid">
                      {shapeEntries.map((entry) => (
                        <button
                          key={entry.key}
                          type="button"
                          title={entry.key}
                          onClick={() => addShapeSnippet(entry.key)}
                        >
                          <entry.Icon size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <label className="toolbar-btn compact cursor-pointer" data-tooltip="Import SVG">
                <Upload size={14} />
                <input type="file" accept=".svg" className="hidden" onChange={handleImportSvg} />
              </label>

              <div className="relative export-dropdown">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => setExportOpen((v) => !v)}
                  data-tooltip="Export SVG/PNG"
                >
                  <Download size={14} /> Export
                </button>
                {exportOpen && (
                  <div className="toolbar-popover" style={{ left: "auto", right: 0, transform: "none" }}>
                    <div className="toolbar-popover-list">
                      <button type="button" onClick={() => handleExport("svg")}>
                        <Download size={13} /> SVG
                      </button>
                      <div className="popover-section-label">PNG Export</div>
                      <div className="popover-input-row">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={exportResolution}
                          onChange={(e) => setExportResolution(Number(e.target.value))}
                        />
                        <span>x scale</span>
                      </div>
                      <button type="button" onClick={() => handleExport("png", exportResolution)}>
                        <Download size={13} /> PNG
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          }
        />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden border rounded-xl m-3" style={{ borderColor: "var(--border-color)" }}>
        {!previewMode && (
          <CodeMirror
            value={svgCode}
            height="100%"
            theme={editorTheme}
            extensions={extensions}
            onChange={(val) => setContent((prev) => ({ ...(prev || {}), svg: val ?? "" }))}
            className="h-full flex-1"
            basicSetup={{
              lineNumbers: true, foldGutter: true, highlightActiveLineGutter: true,
              highlightActiveLine: true, bracketMatching: true, closeBrackets: true,
              autocompletion: true, indentOnInput: true,
            }}
          />
        )}
        <div
          ref={previewRef}
          className={`p-4 w-full overflow-auto flex items-center justify-center ${previewMode ? "" : "md:w-1/2"}`}
          style={{ background: "var(--panel-color)" }}
        />
      </div>
    </div>
  );
};

export default SvgEditor;
