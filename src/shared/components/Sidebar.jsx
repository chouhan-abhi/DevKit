import { Link } from "react-router-dom";
import * as Lucide from "lucide-react";
import { PanelLeftClose, PanelLeft, PocketKnife } from "lucide-react";
import { useMemo } from "react";
import RecentDocuments from "./RecentDocuments";
import { CATEGORY_LABELS } from "../../app/registry";

const CATEGORY_ORDER = ["productivity", "editor", "explore"];

function groupByCategory(apps) {
	const groups = new Map();
	for (const tool of apps) {
		const cat = tool.category || "other";
		if (!groups.has(cat)) groups.set(cat, []);
		groups.get(cat).push(tool);
	}

	const ordered = [];
	for (const cat of CATEGORY_ORDER) {
		if (groups.has(cat)) {
			ordered.push([cat, groups.get(cat)]);
			groups.delete(cat);
		}
	}
	for (const [cat, items] of groups) {
		ordered.push([cat, items]);
	}
	return ordered;
}

export default function Sidebar({ sidebarApps, homeTool, pathname, expanded, onToggle }) {
	const isHome = pathname === "/";

	const settingsTool = useMemo(
		() => sidebarApps.find((t) => t.key === "settings"),
		[sidebarApps],
	);
	const navApps = useMemo(
		() => sidebarApps.filter((t) => t.key !== "settings"),
		[sidebarApps],
	);
	const groupedApps = useMemo(() => groupByCategory(navApps), [navApps]);

	return (
		<>
			<aside
				className={`sidebar ${expanded ? "sidebar--expanded" : "sidebar--collapsed"} hidden md:flex`}
				aria-label="Main navigation"
			>
				<div
					className="flex items-center gap-3 px-3 h-12 flex-shrink-0 border-b"
					style={{ borderColor: "var(--border-color)" }}
				>
					{expanded ? (
						<>
							<Link
								to="/"
								className="flex items-center gap-2.5 flex-1 min-w-0 no-underline"
								style={{ color: "var(--text-color)" }}
							>
								<PocketKnife size={20} style={{ color: "var(--primary-color)" }} />
								<span className="text-sm font-semibold tracking-wide truncate">
									DevKit
								</span>
							</Link>
							<button
								type="button"
								className="sidebar-toggle"
								onClick={onToggle}
								aria-label="Collapse sidebar"
							>
								<PanelLeftClose size={18} />
							</button>
						</>
					) : (
						<button
							type="button"
							className="sidebar-toggle mx-auto"
							onClick={onToggle}
							aria-label="Expand sidebar"
						>
							<PanelLeft size={18} />
						</button>
					)}
				</div>

				<nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
					{homeTool && (
						<Link
							to="/"
							className={`sidebar-nav-item ${isHome ? "sidebar-nav-item--active" : ""}`}
							title={expanded ? undefined : homeTool.label}
						>
							<SidebarIcon iconName={homeTool.icon} isActive={isHome} />
							{expanded && <span className="truncate">Home</span>}
						</Link>
					)}

					{groupedApps.map(([category, categoryTools]) => (
						<div key={category}>
							{expanded && (
								<div className="sidebar-section-label">
									{CATEGORY_LABELS[category] || category}
								</div>
							)}
							{categoryTools.map((tool) => {
								const active = pathname === tool.route;
								return (
									<Link
										key={tool.key}
										to={tool.route}
										className={`sidebar-nav-item ${active ? "sidebar-nav-item--active" : ""}`}
										title={expanded ? undefined : tool.label}
									>
										<SidebarIcon iconName={tool.icon} isActive={active} />
										{expanded && <span className="truncate">{tool.label}</span>}
									</Link>
								);
							})}
						</div>
					))}

					<RecentDocuments collapsed={!expanded} />
				</nav>

				{settingsTool && (
					<div
						className="flex-shrink-0 border-t py-2"
						style={{ borderColor: "var(--border-color)" }}
					>
						<Link
							to={settingsTool.route}
							className={`sidebar-nav-item ${pathname === settingsTool.route ? "sidebar-nav-item--active" : ""}`}
							title={expanded ? undefined : settingsTool.label}
						>
							<SidebarIcon iconName="Settings" isActive={pathname === settingsTool.route} />
							{expanded && <span className="truncate">{settingsTool.label}</span>}
						</Link>
					</div>
				)}
			</aside>

			<MobileBottomBar
				sidebarApps={sidebarApps}
				homeTool={homeTool}
				pathname={pathname}
			/>
		</>
	);
}

function SidebarIcon({ iconName, isActive }) {
	const Icon = iconName ? Lucide[iconName] : null;
	if (!Icon) return <span className="sidebar-nav-icon" />;

	return (
		<span
			className="sidebar-nav-icon"
			style={{ color: isActive ? "var(--primary-color)" : "var(--sidebar-icon-text)" }}
		>
			<Icon size={18} strokeWidth={1.8} />
		</span>
	);
}

function MobileBottomBar({ sidebarApps, homeTool, pathname }) {
	const isHome = pathname === "/";

	return (
		<nav
			className="fixed bottom-0 left-0 right-0 h-14 flex md:hidden items-center justify-around border-t z-40"
			style={{
				background: "var(--sidebar-bg)",
				borderColor: "var(--border-color)",
			}}
			aria-label="Mobile navigation"
		>
			{homeTool && (
				<Link to="/" aria-label="Home">
					<MobileNavIcon iconName={homeTool.icon} isActive={isHome} />
				</Link>
			)}
			{sidebarApps
				.filter((t) => t.key !== "settings")
				.slice(0, 5)
				.map((tool) => (
					<Link key={tool.key} to={tool.route} aria-label={tool.label}>
						<MobileNavIcon iconName={tool.icon} isActive={pathname === tool.route} />
					</Link>
				))}
			<Link to="/settings" aria-label="Settings">
				<MobileNavIcon iconName="Settings" isActive={pathname === "/settings"} />
			</Link>
		</nav>
	);
}

function MobileNavIcon({ iconName, isActive }) {
	const Icon = iconName ? Lucide[iconName] : null;
	if (!Icon) return null;

	return (
		<div
			className="w-9 h-9 flex items-center justify-center rounded-lg"
			style={{
				color: isActive ? "var(--primary-color)" : "var(--sidebar-icon-text)",
				background: isActive ? "rgba(0, 82, 204, 0.08)" : "transparent",
			}}
		>
			<Icon size={20} strokeWidth={1.8} />
		</div>
	);
}
