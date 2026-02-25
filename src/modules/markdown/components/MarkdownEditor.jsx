import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Eye, Edit, Copy, Check, Sparkles, Download, Upload, Link2, Link, List } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown as markdownLang } from "@codemirror/lang-markdown";
import LZString from "lz-string";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { themeManager } from "../../../shared/services/themeManager";
import SubAppToolbar from "../../../shared/components/SubAppToolbar";
import { useDocuments } from "../../../shared/hooks/useDocuments";
import { useToast } from "../../../shared/components/ToastProvider";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";

function slugify(text) {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.trim();
}

function extractText(children) {
	if (typeof children === "string") return children;
	if (Array.isArray(children)) return children.map(extractText).join("");
	if (children?.props?.children) return extractText(children.props.children);
	return "";
}

function stripInlineMarkdown(text) {
	return text
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/(`{1,3})([^`]+)\1/g, "$2")
		.replace(/~~([^~]+)~~/g, "$1")
		.replace(/(\*{1,2}|_{1,2})([^*_]+)\1/g, "$2")
		.trim();
}

function parseHeadings(markdown) {
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;
	const headings = [];
	let match;
	while ((match = headingRegex.exec(markdown)) !== null) {
		const level = match[1].length;
		const text = stripInlineMarkdown(match[2]);
		if (text) headings.push({ level, text, id: slugify(text) });
	}
	return headings;
}

function useActiveHeading(headingIds, scrollRoot) {
	const [activeId, setActiveId] = useState("");

	useEffect(() => {
		const root = scrollRoot?.current;
		if (!root || headingIds.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible.length > 0) setActiveId(visible[0].target.id);
			},
			{ root, rootMargin: "0px 0px -75% 0px", threshold: 0.1 },
		);

		for (const id of headingIds) {
			const el = root.querySelector(`#${CSS.escape(id)}`);
			if (el) observer.observe(el);
		}

		return () => observer.disconnect();
	}, [headingIds, scrollRoot]);

	return activeId;
}

