import React, { useState, useEffect, useRef, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { xml } from "@codemirror/lang-xml";
import {
  Save,
  FileText,
  Trash2,
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
  Hexagon
} from "lucide-react";
import { storage } from "../../utils/StorageManager";
import { themeManager } from "../../utils/themeManger";

const SvgEditor = () => {
  const initialSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" stroke="black" stroke-width="3" fill="red"/>
</svg>`;

  const [svgCode, setSvgCode] = useState(() =>
    storage.get("svg:current", initialSvg)
  );
  const [savedFiles, setSavedFiles] = useState(() =>
    storage.get("svg:files", [])
  );
  const [currentFileId, setCurrentFileId] = useState(() =>
    storage.get("svg:currentFileId", null)
  );
  const [fileName, setFileName] = useState(() => {
    if (currentFileId) {
      const file = savedFiles.find((f) => f.id === currentFileId);
      return file?.name || "";
    }
    return "";
  });
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showFilesDropdown, setShowFilesDropdown] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportResolution, setExportResolution] = useState(1); // multiplier

  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const hasRestoredFile = useRef(false);

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

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentFileId) {
        const updatedFiles = savedFiles.map((file) =>
          file.id === currentFileId
            ? { ...file, content: svgCode, updatedAt: new Date().toISOString() }
            : file
        );
        setSavedFiles(updatedFiles);
        storage.set("svg:files", updatedFiles);
        storage.set("svg:currentFileId", currentFileId);
      } else {
        storage.set("svg:current", svgCode);
        storage.remove("svg:currentFileId");
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [svgCode, currentFileId, savedFiles]);

  // Restore file once
  useEffect(() => {
    if (!hasRestoredFile.current && currentFileId && savedFiles.length > 0) {
      const file = savedFiles.find((f) => f.id === currentFileId);
      if (file) {
        setSvgCode(file.content);
        setFileName(file.name);
        hasRestoredFile.current = true;
      }
    }
  }, [currentFileId, savedFiles]);

  // Preview SVG
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = svgCode;
    }
  }, [svgCode]);

  // Clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(svgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Save & Load
  const handleSave = () => {
    if (!fileName.trim()) return;

    const fileData = {
      id: currentFileId || Date.now(),
      name: fileName.trim(),
      content: svgCode,
      createdAt: currentFileId
        ? savedFiles.find((f) => f.id === currentFileId)?.createdAt ||
          new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedFiles;
    if (currentFileId) {
      updatedFiles = savedFiles.map((f) => (f.id === currentFileId ? fileData : f));
    } else {
      updatedFiles = [...savedFiles, fileData];
      setCurrentFileId(fileData.id);
    }

    setSavedFiles(updatedFiles);
    storage.set("svg:files", updatedFiles);
    storage.set("svg:currentFileId", fileData.id);
    setShowSaveDropdown(false);
  };

  const handleLoad = (file) => {
    setSvgCode(file.content);
    setCurrentFileId(file.id);
    setFileName(file.name);
    storage.set("svg:currentFileId", file.id);
    setShowFilesDropdown(false);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this file?")) {
      const updatedFiles = savedFiles.filter((f) => f.id !== id);
      setSavedFiles(updatedFiles);
      storage.set("svg:files", updatedFiles);
      if (currentFileId === id) {
        setCurrentFileId(null);
        setFileName("");
        setSvgCode(initialSvg);
      }
    }
  };

  // Export SVG/PNG
  const handleExport = (format = "svg", resolution = 1) => {
    if (format === "svg") {
      const blob = new Blob([svgCode], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName || "drawing"}.svg`;
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
          a.download = `${fileName || "drawing"}.png`;
          a.click();
        });
      };
      img.src = url;
    }
  };

  // Shape insertion
  const shapeSnippets = {
    circle: `<circle cx="100" cy="100" r="50" stroke="black" stroke-width="3" fill="red"/>`,
    square: `<rect x="50" y="50" width="100" height="100" stroke="black" stroke-width="3" fill="blue"/>`,
    triangle: `<polygon points="100,50 50,150 150,150" stroke="black" stroke-width="3" fill="green"/>`,
    star: `<polygon points="100,10 120,90 190,90 135,135 155,190 100,160 45,190 65,135 10,90 80,90" stroke="black" stroke-width="3" fill="yellow"/>`,
    hexagon: `<polygon points="100,20 140,50 140,110 100,140 60,110 60,50" stroke="black" stroke-width="3" fill="purple"/>`,
  };

  const addShapeSnippet = (shape) => {
    const snippet = shapeSnippets[shape] || "";
    setSvgCode((prev) =>
      prev.replace("</svg>", `  ${snippet}\n</svg>`)
    );
  };

  // Import SVG
  const handleImportSvg = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const svgText = event.target.result;
      if (svgText.includes("<svg")) {
        setSvgCode(svgText);
        setCurrentFileId(null);
        setFileName(file.name.replace(/\.svg$/i, ""));
      } else {
        alert("Invalid SVG file");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="h-full flex flex-col w-full p-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mt-2 py-2 border-b" style={{ borderColor: "var(--panel-color)" }}>
        {/* Save */}
        <div className="relative">
          <button
            onClick={() => setShowSaveDropdown(!showSaveDropdown)}
            className="px-3 py-1.5 rounded-lg bg-[var(--primary-color)] text-white flex items-center gap-2"
          >
            <Save size={16} /> Save
          </button>
          {showSaveDropdown && (
            <div className="absolute top-full mt-2 w-64 bg-[var(--panel-color)] shadow-lg rounded-lg p-3 z-50">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name..."
                className="w-full mb-2 p-2 border rounded"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <button
                onClick={handleSave}
                className="px-3 py-1.5 w-full bg-[var(--primary-color)] text-white rounded"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Saved Files */}
        <div className="relative">
          <button
            onClick={() => setShowFilesDropdown(!showFilesDropdown)}
            className="px-3 py-1.5 rounded-lg bg-[var(--panel-color)] text-white flex items-center gap-2"
          >
            <FileText size={16} /> Saved Files ({savedFiles.length})
          </button>
          {showFilesDropdown && (
            <div className="absolute top-full mt-2 w-64 bg-[var(--panel-color)] shadow-lg rounded-lg max-h-96 overflow-y-auto p-2 z-50">
              {savedFiles.length === 0 && (
                <p className="text-center text-sm opacity-70 py-4">No saved files</p>
              )}
              {savedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 border-b cursor-pointer hover:bg-gray-100"
                >
                  <span onClick={() => handleLoad(file)}>{file.name}</span>
                  <Trash2
                    size={16}
                    className="text-red-500 cursor-pointer"
                    onClick={() => handleDelete(file.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Copy */}
        <button
          onClick={handleCopyToClipboard}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-white ${copied ? "bg-green-600" : "bg-[var(--panel-color)]"}`}
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

        {/* Preview/Edit */}
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-[var(--panel-color)] text-white"
        >
          {previewMode ? <Edit size={16} /> : <Eye size={16} />}
          {previewMode ? "Edit" : "Preview"}
        </button>

        {/* Shape Selector */}
        <div className="flex gap-2">
          {Object.keys(shapeSnippets).map((shape) => {
            const IconMap = { circle: Circle, square: Square, triangle: Triangle, star: Star, hexagon: Hexagon };
            const Icon = IconMap[shape];
            return (
              <button key={shape} title={`Add ${shape}`} onClick={() => addShapeSnippet(shape)} className="p-2 bg-[var(--panel-color)] rounded">
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        {/* Import SVG */}
        <div className="relative">
          <button
            onClick={() => document.getElementById("svg-import-input").click()}
            className="px-3 py-1.5 rounded-lg flex items-center gap-2 bg-[var(--panel-color)] text-white"
          >
            <Upload size={16} /> Import SVG
          </button>
          <input
            type="file"
            accept=".svg"
            id="svg-import-input"
            className="hidden"
            onChange={handleImportSvg}
          />
        </div>

        {/* Export */}
        <div className="flex text-(--text-color) gap-2 ml-auto items-center border border-(--border-color) bg-(--panel-color) rounded-full px-2">
           <Download size={16} />  Options: 
          <input
            type="number"
            min={1}
            max={10}
            value={exportResolution}
            onChange={(e) => setExportResolution(Number(e.target.value))}
            className="w-16 bg-(--border-color) rounded-full px-3 border-none"
            title="Resolution multiplier for PNG export"
          />
          <button
            onClick={() => handleExport("svg")}
            className="px-3 py-1.5"
          >
           SVG
          </button>
          <button
            onClick={() => handleExport("png", exportResolution)}
            className="px-3 py-1.5"
          >
          PNG
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex flex-1 min-h-0 overflow-hidden mt-2 border border-[var(--border-color)] rounded-md">
        {!previewMode && (
          <div className="flex-1 min-h-[200px] overflow-hidden">
            <CodeMirror
              value={svgCode}
              height="100%"
              minHeight="200px"
              theme={editorTheme}
              extensions={[xml()]}
              onChange={(val) => setSvgCode(val ?? "")}
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
          </div>
        )}
        <div
          ref={previewRef}
          className={`p-4 w-full overflow-auto ${previewMode ? "md:w-full" : "md:w-1/2"}`}
        />
      </div>
    </div>
  );
};

export default SvgEditor;
