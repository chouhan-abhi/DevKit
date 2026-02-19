import { useQuote } from "../../shared/hooks/useQuote";

export default function Quotes() {
  const { quote, loading, error } = useQuote();

  if (loading || error || !quote) return null;

  return (
    <div
      className="mt-12 pt-6 border-t text-center"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <blockquote
        className="text-sm italic max-w-md mx-auto"
        style={{ color: "var(--text-muted)" }}
      >
        &ldquo;{quote.q}&rdquo;
      </blockquote>
      <footer
        className="text-xs mt-2 font-medium"
        style={{ color: "var(--text-muted)", opacity: 0.7 }}
      >
        &mdash; {quote.a}
      </footer>
    </div>
  );
}
