import React, { useState } from "react";
import ArchiveView from "./ArchiveView";
import DailyView from "./DailyView";
import { useJournalEntries } from "../hooks/useJournalEntries";

export default function JournalApp() {
	const [currentView, setCurrentView] = useState("daily"); // "daily" or "archive"
	const [selectedDate, setSelectedDate] = useState(new Date());
	const journal = useJournalEntries();

	return (
		<div className="flex h-full w-full bg-[#f8f9fa] text-[#2b3437] font-['Inter',sans-serif]">
			{/* We can manage navigation between Archive and Daily View here, or inside them */}
			{currentView === "archive" ? (
				<ArchiveView 
					onSelectDate={(date) => {
						setSelectedDate(date);
						setCurrentView("daily");
					}} 
					journal={journal}
				/>
			) : (
				<DailyView 
					date={selectedDate}
					onNavigateArchive={() => setCurrentView("archive")}
					onSelectDate={setSelectedDate}
					journal={journal}
				/>
			)}
		</div>
	);
}
