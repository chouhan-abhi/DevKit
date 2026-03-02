import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
	Plus, Trash2, Pencil, Copy, Check, Eye, EyeOff, X,
	RefreshCw, Info, Shield, Search, Download, Upload,
} from "lucide-react";
import { useToast } from "../../../shared/components/ToastProvider";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";
import {
	parseBrowserCookies, parseCookieString, setCookie, deleteCookie,
	tryDecodeAll, encodeCookieValue, formatSetCookieHeader, hasCookieStoreAPI,
	cookieByteSize, formatByteSize, totalCookieSize, exportCookiesJson,
	importCookiesJson, getDomainInfo,
} from "../utils/cookieUtils";

const SAME_SITE_OPTIONS = ["", "Strict", "Lax", "None"];
const ENCODING_OPTIONS = [
	{ value: "raw", label: "Raw" },
	{ value: "base64", label: "Base64" },
	{ value: "url", label: "URL Encode" },
];

const EMPTY_FORM = {
	name: "", value: "", path: "/", domain: "",
	expires: "", secure: false, sameSite: "Lax", maxAge: "",
};

const safeDecode = (value) => {
	try { return decodeURIComponent(value); } catch { return value; }
};

const withCookiePrefix = (source, output) => (source.trim().toLowerCase().startsWith("cookie:") ? `Cookie: ${output}` : output);

function decodeCookieString(input) {
	const parsed = parseCookieString(input);
	if (parsed.length === 0) return safeDecode(input);
	const decoded = parsed
		.map(({ name, value }) => `${safeDecode(name)}=${safeDecode(value)}`)
		.join("; ");
	return withCookiePrefix(input, decoded);
}

function encodeCookieString(input) {
	const parsed = parseCookieString(input);
	if (parsed.length === 0) return encodeURIComponent(input);
	const encoded = parsed
		.map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
		.join("; ");
	return withCookiePrefix(input, encoded);
}

function CookieForm({ initial = EMPTY_FORM, onSave, onCancel, isNew }) {
	const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
	const nameRef = useRef(null);

	useEffect(() => { nameRef.current?.focus(); }, []);

	const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

	return (
		<div className="ck-form">
			<div className="ck-form-grid">
				<label className="ck-field">
					<span>Name</span>
					<input ref={nameRef} value={form.name} onChange={(e) => set("name", e.target.value)} readOnly={!isNew} className={!isNew ? "ck-input--readonly" : ""} spellCheck={false} />
				</label>
				<label className="ck-field">
					<span>Value</span>
					<input value={form.value} onChange={(e) => set("value", e.target.value)} spellCheck={false} />
				</label>
				<label className="ck-field">
					<span>Path</span>
					<input value={form.path} onChange={(e) => set("path", e.target.value)} />
				</label>
				<label className="ck-field">
					<span>Domain</span>
					<input value={form.domain} onChange={(e) => set("domain", e.target.value)} placeholder={window.location.hostname} />
				</label>
				<label className="ck-field">
					<span>Expires</span>
					<input type="datetime-local" value={form.expires} onChange={(e) => set("expires", e.target.value)} />
				</label>
				<label className="ck-field">
					<span>Max-Age (s)</span>
					<input type="number" value={form.maxAge} onChange={(e) => set("maxAge", e.target.value)} placeholder="seconds" />
				</label>
				<label className="ck-field ck-field--inline">
					<input type="checkbox" checked={form.secure} onChange={(e) => set("secure", e.target.checked)} />
					<span>Secure</span>
				</label>
				<label className="ck-field">
					<span>SameSite</span>
					<select value={form.sameSite} onChange={(e) => set("sameSite", e.target.value)}>
						{SAME_SITE_OPTIONS.map((o) => <option key={o} value={o}>{o || "(none)"}</option>)}
					</select>
				</label>
			</div>
			<div className="ck-form-actions">
				<button type="button" className="toolbar-btn" onClick={() => onSave(form)}>
					<Check size={14} /> {isNew ? "Add Cookie" : "Update Cookie"}
				</button>
				<button type="button" className="toolbar-btn" onClick={onCancel}>
					<X size={14} /> Cancel
				</button>
			</div>
		</div>
	);
}

