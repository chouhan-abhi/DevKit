import { useEffect, useRef } from "react";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

function matchesShortcut(event, shortcut) {
	const mod = isMac ? event.metaKey : event.ctrlKey;

	if (shortcut.mod && !mod) return false;
	if (shortcut.shift && !event.shiftKey) return false;
	if (shortcut.alt && !event.altKey) return false;

	if (!shortcut.mod && mod) return false;
	if (!shortcut.shift && event.shiftKey) return false;
	if (!shortcut.alt && event.altKey) return false;

	return event.key.toLowerCase() === shortcut.key.toLowerCase();
}

export function formatShortcut({ mod, shift, alt, key }) {
	const parts = [];
	if (mod) parts.push(isMac ? "\u2318" : "Ctrl");
	if (shift) parts.push(isMac ? "\u21E7" : "Shift");
	if (alt) parts.push(isMac ? "\u2325" : "Alt");
	parts.push(key.length === 1 ? key.toUpperCase() : key);
	return parts.join(isMac ? "" : "+");
}

export function useKeyboardShortcuts(shortcuts) {
	const ref = useRef(shortcuts);
	ref.current = shortcuts;

	useEffect(() => {
		const handler = (event) => {
			for (const { shortcut, action } of ref.current) {
				if (matchesShortcut(event, shortcut)) {
					event.preventDefault();
					action();
					return;
				}
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, []);
}
