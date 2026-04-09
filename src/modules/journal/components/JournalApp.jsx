import React, { useState } from "react";
import { Calendar, BookOpen } from "lucide-react";
import { format, addDays, subDays, isAfter } from "date-fns";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import ManualSyncButton from "../../../shared/components/ManualSyncButton";
import { useDocuments } from "../../../shared/hooks/useDocuments";
import { useAppAnalytics, useDocumentAnalytics } from "../../../shared/hooks/useAnalytics";
import ArchiveView from "./ArchiveView";
import DailyView from "./DailyView";

export default function JournalApp() {
	const [currentView, setCurrentView] = useState("daily"); // "daily" or "archive"
	const [selectedDate, setSelectedDate] = useState(new Date());
	
	// Analytics tracking
	const analytics = useAppAnalytics("journal");
	const docAnalytics = useDocumentAnalytics("journal");

	const {
		documents, currentId, title, content, setContent,
		setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
		syncStatus, lastSyncError, syncToCloud, syncFromCloud, isCloudSyncEnabled,
	} = useDocuments({
		appId: "journal",
		defaultTitle: "Journal Entry",
		initialContent: { entries: {} },
	});

	const entries = content?.entries || {};

	const getEntry = (date) => {
		const dateKey = format(date, "yyyy-MM-dd");
		return entries[dateKey] || { title: "", content: "", type: "Todo" };
	};

	const saveEntry = (date, entryData) => {
		const dateKey = format(date, "yyyy-MM-dd");
		const isNewEntry = !content?.entries?.[dateKey]?.content;
		
		setContent(prev => ({
			...prev,
			entries: {
				...(prev?.entries || {}),
				[dateKey]: {
					...(prev?.entries?.[dateKey] || {}),
					...entryData,
					lastModified: new Date().toISOString(),
				}
			}
		}));
		
		// Track entry creation or edit
		if (isNewEntry && entryData.content) {
			docAnalytics.trackCreate(`entry_${dateKey}`);
		} else if (entryData.content) {
			docAnalytics.trackEdit(`entry_${dateKey}`, {
				type: entryData.type,
				hasTitle: !!entryData.title,
				contentLength: entryData.content?.length || 0,
			});
		}
	};

	const getHighlights = () => {
		const highlights = {};
		Object.keys(entries).forEach((dateKey) => {
			const entry = entries[dateKey];
			if (entry && (entry.content || entry.title)) {
				highlights[dateKey] = entry.type?.toLowerCase() || "todo";
			}
		});
		return highlights;
	};

	return (
		<div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
			<div className="px-4 pt-3">
				<SubAppToolbar
					documents={documents}
					currentId={currentId}
					currentTitle={title}
					onSelect={setCurrentDocId}
					onRename={renameDoc}
					onNew={() => createDoc("Journal Entry", { entries: {} })}
					onSaveAs={(name) => saveAs(name)}
					onDelete={() => deleteDoc()}
					status={isSaving ? "saving" : "saved"}
					syncStatus={syncStatus}
					lastSyncError={lastSyncError}
					isCloudSyncEnabled={isCloudSyncEnabled}
					onSync={syncToCloud}
					rightActions={
						<>
							<ManualSyncButton
								onSyncToCloud={async () => {
									try {
										await syncToCloud();
										analytics.trackSync('manual_upload', 'success', {
											entryCount: Object.keys(entries).length,
										});
									} catch (error) {
										analytics.trackSync('manual_upload', 'error', {
											error: error.message,
										});
										throw error;
									}
								}}
								onSyncFromCloud={async () => {
									try {
										await syncFromCloud();
										analytics.trackSync('manual_download', 'success');
									} catch (error) {
										analytics.trackSync('manual_download', 'error', {
											error: error.message,
										});
										throw error;
									}
								}}
								isCloudSyncEnabled={isCloudSyncEnabled}
								syncStatus={syncStatus}
								compact
							/>
							<button
								type="button"
								className="toolbar-btn compact"
								onClick={() => {
									const newView = currentView === "daily" ? "archive" : "daily";
									setCurrentView(newView);
									analytics.trackFeatureUse('journal_view_change', {
										from: currentView,
										to: newView,
									});
								}}
								data-tooltip={currentView === "daily" ? "Calendar View" : "Daily View"}
								style={{ color: currentView === "archive" ? "var(--primary-color)" : "var(--text-secondary)" }}
							>
								{currentView === "daily" ? <Calendar size={15} /> : <BookOpen size={15} />}
							</button>
						</>
					}
				/>
			</div>

			<div className="flex-1 min-h-0 overflow-hidden">
				{currentView === "archive" ? (
					<ArchiveView 
						onSelectDate={(date) => {
							setSelectedDate(date);
							setCurrentView("daily");
							analytics.trackFeatureUse('journal_date_select', {
								selectedDate: format(date, 'yyyy-MM-dd'),
								fromView: 'timeline',
							});
						}}
						highlights={getHighlights()}
					/>
				) : (
					<DailyView 
						date={selectedDate}
						entry={getEntry(selectedDate)}
						onSaveEntry={(entryData) => saveEntry(selectedDate, entryData)}
						onNavigateDate={(direction) => {
							const newDate = direction === "prev" ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
							const tomorrow = addDays(new Date(), 1);
							
							// Don't allow navigation beyond tomorrow
							if (direction === "next" && isAfter(newDate, tomorrow)) {
								return;
							}
							
							setSelectedDate(newDate);
						}}
					/>
				)}
			</div>
		</div>
	);
}
