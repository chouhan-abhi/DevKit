import { lazy } from "react";

export const manifest = {
	id: "settings",
	key: "settings",
	label: "Settings",
	description: "Customize your themes, preferences, and development environment.",
	icon: "Settings",
	route: "/settings",
	component: lazy(() => import("./components/Settings")),
	showInSidebar: true,
};
