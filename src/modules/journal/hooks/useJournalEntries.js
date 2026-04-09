import { useState, useEffect } from "react";
import { format } from "date-fns";

const STORAGE_KEY = "devkit_journal_entries";

export function useJournalEntries() {
	const [entries, setEntries] = useState({});

	// Load entries on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				setEntries(JSON.parse(stored));
			} catch (e) {
				console.error("Failed to parse journal entries", e);
			}
		}
	}, []);

	// Save entries when they change
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
	}, [entries]);

	const saveEntry = (date, data) => {
		const dateKey = format(date, "yyyy-MM-dd");
		setEntries((prev) => ({
			...prev,
			[dateKey]: {
				...prev[dateKey],
				...data,
				lastModified: new Date().toISOString(),
			},
		}));
	};

	const getEntry = (date) => {
		const dateKey = format(date, "yyyy-MM-dd");
		return entries[dateKey] || { title: "", content: "", type: "Todo", image: null };
	};

	const getHighlights = () => {
		const highlights = {};
		Object.keys(entries).forEach((dateKey) => {
			const entry = entries[dateKey];
			if (entry.content || entry.title) {
				highlights[dateKey] = entry.type.toLowerCase();
			}
		});
		return highlights;
	};

	return {
		entries,
		saveEntry,
		getEntry,
		getHighlights,
	};
}
