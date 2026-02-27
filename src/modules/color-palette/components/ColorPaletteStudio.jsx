import { useState, useMemo, useCallback, useRef } from "react";
import { Copy, Check, Download, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json as jsonLang } from "@codemirror/lang-json";
import { useToast } from "../../../shared/components/ToastProvider";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";
import {
	hexToHsl, hslToHex, isValidHex, contrastTextColor,
	buildPalette, generateComplementary, generateAccent,
	deriveSurface, deriveBackground, deriveShadow,
} from "../utils/colorUtils";

const STEP_OPTIONS = [3, 5, 7];
const ROLE_META = [
	{ key: "primary",    label: "Primary",    autoDerive: null },
	{ key: "secondary",  label: "Secondary",  autoDerive: generateComplementary },
	{ key: "surface",    label: "Surface",    autoDerive: deriveSurface },
	{ key: "background", label: "Background", autoDerive: deriveBackground },
	{ key: "accent",     label: "Accent",     autoDerive: generateAccent },
	{ key: "shadow",     label: "Shadow",     autoDerive: deriveShadow },
];

function HslSliders({ hsl, onChange }) {
	const [h, s, l] = hsl;
	const sliders = [
		{ label: "H", value: h, max: 360, unit: "°", bg: `linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)` },
		{ label: "S", value: s, max: 100, unit: "%", bg: `linear-gradient(to right, ${hslToHex(h, 0, l)}, ${hslToHex(h, 100, l)})` },
		{ label: "L", value: l, max: 100, unit: "%", bg: `linear-gradient(to right, #000, ${hslToHex(h, s, 50)}, #fff)` },
	];

	return (
		<div className="cp-sliders">
			{sliders.map(({ label, value, max, unit, bg }, i) => (
				<div key={label} className="cp-slider-row">
					<span className="cp-slider-label">{label}</span>
					<div className="cp-slider-track-wrap">
						<input
							type="range"
							min={0}
							max={max}
							value={value}
							onChange={(e) => {
								const v = Number(e.target.value);
								const next = [...hsl];
								next[i] = v;
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
			type="text"
			value={local}
			onChange={(e) => setLocal(e.target.value)}
			onBlur={commit}
			onKeyDown={(e) => e.key === "Enter" && commit()}
			className="cp-hex-input"
			maxLength={7}
			spellCheck={false}
		/>
	);
}

function Swatch({ color, size = "md", onClick }) {
	const textColor = contrastTextColor(color);
	return (
		<button
			type="button"
			className={`cp-swatch cp-swatch--${size}`}
			style={{ background: color, color: textColor }}
			onClick={() => onClick?.(color)}
			data-tooltip={color}
		>
			{size === "md" && <span className="cp-swatch-label">{color}</span>}
		</button>
	);
}

function RoleRow({ role, shades, onSwatchClick }) {
	return (
		<div className="cp-role-row">
			<span className="cp-role-label">{role}</span>
			<div className="cp-shades">
				{shades.map((hex, i) => (
					<Swatch key={`${hex}-${i}`} color={hex} onClick={onSwatchClick} />
				))}
			</div>
		</div>
	);
}

const ColorPaletteStudio = () => {
	const { showToast } = useToast();
	const [steps, setSteps] = useState(5);
	const [primaryHsl, setPrimaryHsl] = useState([220, 70, 50]);
	const [overrides, setOverrides] = useState({});
	const [jsonOpen, setJsonOpen] = useState(false);
	const [copiedJson, setCopiedJson] = useState(false);

	const primaryHex = useMemo(() => hslToHex(...primaryHsl), [primaryHsl]);

	const palette = useMemo(
		() => buildPalette(primaryHex, steps, overrides),
		[primaryHex, steps, overrides],
	);

	const paletteJson = useMemo(
		() => JSON.stringify(palette, null, 2),
		[palette],
	);

	const extensions = useMemo(() => [jsonLang()], []);

	const handleSwatchClick = useCallback(async (hex) => {
		try {
			await navigator.clipboard.writeText(hex);
			showToast(`Copied ${hex}`);
		} catch { /* clipboard not available */ }
	}, [showToast]);

	const handleExport = useCallback(() => {
		const blob = new Blob([paletteJson], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "palette.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [paletteJson]);

	const handleCopyJson = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(paletteJson);
			setCopiedJson(true);
			showToast("Palette JSON copied");
			setTimeout(() => setCopiedJson(false), 1500);
		} catch { /* clipboard not available */ }
	}, [paletteJson, showToast]);

	const handleOverride = useCallback((roleKey, hex) => {
		setOverrides((prev) => ({ ...prev, [roleKey]: hex }));
	}, []);

	const clearOverride = useCallback((roleKey) => {
		setOverrides((prev) => {
			const next = { ...prev };
			delete next[roleKey];
			return next;
		});
	}, []);

	const handlePrimaryHexChange = useCallback((hex) => {
		setPrimaryHsl(hexToHsl(hex));
	}, []);

	const shortcuts = useMemo(() => ({
		copyJson: { mod: true, shift: true, key: "c" },
		exportJson: { mod: true, shift: true, key: "e" },
	}), []);

	useKeyboardShortcuts([
		{ shortcut: shortcuts.copyJson, action: handleCopyJson },
		{ shortcut: shortcuts.exportJson, action: handleExport },
	]);

	return (
		<div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
			<div className="cp-toolbar">
				<div className="cp-toolbar-left">
					<span className="cp-toolbar-label">Steps</span>
					<div className="cp-step-group">
						{STEP_OPTIONS.map((n) => (
							<button
								key={n}
								type="button"
								className={`cp-step-btn ${steps === n ? "cp-step-btn--active" : ""}`}
								onClick={() => setSteps(n)}
							>
								{n}
							</button>
						))}
					</div>
				</div>
				<div className="cp-toolbar-right">
					<button type="button" className="toolbar-btn compact" onClick={handleCopyJson} data-tooltip={`Copy JSON (${formatShortcut(shortcuts.copyJson)})`}>
						{copiedJson ? <Check size={14} /> : <Copy size={14} />}
					</button>
					<button type="button" className="toolbar-btn compact" onClick={handleExport} data-tooltip={`Export JSON (${formatShortcut(shortcuts.exportJson)})`}>
						<Download size={14} />
					</button>
				</div>
			</div>

			<div className="flex flex-1 min-h-0 overflow-hidden border rounded-xl m-3" style={{ borderColor: "var(--border-color)" }}>
				<aside className="cp-sidebar">
					<div className="cp-sidebar-section">
						<div className="cp-role-header">
							<div className="cp-swatch cp-swatch--preview" style={{ background: primaryHex }} />
							<span>Primary</span>
						</div>
						<HexInput value={primaryHex} onChange={handlePrimaryHexChange} />
						<HslSliders hsl={primaryHsl} onChange={setPrimaryHsl} />
					</div>

					{ROLE_META.filter((r) => r.key !== "primary").map(({ key, label, autoDerive }) => {
						const hasOverride = key in overrides;
						const baseHex = hasOverride ? overrides[key] : autoDerive(primaryHex);
						const hsl = hexToHsl(baseHex);

						return (
							<div key={key} className="cp-sidebar-section">
								<div className="cp-role-header">
									<div className="cp-swatch cp-swatch--preview" style={{ background: baseHex }} />
									<span>{label}</span>
									{hasOverride && (
										<button
											type="button"
											className="cp-reset-btn"
											onClick={() => clearOverride(key)}
											data-tooltip="Reset to auto"
										>
											<RotateCcw size={12} />
										</button>
									)}
									<span className={`cp-auto-badge ${hasOverride ? "cp-auto-badge--manual" : ""}`}>
										{hasOverride ? "manual" : "auto"}
									</span>
								</div>
								<HexInput
									value={baseHex}
									onChange={(hex) => handleOverride(key, hex)}
								/>
								<HslSliders
									hsl={hsl}
									onChange={(nextHsl) => handleOverride(key, hslToHex(...nextHsl))}
								/>
							</div>
						);
					})}
				</aside>

				<div className="cp-main">
					<div className="cp-palette-grid">
						{Object.entries(palette.roles).map(([role, { shades }]) => (
							<RoleRow
								key={role}
								role={role}
								shades={shades}
								onSwatchClick={handleSwatchClick}
							/>
						))}
					</div>

					<div className="cp-json-section">
						<button
							type="button"
							className="cp-json-toggle"
							onClick={() => setJsonOpen((v) => !v)}
						>
							{jsonOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
							<span>JSON Output</span>
						</button>
						{jsonOpen && (
							<div className="cp-json-editor">
								<CodeMirror
									value={paletteJson}
									height="220px"
									readOnly
									extensions={extensions}
									basicSetup={{ lineNumbers: true, foldGutter: true }}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ColorPaletteStudio;
