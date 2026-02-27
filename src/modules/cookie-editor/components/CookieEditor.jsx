import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
	Plus, Trash2, Pencil, Copy, Check, Eye, EyeOff, X,
	RefreshCw, Info, Shield,
} from "lucide-react";
import { useToast } from "../../../shared/components/ToastProvider";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";
import {
	parseBrowserCookies, parseCookieString, setCookie, deleteCookie,
	tryDecodeAll, encodeCookieValue, formatSetCookieHeader, hasCookieStoreAPI,
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
	const entries = [
		decoded.urlDecoded && decoded.urlDecoded !== value && { label: "URL Decoded", val: decoded.urlDecoded },
		decoded.base64Decoded && { label: "Base64 Decoded", val: decoded.base64Decoded },
		decoded.jwt && { label: "JWT Payload", val: JSON.stringify(decoded.jwt, null, 2) },
	].filter(Boolean);

	if (entries.length === 0) return <div className="ck-decoded-empty">No alternate decodings found.</div>;

	return (
		<div className="ck-decoded">
			{entries.map(({ label, val }) => (
				<div key={label} className="ck-decoded-row">
					<span className="ck-decoded-label">{label}</span>
					<pre className="ck-decoded-value">{val}</pre>
				</div>
			))}
		</div>
	);
}

function LiveCookiesTab() {
	const { showToast } = useToast();
	const [cookies, setCookies] = useState(() => parseBrowserCookies());
	const [editingName, setEditingName] = useState(null);
	const [addingNew, setAddingNew] = useState(false);
	const [decodingName, setDecodingName] = useState(null);

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
		} catch { /* */ }
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
					<span>Showing {cookies.length} cookie{cookies.length !== 1 ? "s" : ""} for <strong>{window.location.hostname}</strong></span>
					<span className="ck-badge">{hasCookieStoreAPI() ? "Live" : "Polling"}</span>
				</div>
				<div className="ck-live-actions">
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
				<span>HttpOnly cookies are not accessible via JavaScript and won't appear here.</span>
			</div>

			{addingNew && (
				<CookieForm isNew onSave={handleSave} onCancel={() => setAddingNew(false)} />
			)}

			{cookies.length === 0 && !addingNew ? (
				<div className="ck-empty">No cookies found for this domain.</div>
			) : (
				<div className="ck-table-wrap">
					<table className="ck-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Value</th>
								<th style={{ width: 180 }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{cookies.map((c) => (
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
	return (
		<>
			<tr className={isEditing ? "ck-row--editing" : ""}>
				<td className="ck-cell-name">{cookie.name}</td>
				<td className="ck-cell-value">
					<span className="ck-value-text">{cookie.value.length > 60 ? `${cookie.value.slice(0, 60)}…` : cookie.value}</span>
				</td>
				<td className="ck-cell-actions">
					<button type="button" className="toolbar-btn compact" onClick={onEdit} data-tooltip="Edit"><Pencil size={13} /></button>
					<button type="button" className="toolbar-btn compact" onClick={onToggleDecode} data-tooltip="Decode"><Eye size={13} /></button>
					<button type="button" className="toolbar-btn compact" onClick={onCopy} data-tooltip="Copy"><Copy size={13} /></button>
					<button type="button" className="toolbar-btn compact" onClick={onDelete} data-tooltip="Delete"><Trash2 size={13} /></button>
				</td>
			</tr>
			{isDecoding && (
				<tr><td colSpan={3}><DecodedView value={cookie.value} /></td></tr>
			)}
			{isEditing && (
				<tr><td colSpan={3}><CookieForm initial={{ ...EMPTY_FORM, name: cookie.name, value: cookie.value }} onSave={onSave} onCancel={onCancelEdit} /></td></tr>
			)}
		</>
	);
}

function EncodeDecodeTab() {
	const { showToast } = useToast();
	const [input, setInput] = useState("");
	const parsed = useMemo(() => parseCookieString(input), [input]);

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

	const copyHeader = async () => {
		try {
			await navigator.clipboard.writeText(setCookieHeader);
			showToast("Set-Cookie header copied");
		} catch { /* */ }
	};

	return (
		<div className="ck-encode">
			<div className="ck-encode-section">
				<label className="ck-encode-label">Paste Cookie Header String</label>
				<textarea
					className="ck-textarea"
					rows={3}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Cookie: _ga=GA1.2.123; session=eyJhbG...; theme=dark"
					spellCheck={false}
				/>
			</div>

			{parsed.length > 0 && (
				<div className="ck-table-wrap">
					<table className="ck-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Raw Value</th>
								<th>URL Decoded</th>
								<th>Base64 Decoded</th>
							</tr>
						</thead>
						<tbody>
							{parsed.map((c, i) => {
								const decoded = tryDecodeAll(c.value);
								return (
									<tr key={`${c.name}-${i}`}>
										<td className="ck-cell-name">{c.name}</td>
										<td><code className="ck-code">{c.value.length > 40 ? `${c.value.slice(0, 40)}…` : c.value}</code></td>
										<td>{decoded.urlDecoded && decoded.urlDecoded !== c.value ? <code className="ck-code">{decoded.urlDecoded}</code> : <span className="ck-dim">same</span>}</td>
										<td>{decoded.base64Decoded ? <code className="ck-code">{decoded.base64Decoded.slice(0, 60)}</code> : <span className="ck-dim">invalid</span>}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
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
					<button type="button" className="toolbar-btn compact" onClick={copyHeader} data-tooltip="Copy">
						<Copy size={14} />
					</button>
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
	const [tab, setTab] = useState("live");

	return (
		<div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
			<div className="ck-tab-bar">
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						className={`ck-tab ${tab === t.key ? "ck-tab--active" : ""}`}
						onClick={() => setTab(t.key)}
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
