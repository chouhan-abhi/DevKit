import { lazy } from "react";

export const manifest = {
	id: "journal",
	key: "journal",
	label: "Journal",
	description: "A daily log and ledger app with an editorial feel.",
	icon: "BookOpen",
	route: "/journal",
	component: lazy(() => import("./components/JournalApp")),
	category: "productivity",
};
