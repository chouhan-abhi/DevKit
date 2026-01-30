import React, { useState, useEffect, useRef, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import ReactMarkdown from "react-markdown";
import {
  Eye,
  Edit,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { storage } from "../utils/StorageManager";
import { themeManager } from "../utils/themeManger";

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

  const extensions = useMemo(() => [markdownLanguage()], []);

  return (
    <div className="h-full w-full p-2 flex flex-col">
      <div className="flex gap-2 py-2 shrink-0">
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
          onClick={() => setPreviewMode(!previewMode)}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
          style={{ background: "var(--sidebar-icon-bg)", color: "var(--sidebar-icon-text)" }}
          type="button"
        >
          {previewMode ? <Edit size={16} /> : <Eye size={16} />}
          {previewMode ? "Edit" : "Preview"}
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!previewMode && (
          <div className="flex-1 min-h-[200px] overflow-hidden rounded-md border-r" style={{ borderColor: "var(--border-color)" }}>
            <CodeMirror
              value={markdown}
              height="100%"
              minHeight="200px"
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
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                pre: ({ children }) => (
                  <pre className="overflow-x-auto rounded-lg bg-black/5 dark:bg-white/10 p-4 text-sm my-3">
                    {children}
                  </pre>
                ),
                code: ({ className, children }) =>
                  className ? (
                    <code className={className}>{children}</code>
                  ) : (
                    <code className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-sm">
                      {children}
                    </code>
                  ),
              }}
            >
              {markdown ?? ""}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
