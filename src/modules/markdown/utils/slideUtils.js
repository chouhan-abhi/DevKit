const HEADING_RE = /^#{1,6}\s+(.+)$/m;
const TOP_HEADING_RE = /^#{1,2}\s+/;

function stripInlineMarkdown(text) {
	return text
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/(`{1,3})([^`]+)\1/g, "$2")
		.replace(/~~([^~]+)~~/g, "$1")
		.replace(/(\*{1,2}|_{1,2})([^*_]+)\1/g, "$2")
		.trim();
}

export function extractSlideTitle(slideMarkdown) {
	const match = HEADING_RE.exec(slideMarkdown);
	return match ? stripInlineMarkdown(match[1]) : null;
}

function buildSlide(content, index) {
	const trimmed = content.trim();
	if (!trimmed) return null;
	return { content: trimmed, title: extractSlideTitle(trimmed), index };
}

function splitByHorizontalRule(markdown) {
	const parts = markdown.split(/^---\s*$/m);
	return parts.reduce((acc, part, i) => {
		const slide = buildSlide(part, acc.length);
		if (slide) acc.push(slide);
		return acc;
	}, []);
}

function splitByHeadings(markdown) {
	const lines = markdown.split("\n");
	const chunks = [];
	let current = [];

	for (const line of lines) {
		if (TOP_HEADING_RE.test(line) && current.length > 0) {
			chunks.push(current.join("\n"));
			current = [line];
		} else {
			current.push(line);
		}
	}
	if (current.length > 0) chunks.push(current.join("\n"));

	return chunks.reduce((acc, chunk) => {
		const slide = buildSlide(chunk, acc.length);
		if (slide) acc.push(slide);
		return acc;
	}, []);
}

export function parseSlides(markdown) {
	if (!markdown?.trim()) return [{ content: "", title: null, index: 0 }];

	const hasHorizontalRules = /^---\s*$/m.test(markdown);
	const slides = hasHorizontalRules
		? splitByHorizontalRule(markdown)
		: splitByHeadings(markdown);

	if (slides.length === 0) {
		return [{ content: markdown.trim(), title: extractSlideTitle(markdown), index: 0 }];
	}
	return slides;
}
