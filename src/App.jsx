import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, useEffect, useMemo } from "react";
import { tools, getSidebarTools } from "./app/registry";
import AppBarIcon from "./shared/components/AppBarIcon";
import Loader from "./shared/components/Loader";
import AppHeader from "./shared/components/AppHeader";
import { ToastProvider } from "./shared/components/ToastProvider";
import ErrorBoundary from "./shared/components/ErrorBoundary";

import { themeManager } from "./shared/services/themeManager";
import { useQuote } from "./shared/hooks/useQuote";

function App() {
	const { pathname } = useLocation();

	useEffect(() => {
		themeManager.init();
	}, []);

	useQuote();

	const sidebarApps = useMemo(() => getSidebarTools(), []);
	const homeTool = useMemo(() => tools.find((t) => t.key === ""), []);

	const isHome = pathname === "/";

	return (
		<ToastProvider>
			<div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg-color)", fontFamily: "var(--font-family)" }}>
				{/* Skip to content link for keyboard users */}
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
					style={{ background: "var(--primary-color)", color: "#fff" }}
				>
					Skip to content
				</a>
				<AppHeader />

				<div className="flex flex-1 min-h-0">
					{/* Sidebar */}
					<aside
						className="
							fixed bottom-0 left-0 right-0 h-14 w-full
							md:fixed md:right-0 md:top-0 md:h-full md:w-[52px] md:left-auto md:bottom-auto
							flex flex-row md:flex-col items-center justify-around md:justify-between
							px-2 md:px-0 pt-0 md:pt-3 gap-2 md:gap-0 pb-0 md:pb-3
							z-40 border-t md:border-t-0 md:border-l
							transition-all
						"
						style={{
							background: "var(--sidebar-bg)",
							borderColor: "var(--border-color)",
						}}
						role="navigation"
						aria-label="Main navigation"
					>
						{homeTool && (
							<div className="order-2 md:order-1 flex items-center">
								<Link to="/" aria-label="Home">
									<AppBarIcon
										label={homeTool.label}
										description={homeTool.description}
										icon={homeTool.icon}
										isActive={isHome}
										isVisible={isHome}
									/>
								</Link>
							</div>
						)}

						<div className="flex flex-row md:flex-col items-center gap-1.5 md:gap-1 order-1 md:order-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden py-1 md:py-0 md:flex-1">
							{sidebarApps.map((tool) => (
								<Link key={tool.key} to={tool.route} aria-label={tool.label}>
									<AppBarIcon
										label={tool.label}
										description={tool.description}
										icon={tool.icon}
										isActive={pathname === tool.route}
									/>
								</Link>
							))}
						</div>
					</aside>

					{/* Main */}
					<main id="main-content" className={`flex-1 min-h-0 overflow-y-auto pr-0 md:pr-[52px] pb-14 md:pb-0 ${isHome ? "" : "pt-12"}`} role="main">
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
					</main>
				</div>
			</div>
		</ToastProvider>
	);
}

export default App;
