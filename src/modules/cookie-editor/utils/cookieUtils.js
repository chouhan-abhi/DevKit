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

export function tryDecodeAll(value) {
	const results = { raw: value };

	try { results.urlDecoded = decodeURIComponent(value); }
	catch { results.urlDecoded = null; }

	try { results.base64Decoded = decodeURIComponent(escape(atob(value))); }
	catch { results.base64Decoded = null; }

	try {
		const parts = value.split(".");
		if (parts.length === 3) {
			const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));
			results.jwt = payload;
		}
	} catch { /* not JWT */ }

	return results;
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
