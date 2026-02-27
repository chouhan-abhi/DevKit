import { lazy } from "react";

export const manifest = {
	id: "cookies",
	key: "cookies",
	label: "Cookie Editor",
	description: "Live browser cookie manager with encode/decode tools.",
	icon: "Cookie",
	route: "/cookies",
	component: lazy(() => import("./components/CookieEditor")),
	category: "productivity",
};
