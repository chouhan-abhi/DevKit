import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { JsonView, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { AlertCircle, CheckCircle, Code, Minimize2 } from "lucide-react";
import { themeManager } from "../utils/themeManger";

const JsonEditor = () => {
  const initialJson = "{\n  \"name\": \"Abhishek\",\n  \"age\": 24\n}";

  const [jsonText, setJsonText] = useState(initialJson);
  const [jsonObj, setJsonObj] = useState(() => {
    try {
      return JSON.parse(initialJson);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState(null);

  // Get initial theme and convert to Monaco theme format
  const getMonacoTheme = (theme) => {
    const resolvedTheme = theme === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    return resolvedTheme === "dark" ? "vs-dark" : "vs-light";
  };
  
  const [monacoTheme, setMonacoTheme] = useState(() => {
    const currentTheme = themeManager.getTheme();
    return getMonacoTheme(currentTheme);
  });

  useEffect(() => {
    const handler = (e) => {
      const theme = e.detail === "dark" ? "vs-dark" : "vs-light";
      setMonacoTheme(theme);
    };

    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

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

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* MAIN BODY */}
      <div className="flex flex-1 rounded-lg overflow-hidden shadow-sm">

        {/* LEFT SIDE - JSON Editor */}
        <div
          className="flex-1 flex flex-col border-r"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ background: "var(--panel)", borderColor: "var(--border)" }}
          >
            <button
              onClick={formatJson}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white"
              style={{ background: "var(--primary-color)" }}
            >
              <Code size={16} /> Format
            </button>

            <button
              onClick={minifyJson}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-white"
              style={{ background: "var(--primary-color)" }}
            >
              <Minimize2 size={16} /> Minify
            </button>

            {/* Status Icon */}
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

        {/* RIGHT SIDE - JSON Preview */}
        <div
          className="w-[40%] overflow-auto p-6 border-l"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
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
            <JsonView data={jsonObj} style={defaultStyles} />
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonEditor;
