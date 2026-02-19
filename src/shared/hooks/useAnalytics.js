import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackVisit } from "../services/analyticsService";

const DEBOUNCE_MS = 300;

export function useAnalytics() {
	const { pathname } = useLocation();
	const timerRef = useRef(null);

	useEffect(() => {
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => trackVisit(pathname), DEBOUNCE_MS);
		return () => clearTimeout(timerRef.current);
	}, [pathname]);
}
