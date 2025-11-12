import React, { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import DiffMatchPatch from "diff-match-patch";
import { themeManager } from "../utils/themeManger";

export default function DualEditableDiff() {
  const dmp = new DiffMatchPatch();

  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const leftDecorRef = useRef([]);
  const rightDecorRef = useRef([]);

  const [leftCode, setLeftCode] = useState("// Left editor");
  const [rightCode, setRightCode] = useState("// Right editor");
  
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

      // ✅ Text removed from LEFT → highlight in LEFT as red
      if (type === -1) {
        const range = createRange(leftModel, leftPointer, leftPointer + len);
        leftDecorations.push({
          range,
          options: { inlineClassName: "diff-removed-inline" },
        });
      }

      // ✅ Text added in RIGHT → highlight in RIGHT as green
      if (type === 1) {
        const range = createRange(rightModel, rightPointer, rightPointer + len);
        rightDecorations.push({
          range,
          options: { inlineClassName: "diff-added-inline" },
        });
      }

      // Move pointers depending on diff type
      if (type !== 1) leftPointer += len; // left moves for equal & removed
      if (type !== -1) rightPointer += len; // right moves for equal & added
    });

    // ✅ Apply decorations
    leftDecorRef.current = leftEditor.deltaDecorations(
      leftDecorRef.current,
      leftDecorations
    );

    rightDecorRef.current = rightEditor.deltaDecorations(
      rightDecorRef.current,
      rightDecorations
    );
  };

  // Update LEFT editor + recalc diff
  const onLeftChange = (value) => {
    setLeftCode(value);
    updateDiff(value, rightCode);
  };

  // Update RIGHT editor + recalc diff
  const onRightChange = (value) => {
    setRightCode(value);
    updateDiff(leftCode, value);
  };

  useEffect(() => {
    const handler = (e) => {
      const theme = e.detail === "dark" ? "vs-dark" : "vs-light";
      setMonacoTheme(theme);
    };

    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);


  return (
    <div className="grid grid-cols-2 h-screen gap-2 p-2 bg-(--bg-color)">

      {/* ✅ LEFT EDITOR (shows removed text in red) */}
      <Editor
        height="100%"
        language="javascript"
        theme={monacoTheme}
        value={leftCode}
        onMount={(editor) => {
          leftRef.current = editor;
        }}
        onChange={(v) => onLeftChange(v ?? "")}
      />

      {/* ✅ RIGHT EDITOR (shows added text in green) */}
      <Editor
        height="100%"
        language="javascript"
        theme={monacoTheme}
        value={rightCode}
        onMount={(editor) => {
          rightRef.current = editor;
        }}
        onChange={(v) => onRightChange(v ?? "")}
      />

      {/* ✅ Styles */}
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
