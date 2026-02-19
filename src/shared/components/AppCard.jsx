import { Link } from "react-router-dom";
import * as Lucide from "lucide-react";

export default function AppCard({ app }) {
  const Icon = app.icon ? Lucide[app.icon] : null;

  return (
    <Link
      to={`/${app.key}`}
      className="group flex items-center gap-3 p-3 rounded-lg border transition-colors duration-120"
      style={{
        background: "var(--panel-color)",
        borderColor: "var(--border-color)",
        color: "var(--text-color)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
      }}
    >
      {Icon && (
        <div
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-md"
          style={{
            background: "rgba(0, 82, 204, 0.06)",
            color: "var(--primary-color)",
          }}
        >
          <Icon size={18} strokeWidth={1.8} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h2
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-color)" }}
        >
          {app.label}
        </h2>
        <p
          className="text-xs line-clamp-1 mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {app.description}
        </p>
      </div>
    </Link>
  );
}
