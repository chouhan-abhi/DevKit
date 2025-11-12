import React, { lazy, useState, useEffect, useRef } from "react";
import { storage } from "../../utils/StorageManager"; // adjust import path as needed

const CodeEditor = lazy(() => import("./CodeEditor"));
const CodeRunner = lazy(() => import("./CodeRunner"));

const JSIDEApp = () => {
  const defaultCode = `// Welcome to JS Playground ✨
console.log("Hello JavaScript!");`;

  // 🔹 State to store code
  const savedCode = storage.get("lastCode", defaultCode);
  const [code, setCode] = useState( savedCode || defaultCode);
  const saveTimeout = useRef(null);

  // 🔹 Persist code whenever it changes (debounced)
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      storage.set("lastCode", code);
    }, 400);
    return () => clearTimeout(saveTimeout.current);
  }, [code]);

  return (
    <div
      className="
        h-[calc(100vh-60px)] w-[calc(96vw-60px)]
        flex flex-row text-[var(--text-color)] overflow-hidden
      "
    >
      <CodeEditor initialCode={code} onCodeChange={setCode} />
      <CodeRunner code={code} />
    </div>
  );
};

export default JSIDEApp;
