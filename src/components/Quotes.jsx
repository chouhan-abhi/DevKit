import { useQuote } from "../hooks/useQuote";

export default function Quotes() {
  const { quote, loading, error } = useQuote();

  if (loading) {
    return (
      <div
        className="fixed bottom-6 right-20 text-right opacity-60 z-30"
        style={{ color: "var(--text-dim)" }}
      >
        <p className="text-sm">Loading today's quote...</p>
      </div>
    );
  }

  if (error || !quote) {
    return null; // Fail silently if quote fails to load
  }

  return (
    <div
      className="fixed bottom-6 right-24 max-w-md text-right z-30"
      style={{ color: "var(--text)" }}
    >
      <blockquote className="text-lg opacity-70 italic leading-relaxed mb-2 color-(--text-color)">
        &ldquo;{quote.q}&rdquo;
      </blockquote>
      <footer className="text-sm opacity-50">
        &mdash; {quote.a}
      </footer>
    </div>
  );
}

