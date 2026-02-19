import { Routes, Route, Navigate } from "react-router-dom";
import { useToolRegistry } from "./ToolRegistryContext";

export default function AppRoutes() {
	const { tools } = useToolRegistry();

	return (
		<Routes>
			{tools.map((tool) => (
				<Route
					key={tool.route}
					path={tool.route}
					element={<tool.component />}
				/>
			))}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
