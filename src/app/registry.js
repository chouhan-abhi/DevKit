import { manifest as home } from "../modules/home/manifest";
import { manifest as dashboard } from "../modules/dashboard/manifest";
import { manifest as tasks } from "../modules/tasks/manifest";
import { manifest as jsIde } from "../modules/js-ide/manifest";
import { manifest as diffEditor } from "../modules/diff-editor/manifest";
import { manifest as json } from "../modules/json-editor/manifest";
import { manifest as markdown } from "../modules/markdown/manifest";
import { manifest as mermaid } from "../modules/mermaid/manifest";
import { manifest as svgEditor } from "../modules/svg-editor/manifest";
import { manifest as githubTrending } from "../modules/github-trending/manifest";
import { manifest as settings } from "../modules/settings/manifest";

export const CATEGORY_LABELS = {
	productivity: "Productivity",
	editor: "Editors",
	explore: "Explore",
};

export const tools = [
	home,
	dashboard,
	tasks,
	jsIde,
	diffEditor,
	json,
	markdown,
	mermaid,
	svgEditor,
	githubTrending,
	settings,
];

const toolsByKey = new Map(tools.map((t) => [t.key, t]));
const toolsById = new Map(tools.map((t) => [t.id, t]));

export const getSidebarTools = () =>
	tools.filter((t) => t.key && t.showInSidebar !== false);

export const getToolCards = () =>
	tools.filter((t) => t.key && t.key !== "settings" && t.key !== "dashboard");

export const getToolByKey = (key) => toolsByKey.get(key);

export const getToolById = (id) => toolsById.get(id);
