import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Trash, Terminal, Loader2 } from "lucide-react";

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

  /**
   * 🔥 AUTO-RUN WITH 2s DEBOUNCE
   */
  useEffect(() => {
    // Clear any pending run
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runCode();
    }, 2000);

    return () => {
      clearTimeout(debounceTimerRef.current);
    };
  }, [code, runCode]);

  /**
   * Listen for sandbox results
   */
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

  /**
   * Auto-scroll logs
   */
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop =
        logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getColor = (type) => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-[var(--text-color)]";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--panel-color)] overflow-hidden rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mt-2 px-4 py-2 bg-[var(--bg-color)]/80">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="w-4 h-4 text-[var(--primary-color)]" />
          Console
        </div>

        <div className="flex items-center gap-2">
          {execTime && (
            <span className="text-xs px-2 py-0.5 rounded-md border">
              {execTime} ms
            </span>
          )}

          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1 px-4 py-1 text-sm rounded-md border"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? "Running…" : "Run"}
          </button>

          <button
            onClick={clearLogs}
            className="flex items-center gap-1 px-4 py-1 text-sm rounded-md border"
          >
            <Trash className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <p className="italic opacity-70">No output yet…</p>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`mb-1 whitespace-pre-wrap ${getColor(log.type)}`}
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
