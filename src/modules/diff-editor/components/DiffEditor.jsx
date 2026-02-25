import { useEffect, useMemo, useState } from "react";
import CodeMirrorMerge from "react-codemirror-merge";
import { javascript } from "@codemirror/lang-javascript";
import { themeManager } from "../../../shared/services/themeManager";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";
import { ArrowLeftRight } from "lucide-react";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

export default function DualEditableDiff() {
  const {
    documents, currentId, title, content, setContent,
    setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
  } = useDocuments({
    appId: "diff-editor",
    defaultTitle: "Diff Document",
    initialContent: { left: "// Left editor", right: "// Right editor" },
  });

  const leftCode = content?.left ?? "";
  const rightCode = content?.right ?? "";

  const resolveTheme = (theme) => {
    const resolved = theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;
    return resolved === "dark" ? "dark" : "light";
  };

  const [editorTheme, setEditorTheme] = useState(() =>
    resolveTheme(themeManager.getTheme())
  );

  useEffect(() => {
    const handler = () => setEditorTheme(resolveTheme(themeManager.getTheme()));
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const extensions = useMemo(() => [javascript({ jsx: true })], []);

  const swapSides = () =>
    setContent((prev) => ({ left: prev?.right || "", right: prev?.left || "" }));

  const shortcuts = useMemo(() => ({
    swap: { mod: true, shift: true, key: "x" },
  }), []);

  useKeyboardShortcuts([
    { shortcut: shortcuts.swap, action: swapSides },
  ]);

  return (
    <div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
      <div className="p-3 pb-0">
        <SubAppToolbar
          documents={documents}
          currentId={currentId}
          currentTitle={title}
          onSelect={setCurrentDocId}
          onRename={renameDoc}
          onNew={() =>
            createDoc("Diff Document", { left: "// Left editor", right: "// Right editor" })
          }
          onSaveAs={(name) => saveAs(name)}
          onDelete={() => deleteDoc()}
          status={isSaving ? "saving" : "saved"}
          rightActions={
            <button
              type="button"
              className="toolbar-btn"
              onClick={swapSides}
              data-tooltip={`Swap left/right (${formatShortcut(shortcuts.swap)})`}
            >
              <ArrowLeftRight size={14} />
              Swap
            </button>
          }
        />
      </div>

      <div
        className="flex-1 min-h-0 overflow-hidden border rounded-xl m-3"
        style={{ borderColor: "var(--border-color)" }}
      >
        <CodeMirrorMerge
          theme={editorTheme}
          orientation="a-b"
          className="h-full"
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
    </div>
  );
}
