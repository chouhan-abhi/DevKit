import { useState, useEffect, useCallback, useRef } from "react";
import {
	ChevronLeft, ChevronRight, Maximize, Minimize, X, List,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

function SlideNavigator({ slides, currentSlide, onSelect }) {
	const activeRef = useRef(null);

	useEffect(() => {
		activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}, [currentSlide]);

	return (
		<nav className="md-slide-nav" aria-label="Slide navigator">
			<div className="md-toc-header">
				<List size={14} />
				<span>Slides</span>
			</div>
			<div className="md-slide-nav-list">
				{slides.map((slide, i) => (
					<button
						key={i}
						ref={i === currentSlide ? activeRef : null}
						type="button"
						className={`md-slide-nav-item ${i === currentSlide ? "md-slide-nav-item--active" : ""}`}
						onClick={() => onSelect(i)}
					>
						<span className="md-slide-nav-num">{i + 1}</span>
						<span className="md-slide-nav-title">
							{slide.title || `Slide ${i + 1}`}
						</span>
					</button>
				))}
			</div>
		</nav>
	);
}

export default function SlidePresenter({
	slides,
	markdownComponents,
	remarkPlugins,
	rehypePlugins,
	onExit,
}) {
	const [currentSlide, setCurrentSlide] = useState(0);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const containerRef = useRef(null);

	const total = slides.length;
	const slide = slides[currentSlide];

	const goTo = useCallback(
		(index) => setCurrentSlide(Math.max(0, Math.min(index, total - 1))),
		[total],
	);

	const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);
	const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);

	useEffect(() => {
		const handler = (e) => {
			const tag = e.target.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

			switch (e.key) {
				case "ArrowLeft":
				case "PageUp":
					e.preventDefault();
					prev();
					break;
				case "ArrowRight":
				case "PageDown":
				case " ":
					e.preventDefault();
					next();
					break;
				case "Home":
					e.preventDefault();
					goTo(0);
					break;
				case "End":
					e.preventDefault();
					goTo(total - 1);
					break;
				case "Escape":
					if (document.fullscreenElement) {
						document.exitFullscreen?.();
					} else {
						onExit();
					}
					break;
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [prev, next, goTo, total, onExit]);

	const toggleFullscreen = useCallback(async () => {
		if (!containerRef.current) return;
		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
			} else {
				await containerRef.current.requestFullscreen();
			}
		} catch { /* fullscreen not supported */ }
	}, []);

	useEffect(() => {
		const handler = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", handler);
		return () => document.removeEventListener("fullscreenchange", handler);
	}, []);

	const progress = total > 1 ? (currentSlide / (total - 1)) * 100 : 100;

	return (
		<div ref={containerRef} className="md-slide-container">
			<SlideNavigator
				slides={slides}
				currentSlide={currentSlide}
				onSelect={goTo}
			/>

			<div className="md-slide-main">
				<div className="md-slide-viewport">
					<div className="md-slide-card" key={currentSlide}>
						<div className="markdown-preview md-slide-content">
							{slide && (
								<ReactMarkdown
									remarkPlugins={remarkPlugins}
									rehypePlugins={rehypePlugins}
									components={markdownComponents}
								>
									{slide.content}
								</ReactMarkdown>
							)}
						</div>
					</div>
				</div>

				<div className="md-slide-controls">
					<div
						className="md-slide-progress"
						style={{ width: `${progress}%` }}
					/>

					<div className="md-slide-controls-left">
						<button
							type="button"
							className="toolbar-btn compact"
							onClick={onExit}
							data-tooltip="Exit presentation (Esc)"
						>
							<X size={14} />
						</button>
					</div>

					<div className="md-slide-controls-center">
						<button
							type="button"
							className="toolbar-btn compact"
							onClick={prev}
							disabled={currentSlide === 0}
							data-tooltip="Previous slide (\u2190)"
						>
							<ChevronLeft size={16} />
						</button>
						<span className="md-slide-counter">
							{currentSlide + 1} / {total}
						</span>
						<button
							type="button"
							className="toolbar-btn compact"
							onClick={next}
							disabled={currentSlide === total - 1}
							data-tooltip="Next slide (\u2192)"
						>
							<ChevronRight size={16} />
						</button>
					</div>

					<div className="md-slide-controls-right">
						<button
							type="button"
							className="toolbar-btn compact"
							onClick={toggleFullscreen}
							data-tooltip={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
						>
							{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
