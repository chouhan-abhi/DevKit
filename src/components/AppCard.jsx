import { Link } from "react-router-dom";
import * as Lucide from "lucide-react";

export default function AppCard({ app }) {
  const Icon = app.icon ? Lucide[app.icon] : null;

  return (
    <Link
      to={`/${app.key}`}
      className="
        group relative
        p-5 rounded-lg
        border shadow-sm overflow-hidden
        transition-all
        hover:-translate-y-1 hover:shadow-md
        bg-(--panel-color)
        border-(--border-color)
      "
      style={{ color: "var(--text-color)" }}
    >
      {/* ✅ LEFT ACCENT STRIP */}
      <div
        className="
          absolute left-0 top-0 h-full w-1.5
          transition-all duration-300
          group-hover:w-2
        "
        style={{
          background: app.color || "var(--primary-color)"
        }}
      ></div>

      {/* ✅ HOVER COLOR GLOW */}
      <div
        className="
          absolute inset-0 opacity-0 
          group-hover:opacity-10 transition duration-300
        "
        style={{ background: "var(--primary-color)" }}
      ></div>

      {/* ✅ CONTENT */}
      <div className="relative pl-3">
        <div className="flex items-center gap-4 mb-3">

          {/* ✅ ICON */}
          {Icon && (
            <div
              className="
                w-12 h-12 flex items-center justify-center rounded-xl
                transition-all
              "
              style={{
                background: "var(--panel-color)",
                border: "1px solid var(--border-color)",
                color: "var(--text-color)"
              }}
            >
              <Icon size={26} strokeWidth={1.8} />
            </div>
          )}

          {/* ✅ TITLE */}
          <h2
            className="text-xl font-semibold tracking-wide"
            style={{ color: "var(--text-color)" }}
          >
            {app.label}
          </h2>
        </div>

        {/* ✅ DESCRIPTION */}
        <p
          className="text-sm leading-relaxed"
          style={{
            color: "var(--text-color)",
            opacity: 0.65
          }}
        >
          {app.description}
        </p>
      </div>
    </Link>
  );
}
