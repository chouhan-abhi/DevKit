import { useQuote } from "../../shared/hooks/useQuote";

export default function Quotes() {
  const { quote, loading, error } = useQuote();

  if (loading || error || !quote) return null;

  return (
    <div
      className="fixed bottom-5 right-16 md:right-20 max-w-sm text-right z-30 hidden md:block"
      style={{ color: "var(--text-color)" }}
    >
      <blockquote
        className="text-sm italic leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        &ldquo;{quote.q}&rdquo;
      </blockquote>
      <footer
        className="text-xs mt-1.5 font-medium"
        style={{ color: "var(--text-muted)", opacity: 0.7 }}
      >
        &mdash; {quote.a}
      </footer>
    </div>
  );
}
