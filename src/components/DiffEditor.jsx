import React, { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import DiffMatchPatch from "diff-match-patch";
import { themeManager } from "../utils/themeManger";
import { storage } from "../utils/StorageManager"; // ✅ Use same storage system

export default function DualEditableDiff() {
  const dmp = new DiffMatchPatch();

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftDecorRef = useRef([]);
  const rightDecorRef = useRef([]);

  // ✅ Define persistent keys
  const LEFT_KEY = "diff-editor-left";
  const RIGHT_KEY = "diff-editor-right";

  // ✅ Load saved or fallback values
  const [leftCode, setLeftCode] = useState(() => storage.get(LEFT_KEY, "// Left editor"));
  const [rightCode, setRightCode] = useState(() => storage.get(RIGHT_KEY, "// Right editor"));

  // ✅ Theme handling
  const getMonacoTheme = (theme) => {
    const resolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    return resolvedTheme === "dark" ? "vs-dark" : "vs-light";
  };

  const [monacoTheme, setMonacoTheme] = useState(() => {
    const currentTheme = themeManager.getTheme();
    return getMonacoTheme(currentTheme);
  });

  // ✅ Create Monaco text range
  const createRange = (model, start, end) => {
    const s = model.getPositionAt(start);
    const e = model.getPositionAt(end);
    return {
      startLineNumber: s.lineNumber,
      startColumn: s.column,
      endLineNumber: e.lineNumber,
      endColumn: e.column,
    };
  };

  /** ✅ Core Diff Function */
  const updateDiff = (left, right) => {
    const leftEditor = leftRef.current;
    const rightEditor = rightRef.current;
    if (!leftEditor || !rightEditor) return;

    const leftModel = leftEditor.getModel();
    const rightModel = rightEditor.getModel();
    if (!leftModel || !rightModel) return;

    const diffs = dmp.diff_main(left, right);
    dmp.diff_cleanupSemantic(diffs);

    let leftPointer = 0;
    let rightPointer = 0;

    const leftDecorations = [];
    const rightDecorations = [];

    diffs.forEach(([type, text]) => {
      const len = text.length;

      // Text removed → highlight in LEFT as red
      if (type === -1) {
        const range = createRange(leftModel, leftPointer, leftPointer + len);
        leftDecorations.push({
          range,
          options: { inlineClassName: "diff-removed-inline" },
        });
      }

      // Text added → highlight in RIGHT as green
      if (type === 1) {
        const range = createRange(rightModel, rightPointer, rightPointer + len);
        rightDecorations.push({
          range,
          options: { inlineClassName: "diff-added-inline" },
        });
      }

      if (type !== 1) leftPointer += len;
      if (type !== -1) rightPointer += len;
    });

    // Apply decorations
    leftDecorRef.current = leftEditor.deltaDecorations(leftDecorRef.current, leftDecorations);
    rightDecorRef.current = rightEditor.deltaDecorations(rightDecorRef.current, rightDecorations);
  };

  // ✅ Update + persist LEFT
  const onLeftChange = (value) => {
    const newVal = value ?? "";
    setLeftCode(newVal);
    storage.set(LEFT_KEY, newVal);
    updateDiff(newVal, rightCode);
  };

  // ✅ Update + persist RIGHT
  const onRightChange = (value) => {
    const newVal = value ?? "";
    setRightCode(newVal);
    storage.set(RIGHT_KEY, newVal);
    updateDiff(leftCode, newVal);
  };

  // ✅ Handle theme changes dynamically
  useEffect(() => {
    const handler = (e) => {
      const theme = e.detail === "dark" ? "vs-dark" : "vs-light";
      setMonacoTheme(theme);
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  // ✅ Run diff when mounted or after restoring saved state
  useEffect(() => {
    const timeout = setTimeout(() => updateDiff(leftCode, rightCode), 200);
    return () => clearTimeout(timeout);
  }, [leftCode, rightCode]);

  return (
    <div className="grid grid-cols-2 h-screen gap-2 p-2 bg-[var(--bg-color)]">
      {/* ✅ LEFT EDITOR */}
      <Editor
        height="100%"
        language="javascript"
        theme={monacoTheme}
        value={leftCode}
        onMount={(editor) => {
          leftRef.current = editor;
        }}
        onChange={onLeftChange}
      />

      {/* ✅ RIGHT EDITOR */}
      <Editor
        height="100%"
        language="javascript"
        theme={monacoTheme}
        value={rightCode}
        onMount={(editor) => {
          rightRef.current = editor;
        }}
        onChange={onRightChange}
      />

      {/* ✅ Diff Highlight Styles */}
      <style>
        {`
          .diff-added-inline {
            background-color: rgba(0, 255, 0, 0.25);
            border-radius: 3px;
          }
          .diff-removed-inline {
            background-color: rgba(255, 0, 0, 0.35);
            border-radius: 3px;
          }
        `}
      </style>
    </div>
  );
}
