import React, { useRef } from "react";
import { format, isToday, isTomorrow, addDays, subDays } from "date-fns";

export default function ArchiveView({ onSelectDate, highlights = {} }) {
	const scrollContainerRef = useRef(null);

	const getColorForType = (type) => {
		switch (type) {
			case "todo": return "var(--accent-blue)";
			case "list": return "var(--accent-green)";
			case "paragraph": return "var(--accent-orange)";
			default: return "var(--border-color)";
		}
	};

	// Generate days in descending order starting from tomorrow
	const generateDays = () => {
		const days = [];
		const today = new Date();
		const tomorrow = addDays(today, 1);
		
		// Start from tomorrow and go back 365 days
		for (let i = 0; i < 366; i++) {
			const date = subDays(tomorrow, i);
			days.push(date);
		}
		
		return days;
	};

	const days = generateDays();

	const renderDay = (date) => {
		const dayKey = format(date, "yyyy-MM-dd");
		const hasEntry = highlights[dayKey];

		return (
			<div
				key={dayKey}
				className="journal-timeline-day cursor-pointer rounded-lg border-2 transition-all hover:shadow-md"
				style={{ 
					borderColor: hasEntry ? getColorForType(hasEntry) : "var(--border-color)",
					background: "var(--panel-color)",
				}}
				onClick={() => onSelectDate(date)}
			>
				<div className="p-4 text-center">
					{/* Large date number */}
					<div className="text-3xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
						{format(date, "d")}
					</div>
					
					{/* Day, Month, Year */}
					<div className="space-y-1">
						<div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
							{format(date, "EEE")}
						</div>
						<div className="text-xs" style={{ color: "var(--text-muted)" }}>
							{format(date, "MMM")}
						</div>
						<div className="text-xs" style={{ color: "var(--text-muted)" }}>
							{format(date, "yyyy")}
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col h-full" style={{ background: "var(--bg-color)" }}>
			{/* Fixed Header */}
			<div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
				<div>
					<h1 className="text-xl font-semibold" style={{ color: "var(--text-color)" }}>
						Journal Calendar
					</h1>
					<p className="text-sm" style={{ color: "var(--text-secondary)" }}>
						Browse your journal entries by date
					</p>
				</div>
			</div>

			{/* Scrollable Timeline Container */}
			<div 
				ref={scrollContainerRef}
				className="flex-1 overflow-y-auto overflow-x-hidden journal-scroll-container"
			>
				<div className="p-4">
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{days.map(date => renderDay(date))}
					</div>
				</div>
			</div>

			{/* Fixed Footer Legend */}
			<div className="p-4 border-t" style={{ borderColor: "var(--border-color)", background: "var(--panel-color)" }}>
				<div className="flex items-center justify-center gap-6 text-sm">
					<div className="flex items-center gap-2">
						<div className="w-4 h-3 border-2 rounded" style={{ borderColor: "var(--accent-blue)" }}></div>
						<span style={{ color: "var(--text-secondary)" }}>Tasks</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-3 border-2 rounded" style={{ borderColor: "var(--accent-green)" }}></div>
						<span style={{ color: "var(--text-secondary)" }}>Lists</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-3 border-2 rounded" style={{ borderColor: "var(--accent-orange)" }}></div>
						<span style={{ color: "var(--text-secondary)" }}>Notes</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-3 border-2 rounded" style={{ borderColor: "var(--border-color)" }}></div>
						<span style={{ color: "var(--text-secondary)" }}>No Entry</span>
					</div>
				</div>
			</div>
		</div>
	);
}