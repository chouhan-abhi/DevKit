import { useMemo, useState } from "react";
import { Calendar, Plus, Tag, Trash2, CheckCircle2, Circle } from "lucide-react";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";

const CATEGORIES = [
  { key: "General", color: "var(--primary-color)" },
  { key: "Work", color: "var(--accent-blue)" },
  { key: "Personal", color: "var(--accent-green)" },
  { key: "Urgent", color: "var(--accent-red)" },
];

const getCategoryColor = (cat) =>
  CATEGORIES.find((c) => c.key === cat)?.color || "var(--primary-color)";

export default function TodoList() {
  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("General");

  const {
    documents, currentId, title, content, setContent,
    setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
  } = useDocuments({
    appId: "tasks",
    defaultTitle: "Task List",
    initialContent: { tasks: [] },
  });

  const tasks = content?.tasks || [];

  const addTask = () => {
    if (!taskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: taskText,
      category,
      date: new Date().toISOString().slice(0, 10),
      done: false,
    };
    setContent((prev) => ({
      ...(prev || {}),
      tasks: [newTask, ...(prev?.tasks || [])],
    }));
    setTaskText("");
  };

  const toggleTask = (id) => {
    setContent((prev) => ({
      ...(prev || {}),
      tasks: (prev?.tasks || []).map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    }));
  };

  const deleteTask = (id) => {
    setContent((prev) => ({
      ...(prev || {}),
      tasks: (prev?.tasks || []).filter((t) => t.id !== id),
    }));
  };

  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!acc[task.date]) acc[task.date] = [];
      acc[task.date].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.done).length,
  }), [tasks]);

  return (
    <div className="max-w-4xl mx-auto w-full p-3" style={{ color: "var(--text-color)" }}>
      <SubAppToolbar
        documents={documents}
        currentId={currentId}
        currentTitle={title}
        onSelect={setCurrentDocId}
        onRename={renameDoc}
        onNew={() => createDoc("Task List", { tasks: [] })}
        onSaveAs={(name) => saveAs(name)}
        onDelete={() => deleteDoc()}
        status={isSaving ? "saving" : "saved"}
      />

      <div
        className="p-4 mt-3 rounded-xl border flex flex-col sm:flex-row gap-3 sm:items-center"
        style={{
          background: "var(--panel-color)",
          borderColor: "var(--border-color)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-2.5 rounded-lg text-sm transition-all duration-150"
          style={{
            background: "var(--bg-color)",
            border: "1px solid var(--border-color)",
            color: "var(--text-color)",
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: "var(--bg-color)",
            color: "var(--text-color)",
            border: "1px solid var(--border-color)",
          }}
        >
          {CATEGORIES.map(({ key }) => (
            <option key={key}>{key}</option>
          ))}
        </select>

        <button
          onClick={addTask}
          className="px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-white transition-all duration-150 hover:opacity-90"
          style={{ background: "var(--primary-color)" }}
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="flex items-center gap-4 mt-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          <span>{stats.total} total</span>
          <span>{stats.done} completed</span>
          <span>{stats.total - stats.done} remaining</span>
        </div>
      )}

      {/* Task List */}
      <div className="mt-6 space-y-6">
        {Object.keys(tasksByDate).map((date) => (
          <div key={date}>
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              <Calendar size={14} />
              {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </h2>

            <div className="space-y-2">
              {tasksByDate[date].map((task) => {
                const color = getCategoryColor(task.category);
                return (
                  <div
                    key={task.id}
                    className="group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-150"
                    style={{
                      background: "var(--panel-color)",
                      borderColor: "var(--border-color)",
                      borderLeft: `3px solid ${color}`,
                      boxShadow: "var(--shadow-xs)",
                    }}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="shrink-0 transition-colors duration-150"
                      style={{ color: task.done ? "var(--accent-green)" : "var(--text-muted)" }}
                    >
                      {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: task.done ? "var(--text-muted)" : "var(--text-color)",
                          textDecoration: task.done ? "line-through" : "none",
                        }}
                      >
                        {task.text}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Tag size={10} style={{ color }} />
                        <span className="text-[11px] font-medium" style={{ color }}>
                          {task.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-150"
                      style={{ color: "var(--accent-red)" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 size={40} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            No tasks yet. Add one above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
