import React, { useState, useEffect, useMemo, useRef } from "react";
import { Eye, Edit, Copy, Check, Sparkles, Download, Upload, Link2 } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown as markdownLang } from "@codemirror/lang-markdown";
import LZString from "lz-string";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { themeManager } from "../utils/themeManger";
import SubAppToolbar from "./SubAppToolbar";
import { useDocuments } from "../hooks/useDocuments";
import { useToast } from "./ToastProvider";

const MermaidPreview = ({ code, theme, onError, onSuccess }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !code?.trim()) return;

    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
          securityLevel: "loose",
        });
        if (mermaid.parse) {
          await mermaid.parse(code);
        }
        const id = `markdown-mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
        onSuccess?.();
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        onError?.(err);
      }
    };

    render();
  }, [code, theme]);

  return <div ref={containerRef} />;
};

const MarkdownEditor = () => {
  const initialMarkdown =
    "# Welcome to Markdown Editor\n\nStart writing your markdown here...";

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
    appId: "markdown",
    defaultTitle: "Untitled Markdown",
    initialContent: { markdown: initialMarkdown },
    meta: { language: "markdown" },
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const { showToast } = useToast();
  const markdownText = content?.markdown ?? "";
  const sharedHandledRef = useRef(false);

  const getTheme = (theme) => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    return resolved === "dark" ? "dark" : "light";
  };

  const [editorTheme, setEditorTheme] = useState(() =>
    getTheme(themeManager.getTheme())
  );

  useEffect(() => {
    const handler = (e) => setEditorTheme(e.detail === "dark" ? "dark" : "light");
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);


  useEffect(() => {
    if (sharedHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sharedDoc = params.get("md");
    if (sharedDoc) {
      const decoded = LZString.decompressFromEncodedURIComponent(sharedDoc);
      if (!decoded) return;
      let payload;
      try {
        payload = JSON.parse(decoded);
      } catch {
        payload = { markdown: decoded };
      }

      const nextMarkdown =
        payload?.markdown ?? payload?.content?.markdown ?? decoded;
      const nextTitle = payload?.title || "Shared Markdown";

      createDoc(nextTitle, { markdown: nextMarkdown });
      sharedHandledRef.current = true;

      const url = new URL(window.location.href);
      url.searchParams.delete("md");
      window.history.replaceState({}, "", url.toString());
    }
  }, [createDoc]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExport = () => {
    const blob = new Blob([markdownText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareUrl = async () => {
    const payload = {
      v: 1,
      title: title || "Shared Markdown",
      markdown: markdownText,
    };
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify(payload)
    );
    const url = `${window.location.origin}${window.location.pathname}?md=${compressed}`;
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 1500);
    showToast("Share URL copied to clipboard");
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result || "";
      setContent((prev) => ({ ...(prev || {}), markdown: String(text) }));
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const formatMarkdown = () => {
    const lines = markdownText.split("\n");
    const cleaned = [];
    for (let i = 0; i < lines.length; i++) {
      const prev = cleaned[cleaned.length - 1];
      if (lines[i].trim() === "" && prev === "") continue;
      cleaned.push(lines[i]);
    }
    setContent((prev) => ({ ...(prev || {}), markdown: cleaned.join("\n") }));
  };

  const extensions = useMemo(() => [markdownLang()], []);

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <div className="p-3">
        <SubAppToolbar
          documents={documents}
          currentId={currentId}
          currentTitle={title}
          onSelect={setCurrentDocId}
          onRename={renameDoc}
          onNew={() => createDoc("Untitled Markdown", { markdown: initialMarkdown })}
          onSaveAs={(name) => saveAs(name)}
          onDelete={() => deleteDoc()}
          status={isSaving ? "saving" : "saved"}
          rightActions={
            <>
              <button onClick={formatMarkdown} className="toolbar-btn">
                <Sparkles size={16} /> Format
              </button>

              <button onClick={handleCopy} className="toolbar-btn">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>

              <button onClick={handleExport} className="toolbar-btn">
                <Download size={16} /> Export .md
              </button>

              <button onClick={handleShareUrl} className="toolbar-btn">
                {shared ? <Check size={16} /> : <Link2 size={16} />}
                {shared ? "URL Copied" : "Share URL"}
              </button>

              <label className="toolbar-btn">
                <Upload size={16} /> Import
                <input
                  type="file"
                  accept=".md,.markdown,text/markdown,text/plain"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="toolbar-btn"
              >
                {previewMode ? <Edit size={16} /> : <Eye size={16} />}
                {previewMode ? "Edit" : "Preview"}
              </button>
            </>
          }
        />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!previewMode && (
          <div className="flex-1 min-h-0 overflow-auto border-r border-[var(--border-color)]">
            <CodeMirror
              value={markdownText}
              height="100%"
              theme={editorTheme}
              extensions={extensions}
              onChange={(value) =>
                setContent((prev) => ({
                  ...(prev || {}),
                  markdown: value ?? "",
                }))
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
              className="h-full"
            />
          </div>
        )}

        <div
          className={`overflow-auto ${previewMode ? "w-full" : "w-1/2"}`}
          style={{ background: "var(--panel-color)" }}
        >
          <div className="p-6 prose max-w-none markdown-preview">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const lang = match?.[1];
                  if (!inline && lang === "mermaid") {
                    return (
                      <MermaidPreview
                        code={String(children)}
                        theme={editorTheme}
                        onError={() => showToast("Mermaid diagram has a syntax error")}
                        onSuccess={() => {}}
                      />
                    );
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {markdownText}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
