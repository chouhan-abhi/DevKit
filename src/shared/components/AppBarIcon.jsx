import * as Lucide from "lucide-react";

export default function AppBarIcon({ label, icon, isActive = false, size = 18 }) {
	const Icon = icon ? Lucide[icon] : null;

	return (
		<div
			className="w-9 h-9 flex items-center justify-center rounded-lg"
			style={{
				color: isActive ? "var(--primary-color)" : "var(--sidebar-icon-text)",
				background: isActive ? "rgba(0, 82, 204, 0.08)" : "transparent",
			}}
		>
			{Icon ? (
				<Icon size={size} strokeWidth={1.8} />
			) : (
				<span className="text-xs font-semibold">{label?.[0]}</span>
			)}
		</div>
	);
}
