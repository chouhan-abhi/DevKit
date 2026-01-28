import React, { useState, useEffect, useCallback, useMemo } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { themeManager } from "../../utils/themeManger";

const CodeEditor = ({
  initialCode = "",
  language = "javascript",
  onCodeChange,
}) => {
  const monaco = useMonaco();
  const [code, setCode] = useState(initialCode);
  const [editorTheme, setEditorTheme] = useState("vs-light");
  const [editorMounted, setEditorMounted] = useState(false);

  /* -------------------------------------------------- */
  /* Sync external code */
  /* -------------------------------------------------- */
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  /* -------------------------------------------------- */
  /* Resolve theme */
  /* -------------------------------------------------- */
  const resolveTheme = useCallback(() => {
    const theme = themeManager.getTheme();
    return theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "vs-dark"
      : "vs-light";
  }, []);

  useEffect(() => {
    setEditorTheme(resolveTheme());
    const handler = (e) => {
      setEditorTheme(e.detail === "dark" ? "vs-dark" : "vs-light");
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, [resolveTheme]);

  /* -------------------------------------------------- */
  /* JS / TS diagnostics */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!monaco) return;
    const compilerOptions = {
      allowJs: true,
      checkJs: true,
      strict: true,
      noEmit: true,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      moduleResolution:
        monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    };
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
      compilerOptions
    );
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
      compilerOptions
    );
  }, [monaco]);

  /* -------------------------------------------------- */
  /* Handle code change */
  /* -------------------------------------------------- */
  const handleCodeChange = useCallback(
    (value) => {
      const next = value ?? "";
      setCode(next);
      onCodeChange?.(next);
    },
    [onCodeChange]
  );

  /* -------------------------------------------------- */
  /* Editor options */
  /* -------------------------------------------------- */
  const editorOptions = useMemo(
    () => ({
      fontSize: 14,
      lineHeight: 20,
      fontFamily: "JetBrains Mono, monospace",
      fontLigatures: false,
      lineNumbers: "on",
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      smoothScrolling: false,
      cursorSmoothCaretAnimation: false,
      cursorBlinking: "blink",
      tabSize: 2,
      disableLayerHinting: true,
      fixedOverflowWidgets: true,
    }),
    []
  );

  /* -------------------------------------------------- */
  /* Editor mount */
  /* -------------------------------------------------- */
  const handleEditorMount = useCallback((editor, monaco) => {
    // force layout after mount
    setTimeout(() => editor.layout(), 50);

    // Command Palette
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
      () => editor.trigger("", "editor.action.quickCommand", null)
    );

    setEditorMounted(true);
  }, []);

  return (
    // Animate wrapper, not Monaco container
    <div className="animate-fadeInUp flex flex-col w-full h-full">
      <div
        className="
          flex-1 w-full h-full
          bg-[var(--panel-color)]
          border border-white/5
          rounded-xl
          relative
        "
      >
        {/** Only mount Monaco after wrapper is in DOM to avoid transform issues */}
        {editorMounted !== false && (
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={editorTheme}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            options={editorOptions}
          />
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
