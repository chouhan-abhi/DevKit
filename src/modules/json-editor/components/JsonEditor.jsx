import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import {
	AlertCircle, CheckCircle, Code, Minimize2, Copy, Check,
	Download, Upload, ArrowDownAZ, Layers, Undo2, Search,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { themeManager } from "../../../shared/services/themeManager";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";
import { useToast } from "../../../shared/components/ToastProvider";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";

function sortObjectKeys(obj) {
	if (Array.isArray(obj)) return obj.map(sortObjectKeys);
	if (obj !== null && typeof obj === "object") {
		return Object.keys(obj).sort().reduce((acc, key) => {
			acc[key] = sortObjectKeys(obj[key]);
			return acc;
		}, {});
	}
	return obj;
}

function flattenObject(obj, prefix = "", result = {}) {
	if (obj === null || typeof obj !== "object") {
		result[prefix] = obj;
		return result;
	}
	if (Array.isArray(obj)) {
		obj.forEach((item, i) => flattenObject(item, prefix ? `${prefix}[${i}]` : `[${i}]`, result));
		return result;
	}
	for (const key of Object.keys(obj)) {
		flattenObject(obj[key], prefix ? `${prefix}.${key}` : key, result);
	}
	return result;
}

function unflattenObject(obj) {
	const result = {};
	for (const [path, value] of Object.entries(obj)) {
		const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
		let current = result;
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const isLast = i === keys.length - 1;
			const nextIsIndex = !isLast && /^\d+$/.test(keys[i + 1]);
			if (isLast) { current[key] = value; }
			else {
				if (current[key] == null) current[key] = nextIsIndex ? [] : {};
				current = current[key];
			}
		}
	}
	return result;
}

function computeStats(obj) {
	let keys = 0;
	let maxDepth = 0;

	function walk(node, depth) {
		if (depth > maxDepth) maxDepth = depth;
		if (node !== null && typeof node === "object") {
			if (Array.isArray(node)) {
				node.forEach((item) => walk(item, depth + 1));
			} else {
				const entries = Object.keys(node);
				keys += entries.length;
				entries.forEach((k) => walk(node[k], depth + 1));
			}
		}
	}

	walk(obj, 0);
	return { keys, maxDepth };
}

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function filterJsonView(obj, term) {
	if (!term) return obj;
	const lower = term.toLowerCase();

	if (Array.isArray(obj)) {
		const filtered = obj
			.map((item) => filterJsonView(item, term))
			.filter((item) => item !== undefined);
		return filtered.length > 0 ? filtered : undefined;
	}

	if (obj !== null && typeof obj === "object") {
		const result = {};
		let hasMatch = false;
		for (const [key, value] of Object.entries(obj)) {
			if (key.toLowerCase().includes(lower)) {
				result[key] = value;
				hasMatch = true;
			} else {
				const filtered = filterJsonView(value, term);
				if (filtered !== undefined) {
					result[key] = filtered;
					hasMatch = true;
				}
			}
		}
		return hasMatch ? result : undefined;
	}

	if (String(obj).toLowerCase().includes(lower)) return obj;
	return undefined;
}

