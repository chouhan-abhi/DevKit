export const appList = [
  {
    key: "",
    label: "Devkit Home",
    description: "Devkit Home, Host of all your development needs.",
    icon: "PocketKnife"
  },
  {
    key: "tasks",
    label: "Todo Tasks",
    description: "View overview and manage your tasks",
    icon: "ListChecks" // clean task manager icon
  },
  {
    key: "diff-editor",
    label: "Code Diff Viewer",
    description: "View and compare code changes",
    icon: "GitCompare" // perfect diff/code compare icon
  },
  {
    key: "JSON",
    label: "JSON Viewer",
    description: "View and edit JSON data",
    icon: "Braces" // JSON / code format braces
  },
  {
    key: "settings",
    label: "Settings",
    description: "Configure your preferences",
    icon: "Settings"
  }
];

export const DEFAULT_QUERY_OPTIONS = {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  }
