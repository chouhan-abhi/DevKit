import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
	tools,
	getSidebarTools,
	getToolCards,
	getToolByKey,
	getToolById,
	CATEGORY_LABELS,
} from "./registry";

const ToolRegistryContext = createContext(null);

export function ToolRegistryProvider({ children }) {
	const value = useMemo(
		() => ({
			tools,
			sidebarTools: getSidebarTools(),
			toolCards: getToolCards(),
			getToolByKey,
			getToolById,
			categoryLabels: CATEGORY_LABELS,
		}),
		[],
	);

	return (
		<ToolRegistryContext.Provider value={value}>
			{children}
		</ToolRegistryContext.Provider>
	);
}

export function useToolRegistry() {
	const ctx = useContext(ToolRegistryContext);
	if (!ctx)
		throw new Error(
			"useToolRegistry must be used within ToolRegistryProvider",
		);
	return ctx;
}

export function useCurrentTool() {
	const { pathname } = useLocation();
	const { getToolByKey } = useToolRegistry();
	const key = pathname.replace(/^\//, "");
	return useMemo(() => getToolByKey(key) ?? null, [key, getToolByKey]);
}
