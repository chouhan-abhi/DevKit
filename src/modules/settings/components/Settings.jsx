import { useMemo, useState } from "react";
import { themeManager } from "../../../shared/services/themeManager";
import { documentStore } from "../../../shared/services/DocumentStore";
import { tools } from "../../../app/registry";
import {
  Github, ExternalLink, Palette, Sun, Moon, Monitor, Snowflake,
  Database, FileText, HardDrive, BarChart3, Trash2,
} from "lucide-react";
import * as Lucide from "lucide-react";

const THEMES = [
  { key: "light", label: "Light", icon: Sun, desc: "Clean & bright" },
  { key: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
  { key: "saint", label: "Nord", icon: Snowflake, desc: "Cool blue tones" },
  { key: "system", label: "System", icon: Monitor, desc: "Match your OS" },
];

const toolsByAppId = Object.fromEntries(tools.map((t) => [t.id, t]));

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Settings() {
  const [theme, setTheme] = useState(themeManager.getTheme());
  const [statsKey, setStatsKey] = useState(0);

  const stats = useMemo(() => documentStore.getStats(), [statsKey]);

  const changeTheme = (value) => {
    setTheme(value);
    themeManager.setTheme(value);
  };

  const appBreakdown = useMemo(() => {
    return Object.entries(stats.byApp)
      .map(([appId, count]) => {
        const tool = toolsByAppId[appId];
        return { appId, count, tool };
      })
      .filter((e) => e.tool)
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 md:px-10 md:py-10">
      <h2
        className="text-lg font-semibold mb-1"
        style={{ color: "var(--text-color)" }}
      >
        Settings
      </h2>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Customize your experience and view workspace stats.
      </p>

      {/* Appearance */}
      <Section icon={Palette} title="Appearance">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEMES.map((t) => {
            const isActive = theme === t.key;
            const ThemeIcon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => changeTheme(t.key)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors"
                style={{
                  background: isActive ? "rgba(0, 82, 204, 0.06)" : "transparent",
                  borderColor: isActive ? "var(--primary-color)" : "var(--border-color)",
                  color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
                }}
              >
                <ThemeIcon size={18} />
                <span className="text-xs font-medium">{t.label}</span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t.desc}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Workspace Stats */}
      <Section icon={BarChart3} title="Workspace">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard
            icon={FileText}
            label="Documents"
            value={stats.totalDocs}
          />
          <StatCard
            icon={Database}
            label="Tools used"
            value={stats.appCount}
          />
          <StatCard
            icon={HardDrive}
            label="Storage"
            value={formatBytes(stats.storageBytes)}
          />
        </div>

        {appBreakdown.length > 0 && (
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div
              className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                color: "var(--text-muted)",
                background: "var(--border-subtle)",
              }}
            >
              Documents per tool
            </div>
            {appBreakdown.map(({ appId, count, tool }) => {
              const Icon = tool.icon ? Lucide[tool.icon] : null;
              return (
                <div
                  key={appId}
                  className="flex items-center gap-3 px-3 py-2 border-t"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <span
                    className="w-6 h-6 flex items-center justify-center rounded"
                    style={{
                      color: "var(--primary-color)",
                      background: "rgba(0, 82, 204, 0.06)",
                    }}
                  >
                    {Icon && <Icon size={13} />}
                  </span>
                  <span
                    className="flex-1 text-sm"
                    style={{ color: "var(--text-color)" }}
                  >
                    {tool.label}
                  </span>
                  <span
                    className="text-xs font-medium tabular-nums"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Danger zone */}
      <Section icon={Trash2} title="Data" borderColor="var(--accent-red)">
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Clear all saved documents and reset the workspace. This cannot be undone.
        </p>
        <button
          type="button"
          className="text-xs font-medium px-3 py-1.5 rounded-md border transition-colors"
          style={{
            color: "var(--accent-red)",
            borderColor: "var(--accent-red)",
            background: "transparent",
          }}
          onClick={() => {
            if (window.confirm("Delete all documents? This cannot be undone.")) {
              const allDocs = documentStore.listAllRecentDocs(999);
              allDocs.forEach((doc) => documentStore.deleteDoc(doc.id));
              setStatsKey((k) => k + 1);
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-red)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--accent-red)";
          }}
        >
          Clear all documents
        </button>
      </Section>

      {/* Repository */}
      <Section icon={Github} title="Repository">
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Source code, contributions, and issue tracking.
        </p>
        <a
          href="https://github.com/chouhan-abhi/DevKit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
          style={{
            color: "var(--text-color)",
            borderColor: "var(--border-color)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--primary-color)";
            e.currentTarget.style.color = "var(--primary-color)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.color = "var(--text-color)";
          }}
        >
          <Github size={14} />
          View on GitHub
          <ExternalLink size={12} />
        </a>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children, borderColor }) {
  return (
    <section
      className="mb-6 rounded-lg border p-4"
      style={{
        background: "var(--panel-color)",
        borderColor: borderColor || "var(--border-color)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color: borderColor || "var(--text-muted)" }} />
        <h3
          className="text-sm font-medium"
          style={{ color: "var(--text-color)" }}
        >
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div
      className="flex flex-col items-center gap-1 p-3 rounded-lg"
      style={{ background: "var(--bg-color)" }}
    >
      <Icon size={16} style={{ color: "var(--text-muted)" }} />
      <span
        className="text-lg font-semibold tabular-nums"
        style={{ color: "var(--text-color)" }}
      >
        {value}
      </span>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}
