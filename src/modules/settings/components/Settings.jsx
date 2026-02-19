import { useState } from "react";
import { themeManager } from "../../../shared/services/themeManager";
import { Github, ExternalLink, Palette, Monitor, Sun, Moon } from "lucide-react";

const THEMES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
];

export default function Settings() {
  const [theme, setTheme] = useState(themeManager.getTheme());

  const changeTheme = (value) => {
    setTheme(value);
    themeManager.setTheme(value);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 md:px-10 md:py-10">
      <h2
        className="text-2xl font-bold tracking-tight mb-1"
        style={{ color: "var(--text-color)" }}
      >
        Settings
      </h2>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Customize your experience.
      </p>

      {/* Theme */}
      <section
        className="p-5 rounded-xl border mb-6"
        style={{
          background: "var(--panel-color)",
          borderColor: "var(--border-color)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <Palette size={18} style={{ color: "var(--primary-color)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
            Appearance
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const isActive = theme === t.key;
            const ThemeIcon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => changeTheme(t.key)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150"
                style={{
                  background: isActive ? "rgba(99, 102, 241, 0.06)" : "var(--bg-color)",
                  borderColor: isActive ? "var(--primary-color)" : "var(--border-color)",
                  color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
                }}
              >
                <ThemeIcon size={20} />
                <span className="text-xs font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Repository */}
      <section
        className="p-5 rounded-xl border"
        style={{
          background: "var(--panel-color)",
          borderColor: "var(--border-color)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <Github size={18} style={{ color: "var(--text-secondary)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
            Repository
          </h3>
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
          Source code, contributions, and issue tracking.
        </p>
        <a
          href="https://github.com/chouhan-abhi/DevKit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-90 text-white"
          style={{ background: "var(--sidebar-bg)" }}
        >
          <Github size={16} />
          View on GitHub
          <ExternalLink size={13} />
        </a>
      </section>
    </div>
  );
}
