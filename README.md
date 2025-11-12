# DevKit

A modern, all-in-one developer toolkit built with React and Vite. DevKit provides essential development tools in a single, unified interface with a beautiful, themeable UI.

## 🚀 Features

### 📋 Task Manager
- Create, manage, and organize tasks with categories (General, Work, Personal, Urgent)
- Date-based task grouping for better organization
- Persistent storage using local browser storage
- Mark tasks as complete with visual feedback
- Color-coded categories for quick identification

### 🔀 Code Diff Viewer
- Side-by-side dual editor for comparing code changes
- Real-time diff highlighting (green for additions, red for deletions)
- Powered by Monaco Editor with syntax highlighting
- Supports JavaScript and other languages
- Editable diff view for both left and right panels

### 📄 JSON Editor & Viewer
- Full-featured JSON editor with Monaco Editor
- Real-time JSON validation with error indicators
- Format and minify JSON with one click
- Visual JSON structure viewer
- Syntax highlighting and auto-completion

### ⚙️ Settings & Theme Management
- Light, Dark, and System theme support
- Persistent theme preferences
- Automatic system theme detection
- Seamless theme switching across all components

### 🏠 Dashboard & Navigation
- Clean, intuitive home page with app cards
- Fixed sidebar navigation for quick access
- Lazy-loaded routes for optimal performance
- Responsive design for all screen sizes

## 🛠️ Technical Stack

### Core Technologies
- **React 19** - Modern React with latest features
- **Vite 7** - Fast build tool and dev server
- **React Router DOM 7** - Client-side routing
- **Tailwind CSS 4** - Utility-first CSS framework

### Key Libraries
- **Monaco Editor** - VS Code's editor in the browser
  - `@monaco-editor/react` - React wrapper for Monaco
- **Diff Match Patch** - High-performance diff algorithm
- **React JSON View Lite** - Lightweight JSON viewer
- **TanStack Query** - Powerful data synchronization
- **Lucide React** - Beautiful icon library
- **date-fns** - Date utility functions

### Architecture Highlights
- **Lazy Loading**: All routes are code-split for optimal performance
- **Theme System**: Centralized theme management with event-driven updates
- **Storage Manager**: Abstraction layer for browser localStorage
- **Component-Based**: Modular, reusable React components
- **Type Safety**: TypeScript types for React components

## 📦 Installation

```bash
# Install dependencies
npm install

# Or using bun
bun install
```

## 🏃 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🎨 Theming

DevKit uses a custom theme system that supports:
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes for extended use
- **System Mode**: Automatically follows OS preference

Themes are managed through CSS custom properties and Monaco Editor themes, ensuring consistent styling across all components.

## 💾 Data Persistence

- Tasks are stored in browser localStorage
- Theme preferences are persisted across sessions
- All data remains local to your browser

## 🔧 Configuration

Key configuration can be found in:
- `src/utils/Constants.js` - App routes and navigation
- `src/utils/themeManger.js` - Theme system configuration
- `vite.config.js` - Build and dev server settings

## 📝 Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Create optimized production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## 🌐 Browser Support

Modern browsers with ES6+ support:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is private and proprietary.

---

Built with ❤️ using React + Vite
