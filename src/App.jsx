import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useMemo } from "react";
import { appList } from "./utils/Constants";
import AppBarIcon from "./components/AppBarIcon";
import Loader from "./utils/Loader";
import AppHeader from "./components/AppHeader";

import { themeManager } from "./utils/themeManger";
import { useQuote } from "./hooks/useQuote";

/* ----------------------------------
 * Lazy-loaded screens
 * ---------------------------------- */
const Home = lazy(() => import("./components/Home"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Settings = lazy(() => import("./components/Settings"));
const TodoList = lazy(() => import("./components/TodoList"));
const CodeDiffViewer = lazy(() => import("./components/DiffEditor"));
const JsonEditor = lazy(() => import("./components/JsonEditor"));
const JSIDEApp = lazy(() => import("./components/codestash/JSIDEApp"));
const MarkdownEditor = lazy(() => import("./components/MarkdownEditor"));
const MermaidEditor = lazy(() => import("./components/MermaidEditor"));
const GitHubTrending = lazy(() => import("./components/GitHubTrending"));
const SvgEditor = lazy(() => import("./components/svgEditor/SvgEditor"));

/* ----------------------------------
 * Route configuration
 * ---------------------------------- */
const ROUTES = [
	{ path: "/", element: <Home /> },
	{ path: "/dashboard", element: <Dashboard /> },
	{ path: "/tasks", element: <TodoList /> },
	{ path: "/js-ide", element: <JSIDEApp /> },
	{ path: "/diff-editor", element: <CodeDiffViewer /> },
	{ path: "/json", element: <JsonEditor /> },
	{ path: "/markdown", element: <MarkdownEditor /> },
	{ path: "/mermaid-draw", element: <MermaidEditor /> },
	{ path: "/github-trending", element: <GitHubTrending /> },
	{ path: "/svg-editor", element: <SvgEditor /> },
	{ path: "/settings", element: <Settings /> },
];

function App() {
	const { pathname } = useLocation();

	/* ----------------------------------
	 * Side effects
	 * ---------------------------------- */
	useEffect(() => {
		themeManager.init();
	}, []);

	useQuote();

	/* ----------------------------------
	 * Derived data
	 * ---------------------------------- */
	const sidebarApps = useMemo(
		() => appList.filter((app) => app.key),
		[],
	);

	const isHome = pathname === "/";

	return (
		<div className="w-full h-screen bg-(--bg-color) font-inter overflow-hidden">
			<AppHeader />

			<div className="flex h-full pt-[50px]">
				{/* ----------------------------------
				 * Sidebar
				 * ---------------------------------- */}
				<aside
					className="
						fixed bottom-0 left-0 right-0 h-16 w-full
						md:fixed md:right-0 md:top-0 md:h-full md:w-16 md:left-auto
						flex flex-row md:flex-col items-center justify-around md:justify-between
						px-4 md:px-0 pt-0 md:pt-4 gap-4 md:gap-6 pb-0 md:pb-6
						z-40 border-t md:border-t-0 transition-all
					"
					style={{
						background: "var(--header-bg)",
						color: "var(--text-primary)",
						borderColor: "var(--border-color)",
					}}
				>
					{/* Home */}
					<div className="order-2 md:order-1">
						<Link to="/">
							<AppBarIcon
								{...(({ key, ...rest }) => rest)(appList[0])}
								isActive={isHome}
								isVisible={isHome}
							/>
						</Link>
					</div>

					{/* Apps */}
					<div className="flex flex-row md:flex-col items-center gap-4 md:gap-6 order-1 md:order-2">
						{sidebarApps.map(({ key, ...app }) => {
							const appPath = `/${key}`;
							return (
								<Link key={key} to={appPath}>
									<AppBarIcon
										{...app}
										isActive={pathname === appPath}
									/>
								</Link>
							);
						})}
					</div>
				</aside>

				{/* ----------------------------------
				 * Main content
				 * ---------------------------------- */}
				<main className="flex-1 overflow-y-auto pr-16 pb-16 md:pb-0">
					<Suspense fallback={<Loader />}>
						<Routes>
							{ROUTES.map(({ path, element }) => (
								<Route key={path} path={path} element={element} />
							))}
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</Suspense>
				</main>
			</div>
		</div>
	);
}

export default App;
