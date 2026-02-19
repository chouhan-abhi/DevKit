import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Plus, Copy, Trash2 } from "lucide-react";

export default function SubAppToolbar({
  documents = [],
  currentId,
  currentTitle,
  onSelect,
  onRename,
  onNew,
  onSaveAs,
  onDelete,
  status = "saved",
  rightActions,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editTitle, setEditTitle] = useState(currentTitle || "");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsTitle, setSaveAsTitle] = useState("");
  const saveAsInputRef = useRef(null);

  useEffect(() => {
    setEditTitle(currentTitle || "");
  }, [currentTitle, currentId]);

  useEffect(() => {
    const handler = (event) => {
      if (!event.target.closest(".toolbar-doc-combo")) setMenuOpen(false);
      if (!event.target.closest(".toolbar-saveas")) setSaveAsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (saveAsOpen) requestAnimationFrame(() => saveAsInputRef.current?.focus());
  }, [saveAsOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const term = search.trim().toLowerCase();
    return documents.filter((doc) => doc.title.toLowerCase().includes(term));
  }, [documents, search]);

  const commitRename = () => {
    const next = editTitle.trim();
    if (!next || next === currentTitle) return;
    onRename?.(next);
  };

  const handleSaveAs = () => {
    if (!saveAsTitle.trim()) return;
    onSaveAs?.(saveAsTitle.trim());
    setSaveAsTitle("");
    setSaveAsOpen(false);
  };

  const isSaving = status === "saving";

  return (
    <div className="subapp-toolbar">
      <div className="toolbar-doc-section">
        <div className="toolbar-doc-combo">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitRename();
                e.currentTarget.blur();
              }
              if (e.key === "Escape") {
                setEditTitle(currentTitle || "");
                e.currentTarget.blur();
              }
            }}
            placeholder="Untitled document"
          />
          <button
            type="button"
            className="toolbar-btn icon"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Select document"
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
          >
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="toolbar-dropdown" role="listbox" aria-label="Documents">
              <div className="toolbar-dropdown-search">
                <Search size={13} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                />
              </div>
              <div className="toolbar-dropdown-list">
                {filtered.length === 0 && (
                  <div className="toolbar-dropdown-empty">No documents</div>
                )}
                {filtered.map((doc) => (
                  <button
                    type="button"
                    key={doc.id}
                    className={`toolbar-dropdown-item ${doc.id === currentId ? "active" : ""}`}
                    onClick={() => {
                      onSelect?.(doc.id);
                      setMenuOpen(false);
                    }}
                  >
                    <span>{doc.title}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-status-indicator">
          <span className={`toolbar-status-dot ${isSaving ? "saving" : ""}`} />
          <span className="toolbar-status-label">
            {isSaving ? "Saving" : "Saved"}
          </span>
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-doc-actions">
        <button
          type="button"
          className="toolbar-btn compact"
          onClick={onNew}
          data-tooltip="New"
          aria-label="New document"
        >
          <Plus size={15} />
        </button>

        <div className="toolbar-saveas">
          <button
            type="button"
            className="toolbar-btn compact"
            onClick={() => setSaveAsOpen((v) => !v)}
            data-tooltip="Duplicate"
            aria-label="Save as"
          >
            <Copy size={14} />
          </button>
          {saveAsOpen && (
            <div className="toolbar-saveas-popover" onMouseDown={(e) => e.stopPropagation()}>
              <input
                ref={saveAsInputRef}
                type="text"
                value={saveAsTitle}
                onChange={(e) => setSaveAsTitle(e.target.value)}
                placeholder="Document name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveAs();
                  if (e.key === "Escape") {
                    setSaveAsTitle("");
                    setSaveAsOpen(false);
                  }
                }}
              />
              <button
                type="button"
                className="toolbar-btn primary"
                onClick={handleSaveAs}
              >
                Save
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="toolbar-btn compact danger"
          onClick={onDelete}
          data-tooltip="Delete"
          aria-label="Delete document"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {rightActions && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-tool-actions">{rightActions}</div>
        </>
      )}
    </div>
  );
}
