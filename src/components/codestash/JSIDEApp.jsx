import React, { lazy } from "react";
import SubAppToolbar from "../SubAppToolbar";
import { useDocuments } from "../../hooks/useDocuments";

const CodeEditor = lazy(() => import("./CodeEditor"));
const CodeRunner = lazy(() => import("./CodeRunner"));

const JSIDEApp = () => {
  const defaultCode = `// Welcome to JS Playground ✨
console.log("Hello JavaScript!");`;

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
    appId: "js-ide",
    defaultTitle: "Untitled JS",
    initialContent: { code: defaultCode },
    meta: { language: "javascript" },
  });

  const code = content?.code ?? defaultCode;

  return (
    <div className="h-full w-full min-h-0 flex flex-col text-[var(--text-color)] overflow-hidden">
      <div className="p-3">
        <SubAppToolbar
          documents={documents}
          currentId={currentId}
          currentTitle={title}
          onSelect={setCurrentDocId}
          onRename={renameDoc}
          onNew={() => createDoc("Untitled JS", { code: defaultCode })}
          onSaveAs={(name) => saveAs(name)}
          onDelete={() => deleteDoc()}
          status={isSaving ? "saving" : "saved"}
        />
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
        <CodeEditor
          initialCode={code}
          onCodeChange={(next) => setContent({ code: next })}
        />
        <CodeRunner code={code} />
      </div>
    </div>
  );
};

export default JSIDEApp;
