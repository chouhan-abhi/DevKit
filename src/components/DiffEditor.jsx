import React, { useEffect, useMemo, useState } from "react";
import CodeMirrorMerge from "react-codemirror-merge";
import { javascript } from "@codemirror/lang-javascript";
import { themeManager } from "../utils/themeManger";
import SubAppToolbar from "./SubAppToolbar";
import { useDocuments } from "../hooks/useDocuments";
import { ArrowLeftRight } from "lucide-react";

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

export default function DualEditableDiff() {
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
    appId: "diff-editor",
    defaultTitle: "Diff Document",
    initialContent: { left: "// Left editor", right: "// Right editor" },
  });

  const leftCode = content?.left ?? "";
  const rightCode = content?.right ?? "";

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

  const extensions = useMemo(() => [javascript({ jsx: true })], []);

  return (
    <div
      className="flex flex-col h-full min-h-0 gap-2 p-2 bg-[var(--bg-color)]"
      style={{ minHeight: "300px" }}
    >
      <SubAppToolbar
        documents={documents}
        currentId={currentId}
        currentTitle={title}
        onSelect={setCurrentDocId}
        onRename={renameDoc}
        onNew={() =>
          createDoc("Diff Document", {
            left: "// Left editor",
            right: "// Right editor",
          })
        }
        onSaveAs={(name) => saveAs(name)}
        onDelete={() => deleteDoc()}
        status={isSaving ? "saving" : "saved"}
        rightActions={
          <button
            type="button"
            className="toolbar-btn"
            onClick={() =>
              setContent((prev) => ({
                left: prev?.right || "",
                right: prev?.left || "",
              }))
            }
          >
            <ArrowLeftRight size={16} />
            Swap
          </button>
        }
      />

      <CodeMirrorMerge
        theme={editorTheme}
        orientation="a-b"
        className="flex-1 min-h-[280px] overflow-auto border rounded-lg"
        style={{ borderColor: "var(--border-color)" }}
      >
        <Original
          value={leftCode}
          extensions={extensions}
          onChange={(value) =>
            setContent((prev) => ({ ...(prev || {}), left: value ?? "" }))
          }
        />
        <Modified
          value={rightCode}
          extensions={extensions}
          onChange={(value) =>
            setContent((prev) => ({ ...(prev || {}), right: value ?? "" }))
          }
        />
      </CodeMirrorMerge>
    </div>
  );
}
