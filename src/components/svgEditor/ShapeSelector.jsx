const ShapeSelector = ({ onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg flex items-center gap-2"
        style={{ background: "var(--sidebar-icon-bg)", color: "var(--sidebar-icon-text)" }}
      >
        Shapes
      </button>
      {open && (
        <div className="absolute top-full mt-2 w-64 bg-[var(--panel-color)] shadow-lg rounded-lg p-2 grid grid-cols-3 gap-2 z-50">
          {SHAPES.map((shape) => {
            const Icon = shape.icon;
            return (
              <button
                key={shape.id}
                title={shape.name}
                onClick={() => { onSelect(shape.snippet); setOpen(false); }}
                className="flex flex-col items-center justify-center p-2 rounded hover:bg-[var(--primary-color)] hover:text-white transition"
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{shape.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShapeSelector;