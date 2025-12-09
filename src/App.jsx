import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useMemo, useEffect } from "react";

import { appList } from "./utils/Constants";
import AppBarIcon from "./components/AppBarIcon";
import Loader from "./utils/Loader";

import { themeManager } from "./utils/themeManger";
import AppHeader from "./components/AppHeader";
import { useQuote } from "./hooks/useQuote";

// ✅ Lazy-loaded screens
const Home = lazy(() => import("./components/Home"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Settings = lazy(() => import("./components/Settings"));
const TodoList = lazy(() => import("./components/TodoList"));
const CodeDiffViewer = lazy(() => import("./components/DiffEditor"));
const JsonEditor = lazy(() => import("./components/JsonEditor"));
<<<<<<< Updated upstream
const JSIDEApp = lazy(() => import("./components/codestash/JSIDEApp"));
const MarkdownEditor = lazy(() => import("./components/MarkdownEditor"));
const MermaidEditor = lazy(() => import("./components/MermaidEditor"));
const GitHubTrending = lazy(() => import("./components/GitHubTrending"));
const SvgEditor = lazy(() => import("./components/svgEditor/SvgEditor"));
=======
const MarkdownEditor = lazy(() => import("./components/MarkdownEditor"));
>>>>>>> Stashed changes

function App() {
	const location = useLocation();
	
	// Initialize theme on mount
	useEffect(() => {
		themeManager.init();
	}, []);
	useQuote();

	return (
		<div className="w-full h-screen bg-(--bg-color) font-inter overflow-hidden">
			{/* Top Header - dynamic */}
			<AppHeader />

			<div className="flex h-full pt-[60px]">
				{/* ✅ FIXED SIDEBAR - Responsive: Bottom on small screens, Right on larger screens */}
				<aside
					className="
            fixed bottom-0 left-0 right-0 h-16 w-full
            md:fixed md:right-0 md:top-0 md:h-full md:w-16 md:left-auto
            flex flex-row md:flex-col items-center justify-around md:justify-between 
            px-4 md:px-0 pt-0 md:pt-4 gap-4 md:gap-6 pb-0 md:pb-6 z-40
            transition-all overflow-visible border-t md:border-t-0
          "
					style={{
						background: "var(--header-bg)",
						color: "var(--text-primary)",
						borderColor: "var(--border-color)",
					}}
				>
					<div className="overflow-visible order-2 md:order-1">
						<Link key={appList[0].key} to="/" className="block">
							<AppBarIcon
								label={appList[0].label}
								description={appList[0].description}
								icon={appList[0].icon}
								isActive={location.pathname === "/"}
							/>
						</Link>
					</div>
					<div className="flex flex-row md:flex-col items-center gap-4 md:gap-6 overflow-visible order-1 md:order-2">
						{useMemo(
							() =>
								appList
									.filter((app) => app.key !== "")
									.map((app) => {
										const appPath = `/${app.key}`;
										const isActive = location.pathname === appPath;
										return (
											<Link key={app.key} to={appPath} className="block">
												<AppBarIcon
													label={app.label}
													description={app.description}
													icon={app.icon}
													isActive={isActive}
												/>
											</Link>
										);
									}),
							[location.pathname],
						)}
					</div>
				</aside>

				{/* ✅ MAIN CONTENT */}
				<main className="flex-1 overflow-y-auto pb-16 md:pb-0 md:pl-16">
					<Suspense fallback={<Loader />}>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/dashboard" element={<Dashboard />} />
							<Route path="/tasks" element={<TodoList />} />
							<Route path="/js-ide" element={<JSIDEApp />} />
							<Route path="/diff-editor" element={<CodeDiffViewer />} />
							<Route path="/JSON" element={<JsonEditor />} />
							<Route path="/markdown" element={<MarkdownEditor />} />
<<<<<<< Updated upstream
							<Route path="/mermaid-draw" element={<MermaidEditor />} />
							<Route path="/github-trending" element={<GitHubTrending />} />
							<Route path="/svg-editor" element={<SvgEditor />} />
=======
>>>>>>> Stashed changes
							<Route path="/settings" element={<Settings />} />
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</Suspense>
				</main>
			</div>
		</div>
	);
}

export default App;
