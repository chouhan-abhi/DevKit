import React, { useState, useEffect, useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { themeManager } from "../../utils/themeManger";

const CodeEditor = ({
  initialCode = "",
  language = "javascript",
  onCodeChange,
}) => {
  const [code, setCode] = useState(initialCode);
  const [editorTheme, setEditorTheme] = useState("light");

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const resolveTheme = useCallback(() => {
    const theme = themeManager.getTheme();
    return theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
  }, []);

  useEffect(() => {
    setEditorTheme(resolveTheme());
    const handler = (e) => {
      setEditorTheme(e.detail === "dark" ? "dark" : "light");
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, [resolveTheme]);

  const handleChange = useCallback(
    (value) => {
      const next = value ?? "";
      setCode(next);
      onCodeChange?.(next);
    },
    [onCodeChange]
  );

  const extensions = useMemo(() => [javascript({ jsx: true })], []);

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      <div
        className="flex-1 w-full min-h-[200px] rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border-color)" }}
      >
        <CodeMirror
          value={code}
          height="100%"
          minHeight="200px"
          theme={editorTheme}
          extensions={extensions}
          onChange={handleChange}
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
    </div>
  );
};

export default CodeEditor;
