import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, useEffect, useMemo, useState } from "react";
import { tools, getSidebarTools } from "./app/registry";
import Sidebar from "./shared/components/Sidebar";
import Loader from "./shared/components/Loader";
import AppHeader from "./shared/components/AppHeader";
import { ToastProvider } from "./shared/components/ToastProvider";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import { themeManager } from "./shared/services/themeManager";
import { storage } from "./shared/services/StorageManager";

const SIDEBAR_KEY = "sidebar:expanded";

function App() {
	const { pathname } = useLocation();
	const [sidebarExpanded, setSidebarExpanded] = useState(() => storage.get(SIDEBAR_KEY, true));

	useEffect(() => {
		themeManager.init();
	}, []);

	const toggleSidebar = () => {
		const next = !sidebarExpanded;
		setSidebarExpanded(next);
		storage.set(SIDEBAR_KEY, next);
	};

	const sidebarApps = useMemo(() => getSidebarTools(), []);
	const homeTool = useMemo(() => tools.find((t) => t.key === ""), []);

	const isHome = pathname === "/";
	const sidebarWidth = sidebarExpanded ? 240 : 56;

	return (
		<ToastProvider>
			<div
				className="w-full h-screen flex overflow-hidden"
				style={{ background: "var(--bg-color)", fontFamily: "var(--font-family)" }}
			>
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
					style={{ background: "var(--primary-color)", color: "#fff" }}
				>
					Skip to content
				</a>

				<Sidebar
					sidebarApps={sidebarApps}
					homeTool={homeTool}
					pathname={pathname}
					expanded={sidebarExpanded}
					onToggle={toggleSidebar}
				/>

				<main
					id="main-content"
					className="app-main flex-1 min-h-0 overflow-y-auto pb-14 md:pb-0 flex flex-col"
					style={{ "--sidebar-w": `${sidebarWidth}px` }}
					role="main"
				>
					{!isHome && <AppHeader />}

					<div className="flex-1">
						<ErrorBoundary>
							<Suspense fallback={<Loader />}>
								<Routes>
									{tools.map((tool) => (
										<Route
											key={tool.route}
											path={tool.route}
											element={<tool.component />}
										/>
									))}
									<Route path="*" element={<Navigate to="/" replace />} />
								</Routes>
							</Suspense>
						</ErrorBoundary>
					</div>
				</main>
			</div>
		</ToastProvider>
	);
}

export default App;
