import React, { useState, useEffect, useRef, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Eye,
  Edit,
  Copy,
  Check,
  Sparkles,
  Upload,
  Download,
  Link,
} from "lucide-react";
import { storage } from "../utils/StorageManager";
import { themeManager } from "../utils/themeManger";

/* --------------------------------------------------
 * Mermaid block: render diagram or fallback to raw code on error
 * -------------------------------------------------- */
function MermaidBlock({ code, isDark }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [svg, setSvg] = useState(null);

  useEffect(() => {
    if (!code?.trim()) return;

    let cancelled = false;
    setError(null);
    setSvg(null);

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
        });
        const id = `mermaid-md-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: rendered } = await mermaid.render(id, code.trim());
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Mermaid render failed");
      }
    })();

    return () => { cancelled = true; };
  }, [code, isDark]);

  if (error) {
    return (
      <pre
        className="overflow-x-auto rounded-lg p-4 text-sm my-3 border"
        style={{
          background: "var(--bg-color)",
          borderColor: "var(--border-color)",
          color: "var(--text-color)",
        }}
      >
        <code className="text-xs">{code}</code>
      </pre>
    );
  }

  if (svg) {
    return (
      <div
        className="my-4 flex items-center justify-center overflow-auto rounded-lg p-4 min-h-[120px] [&_svg]:max-w-full [&_svg]:h-auto"
        style={{
          background: "var(--bg-color)",
          border: "1px solid var(--border-color)",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex items-center justify-center overflow-auto rounded-lg p-4 min-h-[120px]"
      style={{
        background: "var(--bg-color)",
        border: "1px solid var(--border-color)",
      }}
    />
  );
}

const MarkdownEditor = () => {
  const initialMarkdown =
    "# Welcome to Markdown Editor\n\nStart writing your markdown here...";

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
  const [urlCopied, setUrlCopied] = useState(false);
  const fileInputRef = useRef(null);
  const editorWrapRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(400);

  /* -------------------------------------------------- */
  /* Theme handling */
  /* -------------------------------------------------- */

  const getEditorTheme = (theme) => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    return resolved === "dark" ? "dark" : "light";
  };

  const [editorTheme, setEditorTheme] = useState(() =>
    getEditorTheme(themeManager.getTheme())
  );

  useEffect(() => {
    const handler = (e) =>
      setEditorTheme(e.detail === "dark" ? "dark" : "light");
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  /* Read markdown from URL hash on mount (e.g. #md=...) */
  useEffect(() => {
    const hash = window.location.hash;
    const match = /#md=(.+)$/.exec(hash);
    if (match?.[1]) {
      try {
        setMarkdown(decodeURIComponent(match[1]));
      } catch {
        // ignore invalid encoded content
      }
    }
  }, []);

  /* Measure editor container so CodeMirror gets a fixed height and can scroll */
  useEffect(() => {
    if (previewMode) return;
    const el = editorWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { height } = entries[0]?.contentRect ?? {};
      if (typeof height === "number" && height > 0) setEditorHeight(height);
    });
    ro.observe(el);
    setEditorHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, [previewMode]);

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
    }, 400);

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

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMarkdown(String(reader.result ?? ""));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportFile = () => {
    const blob = new Blob([markdown ?? ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const URL_MD_MAX_LENGTH = 1500;

  const handleExportToUrl = async () => {
    if ((markdown ?? "").length > URL_MD_MAX_LENGTH) return;
    const hash = `#md=${encodeURIComponent(markdown ?? "")}`;
    const fullUrl = window.location.origin + window.location.pathname + hash;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 1500);
    } catch {
      window.location.hash = hash;
    }
  };

  const extensions = useMemo(() => [markdownLanguage()], []);

  const isDark = editorTheme === "dark";

  const markdownComponents = useMemo(
    () => ({
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary-color)] underline hover:opacity-80"
        >
          {children}
        </a>
      ),
      h1: ({ children }) => (
        <h1 className="text-2xl font-bold mt-6 mb-3 pb-2 border-b" style={{ borderColor: "var(--border-color)", color: "var(--text-color)" }}>
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-bold mt-5 mb-2 pb-1.5 border-b" style={{ borderColor: "var(--border-color)", color: "var(--text-color)" }}>
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: "var(--text-color)" }}>
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="my-3 leading-relaxed" style={{ color: "var(--text-color)" }}>
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="my-3 list-disc list-inside space-y-1" style={{ color: "var(--text-color)" }}>
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="my-3 list-decimal list-inside space-y-1" style={{ color: "var(--text-color)" }}>
          {children}
        </ol>
      ),
      blockquote: ({ children }) => (
        <blockquote
          className="border-l-4 pl-4 my-3 italic opacity-90"
          style={{ borderColor: "var(--primary-color)", color: "var(--text-color)" }}
        >
          {children}
        </blockquote>
      ),
      pre: ({ children }) => (
        <pre
          className="overflow-x-auto rounded-lg p-4 text-sm my-3"
          style={{
            background: "var(--bg-color)",
            border: "1px solid var(--border-color)",
            color: "var(--text-color)",
          }}
        >
          {children}
        </pre>
      ),
      code: ({ className, children }) => {
        const match = /language-(\w+)/.exec(className || "");
        const rawCode = (Array.isArray(children) ? children.join("") : String(children ?? "")).replace(/\n$/, "");
        if (match?.[1] === "mermaid") {
          return <MermaidBlock code={rawCode} isDark={isDark} />;
        }
        if (className) {
          return (
            <code
              className={className}
              style={{
                background: "var(--bg-color)",
                border: "1px solid var(--border-color)",
                padding: "0.2em 0.4em",
                borderRadius: "4px",
                fontSize: "0.9em",
              }}
            >
              {children}
            </code>
          );
        }
        return (
          <code
            className="rounded px-1.5 py-0.5 text-sm"
            style={{
              background: "var(--bg-color)",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)",
            }}
          >
            {children}
          </code>
        );
      },
      hr: () => (
        <hr className="my-6" style={{ borderColor: "var(--border-color)" }} />
      ),
      table: ({ children }) => (
        <div className="overflow-x-auto my-4 rounded-md overflow-hidden" style={{ background: "var(--panel-color)" }}>
          <table className="w-full border-collapse text-sm" style={{ color: "var(--text-color)", background: "var(--panel-color)" }}>
            {children}
          </table>
        </div>
      ),
      th: ({ children }) => (
        <th
          className="text-left p-2 border font-semibold"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-color)" }}
        >
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="p-2 border" style={{ borderColor: "var(--border-color)", background: "var(--panel-color)" }}>
          {children}
        </td>
      ),
      tr: ({ children }) => (
        <tr style={{ borderColor: "var(--border-color)" }}>{children}</tr>
      ),
    }),
    [isDark]
  );

  const canExportToUrl = (markdown ?? "").length <= URL_MD_MAX_LENGTH;

  return (
    <div className="h-full w-full p-2 flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/plain"
        className="hidden"
        onChange={handleImport}
        aria-hidden
      />
      <div className="flex gap-2 py-2 shrink-0 flex-wrap items-center">
        <button
          onClick={formatMarkdown}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
          style={{ background: "var(--sidebar-icon-bg)", color: "var(--sidebar-icon-text)" }}
          type="button"
        >
          <Sparkles size={16} /> Format
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
          style={{ background: "var(--sidebar-icon-bg)", color: "var(--sidebar-icon-text)" }}
          type="button"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
          style={{ background: "var(--sidebar-icon-bg)", color: "var(--sidebar-icon-text)" }}
          type="button"
        >
          <Upload size={16} /> Import
        </button>
        <button
          onClick={handleExportFile}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
          style={{ background: "var(--sidebar-icon-bg)", color: "var(--sidebar-icon-text)" }}
          type="button"
        >
          <Download size={16} /> Export
        </button>
        <button
          onClick={handleExportToUrl}
          disabled={!canExportToUrl}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--sidebar-icon-bg)", color: "var(--sidebar-icon-text)" }}
          type="button"
          title={canExportToUrl ? "Copy URL with content (short docs only)" : "Document too long for URL"}
        >
          {urlCopied ? <Check size={16} /> : <Link size={16} />}
          {urlCopied ? "URL copied" : "Export to URL"}
        </button>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
          style={{ background: "var(--sidebar-icon-bg)", color: "var(--sidebar-icon-text)" }}
          type="button"
        >
          {previewMode ? <Edit size={16} /> : <Eye size={16} />}
          {previewMode ? "Edit" : "Preview"}
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ minHeight: 280 }}>
        {!previewMode && (
          <div
            ref={editorWrapRef}
            className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden rounded-md border-r"
            style={{ borderColor: "var(--border-color)", minHeight: 280 }}
          >
            <CodeMirror
              value={markdown}
              height={editorHeight}
              minHeight={280}
              theme={editorTheme}
              extensions={extensions}
              onChange={(v) => setMarkdown(v ?? "")}
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
          </div>
        )}
        <div
          className={`overflow-auto rounded-md p-6 ${previewMode ? "w-full" : "w-1/2"}`}
          style={{ background: "var(--panel-color)", color: "var(--text-color)" }}
        >
          <div className="max-w-none text-[var(--text-color)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown ?? ""}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
