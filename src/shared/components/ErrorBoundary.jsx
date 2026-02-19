import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl border max-w-md text-center"
            style={{
              background: "var(--panel-color)",
              borderColor: "var(--border-color)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(239, 68, 68, 0.1)" }}
            >
              <AlertTriangle size={28} style={{ color: "var(--accent-red)" }} />
            </div>
            <div>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-color)" }}
              >
                Something went wrong
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                An unexpected error occurred. Try reloading this section.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "var(--primary-color)" }}
            >
              <RotateCcw size={15} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
