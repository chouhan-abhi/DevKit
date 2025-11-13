import React, { useRef, useState, useEffect } from "react";
import { Play, Trash, Terminal, Loader2 } from "lucide-react";

export default function CodeRunner({ code = "" }) {
  const iframeRef = useRef(null);
  const logContainerRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [execTime, setExecTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = () => {
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
          if (arg instanceof Error) return arg.name + ": " + arg.message + "\\n" + arg.stack;
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg, null, 2); }
            catch { return "[Unserializable object]"; }
          }
          return String(arg);
        }

        function push(type, ...args) {
          logs.push({ type, message: args.map(stringify).join(' ') });
        }

        console.log = (...a) => { push('log', ...a); originalLog(...a); };
        console.error = (...a) => { push('error', ...a); originalError(...a); };
        console.warn = (...a) => { push('warn', ...a); originalWarn(...a); };
        console.info = (...a) => { push('info', ...a); originalInfo(...a); };

        window.onerror = (msg, src, line, col, err) => {
          push('error', err?.stack || msg);
          send(performance.now() - start);
        };

        const send = (time) => parent.postMessage({ source: 'runner', logs, time }, '*');
        const start = performance.now();

        try {
          new Function(\`${escapedCode}\`)();
          send(performance.now() - start);
        } catch (err) {
          push('error', err.stack || err.message);
          send(performance.now() - start);
        }
      })();
    </script>
  </head>
  <body></body>
</html>`;

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.srcdoc = sandboxHtml;
      setExecTime(null);
      setLogs([]);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setExecTime(null);
  };

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

  // Auto scroll to latest log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
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
    <div
      className="
        flex flex-col h-full w-full
        bg-[var(--panel-color)]
        border-l-0 md:border-l border-t md:border-t-0 border-[var(--border-color)]
        overflow-hidden rounded-lg shadow-sm
        transition-all
      "
    >
      {/* Header */}
      <div
        className="
          flex items-center justify-between
          mt-2 px-4 py-2 bg-[var(--bg-color)]/80 backdrop-blur-sm
        "
      >
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-color)]">
          <Terminal className="w-4 h-4 text-[var(--primary-color)]" />
          Console
        </div>

        <div className="flex items-center gap-2">
          {execTime && (
            <span
              className="
                text-xs px-2 py-0.5 rounded-md border border-[var(--border-color)]
                bg-[var(--bg-color)] text-[var(--text-color)] opacity-80
                animate-in fade-in duration-200
              "
            >
              {execTime} ms
            </span>
          )}

          <button
            onClick={runCode}
            disabled={isRunning}
            className={`
              flex items-center gap-1 px-4 py-1 text-sm rounded-md border
              border-[var(--border-color)] bg-[var(--bg-color)]
              text-[var(--text-color)] transition-all
              hover:bg-[var(--primary-color)] hover:text-white
              active:scale-[0.97] disabled:opacity-60
            `}
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
            className="
              flex items-center gap-1 px-4 py-1 text-sm rounded-md border
              border-[var(--border-color)] bg-[var(--bg-color)]
              text-[var(--text-color)] hover:bg-[var(--primary-color)]
              hover:text-white active:scale-[0.97] transition-all
            "
          >
            <Trash className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Logs Display */}
      <div
        ref={logContainerRef}
        className="
          flex-1 overflow-auto
          p-4 font-mono text-sm leading-relaxed
          bg-[var(--bg-color)]
          text-[var(--text-color)]
          shadow-inner
          transition-all
        "
      >
        {logs.length === 0 ? (
          <p className="text-[var(--muted-text,#777)] italic opacity-70">
            No output yet…
          </p>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`mb-1 whitespace-pre-wrap break-words ${getColor(log.type)}`}
            >
              {log.message}
            </div>
          ))
        )}
      </div>

      {/* Hidden Sandbox */}
      <iframe ref={iframeRef} title="sandbox" sandbox="allow-scripts" className="hidden" />
    </div>
  );
}