function DecodedView({ value }) {
	const decoded = useMemo(() => tryDecodeAll(value), [value]);
	const size = useMemo(() => formatByteSize(new Blob([value]).size), [value]);

	return (
		<div className="ck-decoded">
			<div className="flex items-center gap-1.5 flex-wrap mb-1">
				<span className="ck-size-badge">{size}</span>
				{decoded.detectedTypes.map((type) => (
					<span key={type} className="ck-detect-badge">{type.toUpperCase()}</span>
				))}
				{decoded.detectedTypes.length === 0 && (
					<span className="text-[10px] italic" style={{ color: "var(--text-muted)" }}>plain text</span>
				)}
			</div>

			{decoded.urlDecoded && decoded.urlDecoded !== value && (
				<div className="ck-decoded-row">
					<span className="ck-decoded-label">URL Decoded</span>
					<pre className="ck-decoded-value">{decoded.urlDecoded}</pre>
				</div>
			)}

			{decoded.base64Decoded && (
				<div className="ck-decoded-row">
					<span className="ck-decoded-label">Base64 Decoded</span>
					<pre className="ck-decoded-value">{decoded.base64Decoded}</pre>
				</div>
			)}

			{decoded.jsonPretty && (
				<div className="ck-decoded-row">
					<span className="ck-decoded-label">JSON (Pretty-printed)</span>
					<pre className="ck-decoded-value">{decoded.jsonPretty}</pre>
				</div>
			)}

			{decoded.jwt && (
				<div className="ck-decoded-row">
					<div className="flex items-center gap-2 mb-1">
						<span className="ck-decoded-label">JWT Token</span>
						{decoded.jwt.expiryInfo?.expiresAt && (
							<span className={`ck-jwt-expiry ${decoded.jwt.expiryInfo.isExpired ? "ck-jwt-expiry--expired" : "ck-jwt-expiry--valid"}`}>
								{decoded.jwt.expiryInfo.isExpired ? "Expired" : `Valid \u00b7 ${decoded.jwt.expiryInfo.timeRemaining}`}
							</span>
						)}
					</div>
					<details className="mb-1">
						<summary className="ck-jwt-summary">
							Header ({decoded.jwt.header.alg || "?"})
						</summary>
						<pre className="ck-decoded-value">{JSON.stringify(decoded.jwt.header, null, 2)}</pre>
					</details>
					<details open className="mb-1">
						<summary className="ck-jwt-summary">Payload</summary>
						<pre className="ck-decoded-value">{JSON.stringify(decoded.jwt.payload, null, 2)}</pre>
					</details>
					{decoded.jwt.expiryInfo?.issuedAt && (
						<div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
							Issued: {new Date(decoded.jwt.expiryInfo.issuedAt).toLocaleString()}
							{decoded.jwt.expiryInfo.expiresAt && ` \u00b7 Expires: ${new Date(decoded.jwt.expiryInfo.expiresAt).toLocaleString()}`}
						</div>
					)}
				</div>
			)}

			{decoded.nestedBase64 && (
				<div className="ck-decoded-row">
					<span className="ck-decoded-label">Nested (URL → Base64)</span>
					<pre className="ck-decoded-value">{decoded.nestedBase64}</pre>
				</div>
			)}

			{decoded.detectedTypes.length === 0 && (
				<div className="ck-decoded-empty">No alternate decodings found.</div>
			)}
		</div>
	);
}

