import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { User, Menu } from "lucide-react";

export default function ArchiveView({ onSelectDate, journal }) {
	const [currentDate] = React.useState(new Date());

	const monthStart = startOfMonth(currentDate);
	const monthEnd = endOfMonth(currentDate);
	const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

	// Merge dummy data with actual journal data for calendar highlights
	const highlights = journal?.getHighlights() || {};
	const tasksData = {
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd')]: "todo",
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 10), 'yyyy-MM-dd')]: "todo",
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 14), 'yyyy-MM-dd')]: "todo",
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 2), 'yyyy-MM-dd')]: "list",
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 19), 'yyyy-MM-dd')]: "list",
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 31), 'yyyy-MM-dd')]: "today",
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 5), 'yyyy-MM-dd')]: "paragraph",
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 12), 'yyyy-MM-dd')]: "paragraph",
		[format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 26), 'yyyy-MM-dd')]: "paragraph",
		...highlights
	};

	// Mark today
	tasksData[format(new Date(), 'yyyy-MM-dd')] = "today";

	const getColorForType = (type) => {
		switch (type) {
			case "todo": return "bg-[#506076] text-white"; // secondary
			case "list": return "bg-[#46655e] text-white"; // tertiary
			case "today": return "bg-[#586062] text-white"; // primary
			case "paragraph": return "bg-[#f0a500] text-white"; // custom amber
			default: return "bg-[#ffffff] text-[#2b3437]"; // surface-container-lowest
		}
	};

	return (
		<div className="flex-1 flex flex-col items-center overflow-y-auto bg-[#f8f9fa]">
			<div className="w-full max-w-[400px] p-6 pb-20 flex flex-col gap-8">
				
				{/* Header */}
				<div className="flex justify-between items-center py-4">
					<button className="p-2 text-[#2b3437] hover:bg-[#f1f4f6] rounded-full transition-colors">
						<Menu size={24} strokeWidth={1.5} />
					</button>
					<h1 className="text-sm font-bold tracking-[0.2em] uppercase font-['Manrope'] text-[#2b3437]">Archive</h1>
					<button className="w-8 h-8 rounded-full bg-[#2b3437] text-[#f1f4f6] flex items-center justify-center shadow-sm">
						<User size={16} />
					</button>
				</div>

				{/* Title area */}
				<div className="flex flex-col gap-1 mt-4">
					<span className="text-[10px] tracking-[0.05em] uppercase text-[#abb3b7] font-semibold">Navigation / View</span>
					<div className="flex justify-between items-baseline">
						<h2 className="text-[3.5rem] leading-none font-bold tracking-[-0.02em] font-['Manrope'] text-[#2b3437]">{format(currentDate, "MMMM")}</h2>
						<span className="text-2xl font-light text-[#abb3b7]">{format(currentDate, "yyyy")}</span>
					</div>
				</div>

				{/* Calendar Grid */}
				<div className="flex flex-col mt-4">
					{/* Weekdays */}
					<div className="grid grid-cols-7 gap-[1px] mb-2">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
							<div key={day} className="text-center text-[10px] font-semibold text-[#abb3b7] tracking-widest uppercase py-2">
								{day}
							</div>
						))}
					</div>
					
					{/* Days */}
					<div className="grid grid-cols-7 gap-2">
						{/* Padding for first day */}
						{Array.from({ length: monthStart.getDay() }).map((_, i) => (
							<div key={`pad-${i}`} className="aspect-square" />
						))}
						
						{days.map(day => {
							const dateStr = format(day, 'yyyy-MM-dd');
							const type = tasksData[dateStr] || "none";
							const colorClass = getColorForType(type);
							const isSpecial = type !== "none";

							return (
								<button
									key={day.toString()}
									onClick={() => onSelectDate(day)}
									className={`
										aspect-[4/5] flex items-center justify-center font-['Manrope'] font-medium text-lg
										transition-transform hover:scale-[1.02]
										${colorClass}
										${!isSpecial ? 'hover:bg-[#f1f4f6]' : ''}
									`}
									style={{ borderRadius: '2px' }}
								>
									{format(day, "d")}
								</button>
							);
						})}
					</div>
				</div>

				{/* Legend */}
				<div className="mt-8 pt-8">
					<span className="text-[10px] tracking-[0.05em] uppercase text-[#abb3b7] font-semibold block mb-4">System Legend</span>
					<div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm text-[#2b3437]">
						<div className="flex items-center gap-3">
							<div className="w-3 h-3 bg-[#506076]" /> <span>Task Entries</span>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-3 h-3 bg-[#46655e]" /> <span>Curated Lists</span>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-3 h-3 bg-[#f0a500]" /> <span>Journal Narratives</span>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-3 h-3 bg-[#586062]" /> <span>Today</span>
						</div>
					</div>
				</div>

				{/* Summary Card */}
				<div className="mt-8 bg-[#f1f4f6] p-8 rounded-sm relative overflow-hidden">
					<span className="text-[10px] tracking-[0.05em] uppercase text-[#abb3b7] font-semibold block mb-2">{format(currentDate, "MMMM")} Summary</span>
					<h3 className="text-3xl font-bold font-['Manrope'] text-[#2b3437] mb-6 pb-6 border-b border-[#dfe1e6]/30">18 Log Entries</h3>
					<p className="text-[#586062] leading-relaxed text-sm">
						Your focus this month was predominantly on <strong className="text-[#2b3437] font-semibold">Task Efficiency</strong> and <strong className="text-[#46655e] font-semibold">Curated Reading</strong>.
					</p>
					
					{/* Decorative icon background */}
					<div className="absolute -bottom-4 -right-4 text-[#dfe1e6] opacity-30">
						<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
							<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
}
