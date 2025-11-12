import { Link, Routes, Route, Navigate } from "react-router-dom";
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

function App() {
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
				{/* ✅ FIXED SIDEBAR */}
				<aside
					className="
            fixed right-0 top-0 h-full w-16 
            flex flex-col items-center justify-between pt-4 gap-6 pb-6 z-40
            transition-all overflow-visible
          "
					style={{
						background: "var(--header-bg)",
						color: "var(--text-primary)",
					}}
				>
					<div className="overflow-visible">
						<Link key={appList[0].key} to={`/${appList[0].key}`} className="block">
							<AppBarIcon
								label={appList[0].label}
								description={appList[0].description}
								icon={appList[0].icon}
							/>
						</Link>
					</div>
					<div className="flex flex-col items-center gap-6 overflow-visible">
						{useMemo(
							() =>
								appList
									.filter((app) => app.key !== "")
									.map((app) => (
										<Link key={app.key} to={`/${app.key}`} className="block">
											<AppBarIcon
												label={app.label}
												description={app.description}
												icon={app.icon}
											/>
										</Link>
									)),
							[],
						)}
					</div>
				</aside>

				{/* ✅ MAIN CONTENT */}
				<main className="flex-1 overflow-y-auto pl-16">
					<Suspense fallback={<Loader />}>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/dashboard" element={<Dashboard />} />
							<Route path="/tasks" element={<TodoList />} />
							<Route path="/diff-editor" element={<CodeDiffViewer />} />
							<Route path="/JSON" element={<JsonEditor />} />
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
