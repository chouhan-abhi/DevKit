import { lazy } from "react";

export const manifest = {
	id: "diff-editor",
	key: "diff-editor",
	label: "Diff Viewer",
	description: "Compare code versions side by side with inline highlighting.",
	icon: "GitCompare",
	route: "/diff-editor",
	component: lazy(() => import("./components/DiffEditor")),
	category: "editor",
};
