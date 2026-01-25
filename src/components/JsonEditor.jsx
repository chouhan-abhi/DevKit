import React, { useState, useEffect, lazy } from "react";
const  Editor = lazy(() => import("@monaco-editor/react"));
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { AlertCircle, CheckCircle, Code, Minimize2 } from "lucide-react";
import { themeManager } from "../utils/themeManger";
import { storage } from "../utils/StorageManager";

const JsonEditor = () => {
  const STORAGE_KEY = "json-editor-content";

  const fallbackJson = "{\n  \"name\": \"User\",\n  \"age\": 24\n}";
  const savedJson = storage.get(STORAGE_KEY, fallbackJson);

  const [jsonText, setJsonText] = useState(savedJson);
  const [jsonObj, setJsonObj] = useState(() => {
    try {
      return JSON.parse(savedJson);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState(null);

  // ✅ Determine theme modes
  const getThemeMode = (theme) => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    return resolved;
  };

  const [themeMode, setThemeMode] = useState(getThemeMode(themeManager.getTheme()));

  // ✅ Monaco theme mapping
  const getMonacoTheme = (mode) => (mode === "dark" ? "vs-dark" : "vs-light");
  const [monacoTheme, setMonacoTheme] = useState(getMonacoTheme(themeMode));

  // ✅ React to theme changes
  useEffect(() => {
    const handler = (e) => {
      const mode = e.detail;
      setThemeMode(mode);
      setMonacoTheme(getMonacoTheme(mode));
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  // ✅ Persist code
  useEffect(() => {
    storage.set(STORAGE_KEY, jsonText);
  }, [jsonText]);

  // ✅ Editor change
  const handleEditorChange = (value) => {
    const safeVal = value ?? "";
    setJsonText(safeVal);
    try {
      const parsed = JSON.parse(safeVal);
      setJsonObj(parsed);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ JSON format + minify
  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonObj(parsed);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed));
      setJsonObj(parsed);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ Choose correct JsonView style
  const jsonViewStyle = themeMode === "dark" ? darkStyles : defaultStyles;

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex flex-col md:flex-row flex-1 rounded-lg overflow-hidden shadow-sm">
        {/* Left: JSON Editor */}
        <div
          className="flex-1 flex flex-col border-r-0 md:border-r border-b md:border-b-0"
          style={{ borderColor: "var(--border-color)" }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-3 mt-2 border-b"
            style={{ background: "var(--panel-color)", borderColor: "var(--border-color)" }}
          >
            <button
              onClick={formatJson}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
              style={{ background: "var(--sidebar-icon-bg)" }}
              type="button"
              title="Format/Beautify JSON"
            >
              <Code size={16} /> Format
            </button>

            <button
              onClick={minifyJson}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
              style={{ background: "var(--sidebar-icon-bg)" }}
              type="button"
              title="Minify JSON"
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
          <Editor
            height="100%"
            theme={monacoTheme}
            language="json"
            value={jsonText}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              smoothScrolling: true,
            }}
          />
        </div>

        {/* Right: JSON Preview */}
        <div
          className="w-full md:w-[40%] overflow-auto p-6"
          style={{ background: "var(--panel-color)", borderColor: "var(--border-color)" }}
        >
          <h2
            className="text-lg font-semibold mb-4 tracking-wide"
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
