import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
	Copy, Check, Download, Image, Plus, Trash2, RotateCcw, GripVertical, Eye, EyeOff,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json as jsonLang } from "@codemirror/lang-json";
import { useToast } from "../../../shared/components/ToastProvider";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";
import {
	hexToHsl, hslToHex, isValidHex, contrastTextColor, generateSuggestions,
} from "../utils/colorUtils";

const DEFAULT_STRIPS = [
	{ key: "bg", label: "Background", color: "#0E090D" },
	{ key: "surface", label: "Surface", color: "#1D171E" },
	{ key: "border", label: "Border", color: "#28202D" },
	{ key: "text", label: "Text", color: "#FFFFFF" },
	{ key: "muted", label: "Muted", color: "#F4F6FB" },
	{ key: "accent", label: "Accent", color: "#AEB784" },
];

function normalizeHex(value) {
	if (typeof value !== "string") return null;
	const raw = value.trim();
	const withHash = raw.startsWith("#") ? raw : `#${raw}`;
	if (!isValidHex(withHash)) return null;
	if (withHash.length === 4) {
		return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`.toUpperCase();
	}
	return withHash.toUpperCase();
}

function parsePaletteConfigJson(input) {
	let parsed;
	try {
		parsed = JSON.parse(input);
	} catch {
		throw new Error("Invalid JSON format");
	}

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("Config must be a JSON object");
	}

	const colorPalette = parsed["color-palette"];
	if (!colorPalette || typeof colorPalette !== "object" || Array.isArray(colorPalette)) {
		throw new Error('Missing "color-palette" object');
	}

	const nextStrips = Object.entries(colorPalette).reduce((acc, [key, value]) => {
		if (typeof key !== "string" || !key.trim()) return acc;
		const hex = normalizeHex(value);
		if (!hex) return acc;
		acc.push({
			key,
			label: key.charAt(0).toUpperCase() + key.slice(1),
			color: hex,
		});
		return acc;
	}, []);

	if (nextStrips.length === 0) {
		throw new Error("No valid colors found in color-palette");
	}

	const nextName = typeof parsed["palette-name"] === "string" && parsed["palette-name"].trim()
		? parsed["palette-name"]
		: "My Palette";

	return { nextStrips, nextName };
}

function downloadBlob(blob, fileName) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function inlineComputedStyles(sourceNode, targetNode) {
	const computedStyle = window.getComputedStyle(sourceNode);
	for (const prop of computedStyle) {
		targetNode.style.setProperty(prop, computedStyle.getPropertyValue(prop), computedStyle.getPropertyPriority(prop));
	}

	if (sourceNode instanceof HTMLInputElement || sourceNode instanceof HTMLTextAreaElement) {
		targetNode.setAttribute("value", sourceNode.value);
	}

	const sourceChildren = Array.from(sourceNode.children);
	const targetChildren = Array.from(targetNode.children);
	sourceChildren.forEach((sourceChild, idx) => {
		const targetChild = targetChildren[idx];
		if (targetChild) inlineComputedStyles(sourceChild, targetChild);
	});
}

async function exportElementToPng(element, canvas, fileName) {
	const bounds = element.getBoundingClientRect();
	const width = Math.ceil(bounds.width);
	const height = Math.ceil(bounds.height);
	if (width <= 0 || height <= 0) throw new Error("Element has no renderable size");

	const cloned = element.cloneNode(true);
	inlineComputedStyles(element, cloned);
	cloned.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
	cloned.style.width = `${width}px`;
	cloned.style.height = `${height}px`;
	cloned.style.margin = "0";

	const serialized = new XMLSerializer().serializeToString(cloned);
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
			<foreignObject x="0" y="0" width="100%" height="100%">
				${serialized}
			</foreignObject>
		</svg>
	`;
	const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
	const svgUrl = URL.createObjectURL(svgBlob);

	const img = await new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Failed to render element"));
		image.src = svgUrl;
	});
	URL.revokeObjectURL(svgUrl);

	const dpr = window.devicePixelRatio || 1;
	canvas.width = Math.max(1, Math.floor(width * dpr));
	canvas.height = Math.max(1, Math.floor(height * dpr));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas context unavailable");
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.scale(dpr, dpr);
	ctx.drawImage(img, 0, 0, width, height);

	const pngBlob = await new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) reject(new Error("Failed to generate PNG"));
			else resolve(blob);
		}, "image/png");
	});

	downloadBlob(pngBlob, fileName);
}

