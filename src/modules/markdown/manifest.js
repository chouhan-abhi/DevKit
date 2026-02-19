import { lazy } from "react";

export const manifest = {
	id: "markdown",
	key: "markdown",
	label: "Markdown Editor",
	description: "Write and preview Markdown with live rendering.",
	icon: "FileText",
	route: "/markdown",
	component: lazy(() => import("./components/MarkdownEditor")),
	category: "editor",
};
