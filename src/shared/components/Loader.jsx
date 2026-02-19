const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
      <div className="loader-spinner" />
      <span
        className="text-sm font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        Loading...
      </span>
    </div>
  );
};

export default Loader;
