import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import CodeMirrorMerge from "react-codemirror-merge";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import { themeManager } from "../../../shared/services/themeManager";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";
import { useToast } from "../../../shared/components/ToastProvider";
import {
	ArrowLeftRight, Upload, Copy, Check, Trash2, ChevronDown,
} from "lucide-react";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

const LANGUAGES = [
	{ key: "javascript", label: "JavaScript", ext: () => javascript({ jsx: true }) },
	{ key: "json", label: "JSON", ext: () => json() },
	{ key: "markdown", label: "Markdown", ext: () => markdown() },
	{ key: "xml", label: "XML / HTML", ext: () => xml() },
	{ key: "plain", label: "Plain Text", ext: () => [] },
];

function computeDiffStats(left, right) {
	const lLines = left.split("\n");
	const rLines = right.split("\n");
	const lFreq = new Map();
	const rFreq = new Map();
	for (const line of lLines) lFreq.set(line, (lFreq.get(line) || 0) + 1);
	for (const line of rLines) rFreq.set(line, (rFreq.get(line) || 0) + 1);
	let removed = 0;
	let added = 0;
	for (const [line, count] of lFreq) {
		const rCount = rFreq.get(line) || 0;
		if (count > rCount) removed += count - rCount;
	}
	for (const [line, count] of rFreq) {
		const lCount = lFreq.get(line) || 0;
		if (count > lCount) added += count - lCount;
	}
	return { added, removed, totalLeft: lLines.length, totalRight: rLines.length };
}

