import { useCallback, useMemo, useRef, useState } from "react";
import {
  Plus, GripVertical, Trash2, MoreHorizontal,
  Circle, Clock, Pause, Loader2, CheckCircle2, Tag,
} from "lucide-react";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";

const COLUMNS = [
  { key: "todo",    label: "To Do",     icon: Circle,       color: "var(--text-muted)" },
  { key: "working", label: "In Progress", icon: Loader2,    color: "var(--primary-color)" },
  { key: "onhold",  label: "On Hold",   icon: Pause,        color: "var(--accent-orange)" },
  { key: "done",    label: "Done",      icon: CheckCircle2, color: "var(--accent-green)" },
];

const PRIORITIES = [
  { key: "low",    label: "Low",    color: "var(--accent-green)" },
  { key: "medium", label: "Medium", color: "var(--accent-orange)" },
  { key: "high",   label: "High",   color: "var(--accent-red)" },
];

const COLUMN_KEYS = COLUMNS.map((c) => c.key);

function migrateTask(task) {
  if (task.status && COLUMN_KEYS.includes(task.status)) return task;
  return {
    ...task,
    status: task.done ? "done" : "todo",
    priority: task.priority || "medium",
  };
}

export default function TodoList() {
  const [taskText, setTaskText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [menuTaskId, setMenuTaskId] = useState(null);
  const dragItem = useRef(null);
  const dragOverColumn = useRef(null);

  const {
    documents, currentId, title, content, setContent,
    setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
  } = useDocuments({
    appId: "tasks",
    defaultTitle: "Task Board",
    initialContent: { tasks: [] },
  });

  const tasks = useMemo(
    () => (content?.tasks || []).map(migrateTask),
    [content],
  );

  const setTasks = useCallback((updater) => {
    setContent((prev) => {
      const current = (prev?.tasks || []).map(migrateTask);
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...(prev || {}), tasks: next };
    });
  }, [setContent]);

  const addTask = () => {
    if (!taskText.trim()) return;
    setTasks((prev) => [
      {
        id: Date.now(),
        text: taskText.trim(),
        status: "todo",
        priority,
        category: "General",
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setTaskText("");
  };

  const moveTask = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    setMenuTaskId(null);
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setMenuTaskId(null);
  };

  const changePriority = (taskId, newPriority) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t)),
    );
  };

  const handleDragStart = (taskId) => {
    dragItem.current = taskId;
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    dragOverColumn.current = columnKey;
  };

  const handleDrop = (columnKey) => {
    if (dragItem.current != null) {
      moveTask(dragItem.current, columnKey);
      dragItem.current = null;
      dragOverColumn.current = null;
    }
  };

  const tasksByColumn = useMemo(() => {
    const map = {};
    for (const col of COLUMNS) map[col.key] = [];
    for (const task of tasks) {
      const key = COLUMN_KEYS.includes(task.status) ? task.status : "todo";
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const totalCount = tasks.length;

  return (
    <div
      className="h-full w-full flex flex-col min-h-0"
      style={{ background: "var(--bg-color)" }}
    >
      <div className="px-4 pt-3">
        <SubAppToolbar
          documents={documents}
          currentId={currentId}
          currentTitle={title}
          onSelect={setCurrentDocId}
          onRename={renameDoc}
          onNew={() => createDoc("Task Board", { tasks: [] })}
          onSaveAs={(name) => saveAs(name)}
          onDelete={() => deleteDoc()}
          status={isSaving ? "saving" : "saved"}
        />
      </div>

      {/* Add task bar */}
      <div className="px-4 py-3 flex gap-2 items-center flex-shrink-0">
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="What needs to be done?"
          className="flex-1 px-3 py-2 rounded-md text-sm border"
          style={{
            background: "var(--panel-color)",
            borderColor: "var(--border-color)",
            color: "var(--text-color)",
          }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-2 py-2 rounded-md text-xs border"
          style={{
            background: "var(--panel-color)",
            borderColor: "var(--border-color)",
            color: "var(--text-color)",
          }}
        >
          {PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={addTask}
          className="px-3 py-2 rounded-md flex items-center gap-1.5 text-xs font-medium text-white"
          style={{ background: "var(--primary-color)" }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-x-auto px-4 pb-4">
        <div className="flex gap-3 h-full min-w-[800px]">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              tasks={tasksByColumn[col.key]}
              totalCount={totalCount}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onMove={moveTask}
              onDelete={deleteTask}
              onChangePriority={changePriority}
              menuTaskId={menuTaskId}
              setMenuTaskId={setMenuTaskId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  column, tasks, totalCount,
  onDragStart, onDragOver, onDrop,
  onMove, onDelete, onChangePriority,
  menuTaskId, setMenuTaskId,
}) {
  const Icon = column.icon;

  return (
    <div
      className="flex-1 min-w-[200px] flex flex-col rounded-lg"
      style={{ background: "var(--border-subtle)" }}
      onDragOver={(e) => onDragOver(e, column.key)}
      onDrop={() => onDrop(column.key)}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0">
        <Icon size={14} style={{ color: column.color }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}
        >
          {column.label}
        </span>
        <span
          className="ml-auto text-[11px] font-medium px-1.5 py-0.5 rounded-full"
          style={{
            background: "var(--panel-color)",
            color: "var(--text-muted)",
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            columnKey={column.key}
            onDragStart={onDragStart}
            onMove={onMove}
            onDelete={onDelete}
            onChangePriority={onChangePriority}
            isMenuOpen={menuTaskId === task.id}
            setMenuTaskId={setMenuTaskId}
          />
        ))}

        {tasks.length === 0 && (
          <div
            className="text-center py-8 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task, columnKey, onDragStart, onMove, onDelete, onChangePriority,
  isMenuOpen, setMenuTaskId,
}) {
  const priorityInfo = PRIORITIES.find((p) => p.key === task.priority) || PRIORITIES[1];

  return (
    <div
      className="group rounded-md border p-2.5 cursor-grab active:cursor-grabbing transition-shadow"
      style={{
        background: "var(--panel-color)",
        borderColor: "var(--border-color)",
      }}
      draggable
      onDragStart={() => onDragStart(task.id)}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={14}
          className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-40"
          style={{ color: "var(--text-muted)" }}
        />

        <div className="flex-1 min-w-0">
          <p
            className="text-sm leading-snug"
            style={{
              color: columnKey === "done" ? "var(--text-muted)" : "var(--text-color)",
              textDecoration: columnKey === "done" ? "line-through" : "none",
            }}
          >
            {task.text}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                background: `color-mix(in srgb, ${priorityInfo.color} 10%, transparent)`,
                color: priorityInfo.color,
              }}
            >
              {priorityInfo.label}
            </span>
            {task.category && task.category !== "General" && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                <Tag size={9} />
                {task.category}
              </span>
            )}
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <button
            type="button"
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-muted)" }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuTaskId(isMenuOpen ? null : task.id);
            }}
          >
            <MoreHorizontal size={14} />
          </button>

          {isMenuOpen && (
            <TaskMenu
              task={task}
              currentColumn={columnKey}
              onMove={onMove}
              onDelete={onDelete}
              onChangePriority={onChangePriority}
              onClose={() => setMenuTaskId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TaskMenu({ task, currentColumn, onMove, onDelete, onChangePriority, onClose }) {
  const menuRef = useRef(null);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="absolute right-0 top-full mt-1 z-50 rounded-md border py-1 min-w-[150px]"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-color)",
          boxShadow: "var(--shadow-overlay)",
        }}
      >
        <div
          className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Move to
        </div>
        {COLUMNS.filter((c) => c.key !== currentColumn).map((col) => {
          const Icon = col.icon;
          return (
            <button
              key={col.key}
              type="button"
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-colors"
              style={{ color: "var(--text-color)" }}
              onClick={() => onMove(task.id, col.key)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-subtle)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={12} style={{ color: col.color }} />
              {col.label}
            </button>
          );
        })}

        <div
          className="mx-2 my-1 border-t"
          style={{ borderColor: "var(--border-subtle)" }}
        />

        <div
          className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Priority
        </div>
        {PRIORITIES.map((p) => (
          <button
            key={p.key}
            type="button"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-colors"
            style={{
              color: task.priority === p.key ? p.color : "var(--text-color)",
              fontWeight: task.priority === p.key ? 600 : 400,
            }}
            onClick={() => {
              onChangePriority(task.id, p.key);
              onClose();
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-subtle)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
            {p.label}
          </button>
        ))}

        <div
          className="mx-2 my-1 border-t"
          style={{ borderColor: "var(--border-subtle)" }}
        />

        <button
          type="button"
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-colors"
          style={{ color: "var(--accent-red)" }}
          onClick={() => onDelete(task.id)}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(222, 53, 11, 0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </>
  );
}
