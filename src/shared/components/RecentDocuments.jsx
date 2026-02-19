import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as Lucide from "lucide-react";
import { documentStore } from "../services/DocumentStore";
import { tools } from "../../app/registry";

const toolsByAppId = Object.fromEntries(tools.map((t) => [t.id, t]));

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

export default function RecentDocuments({ collapsed = false, limit = 8 }) {
  const navigate = useNavigate();

  const recentDocs = useMemo(() => {
    const docs = documentStore.listAllRecentDocs(limit);
    return docs.map((doc) => {
      const tool = toolsByAppId[doc.appId];
      return { ...doc, tool };
    }).filter((d) => d.tool);
  }, [limit]);

  if (recentDocs.length === 0) return null;

  if (collapsed) return null;

  return (
    <div>
      <div className="sidebar-section-label">Recent</div>
      {recentDocs.map((doc) => {
        const Icon = doc.tool.icon ? Lucide[doc.tool.icon] : null;
        return (
          <button
            key={doc.id}
            type="button"
            className="sidebar-recent-item"
            onClick={() => {
              documentStore.setCurrentId(doc.appId, doc.id);
              navigate(doc.tool.route);
            }}
            title={`${doc.title} — ${doc.tool.label}`}
          >
            <span className="sidebar-recent-icon">
              {Icon && <Icon size={14} />}
            </span>
            <span className="sidebar-recent-meta">
              <span className="sidebar-recent-title">{doc.title}</span>
              <span className="sidebar-recent-sub">
                {doc.tool.label} · {timeAgo(doc.updatedAt)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