function LiveCookiesTab() {
	const { showToast } = useToast();
	const [cookies, setCookies] = useState(() => parseBrowserCookies());
	const [editingName, setEditingName] = useState(null);
	const [addingNew, setAddingNew] = useState(false);
	const [decodingName, setDecodingName] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [showImport, setShowImport] = useState(false);
	const [importText, setImportText] = useState("");
	const [importError, setImportError] = useState(null);

	const domainInfo = useMemo(() => getDomainInfo(), []);

	const refresh = useCallback(() => setCookies(parseBrowserCookies()), []);

	useEffect(() => {
		if (hasCookieStoreAPI()) {
			const handler = () => refresh();
			window.cookieStore.addEventListener("change", handler);
			return () => window.cookieStore.removeEventListener("change", handler);
		}
		const id = setInterval(refresh, 2000);
		return () => clearInterval(id);
	}, [refresh]);

	const filteredCookies = useMemo(() => {
		if (!searchQuery.trim()) return cookies;
		const q = searchQuery.toLowerCase();
		return cookies.filter((c) =>
			c.name.toLowerCase().includes(q) || c.value.toLowerCase().includes(q),
		);
	}, [cookies, searchQuery]);

	const handleDelete = (name) => {
		deleteCookie(name);
		refresh();
		showToast(`Cookie "${name}" deleted`);
	};

	const handleSave = (form) => {
		setCookie(form);
		setEditingName(null);
		setAddingNew(false);
		refresh();
		showToast(`Cookie "${form.name}" saved`);
	};

	const handleCopy = async (name, value) => {
		try {
			await navigator.clipboard.writeText(`${name}=${value}`);
			showToast("Cookie copied");
		} catch {
			showToast("Failed to copy cookie");
		}
	};

	const handleExport = () => {
		const json = exportCookiesJson(cookies);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `cookies-${domainInfo.hostname}-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
		showToast(`Exported ${cookies.length} cookies`);
	};

	const handleImport = () => {
		const parsed = importCookiesJson(importText);
		if (!parsed) {
			setImportError('Invalid JSON. Expected: [{"name": "...", "value": "..."}]');
			return;
		}
		for (const c of parsed) {
			setCookie({ name: c.name, value: c.value, path: c.path || "/" });
		}
		refresh();
		setShowImport(false);
		setImportText("");
		setImportError(null);
		showToast(`Imported ${parsed.length} cookies`);
	};

	const handleDeleteAll = () => {
		for (const c of cookies) deleteCookie(c.name);
		refresh();
		showToast(`Deleted ${cookies.length} cookies`);
	};

	const shortcuts = useMemo(() => ({
		addCookie: { mod: true, shift: true, key: "a" },
	}), []);

	useKeyboardShortcuts([
		{ shortcut: shortcuts.addCookie, action: () => setAddingNew(true) },
	]);

	return (
		<div className="ck-live">
			<div className="ck-live-header">
				<div className="ck-live-info">
					<Info size={13} />
					<span>
						{filteredCookies.length}{searchQuery ? ` of ${cookies.length}` : ""} cookie{cookies.length !== 1 ? "s" : ""} for{" "}
						<strong>{domainInfo.hostname}{domainInfo.port ? `:${domainInfo.port}` : ""}</strong>
					</span>
					<span className="ck-badge">{hasCookieStoreAPI() ? "Live" : "Polling"}</span>
					{domainInfo.isLocalhost && <span className="ck-badge ck-badge--localhost">Localhost</span>}
					{cookies.length > 0 && (
						<span className="ck-size-badge">{formatByteSize(totalCookieSize(cookies))}</span>
					)}
				</div>
				<div className="ck-live-actions">
					<div className="relative">
						<Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Filter cookies..."
							className="ck-search-input"
						/>
					</div>
					<button type="button" className="toolbar-btn compact" onClick={handleExport} data-tooltip="Export JSON" disabled={cookies.length === 0}>
						<Download size={14} />
					</button>
					<button type="button" className="toolbar-btn compact" onClick={() => { setShowImport((v) => !v); setImportError(null); }} data-tooltip="Import JSON">
						<Upload size={14} />
					</button>
					{cookies.length > 0 && (
						<button type="button" className="toolbar-btn compact" onClick={handleDeleteAll} data-tooltip="Delete all">
							<Trash2 size={14} />
						</button>
					)}
					<button type="button" className="toolbar-btn compact" onClick={refresh} data-tooltip="Refresh">
						<RefreshCw size={14} />
					</button>
					<button type="button" className="toolbar-btn" onClick={() => { setAddingNew(true); setEditingName(null); }} data-tooltip={`Add cookie (${formatShortcut(shortcuts.addCookie)})`}>
						<Plus size={14} /> Add
					</button>
				</div>
			</div>

			<div className="ck-info-banner">
				<Shield size={13} />
				<span>
					HttpOnly cookies are not accessible via JavaScript and won&apos;t appear here.
					{domainInfo.isLocalhost && " You\u2019re on localhost \u2014 cookies set by your dev server are shown above."}
				</span>
			</div>

			{showImport && (
				<div className="ck-form">
					<div className="flex items-center justify-between mb-2">
						<span className="ck-encode-label">Import Cookies (JSON)</span>
						<button type="button" className="toolbar-btn compact" onClick={() => { setShowImport(false); setImportError(null); }}>
							<X size={14} />
						</button>
					</div>
					<textarea
						className="ck-textarea"
						rows={5}
						value={importText}
						onChange={(e) => { setImportText(e.target.value); setImportError(null); }}
						placeholder={'[\n  { "name": "session", "value": "abc123" },\n  { "name": "theme", "value": "dark" }\n]'}
						spellCheck={false}
					/>
					{importError && <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{importError}</p>}
					<div className="ck-form-actions mt-2">
						<button type="button" className="toolbar-btn" onClick={handleImport}>
							<Upload size={14} /> Import
						</button>
					</div>
				</div>
			)}

			{addingNew && (
				<CookieForm isNew onSave={handleSave} onCancel={() => setAddingNew(false)} />
			)}

			{filteredCookies.length === 0 && !addingNew ? (
				<div className="ck-empty">
					{searchQuery ? "No cookies match your filter." : "No cookies found for this domain."}
				</div>
			) : (
				<div className="ck-table-wrap">
					<table className="ck-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Value</th>
								<th style={{ width: 60 }}>Size</th>
								<th style={{ width: 180 }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredCookies.map((c) => (
								<CookieRow
									key={c.name}
									cookie={c}
									isEditing={editingName === c.name}
									isDecoding={decodingName === c.name}
									onEdit={() => { setEditingName(c.name); setAddingNew(false); }}
									onCancelEdit={() => setEditingName(null)}
									onSave={handleSave}
									onDelete={() => handleDelete(c.name)}
									onCopy={() => handleCopy(c.name, c.value)}
									onToggleDecode={() => setDecodingName((p) => p === c.name ? null : c.name)}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

function CookieRow({ cookie, isEditing, isDecoding, onEdit, onCancelEdit, onSave, onDelete, onCopy, onToggleDecode }) {
	const size = useMemo(() => formatByteSize(cookieByteSize(cookie.name, cookie.value)), [cookie.name, cookie.value]);
	const [showFull, setShowFull] = useState(false);
	const isLong = cookie.value.length > 60;

	return (
		<>
			<tr className={isEditing ? "ck-row--editing" : ""}>
				<td className="ck-cell-name" data-label="Name">{cookie.name}</td>
				<td className="ck-cell-value" data-label="Value">
					<span className="ck-value-text">
						{isLong && !showFull ? `${cookie.value.slice(0, 60)}\u2026` : cookie.value}
					</span>
					{isLong && (
						<button type="button" className="ck-value-toggle" onClick={() => setShowFull((v) => !v)}>
							{showFull ? "less" : "more"}
						</button>
					)}
				</td>
				<td className="ck-cell-size" data-label="Size">{size}</td>
				<td className="ck-cell-actions" data-label="Actions">
					<button type="button" className="toolbar-btn compact" onClick={onEdit} data-tooltip="Edit"><Pencil size={13} /></button>
					<button type="button" className="toolbar-btn compact" onClick={onToggleDecode} data-tooltip={isDecoding ? "Hide decoded" : "Decode"}>
						{isDecoding ? <EyeOff size={13} /> : <Eye size={13} />}
					</button>
					<button type="button" className="toolbar-btn compact" onClick={onCopy} data-tooltip="Copy"><Copy size={13} /></button>
					<button type="button" className="toolbar-btn compact" onClick={onDelete} data-tooltip="Delete"><Trash2 size={13} /></button>
				</td>
			</tr>
			{isDecoding && (
				<tr className="ck-row-detail"><td colSpan={4}><DecodedView value={cookie.value} /></td></tr>
			)}
			{isEditing && (
				<tr className="ck-row-detail"><td colSpan={4}><CookieForm initial={{ ...EMPTY_FORM, name: cookie.name, value: cookie.value }} onSave={onSave} onCancel={onCancelEdit} /></td></tr>
			)}
		</>
	);
}

function ParsedCookieCard({ cookie, onSaveToBrowser }) {
	const { showToast } = useToast();
	const [editing, setEditing] = useState(false);
	const [editValue, setEditValue] = useState(cookie.value);
	const [expanded, setExpanded] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(`${cookie.name}=${cookie.value}`);
			showToast("Cookie copied");
		} catch {
			showToast("Failed to copy cookie");
		}
	};

	const handleSave = () => {
		onSaveToBrowser({ name: cookie.name, value: editValue, path: "/" });
		setEditing(false);
		showToast(`"${cookie.name}" saved to browser`);
	};

	return (
		<div className="ck-parsed-card">
			<div className="ck-parsed-card-header">
				<span className="ck-cell-name">{cookie.name}</span>
				<div className="ck-parsed-card-actions">
					<button type="button" className="toolbar-btn compact" onClick={() => setExpanded((v) => !v)} data-tooltip={expanded ? "Collapse" : "Expand"}>
						{expanded ? <EyeOff size={13} /> : <Eye size={13} />}
					</button>
					<button type="button" className="toolbar-btn compact" onClick={() => { setEditing(true); setEditValue(cookie.value); }} data-tooltip="Edit">
						<Pencil size={13} />
					</button>
					<button type="button" className="toolbar-btn compact" onClick={handleCopy} data-tooltip="Copy">
						<Copy size={13} />
					</button>
					<button type="button" className="toolbar-btn compact" onClick={handleSave} data-tooltip="Save to browser">
						<Plus size={13} />
					</button>
				</div>
			</div>

			<div className="ck-parsed-card-value">
				<code className="ck-code">{cookie.value.length > 80 ? `${cookie.value.slice(0, 80)}\u2026` : cookie.value}</code>
			</div>

			{editing && (
				<div className="ck-parsed-card-edit">
					<textarea
						className="ck-textarea"
						rows={3}
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						spellCheck={false}
					/>
					<div className="ck-form-actions">
						<button type="button" className="toolbar-btn" onClick={handleSave}>
							<Check size={14} /> Save to Browser
						</button>
						<button type="button" className="toolbar-btn" onClick={() => setEditing(false)}>
							<X size={14} /> Cancel
						</button>
					</div>
				</div>
			)}

			{expanded && <DecodedView value={cookie.value} />}
		</div>
	);
}

function EncodeDecodeTab() {
	const { showToast } = useToast();
	const [encodedInput, setEncodedInput] = useState("");
	const [decodedInput, setDecodedInput] = useState("");
	const parsed = useMemo(() => parseCookieString(encodedInput), [encodedInput]);

	const [craftName, setCraftName] = useState("");
	const [craftValue, setCraftValue] = useState("");
	const [craftEncoding, setCraftEncoding] = useState("raw");
	const [craftPath, setCraftPath] = useState("/");
	const [craftSecure, setCraftSecure] = useState(false);
	const [craftSameSite, setCraftSameSite] = useState("Lax");

	const encodedValue = useMemo(
		() => encodeCookieValue(craftValue, craftEncoding),
		[craftValue, craftEncoding],
	);

	const setCookieHeader = useMemo(
		() => formatSetCookieHeader({
			name: craftName || "name",
			value: encodedValue,
			path: craftPath,
			secure: craftSecure,
			sameSite: craftSameSite,
		}),
		[craftName, encodedValue, craftPath, craftSecure, craftSameSite],
	);

	const handleSaveToBrowser = (cookieData) => {
		setCookie(cookieData);
		showToast(`"${cookieData.name}" saved to browser`);
	};

	const handleEncodedChange = (value) => {
		setEncodedInput(value);
		setDecodedInput(decodeCookieString(value));
	};

	const handleDecodedChange = (value) => {
		setDecodedInput(value);
		setEncodedInput(encodeCookieString(value));
	};

	const copyToClipboard = async (text, label) => {
		try {
			await navigator.clipboard.writeText(text);
			showToast(`${label} copied`);
		} catch {
			showToast(`Failed to copy ${label.toLowerCase()}`);
		}
	};

	const saveCraftedToBrowser = () => {
		if (!craftName) { showToast("Cookie name is required"); return; }
		setCookie({ name: craftName, value: encodedValue, path: craftPath, secure: craftSecure, sameSite: craftSameSite });
		showToast(`"${craftName}" saved to browser`);
	};

	return (
		<div className="ck-encode">
			<div className="ck-encode-dual">
				<div className="ck-encode-section">
					<div className="ck-encode-row-head">
						<label className="ck-encode-label">Encoded Cookie String</label>
						<button type="button" className="toolbar-btn compact" onClick={() => copyToClipboard(encodedInput, "Encoded string")} data-tooltip="Copy encoded">
							<Copy size={14} />
						</button>
					</div>
					<textarea
						className="ck-textarea"
						rows={5}
						value={encodedInput}
						onChange={(e) => handleEncodedChange(e.target.value)}
						placeholder={"Paste encoded cookie string\ne.g. Cookie: session=eyJhbGciOi...; theme=dark"}
						spellCheck={false}
					/>
				</div>
				<div className="ck-encode-section">
					<div className="ck-encode-row-head">
						<label className="ck-encode-label">Decoded Cookie String (Editable)</label>
						<button type="button" className="toolbar-btn compact" onClick={() => copyToClipboard(decodedInput, "Decoded string")} data-tooltip="Copy decoded">
							<Copy size={14} />
						</button>
					</div>
					<textarea
						className="ck-textarea"
						rows={5}
						value={decodedInput}
						onChange={(e) => handleDecodedChange(e.target.value)}
						placeholder="Decoded view updates live so you can edit readable cookie values"
						spellCheck={false}
					/>
				</div>
			</div>

			{parsed.length > 0 && (
				<div className="ck-parsed-list">
					<div className="ck-encode-label">Parsed Cookies ({parsed.length})</div>
					{parsed.map((c, i) => (
						<ParsedCookieCard
							key={`${c.name}-${i}`}
							cookie={c}
							onSaveToBrowser={handleSaveToBrowser}
						/>
					))}
				</div>
			)}

			<div className="ck-craft">
				<h3 className="ck-craft-title">Craft a Cookie</h3>
				<div className="ck-craft-grid">
					<label className="ck-field">
						<span>Name</span>
						<input value={craftName} onChange={(e) => setCraftName(e.target.value)} spellCheck={false} placeholder="cookie_name" />
					</label>
					<label className="ck-field">
						<span>Value</span>
						<input value={craftValue} onChange={(e) => setCraftValue(e.target.value)} spellCheck={false} placeholder="cookie_value" />
					</label>
					<label className="ck-field">
						<span>Encoding</span>
						<select value={craftEncoding} onChange={(e) => setCraftEncoding(e.target.value)}>
							{ENCODING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
						</select>
					</label>
					<label className="ck-field">
						<span>Path</span>
						<input value={craftPath} onChange={(e) => setCraftPath(e.target.value)} />
					</label>
					<label className="ck-field ck-field--inline">
						<input type="checkbox" checked={craftSecure} onChange={(e) => setCraftSecure(e.target.checked)} />
						<span>Secure</span>
					</label>
					<label className="ck-field">
						<span>SameSite</span>
						<select value={craftSameSite} onChange={(e) => setCraftSameSite(e.target.value)}>
							{SAME_SITE_OPTIONS.map((o) => <option key={o} value={o}>{o || "(none)"}</option>)}
						</select>
					</label>
				</div>
				<div className="ck-craft-result">
					<code className="ck-code ck-code--block">{setCookieHeader}</code>
					<div className="ck-craft-result-actions">
						<button type="button" className="toolbar-btn compact" onClick={() => copyToClipboard(setCookieHeader, "Set-Cookie header")} data-tooltip="Copy header">
							<Copy size={14} />
						</button>
						<button type="button" className="toolbar-btn" onClick={saveCraftedToBrowser} data-tooltip="Save to browser">
							<Plus size={14} /> Save
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

const TABS = [
	{ key: "live", label: "Live Cookies" },
	{ key: "encode", label: "Encode / Decode" },
];

const CookieEditor = () => {
	const { showToast } = useToast();
	const [tab, setTab] = useState("live");

	return (
		<div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
			<div className="ck-tab-bar">
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						className={`ck-tab ${tab === t.key ? "ck-tab--active" : ""}`}
						onClick={() => {
							setTab(t.key);
							showToast(`${t.label} tab opened`, 1500);
						}}
					>
						{t.label}
					</button>
				))}
			</div>
			<div className="flex-1 min-h-0 overflow-auto p-3">
				{tab === "live" ? <LiveCookiesTab /> : <EncodeDecodeTab />}
			</div>
		</div>
	);
};

export default CookieEditor;
