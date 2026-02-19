import { getToolCards } from "../../app/registry";
import AppCard from "../../shared/components/AppCard";

export default function Dashboard() {
  const tools = getToolCards();

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8">
      <h2
        className="text-xl font-bold mb-1"
        style={{ color: "var(--text-color)" }}
      >
        Dashboard
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Quick access to all tools.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((app) => (
          <AppCard key={app.key} app={app} />
        ))}
      </div>
    </div>
  );
}
