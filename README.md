# DevKit

A modern, all-in-one developer toolkit built with React 19 and Vite 7. DevKit provides essential development tools in a single, unified interface with a beautiful, themeable UI — entirely in the browser.

**[Try it live → devkit.dracket.art](https://devkit.dracket.art)**

---

## Features

### Task Manager
- Create, manage, and organize tasks with categories (General, Work, Personal, Urgent)
- Date-based grouping and persistent local storage
- Mark complete with visual feedback and color-coded categories

### Code Diff Viewer
- Side-by-side dual editor powered by CodeMirror Merge
- Real-time diff highlighting (additions, deletions)
- Editable panels with syntax highlighting

### JSON Explorer
- Full-featured JSON editor with CodeMirror
- Real-time validation, format & minify, and tree view via `react-json-view-lite`
- Multi-document support with auto-save

### Markdown Editor
- Split-view editor with live preview using `react-markdown` + GFM
- Save, load, and manage multiple markdown documents
- Import/export from disk

### Mermaid Diagram Editor
- Flowcharts, sequence diagrams, Gantt charts, and more
- Live preview with theme-aware rendering (dark/light)
- Save, load, import, and export `.mmd` files

### SVG Editor
- Create and edit SVG graphics with live visual preview
- Multi-document persistence

### JavaScript Playground
- Write and execute JavaScript directly in the browser
- Code editor with syntax highlighting and instant output

### GitHub Trending
- Discover trending repositories with filters for language, date range, and search
- Stats overview (stars, forks) and saved filter preferences

### Daily Quotes
- Inspirational daily quote from ZenQuotes API on the home page

### Settings & Themes
- Light, Dark, Nord, and System theme modes
- Workspace stats and storage overview
- One-click data management

---

## Architecture

```
src/
├── main.jsx                          # App entry — React root, QueryClient, BrowserRouter
├── App.jsx                           # Shell layout — sidebar, header, routes, providers
├── index.css                         # Global styles, theme variables, component styles
│
├── app/                              # Application-level wiring
│   ├── registry.js                   # Aggregates module manifests, lookup maps, helpers
│   ├── queryConfig.js                # TanStack Query default options
│   ├── ToolRegistryContext.jsx        # React context + useToolRegistry / useCurrentTool hooks
│   └── AppRoutes.jsx                 # Route generation from registry
│
├── modules/                          # Feature modules (each self-contained)
│   ├── home/
│   │   ├── manifest.js               # Module metadata (id, label, icon, route, component)
│   │   ├── Home.jsx                  # Home page — recent docs, tool grid
│   │   └── Quotes.jsx                # Daily quote widget
│   ├── dashboard/
│   │   ├── manifest.js
│   │   └── Dashboard.jsx
│   ├── tasks/
│   │   ├── manifest.js
│   │   └── components/TodoList.jsx
│   ├── js-ide/
│   │   ├── manifest.js
│   │   └── components/
│   │       ├── JSIDEApp.jsx
│   │       ├── CodeEditor.jsx
│   │       └── CodeRunner.jsx
│   ├── diff-editor/
│   │   ├── manifest.js
│   │   └── components/DiffEditor.jsx
│   ├── json-editor/
│   │   ├── manifest.js
│   │   └── components/JsonEditor.jsx
│   ├── markdown/
│   │   ├── manifest.js
│   │   └── components/MarkdownEditor.jsx
│   ├── mermaid/
│   │   ├── manifest.js
│   │   └── components/MermaidEditor.jsx
│   ├── svg-editor/
│   │   ├── manifest.js
│   │   └── components/SvgEditor.jsx
│   ├── github-trending/
│   │   ├── manifest.js
│   │   └── components/GitHubTrending.jsx
│   └── settings/
│       ├── manifest.js
│       └── components/Settings.jsx
│
└── shared/                           # Cross-cutting shared layer
    ├── components/
    │   ├── Sidebar.jsx               # Category-grouped sidebar + mobile bottom bar
    │   ├── AppHeader.jsx             # Breadcrumb header (uses useCurrentTool hook)
    │   ├── SubAppToolbar.jsx         # Document switcher toolbar for editor modules
    │   ├── RecentDocuments.jsx       # Recent docs section in sidebar
    │   ├── AppCard.jsx               # Tool card for home/dashboard grid
    │   ├── AppContainer.jsx          # Common page container
    │   ├── AppBarIcon.jsx            # Reusable icon button
    │   ├── ToastProvider.jsx         # Toast notification context
    │   ├── ErrorBoundary.jsx         # React error boundary
    │   └── Loader.jsx                # Suspense fallback spinner
    ├── services/
    │   ├── StorageManager.js         # Namespaced localStorage abstraction
    │   ├── DocumentStore.js          # Per-module document CRUD and recent docs
    │   └── themeManager.js           # Theme persistence and system-preference sync
    └── hooks/
        ├── useDocuments.js           # Document lifecycle hook for editor modules
        └── useQuote.js               # Daily quote data hook (TanStack Query)
```

### How modules register

Each module declares a `manifest.js` colocated with its code:

```js
// src/modules/tasks/manifest.js
import { lazy } from "react";

export const manifest = {
  id: "tasks",
  key: "tasks",
  label: "Tasks",
  description: "Organize and track your development tasks.",
  icon: "ListChecks",
  route: "/tasks",
  component: lazy(() => import("./components/TodoList")),
  category: "productivity",
};
```

`src/app/registry.js` imports all manifests and exposes O(1) lookup helpers (`getToolByKey`, `getToolById`), sidebar/card filters, and category labels. A `ToolRegistryProvider` context makes the registry available via `useToolRegistry()` and `useCurrentTool()` hooks — no scattered direct imports.

### Key design decisions

| Concern | Approach |
|---|---|
| Routing | Lazy-loaded per module via `React.lazy` + `Suspense` |
| State | Local `useState` for UI; `StorageManager` for persistence; TanStack Query for async |
| Theming | CSS custom properties + `data-theme` attribute; system preference listener |
| Sidebar | Category-grouped (Productivity, Editors, Explore) with collapsed icon mode |
| Documents | `DocumentStore` provides per-module multi-document CRUD with recent-docs aggregation |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19, React Router 7 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4, CSS custom properties |
| Code Editor | CodeMirror 6 (`@uiw/react-codemirror`) |
| Diff | `react-codemirror-merge` |
| Diagrams | Mermaid 11 |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-raw` |
| JSON Viewer | `react-json-view-lite` |
| Data | TanStack Query 5 (with sync-storage persister) |
| Icons | Lucide React |
| Compression | `lz-string` (document storage) |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/chouhan-abhi/DevKit.git
cd DevKit

# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint
bun run lint

# Deploy (builds + surge)
bun run deploy
```

---

## Theming

DevKit supports four theme modes managed through CSS custom properties and a centralized `themeManager`:

| Mode | Description |
|---|---|
| Light | Clean, bright interface |
| Dark | Easy on the eyes for extended use |
| Nord | Cool blue tones |
| System | Automatically follows OS preference |

All components — including CodeMirror editors and Mermaid diagrams — respond to theme changes via a `theme-changed` custom event.

---

## Data Persistence

All data is stored locally in the browser using a namespaced `StorageManager`:

- Documents (markdown, JSON, mermaid, SVG, diff) are persisted per module
- Task lists, filter preferences, and theme settings survive page reloads
- No server, no accounts — your data stays on your machine

---

## Browser Support

Modern browsers with ES2020+ support:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## License

This project is private and proprietary.

---

Built with React + Vite
