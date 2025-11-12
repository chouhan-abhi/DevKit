import * as Icons from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { appList } from "../utils/Constants";
import { ArrowLeft } from "lucide-react";
import AppBarIcon from "./AppBarIcon";

function AppHeader() {
	const location = useLocation();
	const navigate = useNavigate();

	const currentPath = location.pathname.replace("/", "");

	const currentApp = appList.find((a) => a.key === currentPath);

	if (!currentApp || location.pathname === "/") return null;

	// Dynamically pick icon from lucide-react based on the string
	const Icon = Icons[currentApp.icon] || null;

	return (
		<header
			className="fixed top-0 left-0 w-full p-3 shadow-sm
                 flex items-center gap-4 z-50 transition-all"
			style={{
				background: "var(--header-bg)",
				color: "var(--text-primary)",
			}}
		>
			<button
				type="button"
				onClick={() => navigate(-1)}
				className="flex items-center gap-2 opacity-80 hover:opacity-100 transition"
			>
				<ArrowLeft size={20} />
				<span className="font-medium">Back</span>
			</button>

			{/* ICON + TITLE */}
			<div className="flex items-center gap-2">
				{Icon && (
					<Icon
						size={22}
						className="opacity-90"
						style={{ color: "var(--primary-color)" }}
					/>
				)}

				<h1
					className="text-xl font-semibold tracking-wide"
					style={{ color: "var(--primary-color)" }}
				>
					{currentApp.label}
				</h1>
			</div>
			<Link key={appList[0].key} to={`/${appList[0].key}`} className="ml-auto">
				<AppBarIcon
					label={appList[0].label}
					description={appList[0].description}
					icon={appList[0].icon}
				/>
			</Link>
		</header>
	);
}

export default AppHeader;
