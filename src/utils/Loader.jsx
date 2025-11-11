const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <div className="text-lg font-medium flex items-center gap-1 tracking-wide">
        Loading
        <span className="loader-dots"></span>
      </div>
    </div>
  );
}

export default Loader;