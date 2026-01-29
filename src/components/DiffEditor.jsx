import React, { useState, useEffect, useMemo } from "react";
import CodeMirrorMerge from "react-codemirror-merge";
import { javascript } from "@codemirror/lang-javascript";
import { themeManager } from "../utils/themeManger";
import { storage } from "../utils/StorageManager";

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

const LEFT_KEY = "diff-editor-left";
const RIGHT_KEY = "diff-editor-right";

export default function DualEditableDiff() {
  const [leftCode, setLeftCode] = useState(() =>
    storage.get(LEFT_KEY, "// Left editor")
  );
  const [rightCode, setRightCode] = useState(() =>
    storage.get(RIGHT_KEY, "// Right editor")
  );

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
    const handler = () => {
      setEditorTheme(getTheme(themeManager.getTheme()));
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  useEffect(() => {
    storage.set(LEFT_KEY, leftCode);
  }, [leftCode]);

  useEffect(() => {
    storage.set(RIGHT_KEY, rightCode);
  }, [rightCode]);

  const extensions = useMemo(() => [javascript({ jsx: true })], []);

  return (
    <div
      className="flex flex-col h-full min-h-0 gap-2 p-2 bg-[var(--bg-color)]"
      style={{ minHeight: "300px" }}
    >
      <CodeMirrorMerge
        theme={editorTheme}
        orientation="a-b"
        className="flex-1 min-h-[280px] overflow-auto border rounded-lg"
        style={{ borderColor: "var(--border-color)" }}
      >
        <Original
          value={leftCode}
          extensions={extensions}
          onChange={(value) => setLeftCode(value ?? "")}
        />
        <Modified
          value={rightCode}
          extensions={extensions}
          onChange={(value) => setRightCode(value ?? "")}
        />
      </CodeMirrorMerge>
    </div>
  );
}
