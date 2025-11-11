// utils/themeManager.js
import { storage } from "./StorageManager";

const THEME_KEY = "themePreference";

export const themeManager = {
  getTheme() {
    return storage.get(THEME_KEY, "system"); // system | light | dark
  },

  setTheme(theme) {
    storage.set(THEME_KEY, theme);
    this.applyTheme(theme);
  },

  applyTheme(theme) {
    const root = document.documentElement;

    const finalTheme =
      theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;

    root.setAttribute("data-theme", finalTheme);

    // Trigger Monaco theme update event
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: finalTheme }));
  },

  init() {
    const saved = this.getTheme();
    this.applyTheme(saved);

    // System theme listener
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (this.getTheme() === "system") {
        this.applyTheme("system");
      }
    });
  }
};
