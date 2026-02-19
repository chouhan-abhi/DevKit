import { getToolCards } from "../../app/registry";
import AppCard from "../../shared/components/AppCard";
import Quotes from "./Quotes";

export default function Home() {
  const tools = getToolCards();

  return (
    <div className="w-full min-h-full flex flex-col" style={{ color: "var(--text-color)" }}>
      {/* Hero */}
      <div className="px-6 pt-10 pb-6 md:px-10 md:pt-14 md:pb-8">
        <div className="flex items-end gap-3 mb-2">
          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none"
            style={{ color: "var(--primary-color)" }}
          >
            DevKit
          </h1>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full mb-2"
            style={{
              background: "rgba(99, 102, 241, 0.1)",
              color: "var(--primary-color)",
              border: "1px solid rgba(99, 102, 241, 0.15)",
            }}
          >
            v1.0
          </span>
        </div>
        <p
          className="text-base max-w-lg leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          A collection of powerful developer tools — all in one place.
          Write, preview, diff, and build faster.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 px-6 md:px-10 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
          {tools.map((app) => (
            <AppCard key={app.key} app={app} />
          ))}
        </div>
      </div>

      <Quotes />
    </div>
  );
}
