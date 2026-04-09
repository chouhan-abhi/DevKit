/**
 * Document API endpoints for the crawler backend
 * This would be added to your crawler backend worker
 */

// This is the backend code that would be added to your crawler worker
// Add these routes to your routeRequest function in the crawler

export const documentApiRoutes = `
// Document API Routes - Add these to your crawler's routeRequest function

// POST /api/documents - Create a new document
if (path === "/api/documents" && method === "POST") {
  const auth = requireTokenAuthorization(env, request);
  if (!auth.ok) return errorResponse(auth.error, auth.status);
  
  const body = await request.json().catch(() => null);
  if (!body || !body.appId || !body.document) {
    return errorResponse("Missing appId or document in request body", 400);
  }
  
  const documentId = generateDocumentId();
  const document = {
    id: documentId,
    profileId: auth.profileId,
    appId: body.appId,
    ...body.document,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await insertDocument(env.DB, document);
  return jsonResponse({ success: true, document });
}

// GET /api/documents - List documents for an app
if (path === "/api/documents" && method === "GET") {
  const auth = requireTokenAuthorization(env, request);
  if (!auth.ok) return errorResponse(auth.error, auth.status);
  
  const appId = url.searchParams.get("appId");
  if (!appId) {
    return errorResponse("Missing appId query parameter", 400);
  }
  
  const documents = await listDocuments(env.DB, auth.profileId, appId);
  return jsonResponse({ success: true, documents });
}

// GET /api/documents/:id - Get a specific document
if (path.startsWith("/api/documents/") && method === "GET") {
  const auth = requireTokenAuthorization(env, request);
  if (!auth.ok) return errorResponse(auth.error, auth.status);
  
  const documentId = path.split("/")[3];
  if (!documentId) {
    return errorResponse("Missing document ID", 400);
  }
  
  const document = await getDocument(env.DB, documentId, auth.profileId);
  if (!document) {
    return errorResponse("Document not found", 404);
  }
  
  return jsonResponse({ success: true, document });
}

// PUT /api/documents/:id - Update a document
if (path.startsWith("/api/documents/") && method === "PUT") {
  const auth = requireTokenAuthorization(env, request);
  if (!auth.ok) return errorResponse(auth.error, auth.status);
  
  const documentId = path.split("/")[3];
  if (!documentId) {
    return errorResponse("Missing document ID", 400);
  }
  
  const body = await request.json().catch(() => null);
  if (!body) {
    return errorResponse("Missing request body", 400);
  }
  
  const updates = {
    ...body,
    updatedAt: new Date().toISOString(),
  };
  
  const document = await updateDocument(env.DB, documentId, auth.profileId, updates);
  if (!document) {
    return errorResponse("Document not found", 404);
  }
  
  return jsonResponse({ success: true, document });
}

// DELETE /api/documents/:id - Delete a document
if (path.startsWith("/api/documents/") && method === "DELETE") {
  const auth = requireTokenAuthorization(env, request);
  if (!auth.ok) return errorResponse(auth.error, auth.status);
  
  const documentId = path.split("/")[3];
  if (!documentId) {
    return errorResponse("Missing document ID", 400);
  }
  
  const success = await deleteDocument(env.DB, documentId, auth.profileId);
  if (!success) {
    return errorResponse("Document not found", 404);
  }
  
  return jsonResponse({ success: true });
}

// GET /api/health - Health check
if (path === "/api/health" && method === "GET") {
  return jsonResponse({ status: "healthy", timestamp: new Date().toISOString() });
}
`;

// Database functions that would be added to your D1 storage module
export const documentDbFunctions = `
// Document Database Functions - Add these to your D1 storage module

export async function ensureDocumentSchema(db) {
  await db.exec(\`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      app_id TEXT NOT NULL,
      title TEXT,
      content TEXT,
      meta TEXT, -- JSON string for additional metadata
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_documents_profile_app ON documents (profile_id, app_id);
    CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents (updated_at DESC);
  \`);
}

export function generateDocumentId() {
  return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export async function insertDocument(db, document) {
  const stmt = db.prepare(\`
    INSERT INTO documents (id, profile_id, app_id, title, content, meta, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  \`);
  
  return await stmt.bind(
    document.id,
    document.profileId,
    document.appId,
    document.title || null,
    JSON.stringify(document.content || {}),
    JSON.stringify(document.meta || {}),
    document.createdAt,
    document.updatedAt
  ).run();
}

export async function listDocuments(db, profileId, appId) {
  const stmt = db.prepare(\`
    SELECT * FROM documents 
    WHERE profile_id = ? AND app_id = ?
    ORDER BY updated_at DESC
  \`);
  
  const result = await stmt.bind(profileId, appId).all();
  
  return result.results.map(row => ({
    id: row.id,
    profileId: row.profile_id,
    appId: row.app_id,
    title: row.title,
    content: JSON.parse(row.content || '{}'),
    meta: JSON.parse(row.meta || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getDocument(db, documentId, profileId) {
  const stmt = db.prepare(\`
    SELECT * FROM documents 
    WHERE id = ? AND profile_id = ?
  \`);
  
  const result = await stmt.bind(documentId, profileId).first();
  
  if (!result) return null;
  
  return {
    id: result.id,
    profileId: result.profile_id,
    appId: result.app_id,
    title: result.title,
    content: JSON.parse(result.content || '{}'),
    meta: JSON.parse(result.meta || '{}'),
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  };
}

export async function updateDocument(db, documentId, profileId, updates) {
  const existing = await getDocument(db, documentId, profileId);
  if (!existing) return null;
  
  const stmt = db.prepare(\`
    UPDATE documents 
    SET title = ?, content = ?, meta = ?, updated_at = ?
    WHERE id = ? AND profile_id = ?
  \`);
  
  await stmt.bind(
    updates.title !== undefined ? updates.title : existing.title,
    updates.content !== undefined ? JSON.stringify(updates.content) : JSON.stringify(existing.content),
    updates.meta !== undefined ? JSON.stringify(updates.meta) : JSON.stringify(existing.meta),
    updates.updatedAt,
    documentId,
    profileId
  ).run();
  
  return await getDocument(db, documentId, profileId);
}

export async function deleteDocument(db, documentId, profileId) {
  const stmt = db.prepare(\`
    DELETE FROM documents 
    WHERE id = ? AND profile_id = ?
  \`);
  
  const result = await stmt.bind(documentId, profileId).run();
  return result.changes > 0;
}

function requireTokenAuthorization(env, request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  if (!normalizeToken(token)) {
    return { ok: false, status: 401, error: 'Invalid token format' };
  }
  
  const profileId = profileIdFromToken(token);
  return { ok: true, token, profileId };
}
`;