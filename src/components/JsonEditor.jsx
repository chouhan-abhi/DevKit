import React, {
  useState,
  useEffect,
  lazy,
  Suspense,
  useRef,
} from "react";
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { AlertCircle, CheckCircle, Code, Minimize2 } from "lucide-react";
import { themeManager } from "../utils/themeManger";
import { storage } from "../utils/StorageManager";

const Editor = lazy(() => import("@monaco-editor/react"));

const JsonEditor = () => {
  /* -------------------------------------------------- */
  /* Constants & refs */
  /* -------------------------------------------------- */

  const STORAGE_KEY = "json-editor-content";
  const editorRef = useRef(null);
  const parseTimerRef = useRef(null);

  const fallbackJson = "{\n  \"name\": \"User\",\n  \"age\": 24\n}";
  const savedJson = storage.get(STORAGE_KEY, fallbackJson);

  /* -------------------------------------------------- */
  /* State */
  /* -------------------------------------------------- */

  const [jsonText, setJsonText] = useState(savedJson);
  const [jsonObj, setJsonObj] = useState(() => {
    try {
      return JSON.parse(savedJson);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState(null);

  /* -------------------------------------------------- */
  /* Theme handling */
  /* -------------------------------------------------- */

  const getThemeMode = (theme) =>
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const [themeMode, setThemeMode] = useState(() =>
    getThemeMode(themeManager.getTheme())
  );

  const monacoTheme = themeMode === "dark" ? "vs-dark" : "vs-light";
  const jsonViewStyle = themeMode === "dark" ? darkStyles : defaultStyles;

  useEffect(() => {
    const handler = (e) => {
      setThemeMode(e.detail);
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  /* -------------------------------------------------- */
  /* Persist JSON text */
  /* -------------------------------------------------- */

  useEffect(() => {
    storage.set(STORAGE_KEY, jsonText);
  }, [jsonText]);

  /* -------------------------------------------------- */
  /* Debounced JSON validation (key fix) */
  /* -------------------------------------------------- */

  useEffect(() => {
    clearTimeout(parseTimerRef.current);

    parseTimerRef.current = setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonText);
        setJsonObj(parsed);
        setError(null);
      } catch (err) {
        setJsonObj(null);
        setError(err.message);
      }
    }, 300); // ← debounce

    return () => clearTimeout(parseTimerRef.current);
  }, [jsonText]);

  /* -------------------------------------------------- */
  /* Editor change */
  /* -------------------------------------------------- */

  const handleEditorChange = (value) => {
    setJsonText(value ?? "");
  };

  /* -------------------------------------------------- */
  /* Actions */
  /* -------------------------------------------------- */

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  /* -------------------------------------------------- */
  /* Monaco options (glitch prevention) */
  /* -------------------------------------------------- */

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    tabSize: 2,
    smoothScrolling: true,
    padding: { top: 8 },
  };

  /* -------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------- */

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex flex-col md:flex-row flex-1 rounded-lg overflow-hidden shadow-sm">
        {/* LEFT: JSON Editor */}
        <div
          className="flex-1 flex flex-col border-r-0 md:border-r border-b md:border-b-0"
          style={{ borderColor: "var(--border-color)" }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-3 mt-2 border-b"
            style={{ borderColor: "var(--border-color)" }}
          >
            <button
              onClick={formatJson}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white"
              style={{ background: "var(--sidebar-icon-bg)" }}
              type="button"
            >
              <Code size={16} /> Format
            </button>

            <button
              onClick={minifyJson}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white"
              style={{ background: "var(--sidebar-icon-bg)" }}
              type="button"
            >
              <Minimize2 size={16} /> Minify
            </button>

            <div className="ml-auto">
              {error ? (
                <span className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle size={16} /> Invalid JSON
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 text-sm"
                  style={{ color: "var(--primary-color)" }}
                >
                  <CheckCircle size={16} /> Valid JSON
                </span>
              )}
            </div>
          </div>

          {/* Monaco Editor */}
          <Suspense fallback={<div className="p-4">Loading editor…</div>}>
            <div className="monaco-root">
              <Editor
                height="100%"
                language="json"
                theme={monacoTheme}
                value={jsonText}
                options={editorOptions}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                onChange={handleEditorChange}
              />
            </div>
          </Suspense>
        </div>

        {/* RIGHT: JSON Preview */}
        <div
          className="w-full md:w-[40%] overflow-auto p-6"
          style={{ background: "var(--panel-color)" }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--primary-color)" }}
          >
            JSON Structure
          </h2>

          {error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : (
            <div
              style={{
                borderRadius: "8px",
                background: "var(--bg)",
                padding: "10px",
              }}
            >
              <JsonView data={jsonObj} style={jsonViewStyle} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonEditor;
