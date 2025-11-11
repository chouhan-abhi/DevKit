import React, { useEffect, useState } from "react";
import { themeManager } from "../utils/themeManger";

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
                onClick={() => changeTheme(t.key)}
                className={`
    px-5 py-2.5 text-sm font-medium rounded-full transition-all
    ${isActive ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)]" :
                    "bg-[var(--bg-color)] text-[var(--text-color)] border-[var(--border-color)]"}

    hover:text-[var(--primary-color)]
    hover:bg-[var(--primary-color-light)]
  `}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Future Section Placeholder */}
      <div className="opacity-60 text-sm italic">
        More settings coming soon…
      </div>
    </div>
  );
}
