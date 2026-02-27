import { lazy } from "react";

export const manifest = {
	id: "color-palette",
	key: "color-palette",
	label: "Color Palette",
	description: "Create Material Design color palettes with HSL controls and JSON export.",
	icon: "Palette",
	route: "/color-palette",
	component: lazy(() => import("./components/ColorPaletteStudio")),
	category: "editor",
};