function TableOfContents({ headings, activeId, onNavigate }) {
	if (headings.length === 0) return null;

	const minLevel = Math.min(...headings.map((h) => h.level));

	return (
		<nav className="md-toc" aria-label="Table of contents">
			<div className="md-toc-header">
				<List size={14} />
				<span>Contents</span>
			</div>
			<ul className="md-toc-list">
				{headings.map((heading, i) => {
					const indent = heading.level - minLevel;
					const isActive = heading.id === activeId;
					return (
						<li key={`${heading.id}-${i}`} style={{ paddingLeft: `${indent * 12}px` }}>
							<a
								href={`#${heading.id}`}
								className={`md-toc-link ${isActive ? "md-toc-link--active" : ""}`}
								onClick={(e) => {
									e.preventDefault();
									onNavigate(heading.id);
								}}
							>
								{heading.text}
							</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

function HeadingWithAnchor({ level, children, ...props }) {
	const Tag = `h${level}`;
	const text = extractText(children);
	const id = slugify(text);

	return (
		<Tag id={id} className="group" {...props}>
			<a
				href={`#${id}`}
				className="md-heading-anchor"
				aria-hidden="true"
				tabIndex={-1}
			>
				<Link size={level <= 2 ? 16 : 14} />
			</a>
			{children}
		</Tag>
	);
}

function CodeBlock({ children }) {
	const preRef = useRef(null);
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const text = preRef.current?.textContent ?? "";
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			return;
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div className="md-codeblock-wrapper group">
			<button
				type="button"
				onClick={handleCopy}
				className="md-codeblock-copy"
				aria-label="Copy code"
			>
				{copied ? <Check size={13} /> : <Copy size={13} />}
				<span>{copied ? "Copied" : "Copy"}</span>
			</button>
			<pre ref={preRef}>{children}</pre>
		</div>
	);
}

const MermaidPreview = ({ code, theme, onError, onSuccess }) => {
	const containerRef = useRef(null);

	useEffect(() => {
		if (!containerRef.current || !code?.trim()) return;

		const render = async () => {
			try {
				const mermaid = (await import("mermaid")).default;
				mermaid.initialize({
					startOnLoad: false,
					theme: theme === "dark" ? "dark" : "default",
					securityLevel: "loose",
				});
				if (mermaid.parse) await mermaid.parse(code);
				const id = `markdown-mermaid-${Date.now()}`;
				const { svg } = await mermaid.render(id, code);
				if (containerRef.current) containerRef.current.innerHTML = svg;
				onSuccess?.();
			} catch (err) {
				if (containerRef.current) containerRef.current.innerHTML = "";
				onError?.(err);
			}
		};

		render();
	}, [code, theme]);

	return <div ref={containerRef} className="my-4 flex justify-center" />;
};

const MarkdownEditor = () => {
	const initialMarkdown =
		"# Welcome to Markdown Editor\n\nStart writing your markdown here...";

	const {
		documents, currentId, title, content, setContent,
		setCurrentDocId, createDoc, saveAs, renameDoc, deleteDoc, isSaving,
	} = useDocuments({
		appId: "markdown",
		defaultTitle: "Untitled Markdown",
		initialContent: { markdown: initialMarkdown },
		meta: { language: "markdown" },
	});

	const [previewMode, setPreviewMode] = useState(false);
	const [tocOpen, setTocOpen] = useState(true);
	const [copied, setCopied] = useState(false);
	const [shared, setShared] = useState(false);
	const { showToast } = useToast();
	const markdownText = content?.markdown ?? "";
	const sharedHandledRef = useRef(false);
	const previewScrollRef = useRef(null);

	const resolveTheme = (theme) => {
		const resolved = theme === "system"
			? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
			: theme;
		return resolved === "dark" ? "dark" : "light";
	};

	const [editorTheme, setEditorTheme] = useState(() =>
		resolveTheme(themeManager.getTheme())
	);

	useEffect(() => {
		const handler = (e) => setEditorTheme(e.detail === "dark" ? "dark" : "light");
		window.addEventListener("theme-changed", handler);
		return () => window.removeEventListener("theme-changed", handler);
	}, []);

	useEffect(() => {
		if (sharedHandledRef.current) return;
		const params = new URLSearchParams(window.location.search);
		const sharedDoc = params.get("md");
		if (sharedDoc) {
			const decoded = LZString.decompressFromEncodedURIComponent(sharedDoc);
			if (!decoded) return;
			let payload;
			try {
				payload = JSON.parse(decoded);
			} catch {
				payload = { markdown: decoded };
			}

			const nextMarkdown = payload?.markdown ?? payload?.content?.markdown ?? decoded;
			const nextTitle = payload?.title || "Shared Markdown";

			createDoc(nextTitle, { markdown: nextMarkdown });
			setPreviewMode(true);
			sharedHandledRef.current = true;

			const url = new URL(window.location.href);
			url.searchParams.delete("md");
			window.history.replaceState({}, "", url.toString());
		}
	}, [createDoc]);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(markdownText);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const handleExport = () => {
		const blob = new Blob([markdownText], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${title || "document"}.md`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleShareUrl = async () => {
		const payload = { v: 1, title: title || "Shared Markdown", markdown: markdownText };
		const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
		const url = `${window.location.origin}${window.location.pathname}?md=${compressed}`;
		await navigator.clipboard.writeText(url);
		setShared(true);
		setTimeout(() => setShared(false), 1500);
		showToast("Share URL copied to clipboard");
	};

	const handleImport = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target.result || "";
			setContent((prev) => ({ ...(prev || {}), markdown: String(text) }));
		};
		reader.readAsText(file);
		event.target.value = null;
	};

	const formatMarkdown = () => {
		const lines = markdownText.split("\n");
		const cleaned = [];
		for (let i = 0; i < lines.length; i++) {
			const prev = cleaned[cleaned.length - 1];
			if (lines[i].trim() === "" && prev === "") continue;
			cleaned.push(lines[i]);
		}
		setContent((prev) => ({ ...(prev || {}), markdown: cleaned.join("\n") }));
	};

	const extensions = useMemo(() => [markdownLang()], []);

	const shortcuts = useMemo(() => ({
		preview:  { mod: true, shift: true, key: "p" },
		format:   { mod: true, shift: true, key: "f" },
		exportMd: { mod: true, shift: true, key: "e" },
	}), []);

	useKeyboardShortcuts([
		{ shortcut: shortcuts.preview,  action: () => setPreviewMode((v) => !v) },
		{ shortcut: shortcuts.format,   action: formatMarkdown },
		{ shortcut: shortcuts.exportMd, action: handleExport },
	]);

	const markdownComponents = useMemo(() => ({
		pre({ children, node }) {
			const codeEl = node?.children?.[0];
			const lang = /language-(\w+)/.exec(codeEl?.properties?.className?.[0] || "")?.[1];
			if (lang === "mermaid") return <>{children}</>;
			return <CodeBlock>{children}</CodeBlock>;
		},
		code({ className, children, node, ...props }) {
			const lang = /language-(\w+)/.exec(className || "")?.[1];
			if (lang === "mermaid") {
				return (
					<MermaidPreview
						code={String(children)}
						theme={editorTheme}
						onError={() => showToast("Mermaid diagram has a syntax error")}
						onSuccess={() => {}}
					/>
				);
			}
			return <code className={className} {...props}>{children}</code>;
		},
		a({ href, children, ...props }) {
			const isExternal = href?.startsWith("http");
			return (
				<a
					href={href}
					{...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
					{...props}
				>
					{children}
				</a>
			);
		},
		h1: (props) => <HeadingWithAnchor level={1} {...props} />,
		h2: (props) => <HeadingWithAnchor level={2} {...props} />,
		h3: (props) => <HeadingWithAnchor level={3} {...props} />,
		h4: (props) => <HeadingWithAnchor level={4} {...props} />,
		h5: (props) => <HeadingWithAnchor level={5} {...props} />,
		h6: (props) => <HeadingWithAnchor level={6} {...props} />,
	}), [editorTheme, showToast]);

	const remarkPlugins = useMemo(() => [remarkGfm], []);
	const rehypePlugins = useMemo(() => [rehypeRaw], []);

	const headings = useMemo(() => parseHeadings(markdownText), [markdownText]);
	const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);
	const activeHeadingId = useActiveHeading(headingIds, previewScrollRef);
	const showToc = previewMode && tocOpen && headings.length > 0;

	const scrollToHeading = useCallback((id) => {
		const root = previewScrollRef.current;
		if (!root) return;
		const el = root.querySelector(`#${CSS.escape(id)}`);
		if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);

	return (
		<div className="h-full w-full flex flex-col min-h-0" style={{ background: "var(--bg-color)" }}>
			<div className="p-3 pb-0">
				<SubAppToolbar
					documents={documents}
					currentId={currentId}
					currentTitle={title}
					onSelect={setCurrentDocId}
					onRename={renameDoc}
					onNew={() => createDoc("Untitled Markdown", { markdown: initialMarkdown })}
					onSaveAs={(name) => saveAs(name)}
					onDelete={() => deleteDoc()}
					status={isSaving ? "saving" : "saved"}
					rightActions={
						<>
							<button onClick={formatMarkdown} className="toolbar-btn compact" type="button" data-tooltip={`Format (${formatShortcut(shortcuts.format)})`} aria-label="Format">
								<Sparkles size={14} />
							</button>
							<button onClick={handleCopy} className="toolbar-btn compact" type="button" data-tooltip={copied ? "Copied!" : "Copy"} aria-label="Copy">
								{copied ? <Check size={14} /> : <Copy size={14} />}
							</button>
							<button onClick={handleExport} className="toolbar-btn compact" type="button" data-tooltip={`Export .md (${formatShortcut(shortcuts.exportMd)})`} aria-label="Export">
								<Download size={14} />
							</button>
							<button onClick={handleShareUrl} className="toolbar-btn compact" type="button" data-tooltip={shared ? "Link copied!" : "Share URL"} aria-label="Share">
								{shared ? <Check size={14} /> : <Link2 size={14} />}
							</button>
							<label className="toolbar-btn compact cursor-pointer" data-tooltip="Import file" aria-label="Import">
								<Upload size={14} />
								<input
									type="file"
									accept=".md,.markdown,text/markdown,text/plain"
									onChange={handleImport}
									className="hidden"
								/>
							</label>
							<div className="toolbar-divider" />
							{previewMode && headings.length > 0 && (
								<button
									onClick={() => setTocOpen((v) => !v)}
									className={`toolbar-btn compact ${tocOpen ? "toolbar-btn--toggled" : ""}`}
									type="button"
									data-tooltip={tocOpen ? "Hide contents" : "Show contents"}
									aria-label="Toggle table of contents"
								>
									<List size={14} />
								</button>
							)}
							<button onClick={() => setPreviewMode(!previewMode)} className="toolbar-btn" type="button" data-tooltip={`${previewMode ? "Back to editor" : "Full preview"} (${formatShortcut(shortcuts.preview)})`}>
								{previewMode ? <Edit size={14} /> : <Eye size={14} />}
								{previewMode ? "Edit" : "Preview"}
							</button>
						</>
					}
				/>
			</div>

			<div className="flex flex-1 min-h-0 overflow-hidden border rounded-xl m-3" style={{ borderColor: "var(--border-color)" }}>
				{!previewMode && (
					<div className="flex-1 min-h-0 overflow-auto border-r" style={{ borderColor: "var(--border-color)" }}>
						<CodeMirror
							value={markdownText}
							height="100%"
							theme={editorTheme}
							extensions={extensions}
							onChange={(value) =>
								setContent((prev) => ({ ...(prev || {}), markdown: value ?? "" }))
							}
							basicSetup={{
								lineNumbers: true,
								foldGutter: true,
								highlightActiveLineGutter: true,
								highlightActiveLine: true,
								bracketMatching: true,
								closeBrackets: true,
								autocompletion: true,
								indentOnInput: true,
							}}
							className="h-full"
						/>
					</div>
				)}

				<div
					ref={previewScrollRef}
					className={`overflow-auto ${previewMode ? "w-full" : "w-1/2"}`}
					style={{ background: "var(--panel-color)" }}
				>
					<div className={previewMode ? "md-preview-layout" : ""}>
						{showToc && (
							<TableOfContents
								headings={headings}
								activeId={activeHeadingId}
								onNavigate={scrollToHeading}
							/>
						)}
						<div className={`markdown-preview ${previewMode ? "md-preview-full" : ""}`}>
							<ReactMarkdown
								remarkPlugins={remarkPlugins}
								rehypePlugins={rehypePlugins}
								components={markdownComponents}
							>
								{markdownText}
							</ReactMarkdown>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MarkdownEditor;