export default function DualEditableDiff() {
	const { showToast } = useToast();

	const {
		documents, currentId, title, content, setContent,
		setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
	} = useDocuments({
		appId: "diff-editor",
		defaultTitle: "Diff Document",
		initialContent: { left: "// Left editor", right: "// Right editor" },
	});

	const leftCode = content?.left ?? "";
	const rightCode = content?.right ?? "";

	const resolveTheme = (theme) => {
		const resolved = theme === "system"
			? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
			: theme;
		return resolved === "dark" ? "dark" : "light";
	};

	const [editorTheme, setEditorTheme] = useState(() =>
		resolveTheme(themeManager.getTheme()),
	);
	const [language, setLanguage] = useState("javascript");
	const [langMenuOpen, setLangMenuOpen] = useState(false);
	const [copiedSide, setCopiedSide] = useState(null);
	const leftFileRef = useRef(null);
	const rightFileRef = useRef(null);

	useEffect(() => {
		const handler = () => setEditorTheme(resolveTheme(themeManager.getTheme()));
		window.addEventListener("theme-changed", handler);
		return () => window.removeEventListener("theme-changed", handler);
	}, []);

	useEffect(() => {
		const handler = (e) => {
			if (!e.target.closest(".de-lang-picker")) setLangMenuOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const langConfig = useMemo(() => LANGUAGES.find((l) => l.key === language) ?? LANGUAGES[0], [language]);
	const extensions = useMemo(() => {
		const ext = langConfig.ext();
		return Array.isArray(ext) ? ext : [ext];
	}, [langConfig]);

	const handleLanguageChange = useCallback((key) => {
		setLanguage(key);
		setLangMenuOpen(false);
	}, []);

	const stats = useMemo(() => computeDiffStats(leftCode, rightCode), [leftCode, rightCode]);

	const swapSides = useCallback(() =>
		setContent((prev) => ({ left: prev?.right || "", right: prev?.left || "" })),
	[setContent]);

	const clearBoth = useCallback(() =>
		setContent({ left: "", right: "" }),
	[setContent]);

	const copySide = useCallback(async (side) => {
		const text = side === "left" ? leftCode : rightCode;
		try {
			await navigator.clipboard.writeText(text);
			setCopiedSide(side);
			showToast(`${side === "left" ? "Left" : "Right"} side copied`);
			setTimeout(() => setCopiedSide(null), 1500);
		} catch { /* */ }
	}, [leftCode, rightCode, showToast]);

	const handleFileImport = useCallback((side) => (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = String(e.target.result || "");
			setContent((prev) => ({ ...(prev || {}), [side]: text }));
			showToast(`File loaded into ${side} editor`);
		};
		reader.readAsText(file);
		event.target.value = null;
	}, [setContent, showToast]);

	const shortcuts = useMemo(() => ({
		newDoc: { mod: true, shift: true, key: "n" },
		swap: { mod: true, shift: true, key: "x" },
	}), []);

	useKeyboardShortcuts([
		{ shortcut: shortcuts.newDoc, action: () => createDoc("Diff Document", { left: "// Left editor", right: "// Right editor" }) },
		{ shortcut: shortcuts.swap, action: swapSides },
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
					onNew={() => createDoc("Diff Document", { left: "// Left editor", right: "// Right editor" })}
					onSaveAs={(name) => saveAs(name)}
					onDelete={() => deleteDoc()}
					status={isSaving ? "saving" : "saved"}
					rightActions={
						<>
							<div className="de-lang-picker">
								<button
									type="button" className="toolbar-btn"
									onClick={() => setLangMenuOpen((v) => !v)}
								>
									{langConfig.label} <ChevronDown size={12} />
								</button>
								{langMenuOpen && (
									<div className="de-lang-dropdown">
										{LANGUAGES.map((l) => (
											<button
												key={l.key} type="button"
												className={`de-lang-option ${language === l.key ? "de-lang-option--active" : ""}`}
												onClick={() => handleLanguageChange(l.key)}
											>
												{l.label}
											</button>
										))}
									</div>
								)}
							</div>
							<div className="toolbar-divider" />
							<button type="button" className="toolbar-btn" onClick={swapSides} data-tooltip={`Swap sides (${formatShortcut(shortcuts.swap)})`}>
								<ArrowLeftRight size={14} /> Swap
							</button>
							<button type="button" className="toolbar-btn compact" onClick={() => copySide("left")} data-tooltip="Copy left">
								{copiedSide === "left" ? <Check size={14} /> : <Copy size={14} />}
							</button>
							<button type="button" className="toolbar-btn compact" onClick={() => copySide("right")} data-tooltip="Copy right">
								{copiedSide === "right" ? <Check size={14} /> : <Copy size={14} />}
							</button>
							<div className="toolbar-divider" />
							<label className="toolbar-btn compact cursor-pointer" data-tooltip="Import left" aria-label="Import left file">
								<Upload size={14} />
								<input ref={leftFileRef} type="file" onChange={handleFileImport("left")} className="hidden" />
							</label>
							<label className="toolbar-btn compact cursor-pointer" data-tooltip="Import right" aria-label="Import right file">
								<Upload size={14} />
								<input ref={rightFileRef} type="file" onChange={handleFileImport("right")} className="hidden" />
							</label>
							<button type="button" className="toolbar-btn compact danger" onClick={clearBoth} data-tooltip="Clear both">
								<Trash2 size={14} />
							</button>
						</>
					}
				/>
			</div>

			<div className="de-stats-bar">
				<span className="de-stat de-stat--added">+{stats.added} added</span>
				<span className="de-stat de-stat--removed">-{stats.removed} removed</span>
				<span className="de-stat">Left: {stats.totalLeft} lines</span>
				<span className="de-stat">Right: {stats.totalRight} lines</span>
			</div>

			<div className="flex-1 min-h-0 overflow-hidden border rounded-xl m-3 mt-0" style={{ borderColor: "var(--border-color)" }}>
				<CodeMirrorMerge
					key={language}
					theme={editorTheme}
					orientation="a-b"
					className="h-full de-merge-full"
				>
					<Original
						value={leftCode}
						extensions={extensions}
						onChange={(value) => setContent((prev) => ({ ...(prev || {}), left: value ?? "" }))}
					/>
					<Modified
						value={rightCode}
						extensions={extensions}
						onChange={(value) => setContent((prev) => ({ ...(prev || {}), right: value ?? "" }))}
					/>
				</CodeMirrorMerge>
			</div>
		</div>
	);
}
