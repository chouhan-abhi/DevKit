import { lazy } from "react";

export const manifest = {
	id: "github-trending",
	key: "github-trending",
	label: "GitHub Trending",
	description: "Discover trending repositories and popular open source projects.",
	icon: "TrendingUp",
	route: "/github-trending",
	component: lazy(() => import("./components/GitHubTrending")),
	category: "explore",
};
