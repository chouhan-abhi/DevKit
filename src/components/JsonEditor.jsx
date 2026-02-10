import React, { useState, useEffect, useMemo, useRef } from "react";
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { AlertCircle, CheckCircle, Code, Minimize2 } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { themeManager } from "../utils/themeManger";
import SubAppToolbar from "./SubAppToolbar";
import { useDocuments } from "../hooks/useDocuments";

const JsonEditor = () => {
  const parseTimerRef = useRef(null);

  const fallbackJson = "{\n  \"name\": \"User\",\n  \"age\": 24\n}";

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
    appId: "json",
    defaultTitle: "JSON Document",
    initialContent: { jsonText: fallbackJson },
  });

  const jsonText = content?.jsonText ?? fallbackJson;
  const [jsonObj, setJsonObj] = useState(() => {
    try {
      return JSON.parse(jsonText);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState(null);

  const getThemeMode = (theme) =>
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const [themeMode, setThemeMode] = useState(() =>
    getThemeMode(themeManager.getTheme())
  );

  const jsonViewStyle = themeMode === "dark" ? darkStyles : defaultStyles;

  useEffect(() => {
    const handler = (e) => {
      setThemeMode(e.detail);
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

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
    }, 300);

    return () => clearTimeout(parseTimerRef.current);
  }, [jsonText]);

  const handleEditorChange = (value) => {
    setContent((prev) => ({ ...(prev || {}), jsonText: value ?? "" }));
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setContent((prev) => ({
        ...(prev || {}),
        jsonText: JSON.stringify(parsed, null, 2),
      }));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setContent((prev) => ({
        ...(prev || {}),
        jsonText: JSON.stringify(parsed),
      }));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const extensions = useMemo(() => [json()], []);

  return (
    <div
      className="h-full w-full flex flex-col min-h-0"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="p-3">
        <SubAppToolbar
          documents={documents}
          currentId={currentId}
          currentTitle={title}
          onSelect={setCurrentDocId}
          onRename={renameDoc}
          onNew={() => createDoc("JSON Document", { jsonText: fallbackJson })}
          onSaveAs={(name) => saveAs(name)}
          onDelete={() => deleteDoc()}
          status={isSaving ? "saving" : "saved"}
          rightActions={
            <>
              <button onClick={formatJson} className="toolbar-btn" type="button">
                <Code size={16} /> Format
              </button>

              <button onClick={minifyJson} className="toolbar-btn" type="button">
                <Minimize2 size={16} /> Minify
              </button>
            </>
          }
        />
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 rounded-lg overflow-hidden shadow-sm">
        <div
          className="flex-1 flex flex-col min-h-0 border-r-0 md:border-r border-b md:border-b-0"
          style={{ borderColor: "var(--border-color)" }}
        >
          <CodeMirror
            value={jsonText}
            height="100%"
            theme={themeMode}
            extensions={extensions}
            onChange={handleEditorChange}
            className="h-full"
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
        </div>

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

      <div className="px-4 py-2">
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
  );
};

export default JsonEditor;
