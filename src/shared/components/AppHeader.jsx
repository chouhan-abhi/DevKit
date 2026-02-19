import * as Icons from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { tools } from "../../app/registry";
import { ArrowLeft, Home } from "lucide-react";

function AppHeader() {
	const location = useLocation();
	const navigate = useNavigate();

	const currentPath = location.pathname.replace("/", "");
	const currentApp = tools.find((a) => a.key === currentPath);

	if (!currentApp || location.pathname === "/") return null;

	const Icon = Icons[currentApp.icon] || null;

	return (
		<header
			className="fixed top-0 left-0 w-full h-12 px-4 flex items-center gap-3 z-50 backdrop-blur-md border-b"
			style={{
				background: "var(--header-bg)",
				borderColor: "var(--header-border)",
			}}
		>
			<button
				type="button"
				onClick={() => navigate(-1)}
				className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 rounded-lg px-2 py-1 -ml-1"
				style={{ color: "var(--text-secondary)" }}
				onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary-color)"; }}
				onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
				aria-label="Go back"
			>
				<ArrowLeft size={16} />
				<span className="hidden sm:inline">Back</span>
			</button>

			<div className="w-px h-5" style={{ background: "var(--border-color)" }} />

			<div className="flex items-center gap-2.5">
				{Icon && (
					<div
						className="w-7 h-7 flex items-center justify-center rounded-lg"
						style={{
							background: "rgba(99, 102, 241, 0.1)",
						}}
					>
						<Icon size={15} style={{ color: "var(--primary-color)" }} />
					</div>
				)}
				<h1
					className="text-sm font-semibold tracking-wide"
					style={{ color: "var(--text-color)" }}
				>
					{currentApp.label}
				</h1>
			</div>

			<Link
				to="/"
				className="ml-auto flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150"
				style={{
					color: "var(--text-muted)",
					border: "1px solid var(--border-color)",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.color = "var(--primary-color)";
					e.currentTarget.style.borderColor = "var(--primary-color)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.color = "var(--text-muted)";
					e.currentTarget.style.borderColor = "var(--border-color)";
				}}
			>
				<Home size={13} />
				<span className="hidden sm:inline">Home</span>
			</Link>
		</header>
	);
}

export default AppHeader;
