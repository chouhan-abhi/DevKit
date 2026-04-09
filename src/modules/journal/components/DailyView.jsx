import React, { useState, useEffect } from "react";
import { format, isAfter, addDays, isTomorrow } from "date-fns";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

export default function DailyView({ date, entry, onSaveEntry, onNavigateDate }) {
	const [activeType, setActiveType] = useState(entry?.type || "Todo");
	const [title, setTitle] = useState(entry?.title || "");
	const [content, setContent] = useState(entry?.content || "");

	const today = new Date();
	const tomorrow = addDays(today, 1);
	const isFutureDate = isAfter(date, tomorrow);
	const isTomorrowDate = isTomorrow(date);

	// Update local state when entry changes
	useEffect(() => {
		setActiveType(entry?.type || "Todo");
		setTitle(entry?.title || "");
		setContent(entry?.content || "");
	}, [entry]);

	// Auto-save when content changes (only if not a future date)
	useEffect(() => {
		if (isFutureDate) return;
		
		const timer = setTimeout(() => {
			if (title || content || activeType !== "Todo") {
				onSaveEntry({ title, content, type: activeType });
			}
		}, 1000);
		return () => clearTimeout(timer);
	}, [title, content, activeType, onSaveEntry, isFutureDate]);

	const types = [
		{ id: "Todo", label: "Task" },
		{ id: "List", label: "List" },
		{ id: "Paragraph", label: "Note" },
	];

	return (
		<div className="flex flex-col h-full" style={{ background: "var(--bg-color)" }}>
			{/* Date Navigation */}
			<div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
				<button
					type="button"
					className="toolbar-btn compact"
					onClick={() => onNavigateDate("prev")}
					data-tooltip="Previous day"
				>
					<ChevronLeft size={16} />
				</button>
				
				<div className="text-center">
					<div className="flex items-center justify-center gap-2">
						<div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
							{format(date, "EEEE")}
						</div>
						{isFutureDate && (
							<Lock size={14} style={{ color: "var(--text-muted)" }} />
						)}
						{isTomorrowDate && (
							<span className="text-xs px-2 py-1 rounded" style={{ 
								background: "var(--accent-orange)", 
								color: "white" 
							}}>
								Tomorrow
							</span>
						)}
					</div>
					<div className="text-2xl font-semibold" style={{ 
						color: isFutureDate ? "var(--text-muted)" : "var(--text-color)" 
					}}>
						{format(date, "MMMM d, yyyy")}
					</div>
					{isFutureDate && (
						<div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
							Future entries not allowed
						</div>
					)}
				</div>
				
				<button
					type="button"
					className="toolbar-btn compact"
					onClick={() => onNavigateDate("next")}
					data-tooltip="Next day"
					disabled={isFutureDate}
					style={{ opacity: isFutureDate ? 0.5 : 1 }}
				>
					<ChevronRight size={16} />
				</button>
			</div>

			{/* Entry Type Selection */}
			<div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
				<span className="text-sm font-medium mr-2" style={{ color: "var(--text-secondary)" }}>
					Type:
				</span>
				{types.map(type => (
					<button
						key={type.id}
						onClick={() => !isFutureDate && setActiveType(type.id)}
						disabled={isFutureDate}
						className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
							activeType === type.id 
								? "text-white" 
								: ""
						}`}
						style={{
							background: activeType === type.id ? "var(--primary-color)" : "var(--border-subtle)",
							color: activeType === type.id ? "#ffffff" : "var(--text-color)",
							opacity: isFutureDate ? 0.5 : 1,
							cursor: isFutureDate ? "not-allowed" : "pointer",
						}}
					>
						{type.label}
					</button>
				))}
			</div>

			{/* Entry Content */}
			<div className="flex-1 flex flex-col p-4 min-h-0">
				{isFutureDate ? (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center" style={{ color: "var(--text-muted)" }}>
							<Lock size={48} className="mx-auto mb-4 opacity-50" />
							<h3 className="text-lg font-medium mb-2">Future Entry Locked</h3>
							<p className="text-sm">
								You can only create entries for today and tomorrow.
							</p>
						</div>
					</div>
				) : (
					<>
						{/* Title Input */}
						<input 
							type="text" 
							placeholder="Entry title..." 
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full text-xl font-medium mb-4 p-2 border rounded"
							style={{
								background: "var(--panel-color)",
								borderColor: "var(--border-color)",
								color: "var(--text-color)",
							}}
						/>

						{/* Content Textarea */}
						<textarea 
							placeholder="Write your thoughts here..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="flex-1 w-full p-3 border rounded resize-none"
							style={{
								background: "var(--panel-color)",
								borderColor: "var(--border-color)",
								color: "var(--text-color)",
								minHeight: "300px",
							}}
						/>
					</>
				)}
			</div>
		</div>
	);
}
