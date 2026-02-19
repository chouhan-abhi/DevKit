import { lazy } from "react";

export const manifest = {
	id: "home",
	key: "",
	label: "Devkit Home",
	description: "Central dashboard for all your Devkit tools and utilities.",
	icon: "PocketKnife",
	route: "/",
	component: lazy(() => import("./Home")),
	showInSidebar: false,
};
