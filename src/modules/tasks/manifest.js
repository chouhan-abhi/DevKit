import { lazy } from "react";

export const manifest = {
	id: "tasks",
	key: "tasks",
	label: "Tasks",
	description: "Organize and track your development tasks.",
	icon: "ListChecks",
	route: "/tasks",
	component: lazy(() => import("./components/TodoList")),
	category: "productivity",
};
