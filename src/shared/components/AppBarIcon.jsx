import * as Lucide from "lucide-react";

export default function AppBarIcon({ label, description, icon, isActive = false, isVisible = true }) {
	const Icon = icon ? Lucide[icon] : null;

	if (isVisible === false) return null;

	return (
		<div className="relative group">
			<div
				className="
					w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer
					transition-all duration-150
				"
				style={{
					background: isActive ? "var(--primary-color)" : "var(--sidebar-icon-bg)",
					color: isActive ? "#ffffff" : "var(--sidebar-icon-text)",
					boxShadow: isActive ? "0 2px 8px rgba(99, 102, 241, 0.35)" : "none",
				}}
			>
				{Icon ? (
					<Icon size={18} strokeWidth={1.8} />
				) : (
					<span className="text-xs font-semibold">{label?.[0]}</span>
				)}
			</div>

			{/* Tooltip */}
			<div
				className="
					opacity-0 pointer-events-none group-hover:opacity-100
					group-hover:pointer-events-auto
					absolute
					bottom-full left-1/2 -translate-x-1/2 mb-2
					md:bottom-auto md:left-auto md:right-full md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:mb-0 md:mr-3
					py-2.5 px-3.5 rounded-xl min-w-[140px] transition-all duration-150
					z-[60]
				"
				style={{
					background: "var(--bg-elevated)",
					color: "var(--text-color)",
					border: "1px solid var(--border-color)",
					boxShadow: "var(--shadow-lg)",
				}}
			>
				<p className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
					{label}
				</p>
				{description && (
					<p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
						{description}
					</p>
				)}
			</div>
		</div>
	);
}
