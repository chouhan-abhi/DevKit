import { useEffect, useMemo, useRef, useState } from "react";
import { documentStore } from "../services/DocumentStore";
import { apiService } from "../services/ApiService";
import { analyticsService } from "../services/AnalyticsService";

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
  const [syncStatus, setSyncStatus] = useState("local"); // "local", "syncing", "synced", "error"
  const [lastSyncError, setLastSyncError] = useState(null);

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
    saveTimer.current = setTimeout(async () => {
      try {
        // Always save locally first (local-first approach)
        documentStore.updateDoc(currentId, {
          content,
          updatedAt: new Date().toISOString(),
        });
        
        const updatedDoc = documentStore.getDoc(currentId);
        setLastSavedAt(updatedDoc?.updatedAt || null);
        refreshDocs();
        
        // Try to sync to cloud if enabled
        if (apiService.isSyncEnabled()) {
          setSyncStatus("syncing");
          try {
            if (updatedDoc.cloudId) {
              await apiService.updateDocument(updatedDoc.cloudId, {
                title: updatedDoc.title,
                content: updatedDoc.content,
                meta: updatedDoc.meta,
              });
            } else {
              // Create new document in cloud
              const cloudDoc = await apiService.createDocument(appId, {
                title: updatedDoc.title,
                content: updatedDoc.content,
                meta: updatedDoc.meta,
              });
              if (cloudDoc?.document?.id) {
                // Update local document with cloud ID
                documentStore.updateDoc(currentId, {
                  cloudId: cloudDoc.document.id,
                });
              }
            }
            setSyncStatus("synced");
            setLastSyncError(null);
            
            // Track successful auto-sync
            analyticsService.trackSync('auto_sync', 'success', {
              appId,
              documentId: currentId,
              hasCloudId: !!updatedDoc.cloudId,
            });
          } catch (syncError) {
            console.warn("Cloud sync failed:", syncError);
            setSyncStatus("error");
            setLastSyncError(syncError.message);
            
            // Track sync error
            analyticsService.trackSync('auto_sync', 'error', {
              appId,
              documentId: currentId,
              error: syncError.message,
            });
            // Don't fail the save operation, just log the sync error
          }
        } else {
          setSyncStatus("local");
        }
      } catch (error) {
        console.error("Save failed:", error);
        setLastSyncError(error.message);
        setSyncStatus("error");
      } finally {
        setIsSaving(false);
      }
    }, autosaveDelay);
    return () => clearTimeout(saveTimer.current);
  }, [content, currentId, autosaveDelay, appId]);

  const setCurrentDocId = (id) => {
    documentStore.setCurrentId(appId, id);
    setCurrentId(id);
  };

  const createDoc = async (newTitle = defaultTitle, newContent = initialContent) => {
    // Create locally first
    const doc = documentStore.createDoc(appId, {
      title: newTitle,
      content: newContent,
      meta,
    });
    refreshDocs();
    setCurrentDocId(doc.id);
    
    // Try to sync to cloud if enabled
    if (apiService.isSyncEnabled()) {
      try {
        setSyncStatus("syncing");
        const cloudDoc = await apiService.createDocument(appId, {
          title: newTitle,
          content: newContent,
          meta,
        });
        if (cloudDoc?.document?.id) {
          // Update local document with cloud ID
          documentStore.updateDoc(doc.id, {
            cloudId: cloudDoc.document.id,
          });
          refreshDocs();
        }
        setSyncStatus("synced");
        setLastSyncError(null);
      } catch (syncError) {
        console.warn("Cloud sync failed:", syncError);
        setSyncStatus("error");
        setLastSyncError(syncError.message);
      }
    }
    
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

  const deleteDoc = async (id = currentId) => {
    if (!id) return null;
    
    const docToDelete = documentStore.getDoc(id);
    const removed = documentStore.deleteDoc(id);
    
    // Try to delete from cloud if it exists there
    if (apiService.isSyncEnabled() && docToDelete?.cloudId) {
      try {
        await apiService.deleteDocument(docToDelete.cloudId);
      } catch (syncError) {
        console.warn("Cloud delete failed:", syncError);
        setLastSyncError(syncError.message);
      }
    }
    
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

  // Sync functions
  const syncToCloud = async () => {
    if (!apiService.isSyncEnabled()) {
      throw new Error("Cloud sync is not enabled");
    }
    
    setSyncStatus("syncing");
    try {
      const localDocs = documents.map(doc => ({
        ...doc,
        appId,
      }));
      const result = await apiService.syncToCloud(localDocs);
      
      if (result.success) {
        // Update local documents with cloud IDs
        result.results.forEach(({ local, cloud }) => {
          if (cloud?.document?.id && local.id) {
            documentStore.updateDoc(local.id, {
              cloudId: cloud.document.id,
            });
          }
        });
        refreshDocs();
        setSyncStatus("synced");
        setLastSyncError(null);
      } else {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      setSyncStatus("error");
      setLastSyncError(error.message);
      throw error;
    }
  };

  const syncFromCloud = async () => {
    if (!apiService.isSyncEnabled()) {
      throw new Error("Cloud sync is not enabled");
    }
    
    setSyncStatus("syncing");
    try {
      const result = await apiService.syncFromCloud(appId);
      
      if (result.success) {
        // Merge cloud documents with local ones
        result.documents.forEach(cloudDoc => {
          const existingLocal = documents.find(doc => doc.cloudId === cloudDoc.id);
          if (existingLocal) {
            // Update existing local document
            documentStore.updateDoc(existingLocal.id, {
              title: cloudDoc.title,
              content: cloudDoc.content,
              meta: cloudDoc.meta,
              updatedAt: cloudDoc.updatedAt,
            });
          } else {
            // Create new local document
            documentStore.createDoc(appId, {
              title: cloudDoc.title,
              content: cloudDoc.content,
              meta: cloudDoc.meta,
              cloudId: cloudDoc.id,
              createdAt: cloudDoc.createdAt,
              updatedAt: cloudDoc.updatedAt,
            });
          }
        });
        
        refreshDocs();
        setSyncStatus("synced");
        setLastSyncError(null);
      } else {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      setSyncStatus("error");
      setLastSyncError(error.message);
      throw error;
    }
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
    syncStatus,
    lastSyncError,
    syncToCloud,
    syncFromCloud,
    isCloudSyncEnabled: apiService.isSyncEnabled(),
  };
};
