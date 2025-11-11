import { appList } from "../utils/Constants";
import AppCard from "../components/AppCard";

export default function Home() {
  return (
    <div
      className="w-full flex flex-col px-4 py-8"
      style={{ color: "var(--text)" }}
    >
      {/* ✅ Branding Header */}
      <div className="mb-10">
        <h1
          className="text-8xl font-extrabold tracking-tight"
          style={{ color: "var(--primary-color)" }}
        >
          DevKit
        </h1>

        <p className="text-gray-500 mt-2 text-sm">
          A collection of powerful developer tools — all in one place
        </p>
      </div>

      {/* ✅ Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl animate-fadeIn">
        {appList
          .filter((app) => app.key !== "")
          .map((app) => (
            <AppCard key={app.key} app={app} />
          ))}
      </div>
    </div>
  );
}
