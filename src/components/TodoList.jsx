import { useState, useEffect } from "react";
import { storage } from "../utils/StorageManager";
import { Calendar, Plus, Tag, Trash } from "lucide-react";
import { themeManager } from "../utils/themeManger";

const categoryColors = {
  General: "var(--primary-color)",
  Work: "var(--accent-blue)",
  Personal: "var(--accent-green)",
  Urgent: "var(--accent-red)"
};

export default function TodoList() {
  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("General");
  const [tasks, setTasks] = useState([]);

  // Load tasks
  useEffect(() => {
    setTasks(storage.get("tasks", []));
  }, []);

  // Save tasks
  useEffect(() => {
    storage.set("tasks", tasks);
  }, [tasks]);

  const addTask = () => {
    if (!taskText.trim()) return;

    const newTask = {
      id: Date.now(),
      text: taskText,
      category,
      date: new Date().toISOString().slice(0, 10),
      done: false
    };

    setTasks([newTask, ...tasks]);
    setTaskText("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const tasksByDate = tasks.reduce((acc, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {});

  const categoryList = ["General", "Work", "Personal", "Urgent"];

  return (
    <div
      className="max-w-3xl mx-auto w-full"
      style={{ color: "var(--text)" }}
    >
      <h1
        className="text-3xl font-semibold my-6 flex items-center gap-3"
        style={{ color: "var(--primary-color)" }}
      >
        <Calendar size={28} />
        Task Manager
      </h1>

      {/* INPUT SECTION */}
      <div
        className="
          p-4 rounded-xl shadow-sm border
          flex flex-col sm:flex-row gap-3 sm:items-center
        "
        style={{
          background: "var(--panel)",
          borderColor: "var(--border-color)"
        }}
      >
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="Enter a new task..."
          className="
            flex-1 px-4 py-2 rounded-lg focus:ring-2
          "
          style={{
            background: "var(--bg-color)",
            border: "1px solid var(--border-color)",
            color: "var(--text)",
            focusRingColor: "var(--primary-color)"
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg"
          style={{
            background: "var(--bg-color)",
            color: "var(--text)",
            border: "1px solid var(--border-color)"
          }}
        >
          {categoryList.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>

        <button
          onClick={addTask}
          className="
            px-4 py-2 rounded-lg flex items-center justify-center gap-2
            text-white transition
          "
          style={{
            background: "var(--primary-color)"
          }}
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* TASK LIST */}
      <div className="mt-8 space-y-8">
        {Object.keys(tasksByDate).map((date) => (
          <div key={date}>
            <h2
              className="text-xl font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <Calendar size={20} />
              {date}
            </h2>

            <div className="space-y-3">
              {tasksByDate[date].map((task) => {
                const color = categoryColors[task.category];

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-xl shadow-sm hover:shadow-md transition"
                    style={{
                      background: "var(--panel)",
                      borderLeft: `4px solid ${color}`,
                      borderColor: "var(--border-color)"
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                        className="w-5 h-5"
                      />

                      <div>
                        <p
                          className="text-lg"
                          style={{
                            color: task.done
                              ? "var(--text-dim)"
                              : color,
                            textDecoration: task.done
                              ? "line-through"
                              : "none"
                          }}
                        >
                          {task.text}
                        </p>

                        <div
                          className="flex items-center gap-1 text-sm mt-1"
                          style={{ color }}
                        >
                          <Tag size={14} />
                          {task.category}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-lg transition"
                      style={{
                        color: "var(--danger)",
                        background: "transparent"
                      }}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
