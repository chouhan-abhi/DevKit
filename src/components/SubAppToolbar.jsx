import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";

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

  useEffect(() => {
    setEditTitle(currentTitle || "");
  }, [currentTitle, currentId]);

  useEffect(() => {
    const handler = (event) => {
      if (!event.target.closest(".toolbar-doc-select")) {
        setMenuOpen(false);
      }
      if (!event.target.closest(".toolbar-saveas")) {
        setSaveAsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const statusLabel = status === "saving" ? "Autosaving..." : "Saved";

  return (
    <div className="subapp-toolbar">
      <div className="toolbar-center">
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
          >
            <Icons.ChevronDown size={16} />
          </button>
          {menuOpen && (
            <div className="toolbar-dropdown">
              <div className="toolbar-dropdown-search">
                <Icons.Search size={14} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents..."
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
                    className={`toolbar-dropdown-item ${
                      doc.id === currentId ? "active" : ""
                    }`}
                    onClick={() => {
                      onSelect?.(doc.id);
                      setMenuOpen(false);
                    }}
                  >
                    <div className="item-title">{doc.title}</div>
                    <div className="item-meta">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`toolbar-status ${status === "saving" ? "saving" : ""}`}>
          {statusLabel}
        </div>
      </div>

      <div className="toolbar-right">
        <button type="button" className="toolbar-btn" onClick={onNew}>
          <Icons.Plus size={16} />
          New
        </button>

        <div className="toolbar-saveas">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setSaveAsOpen((v) => !v)}
          >
            <Icons.Save size={16} />
            Save As
          </button>
          {saveAsOpen && (
            <div className="toolbar-saveas-popover">
              <input
                type="text"
                value={saveAsTitle}
                onChange={(e) => setSaveAsTitle(e.target.value)}
                placeholder="New document name"
              />
              <button
                type="button"
                className="toolbar-btn primary"
                onClick={() => {
                  if (!saveAsTitle.trim()) return;
                  onSaveAs?.(saveAsTitle.trim());
                  setSaveAsTitle("");
                  setSaveAsOpen(false);
                }}
              >
                Create
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="toolbar-btn danger"
          onClick={onDelete}
        >
          <Icons.Trash2 size={16} />
          Delete
        </button>

        {rightActions ? <div className="toolbar-actions">{rightActions}</div> : null}
      </div>
    </div>
  );
}
