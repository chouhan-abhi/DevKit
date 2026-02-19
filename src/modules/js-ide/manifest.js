import { lazy } from "react";

export const manifest = {
	id: "js-ide",
	key: "js-ide",
	label: "JS Playground",
	description: "Write and run JavaScript instantly in your browser.",
	icon: "Code",
	route: "/js-ide",
	component: lazy(() => import("./components/JSIDEApp")),
	category: "editor",
};