const JsonEditor = () => {
	const parseTimerRef = useRef(null);
	const fallbackJson = '{\n  "name": "User",\n  "age": 24\n}';
	const { showToast } = useToast();

	const {
		documents, currentId, title, content, setContent,
		setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
	} = useDocuments({
		appId: "json",
		defaultTitle: "JSON Document",
		initialContent: { jsonText: fallbackJson },
	});

	const jsonText = content?.jsonText ?? fallbackJson;
	const [jsonObj, setJsonObj] = useState(() => {
		try { return JSON.parse(jsonText); }
		catch { return null; }
	});
	const [error, setError] = useState(null);
	const [copied, setCopied] = useState(false);
	const [treeSearch, setTreeSearch] = useState("");
	const [isFlattened, setIsFlattened] = useState(false);

	const resolveTheme = (theme) =>
		theme === "system"
			? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
			: theme;

	const [themeMode, setThemeMode] = useState(() => resolveTheme(themeManager.getTheme()));
	const jsonViewStyle = themeMode === "dark" ? darkStyles : defaultStyles;

	useEffect(() => {
		const handler = (e) => setThemeMode(e.detail);
		window.addEventListener("theme-changed", handler);
		return () => window.removeEventListener("theme-changed", handler);
	}, []);

	useEffect(() => {
		clearTimeout(parseTimerRef.current);
		parseTimerRef.current = setTimeout(() => {
			try {
				const parsed = JSON.parse(jsonText);
				setJsonObj(parsed);
				setError(null);
			} catch (err) {
				setJsonObj(null);
				setError(err.message);
			}
		}, 300);
		return () => clearTimeout(parseTimerRef.current);
	}, [jsonText]);

	const updateJson = useCallback((text) => {
		setContent((prev) => ({ ...(prev || {}), jsonText: text }));
	}, [setContent]);

	const formatJson = useCallback(() => {
		try {
			const parsed = JSON.parse(jsonText);
			updateJson(JSON.stringify(parsed, null, 2));
			setError(null);
		} catch (err) { setError(err.message); }
	}, [jsonText, updateJson]);

	const minifyJson = useCallback(() => {
		try {
			const parsed = JSON.parse(jsonText);
			updateJson(JSON.stringify(parsed));
			setError(null);
		} catch (err) { setError(err.message); }
	}, [jsonText, updateJson]);

	const sortKeys = useCallback(() => {
		try {
			const parsed = JSON.parse(jsonText);
			updateJson(JSON.stringify(sortObjectKeys(parsed), null, 2));
			setError(null);
			showToast("Keys sorted alphabetically");
		} catch (err) { setError(err.message); }
	}, [jsonText, updateJson, showToast]);

	const toggleFlatten = useCallback(() => {
		try {
			const parsed = JSON.parse(jsonText);
			if (isFlattened) {
				updateJson(JSON.stringify(unflattenObject(parsed), null, 2));
				setIsFlattened(false);
				showToast("JSON unflattened");
			} else {
				updateJson(JSON.stringify(flattenObject(parsed), null, 2));
				setIsFlattened(true);
				showToast("JSON flattened to dot notation");
			}
			setError(null);
		} catch (err) { setError(err.message); }
	}, [jsonText, isFlattened, updateJson, showToast]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(jsonText);
			setCopied(true);
			showToast("JSON copied");
			setTimeout(() => setCopied(false), 1500);
		} catch { /* */ }
	}, [jsonText, showToast]);

	const handleExport = useCallback(() => {
		const blob = new Blob([jsonText], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${title || "document"}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [jsonText, title]);

	const handleImport = useCallback((event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target.result || "";
			updateJson(String(text));
		};
		reader.readAsText(file);
		event.target.value = null;
	}, [updateJson]);

	const stats = useMemo(() => {
		if (!jsonObj) return null;
		const { keys, maxDepth } = computeStats(jsonObj);
		return { keys, maxDepth, size: formatBytes(new Blob([jsonText]).size) };
	}, [jsonObj, jsonText]);

	const filteredObj = useMemo(() => {
		if (!jsonObj || !treeSearch.trim()) return jsonObj;
		return filterJsonView(jsonObj, treeSearch.trim()) ?? {};
	}, [jsonObj, treeSearch]);

	const extensions = useMemo(() => [json()], []);

	const shortcuts = useMemo(() => ({
		newDoc: { mod: true, shift: true, key: "n" },
		format: { mod: true, shift: true, key: "f" },
		minify: { mod: true, shift: true, key: "m" },
		copy:   { mod: true, shift: true, key: "c" },
	}), []);

	useKeyboardShortcuts([
		{ shortcut: shortcuts.newDoc, action: () => createDoc("JSON Document", { jsonText: fallbackJson }) },
		{ shortcut: shortcuts.format, action: formatJson },
		{ shortcut: shortcuts.minify, action: minifyJson },
		{ shortcut: shortcuts.copy, action: handleCopy },
	]);

	return (
		<div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
			<div className="p-3 pb-0">
				<SubAppToolbar
					documents={documents}
					currentId={currentId}
					currentTitle={title}
					onSelect={setCurrentDocId}
					onRename={renameDoc}
					onNew={() => createDoc("JSON Document", { jsonText: fallbackJson })}
					onSaveAs={(name) => saveAs(name)}
					onDelete={() => deleteDoc()}
					status={isSaving ? "saving" : "saved"}
					rightActions={
						<>
							<button onClick={formatJson} className="toolbar-btn" type="button" data-tooltip={`Format (${formatShortcut(shortcuts.format)})`}>
								<Code size={14} /> Format
							</button>
							<button onClick={minifyJson} className="toolbar-btn" type="button" data-tooltip={`Minify (${formatShortcut(shortcuts.minify)})`}>
								<Minimize2 size={14} /> Minify
							</button>
							<button onClick={sortKeys} className="toolbar-btn compact" type="button" data-tooltip="Sort keys A→Z">
								<ArrowDownAZ size={14} />
							</button>
							<button onClick={toggleFlatten} className="toolbar-btn compact" type="button" data-tooltip={isFlattened ? "Unflatten" : "Flatten"}>
								{isFlattened ? <Undo2 size={14} /> : <Layers size={14} />}
							</button>
							<div className="toolbar-divider" />
							<button onClick={handleCopy} className="toolbar-btn compact" type="button" data-tooltip={copied ? "Copied!" : `Copy (${formatShortcut(shortcuts.copy)})`}>
								{copied ? <Check size={14} /> : <Copy size={14} />}
							</button>
							<button onClick={handleExport} className="toolbar-btn compact" type="button" data-tooltip="Export .json">
								<Download size={14} />
							</button>
							<label className="toolbar-btn compact cursor-pointer" data-tooltip="Import .json" aria-label="Import">
								<Upload size={14} />
								<input type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
							</label>
						</>
					}
				/>
			</div>

			<div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden border rounded-xl m-3" style={{ borderColor: "var(--border-color)" }}>
				<div className="flex-1 flex flex-col min-h-0 border-r-0 md:border-r border-b md:border-b-0" style={{ borderColor: "var(--border-color)" }}>
					<CodeMirror
						value={jsonText}
						height="100%"
						theme={themeMode}
						extensions={extensions}
						onChange={(value) => updateJson(value ?? "")}
						className="h-full"
						basicSetup={{
							lineNumbers: true, foldGutter: true, highlightActiveLineGutter: true,
							highlightActiveLine: true, bracketMatching: true, closeBrackets: true,
							autocompletion: true, indentOnInput: true,
						}}
					/>
				</div>

				<div className="w-full md:w-[40%] flex flex-col min-h-0" style={{ background: "var(--panel-color)" }}>
					<div className="flex items-center justify-between p-4 pb-0 gap-2">
						<h2 className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
							JSON Structure
						</h2>
						{error ? (
							<span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--accent-red)" }}>
								<AlertCircle size={13} /> Invalid
							</span>
						) : (
							<span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--accent-green)" }}>
								<CheckCircle size={13} /> Valid
							</span>
						)}
					</div>

					{stats && (
						<div className="je-stats-bar">
							<span>{stats.keys} keys</span>
							<span className="je-stats-dot" />
							<span>Depth {stats.maxDepth}</span>
							<span className="je-stats-dot" />
							<span>{stats.size}</span>
						</div>
					)}

					{!error && jsonObj && (
						<div className="je-tree-search">
							<Search size={13} className="je-tree-search-icon" />
							<input
								type="text"
								value={treeSearch}
								onChange={(e) => setTreeSearch(e.target.value)}
								placeholder="Filter keys or values..."
								className="je-tree-search-input"
								spellCheck={false}
							/>
						</div>
					)}

					<div className="flex-1 overflow-auto p-4 pt-2">
						{error ? (
							<p className="text-xs rounded-lg p-3" style={{ color: "var(--accent-red)", background: "rgba(239, 68, 68, 0.06)" }}>
								{error}
							</p>
						) : (
							<div className="rounded-lg p-3" style={{ background: "var(--bg-color)" }}>
								<JsonView data={filteredObj} style={jsonViewStyle} />
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default JsonEditor;
