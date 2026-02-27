function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}

export function hslToRgb(h, s, l) {
	h = ((h % 360) + 360) % 360;
	s = clamp(s, 0, 100) / 100;
	l = clamp(l, 0, 100) / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0, g = 0, b = 0;
	if (h < 60) { r = c; g = x; }
	else if (h < 120) { r = x; g = c; }
	else if (h < 180) { g = c; b = x; }
	else if (h < 240) { g = x; b = c; }
	else if (h < 300) { r = x; b = c; }
	else { r = c; b = x; }

	return [
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255),
	];
}

export function rgbToHsl(r, g, b) {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, Math.round(l * 100)];

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
	else if (max === g) h = ((b - r) / d + 2) * 60;
	else h = ((r - g) / d + 4) * 60;

	return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function hexToRgb(hex) {
	hex = hex.replace(/^#/, "");
	if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
	const n = parseInt(hex, 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r, g, b) {
	return `#${[r, g, b].map((c) => clamp(c, 0, 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function hexToHsl(hex) {
	return rgbToHsl(...hexToRgb(hex));
}

export function hslToHex(h, s, l) {
	return rgbToHex(...hslToRgb(h, s, l));
}

export function isValidHex(hex) {
	return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

export function luminance(hex) {
	const [r, g, b] = hexToRgb(hex).map((c) => {
		c /= 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastTextColor(hex) {
	return luminance(hex) > 0.35 ? "#000000" : "#FFFFFF";
}

export function generateShades(hex, steps) {
	const [h, s] = hexToHsl(hex);
	const lightnesses = {
		3: [85, 50, 20],
		5: [90, 70, 50, 30, 15],
		7: [95, 82, 65, 50, 35, 22, 10],
	};
	const levels = lightnesses[steps] ?? lightnesses[5];
	return levels.map((l) => hslToHex(h, s, l));
}

export function generateComplementary(hex) {
	const [h, s, l] = hexToHsl(hex);
	return hslToHex((h + 180) % 360, s, l);
}

export function generateAccent(hex) {
	const [h, s, l] = hexToHsl(hex);
	return hslToHex((h + 30) % 360, clamp(s + 15, 0, 100), clamp(l - 5, 0, 100));
}

export function deriveSurface(hex) {
	const [h, s] = hexToHsl(hex);
	return hslToHex(h, clamp(s - 30, 0, 100), 96);
}

export function deriveBackground(hex) {
	const [h, s, l] = hexToHsl(hex);
	return l > 50
		? hslToHex(h, clamp(s - 35, 0, 100), 99)
		: hslToHex(h, clamp(s - 35, 0, 100), 8);
}

export function deriveShadow(hex) {
	const [h, s] = hexToHsl(hex);
	return hslToHex(h, clamp(s - 40, 0, 100), 18);
}

export function generateSuggestions(hex, count = 2) {
	const [h, s, l] = hexToHsl(hex);
	const step = 12;
	const darker = [];
	const lighter = [];
	for (let i = 1; i <= count; i++) {
		lighter.push(hslToHex(h, s, clamp(l + step * i, 5, 97)));
		darker.push(hslToHex(h, s, clamp(l - step * i, 5, 97)));
	}
	return { lighter, darker };
}

export function buildPalette(primaryHex, steps, overrides = {}) {
	const roles = {
		primary: primaryHex,
		secondary: overrides.secondary || generateComplementary(primaryHex),
		surface: overrides.surface || deriveSurface(primaryHex),
		background: overrides.background || deriveBackground(primaryHex),
		accent: overrides.accent || generateAccent(primaryHex),
		shadow: overrides.shadow || deriveShadow(primaryHex),
	};

	const palette = {};
	for (const [role, base] of Object.entries(roles)) {
		palette[role] = { base, shades: generateShades(base, steps) };
	}
	return { steps, roles: palette };
}
