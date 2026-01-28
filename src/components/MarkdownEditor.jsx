import React, {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react";
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
} from "lucide-react";
import { storage } from "../utils/StorageManager";
import { themeManager } from "../utils/themeManger";

const Editor = lazy(() => import("@monaco-editor/react"));

/* -------------------------------------------------- */
/* Markdown → HTML (unchanged, safe) */
/* -------------------------------------------------- */

const markdownToHtml = (markdown) => {
  if (!markdown) return "";

  let html = markdown;
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styles = [];
  let match;

  while ((match = styleRegex.exec(markdown)) !== null) {
    styles.push(match[1]);
  }

  html = html.replace(styleRegex, "");

  html = html
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>")
    .replace(/`(.*?)`/gim, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/gim,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2" />')
    .replace(/\n/gim, "<br />");

  if (styles.length) {
    html = `<style>${styles.join("\n")}</style>` + html;
  }

  return html;
};

/* -------------------------------------------------- */
/* Component */
/* -------------------------------------------------- */

const MarkdownEditor = () => {
  const initialMarkdown =
    "# Welcome to Markdown Editor\n\nStart writing your markdown here...";

  const editorRef = useRef(null);
  const autosaveTimer = useRef(null);

  const [markdown, setMarkdown] = useState(() =>
    storage.get("markdown:current", initialMarkdown)
  );
  const [savedFiles, setSavedFiles] = useState(() =>
    storage.get("markdown:files", [])
  );
  const [currentFileId, setCurrentFileId] = useState(() =>
    storage.get("markdown:currentFileId", null)
  );
  const [fileName, setFileName] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);

  /* -------------------------------------------------- */
  /* Theme handling */
  /* -------------------------------------------------- */

  const getMonacoTheme = (theme) => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    return resolved === "dark" ? "vs-dark" : "vs-light";
  };

  const [monacoTheme, setMonacoTheme] = useState(() =>
    getMonacoTheme(themeManager.getTheme())
  );

  useEffect(() => {
    const handler = (e) =>
      setMonacoTheme(e.detail === "dark" ? "vs-dark" : "vs-light");
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  /* -------------------------------------------------- */
  /* Debounced autosave (CRITICAL FIX) */
  /* -------------------------------------------------- */

  useEffect(() => {
    clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      if (currentFileId) {
        const updated = savedFiles.map((f) =>
          f.id === currentFileId
            ? { ...f, content: markdown, updatedAt: new Date().toISOString() }
            : f
        );
        setSavedFiles(updated);
        storage.set("markdown:files", updated);
        storage.set("markdown:currentFileId", currentFileId);
      } else {
        storage.set("markdown:current", markdown);
      }
    }, 800);

    return () => clearTimeout(autosaveTimer.current);
  }, [markdown, currentFileId, savedFiles]);

  /* -------------------------------------------------- */
  /* Actions */
  /* -------------------------------------------------- */

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatMarkdown = () => {
    const lines = markdown.split("\n");
    const cleaned = [];
    for (let i = 0; i < lines.length; i++) {
      const prev = cleaned[cleaned.length - 1];
      if (lines[i].trim() === "" && prev === "") continue;
      cleaned.push(lines[i]);
    }
    setMarkdown(cleaned.join("\n"));
  };

  /* -------------------------------------------------- */
  /* Monaco options (glitch-free) */
  /* -------------------------------------------------- */

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: "on",
    scrollBeyondLastLine: false,
    automaticLayout: true,
    smoothScrolling: true,
    padding: { top: 8 },
  };

  /* -------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------- */

  return (
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex gap-2 p-3 border-b">
        <button onClick={formatMarkdown} className="btn">
          <Sparkles size={16} /> Format
        </button>

        <button onClick={handleCopy} className="btn">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </button>

        <button onClick={() => setPreviewMode(!previewMode)} className="btn ml-auto">
          {previewMode ? <Edit size={16} /> : <Eye size={16} />}
          {previewMode ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {!previewMode && (
          <div className="flex-1">
            <Suspense fallback={<div className="p-4">Loading editor…</div>}>
              <div className="monaco-root">
                <Editor
                  height="100%"
                  language="markdown"
                  theme={monacoTheme}
                  value={markdown}
                  options={editorOptions}
                  onMount={(editor) => (editorRef.current = editor)}
                  onChange={(v) => setMarkdown(v ?? "")}
                />
              </div>
            </Suspense>
          </div>
        )}

        <div
          className={`overflow-auto ${previewMode ? "w-full" : "w-1/2"
            }`}
          style={{ background: "var(--panel-color)" }}
        >
          <div className="p-6 prose max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(markdown),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
