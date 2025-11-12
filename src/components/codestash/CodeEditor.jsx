import React, { useState, useEffect, useCallback, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { themeManager } from "../../utils/themeManger";

const CodeEditor = ({ initialCode = "", fileName = "script.js", onCodeChange }) => {
  const [code, setCode] = useState(initialCode);
  const [editorTheme, setEditorTheme] = useState("light");

  // Get theme once from themeManager
  useEffect(() => {
    const savedTheme = themeManager.getTheme();
    const finalTheme =
      savedTheme === "dark" || 
      (savedTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "vs-dark"
        : "light";
    setEditorTheme(finalTheme);
  }, []);

  // Handle code updates
  const handleCodeChange = useCallback(
    (updatedCode) => {
      setCode(updatedCode);
      if (onCodeChange) onCodeChange(updatedCode);
    },
    [onCodeChange]
  );

  const editorOptions = useMemo(
    () => ({
      fontSize: 14,
      fontFamily: "JetBrains Mono, monospace",
      lineNumbers: "on",
      automaticLayout: true,
      minimap: { enabled: true },
      smoothScrolling: true,
      scrollBeyondLastLine: false,
      cursorBlinking: "smooth",
      roundedSelection: true,
      padding: { top: 12 },
      wordWrap: "on",
      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
    }),
    []
  );

  return (
    <div
      className="
        flex flex-col w-full h-full overflow-hidden
        bg-[var(--panel-color)] shadow-md
        transition-all duration-300
      "
    >
      {/* Editor Body */}
      <div className="flex-1">
        <Editor
          height="100%"
          language="javascript"
          value={code}
          theme={editorTheme}
          onChange={handleCodeChange}
          options={editorOptions}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
