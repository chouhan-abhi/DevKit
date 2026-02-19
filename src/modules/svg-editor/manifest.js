import { lazy } from "react";

export const manifest = {
	id: "svg-editor",
	key: "svg-editor",
	label: "SVG Editor",
	description: "Design and edit SVG graphics with live preview.",
	icon: "Image",
	route: "/svg-editor",
	component: lazy(() => import("./components/SvgEditor")),
	category: "editor",
};
