import { useEffect, useMemo, useRef, useState } from "react";
import { documentStore } from "../services/DocumentStore";

const DEFAULT_DEBOUNCE = 500;

export const useDocuments = ({
  appId,
  defaultTitle = "Untitled",
  initialContent,
  meta = {},
  autosaveDelay = DEFAULT_DEBOUNCE,
}) => {
  const saveTimer = useRef(null);
  const [documents, setDocuments] = useState(() => []);
  const [currentId, setCurrentId] = useState(null);
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(defaultTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const normalizeContent = (docContent) => {
    if (docContent == null) return initialContent;

    const initialIsArray = Array.isArray(initialContent);
    const contentIsArray = Array.isArray(docContent);

    if (typeof docContent === "string") {
      if (
        initialContent &&
        typeof initialContent === "object" &&
        !initialIsArray
      ) {
        const keys = Object.keys(initialContent);
        if (
          keys.length === 1 &&
          typeof initialContent[keys[0]] === "string"
        ) {
          return { [keys[0]]: docContent };
        }
      }
      return initialContent;
    }

    if (contentIsArray) {
      return initialIsArray ? docContent : initialContent;
    }

    if (docContent && typeof docContent === "object") {
      if (initialContent && typeof initialContent === "object" && !initialIsArray) {
        return { ...initialContent, ...docContent };
      }
      return docContent;
    }

    return initialContent;
  };

  const refreshDocs = () => {
    const docs = documentStore.listDocs(appId);
    setDocuments(docs);
    return docs;
  };

  const ensureDefaultDoc = () => {
    let docs = documentStore.listDocs(appId);
    if (!docs.length) {
      const created = documentStore.createDoc(appId, {
        title: defaultTitle,
        content: initialContent,
        meta,
      });
      docs = documentStore.listDocs(appId);
      documentStore.setCurrentId(appId, created.id);
    }
    return docs;
  };

  useEffect(() => {
    documentStore.migrateOnce();
    const docs = ensureDefaultDoc();
    setDocuments(docs);
    const storedCurrent = documentStore.getCurrentId(appId);
    const nextId = storedCurrent || docs[0]?.id || null;
    if (nextId) {
      documentStore.setCurrentId(appId, nextId);
      setCurrentId(nextId);
      const doc = documentStore.getDoc(nextId);
      setContent(normalizeContent(doc?.content));
      setTitle(doc?.title || defaultTitle);
      setLastSavedAt(doc?.updatedAt || null);
    }
  }, [appId]);

  useEffect(() => {
    if (!currentId) return;
    const doc = documentStore.getDoc(currentId);
    if (!doc) return;
    setContent(normalizeContent(doc?.content));
    setTitle(doc.title || defaultTitle);
    setLastSavedAt(doc.updatedAt || null);
  }, [currentId]);

  useEffect(() => {
    if (!currentId) return;
    setIsSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      documentStore.updateDoc(currentId, {
        content,
        updatedAt: new Date().toISOString(),
      });
      setIsSaving(false);
      const updatedDoc = documentStore.getDoc(currentId);
      setLastSavedAt(updatedDoc?.updatedAt || null);
      refreshDocs();
    }, autosaveDelay);
    return () => clearTimeout(saveTimer.current);
  }, [content, currentId, autosaveDelay]);

  const setCurrentDocId = (id) => {
    documentStore.setCurrentId(appId, id);
    setCurrentId(id);
  };

  const createDoc = (newTitle = defaultTitle, newContent = initialContent) => {
    const doc = documentStore.createDoc(appId, {
      title: newTitle,
      content: newContent,
      meta,
    });
    refreshDocs();
    setCurrentDocId(doc.id);
    return doc;
  };

  const saveAs = (newTitle) => {
    const doc = documentStore.createDoc(appId, {
      title: newTitle || defaultTitle,
      content,
      meta,
    });
    refreshDocs();
    setCurrentDocId(doc.id);
    return doc;
  };

  const renameDoc = (newTitle) => {
    if (!currentId) return null;
    const doc = documentStore.renameDoc(currentId, newTitle);
    refreshDocs();
    setTitle(doc?.title || newTitle);
    setLastSavedAt(doc?.updatedAt || null);
    return doc;
  };

  const deleteDoc = (id = currentId) => {
    if (!id) return null;
    const removed = documentStore.deleteDoc(id);
    const docs = refreshDocs();
    const nextId = documentStore.getCurrentId(appId) || docs[0]?.id || null;
    setCurrentId(nextId);
    if (nextId) {
      const nextDoc = documentStore.getDoc(nextId);
      setContent(nextDoc?.content ?? initialContent);
      setTitle(nextDoc?.title || defaultTitle);
      setLastSavedAt(nextDoc?.updatedAt || null);
    } else {
      setContent(initialContent);
      setTitle(defaultTitle);
      setLastSavedAt(null);
    }
    return removed;
  };

  const currentDoc = useMemo(
    () => documents.find((doc) => doc.id === currentId) || null,
    [documents, currentId]
  );

  return {
    documents,
    currentId,
    currentDoc,
    title,
    content,
    setContent,
    setCurrentDocId,
    createDoc,
    saveAs,
    renameDoc,
    deleteDoc,
    isSaving,
    lastSavedAt,
  };
};
