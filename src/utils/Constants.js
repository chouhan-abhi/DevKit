export const appList = [
  {
    key: "",
    label: "Devkit Home",
    description: "Central dashboard for all your Devkit tools and utilities.",
    icon: "PocketKnife", // versatile toolkit symbol
  },
  {
    key: "tasks",
    label: "Todo Tasks",
    description: "Organize, track, and manage your daily development tasks.",
    icon: "ListChecks", // task manager / checklist
  },
  {
    key: "js-ide",
    label: "JavaScript IDE",
    description: "Write, run, and debug JavaScript code directly in your browser.",
    icon: "Code", // developer / coding symbol
  },
  {
    key: "diff-editor",
    label: "Code Diff Viewer",
    description: "Compare two code versions and visualize differences side by side.",
    icon: "GitCompare", // diff / merge visualization
  },
  {
    key: "JSON",
    label: "JSON Viewer",
    description: "View, format, and edit JSON data with syntax highlighting.",
    icon: "Braces", // structured data / JSON braces
  },
  {
    key: "markdown",
    label: "Markdown Editor",
    description: "Write, preview, and manage your markdown files",
    icon: "FileText"
  },
  {
    key: "mermaid-draw",
    label: "Mermaid Draw",
    description: "Draw, design and preview your Mermaid diagrams",
    icon: "GitBranch"
  },
  {
    key: "github-trending",
    label: "GitHub Trending",
    description: "Explore trending repositories on GitHub. Discover popular projects, filter by language and date, and start your open source journey.",
    icon: "TrendingUp"
  },
  {
    key: "settings",
    label: "Settings",
    description: "Customize your themes, preferences, and development environment.",
    icon: "Settings"
  },
];

export const DEFAULT_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  retry: 1,
  staleTime: 1000 * 60 * 60, // 1 hour
  gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
};
