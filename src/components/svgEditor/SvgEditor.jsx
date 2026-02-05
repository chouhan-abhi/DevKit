import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Download,
  Upload,
  Eye,
  Edit,
  Copy,
  Check,
  Circle,
  Square,
  Triangle,
  Star,
  Hexagon,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { xml } from "@codemirror/lang-xml";
import { themeManager } from "../../utils/themeManger";
import SubAppToolbar from "../SubAppToolbar";
import { useDocuments } from "../../hooks/useDocuments";

const SvgEditor = () => {
  const initialSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" stroke="black" stroke-width="3" fill="red"/>
</svg>`;

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
    appId: "svg-editor",
    defaultTitle: "Untitled SVG",
    initialContent: { svg: initialSvg },
    meta: { language: "svg" },
  });

  const svgCode = content?.svg ?? initialSvg;
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportResolution, setExportResolution] = useState(1);

  const previewRef = useRef(null);

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
      setEditorTheme(e.detail === "dark" ? "dark" : "light");
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = svgCode;
    }
  }, [svgCode]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(svgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
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
      return {
        ...(prev || {}),
        svg: current.replace("</svg>", `  ${snippet}\n</svg>`),
      };
    });
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
      } else {
        alert("Invalid SVG file");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const extensions = useMemo(() => [xml()], []);

  return (
    <div className="h-full flex flex-col w-[96%]">
      <div className="p-3">
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
              <button onClick={handleCopyToClipboard} className="toolbar-btn">
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
              >
                {previewMode ? <Edit size={16} /> : <Eye size={16} />}
                {previewMode ? "Edit" : "Preview"}
              </button>

              <div className="toolbar-actions">
                {Object.keys(shapeSnippets).map((shape) => {
                  const IconMap = {
                    circle: Circle,
                    square: Square,
                    triangle: Triangle,
                    star: Star,
                    hexagon: Hexagon,
                  };
                  const Icon = IconMap[shape];
                  return (
                    <button
                      key={shape}
                      title={`Add ${shape}`}
                      onClick={() => addShapeSnippet(shape)}
                      className="toolbar-btn"
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>

              <label className="toolbar-btn">
                <Upload size={16} /> Import
                <input
                  type="file"
                  accept=".svg"
                  id="svg-import-input"
                  className="hidden"
                  onChange={handleImportSvg}
                />
              </label>

              <div className="toolbar-actions">
                <Download size={16} />
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={exportResolution}
                  onChange={(e) => setExportResolution(Number(e.target.value))}
                  className="w-16"
                  title="Resolution multiplier for PNG export"
                />
                <button onClick={() => handleExport("svg")} className="toolbar-btn">
                  SVG
                </button>
                <button
                  onClick={() => handleExport("png", exportResolution)}
                  className="toolbar-btn"
                >
                  PNG
                </button>
              </div>
            </>
          }
        />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden mt-2">
        {!previewMode && (
          <CodeMirror
            value={svgCode}
            height="100%"
            minHeight="280px"
            theme={editorTheme}
            extensions={extensions}
            onChange={(val) =>
              setContent((prev) => ({ ...(prev || {}), svg: val ?? "" }))
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
        )}
        <div
          ref={previewRef}
          className={`p-4 w-full overflow-auto ${
            previewMode ? "md:w-full" : "md:w-1/2"
          }`}
        />
      </div>
    </div>
  );
};

export default SvgEditor;
