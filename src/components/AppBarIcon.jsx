import * as Lucide from "lucide-react";

export default function AppBarIcon({ label, description, icon }) {
	const Icon = icon ? Lucide[icon] : null;

	return (
		<div className="relative group">
			{/* ICON WRAPPER */}
			<div
				className="
          w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer
          transition-all duration-200
          hover:scale-105
        "
				style={{
					background: "var(--sidebar-icon-bg)",
					color: "var(--sidebar-icon-text)",
				}}
			>
				{Icon ? (
					<Icon size={20} strokeWidth={1.8} />
				) : (
					<span className="text-sm font-medium">{label[0]}</span>
				)}
			</div>

			<div
				className="
          opacity-0 pointer-events-none group-hover:opacity-100 
          group-hover:pointer-events-auto
          absolute right-12 top-1/2 -translate-y-1/2
          p-4 rounded-xl shadow-xl min-w-[160px] transition duration-200
          z-[60]
        "
				style={{
					background: "var(--bg-color)",
					color: "var(--text-color)",
					border: "1px solid var(--border-color)",
				}}
			>
				<p className="font-semibold" style={{ color: "var(--text-color)" }}>
					<b>{label}</b>
				</p>

				<p className="text-sm mt-1" style={{ color: "var(--text-color)", opacity: 0.65 }}>
					{description}
				</p>
			</div>
		</div>
	);
}
