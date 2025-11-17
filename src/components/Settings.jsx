import React, { useEffect, useState } from "react";
import { themeManager } from "../utils/themeManger";
import { Github, ExternalLink } from "lucide-react";

export default function Settings() {
  const [theme, setTheme] = useState(themeManager.getTheme());

  const changeTheme = (value) => {
    setTheme(value);
    themeManager.setTheme(value);
  };

  return (
    <div
      className="max-w-xl mx-12 mt-6 p-8">
      {/* Heading */}
      <h2
        className="text-3xl font-semibold tracking-wide mb-4"
        style={{ color: "var(--primary-color)" }}
      >
        Settings
      </h2>

      {/* Theme Selection Section */}
      <div className="flex align-center items-center gap-4 my-4">
        <p className=" opacity-70 tracking-wide">
          Application Theme
        </p>

        <div className="flex rounded-full border">
          {[
            { key: "light", label: "Light" },
            { key: "dark", label: "Dark" },
            { key: "system", label: "System" },
          ].map((t) => {
            const isActive = theme === t.key;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => changeTheme(t.key)}
                className={`
    px-5 py-2.5 text-sm font-medium rounded-full transition-all
    ${isActive ? "text-white" : ""}
  `}
                style={{
                  background: isActive ? "var(--primary-color)" : "var(--bg-color)",
                  color: isActive ? "white" : "var(--text-color)",
                  border: `1px solid ${isActive ? "var(--primary-color)" : "var(--border-color)"}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--primary-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-color)";
                  }
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Repository Section */}
      <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border-color)" }}>
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-color)" }}
        >
          Repository
        </h3>
        <p
          className="text-sm mb-4 opacity-70"
          style={{ color: "var(--text-color)" }}
        >
          Check out the source code, contribute, or report issues on GitHub.
        </p>
        <a
          href="https://github.com/chouhan-abhi/DevKit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style={{
            background: "var(--sidebar-icon-bg)",
            color: "white",
          }}
        >
          <Github size={18} />
          View on GitHub
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Future Section Placeholder */}
      <div className="mt-6 opacity-60 text-sm italic">
        More settings coming soon…
      </div>
    </div>
  );
}
