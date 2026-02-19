import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as Lucide from "lucide-react";
import { Clock, ArrowRight } from "lucide-react";
import { getToolCards, getToolById } from "../../app/registry";
import { documentStore } from "../../shared/services/DocumentStore";
import AppCard from "../../shared/components/AppCard";
import Quotes from "./Quotes";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default function Home() {
  const navigate = useNavigate();
  const toolCards = getToolCards();

  const recentDocs = useMemo(() => {
    return documentStore
      .listAllRecentDocs(6)
      .map((doc) => ({ ...doc, tool: getToolById(doc.appId) }))
      .filter((d) => d.tool);
  }, []);

  const handleDocClick = (doc) => {
    documentStore.setCurrentId(doc.appId, doc.id);
    navigate(doc.tool.route);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-8 md:px-10 md:py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-color)" }}
        >
          Your work
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          Pick up where you left off, or start something new.
        </p>
      </div>

      {/* Recent documents */}
      {recentDocs.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} style={{ color: "var(--text-muted)" }} />
            <h2
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Recent documents
            </h2>
          </div>

          <div
            className="rounded-lg border overflow-hidden"
            style={{
              background: "var(--panel-color)",
              borderColor: "var(--border-color)",
            }}
          >
            {recentDocs.map((doc, i) => {
              const Icon = doc.tool.icon ? Lucide[doc.tool.icon] : null;
              return (
                <button
                  key={doc.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    borderBottom:
                      i < recentDocs.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                  }}
                  onClick={() => handleDocClick(doc)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--border-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md"
                    style={{
                      background: "rgba(0, 82, 204, 0.06)",
                      color: "var(--primary-color)",
                    }}
                  >
                    {Icon && <Icon size={16} strokeWidth={1.8} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-medium block truncate"
                      style={{ color: "var(--text-color)" }}
                    >
                      {doc.title}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {doc.tool.label}
                    </span>
                  </div>

                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {timeAgo(doc.updatedAt)}
                  </span>

                  <ArrowRight
                    size={14}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100"
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Tools grid */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          All tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {toolCards.map((app) => (
            <AppCard key={app.key} app={app} />
          ))}
        </div>
      </section>

      {/* Quote (subtle) */}
      <Quotes />
    </div>
  );
}
