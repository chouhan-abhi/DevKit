import * as Icons from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { tools } from "../../app/registry";

export default function AppHeader() {
	const { pathname } = useLocation();

	const currentPath = pathname.replace("/", "");
	const currentApp = tools.find((a) => a.key === currentPath);

	if (!currentApp || pathname === "/") return null;

	const Icon = Icons[currentApp.icon] || null;

	return (
		<header
			className="flex items-center gap-2 px-6 py-3 text-sm"
			style={{ color: "var(--text-muted)" }}
		>
			<Link
				to="/"
				className="flex items-center gap-1 hover:underline"
				style={{ color: "var(--text-muted)" }}
			>
				<Home size={14} />
				<span>Home</span>
			</Link>

			<ChevronRight size={14} style={{ color: "var(--text-muted)" }} />

			<div className="flex items-center gap-2" style={{ color: "var(--text-color)" }}>
				{Icon && (
					<div
						className="w-6 h-6 flex items-center justify-center rounded"
						style={{ background: "rgba(0, 82, 204, 0.08)" }}
					>
						<Icon size={14} style={{ color: "var(--primary-color)" }} />
					</div>
				)}
				<span className="font-medium">{currentApp.label}</span>
			</div>
		</header>
	);
}
