import { Link } from "react-router-dom";
import * as Lucide from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export default function AppCard({ app }) {
  const Icon = app.icon ? Lucide[app.icon] : null;

  return (
    <Link
      to={`/${app.key}`}
      className="
        group relative flex items-center gap-4
        p-4 rounded-xl
        border overflow-hidden
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md
      "
      style={{
        background: "var(--panel-color)",
        borderColor: "var(--border-color)",
        color: "var(--text-color)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, transparent 60%)",
        }}
      />

      {Icon && (
        <div
          className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105"
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            color: "var(--primary-color)",
          }}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>
      )}

      <div className="relative flex-1 min-w-0">
        <h2
          className="text-sm font-semibold tracking-wide truncate"
          style={{ color: "var(--text-color)" }}
        >
          {app.label}
        </h2>
        <p
          className="text-xs leading-relaxed line-clamp-1 mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {app.description}
        </p>
      </div>

      <ArrowUpRight
        size={16}
        className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
        style={{ color: "var(--primary-color)" }}
      />
    </Link>
  );
}