function HslSliders({ hsl, onChange }) {
	const [h, s, l] = hsl;
	const sliders = [
		{ label: "H", value: h, max: 360, unit: "°", bg: `linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)` },
		{ label: "S", value: s, max: 100, unit: "%", bg: `linear-gradient(to right,${hslToHex(h, 0, l)},${hslToHex(h, 100, l)})` },
		{ label: "L", value: l, max: 100, unit: "%", bg: `linear-gradient(to right,#000,${hslToHex(h, s, 50)},#fff)` },
	];

	return (
		<div className="cp-sliders">
			{sliders.map(({ label, value, max, unit, bg }, i) => (
				<div key={label} className="cp-slider-row">
					<span className="cp-slider-label">{label}</span>
					<div className="cp-slider-track-wrap">
						<input
							type="range" min={0} max={max} value={value}
							onChange={(e) => {
								const next = [...hsl];
								next[i] = Number(e.target.value);
								onChange(next);
							}}
							className="cp-slider"
							style={{ background: bg }}
						/>
					</div>
					<span className="cp-slider-value">{value}{unit}</span>
				</div>
			))}
		</div>
	);
}

function HexInput({ value, onChange }) {
	const [local, setLocal] = useState(value);
	const committed = useRef(value);

	if (committed.current !== value && value !== local) {
		setLocal(value);
		committed.current = value;
	}

	const commit = () => {
		const hex = local.startsWith("#") ? local : `#${local}`;
		if (isValidHex(hex)) {
			const normalized = hex.length === 4
				? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
				: hex;
			onChange(normalized.toUpperCase());
			committed.current = normalized.toUpperCase();
		} else {
			setLocal(committed.current);
		}
	};

	return (
		<input
			type="text" value={local}
			onChange={(e) => setLocal(e.target.value)}
			onBlur={commit}
			onKeyDown={(e) => e.key === "Enter" && commit()}
			className="cp-hex-input"
			maxLength={7}
			spellCheck={false}
		/>
	);
}

function SuggestionChip({ color, onClick }) {
	const textColor = contrastTextColor(color);
	return (
		<button
			type="button"
			className="cp-suggestion-chip"
			style={{ background: color, color: textColor }}
			onClick={() => onClick(color)}
			data-tooltip={`Use ${color}`}
		>
			{color}
		</button>
	);
}

