import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Play, Trash2, Terminal, Loader2 } from "lucide-react";
import { useKeyboardShortcuts, formatShortcut } from "../../../shared/hooks/useKeyboardShortcuts";

export default function CodeRunner({ code = "" }) {
  const iframeRef = useRef(null);
  const logContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const [logs, setLogs] = useState([]);
  const [execTime, setExecTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = useCallback(() => {
    if (!code.trim()) return;

    setIsRunning(true);

    const escapedCode = code.replace(/<\/script>/g, "<\\/script>");
    const sandboxHtml = `
<!DOCTYPE html>
<html>
  <head>
    <script>
      (function () {
        const logs = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        function stringify(arg) {
          if (arg instanceof Error)
            return arg.name + ": " + arg.message + "\\n" + arg.stack;
          if (typeof arg === "object") {
            try { return JSON.stringify(arg, null, 2); }
            catch { return "[Unserializable object]"; }
          }
          return String(arg);
        }

        function push(type, ...args) {
          logs.push({ type, message: args.map(stringify).join(" ") });
        }

        console.log = (...a) => { push("log", ...a); originalLog(...a); };
        console.error = (...a) => { push("error", ...a); originalError(...a); };
        console.warn = (...a) => { push("warn", ...a); originalWarn(...a); };
        console.info = (...a) => { push("info", ...a); originalInfo(...a); };

        const send = (time) =>
          parent.postMessage({ source: "runner", logs, time }, "*");

        const start = performance.now();

        try {
          new Function(\`${escapedCode}\`)();
          send(performance.now() - start);
        } catch (err) {
          push("error", err.stack || err.message);
          send(performance.now() - start);
        }
      })();
    </script>
  </head>
  <body></body>
</html>`;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = sandboxHtml;
      setLogs([]);
      setExecTime(null);
    }
  }, [code]);

  const clearLogs = () => {
    setLogs([]);
    setExecTime(null);
  };

  const shortcuts = useMemo(() => ({
    run: { mod: true, shift: false, key: "Enter" },
  }), []);

  useKeyboardShortcuts([
    { shortcut: shortcuts.run, action: runCode },
  ]);

  // Auto-run with 2s debounce
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => runCode(), 2000);
    return () => clearTimeout(debounceTimerRef.current);
  }, [code, runCode]);

  useEffect(() => {
    const listener = (e) => {
      if (e.data?.source === "runner") {
        setLogs(e.data.logs);
        setExecTime(e.data.time?.toFixed(2));
        setIsRunning(false);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getColor = (type) => {
    switch (type) {
      case "error": return "var(--accent-red)";
      case "warn": return "var(--accent-yellow)";
      case "info": return "var(--accent-blue)";
      default: return "var(--text-color)";
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: "var(--panel-color)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          <Terminal size={14} style={{ color: "var(--primary-color)" }} />
          Console
        </div>

        <div className="flex items-center gap-2">
          {execTime && (
            <span
              className="text-[11px] font-mono px-2.5 py-1 rounded-full"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-color)",
                border: "1px solid var(--border-color)",
              }}
            >
              {execTime}ms
            </span>
          )}
          <button
            onClick={runCode}
            disabled={isRunning}
            className="toolbar-btn"
            data-tooltip={`Run (${formatShortcut(shortcuts.run)})`}
            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
          >
            {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {isRunning ? "Running" : "Run"}
          </button>
          <button
            onClick={clearLogs}
            className="toolbar-btn"
            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-auto p-4 text-sm"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {logs.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            No output yet. Code runs automatically after 2s.
          </p>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className="mb-1 whitespace-pre-wrap text-xs leading-relaxed"
              style={{ color: getColor(log.type) }}
            >
              {log.message}
            </div>
          ))
        )}
      </div>

      <iframe
        ref={iframeRef}
        title="sandbox"
        sandbox="allow-scripts"
        className="hidden"
      />
    </div>
  );
}
