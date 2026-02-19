export default function AppContainer({ children }) {
  return (
    <div
      className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8"
      style={{ color: "var(--text)" }}
    >
      {children}
    </div>
  );
}