const ColorPaletteStudio = () => {
	const { showToast } = useToast();
	const [strips, setStrips] = useState(DEFAULT_STRIPS);
	const [selectedIdx, setSelectedIdx] = useState(0);
	const [paletteName, setPaletteName] = useState("My Palette");
	const [copiedJson, setCopiedJson] = useState(false);
	const [jsonOpen, setJsonOpen] = useState(true);
	const [previewOpen, setPreviewOpen] = useState(true);
	const [dragIdx, setDragIdx] = useState(null);
	const [dragOverIdx, setDragOverIdx] = useState(null);
	const [jsonDraft, setJsonDraft] = useState("");
	const [jsonError, setJsonError] = useState("");
	const [editingJson, setEditingJson] = useState(false);
	const canvasRef = useRef(null);
	const paletteCardRef = useRef(null);

	const selected = strips[selectedIdx] ?? strips[0];
	const selectedHsl = useMemo(() => hexToHsl(selected.color), [selected.color]);
	const suggestions = useMemo(() => generateSuggestions(selected.color, 2), [selected.color]);
	const stripColorMap = useMemo(() => {
		const map = {};
		strips.forEach((s) => {
			map[s.key.toLowerCase()] = s.color;
		});
		return map;
	}, [strips]);
	const getPreviewColor = useCallback((keys, fallback) => {
		for (const key of keys) {
			const color = stripColorMap[key];
			if (color) return color;
		}
		return fallback;
	}, [stripColorMap]);

	const paletteConfig = useMemo(() => {
		const colorMap = {};
		for (const s of strips) colorMap[s.key] = s.color.toLowerCase();
		return {
			"color-palette": colorMap,
			"palette-name": paletteName,
		};
	}, [strips, paletteName]);

	const paletteJson = useMemo(() => JSON.stringify(paletteConfig, null, 2), [paletteConfig]);
	const extensions = useMemo(() => [jsonLang()], []);

	useEffect(() => {
		if (!editingJson) setJsonDraft(paletteJson);
	}, [paletteJson, editingJson]);

	const updateStripColor = useCallback((idx, color) => {
		setStrips((prev) => prev.map((s, i) => i === idx ? { ...s, color } : s));
	}, []);

	const updateStripKey = useCallback((idx, key) => {
		setStrips((prev) => prev.map((s, i) => i === idx ? { ...s, key, label: key.charAt(0).toUpperCase() + key.slice(1) } : s));
	}, []);

	const addStrip = useCallback(() => {
		const newKey = `color-${strips.length + 1}`;
		setStrips((prev) => [...prev, { key: newKey, label: newKey, color: "#888888" }]);
		setSelectedIdx(strips.length);
	}, [strips.length]);

	const removeStrip = useCallback((idx) => {
		if (strips.length <= 2) return;
		setStrips((prev) => prev.filter((_, i) => i !== idx));
		setSelectedIdx((prev) => Math.min(prev, strips.length - 2));
	}, [strips.length]);

	const handleStripDrop = useCallback((fromIdx, toIdx) => {
		if (fromIdx === toIdx || fromIdx == null || toIdx == null) return;
		setStrips((prev) => {
			const next = [...prev];
			const [moved] = next.splice(fromIdx, 1);
			next.splice(toIdx, 0, moved);
			return next;
		});
		setSelectedIdx((prev) => {
			if (prev === fromIdx) return toIdx;
			if (fromIdx < prev && prev <= toIdx) return prev - 1;
			if (toIdx <= prev && prev < fromIdx) return prev + 1;
			return prev;
		});
	}, []);

	const handleSwatchCopy = useCallback(async (hex) => {
		try {
			await navigator.clipboard.writeText(hex);
			showToast(`Copied ${hex}`);
		} catch { /* */ }
	}, [showToast]);

	const applyPaletteJson = useCallback((rawJson, showSuccess = false) => {
		try {
			const { nextStrips, nextName } = parsePaletteConfigJson(rawJson);
			setStrips(nextStrips);
			setPaletteName(nextName);
			setSelectedIdx((prev) => Math.min(prev, nextStrips.length - 1));
			setJsonError("");
			if (showSuccess) showToast("Palette config applied");
			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Invalid palette config";
			setJsonError(message);
			return false;
		}
	}, [showToast]);

	const handleCopyJson = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(paletteJson);
			setCopiedJson(true);
			showToast("Palette JSON copied");
			setTimeout(() => setCopiedJson(false), 1500);
		} catch { /* */ }
	}, [paletteJson, showToast]);

	const handleExportJson = useCallback(() => {
		const blob = new Blob([paletteJson], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${paletteName.replace(/\s+/g, "-").toLowerCase() || "palette"}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [paletteJson, paletteName]);

	const handleExportPng = useCallback(async () => {
		const fileName = `${paletteName.replace(/\s+/g, "-").toLowerCase() || "palette"}.png`;
		const canvas = canvasRef.current || document.createElement("canvas");
		if (paletteCardRef.current) {
			try {
				await exportElementToPng(paletteCardRef.current, canvas, fileName);
				showToast("Palette card exported");
				return;
			} catch {
				// fallback below
			}
		}

		const stripH = 80;
		const width = 600;
		const height = strips.length * stripH;
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			showToast("Failed to export PNG");
			return;
		}

		strips.forEach((s, i) => {
			const y = i * stripH;
			ctx.fillStyle = s.color;
			ctx.fillRect(0, y, width, stripH);

			const textColor = contrastTextColor(s.color);
			ctx.fillStyle = textColor;
			ctx.globalAlpha = 0.8;
			ctx.font = "bold 13px system-ui, sans-serif";
			ctx.fillText(s.label, 20, y + stripH / 2 - 6);
			ctx.font = "12px monospace";
			ctx.fillText(s.color.toLowerCase(), 20, y + stripH / 2 + 12);
			ctx.globalAlpha = 1;
		});

		canvas.toBlob((blob) => {
			if (!blob) {
				showToast("Failed to export PNG");
				return;
			}
			downloadBlob(blob, fileName);
			showToast("Palette PNG exported");
		}, "image/png");
	}, [paletteName, strips, showToast]);

	const resetPalette = useCallback(() => {
		setStrips(DEFAULT_STRIPS);
		setSelectedIdx(0);
		setPaletteName("My Palette");
	}, []);

	const handleJsonEditorChange = useCallback((value) => {
		setJsonDraft(value);
		applyPaletteJson(value, false);
	}, [applyPaletteJson]);

	const shortcuts = useMemo(() => ({
		copyJson: { mod: true, shift: true, key: "c" },
		exportJson: { mod: true, shift: true, key: "e" },
	}), []);

	useKeyboardShortcuts([
		{ shortcut: shortcuts.copyJson, action: handleCopyJson },
		{ shortcut: shortcuts.exportJson, action: handleExportJson },
	]);

	return (
		<div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
			<div className="cp-toolbar">
				<div className="cp-toolbar-left">
					<input
						type="text"
						value={paletteName}
						onChange={(e) => setPaletteName(e.target.value)}
						className="cp-name-input"
						placeholder="Palette name"
						spellCheck={false}
					/>
				</div>
				<div className="cp-toolbar-right">
					<button type="button" className="toolbar-btn compact" onClick={addStrip} data-tooltip="Add strip">
						<Plus size={14} />
					</button>
					<button type="button" className="toolbar-btn compact" onClick={resetPalette} data-tooltip="Reset palette">
						<RotateCcw size={14} />
					</button>
					<div className="toolbar-divider" />
					<button type="button" className="toolbar-btn compact" onClick={handleCopyJson} data-tooltip={`Copy JSON (${formatShortcut(shortcuts.copyJson)})`}>
						{copiedJson ? <Check size={14} /> : <Copy size={14} />}
					</button>
					<button type="button" className="toolbar-btn compact" onClick={handleExportJson} data-tooltip={`Export JSON (${formatShortcut(shortcuts.exportJson)})`}>
						<Download size={14} />
					</button>
					<button type="button" className="toolbar-btn compact" onClick={handleExportPng} data-tooltip="Export PNG">
						<Image size={14} />
					</button>
				</div>
			</div>

			<div className="cp-studio-shell flex flex-1 min-h-0 overflow-hidden border rounded-xl m-3" style={{ borderColor: "var(--border-color)" }}>
				{/* Palette strips */}
				<div className="cp-strips-panel">
					<div className={`cp-palette-layout ${!previewOpen ? "cp-palette-layout--single" : ""}`}>
						<div ref={paletteCardRef} className="cp-palette-card shadow-md">
							<div className="cp-palette-card-header">
								<div className="cp-palette-header-row">
									<h3 className="cp-palette-title">Palette</h3>
									<button
										type="button"
										className="toolbar-btn compact"
										onClick={() => setPreviewOpen((v) => !v)}
										data-tooltip={previewOpen ? "Hide preview" : "Show preview"}
									>
										{previewOpen ? <EyeOff size={14} /> : <Eye size={14} />}
									</button>
								</div>
								<span className="cp-palette-subtitle">{paletteName || "Untitled Palette"}</span>
							</div>
							<div className="cp-strips-stack">
								{strips.map((s, i) => {
									const textColor = contrastTextColor(s.color);
									const isActive = selectedIdx === i;
									const isDragging = dragIdx === i;
									const isDropTarget = dragOverIdx === i && dragIdx !== i;
									return (
										<button
											key={`${s.key}-${i}`}
											type="button"
											className={`cp-strip ${isActive ? "cp-strip--active" : ""} ${isDragging ? "cp-strip--dragging" : ""} ${isDropTarget ? "cp-strip--drop-target" : ""}`}
											style={{ background: s.color, color: textColor }}
											onClick={() => setSelectedIdx(i)}
											draggable
											onDragStart={(e) => {
												e.dataTransfer.effectAllowed = "move";
												e.dataTransfer.setData("text/plain", String(i));
												setDragIdx(i);
											}}
											onDragOver={(e) => {
												e.preventDefault();
												setDragOverIdx(i);
											}}
											onDrop={(e) => {
												e.preventDefault();
												handleStripDrop(dragIdx, i);
												setDragIdx(null);
												setDragOverIdx(null);
											}}
											onDragEnd={() => {
												setDragIdx(null);
												setDragOverIdx(null);
											}}
										>
											<span className="cp-strip-grip" aria-hidden="true">
												<GripVertical size={14} />
											</span>
											<span className="cp-strip-label">{s.label}</span>
											<span className="cp-strip-hex">{s.color}</span>
										</button>
									);
								})}
							</div>
						</div>
						{previewOpen && (
							<div className="cp-app-preview">
								<div className="cp-app-preview-header">
									<span className="cp-app-preview-title">Preview Mode</span>
								</div>
								<div
									className="cp-app-frame"
									style={{
										background: getPreviewColor(["bg", "background"], "#0E090D"),
										color: getPreviewColor(["text"], "#FFFFFF"),
									}}
								>
									<div
										className="cp-app-topbar"
										style={{
											background: getPreviewColor(["surface"], "#1D171E"),
											borderColor: getPreviewColor(["border"], "#28202D"),
										}}
									>
										<div className="cp-app-brand">{paletteName || "App Preview"}</div>
										<div className="cp-app-dots">
											<span style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
											<span style={{ background: getPreviewColor(["accent"], "#AEB784") }} />
											<span style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
										</div>
									</div>
									<div className="cp-app-body">
										<aside
											className="cp-app-sidebar"
											style={{
												background: getPreviewColor(["surface"], "#1D171E"),
												borderColor: getPreviewColor(["border"], "#28202D"),
											}}
										>
											<div className="cp-app-skeleton cp-app-skeleton--title" style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
											<div className="cp-app-skeleton" style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
											<div className="cp-app-skeleton" style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
											<div className="cp-app-skeleton cp-app-skeleton--short" style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
										</aside>
										<main className="cp-app-main">
											<div
												className="cp-app-card"
												style={{
													background: getPreviewColor(["surface"], "#1D171E"),
													borderColor: getPreviewColor(["border"], "#28202D"),
												}}
											>
												<div className="cp-app-skeleton cp-app-skeleton--heading" style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
												<div className="cp-app-skeleton" style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
												<div className="cp-app-skeleton cp-app-skeleton--short" style={{ background: getPreviewColor(["muted"], "#F4F6FB") }} />
												<button
													type="button"
													className="cp-app-cta"
													style={{ background: getPreviewColor(["accent"], "#AEB784"), color: contrastTextColor(getPreviewColor(["accent"], "#AEB784")) }}
												>
													Action
												</button>
											</div>
										</main>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Tools panel */}
				<aside className="cp-tools">
					<div className="cp-tools-section">
						<div className="cp-tools-header">
							<div className="cp-swatch cp-swatch--preview" style={{ background: selected.color }} />
							<div className="cp-tools-header-text">
								<input
									type="text"
									value={selected.key}
									onChange={(e) => updateStripKey(selectedIdx, e.target.value)}
									className="cp-key-input"
									spellCheck={false}
								/>
							</div>
							{strips.length > 2 && (
								<button type="button" className="cp-reset-btn" onClick={() => removeStrip(selectedIdx)} data-tooltip="Remove strip">
									<Trash2 size={13} />
								</button>
							)}
						</div>

						<HexInput value={selected.color} onChange={(hex) => updateStripColor(selectedIdx, hex)} />

						<div className="cp-native-picker-row">
							<input
								type="color"
								value={selected.color}
								onChange={(e) => updateStripColor(selectedIdx, e.target.value.toUpperCase())}
								className="cp-native-picker"
							/>
							<span className="cp-native-picker-label">Pick Color</span>
						</div>

						<HslSliders
							hsl={selectedHsl}
							onChange={(nextHsl) => updateStripColor(selectedIdx, hslToHex(...nextHsl))}
						/>
					</div>

					<div className="cp-tools-section">
						<span className="cp-section-title">Suggestions</span>
						<div className="cp-suggestions-row">
							<span className="cp-sug-label">Lighter</span>
							<div className="cp-sug-chips">
								{suggestions.lighter.map((c) => (
									<SuggestionChip key={c} color={c} onClick={(hex) => updateStripColor(selectedIdx, hex)} />
								))}
							</div>
						</div>
						<div className="cp-suggestions-row">
							<span className="cp-sug-label">Darker</span>
							<div className="cp-sug-chips">
								{suggestions.darker.map((c) => (
									<SuggestionChip key={c} color={c} onClick={(hex) => updateStripColor(selectedIdx, hex)} />
								))}
							</div>
						</div>
					</div>

					<div className="cp-tools-section cp-tools-section--json">
						<div className="cp-section-title-row">
							<button
								type="button"
								className="cp-section-title cp-section-title--toggle"
								onClick={() => setJsonOpen((v) => !v)}
							>
								JSON Config
							</button>
							<button
								type="button" className="toolbar-btn compact"
								onClick={(e) => { e.stopPropagation(); handleSwatchCopy(paletteJson); }}
								data-tooltip="Copy JSON"
							>
								<Copy size={12} />
							</button>
							<button
								type="button" className="toolbar-btn compact"
								onClick={() => applyPaletteJson(jsonDraft, true)}
								data-tooltip="Apply pasted config"
							>
								<Check size={12} />
							</button>
						</div>
						{jsonOpen && (
							<div className="cp-json-editor">
								<CodeMirror
									value={jsonDraft}
									height="216px"
									extensions={extensions}
									basicSetup={{ lineNumbers: true, foldGutter: true }}
									onChange={handleJsonEditorChange}
									onFocus={() => setEditingJson(true)}
									onBlur={() => setEditingJson(false)}
								/>
							</div>
						)}
						{jsonError && <div className="cp-json-error">{jsonError}</div>}
					</div>
				</aside>
			</div>
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
};

export default ColorPaletteStudio;
