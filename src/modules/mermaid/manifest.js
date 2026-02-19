import { lazy } from "react";

export const manifest = {
	id: "mermaid-draw",
	key: "mermaid-draw",
	label: "Diagram Editor",
	description: "Create flowcharts, sequences, and diagrams with Mermaid syntax.",
	icon: "GitBranch",
	route: "/mermaid-draw",
	component: lazy(() => import("./components/MermaidEditor")),
	category: "editor",
};
