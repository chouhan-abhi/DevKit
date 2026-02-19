import { lazy } from "react";

export const manifest = {
	id: "json",
	key: "json",
	label: "JSON Explorer",
	description: "Validate, format, and explore JSON with tree view.",
	icon: "Braces",
	route: "/json",
	component: lazy(() => import("./components/JsonEditor")),
	category: "editor",
};
