import { storage } from "./StorageManager";

const ANALYTICS_ENDPOINT = "https://dracket.art/api/analytics/visit";
const TOKEN_KEY = "analytics:visitorToken";

function generateToken() {
	return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getVisitorToken() {
	let token = storage.get(TOKEN_KEY);
	if (!token) {
		token = generateToken();
		storage.set(TOKEN_KEY, token);
	}
	return token;
}

function getClientDetails() {
	return {
		userAgent: navigator.userAgent,
		language: navigator.language,
		screenWidth: window.screen?.width,
		screenHeight: window.screen?.height,
		viewportWidth: window.innerWidth,
		viewportHeight: window.innerHeight,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		referrer: document.referrer || null,
	};
}

export function trackVisit(path, eventType = "page_view") {
	try {
		const payload = {
			token: getVisitorToken(),
			path,
			eventType,
			client: getClientDetails(),
			timestamp: new Date().toISOString(),
		};

		if (navigator.sendBeacon) {
			navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload));
			return;
		}

		fetch(ANALYTICS_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			keepalive: true,
		}).catch(() => {});
	} catch {
		// Analytics must never break the app
	}
}
