import React, {
  useRef,
  useState,
  useEffect,
  lazy,
  Suspense,
} from "react";
import DiffMatchPatch from "diff-match-patch";
import { themeManager } from "../utils/themeManger";
import { storage } from "../utils/StorageManager";

const Editor = lazy(() => import("@monaco-editor/react"));

export default function DualEditableDiff() {
  /* -------------------------------------------------- */
  /* Stable instances & refs */
  /* -------------------------------------------------- */

  const dmpRef = useRef(null);
  if (!dmpRef.current) {
    dmpRef.current = new DiffMatchPatch();
  }

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftDecorRef = useRef([]);
  const rightDecorRef = useRef([]);

  const LEFT_KEY = "diff-editor-left";
  const RIGHT_KEY = "diff-editor-right";

  /* -------------------------------------------------- */
  /* State */
  /* -------------------------------------------------- */

  const [leftCode, setLeftCode] = useState(() =>
    storage.get(LEFT_KEY, "// Left editor")
  );
  const [rightCode, setRightCode] = useState(() =>
    storage.get(RIGHT_KEY, "// Right editor")
  );

  const getMonacoTheme = (theme) => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    return resolved === "dark" ? "vs-dark" : "vs-light";
  };

  const [monacoTheme, setMonacoTheme] = useState(() =>
    getMonacoTheme(themeManager.getTheme())
  );

  /* -------------------------------------------------- */
  /* Helpers */
  /* -------------------------------------------------- */

  const editorsReady = () =>
    leftRef.current?.getModel() && rightRef.current?.getModel();

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

  /* -------------------------------------------------- */
  /* Diff logic */
  /* -------------------------------------------------- */

  const updateDiff = (left, right) => {
    if (!editorsReady()) return;

    const leftEditor = leftRef.current;
    const rightEditor = rightRef.current;

    const leftModel = leftEditor.getModel();
    const rightModel = rightEditor.getModel();

    const dmp = dmpRef.current;
    const diffs = dmp.diff_main(left, right);
    dmp.diff_cleanupSemantic(diffs);

    let leftPtr = 0;
    let rightPtr = 0;

    const leftDecors = [];
    const rightDecors = [];

    for (const [type, text] of diffs) {
      const len = text.length;

      if (type === -1) {
        leftDecors.push({
          range: createRange(leftModel, leftPtr, leftPtr + len),
          options: { inlineClassName: "diff-removed-inline" },
        });
      }

      if (type === 1) {
        rightDecors.push({
          range: createRange(rightModel, rightPtr, rightPtr + len),
          options: { inlineClassName: "diff-added-inline" },
        });
      }

      if (type !== 1) leftPtr += len;
      if (type !== -1) rightPtr += len;
    }

    leftDecorRef.current = leftEditor.deltaDecorations(
      leftDecorRef.current,
      leftDecors
    );
    rightDecorRef.current = rightEditor.deltaDecorations(
      rightDecorRef.current,
      rightDecors
    );
  };

  /* -------------------------------------------------- */
  /* Effects */
  /* -------------------------------------------------- */

  // Theme updates
  useEffect(() => {
    const handler = (e) => {
      setMonacoTheme(e.detail === "dark" ? "vs-dark" : "vs-light");
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  // Diff trigger (single source of truth)
  useEffect(() => {
    if (!editorsReady()) return;

    const id = requestAnimationFrame(() => {
      updateDiff(leftCode, rightCode);
    });

    return () => cancelAnimationFrame(id);
  }, [leftCode, rightCode, monacoTheme]);

  /* -------------------------------------------------- */
  /* Editor options (reduces glitches a LOT) */
  /* -------------------------------------------------- */

  const editorOptions = {
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    smoothScrolling: true,
    cursorBlinking: "smooth",
    renderWhitespace: "selection",
    padding: { top: 8 },
  };

  /* -------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------- */

  return (
    <div className="flex flex-col md:grid md:grid-cols-2 h-screen gap-2 p-2 bg-[var(--bg-color)] monaco-root">
      {/* LEFT EDITOR */}
      <Suspense fallback={<div className="h-full">Loading editor…</div>}>
        <Editor
          height="100%"
          language="javascript"
          theme={monacoTheme}
          value={leftCode}
          options={editorOptions}
          onMount={(editor) => {
            leftRef.current = editor;
            setTimeout(() => updateDiff(leftCode, rightCode), 0);
          }}
          onChange={(v) => {
            const val = v ?? "";
            setLeftCode(val);
            storage.set(LEFT_KEY, val);
          }}
        />
      </Suspense>

      {/* RIGHT EDITOR */}
      <Suspense fallback={<div className="h-full">Loading editor…</div>}>
        <Editor
          height="100%"
          language="javascript"
          theme={monacoTheme}
          value={rightCode}
          options={editorOptions}
          onMount={(editor) => {
            rightRef.current = editor;
            setTimeout(() => updateDiff(leftCode, rightCode), 0);
          }}
          onChange={(v) => {
            const val = v ?? "";
            setRightCode(val);
            storage.set(RIGHT_KEY, val);
          }}
        />
      </Suspense>

      {/* Diff styles */}
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
