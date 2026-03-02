import { useState, useEffect, useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { Copy, Check, Download, WrapText } from "lucide-react";
import { themeManager } from "../../../shared/services/themeManager";

const CodeEditor = ({ initialCode = "", onCodeChange }) => {
	const [code, setCode] = useState(initialCode);
	const [editorTheme, setEditorTheme] = useState("light");
	const [wrapEnabled, setWrapEnabled] = useState(false);
	const [copied, setCopied] = useState(false);
	const [cursorInfo, setCursorInfo] = useState({ line: 1, col: 1, chars: 0, lines: 1, selected: 0 });

	useEffect(() => {
		setCode(initialCode);
	}, [initialCode]);

	const resolveTheme = useCallback(() => {
		const theme = themeManager.getTheme();
		return theme === "dark" ||
			(theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
			? "dark"
			: "light";
	}, []);

	useEffect(() => {
		setEditorTheme(resolveTheme());
		const handler = (e) => setEditorTheme(e.detail === "dark" ? "dark" : "light");
		window.addEventListener("theme-changed", handler);
		return () => window.removeEventListener("theme-changed", handler);
	}, [resolveTheme]);

	const handleChange = useCallback(
		(value) => {
			const next = value ?? "";
			setCode(next);
			onCodeChange?.(next);
		},
		[onCodeChange],
	);

	const handleUpdate = useCallback((viewUpdate) => {
		if (!viewUpdate.selectionSet && !viewUpdate.docChanged) return;
		const { state } = viewUpdate;
		const pos = state.selection.main.head;
		const line = state.doc.lineAt(pos);
		setCursorInfo({
			line: line.number,
			col: pos - line.from + 1,
			chars: state.doc.length,
			lines: state.doc.lines,
			selected: Math.abs(state.selection.main.to - state.selection.main.from),
		});
	}, []);

	const extensions = useMemo(() => {
		const exts = [javascript({ jsx: true })];
		if (wrapEnabled) exts.push(EditorView.lineWrapping);
		return exts;
	}, [wrapEnabled]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch { /* clipboard not available */ }
	};

	const handleDownload = () => {
		const blob = new Blob([code], { type: "text/javascript" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "code.js";
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="flex flex-col w-full h-full min-h-0">
			<div
				className="flex items-center justify-between px-2.5 py-1 border-b shrink-0"
				style={{ borderColor: "var(--border-color)", background: "var(--border-subtle)" }}
			>
				<div className="flex items-center gap-1">
					<button
						type="button"
						className={`toolbar-btn compact ${wrapEnabled ? "toolbar-btn--active" : ""}`}
						onClick={() => setWrapEnabled((v) => !v)}
						data-tooltip={wrapEnabled ? "Disable word wrap" : "Enable word wrap"}
					>
						<WrapText size={13} />
					</button>
				</div>
				<div className="flex items-center gap-1">
					<button type="button" className="toolbar-btn compact" onClick={handleCopy} data-tooltip="Copy code">
						{copied ? <Check size={13} /> : <Copy size={13} />}
					</button>
					<button type="button" className="toolbar-btn compact" onClick={handleDownload} data-tooltip="Download .js">
						<Download size={13} />
					</button>
				</div>
			</div>

			<div
				className="flex-1 w-full min-h-0 border-r overflow-hidden"
				style={{ borderColor: "var(--border-color)" }}
			>
				<CodeMirror
					value={code}
					height="100%"
					theme={editorTheme}
					extensions={extensions}
					onChange={handleChange}
					onUpdate={handleUpdate}
					className="h-full"
					basicSetup={{
						lineNumbers: true,
						foldGutter: true,
						highlightActiveLineGutter: true,
						highlightActiveLine: true,
						bracketMatching: true,
						closeBrackets: true,
						autocompletion: true,
						indentOnInput: true,
						highlightSelectionMatches: true,
					}}
				/>
			</div>

			<div
				className="jspl-status-bar"
				style={{ borderColor: "var(--border-color)" }}
			>
				<span>Ln {cursorInfo.line}, Col {cursorInfo.col}</span>
				<span>{cursorInfo.lines} lines</span>
				<span>{cursorInfo.chars} chars</span>
				{cursorInfo.selected > 0 && <span>{cursorInfo.selected} selected</span>}
				<span className="ml-auto">JavaScript</span>
			</div>
		</div>
	);
};

export default CodeEditor;
