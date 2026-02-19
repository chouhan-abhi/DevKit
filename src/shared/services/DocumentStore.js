import { storage } from "../services/StorageManager";

const STORE_KEY = "documents:v1";
const MIGRATE_KEY = "documents:v1:migrated";

const createEmptyStore = () => ({
  version: 1,
  docsById: {},
  appIndex: {},
});

const ensureStoreShape = (data) => {
  if (!data || typeof data !== "object") return createEmptyStore();
  return {
    version: data.version || 1,
    docsById: data.docsById || {},
    appIndex: data.appIndex || {},
  };
};

const generateId = () =>
  `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

const getStore = () => ensureStoreShape(storage.get(STORE_KEY, null));

const saveStore = (store) => storage.set(STORE_KEY, store);

const ensureAppIndex = (store, appId) => {
  if (!store.appIndex[appId]) {
    store.appIndex[appId] = { order: [], currentId: null };
  }
  return store.appIndex[appId];
};

const getAppDocs = (store, appId) => {
  const appIndex = ensureAppIndex(store, appId);
  const ordered = appIndex.order
    .map((id) => store.docsById[id])
    .filter(Boolean);
  return ordered;
};

const ensureUniqueTitle = (store, appId, title, excludeId = null) => {
  const existing = new Set(
    getAppDocs(store, appId)
      .filter((doc) => doc.id !== excludeId)
      .map((doc) => doc.title.toLowerCase())
  );

  if (!existing.has(title.toLowerCase())) return title;

  let counter = 2;
  let nextTitle = `${title} (${counter})`;
  while (existing.has(nextTitle.toLowerCase())) {
    counter += 1;
    nextTitle = `${title} (${counter})`;
  }
  return nextTitle;
};

const createDocInternal = (
  store,
  appId,
  { title, content, meta, createdAt, updatedAt, id }
) => {
  const docId = id || generateId();
  const safeTitle = ensureUniqueTitle(store, appId, title || "Untitled", null);
  const created = createdAt || nowIso();
  const updated = updatedAt || created;

  store.docsById[docId] = {
    id: docId,
    appId,
    title: safeTitle,
    content,
    meta: meta || {},
    createdAt: created,
    updatedAt: updated,
  };

  const appIndex = ensureAppIndex(store, appId);
  appIndex.order = [docId, ...appIndex.order.filter((d) => d !== docId)];
  appIndex.currentId = docId;

  return store.docsById[docId];
};

const migrateOnce = () => {
  if (storage.get(MIGRATE_KEY, false)) return;

  const store = getStore();
  const idMaps = {};

  const importFiles = (appId, files, currentFileId, mapContent) => {
    if (!Array.isArray(files) || files.length === 0) return;
    idMaps[appId] = idMaps[appId] || {};
    files.forEach((file) => {
      const doc = createDocInternal(store, appId, {
        title: file.name || "Untitled",
        content: mapContent(file.content),
        createdAt: file.createdAt || nowIso(),
        updatedAt: file.updatedAt || nowIso(),
      });
      idMaps[appId][file.id] = doc.id;
    });
    if (currentFileId && idMaps[appId][currentFileId]) {
      ensureAppIndex(store, appId).currentId = idMaps[appId][currentFileId];
    }
  };

  const importCurrentIfNeeded = (appId, currentContent, title, mapContent) => {
    if (!currentContent) return;
    const appIndex = ensureAppIndex(store, appId);
    const hasDoc = appIndex.order.some((id) => store.docsById[id]);
    const alreadyHas = getAppDocs(store, appId).some(
      (doc) => JSON.stringify(doc.content) === JSON.stringify(mapContent(currentContent))
    );
    if (!hasDoc || !alreadyHas) {
      createDocInternal(store, appId, {
        title,
        content: mapContent(currentContent),
      });
    }
  };

  importFiles(
    "markdown",
    storage.get("markdown:files", []),
    storage.get("markdown:currentFileId", null),
    (content) => ({ markdown: content || "" })
  );
  importCurrentIfNeeded(
    "markdown",
    storage.get("markdown:current", ""),
    "Untitled Markdown",
    (content) => ({ markdown: content || "" })
  );

  importFiles(
    "mermaid-draw",
    storage.get("mermaid:files", []),
    storage.get("mermaid:currentFileId", null),
    (content) => ({ mermaid: content || "" })
  );
  importCurrentIfNeeded(
    "mermaid-draw",
    storage.get("mermaid:current", ""),
    "Untitled Mermaid",
    (content) => ({ mermaid: content || "" })
  );

  importFiles(
    "svg-editor",
    storage.get("svg:files", []),
    storage.get("svg:currentFileId", null),
    (content) => ({ svg: content || "" })
  );
  importCurrentIfNeeded(
    "svg-editor",
    storage.get("svg:current", ""),
    "Untitled SVG",
    (content) => ({ svg: content || "" })
  );

  const jsonText = storage.get("json-editor-content", null);
  if (jsonText) {
    createDocInternal(store, "json", {
      title: "JSON Document",
      content: { jsonText },
    });
  }

  const left = storage.get("diff-editor-left", null);
  const right = storage.get("diff-editor-right", null);
  if (left || right) {
    createDocInternal(store, "diff-editor", {
      title: "Diff Document",
      content: {
        left: left || "",
        right: right || "",
      },
    });
  }

  const lastCode = storage.get("lastCode", null);
  if (lastCode) {
    createDocInternal(store, "js-ide", {
      title: "Untitled JS",
      content: { code: lastCode },
    });
  }

  const tasks = storage.get("tasks", null);
  if (tasks && Array.isArray(tasks)) {
    createDocInternal(store, "tasks", {
      title: "Task List",
      content: { tasks },
    });
  }

  saveStore(store);
  storage.set(MIGRATE_KEY, true);
};

export const documentStore = {
  migrateOnce,
  getStats() {
    const store = getStore();
    const allDocs = Object.values(store.docsById);
    const byApp = {};
    for (const doc of allDocs) {
      byApp[doc.appId] = (byApp[doc.appId] || 0) + 1;
    }
    const storageBytes = new Blob([JSON.stringify(store)]).size;
    return {
      totalDocs: allDocs.length,
      byApp,
      storageBytes,
      appCount: Object.keys(byApp).length,
    };
  },
  listAllRecentDocs(limit = 10) {
    const store = getStore();
    return Object.values(store.docsById)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit);
  },
  listDocs(appId) {
    const store = getStore();
    return getAppDocs(store, appId);
  },
  getDoc(id) {
    const store = getStore();
    return store.docsById[id] || null;
  },
  getCurrentId(appId) {
    const store = getStore();
    const appIndex = ensureAppIndex(store, appId);
    return appIndex.currentId || null;
  },
  setCurrentId(appId, id) {
    const store = getStore();
    const appIndex = ensureAppIndex(store, appId);
    appIndex.currentId = id;
    saveStore(store);
  },
  createDoc(appId, { title, content, meta }) {
    const store = getStore();
    const doc = createDocInternal(store, appId, { title, content, meta });
    saveStore(store);
    return doc;
  },
  updateDoc(id, updates) {
    const store = getStore();
    const doc = store.docsById[id];
    if (!doc) return null;
    store.docsById[id] = {
      ...doc,
      ...updates,
      updatedAt: updates.updatedAt || nowIso(),
    };
    saveStore(store);
    return store.docsById[id];
  },
  renameDoc(id, title) {
    const store = getStore();
    const doc = store.docsById[id];
    if (!doc) return null;
    const safeTitle = ensureUniqueTitle(store, doc.appId, title, id);
    doc.title = safeTitle;
    doc.updatedAt = nowIso();
    saveStore(store);
    return doc;
  },
  deleteDoc(id) {
    const store = getStore();
    const doc = store.docsById[id];
    if (!doc) return null;
    delete store.docsById[id];
    const appIndex = ensureAppIndex(store, doc.appId);
    appIndex.order = appIndex.order.filter((docId) => docId !== id);
    if (appIndex.currentId === id) {
      appIndex.currentId = appIndex.order[0] || null;
    }
    saveStore(store);
    return doc;
  },
};

