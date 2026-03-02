export function parseBrowserCookies() {
	const raw = document.cookie;
	if (!raw.trim()) return [];
	return raw.split(";").map((pair) => {
		const eqIdx = pair.indexOf("=");
		if (eqIdx === -1) return { name: pair.trim(), value: "" };
		return {
			name: pair.slice(0, eqIdx).trim(),
			value: pair.slice(eqIdx + 1).trim(),
		};
	}).filter((c) => c.name);
}

export function parseCookieString(str) {
	const cleaned = str.replace(/^Cookie:\s*/i, "").trim();
	if (!cleaned) return [];
	return cleaned.split(";").map((pair) => {
		const eqIdx = pair.indexOf("=");
		if (eqIdx === -1) return { name: pair.trim(), value: "" };
		return {
			name: pair.slice(0, eqIdx).trim(),
			value: pair.slice(eqIdx + 1).trim(),
		};
	}).filter((c) => c.name);
}

export function setCookie({ name, value, path = "/", domain, expires, secure, sameSite, maxAge }) {
	if (!name) return;
	let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
	if (path) str += `; path=${path}`;
	if (domain) str += `; domain=${domain}`;
	if (expires) str += `; expires=${new Date(expires).toUTCString()}`;
	if (maxAge != null && maxAge !== "") str += `; max-age=${maxAge}`;
	if (secure) str += "; secure";
	if (sameSite) str += `; samesite=${sameSite}`;
	document.cookie = str;
}

export function deleteCookie(name, path = "/") {
	document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
}

export function encodeCookieValue(value, encoding) {
	switch (encoding) {
		case "base64":
			return btoa(unescape(encodeURIComponent(value)));
		case "url":
			return encodeURIComponent(value);
		default:
			return value;
	}
}

export function decodeCookieValue(value, encoding) {
	try {
		switch (encoding) {
			case "base64":
				return decodeURIComponent(escape(atob(value)));
			case "url":
				return decodeURIComponent(value);
			default:
				return value;
		}
	} catch {
		return null;
	}
}

function safeBase64Decode(str) {
	const normalized = str.replace(/-/g, "+").replace(/_/g, "/");
	return decodeURIComponent(escape(atob(normalized)));
}

function formatDuration(ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}

export function parseJwtFull(token) {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;
		const header = JSON.parse(safeBase64Decode(parts[0]));
		const payload = JSON.parse(safeBase64Decode(parts[1]));

		let expiryInfo = null;
		if (payload.exp || payload.iat) {
			expiryInfo = {};
			if (payload.exp) {
				const expDate = new Date(payload.exp * 1000);
				const now = new Date();
				expiryInfo.expiresAt = expDate.toISOString();
				expiryInfo.isExpired = expDate < now;
				expiryInfo.timeRemaining = expDate > now ? formatDuration(expDate - now) : null;
			}
			if (payload.iat) {
				expiryInfo.issuedAt = new Date(payload.iat * 1000).toISOString();
			}
		}
		return { header, payload, expiryInfo };
	} catch {
		return null;
	}
}

export function tryParseJson(value) {
	if (!value || typeof value !== "string") return null;
	const t = value.trim();
	if ((!t.startsWith("{") && !t.startsWith("[")) || (!t.endsWith("}") && !t.endsWith("]"))) return null;
	try {
		const parsed = JSON.parse(t);
		return typeof parsed === "object" && parsed !== null ? parsed : null;
	} catch {
		return null;
	}
}

export function tryDecodeAll(value) {
	const results = { raw: value, detectedTypes: [] };

	try {
		const decoded = decodeURIComponent(value);
		results.urlDecoded = decoded;
		if (decoded !== value) results.detectedTypes.push("url");
	} catch {
		results.urlDecoded = null;
	}

	try {
		if (/^[A-Za-z0-9+/=_-]+$/.test(value) && value.length >= 4) {
			results.base64Decoded = safeBase64Decode(value);
			results.detectedTypes.push("base64");
		}
	} catch {
		results.base64Decoded = null;
	}

	const jwtResult = parseJwtFull(value);
	if (jwtResult) {
		results.jwt = jwtResult;
		results.detectedTypes.push("jwt");
	}

	const jsonSource = results.urlDecoded || value;
	const jsonParsed = tryParseJson(jsonSource);
	if (jsonParsed) {
		results.json = jsonParsed;
		results.jsonPretty = JSON.stringify(jsonParsed, null, 2);
		results.detectedTypes.push("json");
	}

	if (results.urlDecoded && results.urlDecoded !== value && !results.base64Decoded) {
		try {
			if (/^[A-Za-z0-9+/=_-]+$/.test(results.urlDecoded) && results.urlDecoded.length >= 4) {
				results.nestedBase64 = safeBase64Decode(results.urlDecoded);
				results.detectedTypes.push("nested");
			}
		} catch { /* not nested base64 */ }
	}

	return results;
}

export function cookieByteSize(name, value) {
	return new Blob([`${name}=${value}`]).size;
}

export function formatByteSize(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	return `${(bytes / 1024).toFixed(1)} KB`;
}

export function totalCookieSize(cookies) {
	return cookies.reduce((sum, c) => sum + cookieByteSize(c.name, c.value), 0);
}

export function exportCookiesJson(cookies) {
	return JSON.stringify(cookies.map((c) => ({ name: c.name, value: c.value })), null, 2);
}

export function importCookiesJson(jsonStr) {
	try {
		const arr = JSON.parse(jsonStr);
		if (!Array.isArray(arr)) return null;
		return arr.filter((c) => c && c.name && typeof c.name === "string");
	} catch {
		return null;
	}
}

export function formatSetCookieHeader({ name, value, path, domain, expires, secure, sameSite, maxAge }) {
	let str = `${name}=${value}`;
	if (path) str += `; Path=${path}`;
	if (domain) str += `; Domain=${domain}`;
	if (expires) str += `; Expires=${new Date(expires).toUTCString()}`;
	if (maxAge != null && maxAge !== "") str += `; Max-Age=${maxAge}`;
	if (secure) str += "; Secure";
	if (sameSite) str += `; SameSite=${sameSite}`;
	return str;
}

export function hasCookieStoreAPI() {
	return typeof window !== "undefined" && "cookieStore" in window;
}

export function getDomainInfo() {
	return {
		hostname: window.location.hostname,
		port: window.location.port,
		protocol: window.location.protocol.replace(":", ""),
		isLocalhost: ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(window.location.hostname),
		origin: window.location.origin,
	};
}
