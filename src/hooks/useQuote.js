import { useQuery } from "@tanstack/react-query";
import { DEFAULT_QUERY_OPTIONS } from "../utils/Constants";

// Use Vite proxy in development to avoid CORS issues
// For production, use a CORS proxy service
const getQuoteUrl = () => {
  if (import.meta.env.DEV) {
    // Development: Use Vite proxy
    return "/api/quote";
  }
  // Production: Use CORS proxy (you may want to set up your own proxy server)
  return `https://api.allorigins.win/raw?url=${encodeURIComponent("https://zenquotes.io/api/today")}`;
};

const fetchQuote = async () => {
  const url = getQuoteUrl();
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error("Failed to fetch quote");
  }
  
  const data = await response.json();
  
  if (data && data.length > 0) {
    return data[0];
  }
  
  throw new Error("No quote data received");
};

export function useQuote() {
  const { data: quote, isLoading: loading, error } = useQuery({
    queryKey: ["quote", "today"],
    queryFn: fetchQuote,
    ...DEFAULT_QUERY_OPTIONS
  });

  return { quote, loading, error: error?.message || null };
}

