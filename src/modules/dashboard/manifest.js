import { lazy } from "react";

export const manifest = {
	id: "dashboard",
	key: "dashboard",
	label: "Dashboard",
	description: "Quick access to all tools.",
	icon: "LayoutDashboard",
	route: "/dashboard",
	component: lazy(() => import("./Dashboard")),
	showInSidebar: false,
};
