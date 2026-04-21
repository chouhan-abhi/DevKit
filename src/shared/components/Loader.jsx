const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 animate-fadeIn">
      <div className="loader-spinner animate-scaleIn" />
      <span
        className="text-sm font-medium animate-pulse"
        style={{ color: "var(--text-muted)" }}
      >
        Loading...
      </span>
    </div>
  );
};

export default Loader;
